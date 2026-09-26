<script lang="ts">
  import type { Snippet } from "svelte";

  // Renders one renderer output value using the same convention as the
  // tool-call view: plain text passes through, snippet functions render,
  // anything else renders nothing.
  let { value }: { value: unknown } = $props();

  function asSnippet(renderFn: unknown): Snippet<[]> {
    return renderFn as Snippet<[]>;
  }
</script>

{#if typeof value === "string" || typeof value === "number"}
  {value}
{:else if typeof value === "function"}
  {@render asSnippet(value)()}
{/if}
