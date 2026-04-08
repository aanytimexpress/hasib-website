import { FormEvent, useEffect, useState } from "react";
import { AdminCard } from "../../components/admin/AdminCard";
import { ModuleHeader } from "../../components/admin/ModuleHeader";
import { Role, UserProfile } from "../../types/models";
import { supabase } from "../../lib/supabase";

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [message, setMessage] = useState("");
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "editor"
  });

  const load = async () => {
    const [{ data: roleData }, { data: userData }] = await Promise.all([
      supabase.from("roles").select("*").order("label"),
      supabase.from("users").select("*, role:roles(*)").order("created_at", { ascending: false })
    ]);
    setRoles((roleData as Role[]) ?? []);
    setUsers((userData as UserProfile[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const updateRole = async (userId: string, roleId: string) => {
    await supabase.from("users").update({ role_id: roleId }).eq("id", userId);
    await load();
  };

  const saveProfile = async (user: UserProfile) => {
    await supabase
      .from("users")
      .update({
        full_name: user.full_name,
        location: user.location,
        language: user.language
      })
      .eq("id", user.id);
    await load();
  };

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
        role: newUser.role
      }
    });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(data?.message || "User created.");
    setNewUser({ email: "", password: "", full_name: "", role: "editor" });
    await load();
  };

  return (
    <div className="space-y-5">
      <ModuleHeader title="Users & Roles" description="Super admin can create users and assign roles." />

      <AdminCard className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">Create Admin User</h3>
        <form className="grid gap-3 md:grid-cols-4" onSubmit={(event) => void createUser(event)}>
          <input
            required
            type="email"
            value={newUser.email}
            onChange={(event) => setNewUser((prev) => ({ ...prev, email: event.target.value }))}
            className="rounded-lg border border-slate-300 p-2"
            placeholder="Email"
          />
          <input
            required
            type="password"
            value={newUser.password}
            onChange={(event) => setNewUser((prev) => ({ ...prev, password: event.target.value }))}
            className="rounded-lg border border-slate-300 p-2"
            placeholder="Password"
          />
          <input
            required
            value={newUser.full_name}
            onChange={(event) => setNewUser((prev) => ({ ...prev, full_name: event.target.value }))}
            className="rounded-lg border border-slate-300 p-2"
            placeholder="Full name"
          />
          <select
            value={newUser.role}
            onChange={(event) => setNewUser((prev) => ({ ...prev, role: event.target.value }))}
            className="rounded-lg border border-slate-300 p-2"
          >
            <option value="super_admin">Super Admin</option>
            <option value="editor">Editor</option>
            <option value="moderator">Moderator</option>
          </select>
          <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white md:col-span-4">
            Create User (Admin-only)
          </button>
        </form>
      </AdminCard>

      <AdminCard>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">User List</h3>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[2fr_2fr_2fr_1fr_auto]">
              <div className="space-y-1">
                <input
                  value={user.full_name}
                  onChange={(event) =>
                    setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, full_name: event.target.value } : item)))
                  }
                  className="w-full rounded border border-slate-300 p-1.5 text-sm font-semibold"
                />
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <input
                value={user.location || ""}
                onChange={(event) =>
                  setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, location: event.target.value } : item)))
                }
                className="rounded border border-slate-300 p-1.5 text-sm"
                placeholder="Location"
              />
              <input
                value={(user.language ?? []).join(", ")}
                onChange={(event) =>
                  setUsers((prev) =>
                    prev.map((item) =>
                      item.id === user.id
                        ? {
                            ...item,
                            language: event.target.value
                              .split(",")
                              .map((value) => value.trim())
                              .filter(Boolean)
                          }
                        : item
                    )
                  )
                }
                className="rounded border border-slate-300 p-1.5 text-sm"
                placeholder="Languages"
              />
              <select
                value={user.role_id}
                onChange={(event) => void updateRole(user.id, event.target.value)}
                className="rounded border border-slate-300 p-2 text-sm"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void saveProfile(user)}
                className="rounded bg-slate-100 px-3 py-1 text-xs"
              >
                Save
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      <section className="rounded-lg bg-white p-3 text-sm text-slate-700">
        <p>Role rules:</p>
        <p>Super Admin: Full access</p>
        <p>Editor: Posts and media focused access</p>
        <p>Moderator: Comments only access</p>
      </section>

      {message ? <p className="rounded-lg bg-white p-3 text-sm text-slate-700">{message}</p> : null}
    </div>
  );
}
