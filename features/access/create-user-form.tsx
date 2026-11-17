"use client";
import { useState, type FormEvent } from "react";
import { RiFileCopyLine } from "@remixicon/react";
import { trackerApi } from "@/api/composition";
import { apiErrorMessage } from "@/api/client";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";

type CreatedAccount = {
  email: string;
  password: string | null;
  deliveryEmail: string | null;
  deliveryMethod: "manual" | "email";
};

export function CreateUserForm({
  onCreated,
  onDone,
}: {
  onCreated: (userId: string) => void;
  onDone?: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deliveryEmail, setDeliveryEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const submitted = {
      name: name.trim(),
      email: email.trim(),
      password,
      ...(deliveryEmail.trim() ? { deliveryEmail: deliveryEmail.trim() } : {}),
    };
    try {
      const result = await trackerApi.createUser(submitted);
      // Only this form retains the chosen password for the manual handoff screen.
      // It is not returned by the server, cached in a query mutation or stored in browser storage.
      setCreated({
        email: result.data.email,
        password:
          result.deliveryMethod === "manual" ? submitted.password : null,
        deliveryEmail: result.deliveryEmail,
        deliveryMethod: result.deliveryMethod,
      });
      setPassword("");
      setName("");
      setEmail("");
      setDeliveryEmail("");
      onCreated(result.data.id);
      toast.success("Worker account created", {
        description:
          result.deliveryMethod === "email"
            ? `Login details were emailed to ${result.deliveryEmail}.`
            : "Copy the login details to share them.",
      });
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not create the account."));
    } finally {
      setBusy(false);
    }
  }
  async function copyDetails() {
    if (!created?.password) return;
    try {
      await navigator.clipboard.writeText(
        `Email: ${created.email}\nPassword: ${created.password}`,
      );
      setCopyError(null);
      toast.success("Email and password copied.");
    } catch {
      setCopyError(
        "Clipboard access is unavailable. Select and copy the email and password below.",
      );
    }
  }
  if (created)
    return (
      <section
        className="flex flex-col gap-5"
        aria-label="Created account details"
      >
        <div className="flex flex-col gap-2">
          <h2 className="text-headline-medium text-text-primary">
            Account ready
          </h2>
          <p className="text-body-2-regular text-text-secondary">
            {created.deliveryMethod === "manual"
              ? "No email sent."
              : `Login details were sent to ${created.deliveryEmail}.`}
          </p>
        </div>
        <Input label="Account login email" value={created.email} isReadOnly />
        {created.password !== null && (
          <>
            <Input
              label="Account password"
              value={created.password}
              isReadOnly
              type="text"
            />
            <p className="text-caption-1-regular text-text-tertiary">Copy before closing. The password cannot be retrieved later.</p>
            <Button
              leadingIcon={RiFileCopyLine}
              onClick={() => void copyDetails()}
            >
              Copy email and password
            </Button>
          </>
        )}
        {copyError && (
          <p
            role="alert"
            className="text-body-2-regular text-text-error-primary"
          >
            {copyError}
          </p>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            setCreated(null);
            setCopyError(null);
            onDone?.();
          }}
        >
          Done
        </Button>
      </section>
    );
  return (
    <section className="flex min-w-0 flex-col gap-5">

      <form onSubmit={submit} className="flex flex-col gap-4" aria-busy={busy}>
        <Input
          label="Full name"
          value={name}
          onChange={setName}
          minLength={2}
          maxLength={50}
          isRequired
          isDisabled={busy}
        />
        <Input
          label="Account login email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="user1@example.com"
          isRequired
          isDisabled={busy}
        />
        <Input
          label="Account password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          minLength={8}
          maxLength={72}
          isRequired
          isDisabled={busy}
        />
        <p className="text-caption-1-regular text-text-tertiary">8+ characters with uppercase, lowercase and a number.</p>
        <Input
          label="Deliver details to (optional)"
          type="email"
          value={deliveryEmail}
          onChange={setDeliveryEmail}
          placeholder="recipient@example.com"
          isDisabled={busy}
        />
        <p className="text-caption-1-regular text-text-tertiary">Leave blank to copy the details instead.</p>
        <Button type="submit" disabled={busy}>
          {busy
            ? "Creating account…"
            : deliveryEmail.trim()
              ? "Create account & email details"
              : "Create account"}
        </Button>
      </form>
    </section>
  );
}
