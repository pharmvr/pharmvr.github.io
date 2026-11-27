/**
 * ENG-D: Studio-Grade Bioassay, Dose-Response Curve (DRC) & PK Engine
 * Uses sunlit lab backdrop (assets/lab-backdrop.jpg) + crisp SVG Pipette/Syringe & Graded Bottles
 * + live translucent dark-glass analytical chart panel!
 * Covers Experiments: 13, 14, 15, 16, 17, 31
 */

class BioassayEngine {
    constructor(expNum, container) {
        this.expNum = expNum;
        this.container = container;
        this.isPK = expNum === 31;
        this.xp = 0;

        this.antagonistConc = 0;
        this.plottedPoints = [];
        this.pkSamples = [];
        this.pkDose = 500;
        this.pkHalfLife = 4.0;
        this.pkVd = 25;

        this.doses = this.isPK
            ? [0, 1, 2, 4, 8, 12, 24].map(t => ({ id: String(t), label: `${t}h`, sub: 'blood', val: t, color: '#e11d48' }))
            : [-8, -7, -6.5, -6, -5.5, -5, -4].map(ld => ({ id: String(ld), label: `10^${ld}`, sub: 'mol/L', val: ld, color: '#0d9488' }));

        this.selectedDose = this.doses[2];
        this.render();
    }

    render() {
        const titles = {
            13: "Cumulative CRC of Acetylcholine on Frog Rectus",
            14: "CRC of Histamine & Mepyramine Antagonism",
            15: "pA₂ Determination (Schild Plot)",
            16: "3-Point Bioassay of Histamine",
            17: "4-Point (2+2) Bioassay of Acetylcholine",
            31: "Calculation of Pharmacokinetic Parameters"
        };

        this.container.innerHTML = `
            <div class="uni-layout">
                <div class="uni-panel">
                    <h3>📐 ${this.isPK ? 'PK Parameters' : 'Bioassay & DRC Controls'}</h3>
                    <p class="uni-sub">${titles[this.expNum]}</p>
                    ${this.isPK ? `
                        <div class="uni-slider-box">
                            <label>IV Bolus Dose: <strong id="pk-dose-lbl">500 mg</strong></label>
                            <input type="range" id="pk-dose" min="100" max="1000" step="50" value="500">
                        </div>
                        <div class="uni-slider-box">
                            <label>Half-life (t½): <strong id="pk-thalf-lbl">4.0 hr</strong></label>
                            <input type="range" id="pk-thalf" min="1" max="12" step="0.5" value="4">
                        </div>
                        <div class="uni-slider-box">
                            <label>Volume of Dist. (Vd): <strong id="pk-vd-lbl">25 L</strong></label>
                            <input type="range" id="pk-vd" min="10" max="80" step="5" value="25">
                        </div>
                    ` : `
                        <div class="uni-slider-box">
                            <label>Antagonist [B]: <strong id="drc-ant-lbl">0 nM (Control)</strong></label>
                            <input type="range" id="drc-ant" min="0" max="3" step="1" value="0">
                        </div>
                    `}
                    <button class="btn btn-action" id="bio-clear-btn">🧹 Clear Plotted Points</button>
                    <button class="btn btn-outline btn-block" id="bio-viva-btn" style="margin-top:8px;">🎓 Viva Voce Quiz</button>
                    <div class="score-panel" style="margin-top:14px;">
                        <div class="score-item"><span class="score-label">Game XP</span><span class="score-value" id="bio-xp">0 XP</span></div>
                    </div>
                </div>

                <div class="uni-stage">
                    <div class="game-stage-wrap" id="bio-stage">
                        <img class="game-stage-bg" src="assets/lab-backdrop.jpg" alt="Pharmacology Analytical Lab">
                        <canvas id="bio-overlay" width="680" height="430" class="game-stage-overlay"></canvas>
                        <div id="bio-drop-target" class="drop-target-ring" style="left:60px;top:95px;width:120px;height:120px;border-radius:16px;"></div>
                        <div class="game-bench-dock" id="bio-dock"></div>
                    </div>
                    <div class="uni-readout" id="bio-readout">
                        🎮 ${this.isPK
                            ? '<strong>Click a timed sample bottle (0h–24h)</strong> on the dock, then <strong>drag the Syringe onto the HPLC Analyzer</strong> to plot the plasma curve!'
                            : '<strong>Click a concentration bottle (10⁻⁸–10⁻⁴ M)</strong> on the dock, then <strong>drag the Micropipette onto the Analyzer Zone</strong> to plot your CRC!'}
                    </div>
                </div>

                <div class="uni-panel">
                    <h3>🧮 Live Readouts</h3>
                    <div id="bio-metrics" class="drug-info-panel"></div>
                </div>
            </div>
        `;

        this.stage = document.getElementById('bio-stage');
        this.target = document.getElementById('bio-drop-target');
        this.canvas = document.getElementById('bio-overlay');
        this.ctx = this.canvas.getContext('2d');

        this._buildDock();

        if (this.isPK) {
            document.getElementById('pk-dose').oninput = (e) => { this.pkDose = +e.target.value; document.getElementById('pk-dose-lbl').textContent = this.pkDose + ' mg'; this.update(); };
            document.getElementById('pk-thalf').oninput = (e) => { this.pkHalfLife = +e.target.value; document.getElementById('pk-thalf-lbl').textContent = this.pkHalfLife.toFixed(1) + ' hr'; this.update(); };
            document.getElementById('pk-vd').oninput = (e) => { this.pkVd = +e.target.value; document.getElementById('pk-vd-lbl').textContent = this.pkVd + ' L'; this.update(); };
        } else {
            const antConcs = [0, 10, 30, 100];
            document.getElementById('drc-ant').oninput = (e) => {
                this.antagonistConc = antConcs[+e.target.value];
                document.getElementById('drc-ant-lbl').textContent = this.antagonistConc === 0 ? '0 nM (Control)' : `${this.antagonistConc} nM`;
                this.update();
            };
        }

        document.getElementById('bio-clear-btn').onclick = () => {
            this.plottedPoints = [];
            this.pkSamples = [];
            this.update();
        };

        document.getElementById('bio-viva-btn').onclick = () => openGenericViva(titles[this.expNum], [
            { q: "In a competitive antagonism Schild plot, a rightward parallel shift without depression of Emax indicates:", opts: ["Irreversible antagonism", "Surmountable competitive antagonism", "Non-competitive antagonism", "Physiological antagonism"], ans: 1, exp: "Competitive antagonists compete reversibly for the same orthosteric site, shifting EC₅₀ right without reducing Emax." },
            { q: "What does pA₂ represent pharmacologically?", opts: ["Negative log of antagonist concentration requiring 2× agonist dose for equal effect", "Half-life of the drug", "Lethal dose in 50% animals", "Plasma protein binding"], ans: 0, exp: "pA₂ = −log[B] when dose ratio (DR) = 2; higher pA₂ means a more potent antagonist." }
        ]);

        this.update();
    }

