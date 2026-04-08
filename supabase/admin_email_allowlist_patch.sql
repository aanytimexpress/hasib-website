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

create or replace function public.ensure_current_user_profile()
returns table(profile_id uuid, role_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_id uuid := auth.uid();
  auth_email text;
  auth_full_name text;
  selected_role_name text := 'user';
  selected_role_id uuid;
begin
  if current_auth_id is null then
    raise exception 'Not authenticated';
  end if;

  select
    lower(coalesce(au.email, concat(au.id, '@example.com'))),
    coalesce(au.raw_user_meta_data ->> 'full_name', split_part(coalesce(au.email, 'user'), '@', 1))
  into auth_email, auth_full_name
  from auth.users au
  where au.id = current_auth_id
  limit 1;

  if auth_email is null then
    raise exception 'Authenticated user record not found';
  end if;

  if public.is_admin_allowlist_email(auth_email) then
    selected_role_name := 'super_admin';
  end if;

  select id into selected_role_id
  from public.roles
  where name = selected_role_name
  limit 1;

  if selected_role_id is null then
    raise exception 'Role % not found', selected_role_name;
  end if;

  insert into public.users (auth_user_id, email, full_name, role_id, location)
  values (
    current_auth_id,
    auth_email,
    auth_full_name,
    selected_role_id,
    'Bogura, Bangladesh'
  )
  on conflict (auth_user_id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role_id = case
      when public.is_admin_allowlist_email(excluded.email) then
        (select id from public.roles where name = 'super_admin' limit 1)
      when (
        select r.name
        from public.roles r
        where r.id = public.users.role_id
      ) in ('super_admin', 'editor', 'moderator') then
        (select id from public.roles where name = 'user' limit 1)
      else public.users.role_id
    end,
    updated_at = now();

  return query
  select u.id, r.name
  from public.users u
  join public.roles r on r.id = u.role_id
  where u.auth_user_id = current_auth_id
  limit 1;
end;
$$;

grant execute on function public.ensure_current_user_profile() to authenticated;

insert into public.users (auth_user_id, email, full_name, role_id, location)
select
  au.id,
  lower(coalesce(au.email, concat(au.id, '@example.com'))),
  coalesce(au.raw_user_meta_data ->> 'full_name', split_part(coalesce(au.email, 'user'), '@', 1)),
  case
    when public.is_admin_allowlist_email(au.email) then sar.id
    else ur.id
  end,
  'Bogura, Bangladesh'
from auth.users au
cross join lateral (
  select id
  from public.roles
  where name = 'super_admin'
  limit 1
) sar
cross join lateral (
  select id
  from public.roles
  where name = 'user'
  limit 1
) ur
left join public.users u on u.auth_user_id = au.id
where u.auth_user_id is null;

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
