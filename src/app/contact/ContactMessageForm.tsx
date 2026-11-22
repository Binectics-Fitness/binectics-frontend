"use client";

import { useState } from "react";
import { contactSchema, type ContactFormData } from "@/lib/schemas/contact";

/**
 * The /contact form. There is no contact endpoint on the API yet, so the
 * form never pretends to send: it checks the fields, then opens the
 * visitor's email app with the message filled in, addressed to the help
 * inbox. (Before this, the form posted to "#" and every message was lost.)
 *
 * The hidden "website" field is a honeypot: people never see it, form-filling
 * bots do. Nothing is sent from this page, so it only stops a bot from
 * opening a mail draft, but it is in place for when a real endpoint arrives.
 */
export const CONTACT_INBOX = "help@binectics.com";

type FieldErrors = Partial<Record<keyof ContactFormData, string>>;

export function buildContactMailto(data: ContactFormData): string {
  const body = `${data.message}\n\n${data.name}\n${data.email}`;
  return `mailto:${CONTACT_INBOX}?subject=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(body)}`;
}

const inputStyle = { background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" } as const;
const labelClass = "block font-mono text-[11px] uppercase tracking-[0.04em] mb-1.5";

export function ContactMessageForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [opened, setOpened] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (String(form.get("website") ?? "") !== "") return; // honeypot
    const parsed = contactSchema.safeParse({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactFormData;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setOpened(false);
      return;
    }
    setErrors({});
    window.location.href = buildContactMailto(parsed.data);
    setOpened(true);
  }

  const field = (name: keyof ContactFormData) => ({
    id: `contact-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  });
  const errorText = (name: keyof ContactFormData) =>
    errors[name] ? (
      <p id={`contact-${name}-error`} className="text-[13px] mt-1.5" style={{ color: "var(--danger-ink)" }}>
        {errors[name]}
      </p>
    ) : null;

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      <div>
        <label htmlFor="contact-name" className={labelClass} style={{ color: "var(--fg-3)" }}>Name</label>
        <input {...field("name")} type="text" autoComplete="name" required minLength={2} maxLength={100} placeholder="Your full name" className="w-full rounded-(--r-2) px-4 py-3 text-[15px] outline-none" style={inputStyle} />
        {errorText("name")}
      </div>
      <div>
        <label htmlFor="contact-email" className={labelClass} style={{ color: "var(--fg-3)" }}>Email</label>
        <input {...field("email")} type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" className="w-full rounded-(--r-2) px-4 py-3 text-[15px] outline-none" style={inputStyle} />
        {errorText("email")}
      </div>
      <div>
        <label htmlFor="contact-subject" className={labelClass} style={{ color: "var(--fg-3)" }}>Subject</label>
        <input {...field("subject")} type="text" required minLength={3} maxLength={200} placeholder="e.g. Partnership enquiry" className="w-full rounded-(--r-2) px-4 py-3 text-[15px] outline-none" style={inputStyle} />
        {errorText("subject")}
      </div>
      <div>
        <label htmlFor="contact-message" className={labelClass} style={{ color: "var(--fg-3)" }}>Message</label>
        <textarea {...field("message")} rows={5} required minLength={10} maxLength={2000} placeholder="Tell us what you need..." className="w-full rounded-(--r-2) px-4 py-3 text-[15px] outline-none resize-y" style={inputStyle} />
        {errorText("message")}
      </div>
      {/* Honeypot: hidden from people and screen readers. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <button type="submit" className="btn-primary-v2 self-start mt-1">Send message &rarr;</button>
      <p className="text-[13px] leading-[1.5]" style={{ color: "var(--fg-3)" }} role="status">
        {opened
          ? `Your email app should open with this message. If it doesn't, write to ${CONTACT_INBOX}.`
          : `This opens your email app with the message ready to send to ${CONTACT_INBOX}.`}
      </p>
    </form>
  );
}
