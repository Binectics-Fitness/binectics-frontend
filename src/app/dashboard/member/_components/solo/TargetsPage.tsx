"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ChipGroup, DSCard, PageHeader, SaveCheck } from "@/components/ds";
import { TARGET_CATEGORY, TARGET_ICON } from "@/lib/ui/categories";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import {
  FASTING_BOUNDS,
  FASTING_STEP_HOURS,
  TARGET_BELOW_SUPPORTED_RANGE,
  WATER_BOUNDS,
  WEIGHT_BOUNDS,
  WEIGHT_STEP_KG,
  type MemberTargets,
  type UpdateTargetsInput,
  type WeightRange,
} from "@/lib/api/memberTargets";
import { useSeries, useTargets, useUpdateTargets, useWeightCompare } from "@/lib/queries/glance";
import { useWaterToday } from "@/lib/queries/solo";
import {
  PROGRESS_PAGE_COPY,
  STATE_COPY,
  TARGETS_COPY,
  TARGET_BELOW_SUPPORTED_RANGE_LINE,
  type TargetTab,
  fastingPreview,
  fastingWindowSentence,
  waterAimSentence,
  waterPreview,
  weightPreview,
  weightRangeSentence,
} from "@/lib/solo/glanceCopy";
import { clampTo, dayKeyOf, fastAverage, fastDays, roundHalf, windowOf } from "@/lib/solo/glance";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { deviceTimeZone } from "@/lib/solo/time";
import { CardSkeleton, WriteError } from "./parts";
import styles from "./fasting.module.css";

