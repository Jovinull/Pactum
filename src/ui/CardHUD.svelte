<script lang="ts">
  import { selectedCard } from '../store';
</script>

{#if $selectedCard}
<div class="absolute bottom-4 left-4 bg-gray-900/90 text-white p-4 rounded border-2 border-yellow-500 shadow-xl w-64 backdrop-blur-sm pointer-events-auto transition-all">
  <h2 class="text-xl font-bold text-yellow-400 mb-2">{$selectedCard.name}</h2>
  <div class="flex justify-between text-sm mb-1">
    <span>Element: <span class="font-semibold">{$selectedCard.element}</span></span>
    <span>Type: <span class="font-semibold">{$selectedCard.type}</span></span>
  </div>
  <div class="flex justify-between font-mono font-bold mt-3 bg-gray-800 p-2 rounded">
    <span class="text-red-400">ATK {$selectedCard.atk}</span>
    <span class="text-blue-400">DEF {$selectedCard.def}</span>
  </div>
</div>
{/if}
