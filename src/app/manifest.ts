import type { MetadataRoute } from "next";

/**
 * Web app manifest (served at /manifest.webmanifest). Lets Android and
 * desktop browsers add Binectics to the home screen with the brand icon.
 * Colours match the ink and paper of icon.svg.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Binectics",
    short_name: "Binectics",
    description: "Run your gym, coaching and payments in one place.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f2ec",
    theme_color: "#1a1a17",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
