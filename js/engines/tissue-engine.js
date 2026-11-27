/**
 * ENG-C: Studio-Grade Isolated Tissue & Kymograph Engine
 * Uses studio 2D illustration (assets/organ-bath-kymograph.jpg) + crisp SVG Micropipette & Vials
 * + live Canvas white trace overlaid directly on the smoked black Kymograph drum!
 * Covers Experiments: 10 (Rabbit Intestine), 11 (Frog Rectus), 22 (Rat Uterus)
 */

const TISSUE_CONFIGS = {
    10: {
        title: "Effect of Drugs on Rabbit Intestine",
        tissue: "Rabbit Ileum (Tyrode Solution, 37°C, O₂)",
        spontaneous: true,
        drugs: [
            { id: "ach", short: "ACh", name: "Acetylcholine (10 µg)", effect: +38, tone: "Strong Spasmogenic Contraction (M₃)", color: "#0d9488" },
            { id: "atropine", short: "Atr", name: "Atropine (10 µg)", effect: -22, tone: "Relaxes & blocks subsequent ACh (M₃ block)", color: "#dc2626" },
            { id: "adrenaline", short: "Adr", name: "Adrenaline (10 µg)", effect: -32, tone: "Marked Relaxation (α/β adrenergic)", color: "#d97706" },
            { id: "bacl2", short: "BaCl₂", name: "Barium Chloride (1 mg)", effect: +42, tone: "Direct smooth muscle spasm (not blocked by Atropine)", color: "#6366f1" }
        ],
        viva: [
            { q: "Why is Tyrode's solution aerated with oxygen at 37°C for rabbit ileum?", opts: ["To freeze the tissue", "To maintain physiological metabolism and spontaneous pendular movements", "To destroy acetylcholine", "To lower pH to 2.0"], ans: 1, exp: "Mammalian smooth muscle requires 37°C, glucose, and oxygen in Tyrode's PSS to sustain rhythmic pendular contractions." },
            { q: "How do you distinguish ACh-induced contraction from BaCl₂-induced contraction on rabbit ileum?", opts: ["Atropine blocks ACh but does NOT block BaCl₂", "Adrenaline blocks BaCl₂ only", "Both are blocked by Propranolol", "BaCl₂ causes relaxation"], ans: 0, exp: "ACh acts via M₃ receptors (blocked by Atropine), whereas BaCl₂ directly depolarizes smooth muscle." }
        ]
    },
    11: {
        title: "Effect of Drugs on Frog Rectus Abdominis",
        tissue: "Frog Rectus Abdominis (Frog Ringer, Room Temp)",
        spontaneous: false,
        drugs: [
            { id: "ach", short: "ACh", name: "Acetylcholine (20 µg)", effect: +45, tone: "Sustained Contracture (N_M nicotinic)", color: "#0d9488" },
            { id: "dtubo", short: "d-TC", name: "d-Tubocurarine (20 µg)", effect: -5, tone: "Competitive N_M blocker — abolishes ACh contracture", color: "#dc2626" },
            { id: "physostigmine", short: "Phy", name: "Physostigmine (10 µg)", effect: +62, tone: "Potentiates ACh response via AChE inhibition", color: "#16a34a" },
            { id: "kcl", short: "KCl", name: "KCl (20 mg)", effect: +40, tone: "Direct depolarization contracture", color: "#6366f1" }
        ],
        viva: [
            { q: "Which receptor subtype mediates ACh-induced contracture of Frog Rectus Abdominis?", opts: ["M₃ muscarinic", "N_M nicotinic skeletal muscle receptor", "β₂ adrenergic", "H₁ histamine"], ans: 1, exp: "Frog rectus abdominis is a skeletal muscle rich in N_M nicotinic receptors, blocked by d-tubocurarine." }
        ]
    },
    22: {
        title: "Effect of Drugs on Isolated Rat Uterus",
        tissue: "Oestrogenized Rat Uterus (De Jalon's Solution, 30°C)",
        spontaneous: true,
        drugs: [
            { id: "oxytocin", short: "Oxy", name: "Oxytocin (0.01 IU)", effect: +48, tone: "Powerful rhythmic oxytocic contraction", color: "#0d9488" },
            { id: "pgf2a", short: "PGF₂α", name: "PGF₂α (5 µg)", effect: +42, tone: "Uterotonic contraction", color: "#6366f1" },
            { id: "salbutamol", short: "Salb", name: "Salbutamol (10 µg)", effect: -28, tone: "Tocolytic relaxation via β₂ stimulation", color: "#16a34a" }
        ],
        viva: [
            { q: "Why is De Jalon's solution (low Ca²⁺, 30°C) used for Rat Uterus instead of Tyrode?", opts: ["To increase spontaneous activity", "To suppress excessive spontaneous contractions so drug responses are clear", "To kill bacteria", "To precipitate calcium"], ans: 1, exp: "Low Ca²⁺ and lower temperature reduce spontaneous uterine motility, yielding a clean baseline." }
        ]
    }
};

