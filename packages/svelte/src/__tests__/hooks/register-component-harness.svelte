<script lang="ts">
  import { setContext } from "svelte";
  import { z } from "zod";
  import { registerComponent } from "../../hooks/register-component.svelte";
  import {
    COPILOT_KIT_KEY,
    type CopilotKitContextValue,
  } from "../../providers/context";

  let { context }: { context: CopilotKitContextValue } = $props();

  // svelte-ignore state_referenced_locally
  setContext(COPILOT_KIT_KEY, context);

  registerComponent({
    name: "showProfile",
    description: "Shows a user profile",
    parameters: z.object({ userId: z.string() }),
    render: (props: { userId: string }) => `profile:${props.userId}`,
  });
</script>

<output>register component harness</output>
