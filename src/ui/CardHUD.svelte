<script lang="ts">
  // Export cardData so we can pass it from the parent
  export let cardData: any = null;
</script>

{#if cardData}
<div class="absolute bottom-4 left-4 bg-gray-900/90 text-white p-4 rounded border-2 border-yellow-500 shadow-xl w-64 backdrop-blur-sm pointer-events-auto transition-all">
  <h2 class="text-xl font-bold text-yellow-400 mb-2">{cardData.name}</h2>
  <div class="flex justify-between text-sm mb-1">
    <span>Element: <span class="font-semibold">{cardData.element}</span></span>
    <span>Type: <span class="font-semibold">{cardData.type}</span></span>
  </div>
  <div class="flex justify-between font-mono font-bold mt-3 bg-gray-800 p-2 rounded">
    <span class="text-red-400">ATK {cardData.atk}</span>
    <span class="text-blue-400">DEF {cardData.def}</span>
  </div>
</div>
{/if}
