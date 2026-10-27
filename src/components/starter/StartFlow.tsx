"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow, PageHeader } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { starterService } from "@/lib/api/starter";
import { useStarterOptions, useStarterPreview } from "@/lib/queries/starter";
import { queryKeys } from "@/lib/queries/keys";
import {
  STARTER_AGE_NOTE,
  STARTER_ART_NOTE,
  STARTER_SCREENING_QUESTION,
  STARTER_SCREENING_WARNING,
  laterWeekParts,
  safetyParagraphs,
  starterFactsLine,
} from "@/lib/starter/copy";
import { isStarterAlreadyActive, starterErrorMessage } from "@/lib/starter/errors";
import {
  STARTER_DAYS,
  STARTER_EQUIPMENT,
  STARTER_GOALS,
  STARTER_LEAVE_REASONS,
  suggestStarterGoal,
} from "@/lib/starter/goals";
import { exerciseDose, starterStartDate } from "@/lib/starter/model";
import {
  StarterEquipment,
  StarterGoal,
  StarterStartOn,
  type StarterDaysPerWeek,
  type StarterLeaveReason,
  type StarterQuery,
} from "@/lib/starter/types";
import { getClientTimezone } from "@/utils/format";
import { ChoiceGroup } from "./ChoiceGroup";
import { ErrorBox } from "./StarterSession";

const HOME = "/dashboard/member/starter";

type YesNo = "yes" | "no";
const YES_NO: { value: YesNo; label: string }[] = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];
const START_ON: { value: StarterStartOn; label: string }[] = [
  { value: StarterStartOn.Today, label: "Today" },
  { value: StarterStartOn.NextMonday, label: "Next Monday" },
];

/**
 * Pick (goal, equipment, days) then review: week 1 in full, later weeks one
 * line each, the safety note, the health question, the 18+ confirmation and
 * the start date. With ?swap=<instance id> the same flow swaps the running
 * program instead of starting a first one.
 */
