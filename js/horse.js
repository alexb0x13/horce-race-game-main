/**
 * Horse Class
 * Manages individual horses in the race
 */
class Horse {
    constructor(scene, lane, name, color) {
        this.scene = scene;
        this.lane = lane;
        this.name = name || nameGenerator.generateName();
        this.color = color !== undefined ? color : this.getRandomColor();
        
        // Different horses have different skills - some are fast, some have stamina, some accelerate quickly
        // This creates more varied and strategic racing
        
        // Generate random skill distribution - each horse will excel in different areas
        const totalSkillPoints = 3.75; // Total skill points to distribute
        const skillVariance = 0.3; // How much variance to allow in total skill points
        
        // Randomize total skill points slightly to create some overall better/worse horses
        const adjustedSkillPoints = totalSkillPoints + (Math.random() * skillVariance * 2) - skillVariance;
        
        // Distribute skill points with some randomness
        const speedWeight = Math.random() * 0.6 + 0.7; // 0.7-1.3 (speed is important for all horses)
        const staminaWeight = Math.random() * 0.8 + 0.6; // 0.6-1.4
        const accelerationWeight = Math.random() * 0.8 + 0.6; // 0.6-1.4
        
        // Normalize weights so they sum to 1.0
        const totalWeight = speedWeight + staminaWeight + accelerationWeight;
        const normalizedSpeedWeight = speedWeight / totalWeight;
        const normalizedStaminaWeight = staminaWeight / totalWeight;
        const normalizedAccelerationWeight = accelerationWeight / totalWeight;
        
        // Calculate base stats based on weights
        this.baseSpeed = (normalizedSpeedWeight * adjustedSkillPoints * 2.5) + 1.0; // Range ~1.5-3.5
        this.stamina = (normalizedStaminaWeight * adjustedSkillPoints * 0.8) + 0.4; // Range ~0.6-1.2
        this.acceleration = (normalizedAccelerationWeight * adjustedSkillPoints * 0.4) + 0.2; // Range ~0.3-0.6
        
        // Create descriptive traits based on stats
        this.traits = [];
        if (this.baseSpeed > 2.8) this.traits.push("Fast");
        if (this.stamina > 1.0) this.traits.push("Endurance");
        if (this.acceleration > 0.5) this.traits.push("Quick Starter");
        if (this.traits.length === 0) this.traits.push("Balanced");
        
        // Moderate luck factor - still allows for some randomness
        this.luckFactor = Math.random() * 0.2 + 0.05; // Between 0.05 and 0.25 (reduced)
        
        // Current state
        this.currentSpeed = 0;
        this.distance = 0;
        this.currentLap = 1;
        this.finished = false;
        this.finishTime = null;
        this.position = null;
        
        // Enhanced catch-up mechanics
        this.catchUpFactor = 0;
        this.leadHandicap = 0;
        
        // Racing event timers - less frequent events
        this.nextEventTime = 3000 + Math.random() * 4000; // First event occurs 3-7 seconds into race
        this.eventDuration = 0;
        this.currentEvent = null;
        this.eventMultiplier = 1.0;
        
        // More subtle momentum system
        this.momentum = 0; // Ranges from -0.2 to +0.2, affects speed
        
        // Less dramatic lap-specific factors with narrower range for tighter pack
        this.lapFactors = [];
        for (let i = 0; i < this.scene.totalLaps; i++) {
            this.lapFactors.push({
                speedBoost: (Math.random() * 0.2) - 0.1, // Between -0.1 and +0.1 (narrower range)
                staminaBoost: (Math.random() * 0.16) - 0.08 // Between -0.08 and +0.08 (narrower range)
            });
        }
        
        // Sprite configuration
        this.sprite = null;
        this.nameText = null;
        this.connectingLine = null;
        
        // Use a middle lane as the reference path for all horses
        const referenceIndex = Math.floor(this.scene.numHorses / 2) - 1; 
        const laneWidth = Math.min(this.scene.trackWidth, this.scene.trackHeight) / 300; 
        // Set all horses to follow the middle lane's path with minimal variation
        this.laneOffset = (this.scene.numHorses - 1 - referenceIndex) * laneWidth;
        // Add a tiny offset for visual separation (1/10th of the already small lane width)
        this.laneOffset += (this.lane - referenceIndex) * (laneWidth * 0.1);
        
        // Initialize sprite
        this.createSprite();
        
        // Unique bobbing rate for each horse
        this.bobbingRate = 0.015 + (Math.random() * 0.01 - 0.005); // Range: 0.01 to 0.02
        this.bobbingPhase = Math.random() * Math.PI * 2; // Random starting phase (0 to 2π)
    }
    
