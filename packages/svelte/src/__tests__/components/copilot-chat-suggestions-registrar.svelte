<script lang="ts">
  import { configureSuggestions } from "../../hooks/configure-suggestions.svelte";

  configureSuggestions({
    suggestions: [{ title: "Plan a trip", message: "Plan a trip for me" }],
  });
</script>
