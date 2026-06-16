import Phaser from 'phaser';
import cardsData from '../../data/cards.json';
import { selectedCard } from '../../store';

export class MainBoard extends Phaser.Scene {
    private boardZone!: Phaser.GameObjects.Zone;
    private handCards: Phaser.GameObjects.Container[] = [];

    constructor() {
        super({ key: 'MainBoard' });
    }

    preload() {
        // Load the SVGs for all cards. Phaser ignores duplicates automatically.
        cardsData.forEach(card => {
            this.load.svg(`template_${card.id}`, card.visuals.template);
            this.load.svg(`art_${card.id}`, card.visuals.art);
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0b0e14');
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // ----------------------------------------------------
        // 1. ZONES SETUP
        // ----------------------------------------------------
        
        const boardWidth = 600;
        const boardHeight = 300;
        const boardX = width / 2;
        const boardY = height / 2 - 50;

        const boardGraphics = this.add.graphics();
        boardGraphics.lineStyle(4, 0x34495e, 0.5);
        boardGraphics.strokeRoundedRect(boardX - boardWidth/2, boardY - boardHeight/2, boardWidth, boardHeight, 15);
        this.add.text(boardX, boardY, 'BATTLEFIELD', { 
            fontSize: '28px', color: '#34495e', fontStyle: 'bold' 
        }).setOrigin(0.5).setAlpha(0.3);

        this.boardZone = this.add.zone(boardX, boardY, boardWidth, boardHeight)
            .setRectangleDropZone(boardWidth, boardHeight);

        const handY = height - 150;
        const handGraphics = this.add.graphics();
        handGraphics.lineStyle(2, 0x1abc9c, 0.2);
        handGraphics.strokeRect(0, handY - 100, width, 200);

        // ----------------------------------------------------
        // 2. HAND MANAGER (ITERATIVE RENDER)
        // ----------------------------------------------------
        
        const cardWidth = 200;
        const cardHeight = 300;
        const gap = 20;
        const totalCards = cardsData.length;
        
        // Horizontal distribution math
        const totalWidth = (totalCards * cardWidth) + ((totalCards - 1) * gap);
        const startX = (width / 2) - (totalWidth / 2) + (cardWidth / 2);

        cardsData.forEach((card, index) => {
            const x = startX + index * (cardWidth + gap);
            const y = handY;

            const container = this.add.container(x, y);
            
            const templateImg = this.add.image(0, 0, `template_${card.id}`);
            templateImg.setOrigin(0.5);

            const artImg = this.add.image(0, -50, `art_${card.id}`);
            artImg.setOrigin(0.5);

            const nameText = this.add.text(0, 60, card.name, {
                fontSize: '16px', color: '#f1c40f', fontStyle: 'bold',
                shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 2, fill: true }
            }).setOrigin(0.5);

            const atkText = this.add.text(-40, 110, `ATK ${card.atk}`, {
                fontSize: '14px', color: '#ff4757', fontStyle: 'bold'
            }).setOrigin(0.5);

            const defText = this.add.text(40, 110, `DEF ${card.def}`, {
                fontSize: '14px', color: '#70a1ff', fontStyle: 'bold'
            }).setOrigin(0.5);

            container.add([templateImg, artImg, nameText, atkText, defText]);
            
            container.setSize(cardWidth, cardHeight);
            container.setInteractive({
                hitArea: new Phaser.Geom.Rectangle(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight),
                hitAreaCallback: Phaser.Geom.Rectangle.Contains,
                useHandCursor: true
            });

            // Save state and reference
            container.setData('handX', x);
            container.setData('handY', y);
            container.setData('isPlayed', false);
            container.setData('isDragging', false);
            container.setData('cardData', card);

            this.input.setDraggable(container);
            
            this.handCards.push(container); // Add to hand array

            // Hover and click events
            container.on('pointerover', () => {
                if (!container.getData('isDragging')) {
                    this.tweens.add({ targets: container, scale: 1.05, duration: 200, ease: 'Power2' });
                }
            });

            container.on('pointerout', () => {
                if (!container.getData('isDragging')) {
                    this.tweens.add({ targets: container, scale: 1, duration: 200, ease: 'Power2' });
                }
            });

            container.on('pointerdown', () => {
                selectedCard.set(card);
                // Bring clicked card to front inside hand
                this.handCards.forEach(c => c.setDepth(1));
                container.setDepth(2);
            });
        });

        // ----------------------------------------------------
        // 3. GLOBAL DRAG EVENTS & FUSION LOGIC
        // ----------------------------------------------------

        this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container) => {
            gameObject.setData('isDragging', true);
            gameObject.setDepth(100); 
            
            this.tweens.add({
                targets: gameObject,
                scale: 1.15,
                duration: 150,
                ease: 'Power1'
            });
        });

        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dropped: boolean) => {
            gameObject.setData('isDragging', false);
            
            // FUSION DETECTION LOGIC
            let fusionTarget: Phaser.GameObjects.Container | null = null;
            
            for (const otherCard of this.handCards) {
                // Ignore self
                if (otherCard === gameObject) continue;
                
                const targetBounds = otherCard.getBounds();
                
                // We check if the CENTER (x, y) of the dragged card is inside the bounds of the target card.
                // This is mathematically better than pure Rectangle-to-Rectangle intersection
                // because it prevents accidental fusions when cards just slightly touch borders.
                const isIntersecting = Phaser.Geom.Rectangle.Contains(targetBounds, gameObject.x, gameObject.y);
                
                if (isIntersecting) {
                    fusionTarget = otherCard;
                    break; // Found our target!
                }
            }

            if (fusionTarget) {
                const card1 = gameObject.getData('cardData');
                const card2 = fusionTarget.getData('cardData');
                
                // Mock fusion triggered
                console.log(`Tentativa de Fusão: [${card1.name}] + [${card2.name}]`);
                
                // Return to hand as we haven't implemented the visual fusion destruction/creation yet
                this.returnCardToHand(gameObject);
            } 
            else if (!dropped) {
                // Not dropped on the board and no fusion triggered
                this.returnCardToHand(gameObject);
            }
        });

        // Drop on Battlefield
        this.input.on('drop', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dropZone: Phaser.GameObjects.Zone) => {
            if (dropZone === this.boardZone) {
                gameObject.setData('isPlayed', true);
                
                this.tweens.add({
                    targets: gameObject,
                    x: dropZone.x,
                    y: dropZone.y,
                    scale: 0.95, 
                    depth: 10, 
                    duration: 300,
                    ease: 'Back.easeOut'
                });
            } else {
                this.returnCardToHand(gameObject);
            }
        });
    }

    private returnCardToHand(gameObject: Phaser.GameObjects.Container) {
        gameObject.setData('isPlayed', false);
        const startX = gameObject.getData('handX');
        const startY = gameObject.getData('handY');

        this.tweens.add({
            targets: gameObject,
            x: startX,
            y: startY,
            scale: 1, 
            depth: 1, 
            duration: 400,
            ease: 'Cubic.easeOut'
        });
    }
}