    createSprite() {
        // Calculate a small horizontal offset based on lane number to fan out horses at the start
        // This will position them slightly to the right
        const horizontalOffset = this.lane * 20; // Adjust this value to control the spread
        
        // Get starting position
        const startPosition = this.scene.getPositionOnTrack(0, this.laneOffset);
        
        // Apply the horizontal offset to fan out horses to the right
        const offsetX = startPosition.x + horizontalOffset;
        
        // Create horse sprite using the silhouette image
        this.sprite = this.scene.add.image(offsetX, startPosition.y, 'horse');
        
        // Scale the sprite to an even smaller size
        const scaleBase = Math.min(this.scene.trackWidth, this.scene.trackHeight) / 35000;
        this.sprite.setScale(Math.max(0.010, scaleBase));
        
        // Flip the sprite horizontally so horses face left at the start of the race
        this.sprite.scaleX = -this.sprite.scaleX;
        
        // Apply color tint to the horse silhouette
        this.sprite.setTint(this.color);
        
        // Set initial rotation to match the track - adjusted for southeast orientation
        this.sprite.rotation = startPosition.rotation + Math.PI/4; // Changed from Math.PI/2 to Math.PI/4 for southeast direction
        
        // Add running animation
        this.legMovement = 0;
        
        // Lane number - position relative to track dimensions
        const laneTextY = this.scene.trackCenterY - (this.scene.trackHeight * 0.4) + (this.lane * (this.scene.trackHeight * 0.06));
        
        // Display horse name and traits in the left panel
        // Push 1-6 a little higher to the top and 7-12 farther down on the screen
        const laneTextYOffset = (this.lane < 6) ? -50 : 120;
        
        // Convert the horse color from hex number to hex string for text color
        const colorHex = '#' + this.color.toString(16).padStart(6, '0');
        
        const strokeColor = (this.lane === 0) ? '#ddd' : '#000';
        this.laneText = this.scene.add.text(20, laneTextY + laneTextYOffset, `#${this.lane + 1}: ${this.name}`, { 
            fontSize: '28px', 
            fontFamily: '"Inter", Arial, sans-serif',
            fontWeight: '900', 
            color: colorHex,
            stroke: strokeColor, 
            strokeThickness: 2
        });
        
        // Add varying offsets based on lane number to prevent stacking
        // Position labels further away from horses to make room for connecting lines
        const horizontalVariation = (this.lane % 2 === 0) ? -40 - (this.lane * 3) : 40 + (this.lane * 3);
        // Increase vertical offset to hover labels higher above horses
        const verticalVariation = -40 - (this.lane * 5); // Negative values move upward
        
        // Horse name follows the horse - adjust text position based on horse size
        const nameOffsetX = this.sprite.width * this.sprite.scale * 0.5;
        const nameOffsetY = this.sprite.height * this.sprite.scale * 0.5;
        this.nameText = this.scene.add.text(offsetX - nameOffsetX + horizontalVariation, startPosition.y - nameOffsetY + verticalVariation, this.name, { 
            fontSize: '18px', 
            fontFamily: 'Inter',
            color: '#000',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: { x: 2, y: 1 }
        });
        
        // Set a high depth value to ensure name labels appear on top of other elements like the logo
        this.nameText.setDepth(1000);
        
        // Initially hide all name labels - only first place will be shown during race
        this.nameText.setVisible(false);
        
        // Create connecting line
        this.connectingLine = this.scene.add.graphics();
        // Set connecting line depth to be just below the name text
        this.connectingLine.setDepth(999);
        
        // Group all elements
        this.group = this.scene.add.group([this.sprite, this.laneText, this.nameText, this.connectingLine]);
    }
    
