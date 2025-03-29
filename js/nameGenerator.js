/**
 * Horse Name Generator
 * Generates unique horse names from a predefined list
 */
class NameGenerator {
    constructor() {
        // Custom horse names - EDIT THIS LIST TO SET YOUR DESIRED NAMES
        this.customNames = [
            "Secretariat",
            "Monarchos", "Northern Dancer",
            "Spend A Buck",
            "Decidedly",
            "Proud Clarion",
            "Authentic",
            "Grindstone",
            "Mandaloun",
            "Fusaichi Pegasus", 
            "Aura Boost", 
            "Extra Credit"
        ];
        
        // Fallback adjectives and nouns for random name generation if needed
        this.adjectives = [
            "Swift", "Mighty", "Brave", "Royal", "Noble", "Dashing", "Glorious", "Lunar",
            "Proud", "Golden", "Thunder", "Lightning", "Silver", "Wild", "Lucky", "Blazing",
            "Stellar", "Cosmic", "Northern", "Southern", "Certified", "Western", "Mystic", "Ancient",
            "Fiery", "Stormy", "Rapid", "Steady", "Grand", "Regal", "Crimson", "Big"
        ];
        
        this.nouns = [
            "Arrow", "Spirit", "Star", "Wind", "Shadow", "Flame", "Legend", "Champion",
            "Fury", "Rider", "Runner", "Dash", "Dream", "Quest", "Knight", "Storm",
            "Bolt", "Glory", "Victory", "Prince", "Duke", "King", "Queen", "Duchess",
            "Whisper", "Thunder", "Lightning", "Breeze", "Gale", "Tempest", "Blaze", "Valor"
        ];
        
        // Keep track of which names have been used
        this.usedNames = new Set();
        this.usedCustomNames = [];
    }
    
    // Generate a name - will use names from customNames list
    generateName() {
        // If we've used all custom names, start over
        if (this.usedCustomNames.length >= this.customNames.length) {
            this.usedCustomNames = [];
        }
        
        // Find a name from the custom list that hasn't been used yet
        let name = null;
        for (const customName of this.customNames) {
            if (!this.usedCustomNames.includes(customName)) {
                name = customName;
                this.usedCustomNames.push(customName);
                break;
            }
        }
        
        // If no custom name is available, generate a random one
        if (!name) {
            name = this.generateRandomName();
            
            // Ensure uniqueness for random names
            let attempts = 0;
            while (this.usedNames.has(name) && attempts < 50) {
                name = this.generateRandomName();
                attempts++;
            }
        }
        
        this.usedNames.add(name);
        return name;
    }
    
    // Generate a random name as fallback
    generateRandomName() {
        const adjective = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
        const noun = this.nouns[Math.floor(Math.random() * this.nouns.length)];
        return `${adjective} ${noun}`;
    }
    
    // Reset used names
    reset() {
        this.usedNames.clear();
        this.usedCustomNames = [];
    }
}

// Create a global instance
const nameGenerator = new NameGenerator();
