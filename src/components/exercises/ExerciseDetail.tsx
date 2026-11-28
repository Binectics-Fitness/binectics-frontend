"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Dumbbell } from "lucide-react";
import { DSCard, EmptySlate, Eyebrow, PageHeader } from "@/components/ds";
import ExerciseIllustration, { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import {
  EXERCISE_GUIDANCE_DISCLAIMER,
  getExerciseInfo,
  type ExerciseVariation,
} from "@/lib/exercises/exerciseInfo";
import {
  exerciseBackLink,
  displaySummary,
  exerciseDetailHref,
  resolveExercisePlanContext,
  type ExerciseBack,
} from "@/lib/exercises/exerciseDetail";
import { bundledTextApproved, WITHHELD_TEXT_LINE } from "@/lib/exercises/memberText";
import { useActiveStarter } from "@/lib/queries/starter";
import { exerciseDose, restLine } from "@/lib/starter/model";

/** Mobile memberTextCopy NO_ILLUSTRATION_YET. */
export const NO_ILLUSTRATION_YET = "No illustration yet.";

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-7">
      <Eyebrow as="h2" id={id} className="mb-2">
        {title}
      </Eyebrow>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1">
      <dt>
        <Eyebrow as="span">{label}</Eyebrow>
      </dt>
      <dd className="mt-0.5 text-[15px]" style={{ color: "var(--ink)" }}>
        {value}
      </dd>
    </div>
  );
}

interface ExerciseDetailProps {
  mediaId: string;
  /** The Starter session (occurrence id) the page was opened from. */
  session?: string | null;
  /** 0-based row in that session. */
  index?: number | null;
  back?: string | null;
}

/**
 * One exercise's own page (web port of mobile ExerciseDetailScreen): the
 * illustrated demo where web has the art, the plan's prescription, how to
 * do it, muscles, cues, mistakes, safety, an easier version and a
 * no-equipment alternative. Guidance comes from the library
 * (getExerciseInfo); the prescription from the member's program when the
 * link names a session. No guided start or row tick here yet: on web the
 * row tick lives on the session page.
 */
