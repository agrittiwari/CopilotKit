import { render, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Harness from "./prebuilt-custom-activity-harness.svelte";
import WildcardHarness from "./prebuilt-activity-wildcard-harness.svelte";

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

// Custom/activity renderer output renders as bare text nodes sharing one
// parent, so assert on textContent instead of getByText exact matching.
function renderedText(view: { container: HTMLElement }, text: string) {
  return view.container.textContent?.includes(text) ?? false;
}

describe("prebuilt chat custom/activity rendering", () => {
  it("wraps messages with custom before/after renderers", async () => {
    const view = render(Harness);

    await waitFor(() =>
      expect(renderedText(view, "custom:before:user-1")).toBe(true),
    );
    expect(renderedText(view, "custom:after:user-1")).toBe(true);
    expect(renderedText(view, "custom:before:activity-1")).toBe(true);
    expect(renderedText(view, "custom:after:activity-1")).toBe(true);
    // The wrapped user message still renders underneath.
    expect(view.getByText("hello")).toBeTruthy();
  });

  it("renders a matching activity renderer with validated content", async () => {
    const view = render(Harness);

    await waitFor(() =>
      expect(renderedText(view, "activity:weather-card:London")).toBe(true),
    );
  });

  it("falls back for unmatched and agent-scoped-mismatched activity", async () => {
    const view = render(Harness);

    await waitFor(() =>
      expect(view.getAllByTestId("copilot-activity-fallback")).toHaveLength(2),
    );
    expect(view.queryByText("scoped:Paris")).toBeNull();
  });

  it("uses a global activity wildcard when no named renderer matches", async () => {
    const view = render(WildcardHarness);

    await waitFor(() =>
      expect(view.getByText("wild:audit:activity-w")).toBeTruthy(),
    );
    expect(view.queryByTestId("copilot-activity-fallback")).toBeNull();
  });
});
