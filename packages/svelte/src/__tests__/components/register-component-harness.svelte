<script lang="ts">
  import CopilotKitProvider from "../../providers/CopilotKitProvider.svelte";
  import Registrar from "./register-component-registrar.svelte";
</script>

<CopilotKitProvider agents__unsafe_dev_only={{}}>
  <Registrar />
</CopilotKitProvider>
