/**
 * ENG-F: Studio-Grade Systemic & Special Assays Engine
 * Uses studio 2D illustration (assets/special-pharma-bench.jpg) + crisp SVG Draggable Tools & Vials
 * + real-time digital instrument overlays for all 10 special assays: 4, 21, 23–30.
 */

const SPECIAL_CONFIGS = {
    4:  { title: "Antihistaminic Drugs (Histamine Chamber)", model: "Guinea Pig Aerosol Challenge", metric: "Pre-Convulsive Dyspnoea (sec)", control: "78 s", testDrug: "Chlorpheniramine (2 mg/kg)", testVal: "412 s (5.3× delay)", mechanism: "Competitive H₁ receptor blockade prevents histamine-induced bronchospasm.", toolName: "Antihistamine Syringe", targetName: "Histamine Chamber" },
    21: { title: "Local Anaesthetic Activity (Guinea Pig Wheal)", model: "Intradermal Wheal Pin-Prick (6 pricks)", metric: "Negative Responses (Out of 36)", control: "2 / 36", testDrug: "Lignocaine 1% (0.1 mL i.d.)", testVal: "34 / 36 (94% block)", mechanism: "Blocks voltage-gated Na⁺ channels in intradermal sensory nerve endings.", toolName: "Lignocaine Syringe", targetName: "Wheal Assay Bench" },
    23: { title: "Acute Toxicity Study (LD₅₀ Up-and-Down)", model: "OECD 425 Oral Toxicity in Mice", metric: "Estimated LD₅₀", control: "0% mortality (50 mg/kg)", testDrug: "Test Compound X (175→2000 mg/kg)", testVal: "LD₅₀ = 980 mg/kg", mechanism: "Up-and-down sequential dosing minimizes animal usage while estimating median lethal dose.", toolName: "Oral Gavage Syringe", targetName: "Toxicity Bench" },
    24: { title: "Anti-inflammatory Activity (Carrageenan Paw Oedema)", model: "Rat Hind-Paw Plethysmometer (3 hr)", metric: "Paw Volume Increase (mL)", control: "+0.82 mL", testDrug: "Indomethacin (10 mg/kg p.o.)", testVal: "+0.24 mL (71% inhib.)", mechanism: "Inhibits COX-1/COX-2 prostaglandin synthesis in the late exudative phase.", toolName: "Indomethacin Syringe", targetName: "Plethysmometer" },
    25: { title: "Antipyretic Activity (Yeast-Induced Pyrexia)", model: "Brewer's Yeast Fever in Rats", metric: "Rectal Temp (°C) at 3 hr", control: "39.4 °C", testDrug: "Paracetamol (150 mg/kg p.o.)", testVal: "37.3 °C (Afebrile)", mechanism: "Inhibits hypothalamic COX-3/COX-2, lowering PGE₂ at the thermoregulatory centre.", toolName: "Paracetamol Syringe", targetName: "Pyrexia Bench" },
    26: { title: "Diuretic Activity (Lipschitz Test)", model: "Saline-Loaded Rats in Metabolic Cage (5 hr)", metric: "Urine Output (mL / 5 hr)", control: "2.4 mL", testDrug: "Furosemide (20 mg/kg p.o.)", testVal: "8.9 mL (Natriuresis)", mechanism: "Inhibits NKCC2 cotransporter in thick ascending limb of Loop of Henle.", toolName: "Furosemide Syringe", targetName: "Metabolic Cage" },
    27: { title: "Hypoglycaemic Activity (Alloxan Diabetic Rats)", model: "Alloxan-Induced Hyperglycaemia", metric: "Blood Glucose (mg/dL)", control: "295 mg/dL", testDrug: "Glibenclamide (5 mg/kg)", testVal: "132 mg/dL (-55%)", mechanism: "Blocks pancreatic β-cell K_ATP channels → depolarization → insulin release.", toolName: "Glibenclamide Syringe", targetName: "Glucometer Bench" },
    28: { title: "GIT Motility (Charcoal Meal Transit)", model: "10% Charcoal Suspension in Mice", metric: "% Intestinal Length Travelled", control: "64%", testDrug: "Atropine vs Metoclopramide", testVal: "Atr: 28% | Met: 88%", mechanism: "Muscarinic M₃ blockade slows peristalsis; D₂ blockade/5-HT₄ agonism accelerates transit.", toolName: "Charcoal Syringe", targetName: "GIT Assay Bench" },
    29: { title: "Antiemetic Activity (CuSO₄ Emesis)", model: "Copper Sulfate Challenge", metric: "Emetic Episodes / 30 min", control: "6 episodes", testDrug: "Ondansetron (1 mg/kg)", testVal: "0 episodes (100% prot.)", mechanism: "Blocks 5-HT₃ receptors in the CTZ and GI vagal afferents.", toolName: "Ondansetron Syringe", targetName: "Emesis Chamber" },
    30: { title: "Effect of Drugs on Ciliary Motility", model: "Frog Oesophageal Ciliated Epithelium", metric: "Cork Disc Transit Time (1 cm)", control: "18.5 s", testDrug: "ACh (10 µg/mL) vs Atropine", testVal: "ACh: 9.2 s | Atr: 31.0 s", mechanism: "Cholinergic stimulation accelerates ciliary beat frequency.", toolName: "ACh Dropper", targetName: "Ciliary Board" }
};

