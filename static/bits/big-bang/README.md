# The Universe: Big Bang Simulation

An advanced, interactive 3D visualization of cosmic evolution from the Big Bang to the present day. Watch 13.8 billion years of cosmic history unfold in 60 seconds.

## Features

### Cosmic Phases
- **Singularity** - The beginning of everything
- **Inflation** - Rapid exponential expansion
- **Quark-Gluon Plasma** - Early hot dense state
- **Nucleosynthesis** - Formation of first atomic nuclei
- **Recombination** - First atoms form, universe becomes transparent
- **Dark Ages** - Before first stars
- **First Stars** - Reionization begins
- **Galaxy Formation** - Gravitational collapse into galaxies
- **Cosmic Web** - Large-scale structure emerges
- **Present Day** - Modern universe with mature galaxies

### Visual Elements
- **50,000+ particles** simulating primordial matter in early universe
- **~100 procedurally generated galaxies** in a realistic cluster
  - **80% Spiral galaxies** with 2-5 spiral arms
    - Logarithmic spiral structure with tight arm definition
    - Differential rotation with Keplerian velocity curves
    - Varied sizes (15-80 units radius)
    - 800-8000 stars per galaxy based on size
    - Blue, white, and yellow star populations
  - **20% Elliptical galaxies** (kugelförmig - spherical)
    - de Vaucouleurs r^(1/4) brightness profile
    - Nearly spherical with slight oblateness
    - Older, redder star populations
    - Dominated by red giants and yellow stars
- **Supermassive black holes** at galaxy centers with animated accretion disks
- **Cosmic web structure** with 150+ filaments connecting nearby galaxies
- **Gas clouds** at filament intersections
- **Advanced post-processing** with bloom, vignette, and tone mapping
- **Dynamic lighting** and atmospheric effects
- **Clustered spatial distribution** using Gaussian distribution for realistic structure

### Interactivity
- **Orbit controls** - Click and drag to rotate view
- **Zoom** - Scroll to zoom in/out
- **Pan** - Right-click drag to pan
- **Timeline control** - Scrub through cosmic history
- **Play/pause** - Watch evolution in real-time
- **Performance stats** - FPS counter (top-left)

## Technical Details

### Architecture
- **Modular design** with separate components:
  - `src/galaxies/SpiralGalaxy.js` - Spiral galaxy generation
  - `src/galaxies/EllipticalGalaxy.js` - Elliptical galaxy generation
  - `src/effects/CosmicWeb.js` - Cosmic web filaments
  - `src/effects/Postprocessing.js` - Visual effects pipeline
  - `src/ui/Timeline.js` - UI controls and timeline
  - `src/app/Universe.js` - Main application orchestration

### Technologies
- **Three.js** - 3D rendering engine
- **Simplex Noise** - Procedural generation
- **Stats.js** - Performance monitoring
- **Custom GLSL shaders** - Advanced particle effects

### Physics
- **Keplerian rotation curves** modified for dark matter halos
- **Differential rotation** in spiral galaxies
- **Gravitational structure formation** simulation
- **Hubble expansion** approximation

## Installation

```bash
npm install
```

## Usage

Open `index.html` in a modern web browser that supports WebGL 2.0 and ES6 modules.

Or use a local server:
```bash
python -m http.server 8000
# Then open http://localhost:8000
```

## Controls

- **Mouse Left Button** - Rotate camera
- **Mouse Scroll** - Zoom in/out
- **Mouse Right Button** - Pan camera
- **Play Button** - Start/pause simulation
- **Timeline Slider** - Jump to any point in cosmic history

## Performance

- Optimized for 60 FPS on modern hardware
- Dynamic particle count per galaxy (800-8000 stars) based on galaxy size
- Efficient cosmic web generation (max 150 filaments, 2 connections per galaxy)
- Reduced primordial particle count (50K) for better performance
- Optimized shader materials with custom GLSL
- Mobile-responsive design

**Total particle count**: ~50K (primordial) + ~300K-400K (galaxies) = ~350K-450K particles

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

Requires WebGL 2.0 support and ES6 modules.

## Update Dependencies

Check for updates:
```bash
npm outdated
```

Update all dependencies:
```bash
npm update
```

## Future Enhancements

Potential additions:
- Galaxy collision simulation
- N-body gravity approximation (Barnes-Hut octree)
- Dark matter halo visualization
- Volumetric nebulae rendering
- VR support
- Sound design
- Educational annotations

## Credits

Created as an educational visualization of cosmic evolution.

Based on modern cosmological understanding and astrophysics research.

## License

ISC