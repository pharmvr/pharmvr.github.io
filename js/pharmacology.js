/**
 * PharmVR 2D — Pharmacology Engine
 * Experiment 8: Effect of Various Drugs on Rabbit's Eye
 * Accurate pharmacological simulation with Right (Test) vs Left (Control) eye
 */

const DRUGS = {
    saline: {
        id: 'saline',
        name: 'Normal Saline (0.9%)',
        shortName: 'Saline 0.9%',
        classMech: 'Control (Inert isotonic vehicle)',
        targetDiameter: 5.5,
        pupilDesc: 'No change (5.5 mm)',
        lightReflex: 'Present',
        cornealReflex: 'Present',
        bottleColor: '#64748b',
        summary: 'Isotonic NaCl control; confirms mechanical drop instillation does not alter pupil or reflexes.'
    },
    atropine: {
        id: 'atropine',
        name: 'Atropine (1%)',
        shortName: 'Atropine 1%',
        classMech: 'Parasympatholytic — blocks M₃ receptors on circular sphincter muscle',
        targetDiameter: 8.8,
        pupilDesc: 'Mydriasis (Dilated)',
        lightReflex: 'Absent',
        cornealReflex: 'Present',
        bottleColor: '#dc2626',
        summary: 'Blocks M₃ muscarinic receptors on circular (sphincter) muscle → mydriasis & paralysis of pupillary light reflex. Corneal reflex remains intact.'
    },
    ephedrine: {
        id: 'ephedrine',
        name: 'Ephedrine (2%)',
        shortName: 'Ephedrine 2%',
        classMech: 'Sympathomimetic — stimulates α₁ receptors on radial dilator muscle',
        targetDiameter: 8.2,
        pupilDesc: 'Mydriasis (Dilated)',
        lightReflex: 'Present',
        cornealReflex: 'Present',
        bottleColor: '#d97706',
        summary: 'Contracts radial dilator muscle via α₁ adrenergic receptors → mydriasis with light reflex INTACT. Key differentiator from Atropine.'
    },
    physostigmine: {
        id: 'physostigmine',
        name: 'Physostigmine (0.5%)',
        shortName: 'Physostigmine 0.5%',
        classMech: 'Parasympathomimetic — AChE inhibitor → ↑ ACh at M₃ receptors',
        targetDiameter: 2.3,
        pupilDesc: 'Miosis (Constricted)',
        lightReflex: 'Present',
        cornealReflex: 'Present',
        bottleColor: '#16a34a',
        summary: 'Reversible acetylcholinesterase inhibitor. Increases endogenous ACh at M₃ receptors on circular sphincter → pinpoint miosis.'
    },
    lignocaine: {
        id: 'lignocaine',
        name: 'Lignocaine (2%)',
        shortName: 'Lignocaine 2%',
        classMech: 'Local Anaesthetic — blocks corneal sensory Na⁺ channels (CN V₁)',
        targetDiameter: 5.5,
        pupilDesc: 'No change (5.5 mm)',
        lightReflex: 'Present',
        cornealReflex: 'Absent',
        bottleColor: '#7c3aed',
        summary: 'Blocks voltage-gated Na⁺ channels on corneal sensory nerves (ophthalmic division, CN V₁) → abolishes corneal blink reflex without pupil change.'
    }
};

