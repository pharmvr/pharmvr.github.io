/**
 * PharmVR 2D — White Spotlight Tutorial Walkthrough System
 * Guides students step-by-step through Experiment 8
 */

const TUTORIAL_STEPS = [
    {
        target: '#drug-rack',
        title: '1. Select a Test Drug',
        text: 'Choose a drug from the Drug Rack on the left. Start with Normal Saline (0.9%) for the Control eye, or Atropine (1%) for the Test eye.',
        position: 'right'
    },
    {
        target: '.eye-selector',
        title: '2. Choose Control vs. Test Eye',
        text: 'In Experiment 8, the Left Eye is the Control (Normal Saline 0.9% only) and the Right Eye is the Test Eye for your active drug.',
        position: 'right'
    },
    {
        target: '.tool-bar',
        title: '3. Measure Baseline & Use Instruments',
        text: 'Use Caliper [1] to measure baseline pupil (~5.5 mm), Pen-Torch [2] for Light Reflex, Cotton Wisp [3] for Corneal Reflex, and Dropper [4] to instil 2 drops.',
        position: 'bottom'
    },
    {
        target: '#btn-absorb',
        title: '4. Wait for Corneal Absorption',
        text: 'After instilling 2 drops, click "Wait 8 min (Absorption)" so the drug penetrates the cornea and acts on iris receptors or sensory nerves.',
        position: 'right'
    },
    {
        target: '#eye-magnifier',
        title: '5. Observe & Record Results',
        text: 'Re-test pupil size, light reflex, and corneal reflex in the magnified eye scope. Your Observation Table auto-populates on the right!',
        position: 'left'
    }
];

class TutorialManager {
    constructor() {
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = document.getElementById('tutorial-overlay');
        this.spotlight = document.getElementById('tutorial-spotlight');
        this.popover = document.getElementById('tutorial-popover');
        this.indicator = document.getElementById('tutorial-step-indicator');
        this.titleEl = document.getElementById('tutorial-title');
        this.textEl = document.getElementById('tutorial-text');
        this.nextBtn = document.getElementById('tutorial-next');

        window.addEventListener('resize', () => {
            if (this.isActive) this._positionStep();
        });
    }

    start() {
        this.currentStep = 0;
        this.isActive = true;
        this.overlay.classList.add('active');
        this._renderStep();
    }

    next() {
        if (this.currentStep < TUTORIAL_STEPS.length - 1) {
            this.currentStep++;
            this._renderStep();
        } else {
            this.stop();
        }
    }

    stop() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }

    _renderStep() {
        const step = TUTORIAL_STEPS[this.currentStep];

        // Update dots
        this.indicator.innerHTML = TUTORIAL_STEPS.map((_, idx) => {
            let cls = 'tutorial-dot';
            if (idx < this.currentStep) cls += ' done';
            else if (idx === this.currentStep) cls += ' active';
            return `<span class="${cls}"></span>`;
        }).join('');

        this.titleEl.textContent = step.title;
        this.textEl.textContent = step.text;
        this.nextBtn.textContent = this.currentStep === TUTORIAL_STEPS.length - 1 ? 'Finish ✓' : 'Next →';

        this._positionStep();
    }

    _positionStep() {
        const step = TUTORIAL_STEPS[this.currentStep];
        const targetEl = document.querySelector(step.target);

        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });

        if (!targetEl) return;
        targetEl.classList.add('tutorial-highlight');

        const rect = targetEl.getBoundingClientRect();
        const pad = 8;

        this.spotlight.style.top = (rect.top - pad) + 'px';
        this.spotlight.style.left = (rect.left - pad) + 'px';
        this.spotlight.style.width = (rect.width + pad * 2) + 'px';
        this.spotlight.style.height = (rect.height + pad * 2) + 'px';

        // Reset arrow classes
        this.popover.classList.remove('arrow-top', 'arrow-bottom', 'arrow-left');

        const popW = 360;
        const popH = 210;
        let top = rect.bottom + 18;
        let left = rect.left;

        if (step.position === 'right') {
            top = Math.max(16, Math.min(window.innerHeight - popH - 16, rect.top));
            left = rect.right + 18;
            this.popover.classList.add('arrow-left');
        } else if (step.position === 'left') {
            top = Math.max(16, Math.min(window.innerHeight - popH - 16, rect.top));
            left = Math.max(16, rect.left - popW - 18);
        } else if (step.position === 'bottom') {
            top = rect.bottom + 18;
            left = Math.max(16, Math.min(window.innerWidth - popW - 16, rect.left + rect.width / 2 - popW / 2));
            this.popover.classList.add('arrow-top');
        }

        // Clamp within viewport
        if (left + popW > window.innerWidth - 16) {
            left = window.innerWidth - popW - 16;
        }
        if (top + popH > window.innerHeight - 16) {
            top = Math.max(16, rect.top - popH - 18);
        }

        this.popover.style.top = top + 'px';
        this.popover.style.left = left + 'px';
    }
}

let tutorialManager = null;

function nextTutorialStep() {
    if (tutorialManager) tutorialManager.next();
}

function skipTutorial() {
    if (tutorialManager) tutorialManager.stop();
}
