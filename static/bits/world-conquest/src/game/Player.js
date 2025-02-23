export class Player {
    constructor(id, name, color) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.territories = new Set();
        this.armies = 0;
        this.reinforcements = 0;
    }

    calculateReinforcements(world) {
        // Base reinforcements from territory count
        let reinforcements = Math.max(3, Math.floor(this.territories.size / 3));

        // Bonus for controlling continents
        reinforcements += this.calculateContinentBonus(world);

        return reinforcements;
    }

    calculateContinentBonus(world) {
        const continents = this.groupTerritoriesByContinents(world);
        let bonus = 0;

        // Example continent bonuses
        const CONTINENT_BONUSES = {
            'North America': 5,
            'South America': 2,
            'Europe': 5,
            'Africa': 3,
            'Asia': 7,
            'Oceania': 2
        };

        for (const [continent, territories] of continents) {
            if (this.controlsContinent(continent, territories, world)) {
                bonus += CONTINENT_BONUSES[continent] || 0;
            }
        }

        return bonus;
    }

    groupTerritoriesByContinents(world) {
        const continents = new Map();
        
        this.territories.forEach(territoryName => {
            const territory = world.territories.get(territoryName);
            if (territory) {
                const continent = this.getTerritoryContinent(territory);
                if (!continents.has(continent)) {
                    continents.set(continent, new Set());
                }
                continents.get(continent).add(territoryName);
            }
        });

        return continents;
    }

    getTerritoryContinent(territory) {
        // Simple continent determination based on latitude/longitude
        // In a real implementation, this would use actual continent data
        const [x, y] = territory.path.centroid;
        
        if (y < -30) return 'Oceania';
        if (y > 30) {
            if (x < -30) return 'North America';
            if (x < 60) return 'Europe';
            return 'Asia';
        }
        if (x < -30) return 'South America';
        return 'Africa';
    }

    controlsContinent(continent, territories, world) {
        // Check if all territories in the continent belong to this player
        for (const territoryName of territories) {
            const territory = world.territories.get(territoryName);
            if (!territory || territory.owner !== this) {
                return false;
            }
        }
        return true;
    }

    addTerritory(territoryName) {
        this.territories.add(territoryName);
    }

    removeTerritory(territoryName) {
        this.territories.delete(territoryName);
    }

    canAttack() {
        return this.territories.size > 0;
    }

    canReinforce() {
        return this.reinforcements > 0;
    }

    addReinforcements(amount) {
        this.reinforcements += amount;
    }

    useReinforcements(amount) {
        if (amount <= this.reinforcements) {
            this.reinforcements -= amount;
            return true;
        }
        return false;
    }

    isDefeated() {
        return this.territories.size === 0;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            color: this.color,
            territories: Array.from(this.territories),
            armies: this.armies,
            reinforcements: this.reinforcements
        };
    }

    static fromJSON(data) {
        const player = new Player(data.id, data.name, data.color);
        player.territories = new Set(data.territories);
        player.armies = data.armies;
        player.reinforcements = data.reinforcements;
        return player;
    }
}