    update(time, delta) {
        if (this.finished) return;
        
        // Debug log on first few updates for first horse only
        if (this.lane === 0 && this.distance < 100) {
            console.log(`Horse ${this.name} update: speed=${this.currentSpeed.toFixed(2)}, distance=${this.distance.toFixed(2)}`);
        }
        
        // Calculate which lap we're on - this is critical for the 4-lap race
        const previousLap = this.currentLap;
        this.currentLap = Math.min(this.scene.totalLaps, Math.floor(this.distance / this.scene.trackLength) + 1);
        
        // Detect lap change and log it
        if (this.currentLap > previousLap) {
            console.log(`${this.name} starting lap ${this.currentLap} of ${this.scene.totalLaps}`);
            // Add excitement - sometimes horses get a surge when starting a new lap
            if (Math.random() < 0.3) {
                this.momentum += Math.random() * 0.15;
                console.log(`${this.name} gets a surge of energy at the start of lap ${this.currentLap}!`);
            }
            
            // Special final lap balancing
            if (this.currentLap === this.scene.totalLaps) {
                this.applyFinalLapBalancing();
            }
        }
        
        // Handle random race events
        this.handleRaceEvents(time, delta);
        
        // Calculate catch-up factor based on position in the race
        this.updateRacePositioningFactors();
        
        // Get lap-specific performance factors
        const lapIndex = this.currentLap - 1;
        const lapFactor = this.lapFactors[lapIndex] || { speedBoost: 0, staminaBoost: 0 };
        
        // Apply momentum (gradually decays)
        if (Math.abs(this.momentum) > 0.01) {
            this.momentum *= 0.995; 
        } else {
            this.momentum = 0;
        }
        
        // Calculate speed based on time and current lap factor
        const raceProgress = this.distance / this.scene.totalRaceDistance;
        const staminaFactor = Math.max(0.7, 1 - raceProgress / (this.stamina + lapFactor.staminaBoost));
        
        // Reduced random factor that changes each update - less chaotic
        const instantRandomFactor = 1 + (Math.random() - 0.5) * (this.luckFactor * 0.5); // Reduced from luckFactor + 0.15
        const raceEventFactor = this.eventMultiplier; 
        
        // Accelerate up to base speed, applying all factors with more consistency
        const targetSpeed = this.baseSpeed * staminaFactor * instantRandomFactor * raceEventFactor * 
                           (1 + lapFactor.speedBoost + (this.catchUpFactor * 0.7) - (this.leadHandicap * 0.7) + (this.momentum * 0.8));
        
        // More gradual speed changes for smoother racing
        if (this.currentSpeed < targetSpeed) {
            // Moderate acceleration for trailing horses
            const accelerationBoost = 1 + (this.catchUpFactor * 0.6); // Reduced from full catchUpFactor
            this.currentSpeed += (this.acceleration * accelerationBoost * (delta / 1000)) * 0.8; // 80% of original acceleration
        } else if (this.currentSpeed > targetSpeed * 1.05) { // Reduced threshold from 1.1
            // Decelerate if going too fast (momentum or events pushed speed too high)
            this.currentSpeed -= (this.acceleration * 0.5 * (delta / 1000)) * 0.8; // 80% of original deceleration
        }
        
        // Ensure minimum speed for all horses (creates a more consistent and exciting race)
        const minRaceSpeed = 0.7 + (this.catchUpFactor * 0.8); // Reduced from catchUpFactor * 1.5
        this.currentSpeed = Math.max(minRaceSpeed, this.currentSpeed);
        
        // Apply all speed factors
        const actualSpeed = this.currentSpeed * staminaFactor * instantRandomFactor * raceEventFactor;
        
        // Move horse forward - scale speed based on track size, but slower overall
        const speedScale = Math.max(0.7, Math.min(this.scene.trackWidth, this.scene.trackHeight) / 400); 
        this.distance += actualSpeed * (delta / 1000) * 80 * speedScale; 
        
        // Get position on the oval track - this function handles the looping
        const lapDistance = this.distance % this.scene.trackLength;
        const trackPos = this.scene.getPositionOnTrack(lapDistance, this.laneOffset);
        
        // Update sprite positions
        this.sprite.x = trackPos.x;
        this.sprite.y = trackPos.y;
        
        // Determine if the horse is on the left half of the track (between 25% and 75% of track length)
        // This checks if the horse is roughly on the left side of the oval
        const normalizedDistance = lapDistance / this.scene.trackLength;
        const isOnLeftHalf = normalizedDistance > 0.5 && normalizedDistance < 0.95;
        
        // Set scale to flip horizontally when on left half
        const currentScale = Math.abs(this.sprite.scaleX);
        this.sprite.scaleX = isOnLeftHalf ? currentScale : -currentScale;
        
        // Set rotation based on track position and track section
        // We want horses to consistently point southeast (Math.PI/4) around the entire track
        let finalRotation;
        
        // Use a simplified rotation approach that maintains southeast orientation throughout
        if (isOnLeftHalf) {
            // When on left half, horses have been flipped horizontally
            // So we use a positive PI/4 to point southeast
            finalRotation = Math.PI/4;
        } else {
            // On right half, maintain southeast pointing using the initial orientation
            finalRotation = Math.PI/4;
        }
        
        // Add a very small adjustment based on track position for subtle natural movement
        // but not enough to change the general southeast direction
        const positionFactor = normalizedDistance * Math.PI * 2;
        const smallAdjustment = Math.sin(positionFactor) * 0.1; // Very small rotation adjustment
        
        this.sprite.rotation = finalRotation + smallAdjustment;
        
        // Update name text position only if horse is in first place
        if (this.nameText && this.position === 1) {
            const nameOffsetX = this.sprite.width * this.sprite.scale * 0.5;
            const nameOffsetY = this.sprite.height * this.sprite.scale * 0.5;
            const horizontalVariation = (this.lane % 2 === 0) ? -40 - (this.lane * 3) : 40 + (this.lane * 3);
            
            // Determine if horse is in the top portion of the track
            const isInTopPortion = this.sprite.y < this.scene.scale.height * 0.3;
            
            // Adjust vertical position based on horse location
            let verticalVariation;
            if (isInTopPortion) {
                // When horse is at top of track, position label below or beside the horse
                verticalVariation = 30 + (this.lane * 2); // Positive value moves label down
            } else {
                // Normal positioning for other parts of track
                verticalVariation = -40 - (this.lane * 5); // Negative value moves label up
            }
            
            this.nameText.x = this.sprite.x - nameOffsetX + horizontalVariation;
            this.nameText.y = this.sprite.y - nameOffsetY + verticalVariation;
            
            // Ensure depth is maintained during updates
            this.nameText.setDepth(1000);
            
            // Update connecting line for first place horse
            this.updateConnectingLine();
        }
        
        // Add a merry-go-round style bobbing motion with unique rate per horse
        this.legMovement = (this.legMovement || this.bobbingPhase) + delta * this.bobbingRate;
        const bobHeight = Math.sin(this.legMovement) * 5.5;
        this.sprite.y += bobHeight;
        
        // Check if horse has finished race
        const totalDistance = this.scene.totalLaps * this.scene.trackLength;
        if (!this.finished && this.distance >= totalDistance && lapDistance >= 0 && lapDistance <= 50) {
            this.finishRace(time);
        }
    }
    
