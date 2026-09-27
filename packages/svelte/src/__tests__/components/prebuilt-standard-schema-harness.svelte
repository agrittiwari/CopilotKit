<script lang="ts">
  import type { AbstractAgent } from "@ag-ui/client";
  import type { Message } from "@ag-ui/core";
  import { z } from "zod";
  import type { StandardSchemaV1 } from "@copilotkit/shared";
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

  // Non-Zod Standard Schema: hand-written "~standard" validator.
  const citySchema = {
    "~standard": {
      version: 1 as const,
      vendor: "test",
      validate: (value: unknown) => {
        if (
          typeof value === "object" &&
          value !== null &&
          typeof (value as { city?: unknown }).city === "string"
        ) {
          return { value: value as { city: string } };
        }
        return { issues: [{ message: "expected { city: string }" }] };
      },
    },
  } as StandardSchemaV1<unknown, { city: string }>;

  // Async Standard Schema: validate returns a Promise, which the chat treats
  // as unsupported and falls back with a warning.
  const asyncSchema = {
    "~standard": {
      version: 1 as const,
      vendor: "test-async",
      validate: (value: unknown) =>
        Promise.resolve({ value: value as { city: string } }),
    },
  } as StandardSchemaV1<unknown, { city: string }>;

  const messages: Message[] = [
    {
      id: "activity-std",
      role: "activity",
      activityType: "std-card",
      content: { city: "Oslo" },
    },
    {
      id: "activity-bad",
      role: "activity",
      activityType: "weather-card",
      content: { city: 42 },
    },
    {
      id: "activity-async",
      role: "activity",
      activityType: "async-card",
      content: { city: "X" },
    },
    {
      id: "activity-undef",
      role: "activity",
      activityType: "undef-card",
      content: { city: "Y" },
    },
    { id: "user-1", role: "user", content: "hello one" },
    { id: "user-2", role: "user", content: "hello two" },
  ];

  const renderActivityMessages = [
    {
      activityType: "std-card",
      content: citySchema,
      render: (props: SvelteActivityMessageRendererProps<unknown>) =>
        `std:${(props.content as { city: string }).city}`,
    },
    {
      activityType: "weather-card",
      content: z.object({ city: z.string() }),
      render: (props: SvelteActivityMessageRendererProps<unknown>) =>
        `weather:${(props.content as { city: string }).city}`,
    },
    {
      activityType: "async-card",
      content: asyncSchema,
      render: (props: SvelteActivityMessageRendererProps<unknown>) =>
        `async:${(props.content as { city: string }).city}`,
    },
    {
      activityType: "undef-card",
      content: z.object({ city: z.string() }),
      // Invalid renderer output: must fall through to the generic fallback.
      render: () => undefined,
    },
  ];

  const renderCustomMessages = [
    {
      render: (props: SvelteCustomMessageRendererProps) =>
        props.message.id === "user-1"
          ? (true as unknown as string)
          : null,
    },
    {
      render: (props: SvelteCustomMessageRendererProps) =>
        props.message.id === "user-1"
          ? ({ weird: true } as unknown as string)
          : props.message.id === "user-2"
            ? (["array"] as unknown as string)
            : null,
    },
    {
      render: (props: SvelteCustomMessageRendererProps) =>
        props.message.id === "user-1"
          ? `custom:ok:${props.message.id}`
          : null,
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
