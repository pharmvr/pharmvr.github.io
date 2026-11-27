/**
 * EXP 13 — Concentration–response curve of acetylcholine on frog rectus abdominis
 *
 * Where exp 11 compares drug classes qualitatively, this one is the quantitative
 * experiment: a graded series of ACh doses is run in ascending order on one
 * tissue, each with a fixed contact time and a washout between, and the readings
 * are worked up two ways —
 *
 *   log DRC   : % of maximum against log molar concentration (the sigmoid)
 *   Hill plot : log(E/(Emax−E)) against log[A], fitted by least squares
 *
 * The Hill plot is what yields the numbers a student is asked for: the slope is
 * the Hill coefficient nH, and the intercept on the x-axis is log EC50, so
 * pD2 = −log EC50. Repeating the series after d-tubocurarine shifts the curve
 * right and gives a dose ratio; after physostigmine it shifts left.
 */
(function () {
    const { M } = LAB;

    const MW_ACH = 181.67;   // acetylcholine chloride
    const BATH_L = 0.020;    // 20 mL organ bath
    const molar = ug => (ug * 1e-6) / MW_ACH / BATH_L;

    const SERIES = [2, 5, 10, 20, 40, 80, 160];   // µg into the bath, ascending

    const DRUGS = {
        ach: {
            id: 'ach', name: 'Acetylcholine', short: 'ACh', cls: 'Nicotinic Nₘ agonist',
            color: '#0d9488', kind: 'agonist', unit: 'µg', ec50: 20, emax: 58, hill: 1.5,
            ester: true,
            note: 'The agonist being characterised. Each dose is left in contact for 60 s, read, and washed out before the next.'
        },
        dtc: {
            id: 'dtc', name: 'd-Tubocurarine', short: 'd-TC', cls: 'Competitive Nₘ antagonist',
            color: '#dc2626', kind: 'antagonist', unit: 'µg', kb: 10, doses: [10, 20, 40],
            note: 'A competitive blocker shifts the whole curve to the right in parallel. The ratio of the two EC50 values is the <b>dose ratio</b>.'
        },
        physo: {
            id: 'physo', name: 'Physostigmine', short: 'Phys', cls: 'Anticholinesterase',
            color: '#16a34a', kind: 'potentiator', unit: 'µg', factor: 4, doses: [10, 20],
            note: 'Inhibiting cholinesterase spares added ACh, so the same dose acts as though it were larger — the curve shifts to the <b>left</b>.'
        }
    };

    class AchCRC extends LAB.OrganBath {
        rig() {
            return { solution: "Frog Ringer", tempC: null, restLen: 96, tissueLabel: 'Frog rectus abdominis' };
        }

        config() {
            return {
                room: { benchY: LAB.RIG.BENCH, seed: 5 },
                syringe: false,
                steps: [
                    'Mount a <b>frog rectus abdominis</b> strip in the 20 mL bath of aerated frog Ringer and attach it to the frontal writing lever.',
                    'Equilibrate for <b>15 min</b> under 1 g resting tension until the baseline is flat.',
                    'Add the <b>lowest</b> dose of ACh, allow a fixed <b>60 s contact time</b>, read the height of the contracture, then wash out 3×.',
                    'Repeat with each successive dose in <b>ascending order</b>, keeping contact time and washing identical throughout.',
                    'Plot % of maximum against log concentration, then construct the <b>Hill plot</b> to read off n<sub>H</sub> and pD₂.',
                    'Repeat the whole series after d-tubocurarine or physostigmine and compare the two curves.'
                ],
                treatmentTitle: 'Reagents on the rack',
                treatments: Object.values(DRUGS).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Dose (µg)', 'log [M]', 'Height (mm)', '% max'],
                tableTitle: 'Concentration–response readings',
                chart: true,
                chartTitle: 'Log dose–response curve',
                chartEmpty: { xMin: 1, xMax: 200, yMin: 0, yMax: 105, logX: true, xLabel: 'ACh (µg, log scale)', yLabel: '% of maximal response' },
                viva: [
                    {
                        q: 'What does pD₂ represent?',
                        opts: ['The maximum response', 'The negative logarithm of the molar EC₅₀', 'The Hill coefficient', 'The dose ratio'],
                        ans: 1,
                        exp: 'pD₂ = −log₁₀ EC₅₀ (molar). It is a measure of agonist potency: the larger the pD₂, the lower the concentration needed for a half-maximal response.'
                    },
                    {
                        q: 'Why must the doses be added in ascending order with identical contact times?',
                        opts: ['To save drug', 'So that desensitisation and tissue fatigue do not distort the curve, and every point is read at the same phase of the response', 'Because high doses damage the lever', 'It makes no difference'],
                        ans: 1,
                        exp: 'A fixed contact time ensures each reading is taken at the same point on the time course, and ascending order minimises carry-over desensitisation from large doses.'
                    },
                    {
                        q: 'A Hill coefficient close to 1 suggests:',
                        opts: ['Negative cooperativity', 'One agonist molecule combining with one receptor, without cooperativity', 'Non-competitive antagonism', 'The tissue is dead'],
                        ans: 1,
                        exp: 'nₕ ≈ 1 is consistent with simple bimolecular agonist–receptor binding. Values appreciably above 1 imply positive cooperativity or that more than one molecule is needed to activate the receptor.'
                    },
                    {
                        q: 'After d-tubocurarine the curve shifts right but still reaches the same maximum. The dose ratio is used to calculate:',
                        opts: ['pD₂ of ACh', 'pA₂ of the antagonist', 'The Hill coefficient', 'Emax'],
                        ans: 1,
                        exp: 'The dose ratio from a competitive antagonist feeds the Schild equation, pA₂ = log(DR − 1) − log[B], giving the affinity of the antagonist for the receptor.'
                    },
                    {
                        q: 'Why is the response expressed as a percentage of the maximum rather than in millimetres?',
                        opts: ['Millimetres are inaccurate', 'It normalises for differences in tissue size, lever magnification and sensitivity between preparations', 'The kymograph cannot measure mm', 'To make the numbers smaller'],
                        ans: 1,
                        exp: 'Absolute excursion depends on how big the strip is and how the lever is set. Normalising to each tissue’s own maximum makes curves from different preparations comparable.'
                    }
                ],
                inferenceHint: 'Run the full ascending series to generate the curve; the analysis appears once at least three graded responses are on record.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS.ach;
            this.modDose = DRUGS.dtc.doses[0];
            this.records = [];
            this.chartMode = 'drc';
            this.initRig();
            this.resetAnimal();
        }

        resetAnimal() {
            this.tissueNo = (this.tissueNo || 0) + 1;
            this.resetRig();
            this.phase = 'equil';
            this.doseIdx = 0;
            this.simMin = 0;
            this.setStep(1);
            this._controls();
            this._refresh();
        }

        onSelect(tr) {
            this.drug = DRUGS[tr.id];
            if (this.drug.doses && this.drug.doses.indexOf(this.modDose) < 0) this.modDose = this.drug.doses[0];
            this._controls();
            this._refresh();
        }

        get cond() { return this.mod ? `${this.mod.drug.short} ${this.mod.dose} ${this.mod.drug.unit}` : 'control'; }
        get nextDose() { return SERIES[this.doseIdx]; }

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            const doseRow = d.kind === 'agonist'
                ? `<div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">ACh series — ascending</div>
                   <div class="lab2-seg">${SERIES.map((v, i) => `<button class="${i === this.doseIdx ? 'active' : ''}" ${i === this.doseIdx ? '' : 'disabled'}>${v}</button>`).join('')}</div>
                   <div style="font-size:10.5px;color:#64748b;margin-top:4px">${this.doseIdx < SERIES.length ? `Next: <b>${this.nextDose} µg</b> = ${molar(this.nextDose).toExponential(1)} M` : 'Series complete'}</div>`
                : `<div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">${d.short} pre-treatment dose</div>
                   <div class="lab2-seg" id="cr-mod">${d.doses.map(v => `<button data-v="${v}" class="${v === this.modDose ? 'active' : ''}">${v} ${d.unit}</button>`).join('')}</div>`;

            this.controls(`
                ${doseRow}
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin:12px 0 6px">Graph</div>
                <div class="lab2-seg" id="cr-mode">
                    <button data-m="drc" class="${this.chartMode === 'drc' ? 'active' : ''}">Log DRC</button>
                    <button data-m="hill" class="${this.chartMode === 'hill' ? 'active' : ''}">Hill plot</button>
                </div>
                <p style="margin-top:8px;font-size:11.5px;color:${this.mod ? '#0f766e' : '#64748b'}"><b>Bath condition:</b> ${this.mod ? this.mod.drug.short + ' ' + this.mod.dose + ' ' + this.mod.drug.unit + ' present' : 'plain Ringer'}</p>
            `);

            const mseg = this.$('cr-mod');
            if (mseg) mseg.querySelectorAll('button').forEach(b => b.onclick = () => {
                if (this.busy) return;
                this.modDose = +b.dataset.v;
                this._controls();
                this._refresh();
            });
            const g = this.$('cr-mode');
            if (g) g.querySelectorAll('button').forEach(b => b.onclick = () => {
                this.chartMode = b.dataset.m;
                this._controls();
                this._chart();
            });
        }

        _refresh() {
            if (this.phase === 'equil') {
                this.status('Tissue mounted under <b>1 g</b> resting tension. Equilibrate before starting the series.');
                this.actions([{ label: '⏩ Equilibrate 15 min', primary: true, onClick: () => this.equilibrate() }]);
            } else if (this.drug.kind !== 'agonist') {
                this.status(`Add <b>${this.drug.short} ${this.modDose} ${this.drug.unit}</b> as a bath pre-treatment, then run the ACh series again.`);
                this.actions([
                    { label: `💧 Add ${this.drug.short} ${this.modDose} ${this.drug.unit}`, primary: true, onClick: () => this.addModifier() },
                    { label: '↺ Restart series', onClick: () => this.restartSeries() }
                ]);
            } else if (this.doseIdx >= SERIES.length) {
                this.status('Series complete. Read the analysis, then pre-treat with d-TC or physostigmine and run it again.');
                this.actions([
                    { label: '↺ Restart series', primary: true, onClick: () => this.restartSeries() },
                    { label: '📉 Fresh tissue', onClick: () => this.resetAnimal() }
                ]);
            } else {
                this.status(`Ready — add <b>ACh ${this.nextDose} µg</b> (dose ${this.doseIdx + 1} of ${SERIES.length}), or drag the micropipette onto the bath.`);
                this.actions([
                    { label: `💧 Add ACh ${this.nextDose} µg`, primary: true, onClick: () => this.addDose() },
                    { label: '↺ Restart series', onClick: () => this.restartSeries() }
                ]);
            }
            this.hud('l', [
                { k: 'Tissue', v: '#' + this.tissueNo },
                { k: 'Dose', v: `${Math.min(this.doseIdx + 1, SERIES.length)}/${SERIES.length}` },
                { k: 'Bath', v: this.mod ? this.mod.drug.short : 'Ringer', tone: this.mod ? 'warn' : '' }
            ]);
        }

        /* ---------------- pharmacology ---------------- */
        response(d, dose) {
            let ec50 = DRUGS.ach.ec50;
            const m = this.mod;
            if (m) {
                if (m.drug.kind === 'antagonist') ec50 *= (1 + m.dose / m.drug.kb);
                else if (m.drug.kind === 'potentiator') ec50 /= m.drug.factor;
            }
            const h = DRUGS.ach.hill;
            const r = DRUGS.ach.emax * Math.pow(dose, h) / (Math.pow(ec50, h) + Math.pow(dose, h));
            return Math.max(0, r * this.vigour + M.randn() * 0.5);
        }

        /* ---------------- procedure ---------------- */
        equilibrate() {
            this.timeLapse(15, 3.2, {
                label: 'Equilibration',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(2);
                    this.toast('Baseline steady. Begin the ascending ACh series.', 'success');
                    this._refresh();
                }
            });
        }

        pipetteDropped() {
            if (this.phase === 'equil') return this.toast('Equilibrate the tissue for 15 min first.', 'warn');
            if (this.drug.kind !== 'agonist') return this.addModifier();
            if (this.doseIdx >= SERIES.length) return this.toast('Series complete — restart it or take a fresh tissue.', 'warn');
            this.addDose();
        }

        addDose() {
            if (this.busy) return;
            const dose = this.nextDose;
            this.markAddition(DRUGS.ach, dose);
            this.ampTarget = this.response(DRUGS.ach, dose);
            this.agonistIn = true;
            this.vigour = Math.max(0.85, this.vigour - 0.006);
            this.timeLapse(1, 2.6, {
                label: 'Contact time',
                onDone: () => {
                    const height = this.amp;
                    this._record(dose, height);
                    this.washBath(() => {
                        this.doseIdx++;
                        if (this.doseIdx >= SERIES.length) this.setStep(4);
                        this._controls();
                        this._refresh();
                    });
                }
            });
        }

        addModifier() {
            if (this.busy) return;
            const d = this.drug, dose = this.modDose;
            this.markAddition(d, dose);
            this.mod = { drug: d, dose };
            this.timeLapse(5, 2.4, {
                label: d.short + ' equilibration',
                onDone: () => {
                    this.markDone(d.id);
                    this.doseIdx = 0;
                    this.drug = DRUGS.ach;
                    this.toast(`${d.name} in the bath. Now repeat the whole ACh series.`, 'info');
                    this.infer(`<p><b>${d.name} ${dose} ${d.unit} added as a bath pre-treatment.</b></p><p style="margin-top:6px;color:#475569">${d.note}</p>`);
                    this.setStep(5);
                    this._controls();
                    this._refresh();
                }
            });
        }

        restartSeries() {
            if (this.busy) return;
            this.doseIdx = 0;
            this.drug = DRUGS.ach;
            this.washBath(() => { this._controls(); this._refresh(); });
        }

        _record(dose, height) {
            const cond = this.cond;
            const same = this.records.filter(r => r.cond === cond);
            const emax = Math.max(DRUGS.ach.emax * 0.35, ...same.map(r => r.height), height);
            this.records.push({ dose, height, cond, molar: molar(dose) });
            // recompute % within this condition now the max may have moved
            this.records.filter(r => r.cond === cond).forEach(r => { r.pct = r.height / emax * 100; });
            this._renderTable();
            this._chart();
            this._analyse();
        }

        _renderTable() {
            this.setRows(this.records.map(r => ({
                cells: [
                    `<b>${r.dose}</b>${r.cond === 'control' ? '' : ' <small>+' + r.cond + '</small>'}`,
                    Math.log10(r.molar).toFixed(2),
                    r.height.toFixed(1),
                    (r.pct || 0).toFixed(0) + '%'
                ],
                cls: r.pct > 50 ? 'up' : ''
            })));
        }

        /* ---------------- analysis ---------------- */
        /** Hill plot by least squares: slope = nH, x-intercept = log EC50 */
        _fit(rows) {
            if (rows.length < 3) return null;
            const emax = Math.max(...rows.map(r => r.height)) * 1.02;
            const xs = [], ys = [];
            rows.forEach(r => {
                const f = r.height / emax;
                if (f > 0.03 && f < 0.97) {
                    xs.push(Math.log10(r.molar));
                    ys.push(Math.log10(f / (1 - f)));
                }
            });
            if (xs.length < 3) return null;
            const fit = M.linreg(xs, ys);
            if (!fit.slope) return null;
            const logEC50 = -fit.intercept / fit.slope;
            return { emax, nH: fit.slope, logEC50, pD2: -logEC50, ec50M: Math.pow(10, logEC50), r2: fit.r2, xs, ys };
        }

        _conditions() {
            const out = [];
            this.records.forEach(r => { if (out.indexOf(r.cond) < 0) out.push(r.cond); });
            return out;
        }

        _chart() {
            const conds = this._conditions();
            if (!conds.length) return;
            const palette = ['#0d9488', '#dc2626', '#16a34a', '#6366f1'];

            if (this.chartMode === 'hill') {
                const series = [];
                let xlo = Infinity, xhi = -Infinity, ylo = Infinity, yhi = -Infinity;
                conds.forEach((c, i) => {
                    const f = this._fit(this.records.filter(r => r.cond === c));
                    if (!f) return;
                    const col = palette[i % palette.length];
                    const pts = f.xs.map((x, k) => [x, f.ys[k]]);
                    pts.forEach(p => {
                        xlo = Math.min(xlo, p[0]); xhi = Math.max(xhi, p[0]);
                        ylo = Math.min(ylo, p[1]); yhi = Math.max(yhi, p[1]);
                    });
                    series.push({ name: c, color: col, type: 'scatter', r: 3.6, points: pts });
                    series.push({
                        color: col, width: 1.4, dashed: true,
                        points: [[f.xs[0], f.nH * f.xs[0] + (f.logEC50 * -f.nH)], [f.xs[f.xs.length - 1], f.nH * f.xs[f.xs.length - 1] + (f.logEC50 * -f.nH)]]
                    });
                });
                if (!series.length) return;
                this.chart.draw({
                    xMin: xlo - 0.3, xMax: xhi + 0.3,
                    yMin: Math.min(-1.5, ylo - 0.3), yMax: Math.max(1.5, yhi + 0.3),
                    xLabel: 'log [ACh] (M)', yLabel: 'log (E / (Emax − E))',
                    xFmt: v => v.toFixed(1),
                    annotations: [{ y: 0, color: '#94a3b8', text: 'EC₅₀' }],
                    series
                });
                return;
            }

            // sigmoid log dose–response
            const series = [];
            conds.forEach((c, i) => {
                const rows = this.records.filter(r => r.cond === c);
                const col = palette[i % palette.length];
                series.push({
                    name: c, color: col, type: 'scatter', r: 4,
                    points: rows.map(r => [r.dose, r.pct || 0])
                });
                const f = this._fit(rows);
                if (f) {
                    const curve = [];
                    for (let k = 0; k <= 40; k++) {
                        const ug = SERIES[0] * 0.5 * Math.pow((SERIES[SERIES.length - 1] * 3) / (SERIES[0] * 0.5), k / 40);
                        const a = molar(ug);
                        const e = 100 * Math.pow(a, f.nH) / (Math.pow(f.ec50M, f.nH) + Math.pow(a, f.nH));
                        curve.push([ug, e]);
                    }
                    series.push({ color: col, width: 1.8, points: curve });
                }
            });
            this.chart.draw({
                logX: true,
                xMin: SERIES[0] * 0.5, xMax: SERIES[SERIES.length - 1] * 2.2,
                yMin: 0, yMax: 105,
                xLabel: 'ACh (µg per 20 mL bath, log scale)',
                yLabel: '% of maximal response',
                xFmt: v => v >= 1 ? String(Math.round(v)) : v.toFixed(1),
                annotations: [{ y: 50, color: '#cbd5e1' }],
                series
            });
        }

        _analyse() {
            const conds = this._conditions();
            const fits = conds.map(c => ({ cond: c, f: this._fit(this.records.filter(r => r.cond === c)) })).filter(x => x.f);
            if (!fits.length) {
                this.infer('<p>Add at least three graded doses to generate a curve.</p>');
                return;
            }
            let html = '<table style="width:100%;font-size:11.5px;border-collapse:collapse">';
            html += '<tr style="color:#64748b"><th style="text-align:left">Condition</th><th>EC₅₀ (M)</th><th>pD₂</th><th>n<sub>H</sub></th></tr>';
            fits.forEach(x => {
                html += `<tr><td><b>${x.cond}</b></td><td style="text-align:center">${x.f.ec50M.toExponential(1)}</td><td style="text-align:center"><b>${x.f.pD2.toFixed(2)}</b></td><td style="text-align:center">${x.f.nH.toFixed(2)}</td></tr>`;
            });
            html += '</table>';

            const ctrl = fits.find(x => x.cond === 'control');
            const other = fits.filter(x => x.cond !== 'control').pop();
            if (ctrl && other) {
                const dr = other.f.ec50M / ctrl.f.ec50M;
                if (dr > 1.6) {
                    const bMol = this.mod ? (this.mod.dose * 1e-6) / 300 / BATH_L : null;  // d-TC ≈ 300 g/mol equiv for display
                    const pA2 = bMol ? (Math.log10(dr - 1) - Math.log10(bMol)) : null;
                    html += `<p style="margin-top:8px;padding:8px;background:#fef2f2;border-radius:6px">Dose ratio <b>${dr.toFixed(1)}</b> — a parallel rightward shift with the maximum preserved, i.e. <b>competitive antagonism</b>.${pA2 ? ` Schild estimate: pA₂ ≈ <b>${pA2.toFixed(2)}</b>.` : ''}</p>`;
                } else if (dr < 0.65) {
                    html += `<p style="margin-top:8px;padding:8px;background:#f0fdf4;border-radius:6px">The curve has moved <b>left by ${(1 / dr).toFixed(1)}-fold</b> — ACh is <b>potentiated</b>, consistent with cholinesterase inhibition.</p>`;
                } else {
                    html += '<p style="margin-top:8px;padding:8px;background:#f1f5f9;border-radius:6px">The curves are essentially superimposable — no significant change in agonist potency.</p>';
                }
            } else {
                html += `<p style="margin-top:8px;color:#475569">n<sub>H</sub> near 1 indicates simple agonist–receptor binding without cooperativity. Pre-treat with d-tubocurarine and repeat the series to measure a dose ratio.</p>`;
            }
            this.infer(html);
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.updateRig(dt);
            this.hud('r', [
                { k: 'Response', v: this.amp.toFixed(1) + ' mm' },
                { k: 'Lever', v: '×' + LAB.RIG.MAG.toFixed(0) },
                { k: 'Clock', v: LAB.fmtClock(this.simMin) }
            ]);
        }

        draw(ctx) { this.drawRig(ctx); }

        drawTissue(ctx, o) {
            const { x, topY, hookY, len, w } = o;
            const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
            g.addColorStop(0, '#8d4f4b'); g.addColorStop(0.3, '#c98a86');
            g.addColorStop(0.5, '#dba9a3'); g.addColorStop(0.8, '#b06e69'); g.addColorStop(1, '#7c423f');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.45, topY);
            ctx.bezierCurveTo(x - w, topY + len * 0.3, x - w, hookY - len * 0.3, x - w * 0.45, hookY);
            ctx.lineTo(x + w * 0.45, hookY);
            ctx.bezierCurveTo(x + w, hookY - len * 0.3, x + w, topY + len * 0.3, x + w * 0.45, topY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(90,40,38,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.1;
            for (let i = 1; i < 5; i++) {
                const yy = topY + len * (i / 5);
                ctx.beginPath();
                ctx.moveTo(x - w * 0.8, yy);
                ctx.quadraticCurveTo(x, yy + 2.5, x + w * 0.8, yy);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.ellipse(x - w * 0.35, topY + len * 0.35, w * 0.14, len * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        }
    }

    LAB.register(13, AchCRC);
})();
