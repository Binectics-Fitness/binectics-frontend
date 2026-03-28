import type { UseFormSetError, FieldValues, Path } from "react-hook-form";

/**
 * Maps API validation errors to React Hook Form field errors.
 *
 * Handles two API response shapes:
 * - `{ errors: { field: ["msg1", "msg2"] } }` — field-level validation errors
 * - `{ error: "message" }` — general error string
 *
 * Returns any non-field errors as a string array for banner display.
 */
export function mapApiErrors<T extends FieldValues>(
  result: {
    error?: string;
    errors?: Record<string, string[]>;
  },
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
): string[] {
  const unmappedErrors: string[] = [];

  if (result.errors && typeof result.errors === "object") {
    for (const [field, messages] of Object.entries(result.errors)) {
      if (!Array.isArray(messages) || messages.length === 0) continue;

      if (knownFields.includes(field)) {
        setError(field as Path<T>, { message: messages[0] });
      } else {
        unmappedErrors.push(...messages);
      }
    }
  }

  if (result.error) {
    unmappedErrors.push(result.error);
  }

  return unmappedErrors;
}