    updateConnectingLine() {
        // Skip if components aren't available
        if (!this.connectingLine || !this.sprite || !this.nameText) return;
        
        // Clear previous line - always do this first to prevent ghosting
        this.connectingLine.clear();
        
        // Only draw the line if this horse is in first place and the label is visible
        if (this.position !== 1 || !this.nameText.visible) return;
        
        // Set line style - make it thinner and more transparent for better visibility
        this.connectingLine.lineStyle(0.8, this.color, 0.6);
        
        // Calculate start point (bottom center of name text)
        const startX = this.nameText.x + this.nameText.width / 2;
        const startY = this.nameText.y + this.nameText.height;
        
        // Calculate end point (top center of horse sprite)
        const endX = this.sprite.x;
        const endY = this.sprite.y - (this.sprite.height * this.sprite.scale * 0.3);
        
        // Draw the line
        this.connectingLine.beginPath();
        this.connectingLine.moveTo(startX, startY);
        this.connectingLine.lineTo(endX, endY);
        this.connectingLine.closePath();
        this.connectingLine.strokePath();
    }
    
    handleRaceEvents(time, delta) {
        // Random events that can happen during the race - reduced frequency and impact
        if (this.scene.raceStartTime && time > this.scene.raceStartTime + this.nextEventTime) {
            // If an event is already happening, process it
            if (this.currentEvent) {
                this.eventDuration -= delta;
                
                if (this.eventDuration <= 0) {
                    // End the current event
                    console.log(`${this.name}'s ${this.currentEvent} has ended`);
                    this.currentEvent = null;
                    this.eventMultiplier = 1.0;
                    
                    // Schedule next event - less frequent events
                    this.nextEventTime = time - this.scene.raceStartTime + 8000 + Math.random() * 7000; // Increased time between events
                }
            } else {
                // Start a new random event with reduced chances and less dramatic effects
                const eventChance = Math.random();
                
                if (eventChance < 0.12) { // Reduced from 0.12
                    // Burst of speed (8% chance, down from 12%)
                    this.currentEvent = "burst of speed";
                    this.eventMultiplier = 1.15; // Reduced from 1.25
                    this.eventDuration = 800 + Math.random() * 1200;
                    console.log(`${this.name} finds a burst of speed!`);
                } else if (eventChance < 0.16) { // Reduced from 0.24
                    // Slow down (8% chance, down from 12%)
                    this.currentEvent = "slight slowdown";
                    this.eventMultiplier = 0.9; // Less significant slowdown (up from 0.85)
                    this.eventDuration = 800 + Math.random() * 1200;
                    console.log(`${this.name} slows slightly`);
                } else if (eventChance < 0.24) { // Reduced from 0.36
                    // Subtle momentum shift (8% chance, down from 12%)
                    if (Math.random() < 0.5) {
                        this.momentum += 0.1 + Math.random() * 0.05; // Reduced momentum shift
                        console.log(`${this.name} makes a move!`);
                    } else {
                        this.momentum -= 0.05 + Math.random() * 0.1; // Reduced negative momentum
                        console.log(`${this.name} loses a bit of momentum`);
                    }
                    // No event duration, just a momentum change
                    this.nextEventTime = time - this.scene.raceStartTime + 8000 + Math.random() * 10000; // Increased time between events
                } else if (eventChance < 0.28) { // Reduced from 0.42
                    // Comeback effort (4% chance, down from 6%)
                    if (this.catchUpFactor > 0.2) { // Only if already behind
                        this.currentEvent = "comeback effort";
                        this.eventMultiplier = 1.2; // Reduced from 1.35
                        this.eventDuration = 1000 + Math.random() * 1000;
                        console.log(`${this.name} is making a comeback effort!`);
                    } else {
                        // Fallback to standard event
                        this.nextEventTime = time - this.scene.raceStartTime + 8000 + Math.random() * 10000; // Increased time between events
                    }
                } else {
                    // No event this time (72% chance, up from 58%)
                    this.nextEventTime = time - this.scene.raceStartTime + 8000 + Math.random() * 10000; // Increased time between events
                }
            }
        }
    }
    