const VIVA_QUESTIONS = [
    {
        q: "Both Atropine (1%) and Ephedrine (2%) produce marked mydriasis. How do you experimentally differentiate between them?",
        opts: [
            "Test the pupillary light reflex: Atropine abolishes it, Ephedrine leaves it present.",
            "Test the corneal reflex: Ephedrine abolishes blinking.",
            "Measure pupil size: only Ephedrine dilates past 8 mm.",
            "Wait 30 minutes: Atropine effect reverses first."
        ],
        ans: 0,
        explanation: "Atropine blocks M₃ receptors on the circular (sphincter) muscle, paralysing the efferent limb of the light reflex arc. Ephedrine only stimulates α₁ receptors on the radial (dilator) muscle, leaving the sphincter and its reflex arc intact. Therefore, shining a pen-torch will constrict the pupil with Ephedrine but NOT with Atropine."
    },
    {
        q: "Which drug in this experiment abolishes the corneal reflex without changing pupil diameter?",
        opts: [
            "Physostigmine (0.5%)",
            "Atropine (1%)",
            "Lignocaine (2%)",
            "Ephedrine (2%)"
        ],
        ans: 2,
        explanation: "Lignocaine (2%) is a local anaesthetic that blocks voltage-gated Na⁺ channels on corneal sensory nerves (ophthalmic branch of CN V), knocking out the afferent limb of the blink reflex. It has no effect on autonomic iris muscles, so pupil size remains unchanged."
    },
    {
        q: "Why is an albino rabbit specifically preferred over a pigmented rabbit for this experiment?",
        opts: [
            "Albino rabbits have larger corneas that hold more drug solution.",
            "Its unpigmented (pink) iris creates sharp contrast against the dark pupil, making subtle diameter changes easy to measure.",
            "Albino rabbits lack a corneal blink reflex at baseline.",
            "Pigmented rabbits are resistant to muscarinic antagonists."
        ],
        ans: 1,
        explanation: "The absence of melanin pigment gives the iris a bright pink/red vascular hue, providing crisp optical contrast against the black pupil. This makes even 0.5 mm changes in pupil diameter clearly visible and measurable with a Vernier caliper."
    },
    {
        q: "What is the mechanism by which Physostigmine (0.5%) produces miosis?",
        opts: [
            "Direct blockade of α₁ receptors on the radial dilator muscle.",
            "Inhibition of acetylcholinesterase → ↑ endogenous ACh at M₃ receptors on the circular sphincter muscle.",
            "Activation of corneal voltage-gated Na⁺ channels.",
            "Direct relaxation of ciliary body smooth muscle via β₂ stimulation."
        ],
        ans: 1,
        explanation: "Physostigmine is a reversible cholinesterase inhibitor (parasympathomimetic). By blocking AChE, it prevents breakdown of endogenous acetylcholine, increasing ACh concentration at M₃ muscarinic receptors on the circular sphincter muscle → active sphincter contraction → miosis (pupil constriction)."
    },
    {
        q: "Why do we instil Normal Saline (0.9%) into the left (control) eye during the procedure?",
        opts: [
            "To anesthetize the left cornea before measuring reflexes.",
            "To dilute any systemic drug absorption across the nasal mucosa.",
            "To serve as an inert control for direct side-by-side comparison with the test eye.",
            "To wash away excess hair and debris from the restrainer."
        ],
        ans: 2,
        explanation: "Normal saline serves as the experimental control. By instilling an equivalent volume of an inert, isotonic solution into the contralateral eye, we can prove that any observed pupillary or reflex changes in the test eye result from the drug's pharmacological action, not from mechanical stimulation of drops or the stress of handling."
    }
];

class PharmacologySession {
    constructor() {
        this.baselineDiameter = 5.5;
        this.resetAll();
    }

    resetAll() {
        this.activeEye = 'right';
        this.selectedDrugId = 'atropine';
        this.eyes = {
            right: this._createEyeState(),
            left: this._createEyeState()
        };
        this.records = {};
        this.score = 12;
        this.doubt = 0;
        this.elapsedSeconds = 0;
        this.vivaScore = 0;
        this.vivaDone = false;
        this.vivaCurrentQ = 0;
        this.vivaAnswered = [];
    }

    _createEyeState() {
        return {
            drugId: null,
            dropsInstilled: 0,
            minutesPostDose: 0,
            absorbed: false,
            currentDiameter: this.baselineDiameter,
            targetDiameter: this.baselineDiameter,
            lightConstricting: false,
            blinking: false,
            baselineChecked: { pupil: false, light: false, corneal: false },
            postChecked: { pupil: false, light: false, corneal: false }
        };
    }

    resetRabbitForNextDrug() {
        const savedRecords = { ...this.records };
        const savedScore = this.score;
        const savedDoubt = this.doubt;
        this.eyes.right = this._createEyeState();
        this.eyes.left = this._createEyeState();
        this.records = savedRecords;
        this.score = savedScore;
        this.doubt = savedDoubt;
    }

    getActiveEyeState() {
        return this.eyes[this.activeEye];
    }

    getEffectiveDrug(eyeKey) {
        eyeKey = eyeKey || this.activeEye;
        const eye = this.eyes[eyeKey];
        if (!eye.drugId || !eye.absorbed) return DRUGS.saline;
        return DRUGS[eye.drugId];
    }

    instilDrop() {
        const eye = this.getActiveEyeState();

        // Validation: control eye must receive saline
        if (this.activeEye === 'left' && this.selectedDrugId !== 'saline') {
            this.doubt = Math.min(100, this.doubt + 15);
            return {
                ok: false,
                type: 'error',
                msg: '❌ Mistake! Left Eye is the Control Eye — only Normal Saline (0.9%) should be instilled here!'
            };
        }

        // Validation: don't mix drugs on same eye
        if (eye.drugId && eye.drugId !== this.selectedDrugId) {
            this.doubt = Math.min(100, this.doubt + 12);
            return {
                ok: false,
                type: 'error',
                msg: '⚠️ Contamination! Click "New Rabbit" before switching drugs on the same eye.'
            };
        }

        eye.drugId = this.selectedDrugId;
        eye.dropsInstilled = Math.min(2, eye.dropsInstilled + 1);
        this.score = Math.min(100, this.score + 4);

        const drug = DRUGS[this.selectedDrugId];
        if (eye.dropsInstilled < 2) {
            return {
                ok: true,
                type: 'info',
                msg: `💧 Drop 1/2 of ${drug.shortName} instilled into ${this.activeEye.toUpperCase()} eye pouch. Instil 1 more drop!`
            };
        } else {
            this.score = Math.min(100, this.score + 5);
            return {
                ok: true,
                type: 'success',
                msg: `✅ 2 drops of ${drug.shortName} instilled! Now click "⏱️ Wait 8 min" for corneal absorption.`
            };
        }
    }

