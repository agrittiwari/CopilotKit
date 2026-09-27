<script lang="ts">
  import type { AbstractAgent } from "@ag-ui/client";
  import type { Message } from "@ag-ui/core";
  import { z } from "zod";
  import CopilotKitProvider from "../../providers/CopilotKitProvider.svelte";
  import type { SvelteActivityMessageRendererProps } from "../../types";
  import Registrar from "./prebuilt-custom-activity-registrar.svelte";

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

  const messages: Message[] = [
    {
      id: "activity-w",
      role: "activity",
      activityType: "audit",
      content: { action: "login" },
    },
  ];

  const renderActivityMessages = [
    {
      activityType: "*",
      content: z.any(),
      render: (props: SvelteActivityMessageRendererProps<unknown>) =>
        `wild:${props.activityType}:${props.message.id}`,
    },
  ];
</script>

<CopilotKitProvider
  selfManagedAgents={agents}
  {renderActivityMessages}
>
  <Registrar {messages} />
</CopilotKitProvider>
