// Global game state manager
// LevelManager is now exposed globally from src/LevelManager.js
const levelManager = new LevelManager();

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800, // Standard web game width
    height: 600, // Standard web game height
    parent: 'phaser-game', // ID of the DOM element to add the game to
    physics: {
        default: 'arcade', // Simple and fast physics engine for this type of game
        arcade: {
            gravity: { y: 800 }, // Standard gravity
            debug: false // Set to true for debugging physics bodies
        }
    },
    scene: [
        GameScene // GameScene is now exposed globally from src/scenes/GameScene.js
    ],
    scale: {
        mode: Phaser.Scale.FIT, // Scale the game to fit the screen
        autoCenter: Phaser.Scale.CENTER_BOTH // Center the game both horizontally and vertically
    },
    render: {
        pixelArt: true // For a clean, stylized look
    }
};

// Initialize the game
const game = new Phaser.Game(config);
