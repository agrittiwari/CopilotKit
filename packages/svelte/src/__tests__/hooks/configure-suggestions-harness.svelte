<script lang="ts">
  import { setContext } from "svelte";
  import {
    configureSuggestions,
    type ConfigureSuggestionsInput,
  } from "../../hooks/configure-suggestions.svelte";
  import {
    COPILOT_KIT_KEY,
    COPILOT_CHAT_CONFIG_KEY,
    type CopilotKitContextValue,
  } from "../../providers/context";
  import { ChatConfig } from "../../components/chat/chat-config-context.svelte";

  let {
    context,
    config,
    chatAgentId = undefined,
  }: {
    context: CopilotKitContextValue;
    config: ConfigureSuggestionsInput;
    chatAgentId?: string;
  } = $props();

  // svelte-ignore state_referenced_locally
  setContext(COPILOT_KIT_KEY, context);
  // svelte-ignore state_referenced_locally
  if (chatAgentId !== undefined) {
    setContext(COPILOT_CHAT_CONFIG_KEY, new ChatConfig(chatAgentId));
  }

  // Getter thunk keeps the config prop reactive inside the callee's $effect.
  configureSuggestions(() => config);
</script>

<output>configure suggestions harness</output>
