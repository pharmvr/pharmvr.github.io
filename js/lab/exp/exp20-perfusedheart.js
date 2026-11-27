/**
 * EXP 20 — Effect of drugs on the perfused frog heart
 *
 * The same heart as exp 12, but perfused continuously from a reservoir held at
 * a constant head instead of hanging on a static column of Ringer. That one
 * change adds a measurement the Straub preparation cannot make: the CORONARY
 * OUTFLOW, counted as drops leaving the heart per minute and written on the
 * drum as a second trace above the force tracing.
 *
 * With flow measured separately from force, drugs that look alike on a Straub
 * tracing come apart:
 *   Adrenaline    → raises rate, force AND flow (β₁ on the heart, β₂ on vessels)
 *   Nitroglycerine→ raises flow with essentially NO change in rate or force
 *   Adenosine     → raises flow while SLOWING the heart — opposite directions
 *   Vasopressin   → lowers flow with no direct effect on the beat
 *   Acetylcholine → lowers rate, force and flow together
 *
 * Nitroglycerine is the point of the experiment: a pure coronary vasodilator,
 * invisible on a Straub tracing and obvious here.
 */
(function () {
    const { M } = LAB;

    const BASE_RATE = 38, BASE_FORCE = 38, BASE_FLOW = 22;

    const DRUGS = {
        adrenaline: {
            id: 'adrenaline', name: 'Adrenaline', short: 'Adr', cls: 'β₁ / β₂ agonist',
            color: '#d97706', kind: 'agonist', unit: 'µg', ec50: 0.5, hill: 1.5,
            dRate: 0.6, dForce: 0.8, dFlow: 0.7, blockedBy: ['propranolol'], doses: [0.05, 0.1, 0.25, 0.5, 1, 2],
            note: 'Adrenaline does everything at once: β₁ on the myocardium raises rate and force, β₂ and the metabolic demand of the faster heart widen the coronaries. Propranolol abolishes all three.'
        },
        gtn: {
            id: 'gtn', name: 'Nitroglycerine', short: 'GTN', cls: 'Nitric oxide donor',
            color: '#16a34a', kind: 'agonist', unit: 'µg', ec50: 2, hill: 1.5,
            dRate: 0.02, dForce: 0.05, dFlow: 0.9, blockedBy: [], doses: [0.5, 1, 2, 5, 10],
            note: 'GTN releases nitric oxide, raising cGMP in vascular smooth muscle. The coronaries dilate and outflow rises sharply while rate and force are <b>essentially unchanged</b> — a pure vasodilator, which a Straub preparation could not have shown.'
        },
        adenosine: {
            id: 'adenosine', name: 'Adenosine', short: 'Ado', cls: 'Purinergic A₁ / A₂ₐ agonist',
            color: '#0891b2', kind: 'agonist', unit: 'µg', ec50: 4, hill: 1.5,
            dRate: -0.65, dForce: -0.2, dFlow: 0.85, blockedBy: [], doses: [1, 2, 5, 10, 20],
            note: 'Adenosine pulls in two directions: <b>A₁</b> receptors on the pacemaker slow the heart while <b>A₂ₐ</b> receptors on the coronary vessels dilate them. Flow rises as rate falls — the basis of its use in cardiac stress testing.'
        },
        vasopressin: {
            id: 'vasopressin', name: 'Vasopressin', short: 'AVP', cls: 'V₁ agonist',
            color: '#7c3aed', kind: 'agonist', unit: 'mU', ec50: 5, hill: 1.6,
            dRate: -0.05, dForce: -0.02, dFlow: -0.62, blockedBy: [], doses: [1, 2, 5, 10, 20],
            note: 'Vasopressin constricts coronary smooth muscle through <b>V₁</b> receptors. Outflow falls while the beat itself is barely touched — the mirror image of GTN.'
        },
        ach: {
            id: 'ach', name: 'Acetylcholine', short: 'ACh', cls: 'Muscarinic M₂ agonist',
            color: '#0d9488', kind: 'agonist', unit: 'µg', ec50: 1, hill: 1.6,
            dRate: -0.8, dForce: -0.7, dFlow: -0.45, arrest: 'diastole', arrestAt: 0.82,
            blockedBy: ['atropine'], doses: [0.1, 0.25, 0.5, 1, 2, 5],
            note: 'ACh slows and weakens the heart through M₂ receptors, and outflow falls with it — largely because a slower, weaker heart needs less perfusion. Atropine abolishes the whole picture.'
        },
        atropine: {
            id: 'atropine', name: 'Atropine', short: 'Atr', cls: 'Muscarinic antagonist',
            color: '#dc2626', kind: 'antagonist', unit: 'µg', kb: 1, doses: [0.5, 1, 2],
            note: 'Blocks M₂ receptors, abolishing the acetylcholine response while leaving GTN, adenosine and vasopressin untouched.'
        },
        propranolol: {
            id: 'propranolol', name: 'Propranolol', short: 'Prop', cls: 'Non-selective β blocker',
            color: '#be123c', kind: 'antagonist', unit: 'µg', kb: 1, doses: [0.5, 1, 2],
            note: 'Blocks β receptors. It abolishes the adrenaline response but not the dilatation produced by GTN, which acts on the vessel wall directly and needs no receptor at all.'
        }
    };

    class PerfusedHeart extends LAB.HeartRig {
        rig() { return { perfused: true, baseRate: BASE_RATE, baseForce: BASE_FORCE, baseFlow: BASE_FLOW }; }

        config() {
            return {
                room: { benchY: LAB.HEART_RIG.BENCH, seed: 10 },
                syringe: false,
                steps: [
                    'Cannulate the frog heart and connect it to a reservoir of frog Ringer held at a <b>constant head</b> of about 4 cm.',
                    'Attach the apex thread to the heart lever, and lead the coronary effluent to the <b>drop counter</b>.',
                    'Allow perfusion to steady, then record a normal tracing: rate, force and <b>drops per minute</b>.',
                    'Add a drug to the perfusion fluid and watch <b>both</b> traces — force below, coronary outflow above.',
                    'Wash out and repeat, noting for each drug whether it changes the beat, the flow, or both.',
                    'Compare <b>GTN</b> with <b>adrenaline</b>: one moves only the flow trace, the other moves everything.'
                ],
                treatmentTitle: 'Reagents on the rack',
                treatments: Object.values(DRUGS).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Drug & dose', 'Rate /min', 'Force (mm)', 'Flow /min', 'Effect'],
                tableTitle: 'Perfusion readings',
                chart: true,
                chartTitle: 'Force vs coronary flow',
                chartEmpty: { xMin: 0.4, xMax: 4.6, yMin: -100, yMax: 120, yLabel: '% change from control', xTicks: [] },
                viva: [
                    {
                        q: 'What does the perfused heart preparation measure that the Straub preparation cannot?',
                        opts: ['Heart rate', 'Force of contraction', 'Coronary outflow', 'The effect of atropine'],
                        ans: 2,
                        exp: 'A Straub cannula holds a static volume, so nothing flows through the coronaries. Continuous perfusion at constant pressure lets the effluent be collected and counted, making coronary vascular effects measurable.'
                    },
                    {
                        q: 'Nitroglycerine raises coronary outflow with almost no change in rate or force. This shows it is:',
                        opts: ['A positive inotrope', 'A direct vasodilator acting on the vessel wall, not on the myocardium', 'A β agonist', 'A muscarinic antagonist'],
                        ans: 1,
                        exp: 'GTN donates nitric oxide to vascular smooth muscle, raising cGMP. The effect is confined to the vessels, which is why the force tracing is unchanged while the flow trace rises.'
                    },
                    {
                        q: 'Adenosine increases coronary flow while slowing the heart because:',
                        opts: ['It is a partial agonist', 'A₁ receptors on the pacemaker slow it while A₂ₐ receptors on coronary vessels dilate them', 'It blocks calcium channels in the node only', 'The flow measurement is artefactual'],
                        ans: 1,
                        exp: 'Two receptor subtypes with opposite consequences in two tissues. This separation is exactly why adenosine is used to produce coronary steal in pharmacological stress testing.'
                    },
                    {
                        q: 'Why must the reservoir be kept at a constant head of pressure?',
                        opts: ['To keep the Ringer warm', 'Because outflow depends on perfusion pressure as well as vascular resistance — a falling head would be mistaken for vasoconstriction', 'To prevent air bubbles', 'To sterilise the fluid'],
                        ans: 1,
                        exp: 'Flow = pressure / resistance. If the driving pressure drifts, changes in outflow cannot be attributed to the drug, so the Mariotte bottle holds the head constant as the reservoir empties.'
                    },
                    {
                        q: 'Propranolol abolishes the adrenaline response but not the GTN response. The reason is:',
                        opts: ['GTN is more potent', 'GTN acts directly on vascular smooth muscle without any receptor, so receptor blockade cannot prevent it', 'Propranolol destroys adrenaline', 'GTN is a β agonist'],
                        ans: 1,
                        exp: 'Nitrates are not receptor agonists at all; they release NO intracellularly. A receptor antagonist has nothing to block, which is the same principle as nifedipine surviving blockade in the smooth-muscle experiments.'
                    },
                    {
                        q: 'Vasopressin lowers coronary outflow with little change in the beat. It acts through:',
                        opts: ['β₂ receptors', 'V₁ receptors on vascular smooth muscle', 'M₂ receptors', 'Nitric oxide'],
                        ans: 1,
                        exp: 'V₁ receptors are Gq-coupled on vascular smooth muscle and cause constriction. Clinically, this coronary constriction is why vasopressin must be used cautiously in ischaemic heart disease.'
                    }
                ],
                inferenceHint: 'Record a normal tracing, then compare adrenaline with GTN — watch which of the two traces each one moves.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS.adrenaline;
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
            this.applied = false;
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
        get dirty() { return this.applied || this.arrest || Math.abs(this.flow - this.R.baseFlow * this.vigour) > 2.5; }

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
            const v = this.vigour;
            this.rateTarget = Math.max(0, this.R.baseRate * v * (1 + d.dRate * f) + M.randn() * 0.7);
            this.forceTarget = Math.max(0, this.R.baseForce * v * (1 + d.dForce * f) + M.randn() * 0.7);
            this.flowTarget = Math.max(0, this.R.baseFlow * v * (1 + d.dFlow * f) + M.randn() * 0.5);
            if (d.arrest && f > d.arrestAt) this.arrest = d.arrest;
            return f;
        }

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Dose of ${d.short} into the perfusate</div>
                <div class="lab2-seg" id="ph-dose">${d.doses.map(v => `<button data-v="${v}" class="${v === this.dose ? 'active' : ''}">${v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">Units: ${d.unit} into the perfusion fluid</div>
                <p style="margin-top:8px;font-size:11.5px;color:${this.mod ? '#0f766e' : '#64748b'}"><b>Perfusate:</b> ${this.mod ? this.mod.drug.short + ' ' + this.mod.dose + ' ' + this.mod.drug.unit + ' present' : 'plain frog Ringer'}</p>
                <p style="margin-top:8px;font-size:11px;color:#475569">Upper trace = <b style="color:#0284c7">coronary outflow</b><br>Lower trace = <b>force of contraction</b></p>
            `);
            const seg = this.$('ph-dose');
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
                this.status('Heart perfused at constant head. Record a <b>normal tracing</b> before giving anything.');
                this.actions([{ label: '⏩ Record normal tracing', primary: true, onClick: () => this.settle() }]);
            } else {
                const dirty = this.dirty;
                this.status(dirty
                    ? 'Drug still in the perfusate — <b>wash through</b> with fresh Ringer and let flow return to baseline.'
                    : `Ready — add <b>${d.short} ${this.dose} ${d.unit}</b>, or drag the micropipette into the cannula.`);
                const list = [
                    { label: `💧 Add ${d.short} ${this.dose} ${d.unit}`, primary: !dirty, disabled: dirty, onClick: () => this.addDrug() },
                    { label: '🚿 Wash through', disabled: !dirty, onClick: () => this.wash() }
                ];
                if (this.mod) list.push({ label: '🧼 Prolonged wash (clear ' + this.mod.drug.short + ')', onClick: () => this.clearMod() });
                list.push({ label: '🐸 Fresh heart', onClick: () => this.resetAnimal() });
                this.actions(list);
            }
            this.hud('l', [
                { k: 'Heart', v: '#' + this.heartNo },
                { k: 'Perfusate', v: this.mod ? this.mod.drug.short : 'Ringer', tone: this.mod ? 'warn' : '' }
            ]);
        }

        /* ---------------- procedure ---------------- */
        settle() {
            this.timeLapse(3, 2.4, {
                label: 'Normal tracing',
                onDone: () => {
                    this.phase = 'ready';
                    this.baseline = { rate: this.rate, force: this.force, flow: this.flow };
                    this.setStep(3);
                    this.toast(`Normal tracing: <b>${Math.round(this.rate)}/min</b>, <b>${this.force.toFixed(0)} mm</b>, <b>${Math.round(this.flow)}</b> drops/min.`, 'success');
                    this._refresh();
                }
            });
        }

        pipetteDropped() {
            if (this.phase === 'settle') return this.toast('Record a normal tracing first.', 'warn');
            if (this.dirty) return this.toast('Wash through before the next drug.', 'warn');
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
                this.timeLapse(1, 2.8, { label: 'Observing', onDone: () => this._record(d, dose) });
            } else {
                this.mod = { drug: d, dose };
                this.timeLapse(3, 2.2, {
                    label: d.short + ' equilibration',
                    onDone: () => {
                        this.markDone(d.id);
                        this.addRow([`<b>${d.short}</b> ${dose} ${d.unit}`, '—', '—', '—', 'blocker in perfusate'], 'muted');
                        this.toast(`${d.name} in the perfusate. Repeat the agonists and see which survive.`, 'info');
                        this.infer(`<p><b>${d.name} added to the perfusion fluid.</b></p><p style="margin-top:6px;color:#475569">${d.note}</p>`);
                        this._controls();
                        this._refresh();
                    }
                });
            }
        }

        _record(d, dose) {
            const b = this.baseline || { rate: BASE_RATE, force: BASE_FORCE, flow: BASE_FLOW };
            const dRate = (this.rate - b.rate) / b.rate * 100;
            const dForce = (this.force - b.force) / b.force * 100;
            const dFlow = (this.flow - b.flow) / b.flow * 100;
            let effect;
            if (this.arrest) effect = `<b style="color:#be123c">Arrest in ${this.arrest}</b>`;
            else {
                const beat = Math.abs(dForce) > 10 || Math.abs(dRate) > 10;
                const vasc = Math.abs(dFlow) > 10;
                if (vasc && !beat) effect = `<b style="color:#0284c7">Flow only</b> (${dFlow > 0 ? 'dilatation' : 'constriction'})`;
                else if (beat && !vasc) effect = 'Cardiac only';
                else if (beat && vasc) effect = 'Cardiac + vascular';
                else effect = '<b style="color:#be123c">No change</b>';
            }
            this.records.push({ drug: d, dose, rate: this.rate, force: this.force, flow: this.flow, dRate, dForce, dFlow, cond: this.cond });
            this.markDone(d.id);
            this.addRow([
                `<b>${d.short}</b> ${dose} ${d.unit}${this.mod ? ' <small>+' + this.cond + '</small>' : ''}`,
                `<b>${Math.round(this.rate)}</b>`,
                `<b>${this.force.toFixed(0)}</b>`,
                `<b>${Math.round(this.flow)}</b>`,
                effect
            ], dFlow > 10 ? 'up' : dFlow < -10 ? 'down' : '');
            this.setStep(this.mod ? 5 : 4);
            this._chart();
            this._infer(d, dose, dRate, dForce, dFlow);
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
            const force = [], flow = [];
            ags.forEach((id, k) => {
                const r = latest(id);
                if (!r) return;
                force.push([k + 1, M.clamp(r.dForce, -100, 150)]);
                flow.push([k + 1, M.clamp(r.dFlow, -100, 150)]);
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
                    { name: 'Force', color: '#fbbf24', type: 'bar', barWidth: 0.3, offset: -0.5, points: force },
                    { name: 'Coronary flow', color: '#38bdf8', type: 'bar', barWidth: 0.3, offset: 0.5, points: flow }
                ]
            });
        }

        _infer(d, dose, dRate, dForce, dFlow) {
            let html = `<p>${d.short} <b>${dose} ${d.unit}</b>: rate ${dRate > 0 ? '+' : ''}${dRate.toFixed(0)}%, force ${dForce > 0 ? '+' : ''}${dForce.toFixed(0)}%, coronary flow <b>${dFlow > 0 ? '+' : ''}${dFlow.toFixed(0)}%</b>.</p>`;
            html += `<p style="margin-top:6px;color:#475569">${d.note}</p>`;

            const ctrl = this.records.filter(r => r.drug.id === d.id && r.cond === 'control').pop();
            if (ctrl && this.mod) {
                const frac = Math.abs(ctrl.dFlow) > 5 ? dFlow / ctrl.dFlow : 1;
                let verdict;
                if (frac < 0.25) verdict = `The response is <b>abolished</b> — ${this.mod.drug.short} blocks the receptor mediating it.`;
                else if (frac < 0.7) verdict = `The response is <b>reduced</b> to ${(frac * 100).toFixed(0)}% — partial blockade.`;
                else verdict = `The response <b>survives</b> the blocker — ${d.short} does not need that receptor.`;
                html += `<p style="margin-top:8px;padding:8px;background:#f1f5f9;border-radius:6px">${verdict}</p>`;
            }

            // the headline comparison, once both are on record
            const adr = this.records.filter(r => r.drug.id === 'adrenaline' && r.cond === 'control').pop();
            const gtn = this.records.filter(r => r.drug.id === 'gtn' && r.cond === 'control').pop();
            if (adr && gtn) {
                html += `<p style="margin-top:8px;padding:8px;background:#f0fdf4;border-radius:6px">
                    <b>Adrenaline</b> moved force by ${adr.dForce.toFixed(0)}% and flow by ${adr.dFlow.toFixed(0)}%;
                    <b>GTN</b> moved force by only ${gtn.dForce.toFixed(0)}% but flow by ${gtn.dFlow.toFixed(0)}%.
                    Separating the two traces is what distinguishes a <b>cardiac stimulant</b> from a <b>pure coronary vasodilator</b> — a Straub preparation would have shown GTN as inactive.</p>`;
            }
            this.infer(html);
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.updateHeart(dt);
            this.hud('r', [
                { k: 'Rate', v: Math.round(this.rate) + '/min' },
                { k: 'Force', v: this.force.toFixed(0) + ' mm' },
                { k: 'Flow', v: Math.round(this.flow) + '/min', tone: this.baseline && this.flow > this.baseline.flow * 1.2 ? 'good' : '' }
            ]);
        }

        draw(ctx) { this.drawHeart(ctx); }
    }

    LAB.register(20, PerfusedHeart);
})();
