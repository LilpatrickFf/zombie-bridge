// --- GameMonetize.co SDK Mock ---
// This file simulates the required functions for the GameMonetize.co SDK.

// Global object to simulate the 'sdk' object exposed by GameMonetize
window.sdk = {
    showBanner: function() {
        console.log("GameMonetize SDK: showBanner() called (Mock).");

        // In a real scenario, the SDK would fire the SDK_GAME_PAUSE event here.
        // We will simulate this by dispatching the event ourselves.
        document.dispatchEvent(new Event('sdk_game_pause'));

        // Simulate ad display time
        setTimeout(() => {
            console.log("GameMonetize SDK: Ad finished (Mock).");
            // After the ad, the SDK would fire the SDK_GAME_START event.
            document.dispatchEvent(new Event('sdk_game_start'));
        }, 2000); // 2-second mock ad
    }
};

// Global object to simulate the SDK_OPTIONS setup in index.html
window.SDK_OPTIONS = {
    gameId: "YOUR_GAME_ID_HERE", // User must replace this
    onEvent: function (a) {
        switch (a.name) {
            case "SDK_GAME_PAUSE":
                console.log("GameMonetize SDK: Event SDK_GAME_PAUSE received.");
                document.dispatchEvent(new Event('sdk_game_pause'));
                break;
            case "SDK_GAME_START":
                console.log("GameMonetize SDK: Event SDK_GAME_START received.");
                document.dispatchEvent(new Event('sdk_game_start'));
                break;
            case "SDK_READY":
                console.log("GameMonetize SDK: Event SDK_READY received.");
                break;
        }
    }
};

(function (a, b, c) {
    var d = a.getElementsByTagName(b)[0];
    a.getElementById(c) || (a = a.createElement(b), a.id = c, a.src = "https://api.gamemonetize.com/sdk.js", d.parentNode.insertBefore(a, d))
})(document, "script", "gamemonetize-sdk");

console.log("GameMonetize SDK Mock loaded.");
