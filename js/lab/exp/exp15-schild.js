/**
 * EXP 15 — Determination of pA₂ by the Schild plot
 *
 * Exp 14 measures one dose ratio. This experiment measures several: the
 * histamine cumulative curve is run on guinea pig ileum first alone, then in
 * the presence of each of four concentrations of mepyramine. Each curve yields
 * an EC50, and each EC50 a dose ratio against the control.
 *
 * Plotting log(DR − 1) against log[B] gives the Schild regression:
 *   - the slope tests the model — it should be indistinguishable from 1 for
 *     simple competitive antagonism at a single receptor population
 *   - the intercept on the x-axis is −pA2, the concentration of antagonist
 *     that doubles the agonist EC50
 *
 * pA2 of mepyramine at H1 is about 9.1, and recovering that number from the
 * student's own readings is the point of the exercise.
 */
(function () {
    const { M } = LAB;

    const BATH_L = 0.020;
    const MW_HIST = 307.14;
    const MW_MEP = 401.5;
    const histM = ug => LAB.PHARM.molar(ug, MW_HIST, BATH_L);
    const mepM = ng => LAB.PHARM.molar(ng / 1000, MW_MEP, BATH_L);

    const CUM = [0.05, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2, 6.4];
    const LEVELS = [0, 2, 6, 20, 60];      // ng mepyramine; 0 = control curve
    const EC50_M = 1.0e-7;
    const KB_MEP = 7.9e-10;
    const EMAX = 46;
    const HILL = 1.6;

    const HIST = {
        id: 'histamine', name: 'Histamine', short: 'His', cls: 'H₁ agonist',
        color: '#db2777', kind: 'agonist', unit: 'µg'
    };
    const MEP = {
        id: 'mepyramine', name: 'Mepyramine', short: 'Mep', cls: 'Competitive H₁ antagonist',
        color: '#dc2626', kind: 'antagonist', unit: 'ng'
    };

    class Schild extends LAB.OrganBath {
        rig() {
            return {
                solution: "Tyrode's solution", tempC: 37, restLen: 88,
                spont: { amp: 1.5, period: 5.2 }, tissueLabel: 'Guinea pig ileum'
            };
        }

        config() {
            return {
                room: { benchY: LAB.RIG.BENCH, seed: 9 },
                syringe: false,
                steps: [
                    'Mount <b>guinea pig ileum</b> in Tyrode’s solution at 37 °C and equilibrate for 30 min.',
                    'Run a <b>control</b> cumulative histamine curve to its maximum and wash out.',
                    'Equilibrate the <b>lowest</b> concentration of mepyramine for 10 min, then repeat the whole curve.',
                    'Wash, and repeat for each higher antagonist concentration in turn — four curves in all.',
                    'For each curve read the EC₅₀ and compute the <b>dose ratio</b> against the control.',
                    'Plot <b>log(DR − 1)</b> against <b>log[B]</b>. The slope tests competitiveness; the x-intercept gives <b>pA₂</b>.'
                ],
                treatmentTitle: 'Reagents on the rack',
                treatments: [
                    { id: 'histamine', name: HIST.name, short: HIST.short, cls: HIST.cls, color: HIST.color },
                    { id: 'mepyramine', name: MEP.name, short: MEP.short, cls: MEP.cls, color: MEP.color }
                ],
                table: ['Curve', '[B] (M)', 'EC₅₀ (M)', 'DR'],
                tableTitle: 'Dose ratios',
                chart: true,
                chartTitle: 'Schild plot',
                chartEmpty: { xMin: -10, xMax: -7, yMin: -1, yMax: 1.5, xLabel: 'log [mepyramine] (M)', yLabel: 'log (DR − 1)' },
                viva: [
                    {
                        q: 'What does pA₂ measure?',
                        opts: ['The potency of the agonist', 'The negative log of the antagonist concentration that requires a doubling of agonist concentration to restore the original response', 'The maximum response', 'The Hill coefficient'],
                        ans: 1,
                        exp: 'pA₂ = −log[B] at a dose ratio of 2. For a simple competitive antagonist it equals pKв, the negative log of the equilibrium dissociation constant, so it is a direct measure of affinity.'
                    },
                    {
                        q: 'A Schild slope significantly different from 1 suggests:',
                        opts: ['The assay is perfect', 'The antagonism is not simple competitive — there may be more than one receptor, removal of drug, or non-equilibrium conditions', 'The agonist is too potent', 'The tissue is too sensitive'],
                        ans: 1,
                        exp: 'Unit slope is predicted by simple competitive occupancy theory. Departures point to receptor heterogeneity, uptake or metabolism of the drugs, or failure to reach equilibrium.'
                    },
                    {
                        q: 'Why must the antagonist be equilibrated with the tissue before the agonist curve is repeated?',
                        opts: ['To warm it up', 'Because the dose ratio is only valid once antagonist binding has reached equilibrium with the receptors', 'To dissolve the antagonist', 'To wash out histamine'],
                        ans: 1,
                        exp: 'The Schild equation assumes equilibrium occupancy by the antagonist. Too short a contact time underestimates the block and gives a falsely low pA₂.'
                    },
                    {
                        q: 'pA₂ equals pKв only when:',
                        opts: ['The antagonist is irreversible', 'The antagonism is simple, competitive and reversible, and the Schild slope is 1', 'The agonist is a partial agonist', 'The tissue is from a guinea pig'],
                        ans: 1,
                        exp: 'Under those conditions the Schild intercept is a true thermodynamic affinity constant. If the slope departs from unity, pA₂ remains a useful empirical number but is no longer pKв.'
                    },
                    {
                        q: 'Why is the same tissue used for all the curves rather than a fresh one each time?',
                        opts: ['To save animals only', 'Because the dose ratio is a within-tissue comparison — using one preparation cancels differences in sensitivity between tissues', 'Because fresh tissue does not respond', 'To keep the bath clean'],
                        ans: 1,
                        exp: 'DR is a ratio of two EC₅₀ values measured on the same preparation, so tissue-to-tissue variation cancels out. That is why the control curve must come from the same ileum.'
                    }
                ],
                inferenceHint: 'Run the control curve, then one curve at each antagonist concentration. The Schild regression appears once two dose ratios are available.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = HIST;
            this.levelIdx = 0;
            this.records = [];
            this.fits = {};
            this.chartMode = 'schild';
            this.initRig();
            this.resetAnimal();
        }

        resetAnimal() {
            this.tissueNo = (this.tissueNo || 0) + 1;
            this.resetRig();
            this.phase = 'equil';
            this.idx = 0;
            this.levelIdx = 0;
            this.simMin = 0;
            this.setStep(1);
            this._controls();
            this._refresh();
        }

        onSelect(tr) { this.drug = tr.id === 'mepyramine' ? MEP : HIST; this._refresh(); }

        get level() { return LEVELS[this.levelIdx]; }
        get cond() { return this.level === 0 ? 'control' : `Mep ${this.level} ng`; }
        get done() { return this.idx >= CUM.length; }
        get allDone() { return this.levelIdx >= LEVELS.length - 1 && this.done; }

        /* ---------------- pharmacology ---------------- */
        response(totalUg) {
            let ec50 = EC50_M;
            if (this.level > 0) ec50 *= (1 + mepM(this.level) / KB_MEP);
            const a = histM(totalUg);
            const r = EMAX * Math.pow(a, HILL) / (Math.pow(ec50, HILL) + Math.pow(a, HILL));
            return Math.max(0, r * this.vigour + M.randn() * 0.45);
        }

        /* ---------------- left column ---------------- */
        _controls() {
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Curve series</div>
                <div class="lab2-seg">${LEVELS.map((v, i) => `<button class="${i === this.levelIdx ? 'active' : ''}" disabled>${v === 0 ? 'ctrl' : v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">
                    ${this.level === 0 ? 'Control curve — no antagonist' : `Mepyramine <b>${this.level} ng</b> = ${mepM(this.level).toExponential(1)} M`}
                </div>
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin:12px 0 6px">Graph</div>
                <div class="lab2-seg" id="sc-mode">
                    <button data-m="schild" class="${this.chartMode === 'schild' ? 'active' : ''}">Schild</button>
                    <button data-m="curves" class="${this.chartMode === 'curves' ? 'active' : ''}">Curves</button>
                </div>
                <div style="font-size:10.5px;color:#64748b;margin-top:8px">Cumulative step ${Math.min(this.idx + 1, CUM.length)} of ${CUM.length}</div>
            `);
            const g = this.$('sc-mode');
            if (g) g.querySelectorAll('button').forEach(b => b.onclick = () => {
                this.chartMode = b.dataset.m;
                this._controls();
                this._chart();
            });
        }

        _refresh() {
            if (this.phase === 'equil') {
                this.status('Ileum mounted at <b>37 °C</b>. Equilibrate before the control curve.');
                this.actions([{ label: '⏩ Equilibrate 30 min', primary: true, onClick: () => this.equilibrate() }]);
            } else if (this.phase === 'needBlocker') {
                this.status(`Wash complete. Equilibrate <b>mepyramine ${this.level} ng</b> for 10 min, then repeat the curve.`);
                this.actions([{ label: `💧 Equilibrate Mep ${this.level} ng`, primary: true, onClick: () => this.addBlocker() }]);
            } else if (this.done) {
                const last = this.levelIdx >= LEVELS.length - 1;
                this.status(last
                    ? 'All four antagonist curves recorded. Read the Schild regression below.'
                    : `Curve at ${this.cond} complete. Wash out and move to the next antagonist concentration.`);
                this.actions([
                    last
                        ? { label: '📉 Fresh tissue', primary: true, onClick: () => this.resetAnimal() }
                        : { label: '🚿 Wash → next concentration', primary: true, onClick: () => this.nextLevel() }
                ]);
            } else {
                this.status(`${this.cond} curve — next cumulative total <b>${CUM[this.idx]} µg</b> (step ${this.idx + 1}/${CUM.length}).`);
                this.actions([
                    { label: '▶ Run whole curve', primary: true, onClick: () => this.runCurve() },
                    { label: `💧 Add to ${CUM[this.idx]} µg`, onClick: () => this.addNext() }
                ]);
            }
            this.hud('l', [
                { k: 'Tissue', v: '#' + this.tissueNo },
                { k: 'Curve', v: `${this.levelIdx + 1}/${LEVELS.length}` },
                { k: '[B]', v: this.level === 0 ? 'none' : this.level + ' ng', tone: this.level ? 'warn' : '' }
            ]);
        }

        /* ---------------- procedure ---------------- */
        equilibrate() {
            this.timeLapse(30, 3.2, {
                label: 'Equilibration',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(1);
                    this.toast('Baseline steady. Run the control curve.', 'success');
                    this._refresh();
                }
            });
        }

        pipetteDropped() {
            if (this.phase === 'equil') return this.toast('Equilibrate the tissue for 30 min first.', 'warn');
            if (this.phase === 'needBlocker') return this.addBlocker();
            if (this.done) return this.toast('Curve complete — move to the next concentration.', 'warn');
            this.addNext();
        }

        addNext(cb) {
            if (this.busy) return;
            const total = CUM[this.idx];
            const inc = +(total - (this.idx ? CUM[this.idx - 1] : 0)).toFixed(3);
            this.markAddition(HIST, inc);
            this.ampTarget = this.response(total);
            this.agonistIn = true;
            this.timeLapse(0.5, 1.5, {
                label: 'Plateau',
                onDone: () => {
                    this.records.push({ cond: this.cond, level: this.level, molar: histM(total), height: this.amp });
                    this.idx++;
                    if (this.done) { this._fitCurve(); this.setStep(4); }
                    this._controls();
                    this._refresh();
                    this._chart();
                    if (cb) cb();
                }
            });
        }

        runCurve() {
            if (this.busy || this.done) return;
            const step = () => { if (!this.done) this.addNext(step); };
            step();
        }

        nextLevel() {
            if (this.busy) return;
            this.washBath(() => {
                this.levelIdx++;
                this.idx = 0;
                this.phase = 'needBlocker';
                this.mod = null;
                this.setStep(2);
                this._controls();
                this._refresh();
            });
        }

        addBlocker() {
            if (this.busy) return;
            this.markAddition(MEP, this.level);
            this.mod = { drug: MEP, dose: this.level };
            this.timeLapse(10, 2.4, {
                label: 'Mepyramine equilibration',
                onDone: () => {
                    this.markDone('mepyramine');
                    this.phase = 'ready';
                    this.setStep(3);
                    this.toast(`Mepyramine ${this.level} ng equilibrated. Repeat the cumulative curve.`, 'info');
                    this._refresh();
                }
            });
        }

        /* ---------------- analysis ---------------- */
        _fitCurve() {
            const cond = this.cond;
            const f = LAB.PHARM.hillFit(this.records.filter(r => r.cond === cond).map(r => ({ conc: r.molar, resp: r.height })));
            if (f) this.fits[cond] = { fit: f, level: this.level };
            this._renderTable();
            this._analyse();
        }

        _schildPoints() {
            const ctrl = this.fits['control'];
            if (!ctrl) return [];
            return Object.keys(this.fits)
                .filter(k => k !== 'control')
                .map(k => ({ cond: k, B: mepM(this.fits[k].level), dr: this.fits[k].fit.ec50 / ctrl.fit.ec50, ec50: this.fits[k].fit.ec50 }))
                .sort((a, b) => a.B - b.B);
        }

        _renderTable() {
            const ctrl = this.fits['control'];
            const rows = [];
            if (ctrl) rows.push({ cells: ['<b>control</b>', '—', ctrl.fit.ec50.toExponential(1), '1.00'], cls: '' });
            this._schildPoints().forEach(p => {
                rows.push({ cells: [`<b>${p.cond}</b>`, p.B.toExponential(1), p.ec50.toExponential(1), `<b>${p.dr.toFixed(2)}</b>`], cls: 'up' });
            });
            this.setRows(rows);
        }

        _chart() {
            if (this.chartMode === 'curves') return this._chartCurves();
            const pts = this._schildPoints();
            const sch = LAB.PHARM.schild(pts);
            if (!sch) {
                this.chart.draw({ xMin: -10, xMax: -7, yMin: -1, yMax: 1.5, xLabel: 'log [mepyramine] (M)', yLabel: 'log (DR − 1)', series: [] });
                return;
            }
            const xlo = Math.min(...sch.xs) - 0.6, xhi = Math.max(...sch.xs) + 0.4;
            const line = [[xlo, sch.slope * xlo + sch.intercept], [xhi, sch.slope * xhi + sch.intercept]];
            this.chart.draw({
                xMin: xlo, xMax: xhi,
                yMin: Math.min(-0.6, ...sch.ys) - 0.3, yMax: Math.max(1.2, ...sch.ys) + 0.3,
                xLabel: 'log [mepyramine] (M)',
                yLabel: 'log (DR − 1)',
                xFmt: v => v.toFixed(1),
                annotations: [
                    { y: 0, color: '#94a3b8' },
                    { x: -sch.pA2, color: '#dc2626', text: 'pA₂ ' + sch.pA2.toFixed(2) }
                ],
                series: [
                    { name: 'Schild fit', color: '#dc2626', width: 1.8, dashed: true, points: line },
                    { color: '#db2777', type: 'scatter', r: 4.2, points: sch.xs.map((x, i) => [x, sch.ys[i]]) }
                ]
            });
        }

        _chartCurves() {
            const conds = [];
            this.records.forEach(r => { if (conds.indexOf(r.cond) < 0) conds.push(r.cond); });
            const palette = ['#0d9488', '#db2777', '#dc2626', '#7c3aed', '#f59e0b'];
            const series = [];
            conds.forEach((c, i) => {
                const rows = this.records.filter(r => r.cond === c);
                const emax = Math.max(...rows.map(r => r.height)) || 1;
                const col = palette[i % palette.length];
                series.push({ name: c, color: col, markers: true, width: 1.6, points: rows.map(r => [r.molar, r.height / emax * 100]) });
            });
            this.chart.draw({
                logX: true, xMin: 5e-10, xMax: 1e-4, yMin: 0, yMax: 105,
                xLabel: '[histamine] (M, log scale)', yLabel: '% of own maximum',
                xFmt: v => Math.log10(v).toFixed(0),
                annotations: [{ y: 50, color: '#cbd5e1' }],
                series
            });
        }

        _analyse() {
            const pts = this._schildPoints();
            if (!pts.length) {
                this.infer('<p>Control curve recorded. Now run a curve at each mepyramine concentration — two or more dose ratios are needed for the regression.</p>');
                return;
            }
            const sch = LAB.PHARM.schild(pts);
            let html = '<table style="width:100%;font-size:11.5px;border-collapse:collapse">';
            html += '<tr style="color:#64748b"><th style="text-align:left">[B]</th><th>DR</th><th>log(DR−1)</th></tr>';
            pts.forEach(p => {
                html += `<tr><td>${p.B.toExponential(1)}</td><td style="text-align:center">${p.dr.toFixed(2)}</td><td style="text-align:center">${p.dr > 1.05 ? Math.log10(p.dr - 1).toFixed(2) : '—'}</td></tr>`;
            });
            html += '</table>';

            if (sch) {
                const slopeOK = Math.abs(sch.slope - 1) < 0.2;
                html += `<p style="margin-top:8px;padding:8px;background:#fef2f2;border-radius:6px">
                    Schild regression: slope <b>${sch.slope.toFixed(2)}</b> (r² ${sch.r2.toFixed(3)}), <b>pA₂ = ${sch.pA2.toFixed(2)}</b>.<br>
                    ${slopeOK
                        ? 'The slope is not significantly different from <b>1</b>, so the antagonism is simple and competitive at a single receptor population — pA₂ may be read as pKв.'
                        : 'The slope departs from 1, so the simple competitive model does not fully hold here; pA₂ remains a useful empirical measure but is not a true pKв.'}
                </p>`;
                if (pts.length < 3) html += '<p style="margin-top:6px;color:#475569">Add the remaining antagonist concentrations for a better-determined line.</p>';
            }
            this.infer(html);
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.updateRig(dt);
            this.hud('r', [
                { k: 'Response', v: this.amp.toFixed(1) + ' mm' },
                { k: 'Ratios', v: String(this._schildPoints().length) },
                { k: 'Clock', v: LAB.fmtClock(this.simMin) }
            ]);
        }

        draw(ctx) { this.drawRig(ctx); }
        drawTissue(ctx, o) { LAB.TISSUE.ileum(ctx, o, true); }
    }

    LAB.register(15, Schild);
})();
