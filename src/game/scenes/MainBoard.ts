import Phaser from 'phaser';
import cardsData from '../../data/cards.json';
import fusionsData from '../../data/fusions.json';
import { selectedCard, currentTurn } from '../../store';

export class MainBoard extends Phaser.Scene {
    private boardSlots: Phaser.GameObjects.Zone[] = [];
    private handCards: Phaser.GameObjects.Container[] = [];
    private isFirstTurn: boolean = true;

    // Cast JSON to explicit dictionary type to satisfy TypeScript
    private fusionsDict: Record<string, string> = fusionsData;

    constructor() {
        super({ key: 'MainBoard' });
    }

    preload() {
        // Load the SVGs for all cards, including fusions
        cardsData.forEach(card => {
            this.load.svg(`template_${card.id}`, card.visuals.template);
            this.load.svg(`art_${card.id}`, card.visuals.art);
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#0b0e14');
        
        // Generate Particle Texture for Juice
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 1);
        g.fillCircle(8, 8, 8);
        g.generateTexture('particle', 16, 16);
        g.destroy();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // ----------------------------------------------------
        // 1. ZONES SETUP (5 BATTLEFIELD SLOTS)
        // ----------------------------------------------------
        
        const slotWidth = 200 * 0.8; // 160
        const slotHeight = 300 * 0.8; // 240
        const slotGap = 20;
        const totalSlots = 5;
        
        const totalBoardWidth = (totalSlots * slotWidth) + ((totalSlots - 1) * slotGap);
        const boardStartX = (width / 2) - (totalBoardWidth / 2) + (slotWidth / 2);
        const boardY = height / 2 - 50;

        for (let i = 0; i < totalSlots; i++) {
            const x = boardStartX + i * (slotWidth + slotGap);
            const y = boardY;

            // Visual graphics for the slot
            const slotGraphics = this.add.graphics();
            slotGraphics.lineStyle(2, 0x34495e, 0.6);
            slotGraphics.strokeRoundedRect(x - slotWidth/2, y - slotHeight/2, slotWidth, slotHeight, 10);
            
            // Text placeholder
            this.add.text(x, y, 'SLOT', { 
                fontSize: '16px', color: '#34495e', fontStyle: 'bold' 
            }).setOrigin(0.5).setAlpha(0.3);
            
            // Drop Zone
            const zone = this.add.zone(x, y, slotWidth, slotHeight).setRectangleDropZone(slotWidth, slotHeight);
            zone.setData('occupiedBy', null);
            
            this.boardSlots.push(zone);
        }

        const handY = height - 150;
        const handGraphics = this.add.graphics();
        handGraphics.lineStyle(2, 0x1abc9c, 0.2);
        handGraphics.strokeRect(0, handY - 100, width, 200);

        // 2. HAND MANAGER (Initial Setup)
        // We filter out card_004 (the fusion result) so it doesn't start in the hand
        const initialCards = cardsData.filter(c => c.id !== 'card_004');
        
        initialCards.forEach(card => {
            const container = this.createCardContainer(card, 0, handY); // Temp X
            this.handCards.push(container);
        });

        // Align them properly now that they are in the array
        this.realignHand();

        // 3. STORE SUBSCRIPTION (TURN LOGIC)
        const unsubscribe = currentTurn.subscribe(turn => {
            if (turn === 'enemy') {
                this.handleEnemyTurn();
            } else if (turn === 'player') {
                if (this.isFirstTurn) {
                    this.isFirstTurn = false; // Skip drawing on absolute first load
                } else {
                    this.handlePlayerTurnStart();
                }
            }
        });

        // Prevent memory leak on scene restart/shutdown
        this.events.on('shutdown', () => {
            unsubscribe();
        });

        // 4. GLOBAL DRAG EVENTS & FUSION LOGIC
        this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container) => {
            gameObject.setData('isDragging', true);
            gameObject.setDepth(100); 
            
            this.tweens.add({ targets: gameObject, scale: 1.15, duration: 150, ease: 'Power1' });
        });

        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dragX: number, dragY: number) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dropped: boolean) => {
            gameObject.setData('isDragging', false);
            
            let fusionTarget: Phaser.GameObjects.Container | null = null;
            
            for (const otherCard of this.handCards) {
                if (otherCard === gameObject) continue;
                
                const targetBounds = otherCard.getBounds();
                const isIntersecting = Phaser.Geom.Rectangle.Contains(targetBounds, gameObject.x, gameObject.y);
                
                if (isIntersecting) {
                    fusionTarget = otherCard;
                    break;
                }
            }

            if (fusionTarget) {
                this.handleFusionAttempt(gameObject, fusionTarget);
            } 
            else if (!dropped) {
                this.returnCardToHand(gameObject);
            }
        });

        this.input.on('drop', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container, dropZone: Phaser.GameObjects.Zone) => {
            if (this.boardSlots.includes(dropZone)) {
                // Check if slot is occupied
                if (dropZone.getData('occupiedBy')) {
                    this.returnCardToHand(gameObject);
                } else {
                    // Empty slot -> Snap!
                    dropZone.setData('occupiedBy', gameObject);
                    gameObject.setData('inPlay', true);
                    
                    // Remove from hand and realign remaining cards
                    this.handCards = this.handCards.filter(c => c !== gameObject);
                    this.realignHand();
                    
                    // Disable dragging now that it's on the board
                    this.input.setDraggable(gameObject, false);
                    
                    this.tweens.add({
                        targets: gameObject,
                        x: dropZone.x,
                        y: dropZone.y,
                        scale: 0.8, // Match slot scale
                        depth: 10, 
                        duration: 300,
                        ease: 'Back.easeOut'
                    });
                }
            } else {
                this.returnCardToHand(gameObject);
            }
        });
    }

    // ----------------------------------------------------
    // TURN LOGIC & HELPERS
    // ----------------------------------------------------

    private handleEnemyTurn() {
        console.log("Turno do Inimigo!");
        
        // Disable drag on player's hand cards
        this.handCards.forEach(card => {
            this.input.setDraggable(card, false);
        });

        // Simulate AI thinking for 2 seconds
        this.time.delayedCall(2000, () => {
            console.log("Inimigo terminou o turno.");
            // Pass turn back to player via Svelte Store
            currentTurn.set('player');
        });
    }

    private handlePlayerTurnStart() {
        console.log("Turno do Jogador!");
        
        // Re-enable drag on hand cards
        this.handCards.forEach(card => {
            this.input.setDraggable(card, true);
        });

        this.drawCard();
    }

    private drawCard() {
        // Only draw playable cards, not fusion results
        const playableCards = cardsData.filter(c => c.id !== 'card_004');
        const randomIndex = Phaser.Math.Between(0, playableCards.length - 1);
        const randomCardData = playableCards[randomIndex];
        
        const width = this.cameras.main.width;
        const handY = this.cameras.main.height - 150;
        
        // Instantiate the new card off-screen to the right
        const newContainer = this.createCardContainer(randomCardData, width + 200, handY);
        this.handCards.push(newContainer);
        
        // Call realignHand to animate it sliding into place
        this.realignHand();
    }

    // ----------------------------------------------------
    // FUSION LOGIC
    // ----------------------------------------------------

    private createCardContainer(card: any, x: number, y: number): Phaser.GameObjects.Container {
        const cardWidth = 200;
        const cardHeight = 300;
        
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

        // Save reference data
        container.setData('handX', x);
        container.setData('handY', y);
        container.setData('isPlayed', false);
        container.setData('isDragging', false);
        container.setData('cardData', card);

        this.input.setDraggable(container);
        
        // Hover
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

        // Click
        container.on('pointerdown', () => {
            selectedCard.set(card);
            this.handCards.forEach(c => c.setDepth(1));
            container.setDepth(2);
        });

        return container;
    }

    private handleFusionAttempt(cardAObj: Phaser.GameObjects.Container, cardBObj: Phaser.GameObjects.Container) {
        const cardA = cardAObj.getData('cardData');
        const cardB = cardBObj.getData('cardData');
        
        const tagsA: string[] = cardA.fusion_tags || [];
        const tagsB: string[] = cardB.fusion_tags || [];
        
        let resultingCardId: string | null = null;

        // Cross-check all combinations of tags (A+B and B+A) to make order irrelevant
        for (const tA of tagsA) {
            for (const tB of tagsB) {
                const key1 = `${tA}+${tB}`;
                const key2 = `${tB}+${tA}`;
                
                if (this.fusionsDict[key1]) {
                    resultingCardId = this.fusionsDict[key1];
                    break;
                } else if (this.fusionsDict[key2]) {
                    resultingCardId = this.fusionsDict[key2];
                    break;
                }
            }
            if (resultingCardId) break;
        }

        if (resultingCardId) {
            console.log(`[FUSION SUCCESS] ${cardA.name} + ${cardB.name} -> ID: ${resultingCardId}`);
            
            // 1. Disable interactivity to prevent bugs
            cardAObj.disableInteractive();
            cardBObj.disableInteractive();

            // 2. Tween A into B's position
            this.tweens.add({
                targets: cardAObj,
                x: cardBObj.x,
                y: cardBObj.y,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    // 3. Tween both to scale 0 and rotate 360
                    this.tweens.add({
                        targets: [cardAObj, cardBObj],
                        scaleX: 0,
                        scaleY: 0,
                        angle: 360,
                        duration: 400,
                        onComplete: () => {
                            // 4. Destroy old containers
                            const x = cardBObj.x;
                            const y = cardBObj.y;
                            cardAObj.destroy();
                            cardBObj.destroy();
                            
                            // Remove from hand array
                            this.handCards = this.handCards.filter(c => c !== cardAObj && c !== cardBObj);

                            // 5. Instantiate new fusion card
                            const newCardData = cardsData.find(c => c.id === resultingCardId);
                            if (newCardData) {
                                const newContainer = this.createCardContainer(newCardData, x, y);
                                newContainer.setScale(0);
                                this.handCards.push(newContainer);

                                // --- PARTICLE EMITTER (JUICE) ---
                                const emitter = this.add.particles(x, y, 'particle', {
                                    speed: { min: -200, max: 200 },
                                    scale: { start: 1, end: 0 },
                                    blendMode: 'ADD',
                                    lifespan: 600,
                                    emitting: false
                                });
                                emitter.setDepth(100);
                                emitter.explode(40);

                                this.time.delayedCall(1000, () => {
                                    emitter.destroy();
                                });
                                // --------------------------------

                                // 6. Pop animation
                                this.tweens.add({
                                    targets: newContainer,
                                    scale: 1,
                                    duration: 300,
                                    ease: 'Back.easeOut',
                                    onComplete: () => {
                                        // 7. Realign the remaining cards
                                        this.realignHand();
                                    }
                                });
                            }
                        }
                    });
                }
            });
        } else {
            console.log(`[FUSION FAILED] ${cardA.name} + ${cardB.name} have no valid combination.`);
            this.returnCardToHand(cardAObj);
        }
    }

    private realignHand() {
        const width = this.cameras.main.width;
        const handY = this.cameras.main.height - 150;
        
        const cardWidth = 200;
        const gap = 20;
        const totalCards = this.handCards.length;
        
        if (totalCards === 0) return;

        const totalWidth = (totalCards * cardWidth) + ((totalCards - 1) * gap);
        const startX = (width / 2) - (totalWidth / 2) + (cardWidth / 2);

        this.handCards.forEach((container, index) => {
            const newX = startX + index * (cardWidth + gap);
            
            // Update the stored original position
            container.setData('handX', newX);
            container.setData('handY', handY);

            // Animate to new position
            this.tweens.add({
                targets: container,
                x: newX,
                y: handY,
                duration: 300,
                ease: 'Cubic.easeOut'
            });
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
            angle: 0,
            duration: 400,
            ease: 'Cubic.easeOut'
        });
    }
}
