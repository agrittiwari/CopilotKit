<script lang="ts">
  import type { Message } from "@ag-ui/core";
  import { getContext } from "svelte";
  import CopilotChatMessage from "./CopilotChatMessage.svelte";
  import { normalizeAutoScroll, type AutoScrollMode } from "./types";
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
    messages = [] as Message[],
    isRunning = false,
    autoScroll = true as AutoScrollMode | boolean,
  }: {
    messages?: Message[];
    isRunning?: boolean;
    autoScroll?: AutoScrollMode | boolean;
  } = $props();

  // Renderer lists are subscribed once per view (not per message) so mounting
  // new messages never adds core subscriptions.
  const context = getContext<CopilotKitContextValue | null>(COPILOT_KIT_KEY);
  const copilotkit = context?.copilotkit;
  const chatConfig = getChatConfig();

  let renderCustomMessages = $state<SvelteCustomMessageRenderer[]>([]);
  let renderActivityMessages = $state<
    SvelteActivityMessageRenderer<unknown>[]
  >([]);
  // Bumped when the chat agent emits state/run updates so custom renderers
  // re-resolve stateSnapshot. One view-level agent subscription (not per
  // message), switched reactively as the chat agent changes.
  let stateVersion = $state(0);

  $effect(() => {
    if (!copilotkit || typeof copilotkit.subscribe !== "function") return;
    const core = copilotkit;
    renderCustomMessages = [...(core.renderCustomMessages ?? [])];
    renderActivityMessages = [...(core.renderActivityMessages ?? [])];
    const subCustom = core.subscribe({
      onRenderCustomMessagesChanged: (event) => {
        renderCustomMessages = [...(event.renderCustomMessages ?? [])];
      },
    });
    const subActivity = core.subscribe({
      onRenderActivityMessagesChanged: (event) => {
        renderActivityMessages = [...(event.renderActivityMessages ?? [])];
      },
    });
    return () => {
      subCustom.unsubscribe();
      subActivity.unsubscribe();
    };
  });

  // View-level agent subscription so stateSnapshot-dependent custom renderers
  // refresh on state changes. Tracks the reactive chat agent id, so switching
  // chats re-subscribes exactly once; per-message components never subscribe.
  $effect(() => {
    const agentId = chatConfig?.agentId;
    if (!copilotkit || !agentId) return;
    const agent =
      typeof copilotkit.getAgent === "function"
        ? copilotkit.getAgent(agentId)
        : undefined;
    if (!agent || typeof agent.subscribe !== "function") return;
    const subscription = agent.subscribe({
      onStateChanged: () => {
        stateVersion += 1;
      },
    });
    return () => subscription.unsubscribe();
  });

  let container: HTMLDivElement | undefined = $state();
  const autoScrollMode = $derived(normalizeAutoScroll(autoScroll));

  $effect(() => {
    if (autoScrollMode !== "pin-to-bottom" || !container) return;
    void messages;
    void isRunning;
    queueMicrotask(() => {
      container!.scrollTop = container!.scrollHeight;
    });
  });
</script>

<div bind:this={container} class="copilotkit-message-list">
  {#each messages as msg (msg.id)}
    <CopilotChatMessage
      message={msg}
      {messages}
      {isRunning}
      {renderCustomMessages}
      {renderActivityMessages}
      stateVersion={stateVersion}
    />
  {/each}
</div>

<style>
  .copilotkit-message-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }
</style>
