import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export class SpiralGalaxy {
    constructor(scene, position, config = {}) {
        this.scene = scene;
        this.position = position;

        // Configuration with defaults
        this.config = {
            starCount: config.starCount || 15000,
            radius: config.radius || 40,
            arms: config.arms || 3,
            armCurvature: config.armCurvature || 0.5,
            thickness: config.thickness || 2,
            centralBulgeSize: config.centralBulgeSize || 8,
            rotation: config.rotation || 0,
            color: config.color || new THREE.Color(0.8, 0.9, 1.0),
            ...config
        };

        this.particles = null;
        this.blackHole = null;
        this.noise = createNoise2D();

        this.createGalaxy();
        this.createBlackHole();
    }

    createGalaxy() {
        const { starCount, radius, arms, armCurvature, thickness, centralBulgeSize, color } = this.config;

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const velocities = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;

            // Distance from center (stronger bias towards center for realistic profile)
            const r = Math.pow(Math.random(), 0.7) * radius;

            // Decide if star is in arm or inter-arm region
            const inArm = Math.random() < 0.7; // 70% in arms

            // Arm selection
            const armIndex = Math.floor(Math.random() * arms);
            const armAngle = armIndex * (Math.PI * 2 / arms);

            // Spiral calculation with logarithmic spiral
            const spiralTightness = armCurvature * 3;
            const spiralAngle = armAngle + (r / radius) * Math.PI * spiralTightness;

            // Add spread - tighter in arms, looser between
            let angleOffset;
            if (inArm) {
                // Tight arm structure with some noise
                angleOffset = (Math.random() - 0.5) * 0.15;
            } else {
                // Inter-arm region - more spread out
                angleOffset = (Math.random() - 0.5) * 0.8;
            }

            const finalAngle = spiralAngle + angleOffset;

            // Position
            const x = Math.cos(finalAngle) * r;
            const z = Math.sin(finalAngle) * r;

            // Vertical position (disk structure - thinner with distance)
            const diskFalloff = Math.exp(-r / (radius * 0.5));
            const heightFactor = thickness * diskFalloff;
            const y = (Math.random() - 0.5) * heightFactor * (inArm ? 0.5 : 1.0);

            positions[i3] = x + this.position.x;
            positions[i3 + 1] = y + this.position.y;
            positions[i3 + 2] = z + this.position.z;

            // Orbital velocity (Keplerian rotation curve modified for dark matter halo)
            const speed = Math.sqrt(10 / (r + 1)) * 0.5;
            const vx = -Math.sin(finalAngle) * speed;
            const vz = Math.cos(finalAngle) * speed;

            velocities[i3] = vx;
            velocities[i3 + 1] = 0;
            velocities[i3 + 2] = vz;

            // Star color variations
            const temp = Math.random();
            let starColor = new THREE.Color();

            if (temp < 0.2) {
                // Blue-white young stars (in spiral arms)
                starColor.setRGB(0.7 + Math.random() * 0.3, 0.8 + Math.random() * 0.2, 1.0);
            } else if (temp < 0.7) {
                // Yellow-white main sequence
                starColor.setRGB(1.0, 0.9 + Math.random() * 0.1, 0.7 + Math.random() * 0.3);
            } else {
                // Red giants and old stars (more common in bulge)
                starColor.setRGB(1.0, 0.4 + Math.random() * 0.3, 0.2 + Math.random() * 0.2);
            }

            // Mix with galaxy base color
            starColor.lerp(color, 0.3);

            colors[i3] = starColor.r;
            colors[i3 + 1] = starColor.g;
            colors[i3 + 2] = starColor.b;

            // Varying star sizes
            const isBright = Math.random() < 0.1;
            sizes[i] = isBright ? (2 + Math.random() * 3) : (0.5 + Math.random() * 1.5);
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Store velocities for animation
        this.velocities = velocities;

        // Shader material for stars
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;

                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;

                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);

                    if(dist > 0.5) discard;

                    float glow = 1.0 - dist * 2.0;
                    glow = pow(glow, 3.0);

                    float alpha = glow * 0.9;

                    gl_FragColor = vec4(vColor * (0.8 + glow * 0.5), alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    createBlackHole() {
        // Create supermassive black hole at center
        const blackHoleGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const blackHoleMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 1.0
        });

        this.blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
        this.blackHole.position.copy(this.position);
        this.scene.add(this.blackHole);

        // Accretion disk
        const diskGeometry = new THREE.RingGeometry(1, 6, 64);
        const diskMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(1.0, 0.6, 0.2) },
                color2: { value: new THREE.Color(1.0, 0.3, 0.0) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;

                void main() {
                    vUv = uv;
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec2 vUv;
                varying vec3 vPosition;

                void main() {
                    float dist = length(vPosition);
                    float normalized = (dist - 1.0) / 5.0;

                    // Animated rotation
                    float angle = atan(vPosition.y, vPosition.x) + time * 0.5;
                    float spiral = sin(angle * 6.0 + dist * 2.0) * 0.5 + 0.5;

                    // Color gradient
                    vec3 color = mix(color1, color2, normalized);
                    color = mix(color, color * 0.5, spiral);

                    // Brightness falloff
                    float brightness = 1.0 - normalized;
                    brightness *= 0.7 + spiral * 0.3;

                    gl_FragColor = vec4(color * brightness, 0.8 - normalized * 0.5);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        this.accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
        this.accretionDisk.position.copy(this.position);
        this.accretionDisk.rotation.x = Math.PI / 2;
        this.scene.add(this.accretionDisk);
    }

    update(time, deltaTime) {
        if (!this.particles) return;

        // Update shader time uniform
        if (this.particles.material.uniforms.time) {
            this.particles.material.uniforms.time.value = time;
        }

        // Rotate accretion disk
        if (this.accretionDisk) {
            this.accretionDisk.rotation.z += deltaTime * 0.5;
            this.accretionDisk.material.uniforms.time.value = time;
        }

        // Rotate galaxy
        const positions = this.particles.geometry.attributes.position.array;
        const rotationSpeed = deltaTime * 0.05;

        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i] - this.position.x;
            const z = positions[i + 2] - this.position.z;
            const r = Math.sqrt(x * x + z * z);

            if (r > 0.1) {
                const angle = Math.atan2(z, x);
                const speed = this.velocities[i / 3 * 3];
                const newAngle = angle + rotationSpeed * Math.abs(speed) * 0.1;

                positions[i] = Math.cos(newAngle) * r + this.position.x;
                positions[i + 2] = Math.sin(newAngle) * r + this.position.z;
            }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    dispose() {
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.scene.remove(this.particles);
        }
        if (this.blackHole) {
            this.blackHole.geometry.dispose();
            this.blackHole.material.dispose();
            this.scene.remove(this.blackHole);
        }
        if (this.accretionDisk) {
            this.accretionDisk.geometry.dispose();
            this.accretionDisk.material.dispose();
            this.scene.remove(this.accretionDisk);
        }
    }
}