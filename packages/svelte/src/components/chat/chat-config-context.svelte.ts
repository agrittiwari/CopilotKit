import { setContext, getContext } from "svelte";
import { COPILOT_CHAT_CONFIG_KEY } from "../../providers/context";

export class ChatConfig {
  agentId = $state("");
  threadId = $state<string | undefined>(undefined);
  hasExplicitThreadId = $state(false);
  labels = $state<Record<string, string>>({});

  constructor(
    agentId: string,
    threadId?: string,
    hasExplicitThreadId?: boolean,
  ) {
    this.agentId = agentId;
    this.threadId = threadId;
    this.hasExplicitThreadId = hasExplicitThreadId ?? false;
    this.labels = {};
  }
}

export function setChatConfig(config: ChatConfig): void {
  setContext(COPILOT_CHAT_CONFIG_KEY, config);
}

export function getChatConfig(): ChatConfig | undefined {
  return getContext<ChatConfig | undefined>(COPILOT_CHAT_CONFIG_KEY);
}
