<script lang="ts">
  import type { Message } from "@ag-ui/core";
  import { z } from "zod";
  import CopilotChatMessageView from "../../components/chat/CopilotChatMessageView.svelte";
  import { registerComponent } from "../../hooks/register-component.svelte";

  const messages: Message[] = [
    {
      id: "assistant-1",
      role: "assistant",
      content: "",
      toolCalls: [
        {
          id: "profile-1",
          type: "function",
          function: {
            name: "showProfile",
            arguments: '{"userId":"u-1"}',
          },
        },
      ],
    },
    {
      id: "tool-profile",
      role: "tool",
      content: "ok",
      toolCallId: "profile-1",
    },
  ];

  registerComponent({
    name: "showProfile",
    parameters: z.object({ userId: z.string() }),
    render: (props: { userId: string }) => `profile:${props.userId}`,
  });
</script>

<CopilotChatMessageView {messages} isRunning={false} />
