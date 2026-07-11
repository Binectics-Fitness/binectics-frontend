"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";

type ScannerState = "starting" | "scanning" | "denied" | "unavailable";

/**
 * In-app QR scanner — the member's "Check in" button lands here. Points
 * the camera at the gym's LIVE kiosk QR; the encoded URL carries a
 * rotating token that proves presence (photos, bookmarks and old links
 * are rejected by the API), so scanning is the only way through the door.
 */
export default function CheckInScannerPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<ScannerState>("starting");
  const handledRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unavailable");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch {
        if (!cancelled) setState("denied");
        return;
      }
      if (cancelled || !videoRef.current) return;

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});
      setState("scanning");

      // jsQR decodes from canvas pixels — works everywhere, no
      // BarcodeDetector availability roulette.
      const { default: jsQR } = await import("jsqr");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const tick = () => {
        if (cancelled || handledRef.current) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const result = jsQR(image.data, image.width, image.height, {
            inversionAttempts: "dontInvert",
          });
          if (result?.data) {
            const target = parseCheckInUrl(result.data);
            if (target) {
              handledRef.current = true;
              router.push(target);
              return;
            }
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [router]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-sm text-center">
        <div className="mb-8 flex justify-center">
          <BinecticsLockup />
        </div>

        <h1
          className="text-[26px] font-medium"
          style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}
        >
          Scan the gym&rsquo;s QR
        </h1>
        <p className="mt-2 text-[15px]" style={{ color: "var(--fg-2)" }}>
          Point your camera at the live QR on the front-desk screen.
        </p>

        <div
          className="mt-6 overflow-hidden rounded-(--r-3)"
          style={{
            border: "1px solid var(--border)",
            background: "var(--ink)",
            aspectRatio: "1 / 1",
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{
              display:
                state === "scanning" || state === "starting"
                  ? "block"
                  : "none",
            }}
          />
          {state === "denied" && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
              <p className="text-[14px] font-medium" style={{ color: "var(--bg)" }}>
                Camera access was blocked.
              </p>
              <p className="text-[12.5px]" style={{ color: "var(--bg-2)" }}>
                Allow camera access in your browser settings, or scan the QR
                with your phone&rsquo;s camera app instead.
              </p>
            </div>
          )}
          {state === "unavailable" && (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
              <p className="text-[14px] font-medium" style={{ color: "var(--bg)" }}>
                No camera available here.
              </p>
              <p className="text-[12.5px]" style={{ color: "var(--bg-2)" }}>
                Scan the front-desk QR with your phone&rsquo;s camera app —
                it opens this site and checks you in.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/dashboard/member"
            className="btn-ghost-v2"
            style={{ textDecoration: "none" }}
          >
            Cancel
          </Link>
        </div>

        <p className="mt-5 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          The QR refreshes every minute, so only a live scan at the gym
          counts.{" "}
          <Link
            href="/qr-help"
            className="underline underline-offset-2"
            style={{ color: "var(--fg-2)" }}
          >
            Trouble scanning?
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Accept only this site's own /check-in/<gymId> URLs (with their token
 * query) — scanning an unrelated QR must not navigate anywhere.
 */
function parseCheckInUrl(raw: string): string | null {
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!/^\/check-in\/[^/]+$/.test(url.pathname)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
