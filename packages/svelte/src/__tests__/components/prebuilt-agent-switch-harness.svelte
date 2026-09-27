<script lang="ts">
  import type { AbstractAgent } from "@ag-ui/client";
  import type { Message } from "@ag-ui/core";
  import { z } from "zod";
  import CopilotKitProvider from "../../providers/CopilotKitProvider.svelte";
  import type {
    SvelteActivityMessageRendererProps,
    SvelteCustomMessageRendererProps,
  } from "../../types";
  import Registrar from "./prebuilt-agent-switch-registrar.svelte";

  class TestAgent {
    agentId = "default";
    messages: Message[] = [];
    state: Record<string, unknown> = {};
    isRunning = false;
    threadId?: string;

    constructor(agentId = "default") {
      this.agentId = agentId;
    }

    clone() {
      return new TestAgent(this.agentId);
    }

    setMessages() {}
    setState() {}
    subscribe() {
      return { unsubscribe() {} };
    }
  }

  const agents = {
    "agent-a": new TestAgent("agent-a"),
    "agent-b": new TestAgent("agent-b"),
  } as unknown as Record<string, AbstractAgent>;

  let agentId = $state("agent-a");

  const messages: Message[] = [
    { id: "user-1", role: "user", content: "hello" },
    {
      id: "activity-1",
      role: "activity",
      activityType: "scoped-card",
      content: { city: "Paris" },
    },
  ];

  const renderActivityMessages = [
    {
      activityType: "scoped-card",
      agentId: "agent-a",
      content: z.object({ city: z.string() }),
      render: (props: SvelteActivityMessageRendererProps<unknown>) =>
        `scoped-a:${(props.content as { city: string }).city}`,
    },
    {
      activityType: "scoped-card",
      agentId: "agent-b",
      content: z.object({ city: z.string() }),
      render: (props: SvelteActivityMessageRendererProps<unknown>) =>
        `scoped-b:${(props.content as { city: string }).city}`,
    },
  ];

  const renderCustomMessages = [
    {
      agentId: "agent-a",
      render: (props: SvelteCustomMessageRendererProps) =>
        `custom-a:${props.message.id}`,
    },
    {
      agentId: "agent-b",
      render: (props: SvelteCustomMessageRendererProps) =>
        `custom-b:${props.message.id}`,
    },
  ];
</script>

<button data-testid="switch-agent" onclick={() => (agentId = "agent-b")}>switch</button>
<CopilotKitProvider
  selfManagedAgents={agents}
  {renderActivityMessages}
  {renderCustomMessages}
>
  <Registrar {messages} {agentId} />
</CopilotKitProvider>
