import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Harness from "./prebuilt-agent-switch-harness.svelte";

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

describe("prebuilt chat agent switching", () => {
  it("re-scopes custom and activity renderers to the new chat agent", async () => {
    const view = render(Harness);

    await waitFor(() =>
      expect(renderedText(view, "custom-a:user-1")).toBe(true),
    );
    expect(renderedText(view, "scoped-a:Paris")).toBe(true);

    await fireEvent.click(view.getByTestId("switch-agent"));

    await waitFor(() =>
      expect(renderedText(view, "custom-b:user-1")).toBe(true),
    );
    expect(renderedText(view, "scoped-b:Paris")).toBe(true);
    expect(renderedText(view, "custom-a:user-1")).toBe(false);
    expect(renderedText(view, "scoped-a:Paris")).toBe(false);
  });
});
