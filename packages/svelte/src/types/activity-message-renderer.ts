import type { ActivityMessage } from "@ag-ui/core";
import type { AbstractAgent } from "@ag-ui/client";
import type { StandardSchemaV1 } from "@copilotkit/shared";

export interface SvelteActivityMessageRendererProps<TActivityContent> {
  activityType: string;
  content: TActivityContent;
  message: ActivityMessage;
  agent: AbstractAgent | undefined;
}

export type SvelteActivityMessageRendererRenderFn<TActivityContent> = (
  props: SvelteActivityMessageRendererProps<TActivityContent>,
) => unknown;

export interface SvelteActivityMessageRenderer<TActivityContent> {
  activityType: string;
  agentId?: string;
  content: StandardSchemaV1<unknown, TActivityContent>;
  render: SvelteActivityMessageRendererRenderFn<TActivityContent>;
}
