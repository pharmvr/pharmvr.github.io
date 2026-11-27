/**
 * EXP 22 — Effect of drugs on the isolated rat uterus
 *
 * An oestrogenised rat uterine horn in De Jalon's solution at 30 °C. De Jalon's
 * is deliberately low in calcium and run cool precisely to DAMP the spontaneous
 * rhythm — an untreated uterus is so active that drug responses are impossible
 * to read against it.
 *
 * The panel separates three ways of contracting or relaxing the same muscle:
 *   Oxytocin / PGF₂α → uterotonic through their own receptors (no atropine block)
 *   Acetylcholine    → M₃, abolished by atropine
 *   Adrenaline / salbutamol → β₂ relaxation (tocolysis), abolished by propranolol
 *   Nifedipine       → relaxes by blocking L-type Ca²⁺ channels, blocked by neither
 */
(function () {
    const { M } = LAB;

    const DRUGS = {
        oxytocin: {
            id: 'oxytocin', name: 'Oxytocin', short: 'Oxy', cls: 'Oxytocin-receptor agonist',
            color: '#0d9488', kind: 'agonist', unit: 'mU', ec50: 4, emax: 40, hill: 1.5,
            doses: [0.5, 1, 2, 5, 10, 20], blockedBy: [],
            note: 'Oxytocin acts on its own G<sub>q</sub>-coupled receptor, whose density rises sharply under oestrogen — which is why the uterus is oestrogenised before the experiment. Atropine does not touch it.'
        },
        pgf2a: {
            id: 'pgf2a', name: 'PGF₂α', short: 'PGF', cls: 'Prostanoid FP agonist',
            color: '#6366f1', kind: 'agonist', unit: 'µg', ec50: 2, emax: 36, hill: 1.5,
            doses: [0.2, 0.5, 1, 2, 5], blockedBy: [],
            note: 'PGF₂α contracts the myometrium through FP receptors. Being a separate receptor again, it survives both atropine and propranolol.'
        },
        ach: {
            id: 'ach', name: 'Acetylcholine', short: 'ACh', cls: 'Muscarinic M₃ agonist',
            color: '#0891b2', kind: 'agonist', unit: 'µg', ec50: 2, emax: 30, hill: 1.4,
            doses: [0.5, 1, 2, 5, 10], blockedBy: ['atropine'],
            note: 'ACh contracts the uterus through M₃ receptors — the one agonist here that atropine abolishes.'
        },
        adrenaline: {
            id: 'adrenaline', name: 'Adrenaline', short: 'Adr', cls: 'Adrenergic agonist',
            color: '#d97706', kind: 'agonist', unit: 'µg', ec50: 1, emax: -26, hill: 1.4,
            doses: [0.2, 0.5, 1, 2, 5], blockedBy: ['propranolol'], spont: 0.15,
            note: 'In the oestrogen-dominant rat uterus the β₂ effect predominates, so adrenaline <b>relaxes</b> the muscle and quietens the rhythm.'
        },
        salbutamol: {
            id: 'salbutamol', name: 'Salbutamol', short: 'Salb', cls: 'Selective β₂ agonist',
            color: '#16a34a', kind: 'agonist', unit: 'µg', ec50: 3, emax: -30, hill: 1.5,
            doses: [0.5, 1, 2, 5, 10], blockedBy: ['propranolol'], spont: 0.1,
            note: 'The classical <b>tocolytic</b>: β₂ stimulation raises cAMP, lowers intracellular Ca²⁺ and abolishes the rhythm. Propranolol reverses it.'
        },
        nifedipine: {
            id: 'nifedipine', name: 'Nifedipine', short: 'Nif', cls: 'L-type Ca²⁺ channel blocker',
            color: '#7c3aed', kind: 'agonist', unit: 'µg', ec50: 1, emax: -32, hill: 1.7,
            doses: [0.2, 0.5, 1, 2], blockedBy: [], spont: 0.06,
            note: 'Nifedipine relaxes by cutting off Ca²⁺ entry — downstream of every receptor, so neither atropine nor propranolol prevents it. Also used clinically as a tocolytic.'
        },
        atropine: {
            id: 'atropine', name: 'Atropine', short: 'Atr', cls: 'Muscarinic antagonist',
            color: '#dc2626', kind: 'antagonist', unit: 'µg', kb: 2, doses: [1, 2, 5],
            note: 'Blocks M₃ only. It abolishes the ACh response and leaves oxytocin and PGF₂α untouched — the cleanest demonstration that they act on different receptors.'
        },
        propranolol: {
            id: 'propranolol', name: 'Propranolol', short: 'Prop', cls: 'Non-selective β blocker',
            color: '#be123c', kind: 'antagonist', unit: 'µg', kb: 2, doses: [1, 2, 5],
            note: 'Blocks β receptors, so it abolishes the relaxation to adrenaline and salbutamol but not that to nifedipine.'
        }
    };

    class RatUterus extends LAB.OrganBath {
        rig() {
            return {
                solution: "De Jalon's solution",
                tempC: 30,
                restLen: 86,
                spont: { amp: 3.2, period: 4.8 },
                tissueLabel: 'Rat uterine horn'
            };
        }

        config() {
            return {
                room: { benchY: LAB.RIG.BENCH, seed: 15 },
                syringe: false,
                steps: [
                    'Pre-treat the rat with <b>stilboestrol 0.1 mg/kg</b> 24 h earlier; mount one uterine horn in 20 mL of <b>De Jalon’s solution at 30 °C</b> under 0.5 g tension.',
                    'Equilibrate for <b>30 min</b>. The low Ca²⁺ and lower temperature keep the spontaneous rhythm small enough to read responses against.',
                    'Add a dose of agonist, allow <b>30 s contact</b>, read the change in tone, then wash out 3× and let the rhythm return.',
                    'Record control responses to <b>oxytocin</b>, <b>acetylcholine</b> and <b>salbutamol</b> in turn.',
                    'Equilibrate <b>atropine</b> and repeat all three — note that only the ACh response disappears.',
                    'Wash, equilibrate <b>propranolol</b> and repeat — now only the β₂ relaxation disappears, while nifedipine still relaxes.'
                ],
                treatmentTitle: 'Reagents on the rack',
                treatments: Object.values(DRUGS).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Drug & dose', 'Bath condition', 'Response (mm)', 'Effect'],
                tableTitle: 'Kymograph readings',
                chart: true,
                chartTitle: 'Response by bath condition',
                chartEmpty: { xMin: 0.4, xMax: 4.6, yMin: -40, yMax: 50, yLabel: 'Response (mm)', xTicks: [] },
                viva: [
                    {
                        q: 'Why is the rat oestrogenised with stilboestrol before the experiment?',
                        opts: ['To make the animal docile', 'Oestrogen priming raises oxytocin-receptor density and gives a uniform, responsive uterus regardless of the oestrous cycle', 'To kill bacteria', 'To relax the uterus'],
                        ans: 1,
                        exp: 'Uterine sensitivity swings enormously across the oestrous cycle. Priming with oestrogen standardises the preparation and markedly upregulates oxytocin receptors.'
                    },
                    {
                        q: 'Why is De Jalon’s solution used at 30 °C rather than Tyrode’s at 37 °C?',
                        opts: ['It is cheaper', 'Its low calcium and the lower temperature suppress spontaneous activity, giving a quiet baseline against which drug responses can be measured', 'It increases the maximum response', 'To prevent clotting'],
                        ans: 1,
                        exp: 'An untreated uterus in Tyrode’s at 37 °C contracts so vigorously and so irregularly that graded drug responses cannot be read. De Jalon’s deliberately damps it.'
                    },
                    {
                        q: 'Atropine abolishes the response to acetylcholine but not to oxytocin. This shows that:',
                        opts: ['Oxytocin is more potent', 'They act on different receptors — M₃ and the oxytocin receptor respectively', 'Atropine was inactive', 'Oxytocin is destroyed by atropine'],
                        ans: 1,
                        exp: 'Selective antagonism is the classical proof of distinct receptors. Both agonists ultimately raise intracellular Ca²⁺, but they reach it through separate receptors.'
                    },
                    {
                        q: 'Salbutamol relaxes the uterus. The mechanism is:',
                        opts: ['α₁ stimulation', 'β₂ stimulation raising cAMP and lowering intracellular Ca²⁺', 'Muscarinic blockade', 'Direct Ca²⁺ channel block'],
                        ans: 1,
                        exp: 'This is the basis of β₂ tocolysis in preterm labour. The effect is abolished by propranolol, which confirms the receptor involved.'
                    },
                    {
                        q: 'Nifedipine still relaxes the uterus after a full blocking dose of propranolol because it:',
                        opts: ['Is a β agonist', 'Blocks L-type calcium channels directly, downstream of any receptor', 'Destroys propranolol', 'Acts on M₃ receptors'],
                        ans: 1,
                        exp: 'Receptor blockade cannot prevent a drug that acts on the final common effector. Cutting off Ca²⁺ entry relaxes the muscle whatever the receptors are doing.'
                    },
                    {
                        q: 'Oxytocin is assayed on the rat uterus in which units?',
                        opts: ['Milligrams', 'Units or milliunits of biological activity against an international standard', 'Moles per litre', 'Millimetres of contraction'],
                        ans: 1,
                        exp: 'Peptide hormones of variable purity are standardised biologically, not gravimetrically, so potency is expressed in International Units against a reference preparation.'
                    }
                ],
                inferenceHint: 'Record control responses first, then add a blocker and repeat them — which responses survive identifies the receptor.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS.oxytocin;
            this.dose = this.drug.doses[3];
            this.records = [];
            this.initRig();
            this.resetAnimal();
        }

        resetAnimal() {
            this.tissueNo = (this.tissueNo || 0) + 1;
            this.resetRig();
            this.phase = 'equil';
            this.simMin = 0;
            this.setStep(1);
            this._controls();
            this._refresh();
        }

        onSelect(tr) {
            this.drug = DRUGS[tr.id];
            if (this.drug.doses.indexOf(this.dose) < 0) {
                this.dose = this.drug.doses[Math.min(2, this.drug.doses.length - 1)];
            }
            this._controls();
            this._refresh();
        }

        get cond() { return this.mod ? `${this.mod.drug.short} ${this.mod.dose} ${this.mod.drug.unit}` : 'control'; }

        /* ---------------- pharmacology ---------------- */
        response(d, dose) {
            if (d.kind !== 'agonist') return 0;
            let ec50 = d.ec50;
            const m = this.mod;
            if (m && d.blockedBy && d.blockedBy.indexOf(m.drug.id) >= 0) {
                ec50 *= (1 + m.dose / m.drug.kb * 12);
            }
            const h = d.hill;
            const mag = Math.abs(d.emax) * Math.pow(dose, h) / (Math.pow(ec50, h) + Math.pow(dose, h));
            const sign = d.emax < 0 ? -1 : 1;
            return sign * mag * this.vigour + M.randn() * 0.55;
        }

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Dose of ${d.short} into the 20 mL bath</div>
                <div class="lab2-seg" id="ru-dose">${d.doses.map(v => `<button data-v="${v}" class="${v === this.dose ? 'active' : ''}">${v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">Units: ${d.unit} per bath</div>
                <p style="margin-top:8px;font-size:11.5px;color:${this.mod ? '#0f766e' : '#64748b'}"><b>Bath condition:</b> ${this.mod ? this.mod.drug.short + ' ' + this.mod.dose + ' ' + this.mod.drug.unit + ' present' : "plain De Jalon's"}</p>
            `);
            const seg = this.$('ru-dose');
            if (seg) seg.querySelectorAll('button').forEach(b => b.onclick = () => {
                if (this.busy) return this.toast('Wait for the current step to finish.', 'warn');
                this.dose = +b.dataset.v;
                this._controls();
                this._refresh();
            });
        }

        _refresh() {
            const d = this.drug;
            if (this.phase === 'equil') {
                this.status('Uterine horn mounted at <b>30 °C</b> in De Jalon’s solution. Equilibrate before dosing.');
                this.actions([{ label: '⏩ Equilibrate 30 min', primary: true, onClick: () => this.equilibrate() }]);
            } else {
                const dirty = this.agonistIn || Math.abs(this.amp) > 1.5;
                this.status(dirty
                    ? 'Drug still in the bath — <b>wash out 3×</b> and let the rhythm return before the next dose.'
                    : `Ready — add <b>${d.short} ${this.dose} ${d.unit}</b>, or drag the micropipette onto the bath.`);
                const list = [
                    { label: `💧 Add ${d.short} ${this.dose} ${d.unit}`, primary: !dirty, disabled: dirty, onClick: () => this.addDrug() },
                    { label: '🚿 Washout ×3', disabled: !dirty, onClick: () => this.washBath(() => this._refresh()) }
                ];
                if (this.mod) list.push({ label: '🧼 Prolonged wash (clear ' + this.mod.drug.short + ')', onClick: () => this.clearMod() });
                this.actions(list);
            }
            this.hud('l', [
                { k: 'Tissue', v: '#' + this.tissueNo },
                { k: 'Bath', v: this.mod ? this.mod.drug.short : 'De Jalon', tone: this.mod ? 'warn' : '' }
            ]);
        }

        /* ---------------- procedure ---------------- */
        equilibrate() {
            this.timeLapse(30, 3.2, {
                label: 'Equilibration',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(2);
                    this.toast('Baseline settled with a small regular rhythm. Begin dosing.', 'success');
                    this._refresh();
                }
            });
        }

        pipetteDropped() {
            if (this.phase === 'equil') return this.toast('Equilibrate the tissue for 30 min first.', 'warn');
            if (this.agonistIn || Math.abs(this.amp) > 1.5) return this.toast('Wash the bath out before the next dose.', 'warn');
            this.addDrug();
        }

        addDrug() {
            if (this.busy) return;
            const d = this.drug, dose = this.dose;
            this.markAddition(d, dose);
            if (d.spont !== undefined) this.spontTarget = d.spont;

            if (d.kind === 'agonist') {
                this.ampTarget = this.response(d, dose);
                this.agonistIn = true;
                this.vigour = Math.max(0.84, this.vigour - 0.007);
                this.timeLapse(0.5, 2.4, { label: 'Contact time', onDone: () => this._record(d, dose, this.amp) });
            } else {
                this.mod = { drug: d, dose };
                this.timeLapse(5, 2.4, {
                    label: d.short + ' equilibration',
                    onDone: () => {
                        this.markDone(d.id);
                        this.addRow([`<b>${d.short}</b> ${dose} ${d.unit}`, 'pre-treatment', '—', 'blocker in bath'], 'muted');
                        this.toast(`${d.name} in the bath. Now repeat the agonists and see which survive.`, 'info');
                        this.infer(`<p><b>${d.name} added as a bath pre-treatment.</b></p><p style="margin-top:6px;color:#475569">${d.note}</p>`);
                        this._controls();
                        this._refresh();
                    }
                });
            }
        }

        _record(d, dose, height) {
            const cond = this.cond;
            let effect;
            if (Math.abs(height) < 3) effect = '<b style="color:#be123c">No response</b>';
            else if (height > 0) effect = 'Contraction';
            else effect = '<b style="color:#1d4ed8">Relaxation</b>';
            this.records.push({ drug: d, dose, height, cond, effect });
            this.markDone(d.id);
            this.addRow([
                `<b>${d.short}</b> ${dose} ${d.unit}`,
                this.mod ? `+ ${cond}` : "plain De Jalon's",
                `<b>${height > 0 ? '+' : ''}${height.toFixed(1)}</b>`,
                effect
            ], height > 3 ? 'up' : height < -3 ? 'down' : '');
            this.setStep(this.mod ? 4 : 3);
            this._chart();
            this._infer(d, dose, height);
            this._refresh();
        }

        clearMod() {
            if (this.busy) return;
            const was = this.mod ? this.mod.drug.short : '';
            this.mod = null;
            this.spontTarget = 1;
            this.washBath(() => this._refresh());
            this.toast(`Prolonged wash — ${was} removed, bath back to plain De Jalon's.`, 'info');
            this._controls();
        }

        /* ---------------- graph & inference ---------------- */
        _chart() {
            const ags = [];
            this.records.forEach(r => { if (ags.indexOf(r.drug.id) < 0) ags.push(r.drug.id); });
            const conds = [];
            this.records.forEach(r => { if (conds.indexOf(r.cond) < 0) conds.push(r.cond); });
            if (!ags.length) return;
            const shown = conds.slice(-3);
            const palette = ['#0d9488', '#dc2626', '#be123c'];
            let lo = -10, hi = 10;
            this.records.forEach(r => { lo = Math.min(lo, r.height); hi = Math.max(hi, r.height); });

            const series = shown.map((c, i) => ({
                name: c,
                color: palette[i % palette.length],
                type: 'bar',
                barWidth: 0.22,
                offset: (i - (shown.length - 1) / 2) * 1.1,
                points: ags.map((id, k) => {
                    const rec = this.records.filter(r => r.drug.id === id && r.cond === c).pop();
                    return rec ? [k + 1, rec.height] : null;
                }).filter(Boolean)
            }));

            this.chart.draw({
                xMin: 0.4, xMax: ags.length + 0.6,
                yMin: Math.min(-12, lo * 1.25), yMax: Math.max(15, hi * 1.25),
                xTicks: ags.map((_, k) => k + 1),
                xFmt: v => (DRUGS[ags[v - 1]] || {}).short || '',
                yLabel: 'Response (mm)',
                barCount: ags.length,
                annotations: [{ y: 0, color: '#94a3b8' }],
                series
            });
        }

        _infer(d, dose, height) {
            let html = `<p>${d.short} <b>${dose} ${d.unit}</b> gave <b>${height > 0 ? '+' : ''}${height.toFixed(1)} mm</b>`;
            html += this.mod ? ` in the presence of <b>${this.mod.drug.short}</b>.</p>` : '.</p>';
            html += `<p style="margin-top:6px;color:#475569">${d.note}</p>`;

            const ctrl = this.records.filter(r => r.drug.id === d.id && r.cond === 'control').pop();
            if (ctrl && this.mod) {
                const frac = Math.abs(ctrl.height) > 1 ? height / ctrl.height : 1;
                let verdict;
                if (frac < 0.25) verdict = `The response is <b>abolished</b> (${(frac * 100).toFixed(0)}% of control) — ${this.mod.drug.short} blocks the receptor mediating it.`;
                else if (frac < 0.7) verdict = `The response is <b>reduced</b> to ${(frac * 100).toFixed(0)}% of control — partial blockade at this dose.`;
                else verdict = `The response is <b>essentially unchanged</b> (${(frac * 100).toFixed(0)}% of control) — ${this.mod.drug.short} does not act on this receptor.`;
                html += `<p style="margin-top:8px;padding:8px;background:#f1f5f9;border-radius:6px">Control ${ctrl.height.toFixed(1)} mm → ${height.toFixed(1)} mm. ${verdict}</p>`;
            }
            this.infer(html);
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.updateRig(dt);
            this.hud('r', [
                { k: 'Tone', v: (this.amp > 0 ? '+' : '') + this.amp.toFixed(1) + ' mm' },
                { k: 'Rhythm', v: this.spontGain > 0.6 ? 'regular' : this.spontGain > 0.3 ? 'reduced' : 'abolished', tone: this.spontGain < 0.3 ? 'warn' : '' },
                { k: 'Clock', v: LAB.fmtClock(this.simMin) }
            ]);
        }

        draw(ctx) { this.drawRig(ctx); }
        drawTissue(ctx, o) { LAB.TISSUE.uterus(ctx, o); }
    }

    LAB.register(22, RatUterus);
})();
