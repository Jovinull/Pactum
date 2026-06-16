import Phaser from 'phaser';
import cardsData from '../../data/cards.json';
import { selectedCard } from '../../store';

export class MainBoard extends Phaser.Scene {
    constructor() {
        super({ key: 'MainBoard' });
    }

    preload() {
        // Load the SVGs defined in the JSON for the first card
        const card = cardsData[0];
        
        // We use the ID to ensure unique asset keys
        this.load.svg(`template_${card.id}`, card.visuals.template);
        this.load.svg(`art_${card.id}`, card.visuals.art);
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1a2e');
        
        const card = cardsData[0];
        
        const cardWidth = 200;
        const cardHeight = 300;
        const x = this.cameras.main.width / 2;
        const y = this.cameras.main.height / 2;
        
        // Create a Container for the card
        const container = this.add.container(x, y);
        
        // 1. Template Image
        const templateImg = this.add.image(0, 0, `template_${card.id}`);
        templateImg.setOrigin(0.5); // Center origin (0, 0 is the middle)

        // 2. Art Image
        // In the SVG, the art box starts at y=20.
        // So the center of the 160x160 art is at y=100 from the top.
        // Since container's (0,0) is the center of the 300px tall card,
        // the top edge is at -150.
        // Therefore, the center of the art is at -150 + 100 = -50.
        const artImg = this.add.image(0, -50, `art_${card.id}`);
        artImg.setOrigin(0.5);

        // 3. Texts
        // Name goes just below the art
        const nameText = this.add.text(0, 60, card.name, {
            fontSize: '16px',
            color: '#333',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // ATK & DEF
        const atkText = this.add.text(-40, 110, `ATK ${card.atk}`, {
            fontSize: '14px',
            color: '#c0392b',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const defText = this.add.text(40, 110, `DEF ${card.def}`, {
            fontSize: '14px',
            color: '#2980b9',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // Add all elements to the container (from back to front)
        container.add([templateImg, artImg, nameText, atkText, defText]);
        
        // Set interactive area for the container
        container.setSize(cardWidth, cardHeight);
        container.setInteractive({
            hitArea: new Phaser.Geom.Rectangle(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight),
            hitAreaCallback: Phaser.Geom.Rectangle.Contains,
            useHandCursor: true
        });

        // Interactivity: Hover (pointerover / pointerout)
        container.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 200,
                ease: 'Power2'
            });
        });

        container.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 200,
                ease: 'Power2'
            });
        });

        // Interactivity: Click (pointerdown)
        container.on('pointerdown', () => {
            // Update the Svelte store with this card's data
            selectedCard.set(card);
            
            // Add a small click animation
            this.tweens.add({
                targets: container,
                y: container.y - 10,
                yoyo: true,
                duration: 100,
                ease: 'Sine.easeInOut'
            });
        });
    }
}