/** A number the member steps with real buttons or types; always inside its bounds and step. */
function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step,
  downLabel,
  upLabel,
  unit,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  downLabel: string;
  upLabel: string;
  unit?: string;
}) {
  const id = useId();
  const snap = (n: number) => clampTo(step === 1 ? Math.round(n) : roundHalf(n), min, max);
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <button type="button" className="btn-ghost-v2" style={{ height: 44, width: 44, padding: 0 }} aria-label={downLabel} onClick={() => onChange(snap(value - step))}>
          &minus;
        </button>
        <input
          id={id}
          type="number"
          className={styles.field}
          style={{ width: 96, textAlign: "center" }}
          value={Number.isFinite(value) ? value : ""}
          min={min}
          max={max}
          step={step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (e.target.value !== "" && Number.isFinite(n)) onChange(n);
          }}
          onBlur={() => onChange(snap(value))}
        />
        <button type="button" className="btn-ghost-v2" style={{ height: 44, width: 44, padding: 0 }} aria-label={upLabel} onClick={() => onChange(snap(value + step))}>
          +
        </button>
        {unit && (
          <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

const TABS: { key: TargetTab; label: string }[] = [
  { key: "weight", label: TARGETS_COPY.tabWeight },
  { key: "fasting", label: TARGETS_COPY.tabFasting },
  { key: "water", label: TARGETS_COPY.tabWater },
];

/** The targets page: always ranges, optional, removable, progress in plain text only. */
export function TargetsContent() {
  const online = useOnline();
  const targets = useTargets();
  const [tab, setTab] = useState<TargetTab>("weight");

  return (
    <>
      <PageHeader
        eyebrow={PROGRESS_PAGE_COPY.eyebrow}
        title={TARGETS_COPY.title}
        subtitle={TARGETS_COPY.intro}
        actions={
          <Link href={SOLO_HREFS.progress} className="btn-ghost-v2" style={{ height: 44 }}>
            {PROGRESS_PAGE_COPY.backToProgress}
          </Link>
        }
      />
      {!online && (
        <div role="status" className="mb-3.5 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
          {TARGETS_COPY.needsConnection}
        </div>
      )}
      {targets.isLoading ? (
        <div role="status" aria-label="Loading your targets">
          <CardSkeleton height={320} />
        </div>
      ) : targets.isError || !targets.data ? (
        <DSCard className="p-6">
          <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
            {STATE_COPY.errorTitle}
          </h2>
          <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
            {STATE_COPY.errorBody}
          </p>
          <button type="button" className="btn-primary-v2 mt-3" style={{ height: 44 }} onClick={() => void targets.refetch()}>
            {STATE_COPY.retry}
          </button>
        </DSCard>
      ) : (
        <DSCard className="max-w-[760px] p-6">
          <ChipGroup
            label="Which target"
            options={TABS.map((t) => ({ value: t.key, label: t.label, category: TARGET_CATEGORY[t.key], icon: TARGET_ICON[t.key] }))}
            value={tab}
            onChange={setTab}
          />
          <div className="mt-5">
            {tab === "weight" && <WeightForm targets={targets.data} online={online} />}
            {tab === "fasting" && <FastingForm targets={targets.data} online={online} />}
            {tab === "water" && <WaterForm targets={targets.data} online={online} />}
          </div>
        </DSCard>
      )}
    </>
  );
}

/** The shared Save / Remove row and its plain messages. */
function SaveRow({
  has,
  online,
  pending,
  invalid,
  onSave,
  onRemove,
  message,
  refused,
}: {
  has: boolean;
  online: boolean;
  pending: boolean;
  invalid: string | null;
  onSave: () => void;
  onRemove: () => void;
  message: { kind: "saved" | "removed" | "error"; text: string } | null;
  refused?: boolean;
}) {
  return (
    <div className="mt-4">
      {invalid && (
        <p role="alert" className={`${styles.error} mb-2`}>
          {invalid}
        </p>
      )}
      {refused && (
        <p role="alert" className={`${styles.error} mb-2`} data-testid="target-refused">
          {TARGET_BELOW_SUPPORTED_RANGE_LINE}
        </p>
      )}
      {message?.kind === "error" && <WriteError message={message.text} />}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-primary-v2" style={{ height: 44 }} disabled={!!invalid || pending || !online} onClick={onSave}>
          {/* Drawn once the save has landed, then held with the status line. */}
          {message?.kind === "saved" && <SaveCheck />}
          {has ? "Save changes" : TARGETS_COPY.save}
        </button>
        {has && (
          <button type="button" className="btn-ghost-v2" style={{ height: 44 }} disabled={pending || !online} onClick={onRemove}>
            {TARGETS_COPY.remove}
          </button>
        )}
      </div>
      <p role="status" className="mt-2 text-[13.5px]" style={{ color: "var(--fg-2)" }}>
        {message && message.kind !== "error" ? message.text : ""}
      </p>
    </div>
  );
}

function Preview({ title, line }: { title: string; line: string }) {
  return (
    <div className="mt-5 rounded-(--r-2) p-4" style={{ background: "var(--bg-2)" }} data-testid="target-preview">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
        {TARGETS_COPY.previewEyebrow}
      </p>
      <p className="mt-1 text-[15px] font-medium" style={{ color: "var(--ink)" }}>
        {title}
      </p>
      <p className="mt-1 text-[14px]" style={{ color: "var(--fg-2)" }}>
        {line}
      </p>
      <p className="mt-2 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
        {TARGETS_COPY.previewNote}
      </p>
    </div>
  );
}

type Msg = { kind: "saved" | "removed" | "error"; text: string } | null;

function useSaver(online: boolean) {
  const update = useUpdateTargets();
  const [message, setMessage] = useState<Msg>(null);
  const [refused, setRefused] = useState(false);
  const run = (input: UpdateTargetsInput, ok: string) => {
    if (!online) {
      setMessage({ kind: "error", text: OFFLINE_WRITE_MESSAGE });
      return;
    }
    setMessage(null);
    setRefused(false);
    update.mutate(input, {
      onSuccess: () => setMessage({ kind: ok === TARGETS_COPY.removed ? "removed" : "saved", text: ok }),
      onError: (e) => {
        // The API decides the limit; the page only shows the one plain line.
        if (e.code === TARGET_BELOW_SUPPORTED_RANGE) setRefused(true);
        else setMessage({ kind: "error", text: TARGETS_COPY.saveFailed });
      },
    });
  };
  return { run, pending: update.isPending, message, refused };
}

function WeightForm({ targets, online }: { targets: MemberTargets; online: boolean }) {
  const tz = deviceTimeZone();
  const compare = useWeightCompare("4w", tz, true);
  const avg = compare.data?.now?.average ?? null;
  const existing = targets.weight_range;

  // The starting numbers come from the member's own weekly average, so wait for
  // it before drawing the steppers (their state is seeded once, from this).
  if (!existing && avg === null) {
    if (compare.isLoading) return <CardSkeleton height={120} />;
    return (
      <p className="text-[14.5px]" style={{ color: "var(--fg-2)" }} data-testid="no-weight-yet">
        {TARGETS_COPY.noWeightYet}
      </p>
    );
  }
  if (!existing && compare.isLoading) return <CardSkeleton height={120} />;
  const seed = existing ?? { min_kg: roundHalf((avg ?? 0) - 1), max_kg: roundHalf((avg ?? 0) + 1) };
  return <WeightFormBody existing={existing} seed={seed} avg={avg} online={online} />;
}

function WeightFormBody({
  existing,
  seed,
  avg,
  online,
}: {
  existing: WeightRange | null;
  seed: WeightRange;
  avg: number | null;
  online: boolean;
}) {
  const [lo, setLo] = useState(seed.min_kg);
  const [hi, setHi] = useState(seed.max_kg);
  const saver = useSaver(online);
  const invalid = lo > hi ? "The first number must not be above the second." : null;
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
        {TARGETS_COPY.weightEyebrow}
      </p>
      <div className="mt-2 flex flex-wrap gap-5">
        <Stepper label={TARGETS_COPY.from} value={lo} onChange={setLo} min={WEIGHT_BOUNDS.min} max={WEIGHT_BOUNDS.max} step={WEIGHT_STEP_KG} downLabel="Lower the start" upLabel="Raise the start" unit="kg" />
        <Stepper label={TARGETS_COPY.to} value={hi} onChange={setHi} min={WEIGHT_BOUNDS.min} max={WEIGHT_BOUNDS.max} step={WEIGHT_STEP_KG} downLabel="Lower the end" upLabel="Raise the end" unit="kg" />
      </div>
      <p className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
        {TARGETS_COPY.weightStep}
      </p>
      <SaveRow
        has={!!existing}
        online={online}
        pending={saver.pending}
        invalid={invalid}
        message={saver.message}
        refused={saver.refused}
        onSave={() => saver.run({ weight_range: { min_kg: lo, max_kg: hi } }, TARGETS_COPY.saved)}
        onRemove={() => saver.run({ weight_range: null }, TARGETS_COPY.removed)}
      />
      <Preview title={weightRangeSentence(lo, hi)} line={weightPreview(avg, lo, hi)} />
    </div>
  );
}

function FastingForm({ targets, online }: { targets: MemberTargets; online: boolean }) {
  const tz = deviceTimeZone();
  const today = dayKeyOf(new Date());
  const win = windowOf(today, 7);
  const series = useSeries({ metric: "fasting_hours", from: win.from, to: today, tz, bucket: "day", enabled: true });
  const avg = useMemo(() => fastAverage(fastDays(series.data?.points ?? [], today, 7)).average, [series.data, today]);
  const existing = targets.fasting_window;
  const [lo, setLo] = useState(existing?.min_hours ?? 16);
  const [hi, setHi] = useState(existing?.max_hours ?? 18);
  const [days, setDays] = useState(existing?.days_per_week ?? 5);
  const saver = useSaver(online);
  const invalid = lo > hi ? "The shorter fast must not be longer than the longer one." : null;
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
        {TARGETS_COPY.fastingEyebrow}
      </p>
      <div className="mt-2 flex flex-wrap gap-5">
        <Stepper label={TARGETS_COPY.fromHours} value={lo} onChange={setLo} min={FASTING_BOUNDS.min} max={FASTING_BOUNDS.max} step={FASTING_STEP_HOURS} downLabel="Fewer hours at the start" upLabel="More hours at the start" unit="h" />
        <Stepper label={TARGETS_COPY.toHours} value={hi} onChange={setHi} min={FASTING_BOUNDS.min} max={FASTING_BOUNDS.max} step={FASTING_STEP_HOURS} downLabel="Fewer hours at the end" upLabel="More hours at the end" unit="h" />
        <Stepper label={TARGETS_COPY.daysWeek} value={days} onChange={setDays} min={1} max={7} step={1} downLabel="One day fewer" upLabel="One day more" />
      </div>
      <p className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
        {TARGETS_COPY.fastingCap}
      </p>
      <SaveRow
        has={!!existing}
        online={online}
        pending={saver.pending}
        invalid={invalid}
        message={saver.message}
        onSave={() => saver.run({ fasting_window: { min_hours: lo, max_hours: hi, days_per_week: days } }, TARGETS_COPY.saved)}
        onRemove={() => saver.run({ fasting_window: null }, TARGETS_COPY.removed)}
      />
      <Preview title={fastingWindowSentence(lo, hi, days)} line={fastingPreview(avg, lo, hi)} />
    </div>
  );
}

function WaterForm({ targets, online }: { targets: MemberTargets; online: boolean }) {
  const water = useWaterToday(true);
  const existing = targets.water_glasses;
  const [aim, setAim] = useState(existing ?? 8);
  const saver = useSaver(online);
  const count = water.data?.glasses ?? 0;
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
        {TARGETS_COPY.waterEyebrow}
      </p>
      <div className="mt-2">
        <Stepper label="Glasses a day" value={aim} onChange={setAim} min={WATER_BOUNDS.min} max={WATER_BOUNDS.max} step={1} downLabel="One glass fewer" upLabel="One glass more" unit={TARGETS_COPY.waterUnit} />
      </div>
      <p className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
        {TARGETS_COPY.waterNoAdvice}
      </p>
      <SaveRow
        has={existing !== null}
        online={online}
        pending={saver.pending}
        invalid={null}
        message={saver.message}
        onSave={() => saver.run({ water_glasses: aim }, TARGETS_COPY.saved)}
        onRemove={() => saver.run({ water_glasses: null }, TARGETS_COPY.removed)}
      />
      <Preview title={waterAimSentence(aim)} line={waterPreview(count, aim)} />
    </div>
  );
}
