#!/usr/bin/env node
/**
 * Fails the build when the browser bundle carries something that looks like
 * a secret. Runs after `next build` (npm "postbuild").
 *
 * Everything under .next/static is downloaded by every visitor. Public
 * values are fine there (the Paystack PUBLIC key, the Firebase web config,
 * Paystack's own embedded RSA public key); secret keys, connection strings
 * and private keys never are.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), ".next", "static");

const PATTERNS = [
  { name: "Paystack secret key", re: /sk_(live|test)_[A-Za-z0-9]{20,}/ },
  { name: "Stripe secret key", re: /\b(sk|rk)_live_[A-Za-z0-9]{20,}/ },
  { name: "Azure storage connection string", re: /DefaultEndpointsProtocol=https?;AccountName=/ },
  { name: "Azure account key", re: /AccountKey=[A-Za-z0-9+/=]{40,}/ },
  { name: "Azure SAS token", re: /[?&]sig=[A-Za-z0-9%]{30,}&/ },
  { name: "MongoDB connection string with credentials", re: /mongodb(\+srv)?:\/\/[^\s"'/:@]+:[^\s"'@]+@/ },
  { name: "Private key", re: /-----BEGIN (RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/ },
  { name: "Cloudinary URL with secret", re: /cloudinary:\/\/\d+:[A-Za-z0-9_-]+@/ },
  { name: "GitHub token", re: /\bgh[pousr]_[A-Za-z0-9]{36}\b/ },
  { name: "Service account private key field", re: /"private_key"\s*:\s*"-----BEGIN/ },
];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|mjs|css|html|json|txt|map)$/.test(name)) out.push(p);
  }
  return out;
}

if (!existsSync(ROOT)) {
  console.log("check-client-secrets: no .next/static yet, skipping");
  process.exit(0);
}

const hits = [];
for (const file of walk(ROOT)) {
  const text = readFileSync(file, "utf8");
  for (const { name, re } of PATTERNS) {
    const m = text.match(re);
    if (m) hits.push(`${name} in ${file.slice(process.cwd().length + 1)}: ${m[0].slice(0, 12)}…`);
  }
}

if (hits.length) {
  console.error("✖ The browser bundle contains what looks like a secret:");
  for (const h of hits) console.error("  - " + h);
  console.error("Secrets belong on the API server, never in NEXT_PUBLIC_* variables or client code.");
  process.exit(1);
}
console.log("✓ check-client-secrets: no secrets in the browser bundle");
