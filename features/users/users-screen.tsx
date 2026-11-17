"use client";

import type { DirectoryUser } from "@/api/admin";
import { apiErrorMessage } from "@/api/client";
import { adminApi, trackerApi } from "@/api/composition";
import { Avatar } from "@/components/base/avatar/avatar";
import { Chip } from "@/components/base/badges/chip";
import { Button } from "@/components/base/buttons/button";
import { Modal, ModalBody, ModalHeader } from "@/components/base/modal/modal";
import { Pagination } from "@/components/base/pagination/pagination";
import { SearchField } from "@/components/base/search-field/search-field";
import { Select, SelectItem } from "@/components/base/select/select";
import { Spinner } from "@/components/base/spinner/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/base/table/table";
import { CreateUserForm } from "@/features/access/create-user-form";
import { useAuth } from "@/features/auth/auth-provider";
import {
  RiAddLine,
  RiGroupLine,
  RiRefreshLine,
  RiSettings4Line,
} from "@remixicon/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import ManageUser from "./manage-users";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function UsersScreen() {
  const auth = useAuth();
  const canCreate =
    auth.can("user:create") &&
    auth.user?.role.key === "supervisor" &&
    auth.user.role.type === "system";
  if (!auth.can("users:view") && !canCreate)
    return (
      <main className="p-8">
        <h1 className="text-title-2-medium text-text-primary">
          Access restricted
        </h1>
        <p className="mt-3 text-body-regular text-text-secondary">
          Your role does not allow viewing application users.
        </p>
      </main>
    );
  return <UsersContent canCreate={canCreate} />;
}

