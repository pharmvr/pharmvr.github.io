/**
 * EXP 19 — Dale's vasoperfusion of the isolated rabbit ear
 *
 * An excised rabbit ear is perfused through the central artery with Ringer from
 * a reservoir held at a constant head. Because the driving pressure is fixed,
 * the rate at which fluid drips from the cut veins measures one thing only:
 * the calibre of the vessels. Drugs are injected into the perfusion line.
 *
 * This is exp 18 with the heart taken out of the argument. In the whole animal
 * a drug may change blood pressure by acting on the heart, on the vessels, or
 * on reflexes, and the tracing cannot say which. Here there is no heart, no
 * nervous system and no reflex — a change in outflow can only be vascular.
 *
 * Dale's vasomotor reversal therefore appears again, and now it is proved to be
 * a property of the vessel wall: adrenaline constricts, and after phentolamine
 * the same dose dilates, while noradrenaline is merely abolished.
 */
(function () {
    const { M, G } = LAB;

    const BENCH = 452;
    const DRUM = { cx: 286, top: 36, bot: 300, r: 104 };
    const RES = { x: 470, y: 176 };                  // constant-head reservoir
    const EAR = { x: 712, baseY: 404, len: 236 };    // mounted ear
    const DROP = { x: 886, from: 300, to: 404 };
    const PX_FLOW = 3.6;                             // drum px per drop/min
    const BASE_FLOW = 24;

    const DRUGS = {
        adrenaline: {
            id: 'adrenaline', name: 'Adrenaline', short: 'Adr', cls: 'α₁ + β₂ agonist',
            color: '#d97706', kind: 'agonist', unit: 'µg', ec50: 2, hill: 1.5,
            dFlow: -0.55, doses: [0.5, 1, 2, 5, 10],
            note: 'Adrenaline constricts the ear vessels through <b>α₁</b> receptors and outflow falls. Its β₂ dilator action is present but overwhelmed — until the α receptors are blocked.'
        },
        noradrenaline: {
            id: 'noradrenaline', name: 'Noradrenaline', short: 'NA', cls: 'Predominantly α₁ agonist',
            color: '#b45309', kind: 'agonist', unit: 'µg', ec50: 2, hill: 1.5,
            dFlow: -0.6, doses: [0.5, 1, 2, 5, 10],
            note: 'Noradrenaline is essentially a pure α₁ agonist, so it constricts powerfully — and has no β₂ action for α blockade to unmask.'
        },
        isoprenaline: {
            id: 'isoprenaline', name: 'Isoprenaline', short: 'Iso', cls: 'Pure β agonist',
            color: '#16a34a', kind: 'agonist', unit: 'µg', ec50: 1, hill: 1.5,
            dFlow: 0.65, doses: [0.25, 0.5, 1, 2, 5],
            note: 'Isoprenaline has no α action at all, so it dilates and outflow rises. Propranolol abolishes it, confirming the β₂ receptor.'
        },
        ach: {
            id: 'ach', name: 'Acetylcholine', short: 'ACh', cls: 'Muscarinic agonist',
            color: '#0d9488', kind: 'agonist', unit: 'µg', ec50: 2, hill: 1.6,
            dFlow: 0.5, doses: [1, 2, 5, 10, 20],
            note: 'ACh dilates through muscarinic receptors on the endothelium, which release nitric oxide. Neither α nor β blockade touches it.'
        },
        histamine: {
            id: 'histamine', name: 'Histamine', short: 'His', cls: 'H₁ agonist',
            color: '#db2777', kind: 'agonist', unit: 'µg', ec50: 2, hill: 1.5,
            dFlow: 0.48, doses: [1, 2, 5, 10, 20],
            note: 'Histamine dilates the vessels through H₁ receptors — a third, quite separate receptor producing the same mechanical result.'
        },
        papaverine: {
            id: 'papaverine', name: 'Papaverine', short: 'Pap', cls: 'Musculotropic relaxant',
            color: '#0891b2', kind: 'agonist', unit: 'µg', ec50: 20, hill: 1.6,
            dFlow: 0.6, doses: [5, 10, 20, 50, 100],
            note: 'Papaverine relaxes vascular smooth muscle <b>directly</b> by inhibiting phosphodiesterase. No receptor is involved, so no antagonist can prevent it — the control that proves the vessels can still dilate.'
        },
        phentolamine: {
            id: 'phentolamine', name: 'Phentolamine', short: 'Phent', cls: 'α adrenergic blocker',
            color: '#dc2626', kind: 'antagonist', unit: 'µg', blocks: 'alpha', doses: [10, 20, 50],
            note: 'An α blocker. Add it to the perfusate, then repeat <b>adrenaline</b> and <b>noradrenaline</b> — only one of them will invert.'
        },
        propranolol: {
            id: 'propranolol', name: 'Propranolol', short: 'Prop', cls: 'β adrenergic blocker',
            color: '#be123c', kind: 'antagonist', unit: 'µg', blocks: 'beta', doses: [10, 20, 50],
            note: 'A β blocker. It abolishes the isoprenaline dilatation, and prevents adrenaline from reversing even after α blockade — because then neither receptor is left.'
        }
    };

    class Vasoperfusion extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: BENCH, seed: 14 },
                syringe: true,
                tray: { x: 56, y: 516 },
                steps: [
                    'Excise a rabbit ear, cannulate the <b>central artery</b> and perfuse with Ringer from a reservoir at a <b>constant head</b>.',
                    'Mount the ear and lead the venous outflow to the drop counter. Record a steady baseline of drops per minute.',
                    'Inject a drug into the <b>side port</b> of the perfusion line and watch the outflow change.',
                    'Allow the drug to wash through and the rate to return to baseline before the next injection.',
                    'Record adrenaline, noradrenaline, isoprenaline and acetylcholine under control conditions.',
                    'Add <b>phentolamine</b> and repeat adrenaline and noradrenaline — reversal, with no heart involved.'
                ],
                treatmentTitle: 'Drugs for the perfusion line',
                treatments: Object.values(DRUGS).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Drug & dose', 'Blockade', 'Basal', 'Peak', 'Δ drops/min'],
                tableTitle: 'Outflow readings',
                chart: true,
                chartTitle: 'Change in venous outflow',
                chartEmpty: { xMin: 0.4, xMax: 4.6, yMin: -20, yMax: 25, yLabel: 'Δ drops/min', xTicks: [] },
                viva: [
                    {
                        q: 'Why is the perfusion pressure held constant?',
                        opts: ['To save Ringer', 'Because outflow then depends only on vascular calibre, so any change in drop rate must be a vascular effect', 'To keep the ear warm', 'To prevent clotting'],
                        ans: 1,
                        exp: 'Flow = pressure / resistance. Fixing the pressure makes outflow a direct inverse measure of resistance, which is the whole basis of the preparation.'
                    },
                    {
                        q: 'What does this preparation prove that a blood pressure experiment cannot?',
                        opts: ['That adrenaline is potent', 'That the effect is purely vascular, since there is no heart, no nervous system and no reflex to confound it', 'That the ear is alive', 'That Ringer is isotonic'],
                        ans: 1,
                        exp: 'In the whole animal a pressure change could come from the heart, the vessels or a reflex. Here only the vessels remain, so vasomotor reversal is established as a property of the vessel wall.'
                    },
                    {
                        q: 'After phentolamine, adrenaline increases the outflow. This is because:',
                        opts: ['Phentolamine is a vasodilator', 'Blocking α₁ unmasks adrenaline’s β₂ vasodilator action', 'Adrenaline is destroyed', 'The pressure has risen'],
                        ans: 1,
                        exp: 'Adrenaline has both actions at once. Removing the dominant constrictor action leaves the dilator action to express itself — vasomotor reversal, here with no cardiac component at all.'
                    },
                    {
                        q: 'Papaverine still dilates after both α and β blockade because it:',
                        opts: ['Is a β agonist', 'Relaxes smooth muscle directly, downstream of every receptor', 'Blocks α receptors itself', 'Raises the perfusion pressure'],
                        ans: 1,
                        exp: 'Phosphodiesterase inhibition raises cyclic nucleotides inside the muscle cell regardless of receptors, so receptor antagonists are powerless against it. It also confirms the vessels are still capable of dilating.'
                    },
                    {
                        q: 'Why must the Ringer be warmed and the ear kept moist?',
                        opts: ['For appearance', 'Cold causes vasoconstriction and drying damages the tissue, both of which would confound the readings', 'To dissolve the drugs', 'To sterilise the preparation'],
                        ans: 1,
                        exp: 'Vascular smooth muscle responds strongly to temperature, so a cooling preparation drifts towards constriction and the baseline wanders independently of any drug.'
                    },
                    {
                        q: 'Noradrenaline does not reverse after α blockade. The reason is:',
                        opts: ['It is more potent than adrenaline', 'It has negligible β₂ activity, so there is nothing to unmask', 'Phentolamine destroys it', 'It acts on histamine receptors'],
                        ans: 1,
                        exp: 'The contrast between the two catecholamines is the control that makes the experiment conclusive: only a drug possessing both actions can have one of them revealed.'
                    }
                ],
                inferenceHint: 'Record adrenaline and noradrenaline, then add phentolamine and repeat both — only adrenaline inverts.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS.adrenaline;
            this.dose = this.drug.doses[2];
            this.records = [];
            this.kymo = new LAB.Kymograph({
                cx: DRUM.cx, top: DRUM.top, bot: DRUM.bot, r: DRUM.r, benchY: BENCH,
                label: 'OUTFLOW',
                channels: [{ baseline: DRUM.bot, px: PX_FLOW, color: '#7dd3fc', width: 1.6 }]
            });
            this.hotspots = [
                { x: RES.x - 40, y: RES.y - 110, w: 80, h: 130, label: 'Reservoir at constant head' },
                { x: EAR.x - 60, y: EAR.baseY - EAR.len, w: 120, h: EAR.len, label: 'Isolated rabbit ear — perfused through the central artery' },
                { x: DROP.x - 30, y: DROP.from, w: 60, h: 150, label: 'Drop counter and measuring cylinder' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.earNo = (this.earNo || 0) + 1;
            this.flow = BASE_FLOW;
            this.effect = null;
            this.blocks = {};
            this.peak = null;
            this.phase = 'settle';
            this.drops = [];
            this.dropT = 0;
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
        get settled() { return !this.effect && Math.abs(this.flow - BASE_FLOW) < 1.5; }
        /** 1 = normal calibre, <1 constricted, >1 dilated */
        get calibre() { return M.clamp(this.flow / BASE_FLOW, 0.35, 1.9); }

        /* ---------------- pharmacology ---------------- */
        responseOf(d, dose) {
            const f = Math.pow(dose, d.hill) / (Math.pow(d.ec50, d.hill) + Math.pow(dose, d.hill));
            const a = !!this.blocks.alpha, b = !!this.blocks.beta;
            let dFlow = d.dFlow, note = null;

            if (d.id === 'adrenaline') {
                if (a && !b) { dFlow = 0.45; note = 'reversal'; }      // β₂ unmasked
                else if (a && b) dFlow = 0.03;                          // nothing left
                else if (b) dFlow = -0.68;                              // pure α constriction
            } else if (d.id === 'noradrenaline') {
                if (a) { dFlow = 0.04; note = 'abolished'; }            // no β₂ to unmask
            } else if (d.id === 'isoprenaline') {
                if (b) { dFlow = 0.03; note = 'abolished'; }
            }
            // ACh, histamine and papaverine act through their own routes and are untouched
            return { dFlow: dFlow * f, f, note };
        }

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            const on = Object.keys(this.blocks);
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Dose of ${d.short} into the line</div>
                <div class="lab2-seg" id="vp-dose">${d.doses.map(v => `<button data-v="${v}" class="${v === this.dose ? 'active' : ''}">${v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">Units: ${d.unit} into the perfusate</div>
                <p style="margin-top:8px;font-size:11.5px;color:${on.length ? '#0f766e' : '#64748b'}">
                    <b>Blockade:</b> ${on.length ? on.map(k => DRUGS[this.blocks[k].id].short + ' (' + k + ')').join(', ') : 'none'}</p>
                <p style="margin-top:8px;font-size:11px;color:#475569">Perfusion pressure is <b>constant</b>, so outflow measures vessel calibre alone.</p>
            `);
            const seg = this.$('vp-dose');
            if (seg) seg.querySelectorAll('button').forEach(b => b.onclick = () => {
                if (this.busy) return this.toast('Wait for the outflow to settle.', 'warn');
                this.dose = +b.dataset.v;
                this._controls();
                this._refresh();
            });
        }

        _refresh() {
            const d = this.drug;
            if (this.phase === 'settle') {
                this.status('Ear perfused at constant head. Record a steady <b>baseline outflow</b> before injecting.');
                this.actions([{ label: '⏩ Record baseline', primary: true, onClick: () => this.settle() }]);
            } else {
                const ok = this.settled;
                this.status(ok
                    ? `Ready — inject <b>${d.short} ${this.dose} ${d.unit}</b> into the side port (drag the syringe).`
                    : 'Outflow still changing — let the drug wash through and the rate return to baseline.');
                this.actions([
                    { label: `💉 Inject ${d.short} ${this.dose} ${d.unit}`, primary: ok, disabled: !ok, onClick: () => this.autoInject() },
                    { label: '🐇 Fresh ear', onClick: () => this.resetAnimal() }
                ]);
            }
            this.hud('l', [
                { k: 'Ear', v: '#' + this.earNo },
                { k: 'Blockade', v: this.cond === 'control' ? 'none' : this.cond, tone: this.cond === 'control' ? '' : 'warn' }
            ]);
        }

        /* ---------------- procedure ---------------- */
        settle() {
            this.timeLapse(2, 2.2, {
                label: 'Baseline outflow',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(2);
                    this.toast(`Steady outflow <b>${Math.round(this.flow)} drops/min</b>.`, 'success');
                    this._refresh();
                }
            });
        }

        getInjectZone() {
            if (this.phase !== 'ready' || !this.settled) return null;
            return { x: EAR.x + 2, y: EAR.baseY - 20, r: 22, label: 'Side port', angle: Math.PI * 0.72 };
        }

        onInjected(tr) {
            const d = DRUGS[tr.id];
            const dose = this.dose;
            this.kymo.mark(`${d.short} ${dose}`, d.color);

            if (d.kind === 'antagonist') {
                this.blocks[d.blocks] = d;
                this.markDone(d.id);
                this.addRow([`<b>${d.short}</b> ${dose} ${d.unit}`, 'blockade', '—', '—', '—'], 'muted');
                this.toast(`${d.name} in the perfusate — ${d.blocks} receptors blocked. Repeat the agonists.`, 'info');
                this.infer(`<p><b>${d.name} ${dose} ${d.unit} added to the perfusion fluid.</b></p><p style="margin-top:6px;color:#475569">${d.note}</p>`);
                this.setStep(5);
                this._controls();
                this._refresh();
                return;
            }

            const r = this.responseOf(d, dose);
            this.effect = { t: 0, dur: 34, tauOn: 1.4, tauOff: 9, dFlow: r.dFlow * BASE_FLOW, note: r.note };
            this.peak = { basal: this.flow, value: this.flow, drug: d, dose, cond: this.cond, note: r.note };
            this.busy = true;
            this.setStep(3);
            this._refresh();
        }

        _record() {
            const p = this.peak;
            if (!p) return;
            const delta = p.value - p.basal;
            let effect;
            if (Math.abs(delta) < 2) effect = '<b style="color:#be123c">No change</b>';
            else if (delta > 0) effect = '<b style="color:#1d4ed8">Dilatation</b>';
            else effect = '<b style="color:#b91c1c">Constriction</b>';
            this.records.push({ drug: p.drug, dose: p.dose, basal: p.basal, peak: p.value, delta, cond: p.cond, note: p.note });
            this.markDone(p.drug.id);
            this.addRow([
                `<b>${p.drug.short}</b> ${p.dose} ${p.drug.unit}`,
                p.cond === 'control' ? 'none' : p.cond,
                Math.round(p.basal) + '',
                `<b>${Math.round(p.value)}</b>`,
                `${delta > 0 ? '+' : ''}${delta.toFixed(1)} ${effect}`
            ], delta > 2 ? 'up' : delta < -2 ? 'down' : '');
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
            const palette = ['#0284c7', '#dc2626', '#7c3aed'];
            let lo = -8, hi = 8;
            this.records.forEach(r => { lo = Math.min(lo, r.delta); hi = Math.max(hi, r.delta); });
            this.chart.draw({
                xMin: 0.4, xMax: ags.length + 0.6,
                yMin: Math.min(-10, lo * 1.3), yMax: Math.max(10, hi * 1.3),
                xTicks: ags.map((_, k) => k + 1),
                xFmt: v => (DRUGS[ags[v - 1]] || {}).short || '',
                yLabel: 'Δ outflow (drops/min)',
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
            let html = `<p>${last.drug.short} <b>${last.dose} ${last.drug.unit}</b>: ${Math.round(last.basal)} → <b>${Math.round(last.peak)} drops/min</b> (${last.delta > 0 ? '+' : ''}${last.delta.toFixed(1)}).</p>`;
            html += `<p style="margin-top:6px;color:#475569">${last.drug.note}</p>`;

            if (last.note === 'reversal') {
                html += `<p style="margin-top:8px;padding:8px;background:#fef2f2;border-radius:6px">
                    <b>Vasomotor reversal — with no heart in the preparation.</b> The dose of adrenaline that reduced the
                    outflow now increases it. Since there is no cardiac output and no reflex here, the inversion can only be
                    happening in the vessel wall.</p>`;
            }

            const pair = ['adrenaline', 'noradrenaline'].map(id => ({
                ctrl: this.records.filter(r => r.drug.id === id && r.cond === 'control').pop(),
                blocked: this.records.filter(r => r.drug.id === id && r.cond.indexOf('Phent') >= 0).pop()
            }));
            if (pair[0].ctrl && pair[0].blocked && pair[1].ctrl && pair[1].blocked) {
                html += `<p style="margin-top:8px;padding:8px;background:#f0fdf4;border-radius:6px">
                    Adrenaline ${pair[0].ctrl.delta.toFixed(1)} → <b>${pair[0].blocked.delta > 0 ? '+' : ''}${pair[0].blocked.delta.toFixed(1)}</b> drops/min after phentolamine — <b>reversed</b>.<br>
                    Noradrenaline ${pair[1].ctrl.delta.toFixed(1)} → ${pair[1].blocked.delta > 0 ? '+' : ''}${pair[1].blocked.delta.toFixed(1)} drops/min — merely <b>abolished</b>.<br>
                    The same dissociation as in the blood-pressure experiment, now stripped of every cardiac and reflex explanation.</p>`;
            }
            this.infer(html);
        }

        /* ---------------- simulation ---------------- */
        update(dt) {
            let dFlow = 0;
            if (this.effect) {
                const e = this.effect;
                e.t += dt;
                const env = Math.max(0, Math.exp(-e.t / e.tauOff) - Math.exp(-e.t / e.tauOn));
                const norm = Math.max(0.05, Math.exp(-1) - Math.exp(-e.tauOff / e.tauOn));
                dFlow = e.dFlow * env / norm;
                if (e.t > e.dur) { this.effect = null; if (this.peak) this._record(); }
            }
            this.flow = M.approach(this.flow, Math.max(0, BASE_FLOW + dFlow), 3.4, dt);
            if (this.peak && Math.abs(this.flow - this.peak.basal) > Math.abs(this.peak.value - this.peak.basal)) {
                this.peak.value = this.flow;
            }

            this.kymo.update(dt, this.flow);

            // drops falling into the counter at the measured rate
            this.dropT += dt * Math.max(0, this.flow) / 60;
            if (this.dropT >= 1) { this.dropT -= 1; this.drops.push({ y: DROP.from, v: 0 }); }
            for (let i = this.drops.length - 1; i >= 0; i--) {
                const d = this.drops[i];
                d.v += 430 * dt;
                d.y += d.v * dt;
                if (d.y > DROP.to) this.drops.splice(i, 1);
            }

            this.hud('r', [
                { k: 'Outflow', v: Math.round(this.flow) + '/min', tone: this.flow > BASE_FLOW + 4 ? 'good' : (this.flow < BASE_FLOW - 4 ? 'bad' : '') },
                { k: 'Vessels', v: this.calibre > 1.15 ? 'dilated' : (this.calibre < 0.85 ? 'constricted' : 'normal') },
                { k: 'Pressure', v: 'constant' }
            ]);
        }

        /* ---------------- drawing ---------------- */
        draw(ctx) {
            this.kymo.draw(ctx);
            this._reservoir(ctx);
            this._ear(ctx);
            this._counter(ctx);
            this._readout(ctx);
        }

        _reservoir(ctx) {
            const x = RES.x, y = RES.y;
            ctx.save();
            G.shadow(ctx, x, BENCH + 2, 54, 9, 0.42);
            G.metal(ctx, x - 5, y + 20, 10, BENCH - y - 20, { tone: 'steel', r: 2 });
            G.metal(ctx, x - 38, BENCH - 10, 76, 12, { tone: 'dark', r: 3 });
            G.glass(ctx, x - 32, y - 110, 64, 110, { r: 7 });
            ctx.fillStyle = 'rgba(186,230,253,0.55)';
            G.rr(ctx, x - 29, y - 74, 58, 72, 5); ctx.fill();
            ctx.fillStyle = 'rgba(224,242,254,0.9)'; ctx.fillRect(x - 29, y - 76, 58, 3);
            G.text(ctx, 'RINGER', x, y - 48, { size: 8.5, align: 'center', weight: 800, color: '#0c4a6e' });
            G.text(ctx, '38 °C', x, y - 37, { size: 8, align: 'center', weight: 700, color: '#0c4a6e' });
            // Mariotte air inlet holds the head constant as it empties
            G.metal(ctx, x - 3, y - 134, 6, 26, { tone: 'chrome', r: 2 });
            G.text(ctx, 'constant head', x, y - 140, { size: 8, align: 'center', weight: 700, color: '#94a3b8' });

            // line across to the ear, with the injection side port
            ctx.strokeStyle = 'rgba(148,163,184,0.9)'; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + 22, y - 44);
            ctx.bezierCurveTo(x + 130, y - 90, EAR.x - 90, EAR.baseY - 150, EAR.x + 2, EAR.baseY - 22);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(190,225,245,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
            // three-way tap (the injection target)
            G.metal(ctx, EAR.x - 10, EAR.baseY - 30, 24, 14, { tone: 'steel', r: 3 });
            G.knob(ctx, EAR.x + 2, EAR.baseY - 36, 5.5, 0.7);
            ctx.restore();
        }

        /** isolated ear: calibre of the vessels tracks the outflow */
        _ear(ctx) {
            const x = EAR.x, base = EAR.baseY, len = EAR.len, k = this.calibre;
            const tipY = base - len;
            ctx.save();
            // cork board and pins
            G.shadow(ctx, x, base + 14, 72, 9, 0.4);
            const bg = ctx.createLinearGradient(0, tipY - 14, 0, base + 10);
            bg.addColorStop(0, '#c8a271'); bg.addColorStop(1, '#9c7748');
            ctx.fillStyle = bg;
            G.rr(ctx, x - 58, tipY - 16, 116, len + 28, 6); ctx.fill();
            ctx.strokeStyle = 'rgba(80,56,30,0.5)'; ctx.lineWidth = 1; ctx.stroke();

            // the ear itself — translucent, paler when constricted
            const pale = M.clamp((k - 0.35) / 1.55, 0, 1);
            const eg = ctx.createLinearGradient(x - 44, 0, x + 44, 0);
            eg.addColorStop(0, G.mix('#e8cfcb', '#dca89f', pale));
            eg.addColorStop(0.45, G.mix('#f6e4df', '#f0c2b8', pale));
            eg.addColorStop(1, G.mix('#dcc0bb', '#cf9a92', pale));
            ctx.fillStyle = eg;
            ctx.beginPath();
            ctx.moveTo(x, base);
            ctx.bezierCurveTo(x - 46, base - len * 0.34, x - 40, tipY + len * 0.14, x - 6, tipY);
            ctx.bezierCurveTo(x + 32, tipY + len * 0.12, x + 46, base - len * 0.32, x, base);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(150,100,98,0.45)'; ctx.lineWidth = 1; ctx.stroke();

            // central artery, width proportional to calibre
            ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 4.2 * k; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + 1, base - 6);
            ctx.bezierCurveTo(x + 4, base - len * 0.42, x - 2, tipY + len * 0.26, x - 4, tipY + 16);
            ctx.stroke();
            // arterial branches
            ctx.lineWidth = 2.0 * k;
            [0.3, 0.48, 0.66, 0.8].forEach((f, i) => {
                const sy = base - len * f;
                const dir = i % 2 ? 1 : -1;
                ctx.beginPath();
                ctx.moveTo(x + 2, sy);
                ctx.quadraticCurveTo(x + dir * 18, sy - 10, x + dir * 32, sy - 24);
                ctx.stroke();
            });
            // marginal veins — these stay wide, they are not the resistance vessels
            ctx.strokeStyle = 'rgba(70,95,150,0.55)'; ctx.lineWidth = 2.6;
            [-1, 1].forEach(s => {
                ctx.beginPath();
                ctx.moveTo(x + s * 8, base - 10);
                ctx.bezierCurveTo(x + s * 34, base - len * 0.4, x + s * 28, tipY + len * 0.2, x + s * 10, tipY + 22);
                ctx.stroke();
            });

            // pins at the margins
            [[x - 40, base - len * 0.3], [x + 40, base - len * 0.28], [x - 6, tipY + 6]].forEach(([px, py]) => {
                G.metal(ctx, px - 2, py - 8, 4, 10, { tone: 'chrome', r: 1, stroke: false });
                ctx.fillStyle = '#ef4444';
                ctx.beginPath(); ctx.arc(px, py - 9, 3, 0, Math.PI * 2); ctx.fill();
            });

            // arterial cannula tied in at the base
            G.metal(ctx, x - 5, base - 4, 10, 16, { tone: 'chrome', r: 2 });
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x - 7, base + 2); ctx.lineTo(x + 7, base + 2); ctx.stroke();

            // cut vein leading the effluent away to the counter
            ctx.strokeStyle = 'rgba(203,213,225,0.9)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + 18, base - 14);
            ctx.bezierCurveTo(x + 80, base - 30, DROP.x - 20, DROP.from - 80, DROP.x, DROP.from - 8);
            ctx.stroke();

            G.text(ctx, 'ISOLATED RABBIT EAR', x, tipY - 24,
                { size: 9, align: 'center', weight: 800, color: 'rgba(226,232,240,0.75)', shadow: true });
            ctx.restore();
        }

        _counter(ctx) {
            const x = DROP.x;
            ctx.save();
            this.drops.forEach(d => {
                ctx.fillStyle = 'rgba(186,230,253,0.9)';
                ctx.beginPath(); ctx.ellipse(x, d.y, 2.6, 3.8, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath(); ctx.arc(x - 1, d.y - 1.4, 0.9, 0, Math.PI * 2); ctx.fill();
            });
            // photo-electric drop sensor
            G.metal(ctx, x - 26, DROP.from + 18, 15, 20, { tone: 'dark', r: 3 });
            G.metal(ctx, x + 11, DROP.from + 18, 15, 20, { tone: 'dark', r: 3 });
            G.led(ctx, x - 18, DROP.from + 28, 2.6, '#ef4444', true);
            // measuring cylinder
            G.glass(ctx, x - 22, DROP.to, 44, 50, { r: 4 });
            ctx.fillStyle = 'rgba(186,230,253,0.55)';
            G.rr(ctx, x - 19, DROP.to + 22, 38, 26, 3); ctx.fill();
            ctx.strokeStyle = 'rgba(30,41,59,0.5)'; ctx.lineWidth = 0.8;
            for (let i = 1; i < 4; i++) {
                ctx.beginPath(); ctx.moveTo(x - 22, DROP.to + 8 + i * 11); ctx.lineTo(x - 14, DROP.to + 8 + i * 11); ctx.stroke();
            }
            G.text(ctx, 'VENOUS', x, DROP.to + 64, { size: 8, align: 'center', weight: 800, color: 'rgba(226,232,240,0.8)', shadow: true });
            G.text(ctx, 'OUTFLOW', x, DROP.to + 74, { size: 8, align: 'center', weight: 800, color: 'rgba(226,232,240,0.8)', shadow: true });
            ctx.restore();
        }

        _readout(ctx) {
            const x = 596, y = 36;
            ctx.save();
            ctx.fillStyle = 'rgba(8,15,26,0.72)';
            G.rr(ctx, x, y, 216, 54, 8); ctx.fill();
            G.lcd(ctx, x + 10, y + 10, 94, 34, Math.round(this.flow) + '', { label: 'DROPS / min', color: '#7dd3fc', size: 16 });
            G.lcd(ctx, x + 114, y + 10, 92, 34,
                this.calibre > 1.15 ? 'DILAT' : (this.calibre < 0.85 ? 'CONSTR' : 'NORMAL'),
                { label: 'VESSELS', color: this.calibre < 0.85 ? '#fb7185' : (this.calibre > 1.15 ? '#4ade80' : '#34f5c5'), size: 13 });
            ctx.restore();
        }
    }

    LAB.register(19, Vasoperfusion);
})();
