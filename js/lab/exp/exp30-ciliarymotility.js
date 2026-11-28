/**
 * EXP 30 — Effect of drugs on ciliary motility (frog oesophagus)
 *
 * A strip of frog oesophageal mucosa is laid ciliated-side up in a moist
 * chamber. A small particle placed on it is carried along by the metachronal
 * beat of the cilia, and the time taken to travel a fixed 20 mm gives the
 * ciliary transport velocity in mm/min. The drug under test is applied to the
 * mucosa in Ringer and a fresh particle is timed again.
 *
 * This is the bench model of MUCOCILIARY CLEARANCE, and the results map
 * directly onto the clinic:
 *   β₂ agonists   speed the cilia — part of why salbutamol helps in asthma
 *   nicotine      slows them markedly — the mechanism behind smoker's cough
 *   lignocaine    is ciliostatic — why topical anaesthesia impairs clearance
 *                 after bronchoscopy
 */
(function () {
    const { M, G } = LAB;

    const BENCH = 452;
    const PLATE = { x: 132, y: 228, w: 700, h: 96 };
    const X0 = 186, X1 = 786, DIST_MM = 20;        // 0 mm and 20 mm marks
    const PX_MM = (X1 - X0) / DIST_MM;
    const SPEED = 10;                               // sim seconds per real second

    const DRUGS = [
        {
            id: 'ringer', name: 'Frog Ringer (control)', short: 'Ringer', cls: 'Vehicle control',
            color: '#64748b', v: 12.5,
            note: 'The normal transport velocity of the preparation, against which everything else is compared.'
        },
        {
            id: 'salbutamol', name: 'Salbutamol 10 µg/mL', short: 'Salbutamol', cls: 'Selective β₂ agonist',
            color: '#16a34a', v: 19.5,
            note: 'Cilia carry <b>β₂</b> receptors; raising cAMP increases their beat frequency. Enhanced mucociliary clearance is part of the benefit of β₂ agonists in asthma, over and above bronchodilatation.'
        },
        {
            id: 'adrenaline', name: 'Adrenaline 10 µg/mL', short: 'Adrenaline', cls: 'Non-selective adrenergic',
            color: '#d97706', v: 16.8,
            note: 'Adrenaline accelerates the cilia through the same β₂ mechanism, a little less effectively than the selective agonist at equal concentration.'
        },
        {
            id: 'atropine', name: 'Atropine 10 µg/mL', short: 'Atropine', cls: 'Antimuscarinic',
            color: '#6366f1', v: 10.2,
            note: 'Atropine slows transport only slightly and chiefly by drying the surface film rather than by stopping the cilia — mucus that is too viscid is transported poorly however well the cilia beat.'
        },
        {
            id: 'nicotine', name: 'Nicotine 100 µg/mL', short: 'Nicotine', cls: 'Ciliotoxic',
            color: '#dc2626', v: 4.2,
            note: 'Nicotine markedly depresses ciliary beating and in higher concentrations arrests it altogether. This is the experimental basis of impaired clearance and <b>smoker’s cough</b>.'
        },
        {
            id: 'lignocaine', name: 'Lignocaine 1%', short: 'Lignocaine', cls: 'Local anaesthetic — ciliostatic',
            color: '#7c3aed', v: 3.0,
            note: 'Local anaesthetics are strongly <b>ciliostatic</b>. Clearance is measurably impaired for hours after topical anaesthesia of the airway, which is why patients are kept nil by mouth and observed after bronchoscopy.'
        },
        {
            id: 'ethanol', name: 'Ethanol 5%', short: 'Ethanol', cls: 'Depressant',
            color: '#0891b2', v: 6.4,
            note: 'Ethanol depresses ciliary activity in a concentration-dependent way, one of several reasons chronic alcohol use predisposes to chest infection.'
        }
    ];

    class CiliaryMotility extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: BENCH, seed: 24 },
                syringe: false,
                steps: [
                    'Pith a frog, open the mouth and dissect out the <b>oesophageal mucosa</b>; lay it flat, ciliated surface uppermost.',
                    'Keep the strip moist with frog Ringer in a covered chamber — drying stops the cilia within minutes.',
                    'Place a small particle at the <b>0 mm</b> mark and time its passage to the <b>20 mm</b> mark.',
                    'Calculate the ciliary transport velocity in mm/min; repeat two or three times for a reliable control value.',
                    'Flood the mucosa with the test solution, leave it <b>5 min</b>, then time a fresh particle.',
                    'Compare velocities: drugs that accelerate the cilia improve mucociliary clearance, those that slow them impair it.'
                ],
                treatmentTitle: 'Solutions to apply',
                treatments: DRUGS.map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Solution', 'Time (s)', 'Velocity (mm/min)', '% of control'],
                tableTitle: 'Transport velocities',
                chart: true,
                chartTitle: 'Ciliary transport velocity',
                chartEmpty: { xMin: 0.4, xMax: 7.6, yMin: 0, yMax: 24, xTicks: [1, 2, 3, 4, 5, 6, 7], xLabel: 'Solution', yLabel: 'mm/min', series: [] },
                viva: [
                    {
                        q: 'What does this preparation model clinically?',
                        opts: ['Gastric emptying', 'Mucociliary clearance of the respiratory tract', 'Intestinal absorption', 'Renal tubular transport'],
                        ans: 1,
                        exp: 'Frog oesophageal cilia behave much like respiratory cilia and are easy to observe, so the strip is a convenient bench model of the escalator that clears mucus from the airway.'
                    },
                    {
                        q: 'Salbutamol accelerates ciliary transport because cilia carry:',
                        opts: ['Muscarinic receptors', 'β₂ receptors, whose stimulation raises cAMP and increases beat frequency', 'Nicotinic receptors', 'Histamine H₁ receptors'],
                        ans: 1,
                        exp: 'This is a genuine additional benefit of β₂ agonists in asthma: besides relaxing bronchial muscle they help clear the secretions that obstruct the airway.'
                    },
                    {
                        q: 'Nicotine slows ciliary transport. The clinical correlate is:',
                        opts: ['Nicotine replacement therapy', 'Impaired clearance in smokers, contributing to chronic cough and recurrent infection', 'Improved exercise tolerance', 'Bronchodilatation'],
                        ans: 1,
                        exp: 'Depressed ciliary beating leaves mucus to accumulate, so it must be cleared by coughing instead — and retained secretions predispose to infection.'
                    },
                    {
                        q: 'Why must the mucosa be kept continuously moist?',
                        opts: ['To keep it visible', 'Cilia stop beating within minutes if the surface film dries, and the preparation is then useless', 'To dissolve the drug', 'To prevent bacterial growth'],
                        ans: 1,
                        exp: 'Ciliary beating depends on a watery periciliary layer. Allowing it to dry stops transport for reasons that have nothing to do with the drug under test.'
                    },
                    {
                        q: 'Local anaesthetics applied to the airway impair clearance because they are:',
                        opts: ['Bronchoconstrictors', 'Ciliostatic — they slow or arrest ciliary beating directly', 'Mucolytic', 'Sympathomimetic'],
                        ans: 1,
                        exp: 'The effect lasts for hours after topical anaesthesia, which is one reason patients are observed and kept nil by mouth after bronchoscopy.'
                    },
                    {
                        q: 'Transport velocity is calculated as:',
                        opts: ['Distance × time', 'Distance travelled divided by the time taken, expressed in mm/min', 'Time divided by distance', 'The number of particles used'],
                        ans: 1,
                        exp: 'Fixing the distance at 20 mm and timing the passage makes the measurement a simple reciprocal, and repeating it two or three times averages out irregular beating.'
                    }
                ],
                inferenceHint: 'Time two or three control runs first, then apply a drug and time a fresh particle.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.results = {};
            this.hotspots = [
                { x: PLATE.x, y: PLATE.y, w: PLATE.w, h: PLATE.h, label: 'Frog oesophageal mucosa, ciliated surface up' },
                { x: X0 - 20, y: PLATE.y + PLATE.h + 4, w: X1 - X0 + 40, h: 30, label: 'Millimetre scale — 0 to 20 mm' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.stripNo = (this.stripNo || 0) + 1;
            this.applied = null;
            this.run = null;
            this.particle = null;
            this.wet = 1;
            this.setRows([]);
            this.results = {};
            this.setStep(2);
            this._refresh();
            this.infer(this.cfg.inferenceHint);
        }

        onSelect() { this._refresh(); }

        get drug() { return DRUGS.find(d => d.id === this.tr.id); }
        get control() {
            const r = this.results.ringer;
            return r && r.length ? M.mean(r.map(x => x.v)) : null;
        }

        velocity(d) { return Math.max(0.4, d.v * M.clamp(M.gauss(1, 0.07), 0.78, 1.25)); }

        /* ---------------- flow ---------------- */
        _refresh() {
            const b = this.busy;
            if (this.run) {
                this.status(`Particle travelling — <b>${this.run.mm.toFixed(1)} mm</b> at ${Math.round(this.run.t)} s.`);
                this.actions([{ label: '⏩ Fast forward', always: true, onClick: () => { this.run.fast = !this.run.fast; } }]);
            } else if (this.applied && this.applied.id === this.tr.id) {
                this.status(`<b>${this.applied.name}</b> on the mucosa. Place a fresh particle and time it.`);
                this.actions([
                    { label: '⬤ Place particle & time', primary: true, disabled: b, onClick: () => this.start() },
                    { label: '🚿 Wash with Ringer', disabled: b, onClick: () => this.wash() },
                    { label: '↺ Fresh strip', disabled: b, onClick: () => this.resetAnimal() }
                ]);
            } else {
                const isCtrl = this.tr.id === 'ringer';
                this.status(isCtrl
                    ? 'Place a particle at the <b>0 mm</b> mark and time its passage to <b>20 mm</b>.'
                    : `Apply <b>${this.tr.name}</b> to the mucosa and leave it 5 min.`);
                this.actions([
                    isCtrl
                        ? { label: '⬤ Place particle & time', primary: true, disabled: b, onClick: () => this.start() }
                        : { label: '💧 Apply ' + this.tr.short, primary: true, disabled: b, onClick: () => this.apply() },
                    { label: '🚿 Wash with Ringer', disabled: b || !this.applied, onClick: () => this.wash() },
                    { label: '↺ Fresh strip', disabled: b, onClick: () => this.resetAnimal() }
                ]);
            }
            this.hud('l', [
                { k: 'Strip', v: '#' + this.stripNo },
                { k: 'Mucosa', v: this.applied ? this.applied.short : 'Ringer', tone: this.applied ? 'warn' : '' },
                { k: 'Control', v: this.control ? this.control.toFixed(1) + ' mm/min' : '—' }
            ]);
        }

        apply() {
            if (this.busy) return;
            const d = this.drug;
            this.busy = true;
            for (let i = 0; i < 16; i++) {
                this.fx.emit({
                    x: M.rand(X0, X1), y: PLATE.y + 24, vx: M.rand(-6, 6), vy: M.rand(8, 26), ay: 120,
                    r: M.rand(1.4, 2.6), life: M.rand(0.4, 0.9), color: G.hexA(d.color, 0.8), shape: 'drop'
                });
            }
            this.floatText((X0 + X1) / 2, PLATE.y - 10, `${d.short} applied`, d.color);
            const gen = this.gen;
            this.timeLapse(5, 2, {
                label: d.short + ' contact',
                onDone: () => {
                    if (gen !== this.gen) return;
                    this.applied = d;
                    this.busy = false;
                    this.setStep(4);
                    this.toast(`${d.name} left in contact for 5 min. Now time a fresh particle.`, 'info');
                    this._refresh();
                }
            });
            this._refresh();
        }

        wash() {
            if (this.busy) return;
            this.busy = true;
            const gen = this.gen;
            this.tw.add(1.0, e => { this.wet = 1; }, {
                onDone: () => {
                    if (gen !== this.gen) return;
                    this.applied = null;
                    this.busy = false;
                    this.toast('Mucosa washed with fresh Ringer.', 'success');
                    this._refresh();
                }
            });
            this.floatText((X0 + X1) / 2, PLATE.y - 10, 'washed with Ringer', '#7dd3fc');
            this._refresh();
        }

        start() {
            if (this.busy || this.run) return;
            const d = this.applied || DRUGS[0];
            const v = this.velocity(d);
            this.run = { d, v, t: 0, mm: 0, fast: false };
            this.particle = { x: X0, y: PLATE.y + PLATE.h / 2, wob: 0 };
            this.busy = true;
            this.setStep(3);
            this._refresh();
        }

        _finish() {
            const r = this.run;
            if (!r) return;
            const secs = DIST_MM / r.v * 60;
            const list = (this.results[r.d.id] = this.results[r.d.id] || []);
            list.push({ v: r.v, t: secs });
            const ctrl = this.control;
            const pct = ctrl ? r.v / ctrl * 100 : null;
            this.addRow([
                `<b>${r.d.short}</b>`,
                secs.toFixed(1),
                `<b>${r.v.toFixed(1)}</b>`,
                pct === null ? '—' : `${pct.toFixed(0)}%`
            ], pct === null ? '' : (pct > 115 ? 'up' : (pct < 85 ? 'down' : '')));
            this.markDone(r.d.id);
            this.run = null;
            this.particle = null;
            this.busy = false;
            this.toast(`Travelled 20 mm in <b>${secs.toFixed(1)} s</b> — ${r.v.toFixed(1)} mm/min.`, 'success');
            this.setStep(5);
            this._chart();
            this._infer();
            this._refresh();
        }

        /* ---------------- graph & inference ---------------- */
        _chart() {
            const pts = [];
            DRUGS.forEach((d, i) => {
                const r = this.results[d.id];
                if (!r) return;
                pts.push([i + 1, M.mean(r.map(x => x.v)), r.length > 1 ? M.sem(r.map(x => x.v)) : 0]);
            });
            const ctrl = this.control;
            this.chart.draw(Object.assign({}, this.cfg.chartEmpty, {
                xFmt: v => (DRUGS[v - 1] ? DRUGS[v - 1].short.slice(0, 9) : ''),
                series: [{ name: 'Velocity (mm/min)', color: '#0d9488', type: 'bar', points: pts, barWidth: 0.5, labels: true }],
                annotations: ctrl ? [{ y: ctrl, color: '#94a3b8', text: 'control' }] : []
            }));
        }

        _infer() {
            const ctrl = this.control;
            let html = DRUGS.filter(d => this.results[d.id]).map(d => {
                const r = this.results[d.id];
                const v = M.mean(r.map(x => x.v));
                const p = ctrl ? v / ctrl * 100 : null;
                return `<div class="kv"><span>${d.short} (n=${r.length})</span><span>${v.toFixed(1)} mm/min${p === null ? '' : ` (${p.toFixed(0)}% of control)`}</span></div>`;
            }).join('');
            const n = [];
            if (!ctrl) n.push('Time two or three <b>control</b> runs in Ringer to establish the normal velocity.');
            else {
                const R = this.results;
                if (R.salbutamol || R.adrenaline) n.push('The β₂ agonists <b>accelerate</b> transport, which is a real part of their usefulness in asthma: they clear secretions as well as widening the airway.');
                if (R.nicotine) n.push('Nicotine depresses the cilia markedly — the bench correlate of impaired clearance and chronic cough in smokers.');
                if (R.lignocaine) n.push('Lignocaine is strongly <b>ciliostatic</b>, which is why mucociliary clearance stays impaired for hours after topical anaesthesia of the airway.');
                if (R.nicotine && R.salbutamol) n.push('The two extremes differ several-fold, so the preparation discriminates clearly between drugs that help clearance and drugs that harm it.');
            }
            const last = this.applied || (this.results.ringer ? DRUGS[0] : null);
            if (last) n.push(last.note);
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        /* ---------------- simulation ---------------- */
        update(dt) {
            const r = this.run;
            if (r) {
                const k = r.fast ? SPEED * 4 : SPEED;
                r.t += dt * k;
                r.mm = Math.min(DIST_MM, r.v * r.t / 60);
                if (this.particle) {
                    this.particle.x = X0 + r.mm * PX_MM;
                    this.particle.wob += dt * 9;
                }
                if (r.mm >= DIST_MM) this._finish();
                else this._refresh();
            }
            this.hud('r', [
                { k: 'Distance', v: r ? r.mm.toFixed(1) + ' mm' : '—' },
                { k: 'Stopwatch', v: r ? r.t.toFixed(1) + ' s' : '—' },
                { k: 'Velocity', v: r ? (r.mm > 1 ? (r.mm / (r.t / 60)).toFixed(1) : '—') : '—' }
            ]);
        }

        /* ---------------- drawing ---------------- */
        draw(ctx) {
            this._chamber(ctx);
            this._scale(ctx);
            this._particle(ctx);
            this._stopwatch(ctx);
        }

        _chamber(ctx) {
            const p = PLATE;
            ctx.save();
            G.shadow(ctx, p.x + p.w / 2, p.y + p.h + 48, p.w * 0.44, 11, 0.42);
            // glass plate the strip rests on
            G.metal(ctx, p.x - 18, p.y + p.h + 10, p.w + 36, 16, { tone: 'dark', r: 4 });
            ctx.fillStyle = 'rgba(214,232,245,0.22)';
            G.rr(ctx, p.x - 10, p.y - 12, p.w + 20, p.h + 24, 6); ctx.fill();

            // the mucosal strip
            const tint = this.applied ? G.hexA(this.applied.color, 0.14) : 'rgba(255,255,255,0)';
            const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
            g.addColorStop(0, '#e9c8bf'); g.addColorStop(0.45, '#f6ded5'); g.addColorStop(1, '#d6ad9f');
            ctx.fillStyle = g;
            G.rr(ctx, p.x, p.y, p.w, p.h, 5); ctx.fill();
            ctx.fillStyle = tint; G.rr(ctx, p.x, p.y, p.w, p.h, 5); ctx.fill();
            ctx.strokeStyle = 'rgba(150,106,96,0.5)'; ctx.lineWidth = 1; ctx.stroke();

            // longitudinal mucosal folds
            ctx.strokeStyle = 'rgba(170,120,110,0.3)'; ctx.lineWidth = 1.1;
            for (let i = 1; i < 5; i++) {
                const y = p.y + p.h * (i / 5);
                ctx.beginPath();
                ctx.moveTo(p.x + 6, y);
                for (let x = p.x + 6; x < p.x + p.w - 6; x += 40) ctx.quadraticCurveTo(x + 20, y + (i % 2 ? 3 : -3), x + 40, y);
                ctx.stroke();
            }

            // the ciliated surface: a shimmering band whose wave speed tracks the velocity
            const r = this.run;
            const v = r ? r.v : (this.applied ? this.applied.v : DRUGS[0].v);
            const t = performance.now() / 1000;
            ctx.save();
            ctx.beginPath(); ctx.rect(p.x, p.y, p.w, 10); ctx.clip();
            for (let x = p.x; x < p.x + p.w; x += 7) {
                const ph = (x / 26) - t * v * 0.5;
                const h = 3.4 + Math.sin(ph) * 2.4;
                ctx.strokeStyle = `rgba(255,255,255,${0.22 + 0.2 * Math.sin(ph)})`;
                ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(x, p.y + 9); ctx.lineTo(x + Math.sin(ph) * 2, p.y + 9 - h); ctx.stroke();
            }
            ctx.restore();

            // moist film
            ctx.fillStyle = 'rgba(190,225,245,0.18)';
            G.rr(ctx, p.x, p.y, p.w, p.h, 5); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.ellipse(p.x + p.w * 0.3, p.y + 18, p.w * 0.1, 7, 0, 0, Math.PI * 2); ctx.fill();

            G.text(ctx, 'FROG OESOPHAGEAL MUCOSA · CILIATED SURFACE UP', p.x + 4, p.y - 20,
                { size: 9, weight: 800, color: 'rgba(226,232,240,0.78)', shadow: true });
            if (this.applied) {
                G.text(ctx, this.applied.name, p.x + p.w - 4, p.y - 20,
                    { size: 9, weight: 800, align: 'right', color: this.applied.color, shadow: true });
            }
            ctx.restore();
        }

        _scale(ctx) {
            const y = PLATE.y + PLATE.h + 34;
            ctx.save();
            ctx.fillStyle = 'rgba(248,250,252,0.9)';
            G.rr(ctx, X0 - 26, y - 10, X1 - X0 + 52, 26, 3); ctx.fill();
            ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
            for (let mm = 0; mm <= DIST_MM; mm++) {
                const x = X0 + mm * PX_MM;
                ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x, y - 10 + (mm % 5 === 0 ? 11 : 6)); ctx.stroke();
                if (mm % 5 === 0) G.text(ctx, String(mm), x, y + 12, { size: 9, align: 'center', weight: 700, color: '#0f172a' });
            }
            G.text(ctx, 'mm', X1 + 32, y + 12, { size: 9, weight: 700, color: '#e2e8f0', shadow: true });
            // start and finish gates
            [[X0, 'START'], [X1, '20 mm']].forEach(([x, lab]) => {
                ctx.strokeStyle = x === X0 ? '#0d9488' : '#dc2626'; ctx.lineWidth = 2;
                ctx.setLineDash([5, 4]);
                ctx.beginPath(); ctx.moveTo(x, PLATE.y - 6); ctx.lineTo(x, y - 12); ctx.stroke();
                ctx.setLineDash([]);
                G.text(ctx, lab, x, PLATE.y - 32, { size: 8.5, align: 'center', weight: 800, color: x === X0 ? '#5eead4' : '#fca5a5', shadow: true });
            });
            ctx.restore();
        }

        _particle(ctx) {
            const p = this.particle;
            if (!p) return;
            const y = p.y + Math.sin(p.wob) * 1.2;
            ctx.save();
            G.shadow(ctx, p.x, y + 7, 7, 2.5, 0.35);
            const g = ctx.createRadialGradient(p.x - 2, y - 2, 0.5, p.x, y, 6);
            g.addColorStop(0, '#5b4636'); g.addColorStop(1, '#1f1711');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.ellipse(p.x, y, 5.6, 4.6, 0.3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.35)';
            ctx.beginPath(); ctx.arc(p.x - 1.8, y - 1.6, 1.3, 0, Math.PI * 2); ctx.fill();
            // tiny wake behind the particle
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x - 9, y + 2); ctx.lineTo(p.x - 20, y + 2); ctx.stroke();
            ctx.restore();
        }

        _stopwatch(ctx) {
            const r = this.run;
            const x = 760, y = 404;
            ctx.save();
            ctx.fillStyle = 'rgba(8,15,26,0.74)';
            G.rr(ctx, x - 150, y - 26, 300, 54, 8); ctx.fill();
            G.lcd(ctx, x - 140, y - 18, 92, 38, r ? r.t.toFixed(1) : '0.0',
                { label: 'STOPWATCH s', color: '#34f5c5', size: 15 });
            G.lcd(ctx, x - 40, y - 18, 86, 38, r ? r.mm.toFixed(1) : '0.0',
                { label: 'DISTANCE mm', color: '#fbbf24', size: 15 });
            const v = r && r.mm > 1 ? (r.mm / (r.t / 60)) : null;
            G.lcd(ctx, x + 54, y - 18, 92, 38, v ? v.toFixed(1) : '--',
                { label: 'mm / min', color: '#a78bfa', size: 15 });
            ctx.restore();
        }
    }

    LAB.register(30, CiliaryMotility);
})();
