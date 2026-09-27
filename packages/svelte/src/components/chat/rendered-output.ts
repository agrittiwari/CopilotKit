import type { Snippet } from "svelte";

/**
 * Predicate for custom/activity renderer output.
 *
 * Mirrors what {@link CopilotChatRenderedOutput} can actually paint:
 * plain text (`string`/`number`) passes through, snippet functions render
 * via `{@render}`, and everything else (`null`, `undefined`, `false`,
 * booleans, objects, arrays, …) is not renderable. Callers use this to fall
 * through to the next renderer (custom) or the generic fallback (activity)
 * instead of producing terminal blank output.
 */
export function isRenderableOutput(
  value: unknown,
): value is string | number | Snippet {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "function"
  );
}
