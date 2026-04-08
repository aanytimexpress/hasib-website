begin;

insert into public.roles (name, label)
values ('user', 'User')
on conflict (name) do update set label = excluded.label;

alter table public.roles drop constraint if exists roles_name_check;
alter table public.roles
add constraint roles_name_check
check (name in ('super_admin', 'editor', 'moderator', 'user'));

create or replace function public.is_admin_allowlist_email(target_email text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select lower(coalesce(target_email, '')) = any(
    array[
      'aanytime.xpress@gmail.com',
      'alshakib730@gmail.com'
    ]::text[]
  );
$$;

create or replace function public.enforce_admin_email_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role_name text;
begin
  select name into selected_role_name
  from public.roles
  where id = new.role_id
  limit 1;

  if selected_role_name in ('super_admin', 'editor', 'moderator')
    and not public.is_admin_allowlist_email(new.email) then
    raise exception 'Only allowlisted emails can have admin roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_users_enforce_admin_allowlist on public.users;
create trigger trg_users_enforce_admin_allowlist
before insert or update of email, role_id on public.users
for each row execute function public.enforce_admin_email_allowlist();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role_id uuid;
  selected_role_name text := 'user';
begin
  if public.is_admin_allowlist_email(new.email) then
    selected_role_name := 'super_admin';
  end if;

  select id into selected_role_id from public.roles where name = selected_role_name limit 1;

  if selected_role_id is null then
    select id into selected_role_id from public.roles where name = 'user' limit 1;
  end if;

  insert into public.users (auth_user_id, email, full_name, role_id, location)
  values (
    new.id,
    coalesce(new.email, concat(new.id, '@example.com')),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    selected_role_id,
    'Bogura, Bangladesh'
  )
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

with super_admin_role as (
  select id from public.roles where name = 'super_admin' limit 1
)
update public.users u
set role_id = sar.id
from super_admin_role sar
where public.is_admin_allowlist_email(u.email);

with user_role as (
  select id from public.roles where name = 'user' limit 1
)
update public.users u
set role_id = ur.id
from user_role ur
where not public.is_admin_allowlist_email(u.email)
  and u.role_id in (
    select id
    from public.roles
    where name in ('super_admin', 'editor', 'moderator')
  );

commit;
