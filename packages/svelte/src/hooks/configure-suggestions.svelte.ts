import { getContext } from "svelte";
import type {
  DynamicSuggestionsConfig,
  StaticSuggestionsConfig,
  Suggestion,
  SuggestionsConfig,
} from "@copilotkit/core";
import { DEFAULT_AGENT_ID } from "@copilotkit/shared";
import { COPILOT_KIT_KEY, COPILOT_CHAT_CONFIG_KEY } from "../providers/context";
import type { CopilotKitContextValue } from "../providers/context";
import type { ChatConfig } from "../components/chat/chat-config-context.svelte";
import type { CopilotKitCoreSvelte } from "../lib/svelte-core";

type StaticSuggestionInput = Omit<Suggestion, "isLoading"> &
  Partial<Pick<Suggestion, "isLoading">>;

export type StaticConfigureSuggestionsInput = Omit<
  StaticSuggestionsConfig,
  "suggestions"
> & {
  suggestions: StaticSuggestionInput[];
};

export type ConfigureSuggestionsInput =
  | StaticConfigureSuggestionsInput
  | DynamicSuggestionsConfig
  | null
  | undefined;

/**
 * Registers a suggestion-generation configuration with the core (the Svelte
 * equivalent of React V2's `useConfigureSuggestions`), and unregisters it when
 * the calling component is destroyed.
 *
 * `createSuggestions` remains the observation API; this is the configuration
 * API. Accepts static (`suggestions`) and dynamic (`instructions`) configs.
 * Pass a getter thunk for reactive updates: when the returned config changes,
 * the previous registration is removed, the new one is added, and suggestions
 * are reloaded.
 *
 * A `null`/`undefined` config, or `available: "disabled"`, registers nothing.
 */
export function configureSuggestions(
  config: ConfigureSuggestionsInput | (() => ConfigureSuggestionsInput),
): void {
  const context = getContext<CopilotKitContextValue | null>(COPILOT_KIT_KEY);
  if (!context) {
    throw new Error(
      "configureSuggestions must be used within CopilotKitProvider",
    );
  }
  const chatConfig =
    getContext<ChatConfig | undefined>(COPILOT_CHAT_CONFIG_KEY) ?? undefined;

  $effect(() => {
    const raw = typeof config === "function" ? config() : config;
    const core = context.copilotkit;
    if (!raw || raw.available === "disabled") {
      return;
    }

    const normalized = normalizeSuggestionsInput(raw);
    const resolvedConsumerAgentId = chatConfig?.agentId ?? DEFAULT_AGENT_ID;
    const targetAgentId =
      normalized.consumerAgentId && normalized.consumerAgentId !== "*"
        ? normalized.consumerAgentId
        : resolvedConsumerAgentId;
    const isGlobal =
      normalized.consumerAgentId === undefined ||
      normalized.consumerAgentId === "*";

    const id = core.addSuggestionsConfig(normalized);
    requestReload(core, isGlobal, targetAgentId);

    // Dynamic configs need a live agent to generate. When the target agent is
    // not registered yet (runtime info still loading), reload once it appears.
    let agentWatcher: { unsubscribe: () => void } | undefined;
    if (
      isDynamicSuggestionsConfig(normalized) &&
      targetAgentId &&
      !core.getAgent(targetAgentId)
    ) {
      agentWatcher = core.subscribe({
        onAgentsChanged: () => {
          if (core.getAgent(targetAgentId)) {
            core.reloadSuggestions(targetAgentId);
            agentWatcher?.unsubscribe();
            agentWatcher = undefined;
          }
        },
      });
    }

    return () => {
      agentWatcher?.unsubscribe();
      core.removeSuggestionsConfig(id);
    };
  });
}

function requestReload(
  core: CopilotKitCoreSvelte,
  isGlobal: boolean,
  targetAgentId: string,
): void {
  if (!isGlobal) {
    core.reloadSuggestions(targetAgentId);
    return;
  }
  // Local scratch set, intentionally non-reactive: it lives for one reload
  // fan-out only and is never read by the template.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const seen = new Set<string>();
  for (const entry of Object.values(core.agents ?? {})) {
    const agentId = entry.agentId;
    if (!agentId) {
      continue;
    }
    seen.add(agentId);
    if (!entry.isRunning) {
      core.reloadSuggestions(agentId);
    }
  }
  // The registry can be empty while runtime info is still loading; always
  // cover the agent the user is actually chatting with.
  if (targetAgentId && !seen.has(targetAgentId)) {
    core.reloadSuggestions(targetAgentId);
  }
}

function normalizeSuggestionsInput(
  config: StaticConfigureSuggestionsInput | DynamicSuggestionsConfig,
): SuggestionsConfig {
  if (isDynamicSuggestionsConfig(config)) {
    return { ...config };
  }
  return {
    ...config,
    suggestions: config.suggestions.map((suggestion) => ({
      ...suggestion,
      isLoading: suggestion.isLoading ?? false,
    })),
  };
}

function isDynamicSuggestionsConfig(
  config: StaticConfigureSuggestionsInput | DynamicSuggestionsConfig,
): config is DynamicSuggestionsConfig {
  return "instructions" in config;
}
