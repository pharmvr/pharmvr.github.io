/**
 * EXP 17 — Bioassay of acetylcholine by the four-point (2 + 2) method
 *
 * Two doses of standard and two of unknown, in a fixed ratio d (here 2), are
 * run on frog rectus abdominis. Each preparation gives a short log dose–response
 * line, and the horizontal distance between the two parallel lines is the log
 * of the potency ratio:
 *
 *   M = log d × [(u1 + u2) − (s1 + s2)] / [(s2 − s1) + (u2 − u1)]
 *
 * The validity condition is PARALLELISM: the two slopes (s2 − s1) and (u2 − u1)
 * must agree. If they do not, the preparations are not behaving like dilutions
 * of the same substance and the potency ratio is meaningless — which is the
 * real lesson of the four-point design over the three-point one.
 */
(function () {
    const { M } = LAB;

    const STD_CONC = 50;          // µg/mL standard acetylcholine
    const VOL_LOW = 0.2;          // mL
    const VOL_HIGH = 0.4;         // mL  → dose ratio d = 2
    const D_RATIO = VOL_HIGH / VOL_LOW;
    const EC50 = 20;              // µg in the bath (frog rectus)
    const EMAX = 58;
    const HILL = 1.5;

    /** the fixed assay sequence of one cycle */
    const SEQ = [
        { key: 's1', prep: 'standard', vol: VOL_LOW, label: 'S₁' },
        { key: 's2', prep: 'standard', vol: VOL_HIGH, label: 'S₂' },
        { key: 'u1', prep: 'unknown', vol: VOL_LOW, label: 'U₁' },
        { key: 'u2', prep: 'unknown', vol: VOL_HIGH, label: 'U₂' }
    ];

    const SOL = {
        standard: {
            id: 'standard', name: 'Standard ACh', short: 'Std', cls: `${STD_CONC} µg/mL — known strength`,
            color: '#0d9488',
            note: 'The reference solution. Both of its doses must be read under exactly the same conditions as the unknown.'
        },
        unknown: {
            id: 'unknown', name: 'Unknown ACh', short: 'Unk', cls: 'Strength to be determined',
            color: '#7c3aed',
            note: 'The test solution. Its two doses are in the same ratio as the standard’s, which is what makes the two lines comparable.'
        }
    };

    class AchBioassay extends LAB.OrganBath {
        rig() {
            return { solution: 'Frog Ringer', tempC: null, restLen: 96, tissueLabel: 'Frog rectus abdominis' };
        }

        config() {
            return {
                room: { benchY: LAB.RIG.BENCH, seed: 13 },
                syringe: false,
                steps: [
                    'Mount a <b>frog rectus abdominis</b> strip in the 20 mL bath of aerated frog Ringer and equilibrate for 15 min.',
                    'Choose two doses of the standard in the ratio <b>1 : 2</b> that give responses on the straight part of the log dose–response line.',
                    'Run the cycle <b>S₁ → S₂ → U₁ → U₂</b>, each with 60 s contact, washing 3× between doses.',
                    'Repeat the cycle to obtain replicate readings and average them.',
                    'Check the two slopes: (S₂ − S₁) and (U₂ − U₁) must be similar — the lines must be <b>parallel</b>.',
                    'Compute M = log d × [(U₁+U₂) − (S₁+S₂)] / [(S₂−S₁) + (U₂−U₁)], then the potency ratio and the strength of the unknown.'
                ],
                treatmentTitle: 'Solutions on the rack',
                treatments: Object.values(SOL).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Dose', 'Preparation', 'Volume (mL)', 'Height (mm)'],
                tableTitle: 'Assay readings',
                chart: true,
                chartTitle: 'Parallel-line assay',
                chartEmpty: { xMin: 0.15, xMax: 0.55, yMin: 0, yMax: 50, logX: true, xLabel: 'Volume added (mL, log scale)', yLabel: 'Response (mm)' },
                viva: [
                    {
                        q: 'What is the validity condition of a four-point parallel-line assay?',
                        opts: ['The responses must be equal', 'The two log dose–response lines must be parallel', 'The unknown must be stronger than the standard', 'The doses must be identical'],
                        ans: 1,
                        exp: 'Parallelism shows the two preparations behave as dilutions of the same active substance. Non-parallel lines mean something else is contributing, and the potency ratio is not interpretable.'
                    },
                    {
                        q: 'Why is the four-point assay preferred to the three-point assay?',
                        opts: ['It is quicker', 'It provides an internal test of validity (parallelism) and uses two points on each line, improving precision', 'It needs less drug', 'It avoids the need for a standard'],
                        ans: 1,
                        exp: 'The three-point assay assumes the unknown lies on the standard line; the four-point assay tests that assumption instead of assuming it, and averages two points per preparation.'
                    },
                    {
                        q: 'Why are the doses given in a randomised or Latin-square order in a full assay?',
                        opts: ['To confuse the student', 'To balance out progressive changes in tissue sensitivity over the course of the experiment', 'To save time', 'Because the order has no effect'],
                        ans: 1,
                        exp: 'Tissue sensitivity drifts as the experiment proceeds. Randomising the order ensures that drift affects standard and unknown equally instead of biasing one of them.'
                    },
                    {
                        q: 'If the potency ratio works out at 1.6, the unknown is:',
                        opts: ['1.6 times weaker than the standard', '1.6 times as potent as the standard', 'Identical to the standard', 'Inactive'],
                        ans: 1,
                        exp: 'The potency ratio is unknown relative to standard. A ratio above 1 means the same volume of unknown produces the effect of a larger volume of standard, i.e. it is more concentrated.'
                    },
                    {
                        q: 'Why must the two doses be chosen on the straight part of the log dose–response curve?',
                        opts: ['To get the biggest response', 'Because the arithmetic assumes a linear relation between response and log dose; near the maximum the line flattens and the estimate fails', 'To avoid damaging the tissue', 'It does not matter'],
                        ans: 1,
                        exp: 'The parallel-line model is linear in log dose. Doses near the ceiling compress the response difference, flattening the slope and inflating the apparent potency ratio.'
                    }
                ],
                inferenceHint: 'Complete one full cycle of S₁, S₂, U₁, U₂ to obtain a potency ratio; repeat the cycle to average.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.cycles = [];
            this.initRig();
            this.resetAnimal();
        }

        resetAnimal() {
            this.tissueNo = (this.tissueNo || 0) + 1;
            this.resetRig();
            this.phase = 'equil';
            this.stepIdxSeq = 0;
            this.cycleNo = 1;
            this.cycles = [];
            this.current = {};
            this.revealed = false;
            this.trueConc = +(30 + Math.random() * 55).toFixed(1);
            this.drug = SOL.standard;
            this.setRows([]);
            this.simMin = 0;
            this.setStep(0);
            this._controls();
            this._refresh();
        }

        onSelect(tr) {
            // the sequence dictates which solution is next; selecting just previews it
            this.drug = SOL[tr.id];
            this._controls();
            const want = SEQ[this.stepIdxSeq];
            if (want && this.drug.id !== want.prep) {
                this.toast(`The next dose in the sequence is <b>${want.label}</b> — ${SOL[want.prep].name}.`, 'warn');
            }
        }

        get next() { return SEQ[this.stepIdxSeq] || null; }

        concOf(prep) { return prep === 'standard' ? STD_CONC : this.trueConc; }

        /* ---------------- pharmacology ---------------- */
        response(prep, vol) {
            const dose = vol * this.concOf(prep);
            const r = EMAX * Math.pow(dose, HILL) / (Math.pow(EC50, HILL) + Math.pow(dose, HILL));
            return Math.max(0, r * this.vigour + M.randn() * 0.6);
        }

        /* ---------------- left column ---------------- */
        _controls() {
            const n = this.next;
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Assay sequence — cycle ${this.cycleNo}</div>
                <div class="lab2-seg">${SEQ.map((s, i) => `<button class="${i === this.stepIdxSeq ? 'active' : ''}" disabled>${s.label}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">
                    ${n ? `Next: <b>${n.label}</b> = ${n.vol} mL of ${SOL[n.prep].name.toLowerCase()}` : 'Cycle complete'}
                </div>
                <div style="margin-top:10px;font-size:11.5px;color:#475569">
                    Standard: <b>${STD_CONC} µg/mL</b><br>
                    Doses in the ratio <b>1 : ${D_RATIO}</b> (${VOL_LOW} and ${VOL_HIGH} mL)
                </div>
            `);
        }

        _refresh() {
            if (this.phase === 'equil') {
                this.status('Strip mounted under <b>1 g</b> resting tension. Equilibrate before starting the assay.');
                this.actions([{ label: '⏩ Equilibrate 15 min', primary: true, onClick: () => this.equilibrate() }]);
                this.hud('l', [{ k: 'Tissue', v: '#' + this.tissueNo }]);
                return;
            }
            const dirty = this.agonistIn || this.amp > 1.5;
            const n = this.next;
            if (!n) {
                this.status(`Cycle ${this.cycleNo} complete — potency ratio calculated. Run another cycle to average.`);
                this.actions([
                    { label: '↺ Run another cycle', primary: true, onClick: () => this.nextCycle() },
                    ...(this.result && !this.revealed ? [{ label: '🔎 Check the answer', onClick: () => this.reveal() }] : []),
                    { label: '📉 Fresh tissue', onClick: () => this.resetAnimal() }
                ]);
            } else {
                this.status(dirty
                    ? 'Wash out 3× and let the baseline settle before the next dose of the sequence.'
                    : `Next in sequence: <b>${n.label}</b> — ${n.vol} mL of ${SOL[n.prep].name.toLowerCase()}.`);
                this.actions([
                    { label: `💧 Add ${n.label} (${n.vol} mL ${SOL[n.prep].short})`, primary: !dirty, disabled: dirty, onClick: () => this.addDose() },
                    { label: '🚿 Washout ×3', disabled: !dirty, onClick: () => this.washBath(() => this._refresh()) }
                ]);
            }
            this.hud('l', [
                { k: 'Tissue', v: '#' + this.tissueNo },
                { k: 'Cycle', v: String(this.cycleNo) },
                { k: 'Step', v: `${Math.min(this.stepIdxSeq + 1, SEQ.length)}/${SEQ.length}` }
            ]);
        }

        /* ---------------- procedure ---------------- */
        equilibrate() {
            this.timeLapse(15, 3, {
                label: 'Equilibration',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(2);
                    this.toast('Baseline steady. Begin the sequence with S₁.', 'success');
                    this._refresh();
                }
            });
        }

        pipetteDropped() {
            if (this.phase === 'equil') return this.toast('Equilibrate the tissue for 15 min first.', 'warn');
            if (!this.next) return this.toast('Cycle complete — start another or take a fresh tissue.', 'warn');
            if (this.agonistIn || this.amp > 1.5) return this.toast('Wash the bath out before the next dose.', 'warn');
            this.addDose();
        }

        addDose() {
            if (this.busy) return;
            const n = this.next;
            if (!n) return;
            const sol = SOL[n.prep];
            this.drug = sol;
            this.markAddition(sol, n.vol + ' mL');
            this.ampTarget = this.response(n.prep, n.vol);
            this.agonistIn = true;
            this.vigour = Math.max(0.86, this.vigour - 0.005);
            this.timeLapse(1, 2.4, { label: 'Contact time', onDone: () => this._record(n, this.amp) });
        }

        _record(n, height) {
            this.current[n.key] = height;
            this.markDone(n.prep);
            this.addRow([
                `<b>${n.label}</b>`,
                SOL[n.prep].name,
                n.vol.toFixed(2),
                `<b>${height.toFixed(1)}</b>`
            ], n.prep === 'unknown' ? 'up' : '');
            this.stepIdxSeq++;
            if (!this.next) {
                this.cycles.push(Object.assign({}, this.current));
                this.setStep(5);
                this._analyse();
            }
            this._chart();
            this._controls();
            this.washBath(() => this._refresh());
        }

        nextCycle() {
            if (this.busy) return;
            this.cycleNo++;
            this.stepIdxSeq = 0;
            this.current = {};
            this.setStep(3);
            this._controls();
            this._refresh();
        }

        reveal() {
            this.revealed = true;
            this._analyse();
            this._refresh();
        }

        /* ---------------- analysis ---------------- */
        _means() {
            if (!this.cycles.length) return null;
            const key = k => M.mean(this.cycles.map(c => c[k]).filter(v => v !== undefined));
            return { s1: key('s1'), s2: key('s2'), u1: key('u1'), u2: key('u2') };
        }

        _analyse() {
            const m = this._means();
            this.result = null;
            if (!m) {
                this.infer('<p>Complete one full cycle of S₁, S₂, U₁ and U₂ to calculate the potency ratio.</p>');
                return;
            }
            const r = LAB.PHARM.assay4(m.s1, m.s2, m.u1, m.u2, D_RATIO);
            if (!r) {
                this.infer('<p>The two lines have no usable slope — the doses are probably on the flat top of the curve. Take a fresh tissue and use smaller doses.</p>');
                return;
            }
            this.result = r;
            const conc = STD_CONC * r.ratio;
            const parallelOK = r.parallelism < 0.3;

            let html = `<table style="width:100%;font-size:11.5px;border-collapse:collapse">
                <tr style="color:#64748b"><th style="text-align:left">Mean of ${this.cycles.length} cycle${this.cycles.length > 1 ? 's' : ''}</th><th>Low</th><th>High</th><th>Slope</th></tr>
                <tr><td><b>Standard</b></td><td style="text-align:center">${m.s1.toFixed(1)}</td><td style="text-align:center">${m.s2.toFixed(1)}</td><td style="text-align:center">${r.slopeS.toFixed(1)}</td></tr>
                <tr><td><b>Unknown</b></td><td style="text-align:center">${m.u1.toFixed(1)}</td><td style="text-align:center">${m.u2.toFixed(1)}</td><td style="text-align:center">${r.slopeU.toFixed(1)}</td></tr>
            </table>`;

            html += `<p style="margin-top:8px;padding:8px;background:${parallelOK ? '#f0fdf4' : '#fef2f2'};border-radius:6px">
                <b>Parallelism:</b> slopes differ by ${(r.parallelism * 100).toFixed(0)}% —
                ${parallelOK
                    ? 'acceptably parallel, so the assay is <b>valid</b>.'
                    : 'the lines are <b>not parallel</b>, so the potency ratio below should not be trusted. Repeat with doses on the straight part of the curve.'}</p>`;

            html += `<p style="margin-top:8px;padding:8px;background:#f5f3ff;border-radius:6px">
                M = log ${D_RATIO} × [(U₁+U₂) − (S₁+S₂)] / [(S₂−S₁)+(U₂−U₁)] = <b>${r.logR.toFixed(3)}</b><br>
                Potency ratio = antilog M = <b>${r.ratio.toFixed(2)}</b><br>
                ∴ strength of the unknown = ${STD_CONC} × ${r.ratio.toFixed(2)} = <b>${conc.toFixed(1)} µg/mL</b></p>`;

            if (this.revealed) {
                const err = (conc - this.trueConc) / this.trueConc * 100;
                html += `<p style="margin-top:8px;padding:8px;background:${Math.abs(err) < 12 ? '#f0fdf4' : '#fef2f2'};border-radius:6px">
                    True strength: <b>${this.trueConc.toFixed(1)} µg/mL</b> — your estimate is off by <b>${err > 0 ? '+' : ''}${err.toFixed(1)}%</b>.
                    ${Math.abs(err) < 12 ? 'A good result for a four-point assay.' : 'Run further cycles and average to reduce the random error.'}</p>`;
            } else {
                html += '<p style="margin-top:6px;color:#64748b">Run another cycle to average, or <b>Check the answer</b> to compare with the true strength.</p>';
            }
            this.infer(html);
        }

        _chart() {
            const m = this._means();
            if (!m || m.s1 === undefined || isNaN(m.s1)) return;
            const series = [];
            if (!isNaN(m.s2)) series.push({
                name: 'Standard', color: '#0d9488', markers: true, width: 2,
                points: [[VOL_LOW, m.s1], [VOL_HIGH, m.s2]]
            });
            if (!isNaN(m.u1) && !isNaN(m.u2)) series.push({
                name: 'Unknown', color: '#7c3aed', markers: true, width: 2,
                points: [[VOL_LOW, m.u1], [VOL_HIGH, m.u2]]
            });
            if (!series.length) return;
            const all = [m.s1, m.s2, m.u1, m.u2].filter(v => !isNaN(v));
            this.chart.draw({
                logX: true,
                xMin: VOL_LOW * 0.7, xMax: VOL_HIGH * 1.45,
                yMin: 0, yMax: Math.max(...all) * 1.25,
                xLabel: 'Volume added (mL, log scale)',
                yLabel: 'Response (mm)',
                xFmt: v => v.toFixed(2),
                series
            });
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.updateRig(dt);
            this.hud('r', [
                { k: 'Response', v: this.amp.toFixed(1) + ' mm' },
                { k: 'Cycles', v: String(this.cycles.length) },
                { k: 'Clock', v: LAB.fmtClock(this.simMin) }
            ]);
        }

        draw(ctx) { this.drawRig(ctx); }
        drawTissue(ctx, o) { LAB.TISSUE.rectus(ctx, o); }
    }

    LAB.register(17, AchBioassay);
})();