    updateRacePositioningFactors() {
        if (!this.scene.raceInProgress || this.finished) return;
        
        // Create a sorted list of horses based on distance
        const sortedHorses = [...this.scene.horses].sort((a, b) => b.distance - a.distance);
        
        // Find horse position
        const position = sortedHorses.findIndex(h => h === this);
        
        // Update position for label visibility checks
        const newPosition = position + 1; // 1-indexed position
        
        // Calculate race progress - used for final stretch detection
        const totalRaceDistance = this.scene.totalLaps * this.scene.trackLength;
        const raceProgress = this.distance / totalRaceDistance;
        const isInFinalStretch = raceProgress > 0.9; // Hide labels in final 10% of race
        
        // If in final stretch, hide all labels regardless of position
        if (isInFinalStretch && this.nameText && this.nameText.visible) {
            this.nameText.setVisible(false);
            if (this.connectingLine) {
                this.connectingLine.clear();
            }
            if (this.position === 1) {
                console.log(`${this.name} entered final stretch - hiding label`);
            }
        }
        // Otherwise, handle normal position-based visibility
        else if (newPosition !== this.position) {
            const wasFirstPlace = this.position === 1;
            const isNowFirstPlace = newPosition === 1;
            
            this.position = newPosition;
            
            // Update nameText visibility - only first place gets a label if not in final stretch
            if (this.nameText && !isInFinalStretch) {
                // Show label only if we're in first place and not in final stretch
                this.nameText.setVisible(isNowFirstPlace);
                
                // Clear the connecting line when losing first place
                if (wasFirstPlace && !isNowFirstPlace && this.connectingLine) {
                    this.connectingLine.clear();
                    console.log(`${this.name} lost first place - clearing line`);
                }
                
                // For debugging
                if (isNowFirstPlace) {
                    console.log(`${this.name} is now in first place - showing label`);
                }
            }
        }
        
        // More moderate catch-up mechanics for trailing horses - keep the pack together
        if (position > 0) {
            // Calculate how far behind this horse is (as a percentage of track length)
            const leader = sortedHorses[0];
            const distanceBehind = leader.distance - this.distance;
            const percentBehind = distanceBehind / this.scene.trackLength;
            
            // Even more moderate position-based component (0.02 to 0.15 based on position)
            const positionFactor = Math.min(0.15, 0.02 * position);
            
            // More moderate distance-based component (up to 0.15 more for being far behind)
            const distanceFactor = Math.min(0.15, percentBehind * 1.0);
            
            // Combined catch-up factor with smaller random variation
            const randomBoost = Math.random() * 0.05; // Reduced from 0.1
            this.catchUpFactor = positionFactor + distanceFactor + randomBoost;
            
            // Add smaller boost for last place horse
            if (position === sortedHorses.length - 1) {
                this.catchUpFactor += 0.1; // Reduced from 0.15
            }
            
            // Less frequent random chance for recovery
            if (Math.random() < 0.01 && position > sortedHorses.length / 2) { // Reduced from 0.02
                this.momentum += 0.15; // Reduced from 0.2
                console.log(`${this.name} makes a move to catch up!`);
            }
        } else {
            // Leader gets a smaller handicap to keep pack closer
            const secondPlace = sortedHorses[1];
            const leadDistance = this.distance - secondPlace.distance;
            const percentAhead = leadDistance / this.scene.trackLength;
            
            // Leader handicap increases with lead percentage (reduced to max 0.2 from 0.3)
            this.leadHandicap = Math.min(0.2, percentAhead * 1.5); // Reduced from 2.0
            
            // Less frequent random chance for leader to slow slightly
            if (Math.random() < 0.03 && percentAhead > 0.04) { // Reduced from 0.05, threshold increased
                this.momentum -= 0.08; // Reduced from 0.1
                console.log(`${this.name} eases the pace slightly!`);
            }
            
            this.catchUpFactor = 0;
        }
    }
    
