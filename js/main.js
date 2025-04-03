/**
 * Main Application
 * Initializes the Phaser game and handles UI interactions
 */
document.addEventListener('DOMContentLoaded', function() {
    // Pre-load Inter font before starting the game
    // This ensures the font is available for Phaser text rendering
    const fontPreloader = document.createElement('div');
    fontPreloader.style.fontFamily = 'Inter, sans-serif';
    fontPreloader.style.position = 'absolute';
    fontPreloader.style.left = '-9999px';
    fontPreloader.style.visibility = 'hidden';
    fontPreloader.textContent = 'Font preloader - Inter';
    document.body.appendChild(fontPreloader);
    
    // Configure and start Phaser game with a slight delay to ensure font is loaded
    setTimeout(() => {
        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: 'game-container',
            scene: [RaceScene],
            backgroundColor: '#55aa55',
            pixelArt: false
        };
        
        // Initialize the game
        const game = new Phaser.Game(config);
        
        // Remove font preloader
        document.body.removeChild(fontPreloader);
        
        // Store scene reference once created
        let raceScene = null;
        
        // Setup event handlers
        const startRaceButton = document.getElementById('start-race');
        const resetRaceButton = document.getElementById('reset-race');
        
        // Hide results panel initially
        const resultsPanel = document.querySelector('.results-panel');
        resultsPanel.style.display = 'none';

        // Function to access the race scene once it's created
        // The 'create' event doesn't exist on game.events in Phaser 3
        // We'll use a slight delay to ensure the scene is ready
        setTimeout(() => {
            raceScene = game.scene.getScene('RaceScene');
            console.log("Race scene initialized:", raceScene);
            
            // Force a full reset to ensure 12 horses are created
            if (raceScene) {
                console.log("Force initializing with numHorses:", raceScene.numHorses);
                raceScene.resetRace();
            }
        }, 1000);
        
        startRaceButton.addEventListener('click', function() {
            console.log("Start race button clicked, race scene:", raceScene);
            if (raceScene && !raceScene.raceInProgress) {
                // Check if the race start sound is already playing
                if (!raceScene.raceStartSoundPlaying) {
                    const startSound = new Audio('assets/race-start.m4a');
                    startSound.volume = 1.0;
                    startSound.play().catch(err => console.error("Failed to play sound:", err));
                    console.log("Playing race start sound from button click");
                    raceScene.raceStartSoundPlaying = true;
                } else {
                    console.log("Race start sound already playing");
                }
                
                raceScene.startRace();
                startRaceButton.disabled = true;
                resetRaceButton.disabled = true;
                
                // Enable reset after a short delay
                setTimeout(() => {
                    resetRaceButton.disabled = false;
                }, 3000);
            }
        });
        
        resetRaceButton.addEventListener('click', function() {
            if (raceScene) {
                raceScene.resetRace();
                startRaceButton.disabled = false;
                raceScene.raceStartSoundPlaying = false; // Reset the flag
            }
        });
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            // Start race with spacebar
            if (event.code === 'Space' && raceScene && !raceScene.raceInProgress) {
                startRaceButton.click();
            }
            
            // Reset race with 'R' key
            if (event.code === 'KeyR') {
                resetRaceButton.click();
            }
        });
        
        // Function to adjust the game container size on window resize
        function resizeGameContainer() {
            if (game.scale) {
                game.scale.resize(window.innerWidth, window.innerHeight);
                
                // Update the race scene track dimensions if it exists
                if (raceScene) {
                    raceScene.updateTrackDimensions();
                }
            }
        }
        
        // Initial resize and event listener
        window.addEventListener('resize', resizeGameContainer);
        setTimeout(resizeGameContainer, 100);
        
        // Create directory for assets if needed
        function ensureAssetsExist() {
            // In a real implementation, this would check if assets exist on the server
            // For this implementation, the assets are generated dynamically in the RaceScene
            console.log("Initializing racing simulator...");
        }
        
        ensureAssetsExist();
    }, 100);
});
