/**
 * EXP 16 — Bioassay of histamine by the three-point (interpolation) method
 *
 * A sample of unknown strength is assayed against a standard histamine
 * solution on guinea pig ileum. Two doses of the standard are chosen so that
 * their responses BRACKET the response of the unknown; the unknown is then read
 * off the log-dose line between them.
 *
 *   log(equivalent dose) = log S1 + (Ru − R1)/(R2 − R1) × (log S2 − log S1)
 *
 * Dividing the equivalent dose by the volume of unknown used gives its
 * concentration. The bracketing requirement is the whole discipline of the
 * method: an unknown read outside the two standards is an extrapolation, not an
 * interpolation, and is not valid.
 */
(function () {
    const { M } = LAB;

    const BATH_L = 0.020;
    const MW_HIST = 307.14;
    const histM = ug => LAB.PHARM.molar(ug, MW_HIST, BATH_L);

    const STD_CONC = 1.0;                     // µg/mL standard histamine
    const VOLS = [0.1, 0.2, 0.4, 0.8];        // mL added to the bath
    const EC50_M = 1.0e-7;
    const EMAX = 46;
    const HILL = 1.6;

    const SOL = {
        standard: {
            id: 'standard', name: 'Standard histamine', short: 'Std', cls: `${STD_CONC} µg/mL — known strength`,
            color: '#0d9488',
            note: 'The reference preparation of known strength against which the unknown is compared.'
        },
        unknown: {
            id: 'unknown', name: 'Unknown sample', short: 'Unk', cls: 'Strength to be determined',
            color: '#7c3aed',
            note: 'An extract of unknown histamine content. Its response must fall between two standard responses to be read by interpolation.'
        }
    };

    class HistamineBioassay extends LAB.OrganBath {
        rig() {
            return {
                solution: "Tyrode's solution", tempC: 37, restLen: 88,
                spont: { amp: 1.4, period: 5.2 }, tissueLabel: 'Guinea pig ileum'
            };
        }

        config() {
            return {
                room: { benchY: LAB.RIG.BENCH, seed: 11 },
                syringe: false,
                steps: [
                    'Mount <b>guinea pig ileum</b> in Tyrode’s solution at 37 °C and equilibrate for 30 min.',
                    'Add a dose of the <b>standard</b>, allow 30 s contact, read the height, then wash out 3× and allow 2 min recovery.',
                    'Repeat with a second, larger standard dose. Keep contact time and washing identical for every dose — this is the heart of a valid bioassay.',
                    'Add a dose of the <b>unknown</b> and read it the same way.',
                    'Check that the unknown’s response lies <b>between</b> the two standard responses. If not, choose different standard doses.',
                    'Interpolate on the log-dose scale to find the equivalent standard dose, then divide by the volume used to get the strength of the unknown.'
                ],
                treatmentTitle: 'Solutions on the rack',
                treatments: Object.values(SOL).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Solution', 'Volume (mL)', 'Dose', 'Height (mm)'],
                tableTitle: 'Assay readings',
                chart: true,
                chartTitle: 'Interpolation on the standard line',
                chartEmpty: { xMin: 0.05, xMax: 1.6, yMin: 0, yMax: 50, logX: true, xLabel: 'Standard dose (µg, log scale)', yLabel: 'Response (mm)' },
                viva: [
                    {
                        q: 'Why must the response to the unknown lie between the two standard responses?',
                        opts: ['To save drug', 'Because the method interpolates on the log dose–response line; outside that range it would be an extrapolation onto an unverified part of the curve', 'Because the tissue cannot respond otherwise', 'It need not'],
                        ans: 1,
                        exp: 'Only between the bracketing doses is the line known to be linear and the tissue known to be responding in a graded way. Extrapolating beyond them assumes behaviour that has not been measured.'
                    },
                    {
                        q: 'What is the principle of a bioassay?',
                        opts: ['Measuring a drug chemically', 'Comparing the biological response of an unknown with that of a standard on the same tissue under identical conditions', 'Weighing the drug', 'Measuring absorbance'],
                        ans: 1,
                        exp: 'A bioassay never measures a drug absolutely — it measures it relative to a standard, which is why identical conditions and the same preparation matter more than anything else.'
                    },
                    {
                        q: 'Why is the contact time kept identical for every dose?',
                        opts: ['To make the experiment faster', 'Because the response is read at a fixed point on its time course; varying contact time would vary the response independently of dose', 'To save Tyrode’s solution', 'To protect the kymograph'],
                        ans: 1,
                        exp: 'The contracture is still developing when it is read. If one dose is left longer than another, the difference in height reflects time rather than concentration and the assay is invalid.'
                    },
                    {
                        q: 'Why is the same tissue used for both standard and unknown?',
                        opts: ['Economy', 'Sensitivity varies between tissues, so comparing on one preparation cancels that variation', 'The unknown damages fresh tissue', 'It is not required'],
                        ans: 1,
                        exp: 'Two ileum segments can differ severalfold in sensitivity. Within one tissue that factor is common to both preparations and cancels in the ratio.'
                    },
                    {
                        q: 'The ileum is washed and allowed to recover between doses in order to:',
                        opts: ['Cool the bath', 'Return the tissue to the same baseline so every response starts from the same resting tension', 'Dilute the standard', 'Remove oxygen'],
                        ans: 1,
                        exp: 'Residual agonist leaves the muscle partly contracted, so the next response starts higher and appears smaller. A consistent baseline is a precondition for comparing heights.'
                    }
                ],
                inferenceHint: 'Record two bracketing standard doses and one dose of the unknown; the interpolation appears automatically.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = SOL.standard;
            this.vol = VOLS[1];
            this.rows = [];
            this.readings = [];
            this.initRig();
            this.resetAnimal();
        }

        resetAnimal() {
            this.tissueNo = (this.tissueNo || 0) + 1;
            this.resetRig();
            this.phase = 'equil';
            this.simMin = 0;
            this.readings = [];
            this.revealed = false;
            // a fresh unknown each time the tissue is changed
            this.trueConc = +(1.6 + Math.random() * 2.8).toFixed(2);
            this.setRows([]);
            this.setStep(0);
            this._controls();
            this._refresh();
        }

        onSelect(tr) { this.drug = SOL[tr.id]; this._controls(); this._refresh(); }

        doseOf(sol, vol) { return vol * (sol.id === 'standard' ? STD_CONC : this.trueConc); }

        /* ---------------- pharmacology ---------------- */
        response(sol, vol) {
            const a = histM(this.doseOf(sol, vol));
            const r = EMAX * Math.pow(a, HILL) / (Math.pow(EC50_M, HILL) + Math.pow(a, HILL));
            return Math.max(0, r * this.vigour + M.randn() * 0.7);
        }

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Volume of ${d.short} into the bath</div>
                <div class="lab2-seg" id="ba-vol">${VOLS.map(v => `<button data-v="${v}" class="${v === this.vol ? 'active' : ''}">${v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">
                    ${d.id === 'standard'
                        ? `= <b>${(this.vol * STD_CONC).toFixed(2)} µg</b> histamine (standard is ${STD_CONC} µg/mL)`
                        : 'dose unknown until the assay is worked out'}
                </div>
                <p style="margin-top:10px;font-size:11.5px;color:#475569">${d.note}</p>
            `);
            const seg = this.$('ba-vol');
            if (seg) seg.querySelectorAll('button').forEach(b => b.onclick = () => {
                if (this.busy) return;
                this.vol = +b.dataset.v;
                this._controls();
                this._refresh();
            });
        }

        _refresh() {
            if (this.phase === 'equil') {
                this.status('Ileum mounted at <b>37 °C</b>. Equilibrate before the first dose.');
                this.actions([{ label: '⏩ Equilibrate 30 min', primary: true, onClick: () => this.equilibrate() }]);
            } else {
                const dirty = this.agonistIn || this.amp > 1.5;
                this.status(dirty
                    ? 'Wash out and allow the tissue to recover before the next dose.'
                    : `Ready — add <b>${this.vol} mL</b> of ${this.drug.name.toLowerCase()}.`);
                const list = [
                    { label: `💧 Add ${this.vol} mL ${this.drug.short}`, primary: !dirty, disabled: dirty, onClick: () => this.addDose() },
                    { label: '🚿 Wash & recover', disabled: !dirty, onClick: () => this.wash() }
                ];
                if (this.result && !this.revealed) list.push({ label: '🔎 Check the answer', onClick: () => this.reveal() });
                this.actions(list);
            }
            this.hud('l', [
                { k: 'Tissue', v: '#' + this.tissueNo },
                { k: 'Readings', v: String(this.readings.length) }
            ]);
        }

        /* ---------------- procedure ---------------- */
        equilibrate() {
            this.timeLapse(30, 3.2, {
                label: 'Equilibration',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(1);
                    this.toast('Baseline steady. Begin with a dose of the standard.', 'success');
                    this._refresh();
                }
            });
        }

        pipetteDropped() {
            if (this.phase === 'equil') return this.toast('Equilibrate the tissue for 30 min first.', 'warn');
            if (this.agonistIn || this.amp > 1.5) return this.toast('Wash out before the next dose.', 'warn');
            this.addDose();
        }

        addDose() {
            if (this.busy) return;
            const sol = this.drug, vol = this.vol;
            this.markAddition(sol, vol + ' mL');
            this.ampTarget = this.response(sol, vol);
            this.agonistIn = true;
            this.vigour = Math.max(0.88, this.vigour - 0.004);
            this.timeLapse(0.5, 2.2, { label: 'Contact time', onDone: () => this._record(sol, vol, this.amp) });
        }

        wash() {
            this.washBath(() => {
                this.timeLapse(2, 1.2, { label: 'Recovery', onDone: () => this._refresh() });
            });
        }

        _record(sol, vol, height) {
            this.readings.push({ sol, vol, height, dose: sol.id === 'standard' ? vol * STD_CONC : null });
            this.markDone(sol.id);
            this.setRows(this.readings.map(r => ({
                cells: [
                    `<b>${r.sol.short}</b>`,
                    r.vol.toFixed(2),
                    r.dose !== null ? r.dose.toFixed(2) + ' µg' : '<i>unknown</i>',
                    `<b>${r.height.toFixed(1)}</b>`
                ],
                cls: r.sol.id === 'unknown' ? 'up' : ''
            })));
            this.setStep(this.readings.some(r => r.sol.id === 'unknown') ? 4 : 2);
            this._chart();
            this._analyse();
            this._refresh();
        }

        reveal() {
            this.revealed = true;
            this._analyse();
            this._refresh();
        }

        /* ---------------- analysis ---------------- */
        _analyse() {
            const stds = this.readings.filter(r => r.sol.id === 'standard');
            const unks = this.readings.filter(r => r.sol.id === 'unknown');
            this.result = null;

            if (stds.length < 2 || !unks.length) {
                this.infer(`<p>Record <b>two standard doses</b> and <b>one dose of the unknown</b>. The unknown’s response must fall between the two standards.</p>
                    <p style="margin-top:6px;color:#64748b">So far: ${stds.length} standard, ${unks.length} unknown.</p>`);
                return;
            }

            const u = unks[unks.length - 1];
            // choose the tightest bracketing pair of standards
            const sorted = stds.slice().sort((a, b) => a.height - b.height);
            let lo = null, hi = null;
            for (const s of sorted) {
                if (s.height <= u.height) lo = s;
                if (s.height >= u.height && !hi) hi = s;
            }
            if (!lo || !hi || lo === hi) {
                this.infer(`<p>The unknown gave <b>${u.height.toFixed(1)} mm</b>, which is <b>not bracketed</b> by your standard doses
                    (${sorted[0].height.toFixed(1)}–${sorted[sorted.length - 1].height.toFixed(1)} mm).</p>
                    <p style="margin-top:6px;color:#475569">Choose standard doses that straddle it, or change the volume of unknown, and repeat. Reading outside the bracket would be an extrapolation.</p>`);
                return;
            }

            const r = LAB.PHARM.assay3(
                { dose: lo.dose, resp: lo.height },
                { dose: hi.dose, resp: hi.height },
                { vol: u.vol, resp: u.height }
            );
            if (!r || !r.conc) return;
            this.result = r;
            const err = (r.conc - this.trueConc) / this.trueConc * 100;

            let html = `<p>The unknown gave <b>${u.height.toFixed(1)} mm</b>, bracketed by standard doses of
                <b>${lo.dose.toFixed(2)}</b> and <b>${hi.dose.toFixed(2)} µg</b> (${lo.height.toFixed(1)} and ${hi.height.toFixed(1)} mm).</p>`;
            html += `<p style="margin-top:8px;padding:8px;background:#f5f3ff;border-radius:6px">
                Equivalent standard dose = <b>${r.equiv.toFixed(3)} µg</b> in ${u.vol} mL<br>
                ∴ strength of the unknown = <b>${r.conc.toFixed(2)} µg/mL</b></p>`;
            if (this.revealed) {
                html += `<p style="margin-top:8px;padding:8px;background:${Math.abs(err) < 12 ? '#f0fdf4' : '#fef2f2'};border-radius:6px">
                    True strength: <b>${this.trueConc.toFixed(2)} µg/mL</b> — your estimate is off by <b>${err > 0 ? '+' : ''}${err.toFixed(1)}%</b>.
                    ${Math.abs(err) < 12 ? 'Well within the error expected of a three-point assay.' : 'Tighten the bracket around the unknown and repeat to improve the estimate.'}</p>`;
            } else {
                html += '<p style="margin-top:6px;color:#64748b">Use <b>Check the answer</b> to compare with the true strength.</p>';
            }
            this.infer(html);
        }

        _chart() {
            const stds = this.readings.filter(r => r.sol.id === 'standard');
            const unks = this.readings.filter(r => r.sol.id === 'unknown');
            if (!stds.length) return;
            const series = [{
                name: 'Standard', color: '#0d9488', markers: true, width: 1.8,
                points: stds.slice().sort((a, b) => a.dose - b.dose).map(r => [r.dose, r.height])
            }];
            const ann = [];
            if (unks.length) {
                const u = unks[unks.length - 1];
                ann.push({ y: u.height, color: '#7c3aed', text: 'unknown ' + u.height.toFixed(1) + ' mm' });
                if (this.result) {
                    ann.push({ x: this.result.equiv, color: '#7c3aed', text: this.result.equiv.toFixed(2) + ' µg' });
                    series.push({ color: '#7c3aed', type: 'scatter', r: 4.5, points: [[this.result.equiv, u.height]] });
                }
            }
            this.chart.draw({
                logX: true,
                xMin: VOLS[0] * STD_CONC * 0.6, xMax: VOLS[VOLS.length - 1] * STD_CONC * 1.8,
                yMin: 0, yMax: Math.max(50, ...this.readings.map(r => r.height)) * 1.15,
                xLabel: 'Standard dose (µg, log scale)',
                yLabel: 'Response (mm)',
                xFmt: v => v.toFixed(2),
                annotations: ann,
                series
            });
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.updateRig(dt);
            this.hud('r', [
                { k: 'Response', v: this.amp.toFixed(1) + ' mm' },
                { k: 'Clock', v: LAB.fmtClock(this.simMin) }
            ]);
        }

        draw(ctx) { this.drawRig(ctx); }
        drawTissue(ctx, o) { LAB.TISSUE.ileum(ctx, o, true); }
    }

    LAB.register(16, HistamineBioassay);
})();
