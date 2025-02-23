export class Combat {
    constructor(world) {
        this.world = world;
    }

    /**
     * Calculate combat outcome based on strategic factors rather than dice rolls
     * Factors:
     * - Army size ratio
     * - Territory strategic value
     * - Adjacent territory control
     * - Supply lines (connected territories)
     */
    resolveCombat(attackingTerritory, defendingTerritory) {
        const attackStrength = this.calculateAttackStrength(attackingTerritory);
        const defenseStrength = this.calculateDefenseStrength(defendingTerritory);
        
        // Calculate power ratio
        const powerRatio = attackStrength / defenseStrength;
        
        // Calculate casualties
        const attackerCasualties = this.calculateCasualties(
            attackingTerritory.armies,
            powerRatio < 1 ? powerRatio : 1
        );
        
        const defenderCasualties = this.calculateCasualties(
            defendingTerritory.armies,
            powerRatio > 1 ? 1 / powerRatio : 1
        );

        // Determine outcome
        const outcome = {
            attackerCasualties,
            defenderCasualties,
            territoryConquered: false,
            remainingAttackers: attackingTerritory.armies - attackerCasualties,
            remainingDefenders: defendingTerritory.armies - defenderCasualties
        };

        // Territory is conquered if all defenders are eliminated
        if (outcome.remainingDefenders <= 0) {
            outcome.territoryConquered = true;
            outcome.remainingDefenders = 0;
        }

        return outcome;
    }

    calculateAttackStrength(territory) {
        const baseStrength = territory.armies;
        const adjacentBonus = this.calculateAdjacentBonus(territory);
        const supplyLineBonus = this.calculateSupplyLineBonus(territory);
        
        return baseStrength * (1 + adjacentBonus) * supplyLineBonus;
    }

    calculateDefenseStrength(territory) {
        const baseStrength = territory.armies * 1.2; // Defenders advantage
        const terrainBonus = territory.strategicValue / 100;
        const adjacentBonus = this.calculateAdjacentBonus(territory);
        const supplyLineBonus = this.calculateSupplyLineBonus(territory);
        
        return baseStrength * (1 + terrainBonus + adjacentBonus) * supplyLineBonus;
    }

    calculateAdjacentBonus(territory) {
        let friendlyNeighbors = 0;
        let totalNeighbors = territory.neighbors.length;
        
        territory.neighbors.forEach(neighborName => {
            const neighbor = this.world.territories.get(neighborName);
            if (neighbor && neighbor.owner === territory.owner) {
                friendlyNeighbors++;
            }
        });
        
        return friendlyNeighbors / totalNeighbors * 0.5; // Up to 50% bonus
    }

    calculateSupplyLineBonus(territory) {
        // Trace continuous line of friendly territories to starting territories
        const visited = new Set();
        const toVisit = [territory.name];
        let connectedToBase = false;
        
        while (toVisit.length > 0) {
            const currentName = toVisit.pop();
            const current = this.world.territories.get(currentName);
            
            if (visited.has(currentName)) continue;
            visited.add(currentName);
            
            // Check if this is a starting territory
            if (this.isStartingTerritory(current)) {
                connectedToBase = true;
                break;
            }
            
            // Add friendly neighbors to visit
            current.neighbors.forEach(neighborName => {
                const neighbor = this.world.territories.get(neighborName);
                if (neighbor && neighbor.owner === territory.owner) {
                    toVisit.push(neighborName);
                }
            });
        }
        
        return connectedToBase ? 1.2 : 0.8; // 20% bonus if connected, 20% penalty if isolated
    }

    isStartingTerritory(territory) {
        // Consider territories on the edge of the map as starting territories
        // This is a simplified implementation
        return territory.neighbors.length <= 3;
    }

    calculateCasualties(armySize, lossFactor) {
        // Calculate casualties based on army size and loss factor
        // Uses a logarithmic scale to make larger armies more resilient
        const basePercentage = 0.4; // Maximum 40% casualties
        const casualtyPercentage = basePercentage * lossFactor;
        return Math.floor(armySize * casualtyPercentage);
    }

    canAttack(attackingTerritory, defendingTerritory) {
        // Check if territories are adjacent
        if (!attackingTerritory.neighbors.includes(defendingTerritory.name)) {
            return false;
        }
        
        // Check if attacking territory has enough armies
        if (attackingTerritory.armies <= 1) {
            return false;
        }
        
        // Check if territories belong to different players
        if (attackingTerritory.owner === defendingTerritory.owner) {
            return false;
        }
        
        return true;
    }
}
