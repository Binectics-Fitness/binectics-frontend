import { fireEvent, screen, waitFor } from "@testing-library/react";
import { showAlert, showPrompt } from "./dialogs";

describe("dialogs", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("resolves showAlert after confirming", async () => {
    const alertPromise = showAlert({
      title: "Heads up",
      message: "Something happened",
      buttonLabel: "Acknowledge",
    });

    expect(await screen.findByText("Heads up")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Acknowledge" }));

    await expect(alertPromise).resolves.toBeUndefined();
    await waitFor(() => {
      expect(screen.queryByText("Heads up")).not.toBeInTheDocument();
    });
  });

  it("returns entered value from showPrompt", async () => {
    const promptPromise = showPrompt({
      title: "Type value",
      message: "Enter name",
      confirmLabel: "Save",
      cancelLabel: "Dismiss",
      defaultValue: "",
    });

    const input = (await screen.findByRole("textbox")) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Daniel" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await expect(promptPromise).resolves.toBe("Daniel");
  });

  it("returns null when prompt is canceled", async () => {
    const promptPromise = showPrompt("Type anything");

    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    await expect(promptPromise).resolves.toBeNull();
  });
});
