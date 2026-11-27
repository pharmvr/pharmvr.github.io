/**
 * ENG-B: Studio-Grade Interactive 2D CNS & Behavioural Engine
 * Uses studio 2D artwork (assets/cns-bench-scene.jpg) + crisp SVG Draggable Syringe & Vials
 * + live Canvas telemetry (IR beams, rotating rod speed, thermal glow, EEG seizure spikes, EPM path)
 * Covers Experiments: 1, 2, 3, 5, 6, 7, 9
 */

const CNS_CONFIGS = {
    1: {
        title: "Muscle Relaxant Activity (Rota-Rod)",
        apparatus: "Rota-Rod Apparatus (25 RPM)",
        animal: "Swiss Albino Mice",
        metricLabel: "Fall-off Latency (sec)",
        unit: "s",
        drugs: [
            { id: "control", short: "Saline", name: "Normal Saline (Control)", cls: "Vehicle", mean: 142, sd: 10, color: "#64748b", note: "Normal motor coordination; mouse balances steadily on rotating rod." },
            { id: "diazepam", short: "Diazepam", name: "Diazepam (4 mg/kg i.p.)", cls: "Benzodiazepine (GABA-A)", mean: 28, sd: 5, color: "#dc2626", note: "Marked muscle relaxation & ataxia → rapid fall-off from rod." },
            { id: "chlorpromazine", short: "CPZ", name: "Chlorpromazine (3 mg/kg)", cls: "Phenothiazine", mean: 46, sd: 7, color: "#d97706", note: "Central dopaminergic blockade reduces motor endurance." }
        ],
        viva: [
            { q: "Which receptor mediates the muscle relaxant action of Diazepam on the Rota-Rod?", opts: ["GABA-A chloride channel", "NMDA glutamate receptor", "Muscarinic M3", "Alpha-1 adrenergic"], ans: 0, exp: "Diazepam binds to the allosteric benzodiazepine site on GABA-A receptors, increasing Cl⁻ influx and causing central muscle relaxation." },
            { q: "What is the standard rotation speed used in the Rota-Rod test for mice?", opts: ["5 RPM", "20–25 RPM", "100 RPM", "250 RPM"], ans: 1, exp: "20–25 RPM provides optimal sensitivity to detect motor incoordination without exhausting untreated mice." }
        ]
    },
    2: {
        title: "CNS Depressants & Stimulants (Actophotometer)",
        apparatus: "Digital Actophotometer (6 IR Beams)",
        animal: "Swiss Albino Mice",
        metricLabel: "Photocell Beam Breaks / 5 min",
        unit: "counts",
        drugs: [
            { id: "control", short: "Saline", name: "Normal Saline (Control)", cls: "Vehicle", mean: 245, sd: 15, color: "#64748b", note: "Baseline spontaneous locomotor exploration." },
            { id: "caffeine", short: "Caffeine", name: "Caffeine (20 mg/kg i.p.)", cls: "CNS Stimulant (Adenosine antag.)", mean: 418, sd: 20, color: "#16a34a", note: "Blocks A₁/A₂A adenosine receptors → marked hyperlocomotion." },
            { id: "chlorpromazine", short: "CPZ", name: "Chlorpromazine (3 mg/kg)", cls: "CNS Depressant", mean: 72, sd: 10, color: "#dc2626", note: "Sedation and decreased spontaneous exploratory activity." }
        ],
        viva: [
            { q: "How does an Actophotometer quantify locomotor activity?", opts: ["By measuring body temperature", "By counting interruptions of infrared photocell beams", "By weighing food pellets", "By ECG telemetry"], ans: 1, exp: "Each time the mouse crosses an IR light beam, the photocell circuit triggers a digital count." }
        ]
    },
    3: {
        title: "Analgesic Activity (Tail Flick Analgesiometer)",
        apparatus: "Radiant Heat Tail Flick (Cut-off 15 s)",
        animal: "Wistar Rats / Mice",
        metricLabel: "Tail Flick Latency (sec)",
        unit: "s",
        drugs: [
            { id: "control", short: "Saline", name: "Normal Saline (Control)", cls: "Vehicle", mean: 3.4, sd: 0.4, color: "#64748b", note: "Rapid spinal nociceptive withdrawal reflex." },
            { id: "morphine", short: "Morphine", name: "Morphine (5 mg/kg s.c.)", cls: "Opioid Agonist (μ-receptor)", mean: 12.6, sd: 1.0, color: "#0d9488", note: "Strong inhibition of spinal dorsal horn pain transmission." },
            { id: "pentazocine", short: "Pentaz.", name: "Pentazocine (10 mg/kg)", cls: "Partial Opioid Agonist", mean: 8.9, sd: 0.8, color: "#6366f1", note: "Moderate elevation in spinal tail-flick latency." }
        ],
        viva: [
            { q: "The Tail Flick response primarily evaluates which level of pain integration?", opts: ["Spinal reflex arc", "Cortical perception only", "Peripheral neuromuscular junction", "Cerebellar coordination"], ans: 0, exp: "Tail flick is predominantly a spinal reflex, sensitive to centrally acting opioid analgesics." }
        ]
    },
    5: {
        title: "Analgesic Activity (Eddy's Hot Plate, 55°C)",
        apparatus: "Eddy's Hot Plate (55 ± 0.5°C)",
        animal: "Swiss Albino Mice",
        metricLabel: "Paw-Lick / Jump Latency (sec)",
        unit: "s",
        drugs: [
            { id: "control", short: "Saline", name: "Normal Saline (Control)", cls: "Vehicle", mean: 5.2, sd: 0.5, color: "#64748b", note: "Normal thermal nociceptive response (paw licking)." },
            { id: "morphine", short: "Morphine", name: "Morphine (5 mg/kg)", cls: "Opioid Analgesic", mean: 16.4, sd: 1.2, color: "#0d9488", note: "Supraspinal analgesia markedly prolongs paw-lick/jump latency." },
            { id: "aspirin", short: "Aspirin", name: "Aspirin (100 mg/kg)", cls: "NSAID (Peripheral)", mean: 6.1, sd: 0.6, color: "#d97706", note: "NSAIDs show minimal effect in thermal acute pain models." }
        ],
        viva: [
            { q: "What behavioural endpoints are timed on Eddy's Hot Plate?", opts: ["Sleeping and snoring", "Hind paw licking or jumping", "Tail curling", "Eye blinking"], ans: 1, exp: "Paw licking and jumping represent supraspinally integrated thermal pain responses." }
        ]
    },
    6: {
        title: "Anxiolytic Activity (Elevated Plus Maze)",
        apparatus: "Elevated Plus Maze (Open vs Closed Arms)",
        animal: "Mice / Rats",
        metricLabel: "Time in Open Arms (%)",
        unit: "%",
        drugs: [
            { id: "control", short: "Saline", name: "Normal Saline (Control)", cls: "Vehicle", mean: 18, sd: 3, color: "#64748b", note: "Rodents naturally avoid elevated open arms." },
            { id: "diazepam", short: "Diazepam", name: "Diazepam (2 mg/kg i.p.)", cls: "Anxiolytic (GABA-A)", mean: 58, sd: 6, color: "#16a34a", note: "Anxiolysis increases open-arm entries and time spent in open arms." },
            { id: "caffeine", short: "Caffeine", name: "Caffeine (Anxiogenic)", cls: "Stimulant", mean: 8, sd: 2, color: "#dc2626", note: "Anxiogenic profile; animal stays in closed arms." }
        ],
        viva: [
            { q: "In the Elevated Plus Maze, what does increased time in the open arms indicate?", opts: ["Sedation", "Anxiolytic activity", "Anxiogenic activity", "Analgesia"], ans: 1, exp: "Overcoming innate fear of open elevated spaces reflects reduced anxiety." }
        ]
    },
    7: {
        title: "Anticonvulsant Activity (Maximal Electroshock)",
        apparatus: "Electro-Convulsiometer (50 mA, 0.2 s)",
        animal: "Mice / Rats",
        metricLabel: "Tonic Hind-Limb Extension (sec)",
        unit: "s",
        drugs: [
            { id: "control", short: "Saline", name: "Normal Saline (Control)", cls: "Vehicle", mean: 13.5, sd: 1.0, color: "#dc2626", note: "Full tonic hind-limb extension (THLE) observed." },
            { id: "phenytoin", short: "Phenytoin", name: "Phenytoin (25 mg/kg i.p.)", cls: "Na⁺ Channel Blocker", mean: 0.0, sd: 0.0, color: "#16a34a", note: "100% abolition of tonic hind-limb extension (GTCS protection)." },
            { id: "carbamazepine", short: "CBZ", name: "Carbamazepine (20 mg/kg)", cls: "Na⁺ Channel Blocker", mean: 1.2, sd: 0.4, color: "#0d9488", note: "Markedly suppresses tonic extensor phase." }
        ],
        viva: [
            { q: "Abolition of Tonic Hind-Limb Extension in MES predicts efficacy against:", opts: ["Absence seizures", "Generalized Tonic-Clonic Seizures (GTCS)", "Migraine", "Parkinson's tremor"], ans: 1, exp: "MES is the classic screening model for drugs effective in GTCS (e.g., Phenytoin, Carbamazepine)." }
        ]
    },
    9: {
        title: "Anticonvulsant Activity (PTZ Chemoshock)",
        apparatus: "Pentylenetetrazol (80 mg/kg s.c.) Assay",
        animal: "Mice / Rats",
        metricLabel: "Clonic Convulsion Onset (sec)",
        unit: "s",
        drugs: [
            { id: "control", short: "Saline", name: "Normal Saline (Control)", cls: "Vehicle", mean: 145, sd: 15, color: "#dc2626", note: "Rapid myoclonic jerks progressing to clonic seizures." },
            { id: "diazepam", short: "Diazepam", name: "Diazepam (4 mg/kg)", cls: "GABA-A Modulator", mean: 900, sd: 0, color: "#16a34a", note: "Complete protection (>900 s) against PTZ-induced clonic convulsions." },
            { id: "ethosuximide", short: "Ethosux.", name: "Ethosuximide (150 mg/kg)", cls: "T-type Ca²⁺ Blocker", mean: 720, sd: 35, color: "#0d9488", note: "Significantly delays/prevents clonic seizures (absence model)." }
        ],
        viva: [
            { q: "PTZ-induced convulsion screening primarily identifies drugs effective in:", opts: ["Absence (Petit mal) seizures", "Status asthmaticus", "Myasthenia gravis", "Glaucoma"], ans: 0, exp: "PTZ antagonizes GABA-A receptors; drugs protecting against PTZ treat absence seizures." }
        ]
    }
};

