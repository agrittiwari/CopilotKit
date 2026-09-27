import { render, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Harness from "./register-component-harness.svelte";

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

describe("registerComponent chat rendering", () => {
  it("renders the composed component output for a matching tool call", async () => {
    const view = render(Harness);

    await waitFor(() =>
      expect(view.container.textContent).toContain("profile:u-1"),
    );
  });
});
