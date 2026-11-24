"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { GymClass, CreateGymClassRequest } from "@/lib/api/classes";
import { MemberStatus, teamsService, type OrganizationLocation, type TeamRole } from "@/lib/api/teams";
import SearchableSelect from "@/components/SearchableSelect";
import { Eyebrow } from "@/components/ds";

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "h-9 rounded-(--r-2) px-3 text-[13.5px]";

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Instructor picker value for someone from outside the team (typed name). */
const OTHER_INSTRUCTOR = "__other";
/** The seeded "Consultant / Trainer" team role: listed first. */
const TRAINER_ROLE_CODE = "consultant";

export interface InstructorOption {
  userId: string;
  name: string;
  isTrainer: boolean;
}

/**
 * The gym's active locations, for "where does the class run". Empty while
 * loading or when they can't be read: then the form asks nothing and the API
 * decides.
 */
export function useClassLocations(orgId: string | undefined) {
  return useQuery<OrganizationLocation[]>({
    queryKey: ["classForm", "locations", orgId ?? ""],
    queryFn: async () => {
      const res = await teamsService.getLocations(orgId!);
      return res.success && res.data ? res.data.filter((l) => l.is_active !== false) : [];
    },
    enabled: !!orgId,
  });
}

/**
 * Who can teach: the gym's active team members, trainers first. Null when
 * the team can't be read, so the form falls back to a typed name.
 */
function useInstructorOptions(orgId: string | undefined) {
  return useQuery<InstructorOption[] | null>({
    queryKey: ["classForm", "team", orgId ?? ""],
    queryFn: async () => {
      const res = await teamsService.getMembers(orgId!);
      if (!res.success || !res.data) return null;
      return res.data
        .filter((m) => m.status === MemberStatus.ACTIVE && typeof m.user_id === "object" && m.user_id)
        .map((m) => {
          const u = m.user_id as { _id: string; first_name?: string; last_name?: string; email?: string };
          const role = typeof m.team_role_id === "object" ? (m.team_role_id as TeamRole) : null;
          const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || u.email || "Team member";
          return { userId: u._id, name, isTrainer: role?.code === TRAINER_ROLE_CODE };
        })
        .sort((a, b) => Number(b.isTrainer) - Number(a.isTrainer) || a.name.localeCompare(b.name));
    },
    enabled: !!orgId,
  });
}

