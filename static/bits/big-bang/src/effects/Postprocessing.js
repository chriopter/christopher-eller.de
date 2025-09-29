import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export class Postprocessing {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.createComposer();
    }

    createComposer() {
        this.composer = new EffectComposer(this.renderer);

        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom pass
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2,  // strength
            0.8,  // radius
            0.3   // threshold
        );
        this.composer.addPass(this.bloomPass);

        // Vignette effect
        const vignetteShader = {
            uniforms: {
                tDiffuse: { value: null },
                offset: { value: 0.7 },
                darkness: { value: 1.2 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float offset;
                uniform float darkness;
                varying vec2 vUv;

                void main() {
                    vec4 texel = texture2D(tDiffuse, vUv);
                    vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
                    float vignette = 1.0 - dot(uv, uv);
                    vignette = clamp(pow(vignette, darkness), 0.0, 1.0);
                    gl_FragColor = vec4(texel.rgb * vignette, texel.a);
                }
            `
        };

        this.vignettePass = new ShaderPass(vignetteShader);
        this.composer.addPass(this.vignettePass);
    }

    render() {
        this.composer.render();
    }

    setSize(width, height) {
        this.composer.setSize(width, height);
        this.bloomPass.setSize(width, height);
    }

    setBloomStrength(strength) {
        this.bloomPass.strength = strength;
    }

    setBloomRadius(radius) {
        this.bloomPass.radius = radius;
    }

    setBloomThreshold(threshold) {
        this.bloomPass.threshold = threshold;
    }
}