function UsersContent({ canCreate }: { canCreate: boolean }) {
  const auth = useAuth();
  const cache = useQueryClient();
  const canView = auth.can("users:view");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [roleId, setRoleId] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<DirectoryUser | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  const roles = useQuery({
    queryKey: ["roles", auth.user?.id],
    queryFn: trackerApi.roles,
    enabled: auth.can("roles:view") && canView,
  });
  const users = useQuery({
    queryKey: ["admin-users", auth.user?.id, page, search, status, roleId],
    queryFn: ({ signal }) =>
      adminApi.listUsers(
        {
          page,
          limit: 15,
          search,
          ...(status !== "all"
            ? { status: status as "active" | "inactive" }
            : {}),
          ...(roleId !== "all" ? { roleId } : {}),
        },
        signal,
      ),
    enabled: canView,
  });
  const canManage =
    auth.can("users:manage") ||
    (auth.can("roles:assign") && auth.can("roles:view"));
  const columns = [
    { id: "member", name: "Member" },
    { id: "email", name: "Email" },
    { id: "role", name: "Role" },
    { id: "start", name: "Start date" },
    { id: "status", name: "Status" },
    { id: "verified", name: "Verification" },
    ...(canManage ? [{ id: "actions", name: "Actions" }] : []),
  ];
  function cell(user: DirectoryUser, key: string): ReactNode {
    switch (key) {
      case "member":
        return (
          <div className="flex min-w-48 items-center gap-3">
            <Avatar
              size="lg"
              src={user.avatar ?? undefined}
              alt=""
              initials={initials(user.name)}
            />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-body-medium text-text-primary">
                <bdi>{user.name}</bdi>
                {user.id === auth.user?.id && (
                  <span className="ms-2 text-caption-1-regular text-text-tertiary">
                    (you)
                  </span>
                )}
              </span>
              {user.username && (
                <span className="text-caption-1-regular text-text-tertiary">
                  @<bdi>{user.username}</bdi>
                </span>
              )}
            </span>
          </div>
        );
      case "email":
        return (
          <bdi className="text-body-2-regular text-text-secondary">
            {user.email}
          </bdi>
        );
      case "role":
        return (
          <span className="text-body-regular text-text-primary">
            {user.role.name}
          </span>
        );
      case "start":
        return (
          <time
            dateTime={user.createdAt}
            className="whitespace-nowrap text-body-regular text-text-secondary"
          >
            {new Intl.DateTimeFormat("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "Africa/Lagos",
            }).format(new Date(user.createdAt))}
          </time>
        );
      case "status":
        return (
          <Chip
            variant="caption"
            color={user.status === "active" ? "lime" : "neutral"}
            className="rounded-full px-3"
          >
            {user.status === "active" ? "Active" : "Inactive"}
          </Chip>
        );
      case "verified":
        return (
          <span className="text-body-2-regular text-text-secondary">
            {user.emailVerifiedAt ? "Verified" : "Unverified"}
          </span>
        );
      case "actions":
        return (
          <Button
            variant="ghost"
            size="small"
            leadingIcon={RiSettings4Line}
            disabled={user.id === auth.user?.id}
            aria-label={`Manage ${user.name}`}
            onClick={() => setEditing(user)}
          >
            Manage
          </Button>
        );
    }
    return null;
  }
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">

          <h1 className="text-title-1-semibold text-text-primary">Users</h1>

        </div>
        {canCreate && (
          <Button
            leadingIcon={RiAddLine}
            className="h-11 rounded-xl"
            onClick={() => setCreateOpen(true)}
          >
            Add user
          </Button>
        )}
      </header>
      {canView ? (
        <section
          className="flex min-w-0 flex-col gap-6"
          aria-label="Application users"
        >
          <div className="flex flex-wrap items-center gap-3">
            <SearchField
              aria-label="Search users by name, email or role"
              placeholder="Search name, email or role…"
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              className="max-w-2xl flex-1 basis-72"
              fieldClassName="min-h-12 border border-border-button-default bg-background-secondary-default"
              isLoading={users.isFetching}
            />
            <Select
              aria-label="Filter by status"
              selectedKey={status}
              onSelectionChange={(key) => {
                if (key !== null) {
                  setStatus(String(key));
                  setPage(1);
                }
              }}
            >
              <SelectItem id="all">All statuses</SelectItem>
              <SelectItem id="active">Active</SelectItem>
              <SelectItem id="inactive">Inactive</SelectItem>
            </Select>
            {auth.can("roles:view") && (
              <Select
                aria-label="Filter by role"
                selectedKey={roleId}
                onSelectionChange={(key) => {
                  if (key !== null) {
                    setRoleId(String(key));
                    setPage(1);
                  }
                }}
                isDisabled={!roles.data}
              >
                <SelectItem id="all">All roles</SelectItem>
                {roles.data?.map((role) => (
                  <SelectItem id={role.id} key={role.id} textValue={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </Select>
            )}
            <Button
              variant="ghost"
              iconOnly
              leadingIcon={RiRefreshLine}
              aria-label="Refresh users"
              disabled={users.isFetching}
              onClick={() => void users.refetch()}
            />
          </div>
          {roles.isError && (
            <p
              role="alert"
              className="text-body-2-regular text-text-error-primary"
            >
              {apiErrorMessage(roles.error, "Could not load role options.")}
            </p>
          )}
          {users.isPending ? (
            <div
              className="flex min-h-64 items-center justify-center gap-3 text-text-secondary"
              role="status"
            >
              <Spinner />
              <span className="text-body-regular">Loading users…</span>
            </div>
          ) : users.isError ? (
            <div
              role="alert"
              className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-3xl border border-border-button-default p-6"
            >
              <p className="text-body-regular text-text-error-primary">
                {apiErrorMessage(users.error, "Could not load users.")}
              </p>
              <Button variant="secondary" onClick={() => void users.refetch()}>
                Try again
              </Button>
            </div>
          ) : (
            <>
              <Table
                aria-label="Application users"
                className="w-full [&_td]:px-4 [&_td]:py-5 [&_th]:px-4 [&_th]:py-4 [&_tr]:border-b [&_tr]:border-separator-border"
                containerClassName="rounded-2xl"
              >
                <TableHeader>
                  {columns.map((column) => (
                    <TableColumn
                      key={column.id}
                      id={column.id}
                      isRowHeader={column.id === "member"}
                    >
                      {column.name}
                    </TableColumn>
                  ))}
                </TableHeader>
                <TableBody
                  items={users.data?.data ?? []}
                  renderEmptyState={() => (
                    <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center">
                      <RiGroupLine
                        className="size-8 text-foreground-icon-tertiary"
                        aria-hidden
                      />
                      <p className="text-body-medium text-text-primary">
                        No users found
                      </p>
                      <p className="text-body-2-regular text-text-secondary">
                        Try a different search or clear the filters.
                      </p>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setQuery("");
                          setSearch("");
                          setStatus("all");
                          setRoleId("all");
                          setPage(1);
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                >
                  {(user) => (
                    <TableRow id={user.id} textValue={user.name}>
                      {columns.map((column) => (
                        <TableCell key={column.id}>
                          {cell(user, column.id)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex flex-col gap-4 border-t border-separator-border pt-4">
                <p
                  aria-live="polite"
                  className="text-caption-1-regular text-text-tertiary"
                >
                  {users.data?.pagination.total ?? 0} users
                  {search || status !== "all" || roleId !== "all"
                    ? " match your filters"
                    : " in this application"}
                </p>
                <Pagination
                  page={page}
                  totalPages={Math.max(
                    1,
                    users.data?.pagination.pageCount ?? 1,
                  )}
                  onChange={setPage}
                />
              </div>
            </>
          )}
        </section>
      ) : (
        <p className="text-body-regular text-text-secondary">
          Your role allows creating accounts but does not grant access to the
          user directory.
        </p>
      )}
      <Modal
        isOpen={createOpen}
        onOpenChange={setCreateOpen}
        size="md"
        aria-label="Create worker account"
      >
        <ModalHeader
          title="Add a user"

        />
        <ModalBody>
          <CreateUserForm
            onDone={() => setCreateOpen(false)}
            onCreated={() => {
              setPage(1);
              void cache.invalidateQueries({ queryKey: ["admin-users"] });
            }}
          />
        </ModalBody>
      </Modal>
      {editing && (
        <ManageUser
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}