    updateSpritePosition() {
        // Get position on track based on current distance
        const lapDistance = this.distance % this.scene.trackLength;
        const trackPos = this.scene.getPositionOnTrack(lapDistance, this.laneOffset);
        
        // Update horse position
        this.sprite.x = trackPos.x;
        this.sprite.y = trackPos.y;
        
        // Determine if the horse is on the left half of the track (between 25% and 75% of track length)
        // This checks if the horse is roughly on the left side of the oval
        const normalizedDistance = lapDistance / this.scene.trackLength;
        const isOnLeftHalf = normalizedDistance > 0.5 && normalizedDistance < 0.95;
        
        // Set scale to flip horizontally when on left half
        const currentScale = Math.abs(this.sprite.scaleX);
        this.sprite.scaleX = isOnLeftHalf ? currentScale : -currentScale;
        
        // Set rotation based on track position and track section
        // We want horses to consistently point southeast (Math.PI/4) around the entire track
        let finalRotation;
        
        // Use a simplified rotation approach that maintains southeast orientation throughout
        if (isOnLeftHalf) {
            // When on left half, horses have been flipped horizontally
            // So we use a positive PI/4 to point southeast
            finalRotation = Math.PI/4;
        } else {
            // On right half, maintain southeast pointing using the initial orientation
            finalRotation = Math.PI/4;
        }
        
        // Add a very small adjustment based on track position for subtle natural movement
        // but not enough to change the general southeast direction
        const positionFactor = normalizedDistance * Math.PI * 2;
        const smallAdjustment = Math.sin(positionFactor) * 0.1; // Very small rotation adjustment
        
        this.sprite.rotation = finalRotation + smallAdjustment;
        
        // Update name text position only if horse is in first place
        if (this.nameText && this.position === 1) {
            const nameOffsetX = this.sprite.width * this.sprite.scale * 0.5;
            const nameOffsetY = this.sprite.height * this.sprite.scale * 0.5;
            const horizontalVariation = (this.lane % 2 === 0) ? -40 - (this.lane * 3) : 40 + (this.lane * 3);
            
            // Determine if horse is in the top portion of the track
            const isInTopPortion = this.sprite.y < this.scene.scale.height * 0.3;
            
            // Adjust vertical position based on horse location
            let verticalVariation;
            if (isInTopPortion) {
                // When horse is at top of track, position label below or beside the horse
                verticalVariation = 30 + (this.lane * 2); // Positive value moves label down
            } else {
                // Normal positioning for other parts of track
                verticalVariation = -40 - (this.lane * 5); // Negative value moves label up
            }
            
            this.nameText.x = this.sprite.x - nameOffsetX + horizontalVariation;
            this.nameText.y = this.sprite.y - nameOffsetY + verticalVariation;
            
            // Ensure depth is maintained during updates
            this.nameText.setDepth(1000);
            
            // Update connecting line for first place horse
            this.updateConnectingLine();
        } else if (this.connectingLine) {
            // Ensure connecting line is cleared for non-first place horses
            this.connectingLine.clear();
        }
    }
    
