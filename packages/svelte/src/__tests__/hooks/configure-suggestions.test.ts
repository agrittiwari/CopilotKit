import { render, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, it, vi } from "vitest";
import type { CopilotKitCoreSvelte } from "../../lib/svelte-core";
import type { CopilotKitContextValue } from "../../providers/context";
import Harness from "./configure-suggestions-harness.svelte";
import type { ConfigureSuggestionsInput } from "../../hooks/configure-suggestions.svelte";

function mockCore(overrides?: Record<string, unknown>) {
  const core = {
    agents: {},
    getAgent: vi.fn(() => undefined),
    subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    getSuggestions: vi.fn(() => ({ suggestions: [], isLoading: false })),
    reloadSuggestions: vi.fn(),
    clearSuggestions: vi.fn(),
    addSuggestionsConfig: vi.fn(() => "config-1"),
    removeSuggestionsConfig: vi.fn(),
    ...overrides,
  } as unknown as CopilotKitCoreSvelte;
  return core;
}

function mockContext(core: CopilotKitCoreSvelte): CopilotKitContextValue {
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

const STATIC = {
  suggestions: [{ title: "Plan a trip", message: "Plan a trip for me" }],
} satisfies ConfigureSuggestionsInput;

describe("configureSuggestions", () => {
  it("registers a normalized static config and reloads the chat agent on mount", async () => {
    const core = mockCore();
    const view = render(Harness, {
      props: {
        context: mockContext(core),
        config: STATIC,
        chatAgentId: "agent-a",
      },
    });
    expect(view).toBeTruthy();

    await waitFor(() => {
      expect(core.addSuggestionsConfig).toHaveBeenCalledTimes(1);
    });
    expect(core.addSuggestionsConfig).toHaveBeenCalledWith({
      suggestions: [
        {
          title: "Plan a trip",
          message: "Plan a trip for me",
          isLoading: false,
        },
      ],
    });
    expect(core.reloadSuggestions).toHaveBeenCalledWith("agent-a");
  });

  it("falls back to the default agent when there is no chat config", async () => {
    const core = mockCore();
    render(Harness, { props: { context: mockContext(core), config: STATIC } });

    await waitFor(() => {
      expect(core.reloadSuggestions).toHaveBeenCalledWith("default");
    });
  });

  it("respects an explicit consumerAgentId", async () => {
    const core = mockCore();
    render(Harness, {
      props: {
        context: mockContext(core),
        config: {
          consumerAgentId: "scoped",
          suggestions: [{ title: "t", message: "m" }],
        },
        chatAgentId: "agent-a",
      },
    });

    await waitFor(() => {
      expect(core.addSuggestionsConfig).toHaveBeenCalledWith(
        expect.objectContaining({ consumerAgentId: "scoped" }),
      );
    });
    expect(core.reloadSuggestions).toHaveBeenCalledWith("scoped");
  });

  it("removes the config by id on unmount", async () => {
    const core = mockCore({
      addSuggestionsConfig: vi.fn(() => "config-9"),
    });
    const view = render(Harness, {
      props: {
        context: mockContext(core),
        config: STATIC,
        chatAgentId: "agent-a",
      },
    });

    await waitFor(() => {
      expect(core.addSuggestionsConfig).toHaveBeenCalledOnce();
    });
    view.unmount();
    expect(core.removeSuggestionsConfig).toHaveBeenCalledWith("config-9");
  });

  it("re-registers and reloads when the config changes", async () => {
    let nextId = 0;
    const core = mockCore({
      addSuggestionsConfig: vi.fn(() => `config-${++nextId}`),
    });
    const view = render(Harness, {
      props: {
        context: mockContext(core),
        config: STATIC,
        chatAgentId: "agent-a",
      },
    });

    await waitFor(() => {
      expect(core.addSuggestionsConfig).toHaveBeenCalledTimes(1);
    });

    await view.rerender({
      context: mockContext(core),
      config: {
        suggestions: [{ title: "Other", message: "Other message" }],
      } satisfies ConfigureSuggestionsInput,
      chatAgentId: "agent-a",
    });

    await waitFor(() => {
      expect(core.addSuggestionsConfig).toHaveBeenCalledTimes(2);
    });
    expect(core.removeSuggestionsConfig).toHaveBeenCalledWith("config-1");
    expect(core.reloadSuggestions).toHaveBeenCalledWith("agent-a");
  });

  it("re-registers and reloads when the chat agent switches", async () => {
    let nextId = 0;
    const core = mockCore({
      addSuggestionsConfig: vi.fn(() => `config-${++nextId}`),
    });
    const view = render(Harness, {
      props: {
        context: mockContext(core),
        config: STATIC,
        chatAgentId: "agent-a",
      },
    });

    await waitFor(() => {
      expect(core.addSuggestionsConfig).toHaveBeenCalledTimes(1);
    });
    expect(core.reloadSuggestions).toHaveBeenCalledWith("agent-a");

    await view.rerender({
      context: mockContext(core),
      config: STATIC,
      chatAgentId: "agent-b",
    });

    await waitFor(() => {
      expect(core.addSuggestionsConfig).toHaveBeenCalledTimes(2);
    });
    expect(core.removeSuggestionsConfig).toHaveBeenCalledWith("config-1");
    expect(core.reloadSuggestions).toHaveBeenCalledWith("agent-b");
  });

  it("registers nothing for disabled or null configs", async () => {
    const disabledCore = mockCore();
    render(Harness, {
      props: {
        context: mockContext(disabledCore),
        config: { available: "disabled", suggestions: [] },
        chatAgentId: "agent-a",
      },
    });
    // Flush Svelte effects deterministically; a bare Promise.resolve does not
    // guarantee $effect execution.
    await tick();
    expect(disabledCore.addSuggestionsConfig).not.toHaveBeenCalled();
    expect(disabledCore.reloadSuggestions).not.toHaveBeenCalled();

    const nullCore = mockCore();
    render(Harness, {
      props: {
        context: mockContext(nullCore),
        config: null,
        chatAgentId: "agent-a",
      },
    });
    await tick();
    expect(nullCore.addSuggestionsConfig).not.toHaveBeenCalled();
    expect(nullCore.reloadSuggestions).not.toHaveBeenCalled();
  });

  it("fans a global config reload out to known idle agents plus the chat agent", async () => {
    const core = mockCore({
      agents: {
        a: { agentId: "a", isRunning: false },
        b: { agentId: "b", isRunning: true },
      },
    });
    render(Harness, {
      props: {
        context: mockContext(core),
        config: STATIC,
        chatAgentId: "chat-x",
      },
    });

    await waitFor(() => {
      expect(core.reloadSuggestions).toHaveBeenCalledWith("a");
    });
    expect(core.reloadSuggestions).toHaveBeenCalledWith("chat-x");
    expect(core.reloadSuggestions).not.toHaveBeenCalledWith("b");
  });

  it("registers a dynamic config and reloads once its agent appears", async () => {
    let agentPresent = false;
    const onAgentsChanged = vi.fn();
    let agentsHandler: (() => void) | undefined;
    const core = mockCore({
      getAgent: vi.fn(() => (agentPresent ? { agentId: "dyn" } : undefined)),
      subscribe: vi.fn((sub: { onAgentsChanged?: () => void }) => {
        agentsHandler = sub.onAgentsChanged;
        onAgentsChanged();
        return { unsubscribe: vi.fn() };
      }),
    });
    const dynamic = {
      instructions: "Suggest follow-ups",
      consumerAgentId: "dyn",
    } satisfies ConfigureSuggestionsInput;
    const view = render(Harness, {
      props: { context: mockContext(core), config: dynamic },
    });

    await waitFor(() => {
      expect(core.addSuggestionsConfig).toHaveBeenCalledWith(dynamic);
    });
    expect(core.reloadSuggestions).toHaveBeenCalledWith("dyn");
    expect(onAgentsChanged).toHaveBeenCalledOnce();

    agentPresent = true;
    agentsHandler?.();
    expect(core.reloadSuggestions).toHaveBeenCalledTimes(2);

    view.unmount();
    expect(core.removeSuggestionsConfig).toHaveBeenCalledOnce();
  });

  it("throws if used outside CopilotKitProvider", () => {
    expect(() => {
      render(Harness, {
        props: {
          context: null as unknown as CopilotKitContextValue,
          config: STATIC,
        },
      });
    }).toThrow("configureSuggestions must be used within CopilotKitProvider");
  });
});
