import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class World {
    constructor(canvas) {
        // Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(canvas.width, canvas.height);
        
        // Setup camera position and controls
        this.camera.position.z = 200;
        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Game state
        this.territories = new Map();
        this.worldData = null;
        this.earthRadius = 100;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Lighting
        this.setupLighting();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }

    async initialize() {
        try {
            // Load world map data (GeoJSON)
            const response = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
            this.worldData = await response.json();
            
            // Create the globe
            this.createGlobe();
            
            // Initialize territories
            this.initializeTerritories();
            
            // Start animation loop
            this.animate();
        } catch (error) {
            console.error('Failed to initialize world:', error);
        }
    }

    createGlobe() {
        // Create base sphere
        const sphereGeometry = new THREE.SphereGeometry(this.earthRadius, 64, 64);
        const sphereMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x1a1a1a,
            transparent: true,
            opacity: 0.1
        });
        this.globe = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.scene.add(this.globe);
    }

    initializeTerritories() {
        this.worldData.features.forEach(feature => {
            const territory = {
                id: feature.properties.ISO_A3,
                name: feature.properties.ADMIN,
                owner: null,
                armies: 0,
                neighbors: [],
                mesh: this.createTerritoryMesh(feature),
                strategicValue: this.calculateStrategicValue(feature)
            };
            
            this.territories.set(feature.properties.ADMIN, territory);
            if (territory.mesh) {
                this.scene.add(territory.mesh);
            }
        });

        // Calculate neighbors
        this.calculateNeighbors();
    }

    createTerritoryMesh(feature) {
        try {
            const coordinates = feature.geometry.coordinates;
            const meshes = [];

            // Handle different geometry types
            if (feature.geometry.type === 'Polygon') {
                meshes.push(this.createPolygonMesh([coordinates]));
            } else if (feature.geometry.type === 'MultiPolygon') {
                meshes.push(this.createPolygonMesh(coordinates));
            }

            // Combine all meshes for this territory
            if (meshes.length === 0) return null;
            
            const territoryGroup = new THREE.Group();
            meshes.forEach(mesh => {
                if (mesh) territoryGroup.add(mesh);
            });
            
            territoryGroup.userData.territory = feature.properties.ADMIN;
            return territoryGroup;
        } catch (error) {
            console.error('Error creating territory mesh:', error);
            return null;
        }
    }

    createPolygonMesh(polygons) {
        const shapes = [];
        
        polygons.forEach(polygon => {
            const outerRing = polygon[0];
            if (!outerRing || outerRing.length < 3) return;

            // Convert coordinates to 3D points on sphere
            const points3D = outerRing.map(coord => {
                const [lon, lat] = coord;
                const phi = (90 - lat) * Math.PI / 180;
                const theta = (180 - lon) * Math.PI / 180;
                
                const x = this.earthRadius * Math.sin(phi) * Math.cos(theta);
                const y = this.earthRadius * Math.cos(phi);
                const z = this.earthRadius * Math.sin(phi) * Math.sin(theta);
                
                return new THREE.Vector3(x, y, z);
            });

            // Create geometry
            const geometry = new THREE.BufferGeometry();
            
            // Create triangles using points
            const vertices = [];
            const triangles = [];
            
            // Simple triangulation - fan triangulation from first point
            for (let i = 1; i < points3D.length - 1; i++) {
                triangles.push(0, i, i + 1);
            }

            // Add all points to vertices array
            points3D.forEach(point => {
                vertices.push(point.x, point.y, point.z);
            });

            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
            geometry.setIndex(triangles);
            geometry.computeVertexNormals();

            // Create mesh
            const material = new THREE.MeshPhongMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geometry, material);
            
            // Extrude slightly above sphere surface
            const normal = new THREE.Vector3();
            for (let i = 0; i < vertices.length; i += 3) {
                normal.set(vertices[i], vertices[i + 1], vertices[i + 2]).normalize();
                vertices[i] *= 1.01;
                vertices[i + 1] *= 1.01;
                vertices[i + 2] *= 1.01;
            }
            geometry.attributes.position.needsUpdate = true;
            
            shapes.push(mesh);
        });

        if (shapes.length === 0) return null;
        
        const group = new THREE.Group();
        shapes.forEach(shape => group.add(shape));
        return group;
    }

    calculateStrategicValue(feature) {
        // Calculate based on area and position
        const coordinates = feature.geometry.coordinates[0] ? feature.geometry.coordinates[0][0] : [];
        let area = 0;
        
        if (coordinates && coordinates.length > 2) {
            for (let i = 0; i < coordinates.length - 1; i++) {
                area += coordinates[i][0] * coordinates[i + 1][1] - coordinates[i + 1][0] * coordinates[i][1];
            }
            area = Math.abs(area / 2);
        }
        
        return area / 1000;
    }

    calculateNeighbors() {
        const features = this.worldData.features;
        for (let i = 0; i < features.length; i++) {
            const territory = this.territories.get(features[i].properties.ADMIN);
            if (!territory) continue;
            
            for (let j = 0; j < features.length; j++) {
                if (i !== j) {
                    const otherTerritory = features[j].properties.ADMIN;
                    const coords1 = features[i].geometry.coordinates[0] ? features[i].geometry.coordinates[0][0] : [];
                    const coords2 = features[j].geometry.coordinates[0] ? features[j].geometry.coordinates[0][0] : [];
                    
                    if (coords1.length && coords2.length) {
                        const centroid1 = this.calculateCentroid(coords1);
                        const centroid2 = this.calculateCentroid(coords2);
                        
                        const distance = this.sphericalDistance(centroid1, centroid2);
                        
                        if (distance < 10) { // Threshold in degrees
                            territory.neighbors.push(otherTerritory);
                        }
                    }
                }
            }
        }
    }

    calculateCentroid(coordinates) {
        const sumLat = coordinates.reduce((sum, coord) => sum + coord[1], 0);
        const sumLon = coordinates.reduce((sum, coord) => sum + coord[0], 0);
        return [sumLon / coordinates.length, sumLat / coordinates.length];
    }

    sphericalDistance(coord1, coord2) {
        const [lon1, lat1] = coord1.map(x => x * Math.PI / 180);
        const [lon2, lat2] = coord2.map(x => x * Math.PI / 180);
        
        return Math.acos(
            Math.sin(lat1) * Math.sin(lat2) +
            Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
        ) * 180 / Math.PI;
    }

    getTerritoryAtPoint(x, y) {
        this.mouse.x = (x / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(y / this.renderer.domElement.clientHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        for (const intersect of intersects) {
            let object = intersect.object;
            while (object && !object.userData.territory) {
                object = object.parent;
            }
            if (object && object.userData.territory) {
                return this.territories.get(object.userData.territory);
            }
        }
        return null;
    }

    updateTerritory(name, updates) {
        const territory = this.territories.get(name);
        if (territory && territory.mesh) {
            Object.assign(territory, updates);
            
            // Update visual representation
            if (updates.owner) {
                territory.mesh.children.forEach(child => {
                    if (child.material) {
                        child.material.color.setStyle(updates.owner.color);
                    }
                });
            }
            
            // Update army count display
            if (updates.armies !== undefined) {
                // TODO: Implement 3D text for army count
                // Could use TextGeometry from Three.js
            }
        }
    }

    handleResize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    render() {
        // The render loop is handled by animate()
    }
}
