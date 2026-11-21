"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  CONSENT_EVENT,
  analyticsMeasurementId,
  hasAnalyticsConsent,
} from "@/lib/analytics/consent";
import { track } from "@/lib/analytics/track";
import { isPrivatePath } from "@/lib/routing/indexing";

/**
 * Loads Google Analytics 4 ONLY after the visitor accepts analytics in the
 * cookie banner. Until then no script, no request and no cookie. (It used to
 * load for everyone whenever NEXT_PUBLIC_GOOGLE_ANALYTICS_ID was set,
 * ignoring the banner.)
 *
 * Withdrawing consent switches GA off at once (ga-disable-<id>) and deletes
 * its cookies; the script itself goes on the next page load.
 *
 * Also reports clicks on sign-up calls to action (links to
 * /login?mode=signup) on public pages, through track(), which applies the
 * same consent check.
 */
function deleteGaCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (!name || !/^_ga(_|$)|^_gid$|^_gat/.test(name)) continue;
    const host = location.hostname;
    for (const domain of ["", `; domain=${host}`, `; domain=.${host}`]) {
      document.cookie = `${name}=; max-age=0; path=/${domain}`;
    }
  }
}

/**
 * Signed-in app pages are never measured: only the public site and the
 * sign-up flow. GA stays switched off while the visitor is on any other
 * page, even if it loaded earlier on a public one.
 */
export function isMeasuredPath(pathname: string): boolean {
  return !isPrivatePath(pathname) || pathname === "/login" || pathname.startsWith("/register");
}

export function GoogleAnalytics() {
  const gaId = analyticsMeasurementId();
  const pathname = usePathname() ?? "/";
  const measured = isMeasuredPath(pathname);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (!gaId) return;
    const sync = () => {
      const ok = hasAnalyticsConsent();
      if (!ok) deleteGaCookies();
      setConsented(ok);
    };
    sync();
    document.addEventListener(CONSENT_EVENT, sync);
    return () => document.removeEventListener(CONSENT_EVENT, sync);
  }, [gaId]);

  // GA honours this flag on every hit, including its automatic page views.
  useEffect(() => {
    if (!gaId) return;
    (window as unknown as Record<string, boolean>)[`ga-disable-${gaId}`] = !(consented && measured);
  }, [gaId, consented, measured]);

  useEffect(() => {
    if (!gaId) return;
    function onClick(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href") ?? "";
      if (!href.startsWith("/login") || !href.includes("mode=signup")) return;
      const page = location.pathname;
      if (!isMeasuredPath(page)) return;
      track("cta_click", { cta: "sign_up", page });
    }
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [gaId]);

  // The script loads only with consent, and first on a measured page.
  if (!gaId || !consented || !measured) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { allow_google_signals: false, allow_ad_personalization_signals: false });`}
      </Script>
    </>
  );
}
