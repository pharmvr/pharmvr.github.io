/**
 * EXP 14 — Concentration–response curve of histamine on guinea pig ileum
 *
 * The classical H1 bioassay tissue. Unlike the interrupted series of exp 13,
 * this curve is built by CUMULATIVE addition (the Van Rossum method): each
 * successive dose goes in without washing, so the bath concentration climbs in
 * steps and the trace walks up in a staircase. The tissue is washed only once
 * the plateau of the curve has been reached.
 *
 * Mepyramine is then equilibrated with the tissue and the whole curve repeated.
 * A competitive H1 antagonist moves it to the right in parallel without
 * depressing the maximum, which yields a dose ratio and a one-point pA2.
 * Exp 15 extends this to several antagonist concentrations for a full Schild plot.
 */
(function () {
    const { M } = LAB;

    const BATH_L = 0.020;
    const MW_HIST = 307.14;   // histamine acid phosphate
    const MW_MEP = 401.5;     // mepyramine maleate

    const histM = ug => LAB.PHARM.molar(ug, MW_HIST, BATH_L);
    const mepM = ng => LAB.PHARM.molar(ng / 1000, MW_MEP, BATH_L);

    /** cumulative µg of histamine in the bath after each successive addition */
    const CUM = [0.05, 0.1, 0.2, 0.4, 0.8, 1.6, 3.2];

    const EC50_M = 1.0e-7;    // histamine on guinea pig ileum
    const KB_MEP = 7.9e-10;   // mepyramine → pA2 ≈ 9.1
    const EMAX = 46;
    const HILL = 1.6;

    const DRUGS = {
        histamine: {
            id: 'histamine', name: 'Histamine', short: 'His', cls: 'H₁ agonist',
            color: '#db2777', kind: 'agonist', unit: 'µg',
            note: 'Histamine contracts the ileum through <b>H₁</b> receptors on the smooth muscle, raising IP₃ and intracellular Ca²⁺.'
        },
        mepyramine: {
            id: 'mepyramine', name: 'Mepyramine', short: 'Mep', cls: 'Competitive H₁ antagonist',
            color: '#dc2626', kind: 'antagonist', unit: 'ng', doses: [2, 6, 20, 60],
            note: 'Mepyramine competes with histamine for the H₁ receptor. The block is <b>surmountable</b>, so the curve shifts right in parallel and the maximum is still reached.'
        }
    };

    class HistamineCRC extends LAB.OrganBath {
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
                    'Mount a 2 cm segment of <b>guinea pig ileum</b> in the 20 mL bath of Tyrode’s solution at <b>37 °C</b>, gassed and under 0.5 g tension.',
                    'Equilibrate for <b>30 min</b> until the baseline is steady.',
                    'Add the first dose of histamine. When the response plateaus, add the next <b>without washing</b> — the bath concentration accumulates.',
                    'Continue until two successive doses give no further increase: the <b>maximum</b> has been reached. Now wash out 3×.',
                    'Equilibrate <b>mepyramine</b> with the tissue for 10 min and repeat the whole cumulative curve.',
                    'Compare the two curves: a parallel rightward shift with the same maximum means <b>competitive antagonism</b>.'
                ],
                treatmentTitle: 'Reagents on the rack',
                treatments: Object.values(DRUGS).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Cumulative (µg)', 'log [M]', 'Height (mm)', '% max'],
                tableTitle: 'Cumulative curve readings',
                chart: true,
                chartTitle: 'Cumulative log concentration–response',
                chartEmpty: { xMin: 1e-9, xMax: 1e-6, yMin: 0, yMax: 105, logX: true, xLabel: 'log [histamine] (M)', yLabel: '% of maximal response' },
                viva: [
                    {
                        q: 'What is the advantage of a cumulative concentration–response curve over an interrupted one?',
                        opts: ['It uses less drug', 'A whole curve is obtained on one tissue in a fraction of the time, with less tissue fatigue from repeated washing', 'It gives a larger maximum', 'It avoids the need for a kymograph'],
                        ans: 1,
                        exp: 'Van Rossum’s cumulative method builds the entire curve on one preparation without washing between doses, so the tissue deteriorates less and the curve is internally consistent.'
                    },
                    {
                        q: 'Why is guinea pig ileum the preferred tissue for assaying histamine?',
                        opts: ['It is the cheapest', 'It is highly sensitive to histamine, responds over a narrow reproducible range, and has little spontaneous activity', 'It contains no receptors', 'It survives without oxygen'],
                        ans: 1,
                        exp: 'The guinea pig ileum responds to histamine at concentrations around 10⁻⁸–10⁻⁶ M with a graded, reproducible contraction and a quiet baseline, which is exactly what a bioassay needs.'
                    },
                    {
                        q: 'In the presence of mepyramine the maximum response is still reached, but only at higher histamine concentrations. This is:',
                        opts: ['Non-competitive antagonism', 'Competitive, surmountable antagonism', 'Physiological antagonism', 'Desensitisation'],
                        ans: 1,
                        exp: 'Surmountability is the defining feature: because agonist and antagonist compete for the same site, enough agonist always displaces the blocker and the full maximum is restored.'
                    },
                    {
                        q: 'The dose ratio (DR) in a competitive block is:',
                        opts: ['The ratio of the two maxima', 'The factor by which the agonist EC₅₀ is increased by the antagonist', 'The Hill coefficient', 'The ratio of contact times'],
                        ans: 1,
                        exp: 'DR = EC₅₀(with antagonist) / EC₅₀(control). It feeds the Schild equation, pA₂ = log(DR − 1) − log[B].'
                    },
                    {
                        q: 'Why must the tissue be washed and allowed to recover before repeating the curve?',
                        opts: ['To remove the accumulated agonist and restore the resting baseline so the second curve starts from the same point', 'To cool the bath', 'To add more oxygen', 'It is not necessary'],
                        ans: 0,
                        exp: 'Residual histamine would pre-contract the tissue and compress the second curve. Washing restores the baseline so the two curves are comparable.'
                    }
                ],
                inferenceHint: 'Run the control curve to its maximum, then equilibrate mepyramine and run it again to measure the shift.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS.histamine;
            this.modDose = DRUGS.mepyramine.doses[1];
            this.records = [];
            this.initRig();
            this.resetAnimal();
        }

        resetAnimal() {
            this.tissueNo = (this.tissueNo || 0) + 1;
            this.resetRig();
            this.phase = 'equil';
            this.idx = 0;
            this.simMin = 0;
            this.setStep(1);
            this._controls();
            this._refresh();
        }

        onSelect(tr) {
            this.drug = DRUGS[tr.id];
            this._controls();
            this._refresh();
        }

        get cond() { return this.mod ? `Mep ${this.mod.dose} ng` : 'control'; }
        get done() { return this.idx >= CUM.length; }

        /* ---------------- pharmacology ---------------- */
        response(totalUg) {
            let ec50 = EC50_M;
            if (this.mod) ec50 *= (1 + mepM(this.mod.dose) / KB_MEP);
            const a = histM(totalUg);
            const r = EMAX * Math.pow(a, HILL) / (Math.pow(ec50, HILL) + Math.pow(a, HILL));
            return Math.max(0, r * this.vigour + M.randn() * 0.45);
        }

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            const body = d.kind === 'agonist'
                ? `<div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Cumulative histamine (µg in bath)</div>
                   <div class="lab2-seg">${CUM.map((v, i) => `<button class="${i === this.idx ? 'active' : ''}" disabled>${v}</button>`).join('')}</div>
                   <div style="font-size:10.5px;color:#64748b;margin-top:4px">${this.done ? 'Curve complete — wash out.' : `Next total: <b>${CUM[this.idx]} µg</b> = ${histM(CUM[this.idx]).toExponential(1)} M`}</div>`
                : `<div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Mepyramine concentration</div>
                   <div class="lab2-seg" id="hc-mod">${d.doses.map(v => `<button data-v="${v}" class="${v === this.modDose ? 'active' : ''}">${v} ng</button>`).join('')}</div>
                   <div style="font-size:10.5px;color:#64748b;margin-top:4px">= ${mepM(this.modDose).toExponential(1)} M in the bath</div>`;

            this.controls(`${body}
                <p style="margin-top:10px;font-size:11.5px;color:${this.mod ? '#0f766e' : '#64748b'}"><b>Bath condition:</b> ${this.mod ? 'mepyramine ' + this.mod.dose + ' ng present' : "plain Tyrode's"}</p>
            `);
            const seg = this.$('hc-mod');
            if (seg) seg.querySelectorAll('button').forEach(b => b.onclick = () => {
                if (this.busy) return;
                this.modDose = +b.dataset.v;
                this._controls();
                this._refresh();
            });
        }

        _refresh() {
            if (this.phase === 'equil') {
                this.status('Ileum mounted at <b>37 °C</b> under 0.5 g tension. Equilibrate before starting.');
                this.actions([{ label: '⏩ Equilibrate 30 min', primary: true, onClick: () => this.equilibrate() }]);
            } else if (this.drug.kind === 'antagonist') {
                this.status(`Equilibrate <b>mepyramine ${this.modDose} ng</b> with the tissue, then repeat the cumulative curve.`);
                this.actions([
                    { label: `💧 Equilibrate Mep ${this.modDose} ng`, primary: true, onClick: () => this.addModifier() },
                    { label: '🚿 Wash & restart curve', onClick: () => this.restart() }
                ]);
            } else if (this.done) {
                this.status('Maximum reached — the curve is complete. Wash out, then equilibrate mepyramine and repeat.');
                this.actions([
                    { label: '🚿 Wash out & restart', primary: true, onClick: () => this.restart() },
                    { label: '📉 Fresh tissue', onClick: () => this.resetAnimal() }
                ]);
            } else {
                this.status(`Add the next increment — cumulative total <b>${CUM[this.idx]} µg</b> (step ${this.idx + 1} of ${CUM.length}). No washing between doses.`);
                this.actions([
                    { label: `💧 Add to ${CUM[this.idx]} µg`, primary: true, onClick: () => this.addNext() },
                    { label: '▶ Run whole curve', onClick: () => this.runCurve() },
                    { label: '🚿 Wash & restart', onClick: () => this.restart() }
                ]);
            }
            this.hud('l', [
                { k: 'Tissue', v: '#' + this.tissueNo },
                { k: 'Step', v: `${Math.min(this.idx + 1, CUM.length)}/${CUM.length}` },
                { k: 'Bath', v: this.mod ? 'Mep' : "Tyrode's", tone: this.mod ? 'warn' : '' }
            ]);
        }

        /* ---------------- procedure ---------------- */
        equilibrate() {
            this.timeLapse(30, 3.2, {
                label: 'Equilibration',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(2);
                    this.toast('Baseline steady. Begin the cumulative curve.', 'success');
                    this._refresh();
                }
            });
        }

        pipetteDropped() {
            if (this.phase === 'equil') return this.toast('Equilibrate the tissue for 30 min first.', 'warn');
            if (this.drug.kind === 'antagonist') return this.addModifier();
            if (this.done) return this.toast('Curve complete — wash out before starting another.', 'warn');
            this.addNext();
        }

        addNext(cb) {
            if (this.busy) return;
            const total = CUM[this.idx];
            const inc = +(total - (this.idx ? CUM[this.idx - 1] : 0)).toFixed(3);
            this.markAddition(DRUGS.histamine, inc);
            this.ampTarget = this.response(total);
            this.agonistIn = true;
            this.timeLapse(0.5, 1.9, {
                label: 'Plateau',
                onDone: () => {
                    this._record(total, this.amp);
                    this.idx++;
                    if (this.done) this.setStep(3);
                    this._controls();
                    this._refresh();
                    if (cb) cb();
                }
            });
        }

        /** convenience: walk the whole staircase without 7 separate clicks */
        runCurve() {
            if (this.busy || this.done) return;
            const step = () => { if (!this.done) this.addNext(step); };
            step();
        }

        addModifier() {
            if (this.busy) return;
            const dose = this.modDose;
            this.markAddition(DRUGS.mepyramine, dose);
            this.mod = { drug: DRUGS.mepyramine, dose };
            this.timeLapse(10, 2.6, {
                label: 'Mepyramine equilibration',
                onDone: () => {
                    this.markDone('mepyramine');
                    this.idx = 0;
                    this.drug = DRUGS.histamine;
                    this.setStep(4);
                    this.toast('Mepyramine equilibrated. Repeat the cumulative curve.', 'info');
                    this.infer(`<p><b>Mepyramine ${dose} ng (${mepM(dose).toExponential(1)} M) equilibrated with the tissue.</b></p><p style="margin-top:6px;color:#475569">${DRUGS.mepyramine.note}</p>`);
                    this._controls();
                    this._refresh();
                }
            });
        }

        restart() {
            if (this.busy) return;
            this.idx = 0;
            this.drug = DRUGS.histamine;
            this.washBath(() => { this._controls(); this._refresh(); });
        }

        _record(totalUg, height) {
            const cond = this.cond;
            const same = this.records.filter(r => r.cond === cond);
            const emax = Math.max(EMAX * 0.3, ...same.map(r => r.height), height);
            this.records.push({ totalUg, molar: histM(totalUg), height, cond });
            this.records.filter(r => r.cond === cond).forEach(r => { r.pct = r.height / emax * 100; });
            this.setRows(this.records.map(r => ({
                cells: [
                    `<b>${r.totalUg}</b>${r.cond === 'control' ? '' : ' <small>+' + r.cond + '</small>'}`,
                    Math.log10(r.molar).toFixed(2),
                    r.height.toFixed(1),
                    (r.pct || 0).toFixed(0) + '%'
                ],
                cls: r.pct > 50 ? 'up' : ''
            })));
            this._chart();
            this._analyse();
        }

        /* ---------------- graph & analysis ---------------- */
        _conditions() {
            const out = [];
            this.records.forEach(r => { if (out.indexOf(r.cond) < 0) out.push(r.cond); });
            return out;
        }

        _fit(cond) {
            return LAB.PHARM.hillFit(this.records.filter(r => r.cond === cond).map(r => ({ conc: r.molar, resp: r.height })));
        }

        _chart() {
            const conds = this._conditions();
            if (!conds.length) return;
            const palette = ['#db2777', '#dc2626', '#7c3aed', '#0891b2'];
            const series = [];
            conds.forEach((c, i) => {
                const rows = this.records.filter(r => r.cond === c);
                const col = palette[i % palette.length];
                series.push({ name: c, color: col, type: 'scatter', r: 4, points: rows.map(r => [r.molar, r.pct || 0]) });
                const f = this._fit(c);
                if (f) {
                    const curve = [];
                    for (let k = 0; k <= 40; k++) {
                        const a = 1e-9 * Math.pow(1e-5 / 1e-9, k / 40);
                        curve.push([a, 100 * Math.pow(a, f.nH) / (Math.pow(f.ec50, f.nH) + Math.pow(a, f.nH))]);
                    }
                    series.push({ color: col, width: 1.8, points: curve });
                }
            });
            this.chart.draw({
                logX: true,
                xMin: 5e-10, xMax: 2e-6,
                yMin: 0, yMax: 105,
                xLabel: '[histamine] (M, log scale)',
                yLabel: '% of maximal response',
                xFmt: v => Math.log10(v).toFixed(0),
                annotations: [{ y: 50, color: '#cbd5e1' }],
                series
            });
        }

        _analyse() {
            const conds = this._conditions();
            const fits = conds.map(c => ({ cond: c, f: this._fit(c) })).filter(x => x.f);
            if (!fits.length) return this.infer('<p>Add at least three cumulative doses to generate a curve.</p>');

            let html = '<table style="width:100%;font-size:11.5px;border-collapse:collapse">';
            html += '<tr style="color:#64748b"><th style="text-align:left">Curve</th><th>EC₅₀ (M)</th><th>pD₂</th><th>n<sub>H</sub></th></tr>';
            fits.forEach(x => {
                html += `<tr><td><b>${x.cond}</b></td><td style="text-align:center">${x.f.ec50.toExponential(1)}</td><td style="text-align:center"><b>${x.f.pD2.toFixed(2)}</b></td><td style="text-align:center">${x.f.nH.toFixed(2)}</td></tr>`;
            });
            html += '</table>';

            const ctrl = fits.find(x => x.cond === 'control');
            const blocked = fits.filter(x => x.cond !== 'control').pop();
            if (ctrl && blocked && this.mod) {
                const dr = blocked.f.ec50 / ctrl.f.ec50;
                const B = mepM(this.mod.dose);
                const pA2 = LAB.PHARM.pA2single(dr, B);
                html += `<p style="margin-top:8px;padding:8px;background:#fdf2f8;border-radius:6px">Dose ratio <b>${dr.toFixed(1)}</b> at [B] = ${B.toExponential(1)} M.`;
                if (pA2) html += ` One-point Schild estimate: <b>pA₂ ≈ ${pA2.toFixed(2)}</b>.`;
                html += ` The maximum is unchanged, so the block is <b>surmountable and competitive</b>. Repeat at several antagonist concentrations (exp 15) for a full Schild plot.</p>`;
            } else {
                html += '<p style="margin-top:8px;color:#475569">Now equilibrate mepyramine and repeat the curve to measure the dose ratio.</p>';
            }
            this.infer(html);
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.updateRig(dt);
            this.hud('r', [
                { k: 'Response', v: this.amp.toFixed(1) + ' mm' },
                { k: 'In bath', v: this.idx ? CUM[Math.min(this.idx, CUM.length) - 1] + ' µg' : '—' },
                { k: 'Clock', v: LAB.fmtClock(this.simMin) }
            ]);
        }

        draw(ctx) { this.drawRig(ctx); }
        drawTissue(ctx, o) { LAB.TISSUE.ileum(ctx, o, true); }
    }

    LAB.register(14, HistamineCRC);
})();
