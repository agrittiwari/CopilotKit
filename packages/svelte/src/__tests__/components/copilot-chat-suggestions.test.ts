import { render, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Harness from "./copilot-chat-suggestions-harness.svelte";

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

describe("CopilotChat configured suggestions", () => {
  it("renders statically configured suggestions from configureSuggestions", async () => {
    const view = render(Harness);

    await waitFor(() =>
      expect(view.getByText("Plan a trip for me")).toBeTruthy(),
    );
  });
});
