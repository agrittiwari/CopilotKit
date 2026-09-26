<script lang="ts">
  import type {
    ActivityMessage,
    AssistantMessage,
    Message,
    ReasoningMessage,
    UserMessage,
  } from "@ag-ui/core";
  import { DEFAULT_AGENT_ID } from "@copilotkit/shared";
  import { getContext } from "svelte";
  import CopilotChatAssistantMessage from "./CopilotChatAssistantMessage.svelte";
  import CopilotChatUserMessage from "./CopilotChatUserMessage.svelte";
  import CopilotChatReasoningMessage from "./CopilotChatReasoningMessage.svelte";
  import CopilotChatRenderedOutput from "./CopilotChatRenderedOutput.svelte";
  import {
    COPILOT_KIT_KEY,
    type CopilotKitContextValue,
  } from "../../providers/context";
  import { getChatConfig } from "./chat-config-context.svelte";
  import type {
    SvelteActivityMessageRenderer,
    SvelteCustomMessageRenderer,
  } from "../../types";

  let {
    message,
    messages = [] as Message[],
    isRunning = false,
    renderCustomMessages = [] as SvelteCustomMessageRenderer[],
    renderActivityMessages = [] as SvelteActivityMessageRenderer<unknown>[],
  }: {
    message: Message;
    messages?: Message[];
    isRunning?: boolean;
    renderCustomMessages?: SvelteCustomMessageRenderer[];
    renderActivityMessages?: SvelteActivityMessageRenderer<unknown>[];
  } = $props();

  const context = getContext<CopilotKitContextValue | null>(COPILOT_KIT_KEY);
  // The message view is also usable without a provider (plain message list);
  // renderer support simply degrades to generic fallbacks there.
  const copilotkit = context?.copilotkit;
  const chatConfig = getChatConfig();

  const chatAgentId = $derived(chatConfig?.agentId ?? DEFAULT_AGENT_ID);

  const scopedCustomRenderers = $derived(
    renderCustomMessages
      .filter(
        (renderer) =>
          renderer.agentId === undefined || renderer.agentId === chatAgentId,
      )
      .sort((a, b) => {
        const aHasAgent = a.agentId !== undefined;
        const bHasAgent = b.agentId !== undefined;
        if (aHasAgent === bHasAgent) return 0;
        return aHasAgent ? -1 : 1;
      }),
  );

  interface CustomRenderContext {
    runId: string;
    messageIndex: number;
    messageIndexInRun: number;
    numberOfMessagesInRun: number;
    stateSnapshot: unknown;
  }

  function resolveCustomContext(): CustomRenderContext | null {
    if (!copilotkit || !chatConfig || scopedCustomRenderers.length === 0) {
      return null;
    }
    const core = copilotkit;
    const agent =
      typeof core.getAgent === "function"
        ? core.getAgent(chatAgentId)
        : undefined;
    if (!agent) return null;
    const threadId = chatConfig.threadId;
    const resolvedRunId = threadId
      ? (core.getRunIdForMessage(chatAgentId, threadId, message.id) ??
        core.getRunIdsForThread(chatAgentId, threadId).slice(-1)[0])
      : undefined;
    const agentMessages = agent.messages ?? [];
    const rawIndex = agentMessages.findIndex((entry) => entry.id === message.id);
    const messageIndex = rawIndex >= 0 ? rawIndex : 0;
    let messageIndexInRun = 0;
    let numberOfMessagesInRun = 1;
    if (resolvedRunId && threadId && copilotkit) {
      const core = copilotkit;
      const idsInRun = agentMessages
        .filter(
          (entry) =>
            core.getRunIdForMessage(chatAgentId, threadId, entry.id) ===
            resolvedRunId,
        )
        .map((entry) => entry.id);
      messageIndexInRun = Math.max(idsInRun.indexOf(message.id), 0);
      numberOfMessagesInRun = idsInRun.length || 1;
    }
    return {
      runId: resolvedRunId ?? `missing-run-id:${message.id}`,
      messageIndex,
      messageIndexInRun,
      numberOfMessagesInRun,
      stateSnapshot:
        resolvedRunId && threadId && copilotkit
          ? copilotkit.getStateByRun(chatAgentId, threadId, resolvedRunId)
          : undefined,
    };
  }

  function renderCustom(position: "before" | "after"): unknown {
    const context = resolveCustomContext();
    if (!context) return null;
    for (const renderer of scopedCustomRenderers) {
      if (!renderer.render) continue;
      const output = renderer.render({
        message,
        position,
        runId: context.runId,
        messageIndex: context.messageIndex,
        messageIndexInRun: context.messageIndexInRun,
        numberOfMessagesInRun: context.numberOfMessagesInRun,
        agentId: chatAgentId,
        stateSnapshot: context.stateSnapshot,
      });
      if (output !== null && output !== undefined && output !== false) {
        return output;
      }
    }
    return null;
  }

  function findActivityRenderer(
    activityType: string,
  ): SvelteActivityMessageRenderer<unknown> | null {
    if (renderActivityMessages.length === 0) return null;
    const matches = renderActivityMessages.filter(
      (renderer) => renderer.activityType === activityType,
    );
    return (
      matches.find((candidate) => candidate.agentId === chatAgentId) ??
      matches.find((candidate) => candidate.agentId === undefined) ??
      renderActivityMessages.find(
        (candidate) => candidate.activityType === "*",
      ) ??
      null
    );
  }

  function renderActivity(activity: ActivityMessage): unknown {
    if (!copilotkit) return null;
    const renderer = findActivityRenderer(activity.activityType);
    if (!renderer) return null;
    const parsed = renderer.content.safeParse(activity.content);
    if (!parsed.success) {
      console.warn(
        `Failed to parse content for activity message '${activity.activityType}':`,
        parsed.error.issues,
      );
      return null;
    }
    return renderer.render({
      activityType: activity.activityType,
      content: parsed.data,
      message: activity,
      agent:
        typeof copilotkit.getAgent === "function"
          ? copilotkit.getAgent(chatAgentId)
          : undefined,
    });
  }

  function isAssistant(msg: Message): msg is AssistantMessage {
    return msg.role === "assistant";
  }

  function isUser(msg: Message): msg is UserMessage {
    return msg.role === "user";
  }

  function isReasoning(msg: Message): msg is ReasoningMessage {
    return msg.role === "reasoning";
  }

  function isActivity(msg: Message): msg is ActivityMessage {
    return msg.role === "activity";
  }

  const customBefore = $derived(renderCustom("before"));
  const customAfter = $derived(renderCustom("after"));
  const activityOutput = $derived(
    isActivity(message) ? renderActivity(message) : null,
  );
</script>

{#if customBefore !== null}
  <CopilotChatRenderedOutput value={customBefore} />
{/if}
{#if isReasoning(message)}
  <CopilotChatReasoningMessage {message} {messages} {isRunning} />
{:else if isAssistant(message)}
  <CopilotChatAssistantMessage {message} {messages} {isRunning} />
{:else if isUser(message)}
  <CopilotChatUserMessage {message} />
{:else if isActivity(message)}
  {#if activityOutput !== null}
    <CopilotChatRenderedOutput value={activityOutput} />
  {:else}
    <div
      data-testid="copilot-activity-fallback"
      class="cpk:flex cpk:items-center cpk:gap-2 cpk:py-1 cpk:text-sm cpk:text-muted-foreground"
    >
      <span>{message.activityType}</span>
    </div>
  {/if}
{/if}
{#if customAfter !== null}
  <CopilotChatRenderedOutput value={customAfter} />
{/if}
