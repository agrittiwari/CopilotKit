<script lang="ts">
  import type { AbstractAgent } from "@ag-ui/client";
  import type { Message } from "@ag-ui/core";
  import CopilotKitProvider from "../../providers/CopilotKitProvider.svelte";
  import CopilotChat from "../../components/chat/CopilotChat.svelte";
  import Registrar from "./copilot-chat-suggestions-registrar.svelte";

  class TestAgent {
    agentId = "default";
    messages: Message[] = [];
    state: Record<string, unknown> = {};
    isRunning = false;
    threadId?: string;

    clone() {
      return new TestAgent();
    }

    setMessages() {}
    setState() {}
    subscribe() {
      return { unsubscribe() {} };
    }
  }

  const agents = { default: new TestAgent() as unknown as AbstractAgent };
</script>

<CopilotKitProvider runtimeUrl="https://runtime.test" selfManagedAgents={agents}>
  <Registrar />
  <CopilotChat />
</CopilotKitProvider>
