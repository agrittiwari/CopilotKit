import { render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import { ToolCallStatus } from "@copilotkit/core";
import type { CopilotKitCoreSvelte } from "../../lib/svelte-core";
import type { CopilotKitContextValue } from "../../providers/context";
import Harness from "./register-component-harness.svelte";

function createMockContext() {
  const core = {
    agents: {},
    getAgent: vi.fn(),
    getTool: vi.fn(),
    addHookFrontendTool: vi.fn(),
    removeHookFrontendTool: vi.fn(),
    addHookRenderToolCall: vi.fn(),
    removeHookRenderToolCall: vi.fn(),
    getSuggestions: vi.fn(() => ({ suggestions: [], isLoading: false })),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    reloadSuggestions: vi.fn(),
    clearSuggestions: vi.fn(),
    addSuggestionsConfig: vi.fn(),
    removeSuggestionsConfig: vi.fn(),
  } as unknown as CopilotKitCoreSvelte;

  return {
    copilotkit: core,
    executingToolCallIds: new Set<string>(),
    agents: core.agents,
    runtimeConnectionStatus: "disconnected",
    runtimeUrl: undefined,
    runtimeTransport: "auto",
    headers: {},
    threadEndpoints: undefined,
    intelligence: undefined,
    licenseStatus: undefined,
  } as CopilotKitContextValue;
}

describe("registerComponent", () => {
  it("registers a frontend tool with a component description plus a renderer", () => {
    const context = createMockContext();
    render(Harness, { props: { context } });

    const addTool = context.copilotkit.addHookFrontendTool as ReturnType<
      typeof vi.fn
    >;
    const addRenderer = context.copilotkit.addHookRenderToolCall as ReturnType<
      typeof vi.fn
    >;

    expect(addTool).toHaveBeenCalledTimes(1);
    expect(addTool).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "showProfile",
        description: expect.stringContaining(
          'Use this tool to display the "showProfile" component in the chat.',
        ),
      }),
    );
    expect(
      (addTool.mock.calls[0] as Array<{ description?: string }>)[0]
        ?.description,
    ).toContain("Shows a user profile");
    expect(addRenderer).toHaveBeenCalledTimes(1);
    expect(addRenderer).toHaveBeenCalledWith(
      expect.objectContaining({ name: "showProfile" }),
    );
  });

  it("adapts core renderer args to component parameters (public render contract covered in components/register-component.test.ts)", () => {
    const context = createMockContext();
    const view = render(Harness, { props: { context } });

    // The registered core renderer receives the internal RenderToolProps shape
    // ({ args, ... }); the adapter maps args -> parameters for the public
    // component render. The end-to-end painted output is asserted through the
    // real CopilotChatMessageView path in
    // components/register-component.test.ts.
    const addRenderer = context.copilotkit.addHookRenderToolCall as ReturnType<
      typeof vi.fn
    >;
    const adaptedRender = (
      addRenderer.mock.calls[0] as Array<{
        render: (props: unknown) => unknown;
      }>
    )[0]?.render;
    expect(
      adaptedRender?.({
        name: "showProfile",
        toolCallId: "call-1",
        args: { userId: "u-1" },
        status: ToolCallStatus.Complete,
        result: "ok",
      }),
    ).toBe("profile:u-1");

    view.unmount();

    const removeTool = context.copilotkit.removeHookFrontendTool as ReturnType<
      typeof vi.fn
    >;
    const removeRenderer = context.copilotkit
      .removeHookRenderToolCall as ReturnType<typeof vi.fn>;
    expect(removeTool).toHaveBeenCalledWith("showProfile", undefined);
    expect(removeRenderer).toHaveBeenCalledWith("showProfile", undefined);
  });

  it("throws if used outside CopilotKitProvider", () => {
    expect(() => {
      render(Harness, {
        props: { context: null as unknown as CopilotKitContextValue },
      });
    }).toThrow("registerFrontendTool must be used within CopilotKitProvider");
  });
});
