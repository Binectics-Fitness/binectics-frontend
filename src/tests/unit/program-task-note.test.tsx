import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskInspector } from "@/components/programs/builder/TaskInspector";
import { BUILDER_COPY } from "@/components/programs/builder/copy";
import { newProgram, newTask } from "@/components/programs/builder/model";

/**
 * Demo finding 17 (Nov 2026): Create Program's "Note for your client" sat
 * inside a collapsed <details>, so the box was 0×0 until its label was
 * clicked. It is now an ordinary labelled textarea, always shown.
 */
describe("Create Program: Note for your client", () => {
  it("shows the note box without a click and saves what is typed", async () => {
    const program = newProgram("Strength base", 4);
    const task = newTask("habit", { phase: 0, existing: [] });
    const onChange = vi.fn();
    render(
      <TaskInspector program={program} task={task} showIssues={false} onChange={onChange} onRemove={vi.fn()} onClose={vi.fn()} />,
    );
    const box = screen.getByLabelText(BUILDER_COPY.inspector.note);
    expect(box.tagName).toBe("TEXTAREA");
    expect(box).toBeVisible();
    expect(box.closest("details")).toBeNull();
    await userEvent.type(box, "K");
    expect(onChange).toHaveBeenLastCalledWith({ detail: "K" });
  });
});
