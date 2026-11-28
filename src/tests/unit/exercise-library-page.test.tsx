import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import ExerciseLibraryView from "@/components/exercises/ExerciseLibraryView";
import { withLibraryItem, type NavSection } from "@/components/ds/ProviderShell";
import { gymSidebarFor, gymViewer, GYM_NAV_ACCESS } from "@/lib/gymStaffNav";
import { normalizeLibrary } from "@/lib/exercises/library";

const state = vi.hoisted(() => ({ on: true, flagsLoading: false, load: "ready" as "ready" | "failed" | "down", fetches: 0 }));
vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({ isEnabled: (k: string) => k === "exercise_library_page" && state.on, isLoading: state.flagsLoading, data: undefined }),
  useFeatureFlag: (k: string) => k === "exercise_library_page" && state.on,
}));

const row = (id: string, name: string, category: string, equipment: string, extra: object = {}) => ({
  id, name, category, equipment, variants: [], primary_muscles: ["Chest"], steps: ["Step one."], cues: ["Cue one."], ...extra,
});
const library = normalizeLibrary({
  available: true,
  exercises: [
    row("goblet-squat", "Goblet Squat", "Squat", "dumbbells", { member_text_approved: true, primary_muscles: ["Buttocks (glutes)"] }),
    row("barbell-deadlift", "Barbell Deadlift", "Hinge", "barbell", { member_text_approved: false, primary_muscles: ["Buttocks (glutes)"] }),
    row("treadmill", "Treadmill", "Cardio", "cardio machine", { member_text_approved: true, steps: undefined, cues: undefined }),
    row("band-pull-apart", "Band Pull-Apart", "Pull", "resistance band", { member_text_approved: true }),
  ],
});
vi.mock("@/components/programs/exerciseLibraryCache", () => ({
  loadLibrary: () => {
    state.fetches += 1;
    if (state.load === "failed") return Promise.resolve({ status: "failed" });
    if (state.load === "down") return Promise.resolve({ status: "ready", library: { available: false, exercises: [] } });
    return Promise.resolve({ status: "ready", library });
  },
}));

beforeEach(() => {
  state.on = true;
  state.flagsLoading = false;
  state.load = "ready";
  state.fetches = 0;
});

describe("Library page", () => {
  it("lists every exercise and tags each Illustrated or Text only, from the art this app ships", async () => {
    render(<ExerciseLibraryView audience="trainer" />);
    await screen.findByText("Goblet Squat");
    expect(screen.getByText("4 of 4")).toBeTruthy();
    const goblet = screen.getByRole("button", { name: "Open Goblet Squat" });
    expect(within(goblet).getByText("Illustrated")).toBeTruthy();
    // No art is bundled for these: shown, never hidden, tagged honestly.
    for (const n of ["Barbell Deadlift", "Treadmill", "Band Pull-Apart"]) {
      expect(within(screen.getByRole("button", { name: `Open ${n}` })).getByText("Text only")).toBeTruthy();
    }
    expect(screen.getByText(/General guidance, not medical advice\./)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/certified|reviewed by experts/i);
  });

  it("searches by name, filters by category chip and equipment, and clears", async () => {
    render(<ExerciseLibraryView audience="trainer" />);
    await screen.findByText("Goblet Squat");
    fireEvent.change(screen.getByLabelText("Search exercises"), { target: { value: "dead zzz" } });
    expect(screen.getByText("0 of 4")).toBeTruthy();
    expect(screen.getByText("No exercise matches.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search exercises"), { target: { value: "barbell dead" } });
    expect(screen.getByText("1 of 4")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(screen.getByText("4 of 4")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Pull/ }));
    expect(screen.getByText("1 of 4")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open Band Pull-Apart" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /^Pull/ }));
    fireEvent.click(screen.getByRole("button", { name: /^dumbbells/ }));
    expect(screen.getByText("1 of 4")).toBeTruthy();
  });

  it("switches between list and grid without losing the results", async () => {
    render(<ExerciseLibraryView audience="trainer" />);
    await screen.findByText("Goblet Squat");
    fireEvent.click(screen.getByRole("button", { name: "Grid" }));
    expect(screen.getByRole("button", { name: "Grid" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Open Treadmill" })).toBeTruthy();
  });

  it("opens the detail with steps and cues; notes where members do not see the text", async () => {
    render(<ExerciseLibraryView audience="trainer" />);
    await screen.findByText("Goblet Squat");
    fireEvent.click(screen.getByRole("button", { name: "Open Barbell Deadlift" }));
    const detail = await screen.findByTestId("library-detail");
    expect(within(detail).getByText("Step one.")).toBeTruthy();
    expect(within(detail).getByText(/Members and clients do not see this written text yet/)).toBeTruthy();
  });

  it("an approved exercise carries no withheld note; a text-less one says so", async () => {
    render(<ExerciseLibraryView audience="dietitian" />);
    await screen.findByText("Goblet Squat");
    fireEvent.click(screen.getByRole("button", { name: "Open Goblet Squat" }));
    expect(within(await screen.findByTestId("library-detail")).queryByText(/do not see this written text/)).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Open Treadmill" }));
    await waitFor(() => expect(screen.getAllByText(/No written steps for this exercise yet/).length).toBeGreaterThan(0));
  });

  it("gym role reads the same list under a read-only subtitle", async () => {
    render(<ExerciseLibraryView audience="gym" />);
    await screen.findByText("Goblet Squat");
    expect(screen.getByText(/Read-only reference for your team/)).toBeTruthy();
  });

  it("shows an error with a retry when the library fails to load", async () => {
    state.load = "failed";
    render(<ExerciseLibraryView audience="trainer" />);
    await screen.findByText("The exercise library did not load.");
    state.load = "ready";
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Goblet Squat");
  });

  it("says so when the index is down", async () => {
    state.load = "down";
    render(<ExerciseLibraryView audience="trainer" />);
    await screen.findByText("The exercise library is not available right now.");
  });

  it("flag off: a plain note, and the library is never fetched", async () => {
    state.on = false;
    render(<ExerciseLibraryView audience="trainer" />);
    expect(screen.getByText(/not switched on for your account yet/)).toBeTruthy();
    expect(state.fetches).toBe(0);
  });
});

describe("Library nav item", () => {
  const sections: NavSection[] = [{ label: "Practice", items: [{ name: "Programs", href: "/p", icon: null }, { name: "Plans", href: "/x", icon: null }] }];
  it("is added after Programs only while the flag is on", () => {
    expect(withLibraryItem(sections, false, "/l", "Programs")).toBe(sections);
    const on = withLibraryItem(sections, true, "/l", "Programs");
    expect(on[0].items.map((i) => i.name)).toEqual(["Programs", "Library", "Plans"]);
    expect(on[0].items[1].href).toBe("/l");
    expect(withLibraryItem(sections, true, "/l", "Nope")[0].items).toHaveLength(2);
  });
  it("gym staff keep it: it is read-only reference open to every role", () => {
    expect(GYM_NAV_ACCESS.Library).toBeDefined();
    const staff = gymViewer({ is_owner: false, my_permissions: [] }, "u");
    const out = gymSidebarFor([{ label: "Workspace", items: [{ name: "Library" }, { name: "Billing" }] }], staff);
    expect(out[0].items.map((i) => i.name)).toEqual(["Library"]);
  });
});
