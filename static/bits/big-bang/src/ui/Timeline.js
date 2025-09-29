export class Timeline {
    constructor(onTimeChange, onPlayPause) {
        this.onTimeChange = onTimeChange;
        this.onPlayPause = onPlayPause;
        this.isPlaying = true;

        this.createUI();
        this.setupEventListeners();
    }

    createUI() {
        // Phase indicator
        this.phaseIndicator = document.getElementById('phase');

        // Time indicator
        this.timeIndicator = document.getElementById('time-info');
        if (!this.timeIndicator) {
            this.timeIndicator = document.createElement('div');
            this.timeIndicator.id = 'time-info';
            this.timeIndicator.className = 'time-info';
            document.body.appendChild(this.timeIndicator);
        }

        // Controls
        this.playBtn = document.getElementById('playBtn');
        this.timeSlider = document.getElementById('timeSlider');
    }

    setupEventListeners() {
        this.playBtn.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            this.playBtn.textContent = this.isPlaying ? '❚❚' : '▶';
            this.onPlayPause(this.isPlaying);
        });

        this.timeSlider.addEventListener('input', (e) => {
            const progress = parseFloat(e.target.value);
            this.onTimeChange(progress);
        });
    }

    update(progress, phase) {
        // Update slider
        this.timeSlider.value = progress;

        // Update phase text
        this.phaseIndicator.textContent = phase.name;
        this.phaseIndicator.style.color = `rgb(${phase.color.r * 255}, ${phase.color.g * 255}, ${phase.color.b * 255})`;

        // Update time info
        const age = this.progressToAge(progress);
        this.timeIndicator.textContent = age;
    }

    progressToAge(progress) {
        const totalAge = 13.8; // billion years
        const age = progress * totalAge;

        if (age < 0.000001) {
            return 'Singularity';
        } else if (age < 0.001) {
            const microseconds = age * 1e15;
            return `${microseconds.toFixed(2)} μs after Big Bang`;
        } else if (age < 1) {
            const years = age * 1e9;
            if (years < 1000) {
                return `${years.toFixed(0)} years`;
            } else if (years < 1e6) {
                return `${(years / 1000).toFixed(1)}K years`;
            } else {
                return `${(years / 1e6).toFixed(1)}M years`;
            }
        } else {
            return `${age.toFixed(2)} billion years`;
        }
    }

    setPlaying(playing) {
        this.isPlaying = playing;
        this.playBtn.textContent = this.isPlaying ? '❚❚' : '▶';
    }
}