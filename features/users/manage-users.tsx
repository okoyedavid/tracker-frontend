"use client";

import type { DirectoryUser } from "@/api/admin";
import { apiErrorMessage } from "@/api/client";
import { trackerApi } from "@/api/composition";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@/components/base/modal/modal";
import { Select, SelectItem } from "@/components/base/select/select";
import { toast } from "@/components/base/toast/toast";
import { useAuth } from "@/features/auth/auth-provider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export default function ManageUser({
  user,
  onClose,
}: {
  user: DirectoryUser;
  onClose: () => void;
}) {
  const auth = useAuth();
  const cache = useQueryClient();
  const canAssign = auth.can("roles:assign") && auth.can("roles:view");
  const canSetStatus = auth.can("users:manage");
  const roles = useQuery({
    queryKey: ["roles", auth.user?.id],
    queryFn: trackerApi.roles,
    enabled: canAssign,
  });
  const [roleId, setRoleId] = useState(user.role.id);
  const [status, setStatus] = useState(user.status);
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || user.id === auth.user?.id) return;
    setBusy(true);
    try {
      // Separate endpoints may partially succeed; keep the directory current in either case.
      if (canAssign && roleId !== user.role.id)
        await trackerApi.assignRole(user.id, roleId);
      if (canSetStatus && status !== user.status)
        await trackerApi.setUserStatus(user.id, status);
      toast.success("Account access updated.");
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not update access."));
    } finally {
      setBusy(false);
      await cache.invalidateQueries({ queryKey: ["admin-users"] });
    }
  }
  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
      size="sm"
      aria-label="Manage user access"
    >
      <form onSubmit={save}>
        <ModalHeader
          title="Manage account access"

          showCloseButton={!busy}
        />
        <ModalBody className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar
              size="lg"
              initials={initials(user.name)}
              src={user.avatar ?? undefined}
            />
            <div className="min-w-0">
              <p className="text-body-medium text-text-primary">
                <bdi>{user.name}</bdi>
              </p>
              <p className="break-all text-caption-1-regular text-text-secondary">
                <bdi>{user.email}</bdi>
              </p>
            </div>
          </div>
          {canAssign && (
            <>
              <Select
                label="Role"
                selectedKey={roleId}
                onSelectionChange={(key) => {
                  if (key !== null) setRoleId(String(key));
                }}
                isDisabled={busy || !roles.data}
              >
                {roles.data?.map((role) => (
                  <SelectItem id={role.id} key={role.id} textValue={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </Select>

            </>
          )}
          {roles.isError && (
            <p
              role="alert"
              className="text-body-2-regular text-text-error-primary"
            >
              {apiErrorMessage(roles.error, "Could not load roles.")}
            </p>
          )}
          {canSetStatus && (
            <>
              <Select
                label="Account status"
                selectedKey={status}
                onSelectionChange={(key) => {
                  if (key === "active" || key === "inactive") setStatus(key);
                }}
                isDisabled={busy}
              >
                <SelectItem id="active">Active</SelectItem>
                <SelectItem id="inactive">Inactive</SelectItem>
              </Select>
              <p className="text-caption-1-regular text-text-tertiary">
                Deactivating this account immediately revokes its sessions.
              </p>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              busy || (roleId === user.role.id && status === user.status)
            }
          >
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