class SpecialEngine {
    constructor(expNum, container) {
        this.expNum = expNum;
        this.cfg = SPECIAL_CONFIGS[expNum];
        this.container = container;
        this.mode = 'control';
        this.xp = 0;
        this.testedControl = false;
        this.testedTest = false;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="uni-layout">
                <div class="uni-panel">
                    <h3>🔬 Assay Group</h3>
                    <p class="uni-sub">${this.cfg.model}</p>
                    <div class="uni-drug-list">
                        <button class="uni-drug-btn active" id="sp-ctrl-btn">
                            <span class="uni-dot" style="background:#64748b"></span>
                            <div><strong>Control Group (Vehicle)</strong><small>Baseline / Untreated</small></div>
                        </button>
                        <button class="uni-drug-btn" id="sp-test-btn">
                            <span class="uni-dot" style="background:#0d9488"></span>
                            <div><strong>${this.cfg.testDrug}</strong><small>Active Treatment</small></div>
                        </button>
                    </div>
                    <button class="btn btn-outline btn-block" id="sp-viva-btn" style="margin-top:8px;">🎓 Viva Voce Quiz</button>
                    <div class="score-panel" style="margin-top:14px;">
                        <div class="score-item"><span class="score-label">Game XP</span><span class="score-value" id="sp-xp">0 XP</span></div>
                    </div>
                </div>

                <div class="uni-stage">
                    <div class="game-stage-wrap" id="sp-stage">
                        <img class="game-stage-bg" src="assets/special-pharma-bench.jpg" alt="Pharmacology Screening Apparatus">
                        <canvas id="sp-overlay" width="680" height="430" class="game-stage-overlay"></canvas>
                        <div id="sp-target" class="drop-target-ring" style="left:275px;top:110px;width:140px;height:140px;"></div>
                        <div class="game-bench-dock" id="sp-dock"></div>
                    </div>
                    <div class="uni-readout" id="sp-readout">🎮 <strong>Select a reagent vial on the dock</strong>, then <strong>drag the ${this.cfg.toolName} onto the ${this.cfg.targetName}</strong>!</div>
                </div>

                <div class="uni-panel">
                    <h3>📋 Assay Summary</h3>
                    <div class="drug-info-panel">
                        <div class="drug-info-name">${this.cfg.title}</div>
                        <div class="drug-info-class">${this.cfg.model}</div>
                        <div class="drug-info-summary">${this.cfg.mechanism}</div>
                        <div class="info-row"><span class="info-label">Control:</span><span class="info-value" id="sp-ctrl-val">Pending drag...</span></div>
                        <div class="info-row"><span class="info-label">Test Drug:</span><span class="info-value" id="sp-res-val">Pending drag...</span></div>
                    </div>
                </div>
            </div>
        `;

        this.stage = document.getElementById('sp-stage');
        this.target = document.getElementById('sp-target');
        this.canvas = document.getElementById('sp-overlay');
        this.ctx = this.canvas.getContext('2d');

        this._buildDock();
        this._drawOverlay();

        document.getElementById('sp-ctrl-btn').onclick = () => this.switchGroup('control');
        document.getElementById('sp-test-btn').onclick = () => this.switchGroup('test');
        document.getElementById('sp-viva-btn').onclick = () => openGenericViva(this.cfg.title, [
            { q: `What is the primary pharmacological mechanism demonstrated in "${this.cfg.title}"?`, opts: [this.cfg.mechanism, "Non-specific osmotic dehydration", "Direct hepatic enzyme induction", "Irreversible DNA alkylation"], ans: 0, exp: this.cfg.mechanism }
        ]);
    }

    _buildDock() {
        const dock = document.getElementById('sp-dock');
        dock.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
                <div class="draggable-piece" data-group="control">
                    <div style="transform:scale(0.8);height:58px;display:flex;align-items:center;">${PHARM_SVG.bottle('Control', 'Saline', '#64748b')}</div>
                </div>
                <div class="draggable-piece" data-group="test">
                    <div style="transform:scale(0.8);height:58px;display:flex;align-items:center;">${PHARM_SVG.bottle('Test', 'Active', '#0d9488')}</div>
                </div>
            </div>
            <div style="width:1px;height:64px;background:#cbd5e1;"></div>
            <div class="draggable-piece" id="sp-drag-tool">
                <div id="sp-tool-svg">${PHARM_SVG.syringe('#64748b', true)}</div>
                <span class="draggable-label">Drag → ${this.cfg.targetName}</span>
            </div>
        `;

        dock.querySelectorAll('[data-group]').forEach(v => {
            v.onclick = () => {
                this.switchGroup(v.dataset.group);
                const r = v.getBoundingClientRect();
                DragGame.spawnFloatingXP(this.stage, r.left + 20, r.top, `Loaded ${v.dataset.group.toUpperCase()}`);
            };
        });

        const toolEl = document.getElementById('sp-drag-tool');
        this.cleanupDrag = DragGame.makeDraggable(toolEl, {
            onStart: () => this.target.classList.add('active'),
            onDrop: (cx, cy) => {
                this.target.classList.remove('active');
                if (DragGame.isOverElement(cx, cy, this.target, 32)) {
                    this.triggerAssayAction(cx, cy);
                }
            }
        });
    }

