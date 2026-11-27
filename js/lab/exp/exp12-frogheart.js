/**
 * EXP 12 — Effect of drugs on the isolated frog heart (Straub's method)
 *
 * The heart is cannulated through the sinus venosus into the ventricle and
 * suspended from a Straub cannula holding a small static volume of frog Ringer.
 * Drugs go straight into that column, so the whole heart is exposed at once.
 * A thread from the ventricular apex drives a light heart lever onto the drum,
 * giving force of contraction as amplitude and heart rate as frequency.
 *
 * The experiment separates the two cardiac variables and the two ways of
 * changing them:
 *   ACh        → M₂: bradycardia, weaker beat, and in excess ARREST IN DIASTOLE
 *   Atropine   → abolishes the ACh response entirely
 *   Adrenaline → β₁: tachycardia and a stronger beat; propranolol abolishes it
 *   Nicotine   → stimulates intracardiac ganglia, releasing ACh — atropine blocks it
 *   CaCl₂      → positive inotropic, and in excess ARREST IN SYSTOLE
 *   KCl        → negative inotropic, and in excess ARREST IN DIASTOLE
 *   Digitalis  → more force, slower rate — the therapeutic combination
 */
(function () {
    const { M } = LAB;

    const BASE_RATE = 40, BASE_FORCE = 40;

    const DRUGS = {
        ach: {
            id: 'ach', name: 'Acetylcholine', short: 'ACh', cls: 'Muscarinic M₂ agonist',
            color: '#0d9488', kind: 'agonist', unit: 'µg', ec50: 1, hill: 1.6,
            dRate: -0.85, dForce: -0.75, arrest: 'diastole', arrestAt: 0.8,
            blockedBy: ['atropine'], doses: [0.1, 0.25, 0.5, 1, 2, 5],
            note: 'ACh acts on <b>M₂</b> receptors, opening K⁺ channels and inhibiting adenylyl cyclase. The heart slows and weakens, and a large dose stops it <b>in diastole</b> — relaxed and dilated. Atropine abolishes all of it.'
        },
        adrenaline: {
            id: 'adrenaline', name: 'Adrenaline', short: 'Adr', cls: 'β₁ adrenergic agonist',
            color: '#d97706', kind: 'agonist', unit: 'µg', ec50: 0.5, hill: 1.5,
            dRate: 0.7, dForce: 0.9, blockedBy: ['propranolol'], doses: [0.05, 0.1, 0.25, 0.5, 1, 2],
            note: 'Adrenaline raises cAMP through <b>β₁</b> receptors: positive chronotropic and positive inotropic together. Propranolol abolishes both, confirming one receptor underlies both effects.'
        },
        nicotine: {
            id: 'nicotine', name: 'Nicotine', short: 'Nic', cls: 'Ganglionic stimulant',
            color: '#7c3aed', kind: 'agonist', unit: 'µg', ec50: 25, hill: 1.4,
            dRate: -0.55, dForce: -0.4, blockedBy: ['atropine'], doses: [5, 10, 25, 50, 100],
            note: 'Nicotine stimulates the <b>intracardiac ganglia</b>, which release ACh onto the muscle. Because the final mediator is ACh, atropine abolishes the response — proof the effect is indirect.'
        },
        cacl2: {
            id: 'cacl2', name: 'Calcium chloride', short: 'CaCl₂', cls: 'Divalent cation',
            color: '#6366f1', kind: 'agonist', unit: 'mg', ec50: 2, hill: 1.8,
            dRate: -0.15, dForce: 0.95, arrest: 'systole', arrestAt: 0.85,
            blockedBy: [], doses: [0.5, 1, 2, 5, 10],
            note: 'More Ca²⁺ means more cross-bridge activation, so the beat grows. In excess the ventricle cannot relax and stops <b>in systole</b> — contracted and pale, the classic calcium rigor.'
        },
        kcl: {
            id: 'kcl', name: 'Potassium chloride', short: 'KCl', cls: 'Monovalent cation',
            color: '#0891b2', kind: 'agonist', unit: 'mg', ec50: 2, hill: 1.8,
            dRate: -0.6, dForce: -0.9, arrest: 'diastole', arrestAt: 0.85,
            blockedBy: [], doses: [0.5, 1, 2, 5, 10],
            note: 'Raised extracellular K⁺ depolarises the membrane and inactivates the sodium channels. The beat fades and the heart stops <b>in diastole</b> — the opposite phase to calcium.'
        },
        digoxin: {
            id: 'digoxin', name: 'Digoxin', short: 'Dig', cls: 'Cardiac glycoside',
            color: '#16a34a', kind: 'agonist', unit: 'µg', ec50: 5, hill: 1.5,
            dRate: -0.4, dForce: 0.6, arrest: 'systole', arrestAt: 0.94,
            blockedBy: [], doses: [1, 2, 5, 10, 20],
            note: 'Digoxin inhibits Na⁺/K⁺-ATPase, raising intracellular Na⁺ and so Ca²⁺ through the exchanger: <b>more force with a slower rate</b>. A toxic dose arrests the heart in systole.'
        },
        atropine: {
            id: 'atropine', name: 'Atropine', short: 'Atr', cls: 'Muscarinic antagonist',
            color: '#dc2626', kind: 'antagonist', unit: 'µg', kb: 1, doses: [0.5, 1, 2],
            note: 'Blocks M₂ receptors. It abolishes the responses to acetylcholine and to nicotine, but leaves adrenaline, calcium and potassium untouched.'
        },
        propranolol: {
            id: 'propranolol', name: 'Propranolol', short: 'Prop', cls: 'Non-selective β blocker',
            color: '#be123c', kind: 'antagonist', unit: 'µg', kb: 1, doses: [0.5, 1, 2],
            note: 'Blocks β receptors, abolishing the adrenaline response while leaving the muscarinic and ionic effects intact.'
        }
    };

    class FrogHeart extends LAB.HeartRig {
        rig() { return { perfused: false, baseRate: BASE_RATE, baseForce: BASE_FORCE }; }

        config() {
            return {
                room: { benchY: LAB.HEART_RIG.BENCH, seed: 8 },
                syringe: false,
                steps: [
                    'Pith a frog, expose the heart, and pass a <b>Straub cannula</b> through the sinus venosus into the ventricle; tie it in place.',
                    'Fill the cannula with frog Ringer and attach a thread from the <b>ventricular apex</b> to the heart lever.',
                    'Allow the heart to beat steadily for a few minutes and record a <b>normal tracing</b> — note rate and amplitude.',
                    'Add a drug to the Ringer in the cannula, watch the tracing change, then wash out with fresh Ringer.',
                    'Record the effect of each drug on <b>rate</b> and on <b>force</b> separately.',
                    'Give atropine or propranolol and repeat the agonists to identify which receptor each one works through.'
                ],
                treatmentTitle: 'Reagents on the rack',
                treatments: Object.values(DRUGS).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Drug & dose', 'Condition', 'Rate /min', 'Force (mm)', 'Effect'],
                tableTitle: 'Cardiac readings',
                chart: true,
                chartTitle: 'Change in rate and force',
                chartEmpty: { xMin: 0.4, xMax: 4.6, yMin: -100, yMax: 100, yLabel: '% change from control', xTicks: [] },
                viva: [
                    {
                        q: 'Acetylcholine arrests the frog heart in which phase?',
                        opts: ['Systole', 'Diastole', 'It does not arrest the heart', 'Mid-contraction'],
                        ans: 1,
                        exp: 'ACh opens potassium channels and hyperpolarises the pacemaker, so the heart stops relaxed and dilated — arrest in diastole. The classic contrast is calcium, which arrests it in systole.'
                    },
                    {
                        q: 'Calcium chloride in excess arrests the heart in systole because:',
                        opts: ['It blocks potassium channels', 'Excess intracellular Ca²⁺ keeps the cross-bridges engaged so the ventricle cannot relax', 'It stimulates M₂ receptors', 'It destroys ATP'],
                        ans: 1,
                        exp: 'Relaxation requires calcium to be pumped away from the myofilaments. Flooding the cell with Ca²⁺ prevents that, leaving the ventricle contracted — calcium rigor.'
                    },
                    {
                        q: 'Nicotine slows the frog heart, and atropine abolishes this. The explanation is:',
                        opts: ['Nicotine is a muscarinic agonist', 'Nicotine stimulates intracardiac ganglia, which release ACh onto M₂ receptors', 'Atropine blocks nicotinic receptors', 'Nicotine blocks calcium channels'],
                        ans: 1,
                        exp: 'The action is indirect. Nicotine excites the ganglion cells; the transmitter that finally reaches the muscle is acetylcholine, so blocking the muscarinic step abolishes the whole response.'
                    },
                    {
                        q: 'Why is the frog heart able to go on beating outside the body?',
                        opts: ['It stores oxygen', 'It is myogenic, with its own pacemaker in the sinus venosus, and amphibian tissue survives on Ringer at room temperature', 'It is kept alive by the lever', 'Nerves continue to fire'],
                        ans: 1,
                        exp: 'The heartbeat originates in the heart itself, not in nerves. Amphibian tissue has a low metabolic rate and survives for hours in oxygenated Ringer without a coronary circulation.'
                    },
                    {
                        q: 'Digitalis produces which combination?',
                        opts: ['Increased rate, increased force', 'Decreased rate, increased force', 'Decreased rate, decreased force', 'Increased rate, decreased force'],
                        ans: 1,
                        exp: 'Inhibition of Na⁺/K⁺-ATPase raises intracellular calcium and so the force of contraction, while vagal and direct effects slow the rate — exactly what is wanted in atrial fibrillation with failure.'
                    },
                    {
                        q: 'Adrenaline increases both rate and force, and propranolol abolishes both. This indicates:',
                        opts: ['Two separate receptors', 'Both effects are mediated by the same β₁ receptor', 'Adrenaline acts directly on the myofilaments', 'Propranolol is a partial agonist'],
                        ans: 1,
                        exp: 'A single antagonist abolishing both effects shows they share one receptor and one second messenger — β₁ coupled through cAMP to both pacemaker and contractile proteins.'
                    }
                ],
                inferenceHint: 'Record a normal tracing first, then each drug, washing out between. Give a blocker to identify the receptor.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS.ach;
            this.dose = this.drug.doses[3];
            this.records = [];
            this.initHeart();
            this.resetAnimal();
        }

        resetAnimal() {
            this.heartNo = (this.heartNo || 0) + 1;
            this.resetHeart();
            this.phase = 'settle';
            this.baseline = null;
            this.simMin = 0;
            this.setStep(2);
            this._controls();
            this._refresh();
        }

        onSelect(tr) {
            this.drug = DRUGS[tr.id];
            if (this.drug.doses.indexOf(this.dose) < 0) {
                this.dose = this.drug.doses[Math.min(3, this.drug.doses.length - 1)];
            }
            this._controls();
            this._refresh();
        }

        get cond() { return this.mod ? `${this.mod.drug.short} ${this.mod.dose} ${this.mod.drug.unit}` : 'control'; }
        get dirty() { return this.applied || this.arrest || Math.abs(this.rate - this.R.baseRate * this.vigour) > 3; }

        /* ---------------- pharmacology ---------------- */
        effectFraction(d, dose) {
            let ec50 = d.ec50;
            const m = this.mod;
            if (m && d.blockedBy && d.blockedBy.indexOf(m.drug.id) >= 0) {
                ec50 *= (1 + m.dose / m.drug.kb * 18);
            }
            return Math.pow(dose, d.hill) / (Math.pow(ec50, d.hill) + Math.pow(dose, d.hill));
        }

        apply(d, dose) {
            const f = this.effectFraction(d, dose);
            this.rateTarget = Math.max(0, this.R.baseRate * this.vigour * (1 + d.dRate * f) + M.randn() * 0.8);
            this.forceTarget = Math.max(0, this.R.baseForce * this.vigour * (1 + d.dForce * f) + M.randn() * 0.8);
            if (d.arrest && f > d.arrestAt) {
                this.arrest = d.arrest;
                if (d.arrest === 'systole') this.forceTarget = Math.max(this.forceTarget, this.R.baseForce * 0.9);
            }
            return f;
        }

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Dose of ${d.short} into the cannula</div>
                <div class="lab2-seg" id="fh-dose">${d.doses.map(v => `<button data-v="${v}" class="${v === this.dose ? 'active' : ''}">${v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">Units: ${d.unit} into the Ringer column</div>
                <p style="margin-top:8px;font-size:11.5px;color:${this.mod ? '#0f766e' : '#64748b'}"><b>Cannula:</b> ${this.mod ? this.mod.drug.short + ' ' + this.mod.dose + ' ' + this.mod.drug.unit + ' present' : 'plain frog Ringer'}</p>
            `);
            const seg = this.$('fh-dose');
            if (seg) seg.querySelectorAll('button').forEach(b => b.onclick = () => {
                if (this.busy) return this.toast('Wait for the current step to finish.', 'warn');
                this.dose = +b.dataset.v;
                this._controls();
                this._refresh();
            });
        }

        _refresh() {
            const d = this.drug;
            if (this.phase === 'settle') {
                this.status('Heart cannulated and beating. Record a <b>normal tracing</b> before giving anything.');
                this.actions([{ label: '⏩ Record normal tracing', primary: true, onClick: () => this.settle() }]);
            } else {
                const dirty = this.dirty;
                this.status(dirty
                    ? 'Drug still acting — <b>wash out</b> with fresh Ringer and let the heart recover.'
                    : `Ready — add <b>${d.short} ${this.dose} ${d.unit}</b>, or drag the micropipette into the cannula.`);
                const list = [
                    { label: `💧 Add ${d.short} ${this.dose} ${d.unit}`, primary: !dirty, disabled: dirty, onClick: () => this.addDrug() },
                    { label: '🚿 Wash with Ringer', disabled: !dirty, onClick: () => this.wash() }
                ];
                if (this.mod) list.push({ label: '🧼 Prolonged wash (clear ' + this.mod.drug.short + ')', onClick: () => this.clearMod() });
                list.push({ label: '🐸 Fresh heart', onClick: () => this.resetAnimal() });
                this.actions(list);
            }
            this.hud('l', [
                { k: 'Heart', v: '#' + this.heartNo },
                { k: 'Cannula', v: this.mod ? this.mod.drug.short : 'Ringer', tone: this.mod ? 'warn' : '' }
            ]);
        }

        /* ---------------- procedure ---------------- */
        settle() {
            this.timeLapse(3, 2.4, {
                label: 'Normal tracing',
                onDone: () => {
                    this.phase = 'ready';
                    this.baseline = { rate: this.rate, force: this.force };
                    this.setStep(3);
                    this.toast(`Normal tracing: <b>${Math.round(this.rate)}/min</b>, amplitude <b>${this.force.toFixed(0)} mm</b>.`, 'success');
                    this._refresh();
                }
            });
        }

        pipetteDropped() {
            if (this.phase === 'settle') return this.toast('Record a normal tracing first.', 'warn');
            if (this.dirty) return this.toast('Wash out before adding the next drug.', 'warn');
            this.addDrug();
        }

        addDrug() {
            if (this.busy) return;
            const d = this.drug, dose = this.dose;
            this.markAddition(d, dose);

            if (d.kind === 'agonist') {
                this.applied = true;
                this.apply(d, dose);
                this.vigour = Math.max(0.85, this.vigour - 0.005);
                this.timeLapse(1, 2.6, { label: 'Observing', onDone: () => this._record(d, dose) });
            } else {
                this.mod = { drug: d, dose };
                this.timeLapse(3, 2.2, {
                    label: d.short + ' equilibration',
                    onDone: () => {
                        this.markDone(d.id);
                        this.addRow([`<b>${d.short}</b> ${dose} ${d.unit}`, 'pre-treatment', '—', '—', 'blocker in cannula'], 'muted');
                        this.toast(`${d.name} in the cannula. Repeat the agonists and see which survive.`, 'info');
                        this.infer(`<p><b>${d.name} added to the cannula.</b></p><p style="margin-top:6px;color:#475569">${d.note}</p>`);
                        this._controls();
                        this._refresh();
                    }
                });
            }
        }

        _record(d, dose) {
            const b = this.baseline || { rate: this.R.baseRate, force: this.R.baseForce };
            const dRate = (this.rate - b.rate) / b.rate * 100;
            const dForce = (this.force - b.force) / b.force * 100;
            let effect;
            if (this.arrest) effect = `<b style="color:#be123c">Arrest in ${this.arrest}</b>`;
            else {
                const bits = [];
                if (Math.abs(dRate) > 8) bits.push(dRate > 0 ? 'tachycardia' : 'bradycardia');
                if (Math.abs(dForce) > 8) bits.push(dForce > 0 ? '+ inotropic' : '− inotropic');
                effect = bits.length ? bits.join(', ') : '<b style="color:#be123c">No change</b>';
            }
            this.records.push({ drug: d, dose, rate: this.rate, force: this.force, dRate, dForce, cond: this.cond, arrest: this.arrest });
            this.markDone(d.id);
            this.addRow([
                `<b>${d.short}</b> ${dose} ${d.unit}`,
                this.mod ? `+ ${this.cond}` : 'Ringer',
                `<b>${Math.round(this.rate)}</b>`,
                `<b>${this.force.toFixed(0)}</b>`,
                effect
            ], this.arrest ? 'down' : (dForce > 8 ? 'up' : ''));
            this.setStep(this.mod ? 5 : 4);
            this._chart();
            this._infer(d, dose, dRate, dForce);
            this._refresh();
        }

        wash() {
            if (this.busy) return;
            this.applied = false;
            this.washHeart(() => this._refresh());
        }

        clearMod() {
            if (this.busy) return;
            const was = this.mod ? this.mod.drug.short : '';
            this.mod = null;
            this.applied = false;
            this.washHeart(() => this._refresh());
            this.toast(`Prolonged wash — ${was} removed.`, 'info');
            this._controls();
        }

        /* ---------------- graph & inference ---------------- */
        _chart() {
            const ags = [];
            this.records.forEach(r => { if (ags.indexOf(r.drug.id) < 0) ags.push(r.drug.id); });
            if (!ags.length) return;
            const latest = id => this.records.filter(r => r.drug.id === id).pop();
            const rate = [], force = [];
            ags.forEach((id, k) => {
                const r = latest(id);
                if (!r) return;
                rate.push([k + 1, M.clamp(r.dRate, -100, 150)]);
                force.push([k + 1, M.clamp(r.dForce, -100, 150)]);
            });
            this.chart.draw({
                xMin: 0.4, xMax: ags.length + 0.6,
                yMin: -110, yMax: 130,
                xTicks: ags.map((_, k) => k + 1),
                xFmt: v => (DRUGS[ags[v - 1]] || {}).short || '',
                yLabel: '% change from control',
                barCount: ags.length,
                annotations: [{ y: 0, color: '#94a3b8' }],
                series: [
                    { name: 'Rate', color: '#34d399', type: 'bar', barWidth: 0.3, offset: -0.5, points: rate },
                    { name: 'Force', color: '#fbbf24', type: 'bar', barWidth: 0.3, offset: 0.5, points: force }
                ]
            });
        }

        _infer(d, dose, dRate, dForce) {
            let html = `<p>${d.short} <b>${dose} ${d.unit}</b>: rate ${dRate > 0 ? '+' : ''}${dRate.toFixed(0)}%, force ${dForce > 0 ? '+' : ''}${dForce.toFixed(0)}%`;
            html += this.arrest ? ` — <b style="color:#be123c">arrest in ${this.arrest}</b>.</p>` : '.</p>';
            html += `<p style="margin-top:6px;color:#475569">${d.note}</p>`;

            const ctrl = this.records.filter(r => r.drug.id === d.id && r.cond === 'control').pop();
            if (ctrl && this.mod) {
                const strong = Math.abs(ctrl.dForce) > Math.abs(ctrl.dRate) ? ctrl.dForce : ctrl.dRate;
                const now = Math.abs(ctrl.dForce) > Math.abs(ctrl.dRate) ? dForce : dRate;
                const frac = Math.abs(strong) > 4 ? now / strong : 1;
                let verdict;
                if (frac < 0.25) verdict = `The response is <b>abolished</b> — ${this.mod.drug.short} blocks the receptor mediating it.`;
                else if (frac < 0.7) verdict = `The response is <b>reduced</b> to ${(frac * 100).toFixed(0)}% — partial blockade.`;
                else verdict = `The response is <b>unchanged</b> — ${this.mod.drug.short} does not act on this pathway.`;
                html += `<p style="margin-top:8px;padding:8px;background:#f1f5f9;border-radius:6px">${verdict}</p>`;
            }

            const seen = {};
            this.records.forEach(r => { if (r.arrest) seen[r.arrest] = r.drug.short; });
            if (seen.systole && seen.diastole) {
                html += `<p style="margin-top:8px;padding:8px;background:#fefce8;border-radius:6px">
                    You have both classical arrests on one tracing: <b>${seen.systole}</b> stopped the heart in <b>systole</b>
                    and <b>${seen.diastole}</b> in <b>diastole</b> — calcium leaves the ventricle contracted, potassium leaves it relaxed.</p>`;
            }
            this.infer(html);
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.updateHeart(dt);
            this.hud('r', [
                { k: 'Rate', v: Math.round(this.rate) + '/min' },
                { k: 'Force', v: this.force.toFixed(0) + ' mm' },
                { k: 'Status', v: this.arrest ? 'arrest ' + this.arrest : 'beating', tone: this.arrest ? 'bad' : '' }
            ]);
        }

        draw(ctx) { this.drawHeart(ctx); }
    }

    LAB.register(12, FrogHeart);
})();
