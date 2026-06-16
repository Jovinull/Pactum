import { writable } from 'svelte/store';

// A store to hold the currently selected card data
export const selectedCard = writable<any>(null);

// Turn state management
export const currentTurn = writable<'player' | 'enemy'>('player');