    switchGroup(g) {
        this.mode = g;
        document.getElementById('sp-ctrl-btn').classList.toggle('active', g === 'control');
        document.getElementById('sp-test-btn').classList.toggle('active', g === 'test');
        const svgEl = document.getElementById('sp-tool-svg');
        if (svgEl) svgEl.innerHTML = PHARM_SVG.syringe(g === 'control' ? '#64748b' : '#0d9488', true);
        this._drawOverlay();
    }

    triggerAssayAction(cx, cy) {
        if (this.mode === 'control') {
            this.testedControl = true;
            document.getElementById('sp-ctrl-val').textContent = this.cfg.control;
            DragGame.spawnFloatingXP(this.stage, cx, cy, `Baseline: ${this.cfg.control}`);
            document.getElementById('sp-readout').innerHTML = `✅ <strong>Control Vehicle:</strong> ${this.cfg.control}. Select <strong>${this.cfg.testDrug}</strong> to evaluate active treatment.`;
        } else {
            this.testedTest = true;
            document.getElementById('sp-res-val').textContent = this.cfg.testVal;
            DragGame.spawnFloatingXP(this.stage, cx, cy, `Recorded: ${this.cfg.testVal}`);
            document.getElementById('sp-readout').innerHTML = `✅ <strong>Treatment Group (${this.cfg.testDrug}):</strong> ${this.cfg.testVal} — ${this.cfg.mechanism}`;
        }
        this._drawOverlay();
    }

    _drawOverlay() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 680, 430);

        // Digital Instrument HUD Card (top right)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath(); ctx.roundRect(14, 14, 290, 62, 10); ctx.fill();
        ctx.fillStyle = '#94a3b8'; ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText(this.cfg.metric.toUpperCase(), 28, 34);
        ctx.fillStyle = '#2dd4bf'; ctx.font = 'bold 17px JetBrains Mono, monospace';
        const val = this.mode === 'control'
            ? (this.testedControl ? `CTRL: ${this.cfg.control}` : 'CTRL: Awaiting Drop')
            : (this.testedTest ? `TEST: ${this.cfg.testVal}` : 'TEST: Awaiting Drop');
        ctx.fillText(val, 28, 60);
    }

    destroy() {
        if (this.cleanupDrag) this.cleanupDrag();
    }
}
