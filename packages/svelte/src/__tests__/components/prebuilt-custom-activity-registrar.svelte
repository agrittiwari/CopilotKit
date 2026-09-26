<script lang="ts">
  import type { Message } from "@ag-ui/core";
  import CopilotChatMessageView from "../../components/chat/CopilotChatMessageView.svelte";
  import {
    setChatConfig,
    ChatConfig,
  } from "../../components/chat/chat-config-context.svelte";

  let { messages }: { messages: Message[] } = $props();

  // Explicit chat scope so the bare message view resolves agent-scoped
  // renderers exactly like CopilotChat does.
  setChatConfig(new ChatConfig("default", "thread-1", true));
</script>

<CopilotChatMessageView {messages} isRunning={false} />