    _buildDock() {
        const dock = document.getElementById('bio-dock');
        dock.innerHTML = `
            <div style="display:flex;align-items:center;gap:4px;">
                ${this.doses.map(d => `
                    <div class="draggable-piece" data-dose="${d.id}" title="Select ${d.label}">
                        <div style="transform:scale(0.76);height:58px;display:flex;align-items:center;">${PHARM_SVG.bottle(d.label, d.sub, d.color)}</div>
                    </div>
                `).join('')}
            </div>
            <div style="width:1px;height:64px;background:#cbd5e1;"></div>
            <div class="draggable-piece" id="bio-drag-tool">
                <div id="bio-tool-svg" style="transform:scale(0.68);height:54px;display:flex;align-items:center;">
                    ${this.isPK ? PHARM_SVG.syringe('#e11d48', true) : PHARM_SVG.dropper('#0d9488', true)}
                </div>
                <span class="draggable-label">${this.isPK ? 'Drag → HPLC' : 'Drag → Bath'}</span>
            </div>
        `;

        dock.querySelectorAll('[data-dose]').forEach(v => {
            v.onclick = () => {
                this.selectedDose = this.doses.find(x => x.id === v.dataset.dose);
                const r = v.getBoundingClientRect();
                DragGame.spawnFloatingXP(this.stage, r.left + 20, r.top, `Loaded ${this.selectedDose.label}`);
            };
        });

        const toolEl = document.getElementById('bio-drag-tool');
        this.cleanupDrag = DragGame.makeDraggable(toolEl, {
            onStart: () => this.target.classList.add('active'),
            onDrop: (cx, cy) => {
                this.target.classList.remove('active');
                if (DragGame.isOverElement(cx, cy, this.target, 30)) {
                    this.recordDose(cx, cy);
                }
            }
        });
    }

    recordDose(cx, cy) {
        const item = this.selectedDose;
        if (this.isPK) {
            const ke = 0.693 / this.pkHalfLife;
            const c0 = this.pkDose / this.pkVd;
            const conc = c0 * Math.exp(-ke * item.val);
            this.pkSamples = this.pkSamples.filter(s => s.t !== item.val);
            this.pkSamples.push({ t: item.val, conc });
            DragGame.spawnFloatingXP(this.stage, cx, cy, `Sample ${item.label}: ${conc.toFixed(1)} mg/L`);
        } else {
            const Kb = 10;
            const dr = 1 + this.antagonistConc / Kb;
            const pEC50 = 6.0 - Math.log10(dr);
            const resp = 100 / (1 + Math.pow(10, -pEC50 - item.val));
            this.plottedPoints.push({ ld: item.val, resp, ant: this.antagonistConc });
            DragGame.spawnFloatingXP(this.stage, cx, cy, `Response: ${resp.toFixed(1)}% Emax`);
        }
        this.update();
    }

