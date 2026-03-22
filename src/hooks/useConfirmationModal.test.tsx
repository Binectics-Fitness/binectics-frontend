import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useConfirmationModal } from "./useConfirmationModal";
import { showAlert } from "@/lib/ui/dialogs";

vi.mock("@/lib/ui/dialogs", () => ({
  showAlert: vi.fn().mockResolvedValue(undefined),
}));

function TestHarness({
  onConfirm,
}: {
  onConfirm: () => void | Promise<void>;
}) {
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          requestConfirmation({
            title: "Confirm action",
            description: "Proceed with action",
            confirmLabel: "Proceed",
            onConfirm,
          })
        }
      >
        Open Modal
      </button>
      {confirmationModal}
    </>
  );
}

describe("useConfirmationModal", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("executes onConfirm and closes modal on success", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<TestHarness onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Open Modal" }));
    fireEvent.click(screen.getByRole("button", { name: "Proceed" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByText("Confirm action")).not.toBeInTheDocument();
    });
  });

  it("shows alert and keeps modal open when onConfirm fails", async () => {
    const onConfirm = vi.fn().mockRejectedValue(new Error("boom"));
    render(<TestHarness onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: "Open Modal" }));
    fireEvent.click(screen.getByRole("button", { name: "Proceed" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(showAlert).toHaveBeenCalledWith(
        "This action could not be completed. Please try again.",
      );
    });

    expect(screen.getByText("Confirm action")).toBeInTheDocument();
  });
});
