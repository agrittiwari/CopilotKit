import type { StandardSchemaV1 } from "@copilotkit/shared";
import { registerFrontendTool } from "./register-frontend-tool.svelte";
import { registerRenderToolCall } from "./register-render-tool-call.svelte";
import type { RenderToolProps } from "./register-render-tool-call.svelte";

/**
 * Registers a visual component as a frontend tool plus its chat renderer in
 * one call (the Svelte equivalent of React V2's `useComponent`).
 *
 * This composes the `registerFrontendTool` and `registerRenderToolCall`
 * primitives: the tool carries a model-facing description so the agent invokes
 * it to display UI, and the renderer paints the tool call's parameters with
 * your component. Both registrations clean up when the calling component is
 * destroyed.
 *
 * Unlike `registerFrontendTool`, `render` receives the tool parameters
 * directly (component-props style) instead of the full tool-call envelope.
 */
export function registerComponent<T extends Record<string, unknown>>(config: {
  name: string;
  description?: string;
  parameters?: StandardSchemaV1<unknown, T>;
  render: (props: T) => unknown;
  agentId?: string;
  followUp?: boolean;
}): void {
  const prefix =
    `Use this tool to display the "${config.name}" component in the chat. ` +
    `This tool renders a visual UI component for the user.`;
  const fullDescription = config.description
    ? `${prefix}\n\n${config.description}`
    : prefix;

  registerFrontendTool({
    name: config.name,
    description: fullDescription,
    ...(config.parameters ? { parameters: config.parameters } : {}),
    ...(config.agentId ? { agentId: config.agentId } : {}),
    ...(config.followUp !== undefined ? { followUp: config.followUp } : {}),
  });

  registerRenderToolCall({
    name: config.name,
    ...(config.parameters ? { parameters: config.parameters } : {}),
    render: (props: RenderToolProps) => config.render(props.parameters as T),
    ...(config.agentId ? { agentId: config.agentId } : {}),
  });
}
