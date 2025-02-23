export class World {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.territories = new Map();
        this.projection = null;
        this.path = null;
        this.worldData = null;
    }

    async initialize() {
        try {
            // Load world map data (GeoJSON)
            const response = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
            this.worldData = await response.json();
            
            // Initialize D3 projection
            const d3 = await import('d3-geo');
            this.projection = d3.geoMercator()
                .fitSize([this.canvas.width, this.canvas.height], this.worldData);
            
            this.path = d3.geoPath()
                .projection(this.projection)
                .context(this.ctx);

            // Initialize territories
            this.initializeTerritories();
        } catch (error) {
            console.error('Failed to initialize world:', error);
        }
    }

    initializeTerritories() {
        this.worldData.features.forEach(feature => {
            this.territories.set(feature.properties.ADMIN, {
                id: feature.properties.ISO_A3,
                name: feature.properties.ADMIN,
                owner: null,
                armies: 0,
                neighbors: [],
                path: feature,
                strategicValue: this.calculateStrategicValue(feature)
            });
        });

        // Calculate neighbors
        this.calculateNeighbors();
    }

    calculateStrategicValue(feature) {
        // Strategic value based on territory size and location
        const area = this.path.area(feature);
        const [x, y] = this.projection.center();
        const centroid = this.path.centroid(feature);
        const distanceFromCenter = Math.sqrt(
            Math.pow(centroid[0] - x, 2) + 
            Math.pow(centroid[1] - y, 2)
        );

        return (area / 1000) + (1000 / (distanceFromCenter + 1));
    }

    calculateNeighbors() {
        const features = this.worldData.features;
        for (let i = 0; i < features.length; i++) {
            const territory = this.territories.get(features[i].properties.ADMIN);
            
            for (let j = 0; j < features.length; j++) {
                if (i !== j) {
                    const otherTerritory = features[j].properties.ADMIN;
                    // TODO: Implement proper territory adjacency check
                    // For now, using a simplified distance-based approach
                    const [x1, y1] = this.path.centroid(features[i]);
                    const [x2, y2] = this.path.centroid(features[j]);
                    const distance = Math.sqrt(
                        Math.pow(x2 - x1, 2) + 
                        Math.pow(y2 - y1, 2)
                    );
                    
                    if (distance < 100) { // Arbitrary threshold
                        territory.neighbors.push(otherTerritory);
                    }
                }
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw territories
        this.territories.forEach(territory => {
            this.ctx.beginPath();
            this.path(territory.path);
            
            // Fill based on ownership
            if (territory.owner) {
                this.ctx.fillStyle = territory.owner.color;
            } else {
                this.ctx.fillStyle = '#cccccc';
            }
            this.ctx.fill();
            
            // Territory borders
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Draw army count
            if (territory.armies > 0) {
                const centroid = this.path.centroid(territory.path);
                this.ctx.fillStyle = '#000000';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(territory.armies.toString(), centroid[0], centroid[1]);
            }
        });
    }

    getTerritoryAtPoint(x, y) {
        for (const [name, territory] of this.territories) {
            this.ctx.beginPath();
            this.path(territory.path);
            if (this.ctx.isPointInPath(x, y)) {
                return territory;
            }
        }
        return null;
    }

    updateTerritory(name, updates) {
        const territory = this.territories.get(name);
        if (territory) {
            Object.assign(territory, updates);
        }
    }
}
