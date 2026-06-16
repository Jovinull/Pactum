import Phaser from 'phaser';

export class MainBoard extends Phaser.Scene {
    constructor() {
        super({ key: 'MainBoard' });
    }

    preload() {
        // Here we could load images for SVG templates if needed
    }

    async create() {
        // Draw dark background
        this.cameras.main.setBackgroundColor('#1a1a2e');
        
        // Load data and draw temp card
        await this.loadCardData();
    }

    async loadCardData() {
        // Dynamically import the json data using Vite's bundling
        const { default: cardsData } = await import('../../data/cards.json');
        
        const card = cardsData[0];

        const cardWidth = 200;
        const cardHeight = 300;
        const x = this.cameras.main.width / 2;
        const y = this.cameras.main.height / 2;

        const graphics = this.add.graphics();
        
        // Draw card background
        graphics.fillStyle(0xdddddd, 1);
        graphics.fillRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 10);
        
        // Draw card border
        graphics.lineStyle(4, 0xf1c40f, 1);
        graphics.strokeRoundedRect(x - cardWidth/2, y - cardHeight/2, cardWidth, cardHeight, 10);

        // Name
        this.add.text(x, y - 100, card.name, {
            fontSize: '20px',
            color: '#000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // ATK
        this.add.text(x, y + 80, `ATK: ${card.atk}`, {
            fontSize: '18px',
            color: '#c0392b',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // DEF
        this.add.text(x, y + 110, `DEF: ${card.def}`, {
            fontSize: '18px',
            color: '#2980b9',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }
}
