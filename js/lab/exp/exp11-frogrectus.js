/**
 * EXP 11 — Effect of drugs on the frog rectus abdominis muscle
 *
 * A strip of frog rectus is mounted in the shared organ-bath rig (LAB.OrganBath)
 * and the qualitative effect of each drug class is compared.
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
    const { M } = LAB;

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

    class FrogRectus extends LAB.OrganBath {
        rig() {
            return { solution: "Frog Ringer", tempC: null, restLen: 96, tissueLabel: 'Frog rectus abdominis' };
        }

        config() {
            return {
                room: { benchY: LAB.RIG.BENCH, seed: 5 },
                syringe: false,
                steps: [
                    'A strip of <b>frog rectus abdominis</b> is tied at both ends and mounted in a 20 mL organ bath of frog Ringer, aerated and kept at room temperature.',
                    'The upper thread is attached to a <b>frontal writing lever</b> (×6 magnification) under 1 g resting tension; the stylus writes on the smoked drum.',
                    'Allow the tissue to <b>equilibrate for 15 min</b>, washing with fresh Ringer, until the baseline is steady.',
                    'Add a measured dose of agonist, leave a <b>60 s contact time</b>, read the height of the contracture, then <b>wash out 3×</b>.',
                    'Repeat with graded doses, then repeat in the presence of d-tubocurarine, physostigmine or atropine and compare the shift.'
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
            this.records = [];
            this.initRig();
            this.resetAnimal();
        }

        resetAnimal() {
            this.tissueNo = (this.tissueNo || 0) + 1;
            this.resetRig();
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

        /* ---------------- left column ---------------- */
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
                    { label: '🚿 Washout ×3', disabled: !dirty, onClick: () => this.washBath(() => this._refresh()) }
                ];
                if (this.mod) list.push({ label: '🧼 Prolonged wash (clear ' + this.mod.drug.short + ')', onClick: () => this.clearMod() });
                this.actions(list);
            }
            this.hud('l', [
                { k: 'Tissue', v: '#' + this.tissueNo },
                { k: 'Bath', v: this.mod ? this.mod.drug.short : 'Ringer', tone: this.mod ? 'warn' : '' }
            ]);
        }

        /* ---------------- pharmacology ---------------- */
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

        pipetteDropped() {
            if (this.phase === 'equil') return this.toast('Equilibrate the tissue for 15 min first.', 'warn');
            if (this.agonistIn || this.amp > 1.5) return this.toast('Wash the bath out before adding the next dose.', 'warn');
            this.addDrug();
        }

        addDrug() {
            if (this.busy) return;
            const d = this.drug, dose = this.dose;
            this.markAddition(d, dose);

            if (d.kind === 'agonist') {
                this.ampTarget = this.response(d, dose);
                this.agonistIn = true;
                this.vigour = Math.max(0.82, this.vigour - 0.008);
                this.timeLapse(1, 2.8, { label: 'Contact time', onDone: () => this._record(d, dose, this.amp) });
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

        clearMod() {
            if (this.busy) return;
            const was = this.mod ? this.mod.drug.short : '';
            this.mod = null;
            this.washBath(() => this._refresh());
            this.toast(`Prolonged wash — ${was} removed, bath back to plain Ringer.`, 'info');
            this._controls();
        }

        /* ---------------- graph & inference ---------------- */
        _chart() {
            const groups = {};
            this.records.forEach(r => {
                const key = r.drug.short + (r.cond === 'control' ? '' : ' + ' + r.cond);
                if (!groups[key]) groups[key] = [];
                groups[key].push([r.dose, r.pct]);
            });
            const keys = Object.keys(groups);
            if (!keys.length) return;
            let lo = Infinity, hi = 0;
            keys.forEach(k => groups[k].forEach(p => { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[0]); }));
            const palette = ['#0d9488', '#dc2626', '#16a34a', '#6366f1', '#f59e0b', '#7c3aed'];
            this.chart.draw({
                logX: true,
                xMin: Math.max(0.4, lo * 0.55), xMax: hi * 1.9,
                yMin: 0, yMax: 105,
                xLabel: 'Dose in bath (log scale)',
                yLabel: '% of maximal response',
                xFmt: v => v >= 1 ? String(Math.round(v)) : v.toFixed(1),
                series: keys.map((k, i) => ({
                    name: k, color: palette[i % palette.length], markers: true,
                    points: groups[k].slice().sort((a, b) => a[0] - b[0])
                }))
            });
        }

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

            const ctrl = this.records.filter(r => r.drug.id === d.id && r.cond === 'control').map(r => [r.dose, r.pct]);
            const treated = this.records.filter(r => r.drug.id === d.id && r.cond !== 'control');
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

        /* ---------------- per-frame ---------------- */
        update(dt) {
            this.updateRig(dt);
            this.hud('r', [
                { k: 'Response', v: this.amp.toFixed(1) + ' mm' },
                { k: 'Lever', v: '×' + LAB.RIG.MAG.toFixed(0) },
                { k: 'Clock', v: LAB.fmtClock(this.simMin) }
            ]);
        }

        draw(ctx) { this.drawRig(ctx); }

        /** frog rectus: reddish striated strip segmented by myotome inscriptions */
        drawTissue(ctx, o) {
            const { x, topY, hookY, len, w } = o;
            const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
            g.addColorStop(0, '#8d4f4b'); g.addColorStop(0.3, '#c98a86');
            g.addColorStop(0.5, '#dba9a3'); g.addColorStop(0.8, '#b06e69'); g.addColorStop(1, '#7c423f');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.45, topY);
            ctx.bezierCurveTo(x - w, topY + len * 0.3, x - w, hookY - len * 0.3, x - w * 0.45, hookY);
            ctx.lineTo(x + w * 0.45, hookY);
            ctx.bezierCurveTo(x + w, hookY - len * 0.3, x + w, topY + len * 0.3, x + w * 0.45, topY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(90,40,38,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();

            ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.1;
            for (let i = 1; i < 5; i++) {
                const yy = topY + len * (i / 5);
                ctx.beginPath();
                ctx.moveTo(x - w * 0.8, yy);
                ctx.quadraticCurveTo(x, yy + 2.5, x + w * 0.8, yy);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(120,50,48,0.28)'; ctx.lineWidth = 0.6;
            for (let i = -2; i <= 2; i++) {
                const fx = x + i * w * 0.3;
                ctx.beginPath(); ctx.moveTo(fx, topY + 3); ctx.lineTo(fx, hookY - 3); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.ellipse(x - w * 0.35, topY + len * 0.35, w * 0.14, len * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        }
    }

    LAB.register(11, FrogRectus);
})();