    reset() {
        this.currentSpeed = 0;
        this.distance = 0;
        this.currentLap = 1;
        this.finished = false;
        this.finishTime = null;
        this.position = null;
        this.catchUpFactor = 0;
        this.leadHandicap = 0; 
        
        // Randomize horse skills
        this.randomizeSkills();
        
        // Use a middle lane as the reference path for all horses
        const referenceIndex = Math.floor(this.scene.numHorses / 2) - 1; 
        const laneWidth = Math.min(this.scene.trackWidth, this.scene.trackHeight) / 300; 
        // Set all horses to follow the middle lane's path with minimal variation
        this.laneOffset = (this.scene.numHorses - 1 - referenceIndex) * laneWidth;
        // Add a tiny offset for visual separation (1/10th of the already small lane width)
        this.laneOffset += (this.lane - referenceIndex) * (laneWidth * 0.1);
        
        // Reset position back to starting position
        const startPosition = this.scene.getPositionOnTrack(0, this.laneOffset);
        
        // Apply the same horizontal offset as in createSprite to maintain fan-out effect
        const horizontalOffset = this.lane * 20; // Keep this value consistent with createSprite
        const offsetX = startPosition.x + horizontalOffset;
        
        this.sprite.x = offsetX;
        this.sprite.y = startPosition.y;
        this.sprite.rotation = startPosition.rotation + Math.PI/4;
        
        // Update name text position
        const nameOffsetX = this.sprite.width * this.sprite.scale * 0.5;
        const nameOffsetY = this.sprite.height * this.sprite.scale * 0.5;
        if (this.nameText) {
            const horizontalVariation = (this.lane % 2 === 0) ? -40 - (this.lane * 3) : 40 + (this.lane * 3);
            const verticalVariation = -40 - (this.lane * 5); 
            this.nameText.x = offsetX - nameOffsetX + horizontalVariation;
            this.nameText.y = startPosition.y - nameOffsetY + verticalVariation;
            
            // Hide name labels at start of race
            this.nameText.setVisible(false);
        }
        
        // Clear any connecting lines
        if (this.connectingLine) {
            this.connectingLine.clear();
        }
        
        // Update the lane text with odds only
        if (this.laneText) {
            // Display name and odds only
            const oddsText = this.odds ? ` ${this.odds}-1` : "";
            this.laneText.setText(`#${this.lane + 1}: ${this.name} ${oddsText}`);
            
            // Log just the odds for verification
            console.log(`${this.name} - Odds: ${this.odds}-1`);
        }
        
        this.legMovement = 0;
    }
    