    advanceTime(minutes) {
        minutes = minutes || 8;
        let anyAbsorbed = false;
        ['right', 'left'].forEach(k => {
            const eye = this.eyes[k];
            if (eye.drugId && eye.dropsInstilled >= 2) {
                eye.minutesPostDose += minutes;
                if (eye.minutesPostDose >= 5) {
                    eye.absorbed = true;
                    eye.targetDiameter = DRUGS[eye.drugId].targetDiameter;
                    anyAbsorbed = true;
                }
            }
        });
        return anyAbsorbed;
    }

    measurePupil() {
        const eye = this.getActiveEyeState();
        const drug = this.getEffectiveDrug();
        const diam = eye.absorbed ? drug.targetDiameter : this.baselineDiameter;

        if (!eye.drugId) {
            eye.baselineChecked.pupil = true;
        } else if (eye.absorbed) {
            eye.postChecked.pupil = true;
            this._saveRecordEntry(eye.drugId);
        }
        this.score = Math.min(100, this.score + 3);

        let desc = eye.absorbed ? drug.pupilDesc : 'Baseline';
        return {
            diameter: diam,
            msg: `📏 Caliper Reading (${this.activeEye.toUpperCase()} Eye): ${diam.toFixed(1)} mm — ${desc}`
        };
    }

    testLightReflex() {
        const eye = this.getActiveEyeState();
        const drug = this.getEffectiveDrug();
        const isPresent = drug.lightReflex === 'Present';

        if (!eye.drugId) {
            eye.baselineChecked.light = true;
        } else if (eye.absorbed) {
            eye.postChecked.light = true;
            this._saveRecordEntry(eye.drugId);
        }

        if (isPresent) {
            eye.lightConstricting = true;
            setTimeout(() => { eye.lightConstricting = false; }, 1800);
        }
        this.score = Math.min(100, this.score + 4);

        return {
            present: isPresent,
            msg: isPresent
                ? `🔦 Light Reflex PRESENT (${this.activeEye.toUpperCase()} Eye): Pupil briskly constricts under pen-torch illumination!`
                : `🔦 Light Reflex ABSENT (${this.activeEye.toUpperCase()} Eye): Pupil remains fixed and dilated — M₃ sphincter paralysed!`
        };
    }

    testCornealReflex() {
        const eye = this.getActiveEyeState();
        const drug = this.getEffectiveDrug();
        const isPresent = drug.cornealReflex === 'Present';

        if (!eye.drugId) {
            eye.baselineChecked.corneal = true;
        } else if (eye.absorbed) {
            eye.postChecked.corneal = true;
            this._saveRecordEntry(eye.drugId);
        }

        if (isPresent) {
            eye.blinking = true;
            setTimeout(() => { eye.blinking = false; }, 800);
        }
        this.score = Math.min(100, this.score + 4);

        return {
            present: isPresent,
            msg: isPresent
                ? `🧶 Corneal Reflex PRESENT (${this.activeEye.toUpperCase()} Eye): Rabbit immediately blinks on cotton wisp touch!`
                : `🧶 Corneal Reflex ABSENT (${this.activeEye.toUpperCase()} Eye): No blink! Corneal sensory Na⁺ channels blocked.`
        };
    }

    _saveRecordEntry(drugId) {
        const d = DRUGS[drugId];
        const eye = this.getActiveEyeState();
        this.records[drugId] = {
            drugName: d.name,
            eyeSide: this.activeEye === 'left' ? 'Left (Control)' : 'Right (Test)',
            classMech: d.classMech,
            baseline: this.baselineDiameter.toFixed(1) + ' mm',
            postPupil: eye.postChecked.pupil ? d.targetDiameter.toFixed(1) + ' mm (' + d.pupilDesc + ')' : '—',
            lightReflex: eye.postChecked.light ? d.lightReflex : '—',
            cornealReflex: eye.postChecked.corneal ? d.cornealReflex : '—'
        };
    }

    getDrugsTested() {
        return Object.keys(this.records).length;
    }

    isExperimentComplete() {
        return Object.keys(this.records).length >= 5;
    }
}
