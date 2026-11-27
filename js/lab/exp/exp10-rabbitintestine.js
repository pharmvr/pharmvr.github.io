/**
 * EXP 10 — Effect of drugs on isolated rabbit intestine
 *
 * A 2–3 cm segment of rabbit ileum in Tyrode's solution at 37 °C, gassed and
 * mounted on the shared organ-bath rig. Unlike the frog rectus, this is SMOOTH
 * muscle with an intramural plexus, so it shows spontaneous rhythmic pendular
 * movements at rest — and drugs can move the trace in either direction.
 *
 * The experiment turns on which blocker abolishes which response:
 *   ACh         → contraction via M₃            — abolished by atropine
 *   Histamine   → contraction via H₁            — abolished by mepyramine, NOT atropine
 *   Nicotine    → contraction via the plexus    — abolished by atropine (final mediator is ACh)
 *   BaCl₂       → direct smooth-muscle spasm    — abolished by NOTHING
 *   Adrenaline  → relaxation, abolishes rhythm
 *   Papaverine  → direct (musculotropic) relaxation
 */
(function () {
    const { M } = LAB;

    const DRUGS = {
        ach: {
            id: 'ach', name: 'Acetylcholine', short: 'ACh', cls: 'Muscarinic M₃ agonist',
            color: '#0d9488', kind: 'agonist', unit: 'µg', ec50: 2, emax: 42, hill: 1.4,
            doses: [0.5, 1, 2, 5, 10], blockedBy: ['atropine'],
            note: 'ACh contracts intestinal smooth muscle through <b>M₃</b> receptors, raising IP₃ and intracellular Ca²⁺. Atropine abolishes it.'
        },
        histamine: {
            id: 'histamine', name: 'Histamine', short: 'His', cls: 'H₁ agonist',
            color: '#db2777', kind: 'agonist', unit: 'µg', ec50: 3, emax: 38, hill: 1.4,
            doses: [1, 2, 5, 10, 20], blockedBy: ['mepyramine'],
            note: 'Histamine contracts the gut through <b>H₁</b> receptors. It is blocked by mepyramine but <b>not</b> by atropine — proof that two separate receptors are involved.'
        },
        nicotine: {
            id: 'nicotine', name: 'Nicotine', short: 'Nic', cls: 'Ganglionic stimulant',
            color: '#7c3aed', kind: 'agonist', unit: 'µg', ec50: 50, emax: 28, hill: 1.3,
            doses: [10, 25, 50, 100, 200], blockedBy: ['atropine'],
            note: 'Nicotine stimulates ganglion cells of the <b>intramural plexus</b>, which release ACh onto the muscle. Because the final mediator is ACh, atropine abolishes the response.'
        },
        bacl2: {
            id: 'bacl2', name: 'Barium chloride', short: 'BaCl₂', cls: 'Direct smooth-muscle spasmogen',
            color: '#6366f1', kind: 'agonist', unit: 'mg', ec50: 0.4, emax: 44, hill: 1.8,
            doses: [0.1, 0.2, 0.5, 1, 2], blockedBy: [],
            note: 'Ba²⁺ acts <b>directly</b> on the muscle membrane, blocking K⁺ channels and depolarising it. No receptor antagonist can prevent it — the standard check that the tissue is still viable.'
        },
        adrenaline: {
            id: 'adrenaline', name: 'Adrenaline', short: 'Adr', cls: 'Adrenergic agonist (α₂/β₂)',
            color: '#d97706', kind: 'agonist', unit: 'µg', ec50: 1, emax: -30, hill: 1.4,
            doses: [0.5, 1, 2, 5], blockedBy: [], spont: 0.12,
            note: 'Adrenaline <b>relaxes</b> the gut and abolishes the pendular movements — β₂ receptors on the muscle plus α₂ receptors inhibiting ACh release from the plexus.'
        },
        papaverine: {
            id: 'papaverine', name: 'Papaverine', short: 'Pap', cls: 'Musculotropic relaxant',
            color: '#0891b2', kind: 'agonist', unit: 'µg', ec50: 20, emax: -26, hill: 1.6,
            doses: [5, 10, 20, 50], blockedBy: [], spont: 0.22,
            note: 'Papaverine inhibits phosphodiesterase and relaxes the muscle <b>directly</b>, independent of any receptor — a non-specific spasmolytic.'
        },
        atropine: {
            id: 'atropine', name: 'Atropine', short: 'Atr', cls: 'Muscarinic antagonist',
            color: '#dc2626', kind: 'antagonist', unit: 'µg', kb: 2, doses: [1, 2, 5], spont: 0.55,
            note: 'Atropine blocks M₃ receptors. It abolishes the ACh and nicotine responses but leaves histamine and BaCl₂ untouched.'
        },
        mepyramine: {
            id: 'mepyramine', name: 'Mepyramine', short: 'Mep', cls: 'H₁ antagonist',
            color: '#16a34a', kind: 'antagonist', unit: 'µg', kb: 2, doses: [1, 2, 5],
            note: 'Mepyramine blocks H₁ receptors. It abolishes the histamine response while leaving the ACh response intact.'
        }
    };

    class RabbitIntestine extends LAB.OrganBath {
        rig() {
            return {
                solution: "Tyrode's solution",
                tempC: 37,
                restLen: 90,
                spont: { amp: 4.5, period: 4.2 },
                tissueLabel: 'Rabbit ileum'
            };
        }

        config() {
            return {
                room: { benchY: LAB.RIG.BENCH, seed: 7 },
                syringe: false,
                steps: [
                    'Mount a 2–3 cm segment of <b>rabbit ileum</b> in the 20 mL bath of Tyrode’s solution at <b>37 °C</b>, gassed with O₂/CO₂.',
                    'Equilibrate for <b>30 min</b> under 1 g tension until regular <b>spontaneous pendular movements</b> appear on the drum.',
                    'Add a dose of agonist, allow <b>30 s contact</b>, read the change in tone, then wash out 3× and let the rhythm return.',
                    'Record the control response of ACh, histamine and BaCl₂ in turn.',
                    'Add <b>atropine</b> as a pre-treatment and repeat all three — note which responses survive.',
                    'Repeat with <b>mepyramine</b> and compare, then relax the gut with adrenaline or papaverine.'
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
                        q: 'Why does the isolated rabbit ileum show spontaneous rhythmic contractions?',
                        opts: ['Because of residual drug', 'Pacemaker activity in the interstitial cells of Cajal, modulated by the intramural plexus', 'Because of the oxygen bubbles', 'Because the lever vibrates'],
                        ans: 1,
                        exp: 'Slow waves generated by the interstitial cells of Cajal spread through the syncytium and produce the pendular movements, which continue after the gut is removed from the animal.'
                    },
                    {
                        q: 'Atropine abolishes the response to acetylcholine but not to histamine. This shows that:',
                        opts: ['Histamine is more potent', 'The two agonists act on different receptors', 'Atropine was degraded', 'Histamine acts on the lever'],
                        ans: 1,
                        exp: 'Selective antagonism is the classical evidence for distinct receptors: atropine is specific for muscarinic receptors, so a surviving response must be mediated by something else — here H₁.'
                    },
                    {
                        q: 'Why does BaCl₂ still contract the gut in the presence of a full blocking dose of atropine?',
                        opts: ['Barium is a muscarinic agonist', 'Barium acts directly on the muscle membrane, bypassing receptors', 'Atropine potentiates barium', 'The tissue has recovered'],
                        ans: 1,
                        exp: 'Ba²⁺ blocks K⁺ channels and depolarises smooth muscle directly. Its persistence confirms the tissue is still viable and that the block is receptor-specific rather than general muscle paralysis.'
                    },
                    {
                        q: 'Nicotine contracts the ileum, and this contraction is abolished by atropine. The best explanation is:',
                        opts: ['Nicotine is a muscarinic agonist', 'Nicotine stimulates intramural ganglia, which release ACh onto M₃ receptors', 'Atropine blocks nicotinic receptors', 'Nicotine acts on H₁ receptors'],
                        ans: 1,
                        exp: 'Nicotine acts on the ganglion cells of the plexus, not the muscle. The transmitter finally reaching the muscle is ACh, so blocking the muscarinic step abolishes the whole response.'
                    },
                    {
                        q: 'Why is Tyrode’s solution kept at 37 °C and gassed, rather than used cold?',
                        opts: ['To sterilise it', 'Mammalian smooth muscle needs body temperature, glucose and oxygen to sustain rhythmic activity', 'To dissolve the drugs', 'To stop the tissue floating'],
                        ans: 1,
                        exp: 'Unlike amphibian tissue, mammalian gut is metabolically demanding. Below 37 °C or without oxygen the pendular movements fade and drug responses become unreliable.'
                    }
                ],
                inferenceHint: 'Record control responses first, then add a blocker and repeat them — the pattern of what survives identifies the receptor.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.drug = DRUGS.ach;
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

        /* ---------------- left column ---------------- */
        _controls() {
            const d = this.drug;
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Dose of ${d.short} into the 20 mL bath</div>
                <div class="lab2-seg" id="ri-dose">${d.doses.map(v => `<button data-v="${v}" class="${v === this.dose ? 'active' : ''}">${v}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">Units: ${d.unit} per bath</div>
                <p style="margin-top:8px;font-size:11.5px;color:${this.mod ? '#0f766e' : '#64748b'}"><b>Bath condition:</b> ${this.mod ? this.mod.drug.short + ' ' + this.mod.dose + ' ' + this.mod.drug.unit + ' present' : "plain Tyrode's"}</p>
            `);
            const seg = this.$('ri-dose');
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
                this.status('Ileum mounted at <b>37 °C</b>. Equilibrate until the pendular rhythm is regular.');
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
                { k: 'Bath', v: this.mod ? this.mod.drug.short : "Tyrode's", tone: this.mod ? 'warn' : '' }
            ]);
        }

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
            return sign * mag * this.vigour + M.randn() * 0.6;
        }

        /* ---------------- procedure ---------------- */
        equilibrate() {
            this.timeLapse(30, 3.4, {
                label: 'Equilibration',
                onDone: () => {
                    this.phase = 'ready';
                    this.setStep(2);
                    this.toast('Regular pendular movements established. Begin dosing.', 'success');
                    this._refresh();
                }
            });
        }

        pipetteDropped() {
            if (this.phase === 'equil') return this.toast('Equilibrate the tissue for 30 min first.', 'warn');
            if (this.agonistIn || Math.abs(this.amp) > 1.5) return this.toast('Wash the bath out before adding the next dose.', 'warn');
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
                this.mod ? `+ ${cond}` : "plain Tyrode's",
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
            this.toast(`Prolonged wash — ${was} removed, bath back to plain Tyrode's.`, 'info');
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
            const palette = ['#0d9488', '#dc2626', '#16a34a'];
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
                else if (frac < 0.7) verdict = `The response is <b>markedly reduced</b> to ${(frac * 100).toFixed(0)}% of control — partial blockade at this dose.`;
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

        /** rabbit ileum: pale pink-grey tube with a mesenteric border */
        drawTissue(ctx, o) {
            const { x, topY, hookY, len, w } = o;
            const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
            g.addColorStop(0, '#9a8079'); g.addColorStop(0.28, '#d9bdb2');
            g.addColorStop(0.5, '#eed6cb'); g.addColorStop(0.78, '#c7a79b'); g.addColorStop(1, '#8c7269');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.6, topY);
            ctx.bezierCurveTo(x - w, topY + len * 0.25, x - w, hookY - len * 0.25, x - w * 0.6, hookY);
            ctx.lineTo(x + w * 0.6, hookY);
            ctx.bezierCurveTo(x + w, hookY - len * 0.25, x + w, topY + len * 0.25, x + w * 0.6, topY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(110,80,70,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();

            // circular muscle constrictions — tighter as the gut contracts
            const rings = 6;
            ctx.strokeStyle = 'rgba(130,95,85,0.3)'; ctx.lineWidth = 1.1;
            for (let i = 1; i < rings; i++) {
                const yy = topY + len * (i / rings);
                ctx.beginPath();
                ctx.moveTo(x - w * 0.82, yy);
                ctx.quadraticCurveTo(x, yy + 3, x + w * 0.82, yy);
                ctx.stroke();
            }
            // mesenteric border running down one side
            ctx.strokeStyle = 'rgba(190,120,120,0.5)'; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x + w * 0.5, topY + 4);
            ctx.bezierCurveTo(x + w * 0.78, topY + len * 0.35, x + w * 0.72, hookY - len * 0.3, x + w * 0.5, hookY - 4);
            ctx.stroke();
            // serosal sheen
            ctx.fillStyle = 'rgba(255,255,255,0.32)';
            ctx.beginPath(); ctx.ellipse(x - w * 0.32, topY + len * 0.4, w * 0.15, len * 0.26, 0, 0, Math.PI * 2); ctx.fill();
        }
    }

    LAB.register(10, RabbitIntestine);
})();
