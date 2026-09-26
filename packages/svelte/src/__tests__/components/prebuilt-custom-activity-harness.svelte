<script lang="ts">
  import type { AbstractAgent } from "@ag-ui/client";
  import type { Message } from "@ag-ui/core";
  import { z } from "zod";
  import CopilotKitProvider from "../../providers/CopilotKitProvider.svelte";
  import type {
    SvelteActivityMessageRendererProps,
    SvelteCustomMessageRendererProps,
  } from "../../types";
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
    { id: "user-1", role: "user", content: "hello" },
    {
      id: "activity-1",
      role: "activity",
      activityType: "weather-card",
      content: { city: "London" },
    },
    {
      id: "activity-2",
      role: "activity",
      activityType: "unknown-type",
      content: {},
    },
    {
      id: "activity-3",
      role: "activity",
      activityType: "scoped-card",
      content: { city: "Paris" },
    },
  ];

  const renderActivityMessages = [
    {
      activityType: "weather-card",
      content: z.object({ city: z.string() }),
      render: (props: SvelteActivityMessageRendererProps<unknown>) =>
        `activity:weather-card:${(props.content as { city: string }).city}`,
    },
    {
      activityType: "scoped-card",
      agentId: "other-agent",
      content: z.object({ city: z.string() }),
      render: (props: SvelteActivityMessageRendererProps<unknown>) =>
        `scoped:${(props.content as { city: string }).city}`,
    },
  ];

  const renderCustomMessages = [
    {
      render: (props: SvelteCustomMessageRendererProps) =>
        `custom:${props.position}:${props.message.id}`,
    },
  ];
</script>

<CopilotKitProvider
  selfManagedAgents={agents}
  {renderActivityMessages}
  {renderCustomMessages}
>
  <Registrar {messages} />
</CopilotKitProvider>
