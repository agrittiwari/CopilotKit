<script lang="ts">
  import { setContext } from "svelte";
  import type { Message } from "@ag-ui/core";
  import CopilotChatMessageView from "../../components/chat/CopilotChatMessageView.svelte";
  import {
    COPILOT_KIT_KEY,
    type CopilotKitContextValue,
  } from "../../providers/context";
  import {
    setChatConfig,
    ChatConfig,
  } from "../../components/chat/chat-config-context.svelte";
  import type { CopilotKitCoreSvelte } from "../../lib/svelte-core";

  // Controllable mock core: stateSnapshot starts at { count: 1 }; the bump
  // button flips it to { count: 2 } and fires the captured onStateChanged
  // handler, mimicking an agent state update.
  let snapshot: unknown = $state({ count: 1 });
  let stateHandler: (() => void) | undefined;
  // Plain (non-reactive) counter: incremented synchronously inside subscribe,
  // which runs within the message view's $effect — writing $state here would
  // feed the effect loop. Surfaced to the DOM only on button click.
  let subCalls = 0;
  let shownSubs: number | undefined = $state(undefined);

  const mockAgent = {
    agentId: "default",
    messages: [
      { id: "user-1", role: "user", content: "hello" },
      { id: "user-2", role: "user", content: "world" },
    ] as Message[],
    subscribe: (sub: { onStateChanged?: () => void }) => {
      subCalls += 1;
      stateHandler = sub.onStateChanged;
      return { unsubscribe: () => {} };
    },
  };

  const core = {
    renderCustomMessages: [
      {
        render: (props: { stateSnapshot: unknown }) =>
          `state:${(props.stateSnapshot as { count: number })?.count ?? "none"}`,
      },
    ],
    renderActivityMessages: [],
    getAgent: () => mockAgent,
    getRunIdForMessage: () => "run-1",
    getRunIdsForThread: () => ["run-1"],
    getStateByRun: () => snapshot,
    subscribe: () => ({ unsubscribe: () => {} }),
  } as unknown as CopilotKitCoreSvelte;

  const context = {
    copilotkit: core,
  } as CopilotKitContextValue;

  setContext(COPILOT_KIT_KEY, context);
  setChatConfig(new ChatConfig("default", "thread-1", true));

  const messages: Message[] = [
    { id: "user-1", role: "user", content: "hello" },
    { id: "user-2", role: "user", content: "world" },
  ];
</script>

<button
  data-testid="show-subs"
  onclick={() => {
    shownSubs = subCalls;
  }}
>
  show subs
</button>
{#if shownSubs !== undefined}
  <span data-testid="agent-subs">{shownSubs}</span>
{/if}
<button
  data-testid="bump-state"
  onclick={() => {
    snapshot = { count: 2 };
    stateHandler?.();
  }}
>
  bump
</button>
<CopilotChatMessageView {messages} isRunning={false} />
