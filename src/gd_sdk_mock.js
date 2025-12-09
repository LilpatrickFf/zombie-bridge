// --- GameDistribution SDK Mock ---
// This file simulates the required functions for the GameDistribution SDK.
// The user should replace this with the actual GD SDK script and key in index.html.

const GD_SDK = {
    _initialized: false,

    init: function(callback) {
        console.log("GD_SDK: Initializing (Mock Mode)...");
        this._initialized = true;
        // Simulate a successful initialization delay
        setTimeout(() => {
            console.log("GD_SDK: Initialization complete.");
            if (callback) callback();
        }, 500);
    },

    gameplayStart: function() {
        if (!this._initialized) return;
        console.log("GD_SDK: Gameplay started. Ad break is now disabled.");
    },

    gameplayStop: function() {
        if (!this._initialized) return;
        console.log("GD_SDK: Gameplay stopped. Ad break is now enabled.");
    },

    showAd: function(type, callbacks) {
        if (!this._initialized) {
            console.warn("GD_SDK: Cannot show ad, not initialized.");
            if (callbacks && callbacks.adFinished) callbacks.adFinished();
            return;
        }

        console.log(`GD_SDK: Showing ${type} ad (Mock).`);
        
        // Simulate ad display time
        setTimeout(() => {
            console.log(`GD_SDK: ${type} ad finished (Mock).`);
            if (callbacks && callbacks.adFinished) {
                callbacks.adFinished();
            }
        }, 2000);
    }
};

// Expose the mock globally as the actual SDK would
window.GD_SDK = GD_SDK;
