"use client";
import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { trackerApi } from "@/api/composition";
import type { User } from "@/api/tracker";
import { apiErrorMessage } from "@/api/client";
import { useAuth } from "@/features/auth/auth-provider";
import { Input } from "@/components/base/input/input";
import { Button } from "@/components/base/buttons/button";
import { toast } from "@/components/base/toast/toast";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
      <h2 className="text-headline-medium text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

export function AccountScreen() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
      <header className="flex flex-col gap-2">

        <h1 className="text-title-1-semibold text-text-primary">My account</h1>

      </header>
      <AccountForms key={user.id} user={user} />
    </main>
  );
}

function AccountForms({ user }: { user: User }) {
  const auth = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user.name),
    [username, setUsername] = useState(user.username ?? ""),
    [bio, setBio] = useState(user.bio ?? "");
  const [avatar, setAvatar] = useState(user.avatar ?? "");
  const [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState(""),
    [emailPassword, setEmailPassword] = useState(""),
    [emailOtp, setEmailOtp] = useState(""),
    [verifyOtp, setVerifyOtp] = useState("");
  const [emailPending, setEmailPending] = useState(false),
    [busy, setBusy] = useState<string | null>(null);
  async function run(
    id: string,
    action: () => Promise<unknown>,
    message: string,
  ) {
    if (busy) return;
    setBusy(id);
    try {
      await action();
      toast.success(message);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not complete the request."));
    } finally {
      setBusy(null);
    }
  }
  function submit(id: string, action: () => Promise<unknown>, message: string) {
    return (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void run(id, action, message);
    };
  }
  const disabled = busy !== null;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Panel title="Profile">
        <form
          className="flex flex-col gap-4"
          onSubmit={submit(
            "profile",
            async () =>
              auth.setUser(
                await trackerApi.updateProfile({
                  name: name.trim(),
                  username: username.trim() || null,
                  bio: bio.trim() || null,
                }),
              ),
            "Profile updated.",
          )}
        >
          <Input
            label="Full name"
            value={name}
            onChange={setName}
            minLength={2}
            maxLength={50}
            isRequired
            isDisabled={disabled}
          />
          <Input
            label="Username"
            value={username}
            onChange={setUsername}
            maxLength={30}
            isDisabled={disabled}
          />
          <p className="text-caption-1-regular text-text-tertiary">3–30 lowercase letters, numbers or underscores.</p>
          <Input
            label="Bio"
            value={bio}
            onChange={setBio}
            maxLength={250}
            isDisabled={disabled}
          />
          <Button type="submit" disabled={disabled}>
            {busy === "profile" ? "Saving…" : "Save profile"}
          </Button>
        </form>
        <div className="flex flex-col gap-2 border-t border-separator-border pt-4">
          <p className="text-caption-1-semibold text-text-secondary">
            Your user ID
          </p>
          <code
            dir="ltr"
            className="break-all text-body-2-regular text-text-tertiary"
          >
            {user.id}
          </code>
          <Button
            variant="ghost"
            onClick={() =>
              void run(
                "copy",
                () => navigator.clipboard.writeText(user.id),
                "User ID copied.",
              )
            }
            disabled={disabled}
          >
            Copy user ID
          </Button>
        </div>
      </Panel>
      <Panel title="Email verification">
        {user.deliveryEmail && user.deliveryEmail !== user.email && (
          <p className="text-body-2-regular text-text-secondary">
            Reset codes:{" "}
            <bdi>{user.deliveryEmail}</bdi>.
          </p>
        )}
        <p
          dir="ltr"
          className="break-all text-body-regular text-text-secondary"
        >
          {user.email}
        </p>
        <p className="text-body-medium text-text-primary">
          {user.emailVerifiedAt
            ? "Verified"
            : "Unverified"}
        </p>
        {!user.emailVerifiedAt && (
          <>
            <Button
              variant="secondary"
              disabled={disabled}
              onClick={() =>
                void run(
                  "verify-send",
                  () => trackerApi.resendEmail(user.email),
                  "If verification is needed, a code has been sent.",
                )
              }
            >
              Send verification code
            </Button>
            <form
              className="flex flex-col gap-4"
              onSubmit={submit(
                "verify",
                async () => {
                  await trackerApi.verifyEmail({
                    email: user.email,
                    otp: verifyOtp,
                  });
                  await auth.reload();
                  setVerifyOtp("");
                },
                "Email verified.",
              )}
            >
              <Input
                label="Six-digit code"
                value={verifyOtp}
                onChange={setVerifyOtp}
                inputMode="numeric"
                minLength={6}
                maxLength={6}
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                isRequired
                isDisabled={disabled}
              />
              <Button type="submit" disabled={disabled}>
                Verify email
              </Button>
            </form>
          </>
        )}
      </Panel>
      <Panel title="Profile image">
        <form
          className="flex flex-col gap-4"
          onSubmit={submit(
            "avatar",
            async () =>
              auth.setUser(await trackerApi.updateAvatar(avatar.trim())),
            "Profile image updated.",
          )}
        >
          <Input
            label="Image URL"
            type="url"
            value={avatar}
            onChange={setAvatar}
            placeholder="https://example.com/avatar.jpg"
            isRequired
            isDisabled={disabled}
          />
          <p className="text-caption-1-regular text-text-tertiary">HTTPS URL required.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={disabled}>
              Save image
            </Button>
            <Button
              variant="secondary"
              disabled={disabled || !user.avatar}
              onClick={() =>
                void run(
                  "remove-avatar",
                  async () => {
                    auth.setUser(await trackerApi.removeAvatar());
                    setAvatar("");
                  },
                  "Profile image removed.",
                )
              }
            >
              Remove image
            </Button>
          </div>
        </form>
      </Panel>
      <Panel title="Change password">
        <p className="text-body-2-regular text-text-secondary">Signs out other devices. Google accounts can set a password through password reset.</p>
        <form
          className="flex flex-col gap-4"
          onSubmit={submit(
            "password",
            async () => {
              await trackerApi.changePassword({ currentPassword, newPassword });
              setCurrentPassword("");
              setNewPassword("");
            },
            "Password changed.",
          )}
        >
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            isRequired
            isDisabled={disabled}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            value={newPassword}
            onChange={setNewPassword}
            isRequired
            isDisabled={disabled}
          />
          <p className="text-caption-1-regular text-text-tertiary">8+ characters with uppercase, lowercase and a number.</p>
          <Button type="submit" disabled={disabled}>
            Change password
          </Button>
        </form>
      </Panel>
      <Panel title="Change email">
        <p className="text-body-2-regular text-text-secondary">Signs out all devices and disconnects Google login.</p>
        <form
          className="flex flex-col gap-4"
          onSubmit={submit(
            "email-send",
            async () => {
              await trackerApi.requestEmailChange({
                newEmail: newEmail.trim(),
                currentPassword: emailPassword,
              });
              setEmailPending(true);
              setEmailPassword("");
            },
            "Check your new email for a confirmation code.",
          )}
        >
          <Input
            label="New email address"
            type="email"
            value={newEmail}
            onChange={setNewEmail}
            isRequired
            isDisabled={disabled}
          />
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={emailPassword}
            onChange={setEmailPassword}
            isRequired
            isDisabled={disabled}
          />
          <Button type="submit" variant="secondary" disabled={disabled}>
            Send confirmation code
          </Button>
        </form>
        {emailPending && (
          <form
            className="flex flex-col gap-4 border-t border-separator-border pt-4"
            onSubmit={submit(
              "email-confirm",
              async () => {
                await trackerApi.confirmEmailChange(emailOtp);
                auth.clear();
                router.replace("/");
              },
              "Email changed. Log in with your new address.",
            )}
          >
            <Input
              label="Confirmation code"
              value={emailOtp}
              onChange={setEmailOtp}
              inputMode="numeric"
              minLength={6}
              maxLength={6}
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              isRequired
              isDisabled={disabled}
            />
            <Button type="submit" disabled={disabled}>
              Confirm email change
            </Button>
          </form>
        )}
      </Panel>
    </div>
  );
}
