"use client";
import Image from "next/image";
import Link from "next/link";
import { Suspense,useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button, ButtonLink } from "@/components/base/buttons/button";
import { useAuth } from "@/features/auth/auth-provider";
import { apiErrorMessage } from "@/api/client";
import { toast } from "@/components/base/toast/toast";

export function Navbar(){return <Suspense fallback={null}><NavbarContent/></Suspense>;}
function NavbarContent() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try { await auth.logout(); router.replace("/"); }
    catch (error) { toast.error(apiErrorMessage(error, "Could not sign out. Please try again.")); }
    finally { setBusy(false); }
  }
  if (pathname.startsWith("/dashboard")||pathname.startsWith("/reports")||pathname.startsWith("/scans")) return null;
  return <header className="border-b border-separator-border bg-background-primary-default">
    <nav aria-label="Main navigation" className="mx-auto flex min-h-20 max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Link href={auth.user ? "/dashboard" : "/"} className="flex items-center gap-3 rounded-md text-headline-medium text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring">
        <Image src="/logo.svg" width={36} height={36} alt="" priority />Receipt Tracker
      </Link>
      <div className="flex items-center gap-3">
        {auth.user ? <><span className="hidden text-body-2-regular text-text-secondary sm:inline"><bdi>{auth.user.name}</bdi> · {auth.user.role.name}</span><Button variant="secondary" onClick={logout} disabled={busy}>{busy ? "Signing out…" : "Sign out"}</Button></> : !auth.loading && <ButtonLink href="/">Log in</ButtonLink>}
      </div>
    </nav>
  </header>;
}
