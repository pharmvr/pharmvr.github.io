/**
 * EXP 11 — Effect of drugs on the frog rectus abdominis muscle
 *
 * Classical isolated-tissue preparation: a strip of frog rectus abdominis is
 * mounted in a 20 mL organ bath of aerated frog Ringer, tied by thread to a
 * frontal writing lever (×6 magnification) whose stylus writes on a smoked
 * drum kymograph.
 *
 * The muscle is SKELETAL, so it carries nicotinic N_M end-plate receptors and
 * responds to ACh with a slow sustained CONTRACTURE (not a twitch):
 *   - ACh / carbachol / nicotine  → dose-dependent contracture
 *   - d-tubocurarine              → competitive N_M block (parallel right shift)
 *   - physostigmine               → inhibits AChE, potentiates ACh only
 *   - atropine                    → no effect (no muscarinic receptors here)
 *   - KCl                         → direct depolarisation, not curare-sensitive
 */
(function () {
    const { M, G } = LAB;

    /* ---------------- geometry (960×540 logical stage) ---------------- */
    const BENCH = 452;
    const BATH = { x: 711, top: 272, bot: 448, w: 70 };
    const LEVER = { px: 768, py: 230, threadX: 711, stylusX: 426 };
    const DRUM = { cx: 320, top: 36, bot: 268, r: 108 };
    const MAG = (LEVER.px - LEVER.stylusX) / (LEVER.px - LEVER.threadX); // ×6
    const STYLUS_A = 78 * Math.PI / 180;    // where the stylus touches the drum
    const DRUM_SPEED = 6 * Math.PI / 180;   // rad/s — one face ≈ 28 s
    const HISTORY = STYLUS_A + Math.PI / 2; // keep exactly one visible face
    const PX_MM = 3.0;                      // drum pixels per mm of lever excursion
    const REST_LEN = 96;                    // resting tissue length (px)

    /* ---------------- pharmacology ---------------- */
    const DRUGS = {
        ach: {
            id: 'ach', name: 'Acetylcholine', short: 'ACh', cls: 'Nicotinic Nₘ agonist',
            color: '#0d9488', kind: 'agonist', unit: 'µg', ec50: 20, emax: 58, hill: 1.5,
            ester: true, doses: [2, 5, 10, 20, 40, 80],
            note: 'ACh depolarises end-plate Nₘ receptors of this skeletal muscle, giving a slow <b>sustained contracture</b> rather than a twitch.'
        },
        carbachol: {
            id: 'carbachol', name: 'Carbachol', short: 'CCh', cls: 'Cholinergic agonist (AChE-resistant)',
            color: '#0891b2', kind: 'agonist', unit: 'µg', ec50: 8, emax: 58, hill: 1.5,
            ester: false, doses: [1, 2, 5, 10, 20, 40],
            note: 'Carbachol is <b>not hydrolysed by cholinesterase</b>, so it is more potent than ACh and is <b>not</b> potentiated by physostigmine.'
        },
        nicotine: {
            id: 'nicotine', name: 'Nicotine', short: 'Nic', cls: 'Selective nicotinic agonist',
            color: '#7c3aed', kind: 'agonist', unit: 'µg', ec50: 60, emax: 52, hill: 1.4,
            ester: false, doses: [10, 25, 50, 100, 200, 400],
            note: 'Nicotine contracts the rectus through the same Nₘ receptor — confirming the receptor is nicotinic, not muscarinic.'
        },
        kcl: {
            id: 'kcl', name: 'Potassium chloride', short: 'KCl', cls: 'Direct depolarising agent',
            color: '#6366f1', kind: 'agonist', unit: 'mg', ec50: 22, emax: 54, hill: 2.0,
            ester: false, direct: true, doses: [5, 10, 20, 40, 80],
            note: 'KCl depolarises the fibre membrane <b>directly</b>, bypassing the receptor — so curare does not block it.'
        },
        dtc: {
            id: 'dtc', name: 'd-Tubocurarine', short: 'd-TC', cls: 'Competitive Nₘ antagonist',
            color: '#dc2626', kind: 'antagonist', unit: 'µg', kb: 10, doses: [5, 10, 20, 40],
            note: 'Curare competes with ACh at the Nₘ receptor. Being <b>surmountable</b>, it shifts the dose–response curve to the right in parallel without depressing the maximum.'
        },
        physo: {
            id: 'physo', name: 'Physostigmine', short: 'Phys', cls: 'Anticholinesterase',
            color: '#16a34a', kind: 'potentiator', unit: 'µg', factor: 4, doses: [5, 10, 20],
            note: 'Physostigmine inhibits acetylcholinesterase, so added ACh survives longer in the bath — the ACh curve shifts to the <b>left</b>. Carbachol and nicotine are unaffected.'
        },
        atropine: {
            id: 'atropine', name: 'Atropine', short: 'Atr', cls: 'Muscarinic antagonist',
            color: '#f59e0b', kind: 'inert', unit: 'µg', doses: [10, 50],
            note: 'Atropine blocks <b>muscarinic</b> receptors only. The rectus abdominis is skeletal muscle with nicotinic receptors, so atropine leaves the ACh response untouched.'
        }
    };

    class FrogRectus extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: BENCH, seed: 5 },
                syringe: false,
                steps: [
                    'A strip of <b>frog rectus abdominis</b> is tied at both ends and mounted in a 20 mL organ bath of frog Ringer, aerated and kept at room temperature.',
                    'The upper thread is attached to a <b>frontal writing lever</b> (×6 magnification) under 1 g resting tension; the stylus writes on the smoked drum.',
                    'Allow the tissue to <b>equilibrate for 15 min</b>, washing with fresh Ringer, until the baseline is steady.',
                    'Add a measured dose of agonist, leave a <b>60 s contact time</b>, read the height of the contracture, then <b>wash out 3×</b>.',
                    'Repeat with graded doses to build a <b>log dose–response curve</b>, then repeat in the presence of d-tubocurarine, physostigmine or atropine and compare the shift.'
                ],
                treatmentTitle: 'Reagents on the rack',
                treatments: Object.values(DRUGS).map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Drug & dose', 'Bath condition', 'Height (mm)', '% max'],
                tableTitle: 'Kymograph readings',
                chart: true,
                chartTitle: 'Log dose–response curve',
                chartEmpty: { xMin: 1, xMax: 100, yMin: 0, yMax: 105, logX: true, xLabel: 'Dose in bath (log scale)', yLabel: '% of maximal response' },
                viva: [
                    {
                        q: 'Which receptor mediates the acetylcholine-induced contracture of frog rectus abdominis?',
                        opts: ['M₃ muscarinic', 'Nₘ nicotinic (skeletal end-plate)', 'β₂ adrenergic', 'H₁ histaminergic'],
                        ans: 1,
                        exp: 'The rectus abdominis is a skeletal muscle. Its end-plates carry Nₘ nicotinic receptors, which is why d-tubocurarine blocks the response and atropine does not.'
                    },
                    {
                        q: 'Why does the rectus give a slow sustained contracture rather than a brisk twitch?',
                        opts: ['It is smooth muscle', 'It is a multiply-innervated tonic muscle whose fibres depolarise slowly and do not propagate action potentials', 'The Ringer lacks calcium', 'The drug is given too slowly'],
                        ans: 1,
                        exp: 'Amphibian rectus is a tonic, multiply-innervated muscle. Bath-applied agonist depolarises the whole fibre length gradually, producing a graded, maintained contracture ideal for bioassay.'
                    },
                    {
                        q: 'Adding d-tubocurarine shifts the ACh log dose–response curve to the right in parallel, with no fall in maximum. This indicates:',
                        opts: ['Non-competitive antagonism', 'Competitive (surmountable) antagonism', 'Physiological antagonism', 'Chemical antagonism'],
                        ans: 1,
                        exp: 'A parallel rightward shift with an unchanged maximum is the signature of competitive antagonism — the block is surmounted by raising the agonist concentration.'
                    },
                    {
                        q: 'Physostigmine potentiates acetylcholine but not carbachol. Why?',
                        opts: ['Carbachol is a weaker agonist', 'Carbachol is resistant to hydrolysis by cholinesterase', 'Physostigmine blocks carbachol receptors', 'Carbachol is destroyed by light'],
                        ans: 1,
                        exp: 'Physostigmine works by sparing ACh from acetylcholinesterase. Carbachol is a carbamate ester that resists that enzyme, so inhibiting the enzyme adds nothing.'
                    },
                    {
                        q: 'Atropine produces no change in the ACh response of this preparation. The best conclusion is:',
                        opts: ['Atropine was inactive or degraded', 'The preparation has no muscarinic receptors', 'The dose of atropine was too small', 'Atropine needs a longer contact time'],
                        ans: 1,
                        exp: 'Atropine is a selective muscarinic antagonist. Its complete lack of effect here is positive evidence that the receptor on skeletal muscle is nicotinic.'
                    },
                    {
                        q: 'KCl still contracts the muscle after a full curarising dose of d-tubocurarine. This shows that:',
                        opts: ['Curare has worn off', 'KCl depolarises the membrane directly, bypassing the receptor', 'KCl is a nicotinic agonist', 'The tissue is damaged'],
                        ans: 1,
                        exp: 'KCl raises extracellular K⁺ and depolarises the fibre directly. Because it does not act on the Nₘ receptor, receptor blockade cannot prevent its effect — a useful viability control.'
                    }
                ],
                inferenceHint: 'Build a control ACh curve first, then repeat it in the presence of an antagonist and compare the position of the two curves.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS[this.cfg.treatments[0].id];
            this.dose = this.drug.doses[2];
            this.tools = [{ id: 'pipette', label: 'Micropipette', x: 165, y: 500 }];
            this.hotspots = [
                { x: BATH.x - 46, y: BATH.top, w: 92, h: BATH.bot - BATH.top, label: '20 mL organ bath — frog Ringer, aerated' },
                { x: DRUM.cx - DRUM.r, y: DRUM.top, w: DRUM.r * 2, h: 60, label: 'Smoked drum kymograph' },
                { x: 470, y: LEVER.py - 26, w: 240, h: 34, label: 'Frontal writing lever — ×' + MAG.toFixed(0) + ' magnification' },
                { x: 388, y: 470, w: 300, h: 60, label: 'Reagent rack — click a vial to select it' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.tissueNo = (this.tissueNo || 0) + 1;
            this.amp = 0;
            this.ampTarget = 0;
            this.peak = 0;
            this.trace = [];
            this.marks = [];
            this.ticks = [];
            this.rot = 0;
            this.sampleT = 0;
            this.tickT = 0;
            this.mod = null;
            this.tint = null;
            this.cloud = null;
            this.level = 1;
            this.bubbles = [];
            this.agonistIn = false;
            this.vigour = 1;
            this.phase = 'equil';
            this.simMin = 0;
            this.setStep(2);
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

        /* ---------------- left-column controls ---------------- */
        _controls() {
            const d = this.drug;
            const modTxt = this.mod
                ? `<p style="margin-top:8px;font-size:11.5px;color:#0f766e"><b>Bath condition:</b> ${this.mod.drug.short} ${this.mod.dose} ${this.mod.drug.unit} present</p>`
                : '<p style="margin-top:8px;font-size:11.5px;color:#64748b"><b>Bath condition:</b> plain Ringer</p>';
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Dose of ${d.short} into the 20 mL bath</div>
                <div class="lab2-seg" id="fr-dose">${d.doses.map(v => `<button data-v="${v}" class="${v === this.dose ? 'active' : ''}">${v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">Units: ${d.unit} per bath</div>
                ${modTxt}
            `);
            const seg = this.$('fr-dose');
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
                this.status('Tissue mounted under <b>1 g</b> resting tension. Equilibrate before the first dose.');
                this.actions([{ label: '⏩ Equilibrate 15 min', primary: true, onClick: () => this.equilibrate() }]);
            } else {
                const dirty = this.agonistIn || this.amp > 1.5;
                this.status(dirty
                    ? 'Agonist still in the bath — <b>wash out 3×</b> and let the baseline settle before the next dose.'
                    : `Ready — add <b>${d.short} ${this.dose} ${d.unit}</b> to the bath, or drag the micropipette onto it.`);
                const list = [
                    { label: `💧 Add ${d.short} ${this.dose} ${d.unit}`, primary: !dirty, disabled: dirty, onClick: () => this.addDrug() },
                    { label: '🚿 Washout ×3', disabled: !dirty, onClick: () => this.washout() }
                ];
                if (this.mod) list.push({ label: '🧼 Prolonged wash (clear ' + this.mod.drug.short + ')', onClick: () => this.clearMod() });
                this.actions(list);
            }
            this.hud('l', [
                { k: 'Tissue', v: '#' + this.tissueNo },
                { k: 'Bath', v: this.mod ? this.mod.drug.short : 'Ringer', tone: this.mod ? 'warn' : '' }
            ]);
        }

        /* ---------------- pharmacological model ---------------- */
        response(d, dose) {
            if (d.kind !== 'agonist') return 0;
            let ec50 = d.ec50;
            const m = this.mod;
            if (m && !d.direct) {
                if (m.drug.kind === 'antagonist') ec50 *= (1 + m.dose / m.drug.kb);
                else if (m.drug.kind === 'potentiator' && d.ester) ec50 /= m.drug.factor;
            }
            const h = d.hill;
            const r = d.emax * Math.pow(dose, h) / (Math.pow(ec50, h) + Math.pow(dose, h));
            return Math.max(0, r * this.vigour + M.randn() * 0.5);
        }

        /* ---------------- procedure ---------------- */
        equilibrate() {
            this.timeLapse(15, 3.2, {
                label: 'Equilibration',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(3);
                    this.toast('Baseline steady. Select a drug and dose, then add it to the bath.', 'success');
                    this._refresh();
                }
            });
        }

        addDrug() {
            if (this.busy) return;
            const d = this.drug, dose = this.dose;
            this.marks.push({ a: this.rot, label: `${d.short} ${dose}`, color: d.color });
            this.tint = { color: d.color, a: 0.28 };
            this.cloud = { color: d.color, t: 0 };
            this.tw.add(2.2, e => { if (this.cloud) this.cloud.t = e; }, { onDone: () => { this.cloud = null; } });
            this.floatText(BATH.x, BATH.top - 14, `${d.short} ${dose} ${d.unit}`, d.color);

            if (d.kind === 'agonist') {
                const r = this.response(d, dose);
                this.peak = r;
                this.ampTarget = r;
                this.agonistIn = true;
                this.vigour = Math.max(0.82, this.vigour - 0.008);
                this.timeLapse(1, 2.8, {
                    label: 'Contact time',
                    onDone: () => this._record(d, dose, this.amp)
                });
            } else {
                this.mod = { drug: d, dose };
                this.timeLapse(5, 2.6, {
                    label: d.short + ' equilibration',
                    onDone: () => {
                        this.markDone(d.id);
                        this.addRow([`<b>${d.short}</b> ${dose} ${d.unit}`, 'pre-treatment', '—', '—'], 'muted');
                        this.toast(`${d.name} left in contact for 5 min. Now repeat the agonist doses.`, 'info');
                        this.infer(`<p><b>${d.name} added as a bath pre-treatment.</b></p><p style="margin-top:6px;color:#475569">${d.note}</p>`);
                        this._controls();
                        this._refresh();
                    }
                });
            }
        }

        _record(d, dose, height) {
            const cond = this.mod ? `${this.mod.drug.short} ${this.mod.dose} ${this.mod.drug.unit}` : 'control';
            const pct = Math.max(0, height / d.emax * 100);
            this.records = this.records || [];
            this.records.push({ drug: d, dose, height, pct, cond, color: d.color });
            this.markDone(d.id);
            this.addRow([
                `<b>${d.short}</b> ${dose} ${d.unit}`,
                this.mod ? `+ ${cond}` : 'plain Ringer',
                `<b>${height.toFixed(1)}</b>`,
                pct.toFixed(0) + '%'
            ], height > d.emax * 0.5 ? 'up' : '');
            this.setStep(4);
            this._chart();
            this._infer(d, dose, height, pct);
            this._refresh();
        }

        washout() {
            if (this.busy) return;
            this.busy = true;
            this.ampTarget = 0;
            this.agonistIn = false;
            let n = 0;
            const cycle = () => {
                n++;
                this.tw.add(0.42, e => {
                    this.level = 1 - e * 0.8;
                    if (this.tint) this.tint.a = 0.28 * (1 - e) * (1 - (n - 1) / 3);
                }, {
                    onDone: () => this.tw.add(0.46, e => { this.level = 0.2 + e * 0.8; }, {
                        onDone: () => {
                            if (n < 3) cycle();
                            else {
                                this.level = 1;
                                this.tint = null;
                                this.busy = false;
                                this.toast('Bath washed 3× with fresh frog Ringer.', 'success');
                                this._refresh();
                            }
                        }
                    })
                });
            };
            cycle();
        }

        clearMod() {
            if (this.busy) return;
            const was = this.mod ? this.mod.drug.short : '';
            this.mod = null;
            this.washout();
            this.toast(`Prolonged wash — ${was} removed, bath back to plain Ringer.`, 'info');
            this._controls();
        }

        /* ---------------- graph & inference ---------------- */
        _chart() {
            const groups = {};
            (this.records || []).forEach(r => {
                const key = r.drug.short + (r.cond === 'control' ? '' : ' + ' + r.cond);
                if (!groups[key]) groups[key] = { pts: [], drug: r.drug, cond: r.cond };
                groups[key].pts.push([r.dose, r.pct]);
            });
            const keys = Object.keys(groups);
            if (!keys.length) return;
            let lo = Infinity, hi = 0;
            keys.forEach(k => groups[k].pts.forEach(p => { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); }));
            const palette = ['#0d9488', '#dc2626', '#16a34a', '#6366f1', '#f59e0b', '#7c3aed'];
            this.chart.draw({
                logX: true,
                xMin: Math.max(0.4, lo * 0.55), xMax: hi * 1.9,
                yMin: 0, yMax: 105,
                xLabel: 'Dose in bath (log scale)',
                yLabel: '% of maximal response',
                xFmt: v => v >= 1 ? String(Math.round(v)) : v.toFixed(1),
                series: keys.map((k, i) => ({
                    name: k,
                    color: palette[i % palette.length],
                    markers: true,
                    points: groups[k].pts.slice().sort((a, b) => a[0] - b[0])
                }))
            });
        }

        /** crude ED50 by interpolation on the log axis, for the shift commentary */
        _ed50(pts) {
            const s = pts.slice().sort((a, b) => a[0] - b[0]);
            for (let i = 1; i < s.length; i++) {
                if (s[i - 1][1] < 50 && s[i][1] >= 50) {
                    const t = (50 - s[i - 1][1]) / (s[i][1] - s[i - 1][1]);
                    return Math.pow(10, M.lerp(Math.log10(s[i - 1][0]), Math.log10(s[i][0]), t));
                }
            }
            return null;
        }

        _infer(d, dose, height, pct) {
            let html = `<p>${d.short} <b>${dose} ${d.unit}</b> produced a <b>${height.toFixed(1)} mm</b> contracture (${pct.toFixed(0)}% of maximum)`;
            html += this.mod ? ` in the presence of <b>${this.mod.drug.short}</b>.</p>` : '.</p>';
            html += `<p style="margin-top:6px;color:#475569">${d.note}</p>`;

            // compare control vs treated curve for this agonist
            const ctrl = (this.records || []).filter(r => r.drug.id === d.id && r.cond === 'control').map(r => [r.dose, r.pct]);
            const treated = (this.records || []).filter(r => r.drug.id === d.id && r.cond !== 'control');
            if (ctrl.length >= 3 && treated.length >= 3) {
                const condName = treated[treated.length - 1].cond;
                const a = this._ed50(ctrl);
                const b = this._ed50(treated.filter(r => r.cond === condName).map(r => [r.dose, r.pct]));
                if (a && b) {
                    const ratio = b / a;
                    let verdict;
                    if (ratio > 1.6) verdict = `The curve has shifted <b>right by a dose ratio of ≈${ratio.toFixed(1)}</b> with the maximum preserved — classical <b>competitive antagonism</b>.`;
                    else if (ratio < 0.65) verdict = `The curve has shifted <b>left by ≈${(1 / ratio).toFixed(1)}-fold</b> — the response is <b>potentiated</b>.`;
                    else verdict = 'The two curves are essentially <b>superimposable</b> — this pre-treatment does not act on the receptor mediating the response.';
                    html += `<p style="margin-top:8px;padding:8px;background:#f1f5f9;border-radius:6px">ED₅₀ ${a.toFixed(1)} → ${b.toFixed(1)} ${d.unit}. ${verdict}</p>`;
                }
            }
            this.infer(html);
        }

        /* ---------------- pipette dragging ---------------- */
        _toolAt(x, y) { return this.tools.find(t => Math.abs(x - t.x) < 52 && Math.abs(y - t.y) < 34); }
        _vialAt(x, y) {
            if (y < 470 || y > 532) return null;
            const list = this.cfg.treatments;
            const x0 = 396, gap = 46;
            const i = Math.round((x - x0) / gap);
            if (i < 0 || i >= list.length) return null;
            return Math.abs(x - (x0 + i * gap)) < 20 ? list[i] : null;
        }
        cursorAt(x, y) { return !this.busy && (!!this._toolAt(x, y) || !!this._vialAt(x, y)); }

        onPointerDown(x, y) {
            if (this.busy) return;
            const v = this._vialAt(x, y);
            if (v) { this.select(v.id); return; }
            const t = this._toolAt(x, y);
            if (t) this.dragTool = { t, x, y };
        }
        onPointerMove(x, y) { if (this.dragTool) { this.dragTool.x = x; this.dragTool.y = y; } }
        onPointerUp(x, y) {
            if (!this.dragTool) return;
            this.dragTool = null;
            const overBath = Math.abs(x - BATH.x) < 62 && y > BATH.top - 50 && y < BATH.bot;
            if (!overBath) return this.toast('Drop the micropipette into the mouth of the organ bath.', 'warn');
            if (this.phase === 'equil') return this.toast('Equilibrate the tissue for 15 min first.', 'warn');
            if (this.agonistIn || this.amp > 1.5) return this.toast('Wash the bath out before adding the next dose.', 'warn');
            this.addDrug();
        }

        /* ---------------- simulation ---------------- */
        update(dt) {
            this.rot += DRUM_SPEED * dt;

            // contracture kinetics: brisk onset, slower relaxation
            const rate = this.ampTarget > this.amp ? 1.3 : 0.85;
            this.amp = M.approach(this.amp, this.ampTarget, rate, dt);
            if (this.amp > 0.4) this.amp += Math.sin(performance.now() / 520) * 0.05; // slight tremor

            // trace sampling
            this.sampleT += dt;
            if (this.sampleT >= 0.045) {
                this.sampleT = 0;
                this.trace.push({ a: this.rot, v: this.amp });
            }
            while (this.trace.length && this.rot - this.trace[0].a > HISTORY) this.trace.shift();
            while (this.marks.length && this.rot - this.marks[0].a > HISTORY) this.marks.shift();

            // 10 s time marker
            this.tickT += dt;
            if (this.tickT >= 10) { this.tickT = 0; this.ticks.push({ a: this.rot }); }
            while (this.ticks.length && this.rot - this.ticks[0].a > HISTORY) this.ticks.shift();

            // aeration bubbles
            if (Math.random() < dt * 26) {
                this.bubbles.push({ x: BATH.x - 16 + M.rand(-5, 5), y: BATH.bot - 20, r: M.rand(1.4, 3.4), v: M.rand(26, 46), w: M.rand(0.6, 1.6) });
            }
            const surface = BATH.top + 14 + (1 - this.level) * (BATH.bot - BATH.top - 30);
            for (let i = this.bubbles.length - 1; i >= 0; i--) {
                const b = this.bubbles[i];
                b.y -= b.v * dt;
                b.x += Math.sin(b.y / 16 + b.w) * 0.3;
                if (b.y < surface + 4) this.bubbles.splice(i, 1);
            }

            this.hud('r', [
                { k: 'Response', v: this.amp.toFixed(1) + ' mm' },
                { k: 'Lever', v: '×' + MAG.toFixed(0) },
                { k: 'Clock', v: LAB.fmtClock(this.simMin) }
            ]);
        }

        /* ---------------- drawing ---------------- */
        draw(ctx) {
            this._kymograph(ctx);
            this._reservoir(ctx);
            this._bath(ctx);
            this._lever(ctx);
            this._rack(ctx);
            if (this.dragTool) this._pipette(ctx, this.dragTool.x, this.dragTool.y, -0.35);
        }

        /* --- smoked drum kymograph --- */
        _kymograph(ctx) {
            const { cx, top, bot, r } = DRUM;
            const ry = r * 0.17;
            ctx.save();

            // base box + clockwork pillar
            G.shadow(ctx, cx, BENCH + 2, 96, 11, 0.45);
            G.metal(ctx, cx - 74, BENCH - 30, 148, 32, { tone: 'dark', r: 5 });
            G.metal(ctx, cx - 13, bot - 8, 26, BENCH - bot - 22, { tone: 'steel', r: 3 });
            G.led(ctx, cx + 50, BENCH - 14, 3.2, '#22c55e', true);
            G.text(ctx, 'KYMOGRAPH', cx - 56, BENCH - 10, { size: 8.5, weight: 800, color: 'rgba(226,232,240,0.8)' });
            for (let i = 0; i < 3; i++) G.screw(ctx, cx - 60 + i * 60, BENCH - 24, 2.4);

            // drum body (smoked paper on a brass cylinder)
            const bg = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
            bg.addColorStop(0, '#07070a'); bg.addColorStop(0.16, '#17171c');
            bg.addColorStop(0.42, '#26262c'); bg.addColorStop(0.7, '#15151a');
            bg.addColorStop(1, '#050507');
            ctx.fillStyle = bg;
            ctx.fillRect(cx - r, top, r * 2, bot - top);

            // soot grain
            ctx.save();
            ctx.beginPath(); ctx.rect(cx - r, top, r * 2, bot - top); ctx.clip();
            ctx.globalAlpha = 0.06;
            for (let i = 0; i < 160; i++) {
                const gx = cx - r + (i * 53) % (r * 2);
                const gy = top + (i * 97) % (bot - top);
                ctx.fillStyle = i % 2 ? '#ffffff' : '#000000';
                ctx.fillRect(gx, gy, 2, 1);
            }
            ctx.globalAlpha = 1;
            this._trace(ctx);
            ctx.restore();

            // rims
            [top, bot].forEach((yy, k) => {
                const g2 = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
                g2.addColorStop(0, '#5e4a16'); g2.addColorStop(0.3, '#d9b64b');
                g2.addColorStop(0.55, '#f4e3a4'); g2.addColorStop(1, '#4a3a10');
                ctx.fillStyle = g2;
                ctx.beginPath(); ctx.ellipse(cx, yy, r, ry, 0, 0, Math.PI * 2); ctx.fill();
                if (k === 0) {
                    ctx.fillStyle = 'rgba(8,8,10,0.92)';
                    ctx.beginPath(); ctx.ellipse(cx, yy, r * 0.82, ry * 0.8, 0, 0, Math.PI * 2); ctx.fill();
                    // spindle
                    G.metal(ctx, cx - 4, top - 26, 8, 30, { tone: 'chrome', r: 2 });
                    ctx.fillStyle = '#b45309';
                    ctx.beginPath(); ctx.ellipse(cx, top - 26, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
                }
                ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
            });

            G.text(ctx, 'SMOKED DRUM · ' + (DRUM_SPEED * 180 / Math.PI).toFixed(0) + '°/s', cx, bot + 24,
                { size: 9.5, align: 'center', weight: 800, color: '#e2e8f0', shadow: true });
            ctx.restore();
        }

        /** white stylus trace wrapped onto the visible face of the rotating drum */
        _trace(ctx) {
            const { cx, top, bot, r } = DRUM;
            const base = LEVER.py;
            const onFace = a => Math.cos(a) > 0.045;
            const sx = a => cx + Math.sin(a) * r;

            // baseline the stylus idles on
            ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.moveTo(cx - r, base); ctx.lineTo(cx + r, base); ctx.stroke();

            // 10 s time markers along the foot of the drum
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
            const footY = bot - 16;
            ctx.beginPath(); ctx.moveTo(cx - r, footY); ctx.lineTo(cx + r, footY); ctx.stroke();
            this.ticks.forEach(t => {
                const a = STYLUS_A - (this.rot - t.a);
                if (!onFace(a)) return;
                const x = sx(a);
                ctx.beginPath(); ctx.moveTo(x, footY); ctx.lineTo(x, footY - 6); ctx.stroke();
            });

            // drug-addition signal marks
            this.marks.forEach(m => {
                const a = STYLUS_A - (this.rot - m.a);
                if (!onFace(a)) return;
                const x = sx(a);
                ctx.strokeStyle = m.color; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.moveTo(x, bot - 30); ctx.lineTo(x, bot - 46); ctx.stroke();
                ctx.save();
                ctx.translate(x, bot - 50); ctx.rotate(-Math.PI / 2);
                G.text(ctx, m.label, 0, 3.5, { size: 8.5, weight: 700, color: m.color });
                ctx.restore();
            });

            // the contracture trace itself
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 1.7;
            ctx.lineJoin = 'round'; ctx.lineCap = 'round';
            ctx.shadowColor = 'rgba(255,255,255,0.35)'; ctx.shadowBlur = 3;
            ctx.beginPath();
            let pen = false;
            for (const s of this.trace) {
                const a = STYLUS_A - (this.rot - s.a);
                if (!onFace(a)) { pen = false; continue; }
                const x = sx(a), y = base - s.v * PX_MM;
                if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        /* --- Ringer reservoir feeding the bath --- */
        _reservoir(ctx) {
            const x = 862, y = 150;
            ctx.save();
            G.metal(ctx, x - 4, y + 54, 8, BENCH - y - 54, { tone: 'steel', r: 2 });
            G.metal(ctx, x - 44, BENCH - 8, 88, 12, { tone: 'dark', r: 3 });
            G.glass(ctx, x - 30, y - 90, 60, 100, { r: 6 });
            ctx.fillStyle = 'rgba(186,230,253,0.5)';
            G.rr(ctx, x - 27, y - 60, 54, 68, 5); ctx.fill();
            ctx.fillStyle = 'rgba(224,242,254,0.85)';
            ctx.fillRect(x - 27, y - 62, 54, 3);
            G.text(ctx, 'FROG', x, y - 34, { size: 8.5, align: 'center', weight: 800, color: '#0c4a6e' });
            G.text(ctx, 'RINGER', x, y - 23, { size: 8.5, align: 'center', weight: 800, color: '#0c4a6e' });
            // delivery tubing down to the bath
            ctx.strokeStyle = 'rgba(148,163,184,0.85)'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 10, y + 10);
            ctx.bezierCurveTo(x - 60, y + 40, BATH.x + 70, BATH.top - 60, BATH.x + 24, BATH.top - 6);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(226,232,240,0.5)'; ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.restore();
        }

        /* --- jacketed organ bath with the mounted tissue --- */
        _bath(ctx) {
            const { x, top, bot, w } = BATH;
            const L = x - w / 2;
            const surface = top + 14 + (1 - this.level) * (bot - top - 30);
            ctx.save();

            // stand
            G.shadow(ctx, x, BENCH + 2, 70, 10, 0.4);
            G.metal(ctx, x - 52, BENCH - 10, 104, 14, { tone: 'dark', r: 4 });
            G.metal(ctx, x + 40, top + 20, 9, BENCH - top - 28, { tone: 'steel', r: 2 });
            // clamp holding the tube
            G.metal(ctx, x + 18, top + 34, 30, 11, { tone: 'dark', r: 3 });

            // outer water jacket
            G.glass(ctx, L - 11, top - 6, w + 22, bot - top + 12, { r: 10, tint: 'rgba(186,230,253,0.14)' });

            // inner bath tube + Ringer
            ctx.save();
            G.rr(ctx, L, top, w, bot - top, 8); ctx.clip();
            const fg = ctx.createLinearGradient(L, 0, L + w, 0);
            fg.addColorStop(0, 'rgba(165,215,240,0.55)');
            fg.addColorStop(0.35, 'rgba(214,240,253,0.4)');
            fg.addColorStop(1, 'rgba(140,190,220,0.6)');
            ctx.fillStyle = fg;
            ctx.fillRect(L, surface, w, bot - surface);
            // drug tint
            if (this.tint) {
                ctx.fillStyle = G.hexA(this.tint.color, this.tint.a);
                ctx.fillRect(L, surface, w, bot - surface);
            }
            // descending drug plume
            if (this.cloud) {
                const t = this.cloud.t;
                const cy = M.lerp(surface, bot - 24, LAB.ease.out(t));
                const g = ctx.createRadialGradient(x, cy, 2, x, cy, 20 + t * 46);
                g.addColorStop(0, G.hexA(this.cloud.color, 0.5 * (1 - t)));
                g.addColorStop(1, G.hexA(this.cloud.color, 0));
                ctx.fillStyle = g;
                ctx.fillRect(L, surface, w, bot - surface);
            }
            // meniscus
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(L, surface - 1.5, w, 3);

            this._tissue(ctx, surface);

            // aeration bubbles
            this.bubbles.forEach(b => {
                ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2); ctx.fill();
            });
            ctx.restore();

            // aeration tube entering from the top-left
            ctx.strokeStyle = 'rgba(203,213,225,0.9)'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(L - 26, top - 30);
            ctx.bezierCurveTo(L - 16, top + 10, x - 20, top + 40, x - 16, bot - 22);
            ctx.stroke();
            G.text(ctx, 'O₂', L - 34, top - 34, { size: 9, weight: 800, color: '#bae6fd', shadow: true });

            // front glass of the inner tube
            G.glass(ctx, L, top, w, bot - top, { r: 8, tint: 'rgba(255,255,255,0.02)' });

            // drain stopcock
            G.metal(ctx, x - 6, bot - 2, 12, 16, { tone: 'steel', r: 2 });
            G.knob(ctx, x + 14, bot + 6, 7, this.busy ? performance.now() / 180 : 0.6);
            G.text(ctx, '20 mL', L - 4, bot + 26, { size: 9, weight: 700, color: '#e2e8f0', shadow: true });
            ctx.restore();
        }

        /** frog rectus abdominis strip, tied top and bottom */
        _tissue(ctx, surface) {
            const x = BATH.x;
            const hookY = BATH.bot - 22;
            const shorten = this.amp * PX_MM / MAG;
            const len = REST_LEN - shorten;
            const topY = hookY - len;
            // volume conservation: shorter muscle is fatter
            const wBase = 13 * (1 + shorten / REST_LEN * 0.85);

            ctx.save();
            // lower tie to the fixed hook
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x, hookY); ctx.lineTo(x, hookY + 14); ctx.stroke();
            G.metal(ctx, x - 2.5, hookY + 12, 5, 12, { tone: 'chrome', r: 1, stroke: false });

            // muscle belly
            const g = ctx.createLinearGradient(x - wBase, 0, x + wBase, 0);
            g.addColorStop(0, '#8d4f4b'); g.addColorStop(0.3, '#c98a86');
            g.addColorStop(0.5, '#dba9a3'); g.addColorStop(0.8, '#b06e69'); g.addColorStop(1, '#7c423f');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - wBase * 0.45, topY);
            ctx.bezierCurveTo(x - wBase, topY + len * 0.3, x - wBase, hookY - len * 0.3, x - wBase * 0.45, hookY);
            ctx.lineTo(x + wBase * 0.45, hookY);
            ctx.bezierCurveTo(x + wBase, hookY - len * 0.3, x + wBase, topY + len * 0.3, x + wBase * 0.45, topY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(90,40,38,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();

            // transverse myotome bands (the rectus is segmented by inscriptions)
            ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.1;
            for (let i = 1; i < 5; i++) {
                const yy = topY + len * (i / 5);
                ctx.beginPath();
                ctx.moveTo(x - wBase * 0.8, yy);
                ctx.quadraticCurveTo(x, yy + 2.5, x + wBase * 0.8, yy);
                ctx.stroke();
            }
            // longitudinal fibre striations
            ctx.strokeStyle = 'rgba(120,50,48,0.28)'; ctx.lineWidth = 0.6;
            for (let i = -2; i <= 2; i++) {
                const fx = x + i * wBase * 0.3;
                ctx.beginPath(); ctx.moveTo(fx, topY + 3); ctx.lineTo(fx, hookY - 3); ctx.stroke();
            }
            // specular wetness
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.ellipse(x - wBase * 0.35, topY + len * 0.35, wBase * 0.14, len * 0.2, 0, 0, Math.PI * 2); ctx.fill();

            // upper tie + thread climbing out of the bath
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x, Math.min(surface, topY) - 2); ctx.stroke();
            ctx.restore();
        }

        /* --- frontal writing lever --- */
        _lever(ctx) {
            const rise = this.amp * PX_MM;
            const pX = LEVER.px, pY = LEVER.py;
            const tipX = LEVER.stylusX, tipY = pY - rise;
            const thX = LEVER.threadX, thY = pY - rise / MAG;
            const ang = Math.atan2(pY - tipY, pX - tipX);

            ctx.save();
            // support pillar + fulcrum bracket
            G.metal(ctx, pX - 7, pY + 6, 14, BENCH - pY - 6, { tone: 'steel', r: 3 });
            G.metal(ctx, pX - 20, pY - 10, 40, 20, { tone: 'dark', r: 4 });

            // the beam, drawn along the lever axis
            ctx.save();
            ctx.translate(pX, pY);
            ctx.rotate(-ang);
            const longArm = pX - tipX;
            G.metal(ctx, -longArm, -3, longArm + 46, 6, { tone: 'chrome', r: 2, stroke: false });
            // counterpoise on the short overhang
            G.metal(ctx, 30, -8, 16, 16, { tone: 'brass', r: 2 });
            // writing stylus
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(-longArm, -3); ctx.lineTo(-longArm - 12, 0); ctx.lineTo(-longArm, 3);
            ctx.closePath(); ctx.fill();
            ctx.restore();

            // knife-edge pivot
            G.metal(ctx, pX - 5, pY - 6, 10, 12, { tone: 'dark', r: 2 });
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.arc(pX, pY, 3.4, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.stroke();

            // thread from the lever down to the tissue
            const hookY = BATH.bot - 22;
            const topY = hookY - (REST_LEN - this.amp * PX_MM / MAG);
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.3;
            ctx.beginPath(); ctx.moveTo(thX, thY); ctx.lineTo(thX, topY); ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath(); ctx.arc(thX, thY, 2.6, 0, Math.PI * 2); ctx.fill();

            // stylus contact flare on the drum
            if (this.amp > 0.4) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath(); ctx.arc(tipX - 12, tipY, 2.4, 0, Math.PI * 2); ctx.fill();
            }

            G.text(ctx, 'FRONTAL WRITING LEVER · ×' + MAG.toFixed(0), (tipX + pX) / 2, pY - rise - 16,
                { size: 9, align: 'center', weight: 800, color: 'rgba(226,232,240,0.85)', shadow: true });
            ctx.restore();
        }

        /* --- reagent rack + micropipette on the bench --- */
        _rack(ctx) {
            const list = this.cfg.treatments;
            const x0 = 396, gap = 46;
            ctx.save();
            G.shadow(ctx, x0 + (list.length - 1) * gap / 2, 528, 150, 9, 0.4);
            G.metal(ctx, x0 - 28, 506, (list.length - 1) * gap + 56, 22, { tone: 'dark', r: 5 });
            list.forEach((t, i) => {
                const vx = x0 + i * gap;
                const sel = this.drug && this.drug.id === t.id;
                const hov = Math.abs(this.ptr.x - vx) < 20 && this.ptr.y > 470 && this.ptr.y < 532;
                G.vial(ctx, vx, 512 - (sel || hov ? 4 : 0), { color: t.color, label: t.short, h: 46, w: 21, fill: 0.72 });
                if (sel) {
                    ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 1.6;
                    G.rr(ctx, vx - 14, 458, 28, 58, 5); ctx.stroke();
                }
            });
            if (!this.dragTool) {
                const t = this.tools[0];
                const hov = Math.abs(this.ptr.x - t.x) < 52 && Math.abs(this.ptr.y - t.y) < 34;
                this._pipette(ctx, t.x, t.y - (hov ? 4 : 0), 0);
                G.text(ctx, hov ? 'Drag into the organ bath' : t.label, t.x, 532,
                    { size: 9.5, align: 'center', weight: 700, color: '#e2e8f0', shadow: true });
            }
            ctx.restore();
        }

        _pipette(ctx, x, y, rot) {
            const c = this.drug ? this.drug.color : '#94a3b8';
            ctx.save();
            ctx.translate(x, y); ctx.rotate(rot);
            G.metal(ctx, -9, -34, 18, 30, { tone: 'dark', r: 5 });
            ctx.fillStyle = '#334155'; G.rr(ctx, -7, -40, 14, 8, 3); ctx.fill();
            G.glass(ctx, -6, -6, 12, 26, { r: 3, tint: 'rgba(230,240,250,0.3)' });
            ctx.fillStyle = G.hexA(c, 0.8);
            ctx.fillRect(-4, 4, 8, 14);
            ctx.fillStyle = G.hexA(c, 0.9);
            ctx.beginPath(); ctx.moveTo(-4, 18); ctx.lineTo(4, 18); ctx.lineTo(1, 32); ctx.lineTo(-1, 32); ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }

    LAB.register(11, FrogRectus);
})();
