import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

export class EllipticalGalaxy {
    constructor(scene, position, config = {}) {
        this.scene = scene;
        this.position = position;

        // Configuration with defaults
        const baseRadius = config.radius || 25;
        this.config = {
            starCount: config.starCount || 20000,
            radiusX: config.radiusX || baseRadius,
            radiusY: config.radiusY || baseRadius * 0.95, // Slightly oblate
            radiusZ: config.radiusZ || baseRadius * 0.9,
            color: config.color || new THREE.Color(1.0, 0.85, 0.7),
            rotation: config.rotation || 0,
            ...config
        };

        this.particles = null;
        this.blackHole = null;
        this.noise = createNoise3D();

        this.createGalaxy();
        this.createBlackHole();
    }

    createGalaxy() {
        const { starCount, radiusX, radiusY, radiusZ, color } = this.config;

        // Create geometry
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;

            // de Vaucouleurs profile - more realistic distribution
            // r^(1/4) law for elliptical galaxies
            const r = Math.pow(Math.random(), 3.0) * 1.0;

            // Uniform distribution on sphere
            const theta = Math.acos(2 * Math.random() - 1); // Better uniform distribution
            const phi = Math.random() * Math.PI * 2;

            // Spherical to cartesian with slight ellipticity
            const x = r * Math.sin(theta) * Math.cos(phi) * radiusX;
            const y = r * Math.sin(theta) * Math.sin(phi) * radiusY;
            const z = r * Math.cos(theta) * radiusZ;

            positions[i3] = x + this.position.x;
            positions[i3 + 1] = y + this.position.y;
            positions[i3 + 2] = z + this.position.z;

            // Elliptical galaxies have older, redder stars
            const temp = Math.random();
            let starColor = new THREE.Color();

            if (temp < 0.05) {
                // Rare blue stragglers
                starColor.setRGB(0.8 + Math.random() * 0.2, 0.9 + Math.random() * 0.1, 1.0);
            } else if (temp < 0.3) {
                // Yellow-orange stars
                starColor.setRGB(1.0, 0.8 + Math.random() * 0.2, 0.5 + Math.random() * 0.3);
            } else {
                // Red giants (dominant in elliptical galaxies)
                starColor.setRGB(1.0, 0.5 + Math.random() * 0.3, 0.3 + Math.random() * 0.3);
            }

            // Mix with galaxy base color
            starColor.lerp(color, 0.4);

            colors[i3] = starColor.r;
            colors[i3 + 1] = starColor.g;
            colors[i3 + 2] = starColor.b;

            // More uniform star sizes (older population)
            sizes[i] = 0.8 + Math.random() * 2.0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

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
                    glow = pow(glow, 2.5);

                    float alpha = glow * 0.85;

                    gl_FragColor = vec4(vColor * (0.7 + glow * 0.4), alpha);
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
        // Supermassive black hole at center (larger than spiral galaxies)
        const blackHoleGeometry = new THREE.SphereGeometry(1.0, 32, 32);
        const blackHoleMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 1.0
        });

        this.blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
        this.blackHole.position.copy(this.position);
        this.scene.add(this.blackHole);

        // Add subtle glow
        const glowGeometry = new THREE.SphereGeometry(2.5, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;

                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    vec3 color = vec3(1.0, 0.7, 0.4);
                    gl_FragColor = vec4(color * intensity, intensity * 0.3);
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });

        this.blackHoleGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.blackHoleGlow.position.copy(this.position);
        this.scene.add(this.blackHoleGlow);
    }

    update(time, deltaTime) {
        if (!this.particles) return;

        // Update shader time uniform
        if (this.particles.material.uniforms.time) {
            this.particles.material.uniforms.time.value = time;
        }

        // Slow rotation
        this.particles.rotation.y += deltaTime * 0.02;

        // Update black hole glow
        if (this.blackHoleGlow) {
            this.blackHoleGlow.material.uniforms.time.value = time;
            this.blackHoleGlow.rotation.y += deltaTime * 0.3;
        }
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
        if (this.blackHoleGlow) {
            this.blackHoleGlow.geometry.dispose();
            this.blackHoleGlow.material.dispose();
            this.scene.remove(this.blackHoleGlow);
        }
    }
}