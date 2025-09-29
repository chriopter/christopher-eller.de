import * as THREE from 'three';

export class CosmicWeb {
    constructor(scene, galaxyPositions, config = {}) {
        this.scene = scene;
        this.galaxyPositions = galaxyPositions;

        this.config = {
            maxDistance: config.maxDistance || 150,
            lineWidth: config.lineWidth || 1.0,
            color: config.color || new THREE.Color(0.3, 0.3, 0.5),
            opacity: config.opacity || 0.15,
            ...config
        };

        this.lines = [];
        this.createWeb();
    }

    createWeb() {
        // Create filaments connecting nearby galaxies
        const connections = [];
        const MAX_CONNECTIONS = 150; // Limit total connections for performance

        // Find pairs of galaxies within maxDistance
        for (let i = 0; i < this.galaxyPositions.length; i++) {
            let localConnections = [];

            for (let j = i + 1; j < this.galaxyPositions.length; j++) {
                const pos1 = this.galaxyPositions[i];
                const pos2 = this.galaxyPositions[j];

                const distance = pos1.distanceTo(pos2);

                if (distance < this.config.maxDistance) {
                    localConnections.push({
                        start: pos1,
                        end: pos2,
                        distance: distance
                    });
                }
            }

            // Keep only the 2 closest connections per galaxy
            localConnections.sort((a, b) => a.distance - b.distance);
            connections.push(...localConnections.slice(0, 2));

            if (connections.length >= MAX_CONNECTIONS) {
                break;
            }
        }

        console.log(`Creating ${connections.length} cosmic web filaments`);

        // Create line geometry for each connection
        connections.forEach(conn => {
            const points = this.generateFilamentPoints(conn.start, conn.end);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: this.config.color },
                    opacity: { value: this.config.opacity }
                },
                vertexShader: `
                    varying vec3 vPosition;
                    varying float vDistance;

                    void main() {
                        vPosition = position;
                        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                        vDistance = -mvPosition.z;
                        gl_Position = projectionMatrix * mvPosition;
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color;
                    uniform float opacity;
                    varying vec3 vPosition;
                    varying float vDistance;

                    void main() {
                        // Fade based on distance
                        float fade = 1.0 - (vDistance / 300.0);
                        fade = clamp(fade, 0.0, 1.0);

                        // Flowing energy effect
                        float flow = sin(vPosition.x * 0.1 + vPosition.z * 0.1 + time * 0.5) * 0.3 + 0.7;

                        vec3 finalColor = color * flow;
                        float finalOpacity = opacity * fade;

                        gl_FragColor = vec4(finalColor, finalOpacity);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const line = new THREE.Line(geometry, material);
            this.lines.push(line);
            this.scene.add(line);
        });

        // Add nodes (gas clouds) at intersections
        this.createGasClouds(connections);
    }

    generateFilamentPoints(start, end) {
        const points = [];
        const segments = 20;

        // Add some curvature to the filament
        const midpoint = new THREE.Vector3()
            .addVectors(start, end)
            .multiplyScalar(0.5);

        // Random perpendicular offset for curve
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const perpendicular = new THREE.Vector3(
            -direction.z,
            0,
            direction.x
        ).normalize();

        const curveAmount = start.distanceTo(end) * 0.15;
        midpoint.add(perpendicular.multiplyScalar((Math.random() - 0.5) * curveAmount));

        // Generate curved line using quadratic bezier
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3();

            // Quadratic Bezier curve
            point.x = (1 - t) * (1 - t) * start.x + 2 * (1 - t) * t * midpoint.x + t * t * end.x;
            point.y = (1 - t) * (1 - t) * start.y + 2 * (1 - t) * t * midpoint.y + t * t * end.y;
            point.z = (1 - t) * (1 - t) * start.z + 2 * (1 - t) * t * midpoint.z + t * t * end.z;

            points.push(point);
        }

        return points;
    }

    createGasClouds(connections) {
        // Create gas clouds along filaments
        const cloudCount = Math.min(connections.length, 40);

        for (let i = 0; i < cloudCount; i++) {
            const conn = connections[Math.floor(Math.random() * connections.length)];
            const t = 0.3 + Math.random() * 0.4; // Avoid endpoints

            const position = new THREE.Vector3()
                .lerpVectors(conn.start, conn.end, t);

            // Small particle cloud
            const particleCount = 200 + Math.floor(Math.random() * 300);
            const cloudGeometry = new THREE.BufferGeometry();
            const cloudPositions = new Float32Array(particleCount * 3);
            const cloudSizes = new Float32Array(particleCount);

            for (let j = 0; j < particleCount; j++) {
                const j3 = j * 3;
                const radius = Math.random() * 3;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                cloudPositions[j3] = position.x + radius * Math.sin(phi) * Math.cos(theta);
                cloudPositions[j3 + 1] = position.y + radius * Math.sin(phi) * Math.sin(theta);
                cloudPositions[j3 + 2] = position.z + radius * Math.cos(phi);

                cloudSizes[j] = 0.5 + Math.random() * 1.0;
            }

            cloudGeometry.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
            cloudGeometry.setAttribute('size', new THREE.BufferAttribute(cloudSizes, 1));

            const cloudMaterial = new THREE.PointsMaterial({
                color: new THREE.Color(0.4, 0.3, 0.6),
                size: 1.5,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            const cloud = new THREE.Points(cloudGeometry, cloudMaterial);
            this.lines.push(cloud);
            this.scene.add(cloud);
        }
    }

    update(time, deltaTime) {
        this.lines.forEach(line => {
            if (line.material.uniforms && line.material.uniforms.time) {
                line.material.uniforms.time.value = time;
            }
        });
    }

    dispose() {
        this.lines.forEach(line => {
            line.geometry.dispose();
            line.material.dispose();
            this.scene.remove(line);
        });
        this.lines = [];
    }
}