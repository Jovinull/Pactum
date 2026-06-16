<script lang="ts">
  import { onMount } from 'svelte';
  import { initGame } from './game/GameManager';
  import CardHUD from './ui/CardHUD.svelte';

  let gameInstance: Phaser.Game;

  // We can pass data to the HUD dynamically
  let selectedCard = {
    "id": "card_001",
    "name": "Cavaleiro de Prisma",
    "element": "Light",
    "type": "Warrior",
    "cost": 4,
    "atk": 1800,
    "def": 1500
  };

  onMount(() => {
    // Initialize Phaser on mount
    gameInstance = initGame('game-container');

    return () => {
      if (gameInstance) {
        gameInstance.destroy(true);
      }
    };
  });
</script>

<main class="w-full h-screen overflow-hidden relative bg-gray-900">
  <!-- Svelte UI Layer (Overlays) -->
  <div class="absolute inset-0 pointer-events-none z-10">
    <CardHUD cardData={selectedCard} />
    
    <header class="absolute top-0 left-0 w-full p-4 pointer-events-auto">
      <h1 class="text-3xl font-bold text-yellow-500 drop-shadow-md">Pactum</h1>
      <p class="text-gray-300 text-sm mt-1">Svelte + Phaser 3 Card Game</p>
    </header>
  </div>

  <!-- Phaser Game Container -->
  <div id="game-container" class="w-full h-full absolute inset-0 z-0"></div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
</style>
