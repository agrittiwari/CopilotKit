<script lang="ts">
  import type { Message } from "@ag-ui/core";
  import CopilotChatMessageView from "../../components/chat/CopilotChatMessageView.svelte";
  import {
    setChatConfig,
    ChatConfig,
  } from "../../components/chat/chat-config-context.svelte";

  let { messages, agentId }: { messages: Message[]; agentId: string } = $props();

  // One shared reactive config, mutated like CopilotChat does when its agent
  // prop changes, so scoped renderer selection follows the current agent.
  // svelte-ignore state_referenced_locally
  const chatConfig = new ChatConfig(agentId, "thread-1", true);
  setChatConfig(chatConfig);

  $effect(() => {
    chatConfig.agentId = agentId;
  });
</script>

<CopilotChatMessageView {messages} isRunning={false} />
