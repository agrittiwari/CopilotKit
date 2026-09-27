import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Harness from "./prebuilt-state-refresh-harness.svelte";

function renderedText(view: { container: HTMLElement }, text: string) {
  return view.container.textContent?.includes(text) ?? false;
}

describe("prebuilt chat state-snapshot refresh", () => {
  it("refreshes a custom renderer after the agent emits a state change", async () => {
    const view = render(Harness);

    await waitFor(() => expect(renderedText(view, "state:1")).toBe(true));
    // One view-level agent subscription, not one per message (two messages).
    await fireEvent.click(view.getByTestId("show-subs"));
    expect(view.getByTestId("agent-subs").textContent).toBe("1");

    await fireEvent.click(view.getByTestId("bump-state"));

    await waitFor(() => expect(renderedText(view, "state:2")).toBe(true));
  });
});