class CNSEngine {
    constructor(expNum, container) {
        this.expNum = expNum;
        this.cfg = CNS_CONFIGS[expNum];
        this.container = container;
        this.selectedDrug = this.cfg.drugs[0];
        this.doseFactor = 1.0;
        this.records = [];
        this.xp = 0;
        this.running = false;
        this.trialStart = 0;
        this.simVal = null;
        this.animId = null;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="uni-layout">
                <div class="uni-panel">
                    <h3>🧪 Treatment & Dose</h3>
                    <p class="uni-sub">${this.cfg.apparatus} • ${this.cfg.animal}</p>
                    <div class="uni-drug-list">
                        ${this.cfg.drugs.map(d => `
                            <button class="uni-drug-btn ${d.id === this.selectedDrug.id ? 'active' : ''}" data-drug="${d.id}">
                                <span class="uni-dot" style="background:${d.color}"></span>
                                <div><strong>${d.name}</strong><small>${d.cls}</small></div>
                            </button>
                        `).join('')}
                    </div>
                    <div class="uni-slider-box">
                        <label>Dose Multiplier: <strong id="cns-dose-lbl">1.0×</strong></label>
                        <input type="range" id="cns-dose-slider" min="0.5" max="1.5" step="0.25" value="1.0">
                    </div>
                    <button class="btn btn-outline btn-block" id="cns-viva-btn" style="margin-top:8px;">🎓 Viva Voce Quiz</button>
                    <div class="score-panel" style="margin-top:14px;">
                        <div class="score-item"><span class="score-label">Game XP</span><span class="score-value" id="cns-xp">0 XP</span></div>
                    </div>
                </div>

                <div class="uni-stage">
                    <div class="game-stage-wrap" id="cns-stage">
                        <img class="game-stage-bg" src="assets/cns-bench-scene.jpg" alt="CNS Mouse Apparatus">
                        <canvas id="cns-overlay" width="680" height="430" class="game-stage-overlay"></canvas>
                        <div id="cns-mouse-target" class="drop-target-ring" style="left:255px;top:125px;width:160px;height:110px;border-radius:16px;"></div>
                        <div class="game-bench-dock" id="cns-dock"></div>
                    </div>
                    <div class="uni-readout" id="cns-readout">
                        🎮 <strong>Click a vial on the dock</strong> to load the Syringe, then <strong>drag the Syringe onto the Swiss Albino Mouse</strong> to inject & run the ${this.cfg.apparatus} trial!
                    </div>
                </div>

                <div class="uni-panel">
                    <h3>📊 Observation Table</h3>
                    <table class="obs-table">
                        <thead><tr><th>Treatment</th><th>${this.cfg.metricLabel}</th><th>Result</th></tr></thead>
                        <tbody id="cns-tbody">
                            <tr><td colspan="3" class="obs-cell-pending" style="text-align:center;padding:16px;">Drag Syringe onto Mouse to run trial...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.stage = document.getElementById('cns-stage');
        this.target = document.getElementById('cns-mouse-target');
        this.canvas = document.getElementById('cns-overlay');
        this.ctx = this.canvas.getContext('2d');

        this._buildDock();

        this.container.querySelectorAll('.uni-drug-btn').forEach(b => {
            b.onclick = () => {
                this.selectedDrug = this.cfg.drugs.find(x => x.id === b.dataset.drug);
                this.container.querySelectorAll('.uni-drug-btn').forEach(x => x.classList.remove('active'));
                b.classList.add('active');
                this._refreshSyringeSVG();
            };
        });
        document.getElementById('cns-dose-slider').oninput = (e) => {
            this.doseFactor = parseFloat(e.target.value);
            document.getElementById('cns-dose-lbl').textContent = this.doseFactor.toFixed(2) + '×';
        };
        document.getElementById('cns-viva-btn').onclick = () => openGenericViva(this.cfg.title, this.cfg.viva);

        const loop = (now) => {
            this._drawOverlay(now);
            this.animId = requestAnimationFrame(loop);
        };
        this.animId = requestAnimationFrame(loop);
    }

