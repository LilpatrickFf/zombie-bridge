const LEVEL_DATA = [
    {
        id: 1,
        name: "First Steps",
        chasmWidth: 400, // Distance between left and right platforms
        zombieSpeed: 20,
        zombieSpawnDelay: 5000,
        blockLimit: 10, // Max blocks to drop
        winCondition: "Reach the Safe Zone",
        objective: { type: "reach_x", value: 650 } // Player must reach x=650
    },
    {
        id: 2,
        name: "Wider Gap",
        chasmWidth: 500,
        zombieSpeed: 25,
        zombieSpawnDelay: 4500,
        blockLimit: 12,
        winCondition: "Reach the Safe Zone",
        objective: { type: "reach_x", value: 700 }
    },
    {
        id: 3,
        name: "Merge Test",
        chasmWidth: 450,
        zombieSpeed: 20,
        zombieSpawnDelay: 5000,
        blockLimit: 8,
        winCondition: "Merge 2 blocks",
        objective: { type: "merge_count", value: 1 } // Must perform at least one merge
    },
    {
        id: 4,
        name: "Fast Horde",
        chasmWidth: 400,
        zombieSpeed: 35,
        zombieSpawnDelay: 4000,
        blockLimit: 10,
        winCondition: "Reach the Safe Zone",
        objective: { type: "reach_x", value: 650 }
    }
    // More levels would be added here...
];

class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.currentLevelIndex = 0;
        this.currentLevelData = LEVEL_DATA[this.currentLevelIndex];
        this.blocksDropped = 0;
        this.mergesCount = 0;
        this.starsEarned = 0;
    }

    getCurrentLevel() {
        return this.currentLevelData;
    }

    nextLevel() {
        this.currentLevelIndex++;
        if (this.currentLevelIndex < LEVEL_DATA.length) {
            this.currentLevelData = LEVEL_DATA[this.currentLevelIndex];
            this.resetStats();
            return true; // Successfully moved to next level
        } else {
            // Game finished
            return false;
        }
    }

    resetStats() {
        this.blocksDropped = 0;
        this.mergesCount = 0;
        this.starsEarned = 0;
    }

    recordDrop() {
        this.blocksDropped++;
    }

    recordMerge() {
        this.mergesCount++;
    }

    checkWinCondition(playerX) {
        const objective = this.currentLevelData.objective;

        switch (objective.type) {
            case "reach_x":
                return playerX >= objective.value;
            case "merge_count":
                return this.mergesCount >= objective.value;
            default:
                return false;
        }
    }

    checkFailCondition() {
        // Fail condition 1: Block limit reached
        if (this.blocksDropped >= this.currentLevelData.blockLimit) {
            return "Block Limit Reached";
        }
        // Fail condition 2: Zombie reaches player (handled in GameScene)
        return null;
    }

    calculateStars() {
        // Simple star calculation based on blocks remaining
        const blocksRemaining = this.currentLevelData.blockLimit - this.blocksDropped;
        if (blocksRemaining >= 5) {
            return 3;
        } else if (blocksRemaining >= 2) {
            return 2;
        } else if (blocksRemaining >= 0) {
            return 1;
        }
        return 0;
    }
}

export default LevelManager;
