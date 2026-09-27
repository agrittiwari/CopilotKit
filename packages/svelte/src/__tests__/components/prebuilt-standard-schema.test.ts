import { render, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Harness from "./prebuilt-standard-schema-harness.svelte";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(JSON.stringify({ version: "test", agents: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    ),
  );
});

afterEach(() => vi.unstubAllGlobals());

function renderedText(view: { container: HTMLElement }, text: string) {
  return view.container.textContent?.includes(text) ?? false;
}

describe("prebuilt chat standard-schema validation and output fallback", () => {
  it("renders a non-Zod Standard Schema activity renderer", async () => {
    const view = render(Harness);

    await waitFor(() => expect(renderedText(view, "std:Oslo")).toBe(true));
  });

  it("falls back on validation issues and async validation", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const view = render(Harness);

      await waitFor(() =>
        expect(
          view.getAllByTestId("copilot-activity-fallback").length,
        ).toBeGreaterThanOrEqual(3),
      );
      // Invalid content, async validation, and undefined renderer output all
      // fall back instead of rendering blank or throwing.
      expect(view.queryByText("weather:42")).toBeNull();
      expect(renderedText(view, "async:X")).toBe(false);
      expect(warn).toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it("falls through invalid custom renderer output to the next renderer", async () => {
    const view = render(Harness);

    // true/object outputs are skipped; the third renderer paints user-1.
    await waitFor(() =>
      expect(renderedText(view, "custom:ok:user-1")).toBe(true),
    );
    // user-2 has only invalid custom output, so the message itself still
    // renders with no custom wrapper text.
    await waitFor(() => expect(renderedText(view, "hello two")).toBe(true));
    expect(renderedText(view, "custom:ok:user-2")).toBe(false);
  });
});
