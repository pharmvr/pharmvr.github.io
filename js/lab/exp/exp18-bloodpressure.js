/**
 * EXP 18 — Effect of drugs on the blood pressure of an anaesthetised animal
 *
 * The carotid artery of an anaesthetised cat is connected to a mercury
 * manometer whose float carries a writing point onto the drum. Drugs go in
 * intravenously through a cannula in the foreleg, and the tracing shows mean
 * arterial pressure with the pulse riding on it and slow respiratory waves.
 *
 * The experiment exists for one classical result — DALE'S VASOMOTOR REVERSAL.
 * Adrenaline raises blood pressure because α₁ vasoconstriction outweighs its
 * β₂ vasodilatation. Block the α receptors with phentolamine and the same dose
 * of adrenaline now LOWERS the pressure, because only β₂ is left. Noradrenaline,
 * which has almost no β₂ action, is merely abolished and never reverses — and
 * that difference is the proof that reversal is a receptor phenomenon.
 */
(function () {
    const { M, G } = LAB;

    const BENCH = 452;
    const DRUM = { cx: 286, top: 36, bot: 300, r: 104 };
    const MAN = { left: 430, right: 476, top: 120, bot: 344 };   // mercury U-tube
    const TABLE = { x: 556, y: 398, w: 392 };
    const PX_MM = 1.3;              // drum px per mmHg
    const BASE_MAP = 112, BASE_HR = 150, BASE_PP = 42;

    /** arterial pulse with a dicrotic notch */
    function pulse(p) {
        if (p < 0.12) return LAB.ease.out(p / 0.12);
        if (p < 0.34) return 1 - 0.45 * ((p - 0.12) / 0.22);
        if (p < 0.42) return 0.55 + 0.1 * Math.sin((p - 0.34) / 0.08 * Math.PI);
        return 0.55 * Math.exp(-(p - 0.42) * 3.4);
    }

    const DRUGS = {
        adrenaline: {
            id: 'adrenaline', name: 'Adrenaline', short: 'Adr', cls: 'α₁ + β₁₂ agonist',
            color: '#d97706', kind: 'agonist', unit: 'µg/kg', ec50: 2, hill: 1.5,
            dMAP: 0.42, dHR: 0.25, doses: [0.5, 1, 2, 5, 10],
            note: 'Adrenaline acts on both α₁ (vasoconstriction) and β₂ (vasodilatation). At these doses the α effect wins, so pressure <b>rises</b>.'
        },
        noradrenaline: {
            id: 'noradrenaline', name: 'Noradrenaline', short: 'NA', cls: 'Predominantly α₁ agonist',
            color: '#b45309', kind: 'agonist', unit: 'µg/kg', ec50: 2, hill: 1.5,
            dMAP: 0.48, dHR: -0.18, doses: [0.5, 1, 2, 5, 10],
            note: 'Noradrenaline is almost purely α₁. Pressure rises steeply, and the rise triggers a <b>reflex bradycardia</b> through the baroreceptors — note the heart rate falling while pressure climbs.'
        },
        isoprenaline: {
            id: 'isoprenaline', name: 'Isoprenaline', short: 'Iso', cls: 'Pure β agonist',
            color: '#16a34a', kind: 'agonist', unit: 'µg/kg', ec50: 1, hill: 1.5,
            dMAP: -0.3, dHR: 0.5, doses: [0.25, 0.5, 1, 2, 5],
            note: 'Isoprenaline has no α action at all: β₂ vasodilatation drops the pressure while β₁ drives the heart faster. Propranolol abolishes both.'
        },
        ach: {
            id: 'ach', name: 'Acetylcholine', short: 'ACh', cls: 'Muscarinic agonist',
            color: '#0d9488', kind: 'agonist', unit: 'µg/kg', ec50: 3, hill: 1.6,
            dMAP: -0.45, dHR: -0.3, fast: true, doses: [1, 2, 5, 10, 20],
            note: 'ACh causes a sharp, brief <b>fall</b> — muscarinic receptors on endothelium release nitric oxide. It is short-lived because plasma cholinesterase destroys it within seconds.'
        },
        histamine: {
            id: 'histamine', name: 'Histamine', short: 'His', cls: 'H₁ agonist',
            color: '#db2777', kind: 'agonist', unit: 'µg/kg', ec50: 3, hill: 1.5,
            dMAP: -0.38, dHR: 0.15, doses: [1, 2, 5, 10, 20],
            note: 'Histamine dilates arterioles through H₁ receptors, so the pressure falls. It is <b>not</b> affected by atropine or by α blockade — a different receptor entirely.'
        },
        nicotine: {
            id: 'nicotine', name: 'Nicotine', short: 'Nic', cls: 'Ganglionic stimulant',
            color: '#7c3aed', kind: 'agonist', unit: 'µg/kg', ec50: 20, hill: 1.4,
            dMAP: 0.34, dHR: 0.2, doses: [5, 10, 20, 50, 100],
            note: 'Nicotine stimulates sympathetic ganglia and the adrenal medulla, releasing catecholamines — so pressure <b>rises</b> indirectly.'
        },
        phentolamine: {
            id: 'phentolamine', name: 'Phentolamine', short: 'Phent', cls: 'α adrenergic blocker',
            color: '#dc2626', kind: 'antagonist', unit: 'mg/kg', blocks: 'alpha', doses: [0.5, 1, 2],
            note: 'An α blocker. Giving it is the pivot of this experiment — repeat <b>adrenaline</b> afterwards and watch the response invert.'
        },
        propranolol: {
            id: 'propranolol', name: 'Propranolol', short: 'Prop', cls: 'β adrenergic blocker',
            color: '#be123c', kind: 'antagonist', unit: 'mg/kg', blocks: 'beta', doses: [0.5, 1, 2],
            note: 'A β blocker. It abolishes the isoprenaline fall, and after it adrenaline gives an even purer pressor response because only α is left.'
        },
        atropine: {
            id: 'atropine', name: 'Atropine', short: 'Atr', cls: 'Muscarinic blocker',
            color: '#0891b2', kind: 'antagonist', unit: 'mg/kg', blocks: 'muscarinic', doses: [0.5, 1, 2],
            note: 'Blocks muscarinic receptors. The ACh fall disappears — and a <b>large</b> dose of ACh now gives a rise instead, through its nicotinic action on ganglia and the adrenal medulla.'
        }
    };

    class BloodPressure extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: BENCH, seed: 12 },
                syringe: true,
                tray: { x: 60, y: 516 },
                steps: [
                    'Anaesthetise the cat, cannulate the <b>carotid artery</b> and connect it through heparinised saline to the mercury manometer.',
                    'Cannulate a foreleg vein for intravenous injections and record a steady <b>normal blood pressure</b> tracing.',
                    'Inject a drug intravenously, flush the cannula, and let the pressure return to baseline before the next dose.',
                    'Record the response to <b>adrenaline</b>, <b>noradrenaline</b>, <b>isoprenaline</b> and <b>acetylcholine</b> in turn.',
                    'Give <b>phentolamine</b> and repeat adrenaline and noradrenaline.',
                    'Adrenaline now <b>lowers</b> the pressure while noradrenaline is merely abolished — Dale’s vasomotor reversal.'
                ],
                treatmentTitle: 'Drugs for i.v. injection',
                treatments: Object.values(DRUGS).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Drug & dose', 'Condition', 'Basal', 'Peak', 'Δ mmHg'],
                tableTitle: 'Blood pressure readings',
                chart: true,
                chartTitle: 'Change in mean arterial pressure',
                chartEmpty: { xMin: 0.4, xMax: 4.6, yMin: -60, yMax: 70, yLabel: 'Δ MAP (mmHg)', xTicks: [] },
                viva: [
                    {
                        q: 'What is vasomotor reversal (Dale’s phenomenon)?',
                        opts: ['Adrenaline stops working after α blockade', 'After α blockade, adrenaline lowers blood pressure instead of raising it, because its β₂ vasodilator action is unmasked', 'Noradrenaline becomes a vasodilator', 'Blood flows backwards'],
                        ans: 1,
                        exp: 'Adrenaline acts on both α₁ and β₂ receptors. Normally the pressor α effect dominates; remove it and the remaining β₂ dilatation is revealed, so the same dose now lowers pressure.'
                    },
                    {
                        q: 'Why does noradrenaline NOT show vasomotor reversal?',
                        opts: ['It is destroyed by phentolamine', 'It has negligible β₂ activity, so α blockade leaves nothing vasodilator to unmask', 'It acts only on the heart', 'It is given in too small a dose'],
                        ans: 1,
                        exp: 'Reversal requires a drug with both actions. Noradrenaline is essentially a pure α agonist, so blocking α simply abolishes its response — which is exactly how the experiment proves reversal is receptor-based.'
                    },
                    {
                        q: 'Noradrenaline raises blood pressure but slows the heart. The bradycardia is:',
                        opts: ['A direct action on the SA node', 'A baroreceptor reflex response to the rise in pressure', 'Due to β₂ blockade', 'An artefact of the manometer'],
                        ans: 1,
                        exp: 'Noradrenaline is a β₁ agonist and would speed the heart directly. The rise in pressure stimulates carotid and aortic baroreceptors, and the resulting vagal discharge overrides it — reflex bradycardia.'
                    },
                    {
                        q: 'After full atropinisation, a large dose of acetylcholine produces:',
                        opts: ['A larger fall in pressure', 'No change whatsoever', 'A rise in pressure, through its nicotinic action on ganglia and the adrenal medulla', 'Cardiac arrest'],
                        ans: 2,
                        exp: 'Atropine blocks only the muscarinic vasodepressor action. The nicotinic actions survive, and at high dose they release catecholamines, converting the fall into a rise.'
                    },
                    {
                        q: 'Why is a mercury manometer used rather than a water manometer?',
                        opts: ['Mercury is cheaper', 'Arterial pressures of around 100 mmHg would require a water column over a metre tall', 'Water freezes', 'Mercury conducts electricity'],
                        ans: 1,
                        exp: 'Mercury is about 13.6 times denser than water, so the column stays a convenient height. The trade-off is inertia, which damps the pulse contour.'
                    },
                    {
                        q: 'The acetylcholine fall in blood pressure is brief because:',
                        opts: ['The dose is small', 'Plasma and tissue cholinesterases hydrolyse it within seconds', 'It is excreted rapidly by the kidney', 'The receptors desensitise'],
                        ans: 1,
                        exp: 'Acetylcholine is destroyed almost as fast as it circulates, which is why the response is a sharp transient spike and why an anticholinesterase prolongs it dramatically.'
                    }
                ],
                inferenceHint: 'Record adrenaline and noradrenaline first, then give phentolamine and repeat both — only one of them reverses.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS.adrenaline;
            this.dose = this.drug.doses[2];
            this.records = [];
            this.kymo = new LAB.Kymograph({
                cx: DRUM.cx, top: DRUM.top, bot: DRUM.bot, r: DRUM.r, benchY: BENCH,
                label: 'BP TRACING',
                channels: [{ baseline: DRUM.bot, px: PX_MM, color: '#f8fafc', width: 1.4 }]
            });
            this.hotspots = [
                { x: MAN.left - 24, y: MAN.top, w: 96, h: MAN.bot - MAN.top, label: 'Mercury manometer with float and writing point' },
                { x: TABLE.x, y: TABLE.y - 86, w: TABLE.w, h: 96, label: 'Anaesthetised cat — carotid and venous cannulae' },
                { x: DRUM.cx - DRUM.r, y: DRUM.top, w: DRUM.r * 2, h: 56, label: 'Smoked drum' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.animalNo = (this.animalNo || 0) + 1;
            this.map = BASE_MAP;
            this.hr = BASE_HR;
            this.pulsePhase = 0;
            this.respPhase = 0;
            this.effect = null;
            this.blocks = {};
            this.peak = null;
            this.phase = 'settle';
            this.kymo.reset();
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

        get cond() {
            const on = Object.keys(this.blocks);
            return on.length ? on.map(k => DRUGS[this.blocks[k].id].short).join(' + ') : 'control';
        }
        get settled() { return !this.effect && Math.abs(this.map - BASE_MAP) < 5; }

        /* ---------------- pharmacology ---------------- */
        /**
         * Returns the fractional change in MAP and HR for this dose, after
         * applying whatever blockade is in force. The special cases are the
         * teaching points, so they are written out explicitly.
         */
        responseOf(d, dose) {
            const f = Math.pow(dose, d.hill) / (Math.pow(d.ec50, d.hill) + Math.pow(dose, d.hill));
            const a = !!this.blocks.alpha, b = !!this.blocks.beta, m = !!this.blocks.muscarinic;
            let dMAP = d.dMAP, dHR = d.dHR, note = null;

            if (d.id === 'adrenaline') {
                if (a && !b) { dMAP = -0.3; note = 'reversal'; }          // β₂ unmasked
                else if (a && b) dMAP = 0.02;                             // both blocked
                else if (b) { dMAP = 0.52; dHR = 0.02; }                  // pure α pressor
            } else if (d.id === 'noradrenaline') {
                if (a) { dMAP = 0.04; dHR = 0; }                          // abolished, never reversed
            } else if (d.id === 'isoprenaline') {
                if (b) { dMAP = -0.02; dHR = 0.02; }
            } else if (d.id === 'ach') {
                if (m) {
                    // muscarinic fall gone; nicotinic pressor action survives at high dose
                    const nic = Math.pow(dose, 2) / (Math.pow(12, 2) + Math.pow(dose, 2));
                    dMAP = 0.3 * nic; dHR = 0.12 * nic;
                    note = nic > 0.3 ? 'nicotinic rise' : 'abolished';
                }
            } else if (d.id === 'nicotine') {
                if (a) dMAP = 0.05;                                        // pressor effect is catecholamine-mediated
            }
            return { dMAP: dMAP * f, dHR: dHR * f, f, note };
        }

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            const on = Object.keys(this.blocks);
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Dose of ${d.short} i.v.</div>
                <div class="lab2-seg" id="bp-dose">${d.doses.map(v => `<button data-v="${v}" class="${v === this.dose ? 'active' : ''}">${v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">Units: ${d.unit}</div>
                <p style="margin-top:8px;font-size:11.5px;color:${on.length ? '#0f766e' : '#64748b'}">
                    <b>Blockade:</b> ${on.length ? on.map(k => DRUGS[this.blocks[k].id].short + ' (' + k + ')').join(', ') : 'none'}</p>
            `);
            const seg = this.$('bp-dose');
            if (seg) seg.querySelectorAll('button').forEach(b => b.onclick = () => {
                if (this.busy) return this.toast('Wait for the current response to settle.', 'warn');
                this.dose = +b.dataset.v;
                this._controls();
                this._refresh();
            });
        }

        _refresh() {
            const d = this.drug;
            if (this.phase === 'settle') {
                this.status('Cannulae in place. Record a <b>normal blood pressure</b> tracing before injecting.');
                this.actions([{ label: '⏩ Record normal tracing', primary: true, onClick: () => this.settle() }]);
            } else {
                const ok = this.settled;
                this.status(ok
                    ? `Ready — inject <b>${d.short} ${this.dose} ${d.unit}</b> intravenously (drag the syringe to the cannula).`
                    : 'Pressure still changing — wait for it to return to baseline.');
                this.actions([
                    { label: `💉 Inject ${d.short} ${this.dose} ${d.unit}`, primary: ok, disabled: !ok, onClick: () => this.autoInject() },
                    { label: '🐈 Fresh animal', onClick: () => this.resetAnimal() }
                ]);
            }
            this.hud('l', [
                { k: 'Animal', v: '#' + this.animalNo },
                { k: 'Blockade', v: this.cond === 'control' ? 'none' : this.cond, tone: this.cond === 'control' ? '' : 'warn' }
            ]);
        }

        /* ---------------- procedure ---------------- */
        settle() {
            this.timeLapse(2, 2.2, {
                label: 'Normal tracing',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(2);
                    this.toast(`Normal BP <b>${Math.round(this.map)} mmHg</b>, heart rate <b>${Math.round(this.hr)}/min</b>.`, 'success');
                    this._refresh();
                }
            });
        }

        getInjectZone() {
            if (this.phase !== 'ready' || !this.settled) return null;
            return { x: TABLE.x + 56, y: TABLE.y - 26, r: 24, label: 'I.V. cannula', angle: Math.PI * 0.18 };
        }

        onInjected(tr) {
            const d = DRUGS[tr.id];
            const dose = this.dose;
            this.kymo.mark(`${d.short} ${dose}`, d.color);

            if (d.kind === 'antagonist') {
                this.blocks[d.blocks] = d;
                this.markDone(d.id);
                this.addRow([`<b>${d.short}</b> ${dose} ${d.unit}`, 'blockade', '—', '—', '—'], 'muted');
                this.toast(`${d.name} given — ${d.blocks} receptors now blocked. Repeat the agonists.`, 'info');
                this.infer(`<p><b>${d.name} ${dose} ${d.unit} given intravenously.</b></p><p style="margin-top:6px;color:#475569">${d.note}</p>`);
                this.setStep(4);
                this._controls();
                this._refresh();
                return;
            }

            const r = this.responseOf(d, dose);
            this.effect = {
                t: 0, dur: d.fast ? 14 : 40,
                tauOn: d.fast ? 0.5 : 1.6, tauOff: d.fast ? 2.4 : 11,
                dMAP: r.dMAP * BASE_MAP, dHR: r.dHR * BASE_HR, note: r.note
            };
            this.peak = { basal: this.map, value: this.map, drug: d, dose, cond: this.cond, note: r.note };
            this.busy = true;
            this.setStep(3);
            this._refresh();
        }

        _record() {
            const p = this.peak;
            if (!p) return;
            const delta = p.value - p.basal;
            let effect;
            if (Math.abs(delta) < 5) effect = '<b style="color:#be123c">No change</b>';
            else if (delta > 0) effect = '<b style="color:#b91c1c">Rise</b>';
            else effect = '<b style="color:#1d4ed8">Fall</b>';
            this.records.push({ drug: p.drug, dose: p.dose, basal: p.basal, peak: p.value, delta, cond: p.cond, note: p.note });
            this.markDone(p.drug.id);
            this.addRow([
                `<b>${p.drug.short}</b> ${p.dose} ${p.drug.unit}`,
                p.cond === 'control' ? 'none' : p.cond,
                Math.round(p.basal) + '',
                `<b>${Math.round(p.value)}</b>`,
                `${delta > 0 ? '+' : ''}${delta.toFixed(0)} ${effect}`
            ], delta > 5 ? 'up' : delta < -5 ? 'down' : '');
            this.peak = null;
            this.busy = false;
            this._chart();
            this._infer();
            this._refresh();
        }

        /* ---------------- graph & inference ---------------- */
        _chart() {
            const ags = [];
            this.records.forEach(r => { if (ags.indexOf(r.drug.id) < 0) ags.push(r.drug.id); });
            const conds = [];
            this.records.forEach(r => { if (conds.indexOf(r.cond) < 0) conds.push(r.cond); });
            if (!ags.length) return;
            const shown = conds.slice(-3);
            const palette = ['#0d9488', '#dc2626', '#7c3aed'];
            let lo = -20, hi = 20;
            this.records.forEach(r => { lo = Math.min(lo, r.delta); hi = Math.max(hi, r.delta); });
            this.chart.draw({
                xMin: 0.4, xMax: ags.length + 0.6,
                yMin: Math.min(-25, lo * 1.25), yMax: Math.max(25, hi * 1.25),
                xTicks: ags.map((_, k) => k + 1),
                xFmt: v => (DRUGS[ags[v - 1]] || {}).short || '',
                yLabel: 'Δ MAP (mmHg)',
                barCount: ags.length,
                annotations: [{ y: 0, color: '#94a3b8' }],
                series: shown.map((c, i) => ({
                    name: c,
                    color: palette[i % palette.length],
                    type: 'bar',
                    barWidth: 0.22,
                    offset: (i - (shown.length - 1) / 2) * 1.1,
                    points: ags.map((id, k) => {
                        const rec = this.records.filter(r => r.drug.id === id && r.cond === c).pop();
                        return rec ? [k + 1, rec.delta] : null;
                    }).filter(Boolean)
                }))
            });
        }

        _infer() {
            const last = this.records[this.records.length - 1];
            if (!last) return;
            let html = `<p>${last.drug.short} <b>${last.dose} ${last.drug.unit}</b>: ${Math.round(last.basal)} → <b>${Math.round(last.peak)} mmHg</b> (${last.delta > 0 ? '+' : ''}${last.delta.toFixed(0)}).</p>`;
            html += `<p style="margin-top:6px;color:#475569">${last.drug.note}</p>`;

            if (last.note === 'reversal') {
                html += `<p style="margin-top:8px;padding:8px;background:#fef2f2;border-radius:6px">
                    <b>Vasomotor reversal.</b> The same dose of adrenaline that raised the pressure now lowers it.
                    α₁ constriction is blocked, leaving β₂ vasodilatation unopposed.</p>`;
            } else if (last.note === 'nicotinic rise') {
                html += `<p style="margin-top:8px;padding:8px;background:#fefce8;border-radius:6px">
                    After atropine the muscarinic fall is gone and a <b>rise</b> appears instead — the surviving nicotinic
                    action on sympathetic ganglia and the adrenal medulla.</p>`;
            }

            // the headline comparison, once both are on record under blockade
            const pair = ['adrenaline', 'noradrenaline'].map(id => ({
                ctrl: this.records.filter(r => r.drug.id === id && r.cond === 'control').pop(),
                blocked: this.records.filter(r => r.drug.id === id && r.cond.indexOf('Phent') >= 0).pop()
            }));
            if (pair[0].ctrl && pair[0].blocked && pair[1].ctrl && pair[1].blocked) {
                html += `<p style="margin-top:8px;padding:8px;background:#f0fdf4;border-radius:6px">
                    Adrenaline ${pair[0].ctrl.delta > 0 ? '+' : ''}${pair[0].ctrl.delta.toFixed(0)} →
                    <b>${pair[0].blocked.delta > 0 ? '+' : ''}${pair[0].blocked.delta.toFixed(0)} mmHg</b> after phentolamine — <b>reversed</b>.<br>
                    Noradrenaline ${pair[1].ctrl.delta > 0 ? '+' : ''}${pair[1].ctrl.delta.toFixed(0)} →
                    ${pair[1].blocked.delta > 0 ? '+' : ''}${pair[1].blocked.delta.toFixed(0)} mmHg — merely <b>abolished</b>.<br>
                    Only the drug with a β₂ action to unmask can reverse, which is what makes this a receptor phenomenon and not a quirk of the vessels.</p>`;
            }
            this.infer(html);
        }

        /* ---------------- simulation ---------------- */
        update(dt) {
            // transient drug effect: fast onset, slower decay
            let dMAP = 0, dHR = 0;
            if (this.effect) {
                const e = this.effect;
                e.t += dt;
                const env = Math.max(0, Math.exp(-e.t / e.tauOff) - Math.exp(-e.t / e.tauOn));
                const norm = Math.max(0.05, Math.exp(-1) - Math.exp(-e.tauOff / e.tauOn));
                const k = env / norm;
                dMAP = e.dMAP * k;
                dHR = e.dHR * k;
                if (e.t > e.dur) { this.effect = null; if (this.peak) this._record(); }
            }
            this.map = M.approach(this.map, BASE_MAP + dMAP, 6, dt);
            this.hr = M.approach(this.hr, BASE_HR + dHR, 4, dt);
            if (this.peak) {
                // track the furthest excursion from basal, in either direction
                if (Math.abs(this.map - this.peak.basal) > Math.abs(this.peak.value - this.peak.basal)) {
                    this.peak.value = this.map;
                }
            }

            this.pulsePhase += dt * this.hr / 60;
            while (this.pulsePhase >= 1) this.pulsePhase -= 1;
            this.respPhase += dt * 0.35;

            const pp = BASE_PP * (0.7 + 0.3 * this.map / BASE_MAP);
            const resp = Math.sin(this.respPhase * Math.PI * 2) * 3.5;
            this.bp = this.map + pp * (pulse(this.pulsePhase) - 0.4) + resp;
            this.kymo.update(dt, this.bp);

            this.hud('r', [
                { k: 'MAP', v: Math.round(this.map) + ' mmHg', tone: this.map > BASE_MAP + 12 ? 'bad' : (this.map < BASE_MAP - 12 ? 'warn' : '') },
                { k: 'Heart rate', v: Math.round(this.hr) + '/min' },
                { k: 'Resp', v: '21/min' }
            ]);
        }

        /* ---------------- drawing ---------------- */
        draw(ctx) {
            this.kymo.draw(ctx);
            this._manometer(ctx);
            this._table(ctx);
            this._readout(ctx);
        }

        _manometer(ctx) {
            const m = MAN;
            const yFloat = DRUM.bot - this.bp * PX_MM;
            const yFar = DRUM.bot - (2 * BASE_MAP - this.bp) * PX_MM * 0.55;
            ctx.save();
            // stand
            G.shadow(ctx, (m.left + m.right) / 2, BENCH + 2, 58, 9, 0.42);
            G.metal(ctx, m.left - 34, BENCH - 10, 118, 14, { tone: 'dark', r: 4 });
            G.metal(ctx, m.right + 26, m.top + 20, 9, BENCH - m.top - 30, { tone: 'steel', r: 2 });

            // the U-tube
            ctx.save();
            ctx.strokeStyle = 'rgba(214,232,245,0.5)'; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(m.left, m.top); ctx.lineTo(m.left, m.bot);
            ctx.lineTo(m.right, m.bot); ctx.lineTo(m.right, m.top);
            ctx.stroke();
            // mercury
            ctx.strokeStyle = '#b9c2cc'; ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(m.left, yFloat); ctx.lineTo(m.left, m.bot - 3);
            ctx.lineTo(m.right, m.bot - 3); ctx.lineTo(m.right, yFar);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2.5;
            ctx.beginPath(); ctx.moveTo(m.left - 2.5, yFloat + 6); ctx.lineTo(m.left - 2.5, m.bot - 8); ctx.stroke();
            ctx.restore();

            // glass over the top
            ctx.strokeStyle = 'rgba(236,248,255,0.75)'; ctx.lineWidth = 1.4;
            [m.left, m.right].forEach(x => {
                ctx.strokeRect(x - 7.5, m.top, 15, m.bot - m.top);
            });

            // mmHg scale beside the float limb
            ctx.strokeStyle = 'rgba(226,232,240,0.6)'; ctx.lineWidth = 1;
            for (let v = 0; v <= 200; v += 20) {
                const y = DRUM.bot - v * PX_MM;
                if (y < m.top || y > m.bot) continue;
                ctx.beginPath(); ctx.moveTo(m.left - 10, y); ctx.lineTo(m.left - (v % 40 ? 15 : 20), y); ctx.stroke();
                if (v % 40 === 0) G.text(ctx, String(v), m.left - 23, y + 3, { size: 8, align: 'right', color: 'rgba(226,232,240,0.7)', weight: 700 });
            }

            // float riding on the mercury, carrying the writing point to the drum
            G.metal(ctx, m.left - 6, yFloat - 5, 12, 10, { tone: 'brass', r: 2 });
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(m.left - 6, yFloat); ctx.lineTo(DRUM.cx + DRUM.r * 0.98, yFloat); ctx.stroke();
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(DRUM.cx + DRUM.r * 0.98 + 10, yFloat);
            ctx.lineTo(DRUM.cx + DRUM.r * 0.98 + 22, yFloat - 2.6);
            ctx.lineTo(DRUM.cx + DRUM.r * 0.98 + 22, yFloat + 2.6);
            ctx.closePath(); ctx.fill();

            G.text(ctx, 'MERCURY MANOMETER', (m.left + m.right) / 2, m.top - 12,
                { size: 9, align: 'center', weight: 800, color: 'rgba(226,232,240,0.8)', shadow: true });

            // tubing from the carotid cannula
            ctx.strokeStyle = 'rgba(190,60,70,0.75)'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(m.right, m.top + 10);
            ctx.bezierCurveTo(m.right + 70, m.top - 20, TABLE.x + 10, TABLE.y - 120, TABLE.x + 112, TABLE.y - 58);
            ctx.stroke();
            ctx.restore();
        }

        /** anaesthetised cat, draped, with only the cannulation windows exposed */
        _table(ctx) {
            const t = TABLE;
            ctx.save();
            G.shadow(ctx, t.x + t.w / 2, t.y + 18, t.w * 0.46, 10, 0.45);
            G.metal(ctx, t.x, t.y, t.w, 16, { tone: 'steel', r: 4 });
            ctx.fillStyle = '#64748b';
            [t.x + 26, t.x + t.w - 34].forEach(x => ctx.fillRect(x, t.y + 14, 8, BENCH - t.y - 14));

            // surgical drape over the animal
            const g = ctx.createLinearGradient(0, t.y - 86, 0, t.y);
            g.addColorStop(0, '#5eaa9a'); g.addColorStop(0.5, '#3f8d7e'); g.addColorStop(1, '#2d6e62');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(t.x + 14, t.y);
            ctx.bezierCurveTo(t.x + 36, t.y - 76, t.x + t.w - 60, t.y - 82, t.x + t.w - 18, t.y);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(15,60,52,0.4)'; ctx.lineWidth = 1; ctx.stroke();
            // drape folds
            ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1.4;
            for (let i = 0; i < 4; i++) {
                const fx = t.x + 70 + i * 68;
                ctx.beginPath(); ctx.moveTo(fx, t.y - 4); ctx.quadraticCurveTo(fx + 6, t.y - 40, fx - 4, t.y - 66); ctx.stroke();
            }

            // fenestration over the neck, showing the carotid cannula
            ctx.fillStyle = '#f3d9d4';
            G.rr(ctx, t.x + 92, t.y - 66, 48, 30, 5); ctx.fill();
            ctx.strokeStyle = 'rgba(120,70,70,0.4)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.strokeStyle = '#b91c1c'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(t.x + 100, t.y - 44); ctx.lineTo(t.x + 132, t.y - 56); ctx.stroke();
            G.metal(ctx, t.x + 126, t.y - 62, 16, 8, { tone: 'chrome', r: 2, stroke: false });
            G.text(ctx, 'carotid', t.x + 116, t.y - 72, { size: 7.5, align: 'center', weight: 700, color: '#0f172a' });

            // i.v. cannula in the foreleg — the injection target
            ctx.fillStyle = '#f3d9d4';
            G.rr(ctx, t.x + 36, t.y - 38, 40, 24, 4); ctx.fill();
            ctx.strokeStyle = '#1d4ed8'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.moveTo(t.x + 44, t.y - 22); ctx.lineTo(t.x + 70, t.y - 30); ctx.stroke();
            G.metal(ctx, t.x + 48, t.y - 32, 18, 7, { tone: 'steel', r: 2, stroke: false });
            G.text(ctx, 'i.v.', t.x + 56, t.y - 42, { size: 7.5, align: 'center', weight: 700, color: '#0f172a' });

            // anaesthetic tubing at the head end
            ctx.strokeStyle = 'rgba(148,163,184,0.85)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(t.x + t.w - 42, t.y - 30);
            ctx.bezierCurveTo(t.x + t.w + 10, t.y - 50, t.x + t.w + 6, t.y - 96, t.x + t.w - 26, t.y - 104);
            ctx.stroke();
            G.text(ctx, 'ANAESTHETISED · CAT', t.x + t.w / 2, t.y - 92,
                { size: 9, align: 'center', weight: 800, color: 'rgba(226,232,240,0.7)', shadow: true });
            ctx.restore();
        }

        _readout(ctx) {
            const x = 596, y = 36;
            ctx.save();
            ctx.fillStyle = 'rgba(8,15,26,0.72)';
            G.rr(ctx, x, y, 320, 54, 8); ctx.fill();
            G.lcd(ctx, x + 10, y + 10, 96, 34, Math.round(this.map) + '', { label: 'MEAN BP mmHg', color: '#34f5c5', size: 16 });
            G.lcd(ctx, x + 116, y + 10, 96, 34, Math.round(this.bp) + '', { label: 'INSTANT mmHg', color: '#fbbf24', size: 16 });
            G.lcd(ctx, x + 222, y + 10, 88, 34, Math.round(this.hr) + '', { label: 'RATE /min', color: '#a78bfa', size: 16 });
            ctx.restore();
        }
    }

    LAB.register(18, BloodPressure);
})();
