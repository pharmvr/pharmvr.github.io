/**
 * ENG-E: Studio-Grade Cardiovascular & Perfusion Engine
 * Uses studio 2D illustration (assets/cardio-frog-heart.jpg) + crisp SVG Draggable Syringe & Vials
 * + live Canvas telemetry trace overlaid on the physiological amplifier/monitor!
 * Covers Experiments: 12, 18, 19, 20
 */

const CARDIO_CONFIGS = {
    12: {
        title: "Effect of Drugs on Frog Heart (Straub's Preparation)",
        prep: "Isolated Frog Heart (Frog Ringer)",
        baseHR: 62, baseForce: 100,
        drugs: [
            { id: "normal", short: "Ringer", name: "Normal Ringer (Baseline)", hr: 62, force: 100, color: "#64748b", note: "Normal sinus rhythm & contractility." },
            { id: "adr", short: "Adr", name: "Adrenaline (5 µg)", hr: 96, force: 165, color: "#16a34a", note: "Positive chronotropy (↑HR) & positive inotropy (↑Force) via β₁." },
            { id: "ach", short: "ACh", name: "Acetylcholine (5 µg)", hr: 24, force: 40, color: "#dc2626", note: "Negative chronotropy & inotropy via M₂." },
            { id: "atr", short: "Atr", name: "Atropine (10 µg)", hr: 68, force: 105, color: "#6366f1", note: "Blocks M₂ receptors, abolishing ACh-induced bradycardia." }
        ]
    },
    18: {
        title: "Effect of Drugs on Arterial Blood Pressure (Dog/Cat)",
        prep: "Anaesthetized Dog/Cat Carotid BP Polygraph",
        baseHR: 110, baseForce: 120,
        drugs: [
            { id: "normal", short: "Saline", name: "Normal Saline (Baseline)", hr: 110, force: 120, color: "#64748b", note: "Baseline MAP ~100 mmHg (120/80)." },
            { id: "adr", short: "Adr", name: "Adrenaline (2 µg/kg i.v.)", hr: 135, force: 185, color: "#dc2626", note: "Biphasic pressor response (α₁ vasoconstriction + β₂ dip)." },
            { id: "phentolamine_adr", short: "Phen+Adr", name: "Adrenaline after Phentolamine (Dale's Reversal)", hr: 145, force: 78, color: "#d97706", note: "Vasomotor Reversal of Dale: α₁ blocked → β₂ vasodilation (BP falls!)." },
            { id: "ach", short: "ACh", name: "Acetylcholine (1 µg/kg)", hr: 85, force: 72, color: "#0d9488", note: "Sharp depressor fall in BP via endothelial NO (M₃)." }
        ]
    },
    19: {
        title: "Dale's Vasoperfusion (Isolated Rabbit Ear)",
        prep: "Perfused Rabbit Ear (Drops/min outflow)",
        baseHR: 48, baseForce: 100,
        drugs: [
            { id: "normal", short: "Ringer", name: "Normal Ringer (Control)", hr: 48, force: 100, color: "#64748b", note: "Steady venous outflow (~48 drops/min)." },
            { id: "na", short: "NA", name: "Noradrenaline (5 µg)", hr: 14, force: 35, color: "#dc2626", note: "Potent α₁ vasoconstriction markedly reduces drop rate." },
            { id: "hist", short: "Hist", name: "Histamine / Nitrite", hr: 76, force: 140, color: "#16a34a", note: "Vasodilation increases venous outflow drop rate." }
        ]
    },
    20: {
        title: "Effect of Drugs on Perfused Frog Heart",
        prep: "Syme's / Langendorff Frog Heart Perfusion",
        baseHR: 60, baseForce: 100,
        drugs: [
            { id: "normal", short: "Ringer", name: "Frog Ringer (Baseline)", hr: 60, force: 100, color: "#64748b", note: "Normal rhythmic atrial-ventricular contraction." },
            { id: "cacl2", short: "Ca²⁺", name: "High Ca²⁺ Ringer", hr: 70, force: 170, color: "#16a34a", note: "Markedly increases contractile force (systolic tendency)." },
            { id: "kcl", short: "K⁺", name: "High K⁺ Ringer", hr: 20, force: 35, color: "#dc2626", note: "Depolarizes resting membrane → diastolic arrest." }
        ]
    }
};

