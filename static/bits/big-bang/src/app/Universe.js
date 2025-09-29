import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SpiralGalaxy } from '../galaxies/SpiralGalaxy.js';
import { EllipticalGalaxy } from '../galaxies/EllipticalGalaxy.js';
import { CosmicWeb } from '../effects/CosmicWeb.js';
import { Postprocessing } from '../effects/Postprocessing.js';
import { Timeline } from '../ui/Timeline.js';

export class Universe {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.postprocessing = null;
        this.timeline = null;
        this.stats = null;

        this.galaxies = [];
        this.cosmicWeb = null;
        this.primordialParticles = null;

        this.startTime = Date.now();
        this.isPlaying = true;
        this.progress = 0;
        this.CYCLE_DURATION = 60000; // 60 seconds

        // Phase definitions
        this.phases = [
            { name: 'SINGULARITY', start: 0, end: 0.03, color: new THREE.Color(1, 1, 1) },
            { name: 'INFLATION', start: 0.03, end: 0.08, color: new THREE.Color(1, 0.8, 0.3) },
            { name: 'QUARK-GLUON PLASMA', start: 0.08, end: 0.15, color: new THREE.Color(1, 0.5, 0.2) },
            { name: 'NUCLEOSYNTHESIS', start: 0.15, end: 0.22, color: new THREE.Color(0.8, 0.6, 1) },
            { name: 'RECOMBINATION', start: 0.22, end: 0.30, color: new THREE.Color(0.5, 0.7, 1) },
            { name: 'DARK AGES', start: 0.30, end: 0.45, color: new THREE.Color(0.2, 0.2, 0.4) },
            { name: 'FIRST STARS', start: 0.45, end: 0.55, color: new THREE.Color(0.7, 0.8, 1) },
            { name: 'GALAXY FORMATION', start: 0.55, end: 0.75, color: new THREE.Color(0.6, 0.5, 0.9) },
            { name: 'COSMIC WEB', start: 0.75, end: 0.90, color: new THREE.Color(0.4, 0.4, 0.8) },
            { name: 'PRESENT DAY', start: 0.90, end: 1.0, color: new THREE.Color(0.3, 0.5, 0.8) }
        ];