export function ExerciseDetail({ mediaId, session, index = null, back }: ExerciseDetailProps) {
  const info = getExerciseInfo(mediaId);
  const { data } = useActiveStarter(!!session);
  const plan = resolveExercisePlanContext(data?.tasks, mediaId, session, index);
  const backLink = exerciseBackLink(session, back);
  const planEx = plan?.exercise ?? null;
  const dose = planEx ? exerciseDose(planEx) : "";
  const rest = planEx ? restLine(planEx) : null;
  // The owner's rule: written text of a withheld exercise is hidden from members (name, art, dose and facts stay).
  const textOk = bundledTextApproved(mediaId);
  const planCues = textOk ? (planEx?.cues ?? []) : [];
  const partOf = plan
    ? plan.position
      ? `Part of ${plan.workoutTitle} · Exercise ${plan.position.index} of ${plan.position.total}`
      : `Part of ${plan.workoutTitle}`
    : undefined;

  const backButton = (
    <Link href={backLink.href} className="btn-ghost-v2 lg min-h-[44px]">
      {backLink.label}
    </Link>
  );

  const fromPlan = planCues.length > 0 && (
    <Section id="ex-plan-h" title="From your plan">
      <Bullets items={planCues} />
    </Section>
  );

  if (!info) {
    // No library entry for this id: say so plainly, keep the plan's own facts.
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader eyebrow="Exercise" title={planEx?.name ?? "Exercise"} subtitle={partOf} />
        {dose && (
          <p className="font-mono text-[14px]" style={{ color: "var(--fg-2)" }}>
            {[dose, rest].filter(Boolean).join(" · ")}
          </p>
        )}
        {fromPlan}
        <DSCard className="mt-6 p-5">
          <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
            No guide for this exercise yet
          </h2>
          <EmptySlate mt="mt-1" message="We do not have a step-by-step page for this one. Follow the notes from your plan." />
        </DSCard>
        <div className="mt-6">{backButton}</div>
      </div>
    );
  }

  const hasArt = hasExerciseIllustration(mediaId);
  // Variation links keep the way back but drop the row: the variation is not that row.
  const variationHref = (id: string) =>
    exerciseDetailHref(id, {
      session: session ?? undefined,
      back: back === "guided" || back === "program" ? (back satisfies ExerciseBack) : undefined,
    });

  return (
    <article className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Exercise" title={info.name} subtitle={partOf} />

      <figure className="m-0">
        <div
          data-testid="exercise-detail-art"
          className="flex items-center justify-center overflow-hidden rounded-(--r-3) p-4"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)", minHeight: 180 }}
        >
          {hasArt ? (
            <ExerciseIllustration
              mediaId={mediaId}
              className="block aspect-square h-auto w-full max-w-[320px] object-contain"
            />
          ) : (
            <div role="img" aria-label="No illustration for this exercise yet" className="flex flex-col items-center gap-2 py-6">
              <Dumbbell size={32} strokeWidth={1.5} aria-hidden="true" style={{ color: "var(--fg-4)" }} />
              <span className="text-[14px]" style={{ color: "var(--fg-3)" }} aria-hidden="true">
                {NO_ILLUSTRATION_YET}
              </span>
            </div>
          )}
        </div>
        {hasArt && (
          <figcaption className="mt-1.5 text-[13px]" style={{ color: "var(--fg-3)" }}>
            Illustrated demo
          </figcaption>
        )}
      </figure>

      {dose && (
        <DSCard className="mt-5 p-4">
          <Eyebrow>Your plan</Eyebrow>
          <p className="mt-1 font-mono text-[22px]" style={{ color: "var(--ink)" }} data-testid="exercise-detail-dose">
            {dose}
          </p>
          {rest && (
            <p className="text-[15px]" style={{ color: "var(--fg-2)" }}>
              {rest}
            </p>
          )}
        </DSCard>
      )}
      {fromPlan}

      {textOk && (
        <p className="mt-6 text-[15px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          {displaySummary(info.summary, hasArt)}
        </p>
      )}

      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
        <Fact label="Difficulty" value={info.difficulty} />
        <Fact label="Equipment" value={info.equipment.length ? info.equipment.join(", ") : "None"} />
      </dl>

      <Section id="ex-muscles-h" title="Muscles worked">
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          <span className="font-medium" style={{ color: "var(--ink)" }}>Main: </span>
          {info.primaryMuscles.join(", ")}
        </p>
        {info.secondaryMuscles.length > 0 && (
          <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
            <span className="font-medium" style={{ color: "var(--ink)" }}>Also: </span>
            {info.secondaryMuscles.join(", ")}
          </p>
        )}
      </Section>

      {textOk ? (
        <>
          <Section id="ex-how-h" title="How to do it">
            <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-[15px] leading-relaxed marker:font-mono" style={{ color: "var(--fg-2)" }}>
              {info.steps.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
            <p className="mt-2 text-[14px]" style={{ color: "var(--fg-3)" }}>
              Pace: {info.tempo}
            </p>
          </Section>

          <Section id="ex-cues-h" title="Form cues">
            <Bullets items={info.formCues} />
          </Section>
          <Section id="ex-mistakes-h" title="Common mistakes">
            <Bullets items={info.commonMistakes} />
          </Section>
          <Section id="ex-safe-h" title="Stay safe">
            <Bullets items={info.safetyNotes} />
          </Section>

          <Section id="ex-easier-h" title="Make it easier">
            <VariationCard v={info.easierVariation} href={variationHref} />
          </Section>
          <Section id="ex-noequip-h" title="No equipment?">
            {info.withoutEquipment ? (
              <VariationCard v={info.withoutEquipment} href={variationHref} />
            ) : (
              <p className="text-[15px]" style={{ color: "var(--fg-2)" }}>
                This one needs no equipment.
              </p>
            )}
          </Section>
        </>
      ) : (
        <p data-testid="exercise-text-withheld" className="mt-7 text-[15px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          {WITHHELD_TEXT_LINE}
        </p>
      )}

      {textOk && (
        <p className="mt-8 text-[13px] leading-snug" style={{ color: "var(--fg-3)" }}>
          {EXERCISE_GUIDANCE_DISCLAIMER}
        </p>
      )}
      <div className="mt-5">{backButton}</div>
    </article>
  );
}

function VariationCard({ v, href }: { v: ExerciseVariation; href: (id: string) => string }) {
  const linkable = !!v.mediaId && !!getExerciseInfo(v.mediaId);
  return (
    <DSCard className="p-4">
      <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
        {v.name}
      </h3>
      <p className="mt-1 text-[15px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
        {v.how}
      </p>
      {linkable && (
        // Replace, not push (as on mobile): variation links can loop (squat <-> chair squat).
        <Link replace href={href(v.mediaId as string)} className="btn-ghost-v2 md mt-3 inline-flex min-h-[44px] items-center">
          {`See ${v.name}`}
        </Link>
      )}
    </DSCard>
  );
}
