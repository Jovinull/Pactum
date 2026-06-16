<script lang="ts">
  import { currentTurn } from '../store';
  
  function endTurn() {
    if ($currentTurn === 'player') {
      currentTurn.set('enemy');
    }
  }
</script>

<div class="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 pointer-events-auto z-50">
  <div class="bg-gray-900/90 p-4 rounded-lg border-2 shadow-xl backdrop-blur-sm text-center w-32 transition-colors duration-300
              {$currentTurn === 'player' ? 'border-blue-500' : 'border-red-500'}">
    <h3 class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Fase Atual</h3>
    <span class="text-xl font-bold {$currentTurn === 'player' ? 'text-blue-400' : 'text-red-400'}">
      {$currentTurn === 'player' ? 'Jogador' : 'Inimigo'}
    </span>
  </div>

  <button 
    on:click={endTurn}
    disabled={$currentTurn === 'enemy'}
    class="px-6 py-3 rounded-lg font-bold text-white uppercase tracking-wider transition-all duration-300 shadow-lg border-2 
           {$currentTurn === 'player' 
             ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400 hover:scale-105 hover:shadow-blue-500/50 cursor-pointer' 
             : 'bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed'}"
  >
    Encerrar
  </button>
</div>