interface ClassFormProps {
  /** The gym: its locations and team fill the Location and Instructor pickers. */
  organizationId?: string;
  initial?: GymClass;
  saving: boolean;
  error?: string | null;
  onSubmit: (data: CreateGymClassRequest) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

/** Shared create/edit form for a weekly class. */
export function ClassForm({ organizationId, initial, saving, error, onSubmit, onCancel, submitLabel = "Save class" }: ClassFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [instructor, setInstructor] = useState(initial?.instructor_name ?? "");
  // A team member's user id, OTHER_INSTRUCTOR for a typed name, or "" for none.
  const [instructorId, setInstructorId] = useState<string>(
    initial?.instructor_user_id ? initial.instructor_user_id : initial?.instructor_name ? OTHER_INSTRUCTOR : "",
  );
  const [locationId, setLocationId] = useState(initial?.location_id ?? "");
  const { data: locations = [] } = useClassLocations(organizationId);
  const { data: team, isLoading: teamLoading } = useInstructorOptions(organizationId);
  // With one club there is nothing to choose; with more, the class must say.
  const askLocation = locations.length > 1;
  // No team to pick from (none yet, or it couldn't be read): type a name.
  const pickFromTeam = !!team && team.length > 0;
  const typedName = !pickFromTeam || instructorId === OTHER_INSTRUCTOR;
  const [day, setDay] = useState(initial?.day_of_week ?? 1);
  const [time, setTime] = useState(initial?.start_time ?? "06:30");
  const [duration, setDuration] = useState(initial?.duration_minutes ?? 60);
  const [capacity, setCapacity] = useState(initial?.capacity ?? 16);
  const [waitlist, setWaitlist] = useState(initial?.waitlist_enabled ?? true);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  /**
   * The instructor fields to send. A team member goes by their id (the API
   * stores their account name). "Someone else" or nobody unlinks the class
   * and sends the typed name ("" for nobody). Without the team list (it
   * couldn't be read), only a changed name is sent, so a class linked to a
   * team member isn't unlinked by an untouched field.
   */
  const instructorPayload = (): Pick<CreateGymClassRequest, "instructor_user_id" | "instructor_name"> => {
    const typed = instructor.trim();
    if (pickFromTeam) {
      if (instructorId && instructorId !== OTHER_INSTRUCTOR) return { instructor_user_id: instructorId };
      return { instructor_user_id: null, instructor_name: instructorId === OTHER_INSTRUCTOR ? typed : "" };
    }
    if (initial && typed === (initial.instructor_name ?? "")) return {};
    return { instructor_name: typed || undefined };
  };

  const submit = () => {
    if (!name.trim()) return setLocalError("Give the class a name.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return setLocalError("Choose a start time.");
    if (askLocation && !locations.some((l) => l._id === locationId)) {
      return setLocalError("Choose where the class runs.");
    }
    setLocalError(null);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      ...instructorPayload(),
      ...(askLocation ? { location_id: locationId } : {}),
      day_of_week: day,
      start_time: time,
      duration_minutes: Math.min(240, Math.max(15, duration)),
      capacity: Math.min(500, Math.max(1, capacity)),
      waitlist_enabled: waitlist,
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Class name</Eyebrow>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        {pickFromTeam ? (
          <div className="flex flex-col gap-1.5">
            <Eyebrow as="label" htmlFor="class-instructor">Instructor</Eyebrow>
            <SearchableSelect
              id="class-instructor"
              value={instructorId}
              onChange={setInstructorId}
              placeholder="Choose from your team"
              options={[
                ...team!.map((m) => ({ label: m.name, value: m.userId })),
                { label: "Someone else", value: OTHER_INSTRUCTOR },
              ]}
            />
          </div>
        ) : (
          <label className="flex flex-col gap-1.5">
            <Eyebrow as="span">Instructor</Eyebrow>
            <input value={instructor} onChange={(e) => setInstructor(e.target.value)} maxLength={100}
              placeholder={teamLoading ? "Loading team…" : "optional"} className={INPUT_CLASS} style={INPUT_STYLE} />
          </label>
        )}
      </div>
      {(askLocation || (pickFromTeam && typedName)) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {askLocation && (
            <div className="flex flex-col gap-1.5">
              <Eyebrow as="label" htmlFor="class-location">Location</Eyebrow>
              <SearchableSelect
                id="class-location"
                value={locationId}
                onChange={setLocationId}
                placeholder="Where the class runs"
                options={locations.map((l) => ({ label: l.name, value: l._id }))}
              />
            </div>
          )}
          {pickFromTeam && typedName && (
            <label className="flex flex-col gap-1.5">
              <Eyebrow as="span">Instructor name</Eyebrow>
              <input value={instructor} onChange={(e) => setInstructor(e.target.value)} maxLength={100}
                placeholder="An instructor from outside your team" className={INPUT_CLASS} style={INPUT_STYLE} />
            </label>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Day</Eyebrow>
          <SearchableSelect
            value={String(day)}
            onChange={(v) => setDay(Number(v))}
            options={WEEKDAYS.map((d, i) => ({ label: d, value: String(i) }))}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Start time</Eyebrow>
          {/* Native time picker: its value is always 24-hour HH:mm, whatever
              clock the browser displays, so the format can't be typed wrong. */}
          <input type="time" step={60} required value={time} onChange={(e) => setTime(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Minutes</Eyebrow>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 60)} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Capacity</Eyebrow>
          <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 1)} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <Eyebrow as="span">Description</Eyebrow>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="optional"
          className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-y" style={{ ...INPUT_STYLE, minHeight: 60 }} />
      </label>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" checked={waitlist} onChange={(e) => setWaitlist(e.target.checked)} />
        <span className="text-[13px]" style={{ color: "var(--ink)" }}>Waitlist when full</span>
      </label>
      {(localError || error) && (
        <p className="text-[12.5px]" style={{ color: "var(--danger-ink)" }}>{localError || error}</p>
      )}
      <div className="flex gap-2">
        <button className="btn-primary-v2 sm" disabled={saving} onClick={submit}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button className="btn-ghost-v2 sm" disabled={saving} onClick={onCancel}>Cancel</button>
        )}
      </div>
    </div>
  );
}
