import Phaser from 'phaser';
import { MainBoard } from './scenes/MainBoard';

export function initGame(containerId: string): Phaser.Game {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: containerId,
        width: '100%',
        height: '100%',
        scale: {
            mode: Phaser.Scale.RESIZE,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        transparent: true, // Transparent so Svelte background can show if needed
        scene: [MainBoard]
    };

    return new Phaser.Game(config);
}