        this.init();
    }

    init() {
        this.setupScene();
        this.setupRenderer();
        this.setupCamera();
        this.setupControls();
        this.setupLights();
        this.setupPostprocessing();
        this.setupStats();
        this.createPrimordialParticles();
        this.setupTimeline();
        this.setupEventListeners();
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.00025);
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        document.body.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            3000
        );
        this.camera.position.set(0, 100, 250);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 800;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.enablePan = true;
        this.controls.zoomSpeed = 1.2;
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);

        // Add some point lights for atmosphere
        const pointLight1 = new THREE.PointLight(0x6688ff, 0.5, 300);
        pointLight1.position.set(100, 50, 100);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff6688, 0.5, 300);
        pointLight2.position.set(-100, -50, -100);
        this.scene.add(pointLight2);
    }

    setupPostprocessing() {
        this.postprocessing = new Postprocessing(this.renderer, this.scene, this.camera);
    }

    setupStats() {
        // Stats.js doesn't work well with ES6 modules, so we'll skip it for now
        // You can add it manually via script tag if needed
        this.stats = null;
    }

    createPrimordialParticles() {
        const PARTICLE_COUNT = 50000; // Reduced for better performance
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const sizes = new Float32Array(PARTICLE_COUNT);
        const velocities = new Float32Array(PARTICLE_COUNT * 3);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;

            // Start at singularity
            positions[i3] = (Math.random() - 0.5) * 0.01;
            positions[i3 + 1] = (Math.random() - 0.5) * 0.01;
            positions[i3 + 2] = (Math.random() - 0.5) * 0.01;

            // Random explosion direction
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 0.5 + Math.random() * 2;

            velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            velocities[i3 + 2] = Math.cos(phi) * speed;

            // Initial color
            colors[i3] = 1;
            colors[i3 + 1] = 1;
            colors[i3 + 2] = 1;

            sizes[i] = Math.random() * 2 + 0.3;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        this.primordialVelocities = velocities;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                phase: { value: 0 }
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
                    glow = pow(glow, 2.0);

                    gl_FragColor = vec4(vColor * glow, glow * 0.8);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.primordialParticles = new THREE.Points(geometry, material);
        this.scene.add(this.primordialParticles);
    }

    createGalaxies() {
        if (this.galaxies.length > 0) return;

        console.log('Creating galaxy cluster...');

        const GALAXY_COUNT = 100;
        const SPIRAL_RATIO = 0.8; // 80% spiral, 20% elliptical
        const CLUSTER_RADIUS = 400; // Large cluster radius
        const MIN_DISTANCE = 40; // Minimum distance between galaxies

        const galaxyConfigs = [];
        const positions = [];

        // Color palette for galaxies
        const spiralColors = [
            new THREE.Color(0.7, 0.8, 1.0),  // Blue (young stars)
            new THREE.Color(0.8, 0.9, 1.0),  // Blue-white
            new THREE.Color(1.0, 0.95, 0.8), // White-yellow
            new THREE.Color(1.0, 0.9, 0.7),  // Yellow
            new THREE.Color(0.9, 0.8, 1.0),  // Violet-blue
        ];

        const ellipticalColors = [
            new THREE.Color(1.0, 0.85, 0.6), // Orange-yellow (old stars)
            new THREE.Color(1.0, 0.9, 0.7),  // Yellow-orange
            new THREE.Color(0.95, 0.8, 0.65), // Orange
        ];

        // Generate galaxy positions with clustering
        for (let i = 0; i < GALAXY_COUNT; i++) {
            let position;
            let attempts = 0;
            const maxAttempts = 50;

            // Try to find a position that's not too close to others
            do {
                // Use clustered distribution (normal distribution around origin)
                const r = Math.abs(this.gaussianRandom()) * CLUSTER_RADIUS * 0.5;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                position = new THREE.Vector3(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta) * 0.3, // Flatter distribution
                    r * Math.cos(phi)
                );

                attempts++;
            } while (attempts < maxAttempts && this.tooClose(position, positions, MIN_DISTANCE));

            positions.push(position);

            // Determine galaxy type
            const isSpiral = Math.random() < SPIRAL_RATIO;

            // Size variation (smaller galaxies more common)
            const sizeRoll = Math.random();
            let size;
            if (sizeRoll < 0.7) {
                size = 15 + Math.random() * 20; // Small to medium
            } else if (sizeRoll < 0.95) {
                size = 35 + Math.random() * 20; // Large
            } else {
                size = 55 + Math.random() * 25; // Very large (rare)
            }

            // Star count based on size (reduced for performance)
            const baseStarCount = Math.floor(size * 80); // ~1200-6400 stars per galaxy
            const starCount = Math.max(800, Math.min(baseStarCount, 8000));

            if (isSpiral) {
                // Spiral galaxy parameters
                const arms = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
                const armCurvature = 0.3 + Math.random() * 0.6;
                const thickness = 1.5 + Math.random() * 2.0;
                const color = spiralColors[Math.floor(Math.random() * spiralColors.length)].clone();

                galaxyConfigs.push({
                    type: 'spiral',
                    position: position,
                    config: {
                        starCount: starCount,
                        radius: size,
                        arms: arms,
                        armCurvature: armCurvature,
                        thickness: thickness,
                        color: color
                    }
                });
            } else {
                // Elliptical galaxy (spherical - kugelförmig)
                const color = ellipticalColors[Math.floor(Math.random() * ellipticalColors.length)].clone();

                galaxyConfigs.push({
                    type: 'elliptical',
                    position: position,
                    config: {
                        starCount: starCount,
                        radius: size,
                        color: color
                    }
                });
            }
        }

        console.log(`Generating ${galaxyConfigs.length} galaxies...`);
        console.log(`Spiral: ${galaxyConfigs.filter(g => g.type === 'spiral').length}, Elliptical: ${galaxyConfigs.filter(g => g.type === 'elliptical').length}`);

        // Create galaxies
        galaxyConfigs.forEach((config, index) => {
            let galaxy;
            if (config.type === 'spiral') {
                galaxy = new SpiralGalaxy(this.scene, config.position, config.config);
            } else {
                galaxy = new EllipticalGalaxy(this.scene, config.position, config.config);
            }
            this.galaxies.push(galaxy);

            if ((index + 1) % 20 === 0) {
                console.log(`Created ${index + 1}/${galaxyConfigs.length} galaxies`);
            }
        });

        console.log('Galaxies created! Creating cosmic web...');

        // Create cosmic web connecting nearby galaxies
        this.cosmicWeb = new CosmicWeb(this.scene, positions, {
            maxDistance: 100, // Reduced for performance with many galaxies
            opacity: 0.15
        });

        console.log('Universe initialization complete!');
    }

    // Helper: Gaussian random (Box-Muller transform)
    gaussianRandom() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    // Helper: Check if position is too close to existing positions
    tooClose(position, existingPositions, minDistance) {
        for (let existing of existingPositions) {
            if (position.distanceTo(existing) < minDistance) {
                return true;
            }
        }
        return false;
    }

    setupTimeline() {
        this.timeline = new Timeline(
            (progress) => {
                this.progress = progress;
                this.startTime = Date.now() - (progress * this.CYCLE_DURATION);
                this.isPlaying = false;
            },
            (isPlaying) => {
                this.isPlaying = isPlaying;
                if (isPlaying) {
                    this.startTime = Date.now() - (this.progress * this.CYCLE_DURATION);
                }
            }
        );
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.postprocessing.setSize(window.innerWidth, window.innerHeight);
    }

    getCurrentPhase(progress) {
        for (let phase of this.phases) {
            if (progress >= phase.start && progress < phase.end) {
                return phase;
            }
        }
        return this.phases[this.phases.length - 1];
    }

    updatePrimordialParticles(progress, currentPhase, deltaTime) {
        const positions = this.primordialParticles.geometry.attributes.position.array;
        const colors = this.primordialParticles.geometry.attributes.color.array;

        if (progress < 0.55) {
            // Show primordial particles
            this.primordialParticles.visible = true;

            for (let i = 0; i < positions.length / 3; i++) {
                const i3 = i * 3;

                if (progress < 0.03) {
                    // Singularity
                    const jitter = 0.05;
                    positions[i3] = (Math.random() - 0.5) * jitter;
                    positions[i3 + 1] = (Math.random() - 0.5) * jitter;
                    positions[i3 + 2] = (Math.random() - 0.5) * jitter;

                    colors[i3] = 1;
                    colors[i3 + 1] = 1;
                    colors[i3 + 2] = 1;
                } else if (progress < 0.08) {
                    // Inflation
                    const t = (progress - 0.03) / 0.05;
                    const expansion = Math.pow(t, 1.5) * 80;

                    positions[i3] = this.primordialVelocities[i3] * expansion;
                    positions[i3 + 1] = this.primordialVelocities[i3 + 1] * expansion;
                    positions[i3 + 2] = this.primordialVelocities[i3 + 2] * expansion;

                    colors[i3] = 1;
                    colors[i3 + 1] = 0.9 - t * 0.3;
                    colors[i3 + 2] = 0.6 + t * 0.2;
                } else {
                    // Cooling phase
                    const t = (progress - 0.08) / 0.47;
                    const drift = 80 + t * 40;

                    positions[i3] = this.primordialVelocities[i3] * drift;
                    positions[i3 + 1] = this.primordialVelocities[i3 + 1] * drift;
                    positions[i3 + 2] = this.primordialVelocities[i3 + 2] * drift;

                    // Color evolution
                    const colorPhase = Math.sin(i * 0.1 + progress * 5) * 0.5 + 0.5;
                    colors[i3] = 0.5 + colorPhase * 0.5;
                    colors[i3 + 1] = 0.6 + colorPhase * 0.3;
                    colors[i3 + 2] = 0.8 + colorPhase * 0.2;
                }
            }

            this.primordialParticles.geometry.attributes.position.needsUpdate = true;
            this.primordialParticles.geometry.attributes.color.needsUpdate = true;
        } else {
            // Hide primordial particles during galaxy era
            this.primordialParticles.visible = false;

            // Create galaxies if not already created
            if (this.galaxies.length === 0) {
                this.createGalaxies();
            }
        }

        // Update material uniforms
        this.primordialParticles.material.uniforms.phase.value = progress;
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.stats) this.stats.begin();

        // Calculate progress
        if (this.isPlaying) {
            const elapsed = Date.now() - this.startTime;
            this.progress = (elapsed % this.CYCLE_DURATION) / this.CYCLE_DURATION;
        }

        const currentPhase = this.getCurrentPhase(this.progress);
        const deltaTime = 0.016; // Approximately 60fps
        const time = Date.now() * 0.001;

        // Update primordial particles
        this.updatePrimordialParticles(this.progress, currentPhase, deltaTime);

        // Update galaxies
        this.galaxies.forEach(galaxy => galaxy.update(time, deltaTime));

        // Update cosmic web
        if (this.cosmicWeb) {
            this.cosmicWeb.update(time, deltaTime);
        }

        // Update bloom based on phase
        if (this.progress < 0.1) {
            // Intense bloom for early universe
            this.postprocessing.setBloomStrength(2.5);
        } else if (this.progress < 0.5) {
            this.postprocessing.setBloomStrength(1.5);
        } else {
            this.postprocessing.setBloomStrength(1.2);
        }

        // Update controls
        this.controls.update();

        // Update timeline UI
        if (this.timeline) {
            this.timeline.update(this.progress, currentPhase);
        }

        // Render
        this.postprocessing.render();

        if (this.stats) this.stats.end();
    }
}