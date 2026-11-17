"use client";
import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/auth-provider";
import { trackerApi } from "@/api/composition";
import type { Role, RoleInput } from "@/api/tracker";
import { apiErrorMessage } from "@/api/client";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";

const permissions = [
  "receipts:scan",
  "expenses:create",
  "expenses:view",
  "expenses:view_own",
  "expenses:delete",
  "expenses:approve",
  "reports:view",
  "budgets:manage",
  "roles:view",
  "roles:manage",
  "roles:assign",
  "users:view",
  "users:manage",
  "user:create", "categories:view", "categories:create", "categories:update", "categories:delete",
];
const panel =
  "flex min-w-0 flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-6";

export function AccessScreen() {
  const auth = useAuth();
  if (!auth.can("roles:view") && !auth.can("roles:manage"))
    return (
      <main className="p-8 text-body-regular text-text-secondary">
        Your role does not allow access to administration.
      </main>
    );
  return <AccessContent />;
}

function AccessContent() {
  const auth = useAuth();
  const cache = useQueryClient();
  const roles = useQuery({
    queryKey: ["roles", auth.user?.id],
    queryFn: trackerApi.roles,
    enabled: auth.can("roles:view"),
  });
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState(""),
    [grants, setGrants] = useState(""),
    [denies, setDenies] = useState("");
  const [busy, setBusy] = useState(false),
    [archiveId, setArchiveId] = useState<string | null>(null);
  async function run(action: () => Promise<unknown>, message: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      toast.success(message);
      await cache.invalidateQueries({ queryKey: ["roles"] });
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update access."));
    } finally {
      setBusy(false);
    }
  }
  function edit(role: Role | null) {
    setEditing(role);
    setName(role?.name ?? "");
    setGrants(role?.permissions.join(", ") ?? "");
    setDenies(role?.deniedPermissions.join(", ") ?? "");
  }
  function parse(value: string) {
    return [
      ...new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];
  }
  function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input: RoleInput = {
      name: name.trim(),
      permissions: parse(grants),
      deniedPermissions: parse(denies),
    };
    if (
      input.permissions.some(
        (permission) => !permissions.includes(permission),
      ) ||
      input.deniedPermissions.some(
        (permission) => !input.permissions.includes(permission),
      )
    ) {
      toast.error(
        "Use supported permissions; each denied permission must also appear in granted permissions.",
      );
      return;
    }
    void run(
      async () => {
        if (editing) await trackerApi.updateRole(editing.id, input);
        else await trackerApi.createRole(input);
        edit(null);
      },
      editing ? "Role updated." : "Role created.",
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-2">

        <h1 className="text-title-1-semibold text-text-primary">
          Access & roles
        </h1>

      </header>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {auth.can("roles:view") && (
          <section className={panel}>
            <h2 className="text-headline-medium text-text-primary">
              Application roles
            </h2>
            {roles.isPending && (
              <p
                role="status"
                className="text-body-regular text-text-secondary"
              >
                Loading roles…
              </p>
            )}
            {roles.isError && (
              <>
                <p
                  role="alert"
                  className="text-body-regular text-text-error-primary"
                >
                  {apiErrorMessage(roles.error, "Could not load roles.")}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => void roles.refetch()}
                >
                  Retry
                </Button>
              </>
            )}
            {roles.data?.map((role) => (
              <article
                key={role.id}
                className="flex flex-col gap-3 border-t border-separator-border pt-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-body-medium text-text-primary">
                    {role.name}
                  </h3>
                  <span className="rounded-full bg-background-tertiary-default px-3 py-1 text-caption-1-regular text-text-secondary">
                    {role.type === "system" ? "System role" : "Custom role"}
                  </span>
                </div>
                <p className="break-words text-body-2-regular text-text-secondary">
                  {role.permissions
                    .filter(
                      (permission) =>
                        !role.deniedPermissions.includes(permission),
                    )
                    .join(", ") || "No effective permissions"}
                </p>
                {role.deniedPermissions.length > 0 && (
                  <p className="break-words text-caption-1-regular text-text-tertiary">
                    Denied: {role.deniedPermissions.join(", ")}
                  </p>
                )}
                {auth.can("roles:manage") && role.type === "custom" && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => edit(role)}
                    >
                      Edit
                    </Button>
                    {archiveId === role.id ? (
                      <>
                        <Button
                          variant="danger"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await trackerApi.archiveRole(role.id);
                              setArchiveId(null);
                              if (editing?.id === role.id) edit(null);
                            }, "Role archived.")
                          }
                        >
                          Confirm archive
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setArchiveId(null)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setArchiveId(role.id)}
                      >
                        Archive
                      </Button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </section>
        )}
        {auth.can("roles:manage") && (
          <section className={panel}>
            <h2 className="text-headline-medium text-text-primary">
              {editing ? `Edit ${editing.name}` : "Create custom role"}
            </h2>
            <form onSubmit={saveRole} className="flex flex-col gap-4">
              <Input
                label="Role name"
                value={name}
                onChange={setName}
                minLength={2}
                maxLength={50}
                isRequired
                isDisabled={busy}
              />
              <Input
                label="Granted permissions"
                value={grants}
                onChange={setGrants}
                placeholder="receipts:scan, expenses:view_own"
                isDisabled={busy}
              />
              <Input
                label="Denied permissions"
                value={denies}
                onChange={setDenies}
                placeholder="Optional, comma-separated"
                isDisabled={busy}
              />
              <p className="text-caption-1-regular text-text-tertiary">Comma-separated. Denied permissions override grants.</p>
              <details className="text-body-2-regular text-text-secondary">
                <summary className="cursor-pointer">
                  Supported permissions
                </summary>
                <p className="mt-3 break-words">{permissions.join(", ")}</p>
              </details>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? "Saving…" : editing ? "Save changes" : "Create role"}
                </Button>
                {editing && (
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() => edit(null)}
                  >
                    Cancel editing
                  </Button>
                )}
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
