/**
 * EXP 31 — Calculation of pharmacokinetic parameters after an IV bolus
 *
 * A cannulated rat is given a single intravenous bolus and serial plasma samples
 * are drawn. The student designs the sampling schedule, and that design is the
 * experiment: sample too briefly and the terminal slope is undetermined; sample
 * too long and the late points fall below the assay's limit of quantification
 * and cannot be used at all.
 *
 * Regression of ln C against t over the quantifiable points gives:
 *   slope = −ke      intercept = ln C0
 *   t½  = 0.693 / ke        Vd = Dose / C0
 *   CL  = ke × Vd           AUC(0→∞) = C0 / ke
 *
 * The three drugs have deliberately different half-lives (2 h, 8 h, 20 h) so that
 * one sampling schedule cannot serve all of them.
 */
(function () {
    const { M, G, Rodent } = LAB;

    const BENCH = 430;
    const PLAT = { x: 52, y: 396, w: 250 };
    const RACK = { x: 330, y: 404, w: 300 };
    const UNIT = { x: 652, y: 150, w: 286, h: 252 };

    const TIMES = [0.25, 0.5, 1, 2, 4, 8, 12, 24, 48];   // hours
    const LOQ = 0.1;                                      // mg/L assay cut-off
    const CV = 0.045;                                     // assay imprecision

    const DRUGS = [
        {
            id: 'gent', name: 'Gentamicin', short: 'Gent', cls: 'Aminoglycoside — short t½',
            color: '#0d9488', thalf: 2.0, vd: 0.25, doses: [2, 5, 10],
            note: 'A short half-life drug. By 24 h the concentration is far below the limit of quantification, so late samples are wasted — the informative window is the first 8 hours.'
        },
        {
            id: 'theo', name: 'Theophylline', short: 'Theo', cls: 'Methylxanthine — intermediate t½',
            color: '#6366f1', thalf: 8.0, vd: 0.5, doses: [5, 10, 20],
            note: 'An intermediate half-life. Sampling to 24 h covers three half-lives, which is about the minimum for a well-determined terminal slope.'
        },
        {
            id: 'diaz', name: 'Diazepam', short: 'Diaz', cls: 'Benzodiazepine — long t½, large Vd',
            color: '#7c3aed', thalf: 20.0, vd: 1.1, doses: [5, 10, 20],
            note: 'A long half-life and a large volume of distribution, reflecting extensive tissue binding. Stopping at 12 h would capture less than one half-life and give a badly biased ke.'
        }
    ];

    class PKStudy extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: BENCH, seed: 6 },
                syringe: false,
                steps: [
                    'Select a drug and dose. The rat is cannulated in the tail vein for dosing and sampling.',
                    'Give the <b>intravenous bolus</b> and start the clock at t = 0.',
                    'Draw serial plasma samples by clicking the tubes in the rack. You choose the schedule — sampling design is part of the experiment.',
                    'Samples reading <b>below the limit of quantification</b> (0.1 mg/L) cannot be used in the regression.',
                    'Plot <b>ln C against t</b>. The slope is −k<sub>e</sub> and the intercept is ln C₀.',
                    'Calculate t½ = 0.693/k<sub>e</sub>, V<sub>d</sub> = Dose/C₀, CL = k<sub>e</sub> × V<sub>d</sub> and AUC = C₀/k<sub>e</sub>.'
                ],
                treatmentTitle: 'Test drug',
                treatments: DRUGS.map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['t (h)', 'C (mg/L)', 'ln C', 'Used'],
                tableTitle: 'Plasma concentrations',
                chart: true,
                chartTitle: 'Plasma concentration–time curve',
                chartEmpty: { xMin: 0, xMax: 24, yMin: 0.05, yMax: 100, logY: true, xLabel: 'Time (h)', yLabel: 'C (mg/L)' },
                viva: [
                    {
                        q: 'Why is the plasma concentration plotted on a logarithmic scale against time?',
                        opts: ['To make the numbers smaller', 'Because first-order elimination is exponential, so a log transform makes it a straight line whose slope gives kₑ', 'To hide assay error', 'Because concentration cannot be negative'],
                        ans: 1,
                        exp: 'For a one-compartment model C = C₀e^(−kₑt), so ln C = ln C₀ − kₑt. The semi-log plot linearises the decay and makes kₑ readable as a slope.'
                    },
                    {
                        q: 'The apparent volume of distribution is:',
                        opts: ['The actual volume of blood', 'The theoretical volume that would be needed to contain the dose at the measured plasma concentration', 'The volume of the sampling tube', 'Always 5 litres'],
                        ans: 1,
                        exp: 'Vd is a proportionality constant, not an anatomical space. Values far above total body water, as with diazepam, indicate extensive binding to tissues outside plasma.'
                    },
                    {
                        q: 'Clearance is best defined as:',
                        opts: ['The amount of drug eliminated per hour', 'The volume of plasma completely cleared of drug per unit time', 'The fraction eliminated per hour', 'The half-life multiplied by Vd'],
                        ans: 1,
                        exp: 'CL is a volume per unit time (here ke × Vd). Unlike half-life it is independent of distribution, which is why it, not t½, determines the maintenance dose rate.'
                    },
                    {
                        q: 'Why must samples below the limit of quantification be excluded from the regression?',
                        opts: ['They are too expensive', 'Below the LOQ the assay cannot measure accurately, so including those points biases the estimate of the slope', 'They are always zero', 'The rat is dead by then'],
                        ans: 1,
                        exp: 'Values below the LOQ carry unacceptable error. Treating them as real numbers, or worse as zero, flattens or distorts the terminal slope and corrupts every parameter derived from it.'
                    },
                    {
                        q: 'Roughly how long should sampling continue to characterise elimination properly?',
                        opts: ['One half-life', 'Three to five half-lives', 'Ten minutes', 'Until the drug is undetectable, however long that takes'],
                        ans: 1,
                        exp: 'Three to five half-lives covers 87.5–97% of elimination and defines the terminal slope reliably. Much less and ke is poorly determined; much more and the samples are below the LOQ.'
                    },
                    {
                        q: 'If a drug has a long half-life but a normal clearance, the most likely explanation is:',
                        opts: ['A large volume of distribution', 'Poor absorption', 'High protein binding in plasma only', 'A small dose'],
                        ans: 0,
                        exp: 'Since t½ = 0.693 × Vd / CL, a long half-life with normal clearance implies a large Vd — the drug is sequestered in tissues and returns slowly to the plasma where it can be cleared.'
                    }
                ],
                inferenceHint: 'Take at least three quantifiable samples spanning several half-lives; the regression and the derived parameters appear automatically.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS[0];
            this.dose = this.drug.doses[1];
            this.logY = true;
            this.rat = new Rodent({ x: PLAT.x + 140, y: PLAT.y, scale: 1.25, kind: 'rat', facing: 1 });
            this.rat.groundY = PLAT.y;
            this.hotspots = [
                { x: PLAT.x, y: PLAT.y - 80, w: PLAT.w, h: 90, label: 'Cannulated rat — tail vein' },
                { x: RACK.x, y: RACK.y - 50, w: RACK.w, h: 70, label: 'Sample tubes — click to draw plasma at that time' },
                { x: UNIT.x, y: UNIT.y, w: UNIT.w, h: UNIT.h, label: 'Plasma assay — HPLC analyser' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.ratNo = (this.ratNo || 0) + 1;
            this.hours = 0;
            this.dosed = false;
            this.samples = [];
            this.revealed = false;
            this.lastRead = null;
            this.flash = 0;
            this.simMin = 0;
            this.setRows([]);
            this.setStep(0);
            this._controls();
            this._refresh();
            this._chart();
            this.infer(this.cfg.inferenceHint);
        }

        onSelect(tr) {
            if (this.dosed) return this.toast('The study has already started — take a fresh rat to change the drug.', 'warn');
            this.drug = DRUGS.find(d => d.id === tr.id);
            if (this.drug.doses.indexOf(this.dose) < 0) this.dose = this.drug.doses[1];
            this._controls();
            this._refresh();
        }

        /* true parameters of the current study */
        get ke() { return Math.LN2 / this.drug.thalf; }
        get c0() { return this.dose / this.drug.vd; }
        conc(t) { return this.c0 * Math.exp(-this.ke * t); }

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">IV bolus dose</div>
                <div class="lab2-seg" id="pk-dose">${d.doses.map(v => `<button data-v="${v}" class="${v === this.dose ? 'active' : ''}" ${this.dosed ? 'disabled' : ''}>${v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">mg/kg into the tail vein</div>
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin:12px 0 6px">Plot</div>
                <div class="lab2-seg" id="pk-scale">
                    <button data-l="1" class="${this.logY ? 'active' : ''}">Semi-log</button>
                    <button data-l="0" class="${this.logY ? '' : 'active'}">Linear</button>
                </div>
                <p style="margin-top:10px;font-size:11.5px;color:#475569">Assay LOQ <b>${LOQ} mg/L</b> — samples below this cannot be used.</p>
            `);
            const seg = this.$('pk-dose');
            if (seg) seg.querySelectorAll('button').forEach(b => b.onclick = () => {
                if (this.busy || this.dosed) return;
                this.dose = +b.dataset.v;
                this._controls();
                this._refresh();
            });
            const sc = this.$('pk-scale');
            if (sc) sc.querySelectorAll('button').forEach(b => b.onclick = () => {
                this.logY = b.dataset.l === '1';
                this._controls();
                this._chart();
            });
        }

        _refresh() {
            if (!this.dosed) {
                this.status(`Ready — give <b>${this.drug.name} ${this.dose} mg/kg</b> as an IV bolus.`);
                this.actions([{ label: `💉 Inject IV bolus`, primary: true, disabled: this.busy, onClick: () => this.injectBolus() }]);
            } else {
                const next = TIMES.find(t => t > this.hours + 1e-6);
                const list = [];
                if (next !== undefined) {
                    list.push({ label: `🩸 Sample at t = ${next} h`, primary: true, disabled: this.busy, onClick: () => this.sampleAt(next) });
                }
                if (this.fit && !this.revealed) list.push({ label: '🔎 Check the answer', onClick: () => { this.revealed = true; this._analyse(); this._refresh(); } });
                list.push({ label: '🐀 Fresh rat', onClick: () => this.resetAnimal() });
                this.status(next === undefined
                    ? 'All sampling times used. Review the regression and the derived parameters.'
                    : `t = <b>${this.hours} h</b> after the bolus. Click a tube in the rack, or take the next scheduled sample.`);
                this.actions(list);
            }
            this.hud('l', [
                { k: 'Rat', v: '#' + this.ratNo },
                { k: 'Drug', v: this.drug.short },
                { k: 'Dose', v: this.dose + ' mg/kg' }
            ]);
        }

        /* ---------------- procedure ---------------- */
        injectBolus() {
            if (this.busy || this.dosed) return;
            this.busy = true;
            this.flash = 1;
            const m = this.rat;
            for (let i = 0; i < 14; i++) {
                this.fx.emit({
                    x: m.x - 60 + M.rand(-6, 6), y: m.y - 14, vx: M.rand(-14, 14), vy: M.rand(-30, -8), ay: 160,
                    r: M.rand(1.4, 2.6), life: M.rand(0.4, 0.8), color: G.hexA(this.drug.color, 0.85), shape: 'drop'
                });
            }
            this.floatText(m.x, m.y - 70, `${this.drug.short} ${this.dose} mg/kg i.v.`, this.drug.color);
            this.tw.wait(0.8, () => {
                this.dosed = true;
                this.busy = false;
                this.hours = 0;
                this.setStep(2);
                this.toast('Bolus given. Clock started — begin serial sampling.', 'success');
                this._controls();
                this._refresh();
            });
            this._refresh();
        }

        sampleAt(t) {
            if (this.busy || !this.dosed) return;
            if (t <= this.hours) return this.toast('That time has already passed — choose a later tube.', 'warn');
            if (this.samples.some(s => s.t === t)) return this.toast('That tube has already been filled.', 'warn');
            const gen = this.gen;
            const gapMin = (t - this.hours) * 60;
            this.timeLapse(gapMin, M.clamp(gapMin / 90, 0.8, 3.4), {
                label: `Waiting to t = ${t} h`,
                onTick: (sim, p) => { if (gen === this.gen) this.hoursLive = this.hours + (t - this.hours) * p; },
                onDone: () => {
                    if (gen !== this.gen) return;
                    this.hours = t;
                    this.hoursLive = t;
                    this._draw(t);
                }
            });
            this._refresh();
        }

        _draw(t) {
            const trueC = this.conc(t);
            const measured = Math.max(0, trueC * (1 + M.randn() * CV));
            const below = measured < LOQ;
            this.samples.push({ t, c: measured, below });
            this.lastRead = { t, c: measured, below };
            const m = this.rat;
            for (let i = 0; i < 8; i++) {
                this.fx.emit({
                    x: m.x - 62, y: m.y - 12, vx: M.rand(-8, 8), vy: M.rand(10, 40), ay: 200,
                    r: M.rand(1.2, 2.2), life: M.rand(0.3, 0.6), color: 'rgba(190,24,60,0.85)', shape: 'drop'
                });
            }
            this.floatText(this._tubeX(t), RACK.y - 56,
                below ? '< LOQ' : measured.toFixed(2) + ' mg/L', below ? '#fca5a5' : '#5eead4');
            this.setStep(below ? 3 : 2);
            this._renderTable();
            this._chart();
            this._analyse();
            this._refresh();
            if (below) this.toast('Below the limit of quantification — this point cannot be used in the regression.', 'warn');
        }

        _renderTable() {
            this.setRows(this.samples.slice().sort((a, b) => a.t - b.t).map(s => ({
                cells: [
                    s.t.toString(),
                    s.below ? '<i>&lt; LOQ</i>' : s.c.toFixed(3),
                    s.below ? '—' : Math.log(s.c).toFixed(3),
                    s.below ? '<b style="color:#be123c">No</b>' : 'Yes'
                ],
                cls: s.below ? 'muted' : ''
            })));
        }

        /* ---------------- analysis ---------------- */
        _analyse() {
            const usable = this.samples.filter(s => !s.below);
            this.fit = null;
            if (usable.length < 3) {
                this.infer(`<p>Take at least <b>three</b> quantifiable samples to fit the elimination line.</p>
                    <p style="margin-top:6px;color:#64748b">Usable so far: ${usable.length}.</p>`);
                return;
            }
            const xs = usable.map(s => s.t);
            const ys = usable.map(s => Math.log(s.c));
            const reg = M.linreg(xs, ys);
            if (!reg.slope || reg.slope >= 0) return;

            const ke = -reg.slope;
            const c0 = Math.exp(reg.intercept);
            const thalf = Math.LN2 / ke;
            const vd = this.dose / c0;
            const cl = ke * vd;
            const auc = c0 / ke;
            const span = (Math.max(...xs) - Math.min(...xs)) / thalf;
            this.fit = { ke, c0, thalf, vd, cl, auc, r2: reg.r2, span };

            let html = `<table style="width:100%;font-size:11.5px;border-collapse:collapse">
                <tr style="color:#64748b"><th style="text-align:left">Parameter</th><th>Your value</th>${this.revealed ? '<th>True</th>' : ''}</tr>`;
            const row = (name, got, truth, unit) =>
                `<tr><td>${name}</td><td style="text-align:center"><b>${got}</b></td>${this.revealed ? `<td style="text-align:center;color:#64748b">${truth}</td>` : ''}</tr>`;
            html += row('k<sub>e</sub> (h⁻¹)', ke.toFixed(4), this.ke.toFixed(4));
            html += row('t½ (h)', thalf.toFixed(2), this.drug.thalf.toFixed(2));
            html += row('C₀ (mg/L)', c0.toFixed(2), this.c0.toFixed(2));
            html += row('V<sub>d</sub> (L/kg)', vd.toFixed(3), this.drug.vd.toFixed(3));
            html += row('CL (L/h/kg)', cl.toFixed(4), (this.ke * this.drug.vd).toFixed(4));
            html += row('AUC (mg·h/L)', auc.toFixed(1), (this.c0 / this.ke).toFixed(1));
            html += '</table>';
            html += `<p style="margin-top:6px;font-size:11px;color:#64748b">Regression on ${usable.length} points, r² = ${reg.r2.toFixed(4)}.</p>`;

            if (span < 1.5) {
                html += `<p style="margin-top:8px;padding:8px;background:#fef2f2;border-radius:6px">
                    Your samples span only <b>${span.toFixed(1)} half-lives</b>. That is too short to define the terminal slope — extend sampling to three to five half-lives before trusting k<sub>e</sub>.</p>`;
            } else if (span > 2.5) {
                html += `<p style="margin-top:8px;padding:8px;background:#f0fdf4;border-radius:6px">
                    Sampling spans <b>${span.toFixed(1)} half-lives</b> — an adequate window for a reliable terminal slope.</p>`;
            }

            if (this.revealed) {
                const err = (thalf - this.drug.thalf) / this.drug.thalf * 100;
                html += `<p style="margin-top:8px;padding:8px;background:${Math.abs(err) < 10 ? '#f0fdf4' : '#fef2f2'};border-radius:6px">
                    Your t½ is off by <b>${err > 0 ? '+' : ''}${err.toFixed(1)}%</b>. ${this.drug.note}</p>`;
            } else {
                html += '<p style="margin-top:6px;color:#64748b">Use <b>Check the answer</b> to compare with the true parameters.</p>';
            }
            this.infer(html);
        }

        _chart() {
            const pts = this.samples.filter(s => !s.below).sort((a, b) => a.t - b.t).map(s => [s.t, s.c]);
            const low = this.samples.filter(s => s.below).map(s => [s.t, LOQ]);
            const maxT = Math.max(12, ...this.samples.map(s => s.t)) * 1.15;
            const series = [];
            if (pts.length) series.push({ name: 'Plasma', color: this.drug.color, type: 'scatter', r: 4, points: pts });
            if (low.length) series.push({ name: '< LOQ', color: '#cbd5e1', type: 'scatter', r: 3.2, points: low });
            if (this.fit) {
                const line = [];
                for (let k = 0; k <= 30; k++) {
                    const t = maxT * k / 30;
                    line.push([t, this.fit.c0 * Math.exp(-this.fit.ke * t)]);
                }
                series.push({ color: this.drug.color, width: 1.6, dashed: true, points: line });
            }
            const top = Math.max(this.c0 * 1.4, ...this.samples.map(s => s.c)) * 1.2;
            this.chart.draw({
                xMin: 0, xMax: maxT,
                yMin: this.logY ? LOQ * 0.5 : 0,
                yMax: this.logY ? Math.max(top, LOQ * 20) : top,
                logY: this.logY,
                xLabel: 'Time after bolus (h)',
                yLabel: 'Plasma concentration (mg/L)',
                annotations: [{ y: LOQ, color: '#dc2626', text: 'LOQ' }],
                series
            });
        }

        /* ---------------- interaction: click a tube ---------------- */
        _tubeX(t) { return RACK.x + 22 + TIMES.indexOf(t) * ((RACK.w - 40) / (TIMES.length - 1)); }
        _tubeAt(x, y) {
            if (y < RACK.y - 50 || y > RACK.y + 20) return null;
            for (const t of TIMES) {
                if (Math.abs(x - this._tubeX(t)) < 13) return t;
            }
            return null;
        }
        cursorAt(x, y) {
            if (this.busy || !this.dosed) return false;
            const t = this._tubeAt(x, y);
            return t !== null && t > this.hours && !this.samples.some(s => s.t === t);
        }
        onPointerDown(x, y) {
            if (this.busy || !this.dosed) return;
            const t = this._tubeAt(x, y);
            if (t !== null) this.sampleAt(t);
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.flash = Math.max(0, this.flash - dt * 3);
            const m = this.rat;
            m.set({ walk: 0, sniff: 1, crouch: 0.25, sedation: this.dosed ? 0.15 : 0 });
            m.gaitSpeed = 0;
            m.update(dt);
            const shown = this.hoursLive !== undefined ? this.hoursLive : this.hours;
            this.hud('r', [
                { k: 'Clock', v: this.dosed ? shown.toFixed(2) + ' h' : '—' },
                { k: 'Samples', v: `${this.samples.filter(s => !s.below).length}/${this.samples.length}` },
                { k: 'Last', v: this.lastRead ? (this.lastRead.below ? '< LOQ' : this.lastRead.c.toFixed(2)) : '—', tone: this.lastRead && this.lastRead.below ? 'warn' : '' }
            ]);
        }

        /* ---------------- drawing ---------------- */
        draw(ctx) {
            this._platform(ctx);
            this.rat.draw(ctx);
            this._cannula(ctx);
            this._rack(ctx);
            this._analyser(ctx);
            if (this.flash > 0) {
                ctx.save();
                ctx.globalAlpha = this.flash * 0.18;
                ctx.fillStyle = this.drug.color;
                ctx.fillRect(0, 0, this.W, this.H);
                ctx.restore();
            }
        }

        _platform(ctx) {
            const p = PLAT;
            G.shadow(ctx, p.x + p.w / 2, p.y + 14, p.w * 0.46, 9, 0.4);
            const g = ctx.createLinearGradient(0, p.y - 10, 0, p.y + 8);
            g.addColorStop(0, '#2f4858'); g.addColorStop(1, '#16242f');
            ctx.fillStyle = g; G.rr(ctx, p.x, p.y - 10, p.w, 18, 4); ctx.fill();
            ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1; ctx.stroke();
            G.text(ctx, 'CANNULATED RAT · TAIL VEIN', p.x + 6, p.y - 16,
                { size: 9, color: 'rgba(226,232,240,0.6)', weight: 800 });
        }

        /* fine cannula taped to the tail, running to a sampling port */
        _cannula(ctx) {
            const m = this.rat;
            const sx = m.x - 58, sy = m.y - 14;
            ctx.save();
            ctx.strokeStyle = 'rgba(203,213,225,0.9)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.bezierCurveTo(sx - 30, sy + 10, PLAT.x + 6, PLAT.y - 34, PLAT.x + 18, PLAT.y - 26);
            ctx.stroke();
            // drug/blood column in the line
            ctx.strokeStyle = this.dosed ? G.hexA(this.drug.color, 0.6) : 'rgba(148,163,184,0.5)';
            ctx.lineWidth = 1.1;
            ctx.stroke();
            // tape over the tail
            ctx.fillStyle = 'rgba(248,250,252,0.85)';
            G.rr(ctx, sx - 6, sy - 5, 14, 9, 2); ctx.fill();
            // three-way stopcock
            G.metal(ctx, PLAT.x + 12, PLAT.y - 32, 16, 12, { tone: 'steel', r: 3 });
            G.led(ctx, PLAT.x + 20, PLAT.y - 26, 2.4, this.dosed ? '#22c55e' : '#94a3b8', true);
            ctx.restore();
        }

        _rack(ctx) {
            const r = RACK;
            ctx.save();
            G.shadow(ctx, r.x + r.w / 2, r.y + 18, r.w * 0.48, 8, 0.4);
            G.metal(ctx, r.x, r.y - 4, r.w, 22, { tone: 'dark', r: 5 });
            G.text(ctx, 'SERIAL PLASMA SAMPLES (h)', r.x + 4, r.y - 42,
                { size: 9, weight: 800, color: 'rgba(226,232,240,0.7)' });

            TIMES.forEach(t => {
                const x = this._tubeX(t);
                const s = this.samples.find(q => q.t === t);
                const avail = this.dosed && !this.busy && t > this.hours && !s;
                const hov = avail && Math.abs(this.ptr.x - x) < 13 && this.ptr.y > r.y - 50 && this.ptr.y < r.y + 20;
                const top = r.y - 38 - (hov ? 4 : 0);
                // tube
                G.glass(ctx, x - 7, top, 14, 44, { r: 3, tint: 'rgba(225,240,250,0.16)' });
                if (s) {
                    const col = s.below ? 'rgba(203,213,225,0.75)' : 'rgba(190,24,60,0.75)';
                    ctx.fillStyle = col;
                    G.rr(ctx, x - 5.5, top + 18, 11, 24, 2); ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.4)';
                    ctx.fillRect(x - 5.5, top + 18, 11, 2);
                }
                if (avail) {
                    ctx.strokeStyle = hov ? 'rgba(52,245,197,0.95)' : 'rgba(52,245,197,0.4)';
                    ctx.lineWidth = hov ? 2 : 1.2;
                    G.rr(ctx, x - 9, top - 2, 18, 48, 4); ctx.stroke();
                }
                G.text(ctx, String(t), x, r.y + 12,
                    { size: 8.5, align: 'center', weight: 800, color: s ? '#e2e8f0' : 'rgba(226,232,240,0.6)' });
            });
            ctx.restore();
        }

        _analyser(ctx) {
            const u = UNIT;
            G.shadow(ctx, u.x + u.w / 2, u.y + u.h + 2, u.w * 0.55, 10, 0.5);
            const g = ctx.createLinearGradient(0, u.y, 0, u.y + u.h);
            g.addColorStop(0, '#e8edf2'); g.addColorStop(0.1, '#cfd8e1'); g.addColorStop(1, '#8b97a4');
            ctx.fillStyle = g; G.rr(ctx, u.x, u.y, u.w, u.h, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            [[u.x + 10, u.y + 10], [u.x + u.w - 10, u.y + 10], [u.x + 10, u.y + u.h - 10], [u.x + u.w - 10, u.y + u.h - 10]]
                .forEach(([x, y]) => G.screw(ctx, x, y, 3.5));
            G.text(ctx, 'PLASMA ASSAY', u.x + 20, u.y + 26, { size: 11, weight: 800, color: '#1e293b' });
            G.text(ctx, 'HPLC · UV DETECTION', u.x + 20, u.y + 40, { size: 8, weight: 700, color: '#64748b' });
            G.metal(ctx, u.x + 16, u.y + 50, u.w - 32, u.h - 72, { r: 8, tone: 'dark' });

            const lr = this.lastRead;
            G.lcd(ctx, u.x + 30, u.y + 62, 222, 50,
                lr ? (lr.below ? '< LOQ' : lr.c.toFixed(3)) : '----',
                { label: 'CONCENTRATION  mg/L', color: lr && lr.below ? '#fb7185' : '#34f5c5' });
            G.lcd(ctx, u.x + 30, u.y + 124, 104, 44,
                lr ? lr.t + ' h' : '—',
                { label: 'SAMPLE', color: '#34f5c5' });
            G.lcd(ctx, u.x + 148, u.y + 124, 104, 44,
                this.drug.short,
                { label: 'ANALYTE', color: '#a78bfa' });

            G.led(ctx, u.x + 40, u.y + 190, 6, '#22c55e', true);
            G.text(ctx, 'READY', u.x + 52, u.y + 194, { size: 8, color: '#cbd5e1', weight: 700 });
            G.led(ctx, u.x + 120, u.y + 190, 6, '#f59e0b', this.busy);
            G.text(ctx, 'RUN', u.x + 132, u.y + 194, { size: 8, color: '#cbd5e1', weight: 700 });
            G.text(ctx, 'LOQ ' + LOQ + ' mg/L', u.x + u.w - 24, u.y + 194,
                { size: 8, color: '#94a3b8', weight: 700, align: 'right' });
        }
    }

    LAB.register(31, PKStudy);
})();