export function StartFlow() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const swapFrom = useSearchParams().get("swap");

  const [suggested] = useState(() => suggestStarterGoal(user?.fitness_goals));
  const [goal, setGoal] = useState<StarterGoal | null>(suggested);
  const [equipment, setEquipment] = useState<StarterEquipment | null>(null);
  const [days, setDays] = useState<StarterDaysPerWeek | null>(null);
  const [query, setQuery] = useState<StarterQuery | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const [startOn, setStartOn] = useState<StarterStartOn>(StarterStartOn.Today);
  const [ageOk, setAgeOk] = useState(false);
  const [health, setHealth] = useState<YesNo | null>(null);
  const [reason, setReason] = useState<StarterLeaveReason | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const options = useStarterOptions(query);
  const choices = options.data?.options ?? [];
  const selectedId = pickedId ?? choices[0]?.templateId ?? null;
  const preview = useStarterPreview(selectedId);
  const template = preview.data ?? null;

  const ready = goal !== null && equipment !== null && days !== null;
  const canStart = !!template && ageOk && health !== null && !starting;

  const start = async () => {
    if (!template || health === null) return;
    setStarting(true);
    setStartError("");
    const input = {
      templateId: template.templateId,
      startDate: starterStartDate(startOn),
      timezone: getClientTimezone(),
      adultConfirmed: ageOk,
      safetyAck: true,
      screeningFlagged: health === "yes",
    };
    const res = swapFrom
      ? await starterService.swap(swapFrom, { ...input, reason: reason ?? undefined })
      : await starterService.start(input);
    setStarting(false);
    if (res.success) {
      toast(swapFrom ? "Your new program has started" : "Your program has started", "success");
      // Drop the old copy so the next screen never shows (or acts on) the program just left.
      qc.removeQueries({ queryKey: queryKeys.starter.all });
      router.push(HOME);
      return;
    }
    if (isStarterAlreadyActive(res)) {
      toast("Your program is already running", "success");
      qc.removeQueries({ queryKey: queryKeys.starter.all });
      router.push(HOME);
      return;
    }
    setStartError(starterErrorMessage(res, "Could not start the program. Try again."));
  };

  // ─── Step 1: three questions ───
  if (!query) {
    return (
      <div className="max-w-[640px]">
        <PageHeader
          eyebrow={swapFrom ? "Swap program" : "Free program"}
          title={swapFrom ? "Pick another program" : "Start a program"}
          subtitle="A free beginner program, three quick questions. No coach needed, and you can leave any time."
        />
        <div className="flex flex-col gap-6">
          <fieldset className="contents">
            <Eyebrow as="h2" className="mb-2">1. What is your goal?</Eyebrow>
            {suggested !== null && goal === suggested && (
              <p className="mb-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
                Picked from your profile. Change it if you like.
              </p>
            )}
            <ChoiceGroup label="Goal" options={STARTER_GOALS} value={goal} onChange={setGoal} />
          </fieldset>
          <div>
            <Eyebrow as="h2" className="mb-2">2. What can you train with?</Eyebrow>
            <ChoiceGroup label="Equipment" options={STARTER_EQUIPMENT} value={equipment} onChange={setEquipment} />
          </div>
          <div>
            <Eyebrow as="h2" className="mb-2">3. How many days a week?</Eyebrow>
            <ChoiceGroup label="Days per week" options={STARTER_DAYS} value={days} onChange={setDays} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary-v2 lg min-h-11"
              disabled={!ready}
              onClick={() => ready && setQuery({ goal, equipment, days })}
            >
              See the program
            </button>
            <Link href={HOME} className="btn-ghost-v2 lg min-h-11">Cancel</Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Step 2: review and start ───
  const back = (
    <button
      type="button"
      className="mb-3 inline-flex min-h-11 items-center text-[14px] underline underline-offset-2"
      style={{ color: "var(--fg-2)" }}
      onClick={() => {
        setQuery(null);
        setPickedId(null);
        setStartError("");
      }}
    >
      Change my answers
    </button>
  );

  if (options.isLoading) return <div>{back}<AsyncSpinner size="page" label="Loading your program" /></div>;
  if (options.isError) {
    return (
      <div>
        {back}
        <ErrorBox
          message={options.error instanceof Error ? options.error.message : "Could not load the program. Try again."}
          onRetry={() => void options.refetch()}
        />
      </div>
    );
  }
  if (choices.length === 0) {
    return (
      <div>
        {back}
        <EmptySlate
          message="No program fits yet."
          hint="We could not find a program for those answers. Try different ones, or check back soon."
        />
      </div>
    );
  }
  if (preview.isError) {
    return (
      <div>
        {back}
        <ErrorBox
          message={preview.error instanceof Error ? preview.error.message : "Could not load the program. Try again."}
          onRetry={() => void preview.refetch()}
        />
      </div>
    );
  }
  if (!template) return <div>{back}<AsyncSpinner size="page" label="Loading your program" /></div>;

  const facts = starterFactsLine(template);
  const hint = !ageOk || health === null ? "Answer the health question and confirm you are 18 or older to start." : "";

  return (
    <div className="max-w-[720px]">
      {back}
      {options.data && !options.data.exact && (
        <p className="mb-2 text-[14px]" style={{ color: "var(--fg-2)" }}>This is the closest to what you asked for.</p>
      )}
      <PageHeader
        eyebrow={swapFrom ? "Swap program" : "Your program"}
        title={template.name}
        subtitle={facts || undefined}
      />
      {template.summary && (
        <p className="-mt-3 mb-4 text-[15px] leading-relaxed" style={{ color: "var(--fg-2)" }}>{template.summary}</p>
      )}

      {choices.length > 1 && (
        <div className="mb-6">
          <Eyebrow as="h2" className="mb-2">Other options</Eyebrow>
          <ChoiceGroup
            label="Program options"
            options={choices.map((c) => ({ value: c.templateId, label: c.name }))}
            value={template.templateId}
            onChange={setPickedId}
          />
        </div>
      )}

      {template.weekOne.length > 0 && (
        <section aria-labelledby="starter-week1-h" className="mb-6">
          <Eyebrow as="h2" id="starter-week1-h" className="mb-2">Week 1</Eyebrow>
          <div className="flex flex-col gap-2.5">
            {template.weekOne.map((s, i) => (
              <DSCard key={`${s.title}-${i}`} className="p-4">
                <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{s.title}</h3>
                {s.detail && <p className="mt-0.5 text-[14px]" style={{ color: "var(--fg-2)" }}>{s.detail}</p>}
                <ul className="mt-2 flex flex-col">
                  {s.exercises.map((e, j) => (
                    <li key={`${e.name}-${j}`} className="flex items-baseline justify-between gap-3 py-1 text-[14px]">
                      <span style={{ color: "var(--ink)" }}>{e.name}</span>
                      <span className="shrink-0 font-mono text-[13px]" style={{ color: "var(--fg-2)" }}>
                        {exerciseDose(e)}
                      </span>
                    </li>
                  ))}
                </ul>
              </DSCard>
            ))}
          </div>
          <p className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>{STARTER_ART_NOTE}</p>
        </section>
      )}

      {template.laterWeeks.length > 0 && (
        <section aria-labelledby="starter-later-h" className="mb-6">
          <Eyebrow as="h2" id="starter-later-h" className="mb-2">The weeks after</Eyebrow>
          <ul className="flex flex-col gap-1">
            {template.laterWeeks.map((w) => {
              const parts = laterWeekParts(w);
              return (
                <li key={w.week} className="text-[14px]" style={{ color: "var(--fg-2)" }}>
                  <span className="font-mono" style={{ color: "var(--ink)" }}>{parts.label}</span>
                  {parts.name ? `  ${parts.name}` : ""}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section aria-labelledby="starter-safety-h" className="mb-6">
        <Eyebrow as="h2" id="starter-safety-h" className="mb-2">Before you start</Eyebrow>
        {safetyParagraphs(template.cautions).map((para, i) => (
          <p key={i} className={`text-[15px] leading-relaxed ${i > 0 ? "mt-2" : ""}`} style={{ color: "var(--fg-2)" }}>
            {para}
          </p>
        ))}

        <p id="starter-health-q" className="mt-5 text-[15px] font-medium leading-snug" style={{ color: "var(--ink)" }}>
          {STARTER_SCREENING_QUESTION}
        </p>
        <ChoiceGroup label="Health question" options={YES_NO} value={health} onChange={setHealth} className="mt-2" />
        {health === "yes" && (
          <div
            role="alert"
            className="mt-3 rounded-(--r-3) p-3 text-[14px] font-medium"
            style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}
          >
            {STARTER_SCREENING_WARNING}
          </div>
        )}

        <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={ageOk}
            onChange={(e) => setAgeOk(e.target.checked)}
            className="h-6 w-6 shrink-0 cursor-pointer accent-[var(--ink)]"
          />
          <span className="text-[15px]" style={{ color: "var(--ink)" }}>{STARTER_AGE_NOTE}</span>
        </label>
      </section>

      <section aria-labelledby="starter-when-h" className="mb-6">
        <Eyebrow as="h2" id="starter-when-h" className="mb-2">Start</Eyebrow>
        <ChoiceGroup label="Start date" options={START_ON} value={startOn} onChange={setStartOn} />
        {swapFrom && (
          <div className="mt-5">
            <p className="text-[14px]" style={{ color: "var(--ink)" }}>
              Why are you swapping? (optional) Your current program ends and its history is kept.
            </p>
            <ChoiceGroup label="Why you are swapping" options={STARTER_LEAVE_REASONS} value={reason} onChange={setReason} className="mt-2" />
          </div>
        )}
      </section>

      {startError && (
        <p role="alert" className="mb-3 text-[14px]" style={{ color: "var(--danger)" }}>{startError}</p>
      )}
      <button
        type="button"
        className="btn-primary-v2 lg min-h-11"
        disabled={!canStart}
        aria-describedby={hint ? "starter-start-hint" : undefined}
        onClick={() => void start()}
      >
        {starting ? "Starting…" : swapFrom ? "Swap to this program" : "Start this program"}
      </button>
      {hint && (
        <p id="starter-start-hint" className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>{hint}</p>
      )}
    </div>
  );
}