    _buildDock() {
        const dock = document.getElementById('cns-dock');
        dock.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                ${this.cfg.drugs.map(d => `
                    <div class="draggable-piece" data-vial="${d.id}" title="Load ${d.name}">
                        <div style="transform:scale(0.8);height:58px;display:flex;align-items:center;">${PHARM_SVG.bottle(d.short, 'i.p.', d.color)}</div>
                    </div>
                `).join('')}
            </div>
            <div style="width:1px;height:64px;background:#cbd5e1;"></div>
            <div class="draggable-piece" id="cns-drag-syringe">
                <div id="cns-syringe-svg">${PHARM_SVG.syringe(this.selectedDrug.color, true)}</div>
                <span class="draggable-label">Drag Syringe → Mouse</span>
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

        const syrEl = document.getElementById('cns-drag-syringe');
        this.cleanupDrag = DragGame.makeDraggable(syrEl, {
            onStart: () => this.target.classList.add('active'),
            onDrop: (cx, cy) => {
                this.target.classList.remove('active');
                if (DragGame.isOverElement(cx, cy, this.target, 30)) {
                    this.runTrial(cx, cy);
                }
            }
        });
    }

    _refreshSyringeSVG() {
        const el = document.getElementById('cns-syringe-svg');
        if (el) el.innerHTML = PHARM_SVG.syringe(this.selectedDrug.color, true);
    }