class CardioEngine {
    constructor(expNum, container) {
        this.expNum = expNum;
        this.cfg = CARDIO_CONFIGS[expNum];
        this.container = container;
        this.selectedDrug = this.cfg.drugs[0];
        this.curHR = this.cfg.baseHR;
        this.curForce = this.cfg.baseForce;
        this.targetHR = this.cfg.baseHR;
        this.targetForce = this.cfg.baseForce;
        this.trace = new Array(160).fill(0);
        this.records = [];
        this.phase = 0;
        this.xp = 0;
        this.animId = null;
        this.render();
    }

    render() {
        const isBP = this.expNum === 18;
        const isEar = this.expNum === 19;
        const unitLabel = isBP ? 'SBP (mmHg)' : (isEar ? 'Drops/min' : 'HR (BPM)');

        this.container.innerHTML = `
            <div class="uni-layout">
                <div class="uni-panel">
                    <h3>❤️ Cardiovascular Drugs</h3>
                    <p class="uni-sub">${this.cfg.prep}</p>
                    <div class="uni-drug-list">
                        ${this.cfg.drugs.map(d => `
                            <button class="uni-drug-btn ${d.id === this.selectedDrug.id ? 'active' : ''}" data-drug="${d.id}">
                                <span class="uni-dot" style="background:${d.color}"></span>
                                <div><strong>${d.name}</strong><small>${d.note}</small></div>
                            </button>
                        `).join('')}
                    </div>
                    <button class="btn btn-outline btn-block" id="cardio-viva-btn" style="margin-top:12px;">🎓 Viva Voce Quiz</button>
                    <div class="score-panel" style="margin-top:14px;">
                        <div class="score-item"><span class="score-label">Game XP</span><span class="score-value" id="cardio-xp">0 XP</span></div>
                    </div>
                </div>

                <div class="uni-stage">
                    <div class="game-stage-wrap" id="cardio-stage">
                        <img class="game-stage-bg" src="assets/cardio-frog-heart.jpg" alt="Perfused Frog Heart Preparation">
                        <canvas id="cardio-overlay" width="680" height="430" class="game-stage-overlay"></canvas>
                        <div id="cardio-heart-target" class="drop-target-ring" style="left:286px;top:178px;width:90px;height:90px;"></div>
                        <div class="game-bench-dock" id="cardio-dock"></div>
                    </div>
                    <div class="uni-readout" id="cardio-readout">🎮 <strong>Select a vial on the dock</strong>, then <strong>drag the Syringe onto the Heart / Cannula</strong> to observe live hemodynamic waveforms!</div>
                </div>

                <div class="uni-panel">
                    <h3>📋 Polygraph Log</h3>
                    <table class="obs-table">
                        <thead><tr><th>Drug</th><th>${unitLabel}</th><th>Response</th></tr></thead>
                        <tbody id="cardio-tbody">
                            <tr><td colspan="3" class="obs-cell-pending" style="text-align:center;padding:16px;">Inject a drug to record trace...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.stage = document.getElementById('cardio-stage');
        this.target = document.getElementById('cardio-heart-target');
        this.canvas = document.getElementById('cardio-overlay');
        this.ctx = this.canvas.getContext('2d');

        this._buildDock(isBP, isEar);

        this.container.querySelectorAll('.uni-drug-btn').forEach(b => {
            b.onclick = () => {
                this.selectedDrug = this.cfg.drugs.find(x => x.id === b.dataset.drug);
                this.container.querySelectorAll('.uni-drug-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                this._refreshSyringeSVG();
            };
        });
        document.getElementById('cardio-viva-btn').onclick = () => openGenericViva(this.cfg.title, [
            { q: "What is Dale's Vasomotor Reversal?", opts: ["ACh causing hypertension", "Adrenaline causing a fall in BP after α-adrenergic blockade (unmasking β₂ vasodilation)", "Atropine slowing the heart", "Histamine constricting bronchioles"], ans: 1, exp: "When α₁ vasoconstriction is blocked (e.g., Phentolamine), Adrenaline's β₂ vasodilator effect dominates, reversing its pressor response into a depressor one." }
        ]);

        const loop = () => {
            this.curHR += (this.targetHR - this.curHR) * 0.05;
            this.curForce += (this.targetForce - this.curForce) * 0.05;
            this.phase += (this.curHR / 60) * 0.14;
            const wave = Math.pow(Math.max(0, Math.sin(this.phase)), 2) * (this.curForce / 100) * 52;
            this.trace.push(wave);
            if (this.trace.length > 160) this.trace.shift();
            this._drawOverlay();
            this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
    }

    _buildDock(isBP, isEar) {
        const dock = document.getElementById('cardio-dock');
        dock.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                ${this.cfg.drugs.map(d => `
                    <div class="draggable-piece" data-vial="${d.id}" title="Load ${d.name}">
                        <div style="transform:scale(0.8);height:58px;display:flex;align-items:center;">${PHARM_SVG.bottle(d.short, 'i.v.', d.color)}</div>
                    </div>
                `).join('')}
            </div>
            <div style="width:1px;height:64px;background:#cbd5e1;"></div>
            <div class="draggable-piece" id="cardio-drag-syringe">
                <div id="cardio-syringe-svg">${PHARM_SVG.syringe(this.selectedDrug.color, true)}</div>
                <span class="draggable-label">Drag Syringe → Cannula</span>
            </div>
        `;

        dock.querySelectorAll('[data-vial]').forEach(v => {
            v.onclick = () => {
                this.selectedDrug = this.cfg.drugs.find(x => x.id === v.dataset.vial);
                this.container.querySelectorAll('.uni-drug-btn').forEach(x => x.classList.toggle('active', x.dataset.drug === this.selectedDrug.id));
                this._refreshSyringeSVG();
                const r = v.getBoundingClientRect();
                DragGame.spawnFloatingXP(this.stage, r.left + 20, r.top, `Loaded ${this.selectedDrug.short}`);
            };
        });

        const syrEl = document.getElementById('cardio-drag-syringe');
        this.cleanupDrag = DragGame.makeDraggable(syrEl, {
            onStart: () => this.target.classList.add('active'),
            onDrop: (cx, cy) => {
                this.target.classList.remove('active');
                if (DragGame.isOverElement(cx, cy, this.target, 32)) {
                    const d = this.selectedDrug;
                    this.targetHR = d.hr;
                    this.targetForce = d.force;
                    const val = isBP ? `${d.force} mmHg` : (isEar ? `${d.hr} drops/min` : `${d.hr} BPM`);
                    this.records.push({ name: d.name, val, note: d.note });
                    DragGame.spawnFloatingXP(this.stage, cx, cy, `${d.short} Infused`);
                    document.getElementById('cardio-readout').innerHTML = `✅ <strong>Hemodynamic Response (${d.name}):</strong> ${d.note}`;
                    document.getElementById('cardio-tbody').innerHTML = this.records.map(r => `
                        <tr><td><strong>${r.name.split('(')[0]}</strong></td><td><strong>${r.val}</strong></td><td>${r.note}</td></tr>
                    `).join('');
                }
            }
        });
    }

    _refreshSyringeSVG() {
        const el = document.getElementById('cardio-syringe-svg');
        if (el) el.innerHTML = PHARM_SVG.dropper ? PHARM_SVG.syringe(this.selectedDrug.color, true) : '';
    }

    _drawOverlay() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 680, 430);

        // Live Heart Beat Pulse Ring over the Heart
        const pulse = Math.pow(Math.max(0, Math.sin(this.phase)), 3);
        ctx.save();
        ctx.strokeStyle = `rgba(225, 29, 72, ${0.25 + pulse * 0.55})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(332, 224, 34 + pulse * 10, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        // Live Digital Polygraph HUD card (top right)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath(); ctx.roundRect(450, 14, 216, 112, 10); ctx.fill();
        ctx.fillStyle = '#5eead4'; ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.fillText(`RATE: ${Math.round(this.curHR)} | AMP: ${Math.round(this.curForce)}%`, 464, 34);

        ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2.2;
        ctx.beginPath();
        this.trace.forEach((v, i) => {
            const x = 462 + (i / 159) * 192;
            const y = 108 - v * 0.85;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    destroy() {
        if (this.animId) cancelAnimationFrame(this.animId);
        if (this.cleanupDrag) this.cleanupDrag();
    }
}