class TissueEngine {
    constructor(expNum, container) {
        this.expNum = expNum;
        this.cfg = TISSUE_CONFIGS[expNum];
        this.container = container;
        this.selectedDrug = this.cfg.drugs[0];
        this.trace = new Array(115).fill(0);
        this.targetAmp = 0;
        this.currentAmp = 0;
        this.records = [];
        this.t = 0;
        this.xp = 0;
        this.animId = null;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="uni-layout">
                <div class="uni-panel">
                    <h3>🧫 Organ Bath Preparation</h3>
                    <p class="uni-sub">${this.cfg.tissue}</p>
                    <div class="uni-drug-list">
                        ${this.cfg.drugs.map(d => `
                            <button class="uni-drug-btn ${d.id === this.selectedDrug.id ? 'active' : ''}" data-drug="${d.id}">
                                <span class="uni-dot" style="background:${d.color}"></span>
                                <div><strong>${d.name}</strong><small>${d.tone}</small></div>
                            </button>
                        `).join('')}
                    </div>
                    <button class="btn btn-action" id="tissue-wash-btn">🚿 Washout Bath (Fresh PSS)</button>
                    <button class="btn btn-outline btn-block" id="tissue-viva-btn" style="margin-top:8px;">🎓 Viva Voce Quiz</button>
                    <div class="score-panel" style="margin-top:14px;">
                        <div class="score-item"><span class="score-label">Game XP</span><span class="score-value" id="tissue-xp">0 XP</span></div>
                    </div>
                </div>

                <div class="uni-stage">
                    <div class="game-stage-wrap" id="tissue-stage">
                        <img class="game-stage-bg" src="assets/organ-bath-kymograph.jpg" alt="Organ Bath and Kymograph">
                        <canvas id="tissue-overlay" width="680" height="430" class="game-stage-overlay"></canvas>
                        <div id="tissue-bath-target" class="drop-target-ring" style="left:138px;top:76px;width:96px;height:96px;"></div>
                        <div class="game-bench-dock" id="tissue-dock"></div>
                    </div>
                    <div class="uni-readout" id="tissue-readout">🎮 <strong>Select a reagent vial on the dock</strong>, then <strong>drag the Micropipette into the Organ Bath</strong> to trace contractions on the Kymograph drum!</div>
                </div>

                <div class="uni-panel">
                    <h3>📈 Kymograph Log</h3>
                    <table class="obs-table">
                        <thead><tr><th>Drug Added</th><th>Amplitude</th><th>Response</th></tr></thead>
                        <tbody id="tissue-tbody">
                            <tr><td colspan="3" class="obs-cell-pending" style="text-align:center;padding:16px;">Pipette a drug into the organ bath...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.stage = document.getElementById('tissue-stage');
        this.target = document.getElementById('tissue-bath-target');
        this.canvas = document.getElementById('tissue-overlay');
        this.ctx = this.canvas.getContext('2d');
        this._buildDock();

        this.container.querySelectorAll('.uni-drug-btn').forEach(b => {
            b.onclick = () => {
                this.selectedDrug = this.cfg.drugs.find(x => x.id === b.dataset.drug);
                this.container.querySelectorAll('.uni-drug-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                this._refreshPipetteSVG();
            };
        });
        document.getElementById('tissue-wash-btn').onclick = () => this.washout();
        document.getElementById('tissue-viva-btn').onclick = () => openGenericViva(this.cfg.title, this.cfg.viva);

        const loop = () => {
            this.t += 0.08;
            this.currentAmp += (this.targetAmp - this.currentAmp) * 0.05;
            const spont = this.cfg.spontaneous ? Math.sin(this.t * 1.8) * 6 : 0;
            const y = Math.max(-45, Math.min(68, this.currentAmp + spont));
            this.trace.push(y);
            if (this.trace.length > 115) this.trace.shift();
            this._drawOverlay();
            this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
    }

    _buildDock() {
        const dock = document.getElementById('tissue-dock');
        dock.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;">
                ${this.cfg.drugs.map(d => `
                    <div class="draggable-piece" data-vial="${d.id}" title="Load ${d.name}">
                        <div style="transform:scale(0.8);height:58px;display:flex;align-items:center;">${PHARM_SVG.bottle(d.short, 'PSS', d.color)}</div>
                    </div>
                `).join('')}
            </div>
            <div style="width:1px;height:64px;background:#cbd5e1;"></div>
            <div class="draggable-piece" id="tissue-drag-pipette">
                <div id="tissue-pipette-svg" style="transform:scale(0.68);height:54px;display:flex;align-items:center;">${PHARM_SVG.dropper(this.selectedDrug.color, true)}</div>
                <span class="draggable-label">Drag Pipette → Bath</span>
            </div>
        `;

        dock.querySelectorAll('[data-vial]').forEach(v => {
            v.onclick = () => {
                this.selectedDrug = this.cfg.drugs.find(x => x.id === v.dataset.vial);
                this.container.querySelectorAll('.uni-drug-btn').forEach(x => x.classList.toggle('active', x.dataset.drug === this.selectedDrug.id));
                this._refreshPipetteSVG();
                const r = v.getBoundingClientRect();
                DragGame.spawnFloatingXP(this.stage, r.left + 20, r.top, `Loaded ${this.selectedDrug.short}`);
            };
        });

        const pipEl = document.getElementById('tissue-drag-pipette');
        this.cleanupDrag = DragGame.makeDraggable(pipEl, {
            onStart: () => this.target.classList.add('active'),
            onDrop: (cx, cy) => {
                this.target.classList.remove('active');
                if (DragGame.isOverElement(cx, cy, this.target, 30)) {
                    this.dispenseDrug(this.selectedDrug, cx, cy);
                }
            }
        });
    }

    _refreshPipetteSVG() {
        const el = document.getElementById('tissue-pipette-svg');
        if (el) el.innerHTML = PHARM_SVG.dropper(this.selectedDrug.color, true);
    }

    dispenseDrug(d, cx, cy) {
        this.targetAmp = d.effect;
        this.records.push({ name: d.name, amp: (d.effect > 0 ? '+' : '') + d.effect + ' mm', tone: d.tone });
        DragGame.spawnFloatingXP(this.stage, cx, cy, `${d.short} Added to Bath`);
        document.getElementById('tissue-readout').innerHTML = `✅ <strong>Bath concentration: ${d.name}:</strong> ${d.tone}`;
        document.getElementById('tissue-tbody').innerHTML = this.records.map(r => `
            <tr><td><strong>${r.name.split('(')[0]}</strong></td><td><strong>${r.amp}</strong></td><td>${r.tone}</td></tr>
        `).join('');
    }

    washout() {
        this.targetAmp = 0;
        document.getElementById('tissue-readout').textContent = '🚿 Organ bath flushed 3× with fresh PSS. Returning to baseline.';
    }

    _drawOverlay() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 680, 430);

        // Live scrolling white stylus trace overlaid directly on the smoked black Kymograph drum (right side)
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.beginPath(); ctx.roundRect(458, 92, 165, 118, 6); ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        this.trace.forEach((v, idx) => {
            const x = 466 + (idx / 114) * 148;
            const y = 160 - v * 0.72;
            if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.fillStyle = '#5eead4'; ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.fillText('LIVE KYMOGRAPH', 470, 108);
        ctx.restore();
    }

    destroy() {
        if (this.animId) cancelAnimationFrame(this.animId);
        if (this.cleanupDrag) this.cleanupDrag();
    }
}