    runTrial(cx, cy) {
        if (this.running) return;
        this.running = true;
        this.trialStart = performance.now();
        const d = this.selectedDrug;
        let val = d.mean;
        if (d.id !== 'control') {
            val = d.mean * (d.mean > 100 ? (1 + (this.doseFactor - 1) * 0.25) : (1 / Math.max(0.6, this.doseFactor)));
            if (this.expNum === 7 && d.id === 'phenytoin') val = 0;
        }
        val = Math.max(0, val + (Math.random() - 0.5) * d.sd);
        this.simVal = (this.expNum === 3 || this.expNum === 5 || this.expNum === 7) ? val.toFixed(1) : Math.round(val);
        DragGame.spawnFloatingXP(this.stage, cx, cy, `Administered ${d.short} i.p.`);
        document.getElementById('cns-readout').innerHTML = `🔬 Recording physiological <strong>${this.cfg.apparatus}</strong> response for <strong>${d.name}</strong>...`;
    }

    _drawOverlay(now) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 680, 430);

        // Top HUD badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.84)';
        ctx.beginPath(); ctx.roundRect(14, 14, 290, 32, 8); ctx.fill();
        ctx.fillStyle = '#5eead4'; ctx.font = '700 12px Inter, sans-serif';
        ctx.fillText(`● ${this.cfg.apparatus}`, 26, 35);

        let p = 0;
        if (this.running) {
            p = Math.min(1, (now - this.trialStart) / 2600);
            if (p >= 1) {
                this.running = false;
                const d = this.selectedDrug;
                this.records.push({ drug: d.name, val: `${this.simVal} ${this.cfg.unit}`, note: d.note });
                document.getElementById('cns-tbody').innerHTML = this.records.map(r => `
                    <tr><td><strong>${r.drug.split('(')[0]}</strong></td><td><strong>${r.val}</strong></td><td>${r.note}</td></tr>
                `).join('');
                document.getElementById('cns-readout').innerHTML = `✅ <strong>${d.name}:</strong> ${this.simVal} ${this.cfg.unit} — ${d.note}`;
            }
        }

        // Apparatus-specific live HUD telemetry overlay
        if (this.running || this.simVal !== null) {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.beginPath(); ctx.roundRect(475, 14, 190, 56, 10); ctx.fill();
            ctx.fillStyle = '#94a3b8'; ctx.font = '600 10px Inter, sans-serif';
            ctx.fillText(this.cfg.metricLabel.toUpperCase(), 490, 32);
            ctx.fillStyle = '#2dd4bf'; ctx.font = 'bold 20px JetBrains Mono, monospace';
            const shown = this.running ? `${(p * parseFloat(this.simVal)).toFixed(1)} ${this.cfg.unit}` : `${this.simVal} ${this.cfg.unit}`;
            ctx.fillText(shown, 490, 58);

            // Visual IR / Thermal / EEG pulse bar over apparatus
            if (this.expNum === 2) {
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)'; ctx.lineWidth = 2;
                [140, 175, 210].forEach(y => { ctx.beginPath(); ctx.moveTo(150, y); ctx.lineTo(530, y); ctx.stroke(); });
            } else if ((this.expNum === 3 || this.expNum === 5) && this.running) {
                ctx.fillStyle = `rgba(239, 68, 68, ${0.15 + Math.sin(p * 12) * 0.1})`;
                ctx.fillRect(180, 235, 320, 26);
            } else if ((this.expNum === 7 || this.expNum === 9) && this.running) {
                ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2; ctx.beginPath();
                for (let x = 200; x < 480; x += 6) {
                    const y = 95 + Math.sin(x * 0.3 + now * 0.04) * (this.selectedDrug.id === 'control' ? 18 : 3);
                    if (x === 200) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        }
    }

    destroy() {
        if (this.animId) cancelAnimationFrame(this.animId);
        if (this.cleanupDrag) this.cleanupDrag();
    }
}
