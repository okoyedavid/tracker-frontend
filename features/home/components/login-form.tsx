"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { RiArrowRightLine, RiGoogleFill } from "@remixicon/react";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { trackerApi } from "@/api/composition";
import { apiErrorMessage } from "@/api/client";
import { useAuth } from "@/features/auth/auth-provider";
import { toast } from "@/components/base/toast/toast";

type Mode = "login" | "register" | "verify" | "forgot" | "reset";
const labels: Record<Mode, string> = { login: "Log in", register: "Create account", verify: "Verify email", forgot: "Send reset code", reset: "Reset password" };

export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (auth.user) router.replace("/dashboard"); }, [auth.user, router]);
  useEffect(() => {
    const url = new URL(window.location.href);
    const google = url.searchParams.get("google");
    if (!google) return;
    if (google !== "success") toast.error(({ account_conflict: "Verify your existing account's email before linking Google.", account_inactive: "Your account or role is inactive." } as Record<string, string>)[google] ?? "Google sign-in could not be completed. Please try again.");
    url.searchParams.delete("google"); window.history.replaceState(null, "", url);
  }, []);
  function changeMode(next: Mode) { setMode(next); setError(null); setPassword(""); setOtp(""); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError(null);
    const address = email.trim().toLowerCase();
    try {
      if (mode === "login") { await auth.login({ email: address, password }); router.replace("/dashboard"); }
      if (mode === "register") { await trackerApi.register({ name: name.trim(), email: address, password }); changeMode("verify"); toast.success("Check your email for a verification code."); }
      if (mode === "verify") { await trackerApi.verifyEmail({ email: address, otp }); changeMode("login"); toast.success("Email verified. You can now log in."); }
      if (mode === "forgot") { await trackerApi.forgotPassword(address); changeMode("reset"); toast.success("If the account exists, a reset code has been sent."); }
      if (mode === "reset") { await trackerApi.resetPassword({ email: address, otp, newPassword: password }); changeMode("login"); toast.success("Password reset. Please log in."); }
      setPassword("");
    } catch (cause) { setError(apiErrorMessage(cause, "We couldn't complete this request.")); }
    finally { setBusy(false); }
  }
  async function resend() {
    setBusy(true); setError(null);
    try { await trackerApi.resendEmail(email.trim()); toast.success("If verification is needed, a code has been sent."); }
    catch (cause) { setError(apiErrorMessage(cause, "Could not resend the code.")); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-col gap-5">
    <div className="flex flex-wrap gap-2" aria-label="Account access">
      <Button variant={mode === "login" ? "primary" : "secondary"} onClick={() => changeMode("login")} disabled={busy}>Log in</Button>
      <Button variant={mode === "register" ? "primary" : "secondary"} onClick={() => changeMode("register")} disabled={busy}>Create account</Button>
    </div>
    <form onSubmit={submit} className="flex flex-col gap-5" aria-busy={busy}>
      <h2 className="text-headline-medium text-text-primary">{labels[mode]}</h2>
      {mode === "register" && <Input label="Full name" value={name} onChange={setName} autoComplete="name" minLength={2} maxLength={50} isRequired isDisabled={busy} />}
      <Input label="Email address" type="email" autoComplete="email" value={email} onChange={setEmail} isRequired isDisabled={busy} />
      {(mode === "login" || mode === "register" || mode === "reset") && <Input label={mode === "reset" ? "New password" : "Password"} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={setPassword} isRequired isDisabled={busy} />}
      {(mode === "register" || mode === "reset") && <p className="text-caption-1-regular text-text-tertiary">8+ characters with uppercase, lowercase and a number.</p>}
      {(mode === "verify" || mode === "reset") && <Input label="Six-digit email code" value={otp} onChange={setOtp} inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} pattern="[0-9]{6}" isRequired isDisabled={busy} />}
      {error && <p role="alert" className="text-body-2-regular text-text-error-primary">{error}</p>}
      <Button type="submit" className="h-12 w-full rounded-xl" trailingIcon={RiArrowRightLine} disabled={busy || auth.loading}>{busy ? "Please wait…" : labels[mode]}</Button>
    </form>
    {mode === "login" && <><ButtonLink href="/api/auth/google" variant="secondary" leadingIcon={RiGoogleFill} className="h-12">Continue with Google</ButtonLink><div className="flex flex-wrap gap-2"><Button variant="ghost" onClick={() => changeMode("forgot")}>Forgot password?</Button><Button variant="ghost" onClick={() => changeMode("verify")}>Verify email</Button></div></>}
    {mode === "verify" && <Button variant="secondary" disabled={busy || !email} onClick={resend}>Resend verification code</Button>}
    {mode === "reset" && <Button variant="ghost" disabled={busy} onClick={() => changeMode("forgot")}>Request another reset code</Button>}
  </div>;
}