    update() {
        this._drawOverlay();
        const metricsEl = document.getElementById('bio-metrics');
        if (!metricsEl) return;

        if (this.isPK) {
            const ke = 0.693 / this.pkHalfLife;
            const c0 = this.pkDose / this.pkVd;
            const cl = ke * this.pkVd;
            const auc = this.pkDose / cl;
            metricsEl.innerHTML = `
                <div class="info-row"><span class="info-label">Samples Analyzed:</span><span class="info-value">${this.pkSamples.length} / 7</span></div>
                <div class="info-row"><span class="info-label">C₀ (Initial Conc.):</span><span class="info-value">${c0.toFixed(2)} mg/L</span></div>
                <div class="info-row"><span class="info-label">Elimination kₑ:</span><span class="info-value">${ke.toFixed(3)} hr⁻¹</span></div>
                <div class="info-row"><span class="info-label">Clearance (CL):</span><span class="info-value">${cl.toFixed(2)} L/hr</span></div>
                <div class="info-row"><span class="info-label">AUC₀₋∞:</span><span class="info-value">${auc.toFixed(1)} mg·hr/L</span></div>
            `;
        } else {
            const Kb = 10;
            const dr = 1 + this.antagonistConc / Kb;
            const pEC50 = 6.0 - Math.log10(dr);
            metricsEl.innerHTML = `
                <div class="info-row"><span class="info-label">Points Plotted:</span><span class="info-value">${this.plottedPoints.length}</span></div>
                <div class="info-row"><span class="info-label">Dose Ratio (DR):</span><span class="info-value">${dr.toFixed(2)}×</span></div>
                <div class="info-row"><span class="info-label">Apparent pEC₅₀:</span><span class="info-value">${pEC50.toFixed(2)}</span></div>
                <div class="info-row"><span class="info-label">Estimated pA₂:</span><span class="info-value">8.00</span></div>
            `;
        }
    }

    _drawOverlay() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 680, 430);

        // Left Drop Chamber Card
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.beginPath(); ctx.roundRect(42, 82, 156, 146, 14); ctx.fill();
        ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#5eead4'; ctx.font = 'bold 12px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(this.isPK ? 'HPLC ANALYZER' : 'ORGAN BATH', 120, 142);
        ctx.fillStyle = '#cbd5e1'; ctx.font = '11px Inter, sans-serif';
        ctx.fillText(`Selected: ${this.selectedDose.label}`, 120, 166);

        // Right Translucent Dark-Glass Analytical Plot Card
        const gx = 244, gy = 38, gw = 384, gh = 220;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.beginPath(); ctx.roundRect(216, 18, 444, 272, 14); ctx.fill();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();

        if (this.isPK) {
            const ke = 0.693 / this.pkHalfLife;
            const c0 = this.pkDose / this.pkVd;
            ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (let t = 0; t <= 24; t += 0.5) {
                const px = gx + (t / 24) * gw;
                const py = gy + gh - Math.exp(-ke * t) * (gh - 20);
                if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke(); ctx.setLineDash([]);
            this.pkSamples.forEach(s => {
                const px = gx + (s.t / 24) * gw;
                const py = gy + gh - (s.conc / c0) * (gh - 20);
                ctx.fillStyle = '#fb7185';
                ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
            });
            ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText('Plasma Concentration (mg/L) vs Time (0–24 hr)', gx + gw / 2, 34);
        } else {
            const Kb = 10;
            const dr = 1 + this.antagonistConc / Kb;
            const pEC50 = 6.0 - Math.log10(dr);
            ctx.strokeStyle = 'rgba(45, 212, 191, 0.38)'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
            ctx.beginPath();
            for (let ld = -9; ld <= -3; ld += 0.15) {
                const r = 100 / (1 + Math.pow(10, -pEC50 - ld));
                const px = gx + ((ld + 9) / 6) * gw;
                const py = gy + gh - (r / 100) * (gh - 20);
                if (ld === -9) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke(); ctx.setLineDash([]);
            this.plottedPoints.forEach(pt => {
                const px = gx + ((pt.ld + 9) / 6) * gw;
                const py = gy + gh - (pt.resp / 100) * (gh - 20);
                ctx.fillStyle = pt.ant > 0 ? '#fbbf24' : '#2dd4bf';
                ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
            });
            ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText('Log₁₀ Concentration–Response Curve (% Emax)', gx + gw / 2, 34);
        }
        ctx.textAlign = 'left';
    }

    destroy() {
        if (this.cleanupDrag) this.cleanupDrag();
    }
}
