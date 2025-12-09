import Phaser from 'phaser';
import { levelManager } from '../main';

const BLOCK_TYPES = [
    { key: 'block_red', mergeTo: 'block_orange' },
    { key: 'block_orange', mergeTo: 'block_yellow' },
    { key: 'block_yellow', mergeTo: 'block_green' },
    { key: 'block_green', mergeTo: null } // Final block type
];

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // Placeholder for asset loading
        this.load.image('background', 'assets/images/background.png');
        this.load.image('player', 'assets/images/player.png');
        this.load.image('switch', 'assets/images/switch.png');
        this.load.image('block_red', 'assets/images/block_red.png');
        this.load.image('block_orange', 'assets/images/block_orange.png');
        this.load.image('block_yellow', 'assets/images/block_yellow.png');
        this.load.image('block_green', 'assets/images/block_green.png');
        this.load.image('zombie', 'assets/images/zombie.png');
        this.load.image('safe_zone', 'assets/images/safe_zone.png');

        // Load Audio
        this.load.audio('drop_sfx', 'assets/audio/drop.mp3');
        this.load.audio('merge_sfx', 'assets/audio/merge.mp3');
        this.load.audio('zombie_groan_sfx', 'assets/audio/zombie_groan.mp3');
        this.load.audio('win_sfx', 'assets/audio/win.mp3');
        this.load.audio('lose_sfx', 'assets/audio/lose.mp3');
    }

    create() {
        // 0. Set up GameMonetize SDK event listeners
        document.addEventListener('sdk_game_pause', this.pauseGame.bind(this));
        document.addEventListener('sdk_game_start', this.resumeGame.bind(this));

        // 1. Set up the background and environment
        this.add.image(400, 300, 'background').setOrigin(0.5).setScale(1.5);

        // Display current level info
        const currentLevel = levelManager.getCurrentLevel();
        this.add.text(400, 10, `Level ${currentLevel.id}: ${currentLevel.name}`, { fontSize: '24px', fill: '#ffffff' }).setOrigin(0.5);
        this.add.text(400, 40, `Objective: ${currentLevel.winCondition}`, { fontSize: '18px', fill: '#ffffff' }).setOrigin(0.5);
        this.blockLimitText = this.add.text(650, 50, `Blocks Left: ${currentLevel.blockLimit}`, { fontSize: '24px', fill: '#ffffff' });

        // 2. Create the chasm and the ground
        this.ground = this.physics.add.staticGroup();
        // Left platform (where the player starts)
        this.ground.create(100, 580, 'ground_platform').setScale(0.5, 1).refreshBody();
        // Right platform (the safe zone)
        const currentLevel = levelManager.getCurrentLevel();
        const safeZoneX = 800 - currentLevel.chasmWidth / 2; // Dynamically position safe zone
        this.safeZone = this.ground.create(safeZoneX, 580, 'safe_zone').setScale(0.5, 1).refreshBody();
        // 3. Create the player character
        this.player = this.physics.add.sprite(100, 500, 'player');
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.ground);

        // 4. Create the drop switch
        this.dropSwitch = this.add.sprite(150, 550, 'switch');

        // 5. Initialize game state variables
        this.isDropping = false;
        this.currentBlock = null;
        this.blocks = this.physics.add.group(); // Group for all stacked blocks

        // 6. Set up input controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.keyboard.on('keydown-SPACE', this.handleDrop, this);

        // 7. Start the zombie horde
        this.zombies = this.physics.add.group();
        const currentLevel = levelManager.getCurrentLevel();
        this.zombieSpawnTimer = this.time.addEvent({
            delay: currentLevel.zombieSpawnDelay,
            callback: this.spawnZombie,
            callbackScope: this,
            loop: true
        });

        // Add a visual timer for the first zombie
        this.zombieTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateZombieTimer,
            callbackScope: this,
            loop: true
        });
        this.zombieTimeRemaining = levelManager.getCurrentLevel().zombieSpawnDelay / 1000; // Initial spawn time
        this.zombieTimerText = this.add.text(50, 50, 'Zombies in: 5', { fontSize: '24px', fill: '#ff0000' });

        // 8. Start the block spawning loop
        this.time.addEvent({
            delay: 2000, // Spawn a new block every 2 seconds
            callback: this.spawnBlock,
            callbackScope: this,
            loop: true
        });

        // Play ambient zombie groan
        this.ambientSound = this.sound.add('zombie_groan_sfx', { loop: true, volume: 0.5 });
        this.ambientSound.play();

        // 9. Set up collision between blocks and ground
        this.physics.add.collider(this.blocks, this.ground, this.handleBlockStop, null, this);
        this.physics.add.collider(this.blocks, this.blocks, this.handleBlockCollision, null, this);

        // 10. Set up the camera to follow the action (optional, but good for a dynamic feel)
        this.cameras.main.setBounds(0, 0, 800, 600);
        this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
    }

    update() {
        // Player movement logic
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }

        // Check if player is on the switch
        const onSwitch = Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.dropSwitch.getBounds());
        if (onSwitch) {
            // Visual feedback for being on the switch
            this.dropSwitch.setTint(0x00ff00);
        } else {
            this.dropSwitch.clearTint();
        }

        // Zombie movement logic (simple constant movement)
        const currentLevel = levelManager.getCurrentLevel();
        this.zombies.children.each(zombie => {
            zombie.setVelocityX(currentLevel.zombieSpeed); // Dynamic speed
        });

        // Check for block limit failure
        const failCondition = levelManager.checkFailCondition();
        if (failCondition) {
            this.gameOver(failCondition);
        }

        // Update blocks left display
        this.blockLimitText.setText(`Blocks Left: ${currentLevel.blockLimit - levelManager.blocksDropped}`);

        // Check for Game Over (zombie reaches player)
        this.physics.overlap(this.player, this.zombies, () => this.gameOver("Eaten by Zombies!"), null, this);

        // Check for Level Win (player reaches safe zone)
        if (levelManager.checkWinCondition(this.player.x)) {
            this.levelWin();
        }
    }

    spawnBlock() {
        if (this.currentBlock) return; // Wait for the previous block to be dropped

        // Randomly select a block type from the first level
        const blockType = BLOCK_TYPES[0].key;
        this.currentBlock = this.blocks.create(400, 50, blockType);
        this.currentBlock.setData('type', blockType); // Store the block type for merging
        this.currentBlock.setImmovable(true); // Blocks start as immovable while swinging
        this.currentBlock.body.allowGravity = false;

        // Start the swinging animation (simple tween for now)
        this.tweens.add({
            targets: this.currentBlock,
            x: { from: 200, to: 600 },
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    handleDrop() {
        // Only drop if a block is swinging and the player is on the switch
        const onSwitch = Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), this.dropSwitch.getBounds());

        if (this.currentBlock && onSwitch) {
            this.tweens.killTweensOf(this.currentBlock); // Stop the swinging
            this.currentBlock.setImmovable(false); // Make it movable
            this.currentBlock.body.allowGravity = true; // Let it fall
            this.currentBlock = null; // Clear the current block

            // Add sound effect for dropping
            this.sound.play('drop_sfx', { volume: 0.8 });

            // Record the drop
            levelManager.recordDrop();
        }
    }

    handleBlockStop(block, platform) {
        // Stop the block from moving once it lands on the ground/platform
        block.setVelocity(0, 0);
        block.setImmovable(true);
        block.body.allowGravity = false;
    }

    handleBlockCollision(block1, block2) {
        // This is for block-to-block collision, primarily for merging

        // Stop the block that just landed (block1) from moving
        block1.setVelocity(0, 0);
        block1.setImmovable(true);
        block1.body.allowGravity = false;

        // Merge Logic
        const type1 = block1.getData('type');
        const type2 = block2.getData('type');

        if (type1 === type2) {
            // Find the merge result
            const mergeRule = BLOCK_TYPES.find(b => b.key === type1);
            const nextType = mergeRule ? mergeRule.mergeTo : null;

            if (nextType) {
                // 1. Destroy the two blocks
                block1.destroy();
                block2.destroy();

                // 2. Create the merged block at the average position
                const mergedX = (block1.x + block2.x) / 2;
                const mergedY = (block1.y + block2.y) / 2;

                // Add particle effect for the merge
                this.createMergeParticles(mergedX, mergedY, nextType);
                this.sound.play('merge_sfx', { volume: 0.7 });

                const mergedBlock = this.blocks.create(mergedX, mergedY, nextType);
                mergedBlock.setData('type', nextType);
                mergedBlock.setImmovable(true);
                mergedBlock.body.allowGravity = false;
                mergedBlock.setVelocity(0, 0);

                // Add visual feedback for the merge (Juicy Tween)
                this.tweens.add({
                    targets: mergedBlock,
                    scale: { from: 0.5, to: 1.1, to: 1.0 }, // Squash and stretch effect
                    duration: 200,
                    ease: 'Bounce.easeOut'
                });

                // Screen shake for impact
                this.cameras.main.shake(50, 0.005);

                // Record the merge
                levelManager.recordMerge();
            }een to the left
        const zombie = this.zombies.create(-50, 500, 'zombie');
        zombie.setCollideWorldBounds(true);
        this.physics.add.collider(zombie, this.ground);
        this.zombieTimeRemaining = this.zombieSpawnTimer.delay / 1000; // Reset timer display
    }

    updateZombieTimer() {
        this.zombieTimeRemaining--;
        if (this.zombieTimeRemaining < 0) {
            this.zombieTimeRemaining = 0;
        }
        this.zombieTimerText.setText(`Zombies in: ${this.zombieTimeRemaining}`);
    }

    gameOver(reason) {
        // Game Over
        this.isGameOver = true;
        this.isLevelWin = false;
        this.pauseGame(); // Pause all game activity

        this.sound.play('lose_sfx');
        this.add.text(400, 300, `GAME OVER\n${reason}`, { fontSize: '48px', fill: '#ff0000' }).setOrigin(0.5);

        // Show ad and wait for resume event to restart
        if (typeof sdk !== 'undefined' && sdk.showBanner !== 'undefined') {
            sdk.showBanner();
            // The resumeGame() function will be called by the SDK_GAME_START event,
            // which will then handle the scene restart.
        } else {
            // No SDK, just restart after a delay
            this.time.delayedCall(3000, () => {
                this.scene.restart();
            }, [], this);
        }
    }

    levelWin() {
        // Level Win
        this.isLevelWin = true;
        this.isGameOver = false;
        this.pauseGame(); // Pause all game activity

        this.sound.play('win_sfx');

        const stars = levelManager.calculateStars();
        const message = `LEVEL COMPLETE!\n${stars} STAR${stars === 1 ? '' : 'S'} EARNED!`;
        this.add.text(400, 300, message, { fontSize: '48px', fill: '#00ff00' }).setOrigin(0.5);

        // Show ad and wait for resume event to advance
        if (typeof sdk !== 'undefined' && sdk.showBanner !== 'undefined') {
            sdk.showBanner();
            // The resumeGame() function will be called by the SDK_GAME_START event,
            // which will then handle the level advance/restart.
        } else {
            // No SDK, just advance after a delay
            this.time.delayedCall(3000, () => {
                if (levelManager.nextLevel()) {
                    this.scene.restart();
                } else {
                    this.add.text(400, 400, 'CAMPAIGN COMPLETE!', { fontSize: '32px', fill: '#ffff00' }).setOrigin(0.5);
                }
            }, [], this);
        }
    }

    // --- GameMonetize SDK Helper Functions ---

    pauseGame() {
        this.zombieSpawnTimer.paused = true;
        this.zombieTimer.paused = true;
        this.physics.pause();
        this.ambientSound.pause();
        this.scene.pause(); // Pause the scene update loop
    }

    resumeGame() {
        this.zombieSpawnTimer.paused = false;
        this.zombieTimer.paused = false;
        this.physics.resume();
        this.ambientSound.resume();
        this.scene.resume(); // Resume the scene update loop

        // Check if we need to restart or advance the level after the ad
        if (this.isGameOver) {
            this.isGameOver = false; // Reset flag
            this.scene.restart();
        } else if (this.isLevelWin) {
            this.isLevelWin = false; // Reset flag
            if (levelManager.nextLevel()) {
                this.scene.restart();
            } else {
                // Campaign complete message is already displayed in levelWin()
            }
        }
    }

    // --- End GameMonetize SDK Helper Functions ---

    createMergeParticles(x, y, textureKey) {
        const particles = this.add.particles(x, y, textureKey, {
            speed: 100,
            lifespan: 500,
            gravityY: 200,
            scale: { start: 0.5, end: 0 },
            quantity: 10,
            blendMode: 'ADD'
        });

        // Stop the emitter after a short burst
        this.time.delayedCall(100, () => {
            particles.destroy();
        });
    }
}

export default GameScene;
