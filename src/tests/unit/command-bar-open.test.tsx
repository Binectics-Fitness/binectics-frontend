import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommandBar } from "@/components/ds/CommandBar";
import { closeCommandBar } from "@/hooks/useCommandBar";

vi.mock("@/lib/queries/search", () => ({ useUnifiedSearch: () => ({ data: null, isLoading: false }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null }) }));

const pressCmdK = () => act(() => void fireEvent.keyDown(document, { key: "k", ctrlKey: true }));

describe("CommandBar opening and closing", () => {
  it("opens on Ctrl/Cmd+K, focuses the search, and starts empty the next time", async () => {
    render(<CommandBar />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    pressCmdK();
    const input = await screen.findByRole("textbox", { name: /Search, jump/ });
    await waitFor(() => expect(input).toHaveFocus());
    fireEvent.change(input, { target: { value: "help" } });
    expect(input).toHaveValue("help");

    act(() => closeCommandBar());
    await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());

    pressCmdK();
    expect(await screen.findByRole("textbox", { name: /Search, jump/ })).toHaveValue("");
    act(() => closeCommandBar());
  });
});
