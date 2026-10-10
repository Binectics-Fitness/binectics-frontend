import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { JournalDemo } from "@/components/ds/JournalDemo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Journals",
  description:
    "Trainers write journal notes on a client's profile, and clients read them in their app, next to their own weight, meal and workout logs and their program adherence.",
  keywords:
    "client journal, trainer notes, fitness progress tracking, program adherence, weight log, client notes",
};

const WORKFLOW = [
  {
    step: "01",
    title: "Write a note",
    desc: "After a session, write a note on the client's profile: how it went and what comes next. It is dated for you.",
  },
  {
    step: "02",
    title: "The client is notified",
    desc: "The client gets an in-app notification and reads the note in their journal. They can't edit it.",
  },
  {
    step: "03",
    title: "Progress sits next to it",
    desc: "On the client's profile you also see their latest weight and, for clients on a program, their program adherence.",
  },
];

const ENTRY_TYPES = [
  {
    title: "Note",
    desc: "The heart of every entry. What happened in the session, what changed, what to work on next. Written by the trainer, read by the client.",
    fields: "Date · Note text",
  },
  {
    title: "Weight",
    desc: "An entry can carry the client's weight, shown with the note in the client's app.",
    fields: "Weight in kg · optional",
  },
  {
    title: "Mood",
    desc: "An entry can record how the client was feeling, shown with the note in the client's app.",
    fields: "Excellent · Good · Okay · Low · Stressed · optional",
  },
  {
    title: "Adherence",
    desc: "An entry can carry an adherence number from 0 to 100, shown with the note in the client's app.",
    fields: "0 to 100 · optional",
  },
];

const PROVIDER_VIEWS = [
  {
    role: "For Trainers",
    accent: "var(--trainer)",
    items: [
      "Journal notes on each client's profile, newest first",
      "Latest weight, with the client's target weight if they set one",
      "Program adherence: the share of due program tasks the client has done",
      "Day of the program and tasks done this week, for each program",
      "Next session and recent sessions, with your session notes",
    ],
  },
  {
    role: "For Dietitians",
    accent: "var(--dietitian)",
    items: [
      "The client's current weight and weight change on their profile",
      "Meal feedback: clients log meals and rate how each one went",
      "Weekly meal plans assigned to the client",
      "Intake form answers on the client profile",
      "Program adherence for clients on one of your programs",
    ],
  },
];

const FEATURES = [
  { title: "Client-visible journal", desc: "Clients read your notes in their app. They can't edit them." },
  { title: "Notifications", desc: "The client gets an in-app notification when you add an entry." },
  { title: "Program adherence", desc: "The share of due program tasks a client has done, shown on their profile and on each program." },
  { title: "Weight logs", desc: "Clients log their weight in the app, and you see the latest on their profile." },
  { title: "Meal and workout logs", desc: "Clients log meals and workouts in their app, alongside your notes." },
  { title: "Daily task reminder", desc: "Clients on a program get a daily push listing the tasks due that day." },
  { title: "Messages", desc: "Message a client directly from their profile." },
  { title: "One-off tasks", desc: "Add a single task to a client's day from their profile, outside their program." },
];

export default function ClientJournalsPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div
          className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5"
          style={{ color: "var(--fg-3)" }}
        >
          Platform
        </div>
        <h1
          className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[22ch]"
          style={{
            lineHeight: 1.04,
            letterSpacing: "-0.032em",
            color: "var(--ink)",
          }}
        >
          Progress you can see.{" "}
          <em className="font-serif font-normal italic">Notes they can read</em>.
        </h1>
        <p
          className="text-[17px] sm:text-[18px] max-w-[62ch] leading-[1.5] mt-5"
          style={{ color: "var(--fg-2)" }}
        >
          Trainers write a note on the client&rsquo;s profile after a
          session. The client reads it in their app, next to their own
          weight, meal and workout logs and their program adherence.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <Link href="/login?mode=signup" className="btn-primary-v2 lg">
            Start journaling free &rarr;
          </Link>
          <Link href="/for-trainers" className="btn-ghost-v2 lg">
            For trainers
          </Link>
        </div>
      </section>

      {/* Interactive demo */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Two perspectives, one timeline
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          The trainer&rsquo;s view of a client, then the client&rsquo;s
          read-only view of the same notes.
        </p>
        <JournalDemo />
      </section>

      {/* How it works */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-8"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKFLOW.map((w) => (
            <div
              key={w.step}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <div
                className="font-mono text-[28px] font-medium mb-3"
                style={{ color: "var(--border-2)" }}
              >
                {w.step}
              </div>
              <h3
                className="text-[17px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {w.title}
              </h3>
              <p
                className="text-[14px] leading-[1.55]"
                style={{ color: "var(--fg-2)" }}
              >
                {w.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Entry types */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          What a journal entry holds
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          A journal entry is a dated note. It can also carry three optional
          values, which the client&rsquo;s app shows with the note. Today,
          notes are written from the client&rsquo;s profile.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ENTRY_TYPES.map((et) => (
            <div
              key={et.title}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <h3
                className="text-[17px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {et.title}
              </h3>
              <p
                className="text-[14px] leading-[1.55] mb-4"
                style={{ color: "var(--fg-2)" }}
              >
                {et.desc}
              </p>
              <div
                className="font-mono text-[11px] leading-[1.6] px-3 py-2 rounded-(--r-2)"
                style={{
                  background: "var(--bg)",
                  color: "var(--fg-3)",
                  border: "1px solid var(--border)",
                }}
              >
                {et.fields}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Provider-specific views */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-3"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          Around the journal
        </h2>
        <p
          className="text-[16px] max-w-[56ch] leading-[1.5] mb-8"
          style={{ color: "var(--fg-2)" }}
        >
          The client&rsquo;s profile puts the journal next to the numbers
          that already exist for them.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {PROVIDER_VIEWS.map((pv) => (
            <div
              key={pv.role}
              className="rounded-(--r-3) p-6"
              style={{ background: "var(--bg-2)" }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: pv.accent }}
                />
                <span
                  className="font-mono text-[11px] uppercase tracking-[0.04em]"
                  style={{ color: "var(--fg-3)" }}
                >
                  {pv.role}
                </span>
              </div>
              <ul className="space-y-2.5">
                {pv.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-[1.5]"
                    style={{ color: "var(--fg-2)" }}
                  >
                    <span
                      className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: "var(--border-2)" }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-12"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[32px] font-medium mb-6"
          style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}
        >
          What you can use today
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-(--r-3) p-5"
              style={{ background: "var(--bg-2)" }}
            >
              <h3
                className="text-[15px] font-medium mb-2"
                style={{ color: "var(--ink)" }}
              >
                {f.title}
              </h3>
              <p
                className="text-[13.5px] leading-[1.55]"
                style={{ color: "var(--fg-2)" }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="mx-auto max-w-280 px-5 sm:px-8 py-14 sm:py-18 text-center"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <h2
          className="text-[28px] sm:text-[36px] font-medium mb-4"
          style={{ letterSpacing: "-0.028em", color: "var(--ink)" }}
        >
          Your clients deserve better than a spreadsheet
        </h2>
        <p
          className="text-[16px] sm:text-[17px] max-w-[48ch] mx-auto leading-[1.5] mb-7"
          style={{ color: "var(--fg-2)" }}
        >
          Journals are included on every plan, including Free. No trial
          countdown.
        </p>
        <Link href="/login?mode=signup" className="btn-primary-v2 lg">
          Get started free &rarr;
        </Link>
      </section>

      <MarketingFooter />
    </div>
  );
}