    applyFinalLapBalancing() {
        // Final lap balancing - even more moderate to keep pack together but maintain race integrity
        console.log(`${this.name} entering final lap balancing`);
        
        // Get all active horses
        const activeHorses = this.scene.horses.filter(h => !h.finished);
        if (activeHorses.length <= 1) return;
        
        // Sort horses by distance
        const sortedHorses = [...activeHorses].sort((a, b) => b.distance - a.distance);
        
        // Find horse position
        const position = sortedHorses.findIndex(h => h === this);
        const totalHorses = sortedHorses.length;
        
        if (position === 0) {
            // Leader gets a smaller handicap on final lap to keep pack together
            // but not so dramatic that they lose completely
            const secondPlace = sortedHorses[1];
            const leadDistance = this.distance - secondPlace.distance;
            
            // More moderate handicap for leader
            if (leadDistance > this.scene.trackLength * 0.06) { // Increased threshold from 0.05
                // If lead is significant, apply gentle handicap
                this.momentum -= 0.08; // Reduced from 0.1
                console.log(`${this.name} feels the pressure of the final lap`);
            }
        } else {
            // Trailing horses get modest boost based on position
            // The further back, the more boost, but still moderate
            const boostFactor = Math.min(0.08 + (position / totalHorses) * 0.12, 0.2); // Reduced from 0.1 + 0.15 * position/total, max 0.25
            this.momentum += boostFactor;
            
            console.log(`${this.name} gets motivated for the final lap (boost: ${boostFactor.toFixed(2)})`);
        }
    }
    
    // Method to randomize horse skills
    randomizeSkills() {
        // Generate random skill distribution - each horse will excel in different areas
        const totalSkillPoints = 3.75; // Total skill points to distribute
        const skillVariance = 0.3; // How much variance to allow in total skill points
        
        // Randomize total skill points slightly to create some overall better/worse horses
        const adjustedSkillPoints = totalSkillPoints + (Math.random() * skillVariance * 2) - skillVariance;
        
        // Distribute skill points with some randomness
        const speedWeight = Math.random() * 0.6 + 0.7; // 0.7-1.3 (speed is important for all horses)
        const staminaWeight = Math.random() * 0.8 + 0.6; // 0.6-1.4
        const accelerationWeight = Math.random() * 0.8 + 0.6; // 0.6-1.4
        
        // Normalize weights so they sum to 1.0
        const totalWeight = speedWeight + staminaWeight + accelerationWeight;
        const normalizedSpeedWeight = speedWeight / totalWeight;
        const normalizedStaminaWeight = staminaWeight / totalWeight;
        const normalizedAccelerationWeight = accelerationWeight / totalWeight;
        
        // Calculate base stats based on weights
        this.baseSpeed = (normalizedSpeedWeight * adjustedSkillPoints * 2.5) + 1.0; // Range ~1.5-3.5
        this.stamina = (normalizedStaminaWeight * adjustedSkillPoints * 0.8) + 0.4; // Range ~0.6-1.2
        this.acceleration = (normalizedAccelerationWeight * adjustedSkillPoints * 0.4) + 0.2; // Range ~0.3-0.6
        
        // Create descriptive traits based on stats
        this.traits = [];
        if (this.baseSpeed > 2.8) this.traits.push("Fast");
        if (this.stamina > 1.0) this.traits.push("Endurance");
        if (this.acceleration > 0.5) this.traits.push("Quick Starter");
        if (this.traits.length === 0) this.traits.push("Balanced");
        
        // Moderate luck factor - still allows for some randomness
        this.luckFactor = Math.random() * 0.2 + 0.05; // Between 0.05 and 0.25 (reduced)
        
        // Calculate odds based on horse's attributes (simple version)
        this.calculateOdds();
    }
    
    // Calculate simple odds based on horse attributes
    calculateOdds() {
        // Base odds on the horse's primary strength
        let baseOdds;
        
        if (this.traits.includes("Fast")) {
            baseOdds = 3 + Math.floor(Math.random() * 3); // 3-5
        } else if (this.traits.includes("Endurance")) {
            baseOdds = 4 + Math.floor(Math.random() * 3); // 4-6
        } else if (this.traits.includes("Quick Starter")) {
            baseOdds = 5 + Math.floor(Math.random() * 4); // 5-8
        } else {
            baseOdds = 6 + Math.floor(Math.random() * 5); // 6-10 for Balanced
        }
        
        // Add some randomness to create variety
        const randomFactor = Math.floor(Math.random() * 7) - 3; // -3 to +3
        this.odds = Math.max(2, Math.min(15, baseOdds + randomFactor));
        
        return this.odds;
    }
    
    finishRace(time) {
        this.finished = true;
        this.finishTime = time;
        this.scene.horseFinished(this);
        console.log(`Horse ${this.name} finished the race! (${this.scene.totalLaps} laps)`);
    }
}
