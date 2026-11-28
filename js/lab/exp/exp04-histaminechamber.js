/**
 * EXP 4 — Antihistaminic activity: histamine aerosol chamber (guinea pig)
 *
 * The guinea pig is uniquely sensitive to histamine-induced bronchospasm. In a
 * closed chamber filled with histamine aerosol it develops progressive
 * laboured breathing, and the end point is PRE-CONVULSIVE DYSPNOEA (PCD) — the
 * moment of air hunger with loss of balance, at which the animal is removed to
 * fresh air at once. The time taken to reach it measures protection.
 *
 *   % protection = (1 − PCD control / PCD test) × 100
 *
 * Ranitidine is in the panel deliberately. It is a potent antihistamine at H₂
 * receptors and gives no protection whatever here, because bronchial smooth
 * muscle constricts through H₁ — which is the point of including it.
 */
(function () {
    const { M, G } = LAB;

    const CAGE = { x: 22, y: 262, w: 176, h: 146, floor: 398 };
    const CH = { x: 232, y: 190, w: 304, h: 218, floor: 400 };
    const UNIT = { x: 572, y: 168, w: 362, h: 242 };
    const CUTOFF = 900;         // 15 min — complete protection beyond this

    class HistamineChamber extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 412, seed: 2 },
                tray: { x: 40, y: 522 },
                steps: [
                    'Select a group, draw up the dose and inject the guinea pig <b>i.p.</b> in its holding cage.',
                    'Allow <b>30 min</b> for the drug to be absorbed and distributed.',
                    'Transfer the animal to the <b>aerosol chamber</b> and close the lid.',
                    'Start the nebuliser delivering <b>0.2% histamine dihydrochloride</b> aerosol and start the clock.',
                    'Watch for <b>pre-convulsive dyspnoea</b>: laboured open-mouth breathing with loss of balance.',
                    'Remove the animal to fresh air <b>immediately</b> at PCD, note the time, and calculate % protection.'
                ],
                treatments: [
                    { id: 'saline', name: 'Normal saline 10 mL/kg i.p.', short: 'Control', cls: 'Vehicle control', color: '#64748b', pcd: 95, prot: 0 },
                    { id: 'chlorphen', name: 'Chlorpheniramine 2 mg/kg i.p.', short: 'CPM', cls: 'H₁ antagonist (alkylamine)', color: '#0d9488', pcd: 380, prot: 1 },
                    { id: 'mepyramine', name: 'Mepyramine 2 mg/kg i.p.', short: 'Mepyr', cls: 'H₁ antagonist (ethylenediamine)', color: '#16a34a', pcd: 430, prot: 1 },
                    { id: 'promethazine', name: 'Promethazine 5 mg/kg i.p.', short: 'Prometh', cls: 'H₁ antagonist (phenothiazine)', color: '#6366f1', pcd: 470, prot: 1 },
                    { id: 'cetirizine', name: 'Cetirizine 5 mg/kg i.p.', short: 'Cetiriz', cls: 'Second-generation H₁ antagonist', color: '#7c3aed', pcd: 410, prot: 1 },
                    { id: 'ranitidine', name: 'Ranitidine 5 mg/kg i.p.', short: 'Raniti', cls: 'H₂ antagonist — wrong receptor', color: '#dc2626', pcd: 105, prot: 0 }
                ],
                table: ['Group', 'PCD (s)', '% protection', 'Result'],
                chart: true, chartTitle: 'Mean time to pre-convulsive dyspnoea',
                chartEmpty: { xMin: 0.4, xMax: 6.6, yMin: 0, yMax: 960, xTicks: [1, 2, 3, 4, 5, 6], xLabel: 'Group', yLabel: 'PCD time (s)', series: [] },
                viva: [
                    {
                        q: 'What is the end point of the histamine aerosol test?',
                        opts: ['Death of the animal', 'Pre-convulsive dyspnoea — laboured breathing with loss of balance', 'Sneezing', 'Loss of righting reflex'],
                        ans: 1,
                        exp: 'PCD is a deliberately humane end point taken well before convulsions or death. The animal is removed to fresh air the moment it appears and recovers completely.'
                    },
                    {
                        q: 'Why is the guinea pig chosen for this experiment?',
                        opts: ['It is cheap', 'Its bronchial smooth muscle is exceptionally rich in H₁ receptors, so histamine reliably produces bronchospasm', 'It cannot feel pain', 'It has no histamine of its own'],
                        ans: 1,
                        exp: 'Species differ enormously in histamine sensitivity. The guinea pig bronchus constricts so reproducibly that the response became the standard screen for antihistamines.'
                    },
                    {
                        q: 'Ranitidine gives no protection in this test because:',
                        opts: ['The dose is too small', 'Bronchoconstriction is mediated by H₁ receptors, and ranitidine blocks H₂', 'It is destroyed by the aerosol', 'It is not absorbed after i.p. injection'],
                        ans: 1,
                        exp: 'Ranitidine is a perfectly good antihistamine — at the wrong receptor. Its complete failure here is positive evidence that the bronchospasm is H₁-mediated.'
                    },
                    {
                        q: 'Protection is calculated as:',
                        opts: ['PCD test − PCD control', '(1 − PCD control / PCD test) × 100', 'PCD control / PCD test', 'The dose divided by the PCD time'],
                        ans: 1,
                        exp: 'Expressing protection as a proportion of the prolongation makes results comparable between animals of differing baseline sensitivity.'
                    },
                    {
                        q: 'Why is a cut-off time imposed on the exposure?',
                        opts: ['To save histamine', 'On humane grounds and because an animal that has not reacted by then is regarded as completely protected', 'The nebuliser overheats', 'The chamber runs out of air'],
                        ans: 1,
                        exp: 'A fixed cut-off, usually 10–15 minutes, limits distress and provides a defined ceiling for the measurement rather than leaving the animal exposed indefinitely.'
                    },
                    {
                        q: 'Second-generation antihistamines such as cetirizine differ from promethazine mainly in that they:',
                        opts: ['Are more potent at H₁', 'Penetrate the blood–brain barrier poorly and so cause much less sedation', 'Block H₂ as well', 'Act on the bronchi directly'],
                        ans: 1,
                        exp: 'Both protect in this test, but the older sedating drugs are lipophilic and enter the CNS freely. Peripheral protection is similar; the difference is central side effects.'
                    }
                ],
                inferenceHint: 'Run a control animal first to establish the untreated PCD time, then test the drugs — especially ranitidine.'
            };
        }

        setup() {
            this.results = {};
            this.pigNo = 0;
            this.mist = [];
            this.hotspots = [
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Holding cage' },
                { x: CH.x, y: CH.y, w: CH.w, h: CH.h, label: 'Aerosol exposure chamber' },
                { x: UNIT.x, y: UNIT.y, w: UNIT.w, h: UNIT.h, label: 'Nebuliser and exposure timer' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.pigNo++;
            this.pig = new LAB.GuineaPig({ x: CAGE.x + 90, y: CAGE.floor, scale: 0.86, facing: 1 });
            this.pig.groundY = CAGE.floor;
            this.where = 'cage';
            this.walkTo = CAGE.x + 90;
            this.phase = 'treat';
            this.injected = null;
            this.drugMin = null;
            this.exp = null;
            this.mist = [];
            this.setStep(0);
            this._refresh();
        }

        _refresh() {
            const busy = this.busy, ph = this.phase;
            if (ph === 'treat') {
                this.status(`Select a group and give <b>${this.tr.name}</b> i.p.`);
                this.actions([{ label: '💉 Load & inject', primary: true, disabled: busy, onClick: () => this.autoInject() }]);
            } else if (ph === 'absorb') {
                this.status(`<b>${this.injected.name}</b> given. Allow 30 min for absorption.`);
                this.actions([{ label: '⏩ Wait 30 min', primary: true, disabled: busy, onClick: () => this.wait() }]);
            } else if (ph === 'place') {
                this.status('Transfer the guinea pig to the <b>aerosol chamber</b> and close the lid.');
                this.actions([{ label: '🐹 Place in chamber', primary: true, disabled: busy, onClick: () => this.place() }]);
            } else if (ph === 'ready') {
                this.status('Lid closed. Start the nebuliser delivering <b>0.2% histamine aerosol</b>.');
                this.actions([{ label: '💨 Start aerosol', primary: true, danger: true, disabled: busy, onClick: () => this.startAerosol() }]);
            } else if (ph === 'expose') {
                const e = this.exp;
                this.status(`Exposed <b>${Math.round(e.t)} s</b> — ${e.t / e.pcd > 0.72 ? 'breathing becoming laboured…' : 'watching for dyspnoea…'}`);
                this.actions([{ label: '⏩ Fast forward', always: true, onClick: () => { e.fast = !e.fast; } }]);
            } else if (ph === 'pcd') {
                this.status('<b style="color:#be123c">Pre-convulsive dyspnoea</b> — remove the animal to fresh air immediately.');
                this.actions([{ label: '🌬️ Remove to fresh air', primary: true, always: true, onClick: () => this.rescue() }]);
            } else if (ph === 'done') {
                this.status('Animal recovered in fresh air. Use a <b>fresh guinea pig</b> for the next group.');
                this.actions([{ label: '↺ Next guinea pig', primary: true, disabled: busy, onClick: () => this.resetAnimal() }]);
            }
            this.hud('l', [
                { k: 'Guinea pig', v: '#' + this.pigNo },
                { k: 'Group', v: this.injected ? this.injected.short : 'untreated' }
            ]);
        }

        onSelect() { if (this.phase === 'treat') this._refresh(); }

        getInjectZone() {
            if (this.phase !== 'treat' || this.where !== 'cage') return null;
            const p = this.pig;
            return { x: p.x - 8 * p.facing, y: p.y - 16, r: 26, label: 'Abdomen (i.p.)', angle: Math.PI / 2 - 0.35 };
        }

        onInjected(tr) {
            this.injected = tr;
            this.drugMin = 0;
            this.floatText(this.pig.x, this.pig.y - 60, `${tr.short} i.p.`, '#fde68a');
            this.phase = 'absorb';
            this.setStep(1);
            setTimeout(() => this._refresh(), 900);
        }

        wait() {
            const gen = this.gen;
            this.timeLapse(30, 3.4, {
                label: 'Absorption',
                onTick: (s, p) => { if (gen === this.gen) this.drugMin = 30 * p; },
                onDone: () => { if (gen !== this.gen) return; this.phase = 'place'; this.setStep(2); this._refresh(); }
            });
            this._refresh();
        }

        place() {
            if (this.busy) return;
            if (!this.injected) return this.toast('Give the treatment before exposing the animal.', 'warn');
            this.busy = true;
            const gen = this.gen, ok = () => gen === this.gen;
            const p = this.pig, sx = p.x, sy = p.y;
            const tx = CH.x + CH.w * 0.44;
            this.where = 'carry';
            p.set({ walk: 0 }); p.gaitSpeed = 0; p.groundY = null;
            this.tw.add(0.35, e => { p.rot = M.lerp(0, -Math.PI / 2 * p.facing, e); p.y = sy - 34 * e; }, {
                onDone: () => this.tw.add(0.85, e => {
                    p.x = M.lerp(sx, tx, e);
                    p.y = M.lerp(sy - 34, CH.floor - 70, e) - Math.sin(e * Math.PI) * 50;
                }, {
                    onDone: () => this.tw.add(0.35, e => { p.y = M.lerp(CH.floor - 70, CH.floor, e); p.rot = M.lerp(-Math.PI / 2 * p.facing, 0, e); }, {
                        onDone: () => {
                            if (!ok()) return;
                            p.groundY = CH.floor; p.rot = 0;
                            this.where = 'chamber'; this.walkTo = tx;
                            this.busy = false; this.phase = 'ready'; this.setStep(3); this._refresh();
                        }
                    })
                })
            });
            this._refresh();
        }

        startAerosol() {
            if (this.busy) return;
            const d = this.injected;
            const sc = M.clamp(M.gauss(1, 0.16), 0.6, 1.6);
            const pcd = M.clamp(d.pcd * sc, 45, CUTOFF * 1.4);
            this.exp = { t: 0, pcd, fast: false, done: false };
            this.phase = 'expose';
            this.setStep(4);
            this.toast('Nebuliser running — watch for laboured breathing.', 'info');
            this._refresh();
        }

        _reachPCD(complete) {
            const e = this.exp, d = this.injected;
            if (!e || e.done) return;
            e.done = true;
            const t = complete ? CUTOFF : e.t;
            const r = (this.results[d.id] = this.results[d.id] || []);
            r.push({ pcd: t, complete });
            this.lastRun = { t, complete };
            if (complete) {
                this.phase = 'done';
                this.setStep(5);
                this._record();
                this.toast(`No dyspnoea in ${CUTOFF / 60} min — <b>complete protection</b>.`, 'success', 3600);
            } else {
                this.phase = 'pcd';
                this.floatText(this.pig.x, this.pig.y - 86, `PCD at ${Math.round(t)} s`, '#fda4af');
            }
            this._refresh();
        }

        rescue() {
            if (this.phase !== 'pcd') return;
            this.busy = true;
            const gen = this.gen;
            this.mist = [];
            this.tw.wait(1.1, () => {
                if (gen !== this.gen) return;
                this.busy = false;
                this.phase = 'done';
                this.setStep(5);
                this._record();
                this.toast('Removed to fresh air — the animal recovers within a minute.', 'success');
                this._refresh();
            });
            this._refresh();
        }

        _record() {
            const d = this.injected, run = this.lastRun;
            if (!d || !run) return;
            const ctrl = this.results.saline ? M.mean(this.results.saline.map(x => x.pcd)) : null;
            const prot = ctrl ? (1 - ctrl / run.t) * 100 : null;
            this.addRow([
                `<b>${d.short}</b> · GP${this.pigNo}`,
                run.complete ? `<b style="color:#0f766e">&gt;${CUTOFF}</b>` : `<b>${Math.round(run.t)}</b>`,
                prot === null ? '—' : `<b>${prot.toFixed(0)}%</b>`,
                run.complete ? '<span style="color:#15803d">Complete</span>'
                    : (prot !== null && prot > 50 ? '<span style="color:#15803d">Protected</span>'
                        : '<span style="color:#be123c">Not protected</span>')
            ], run.complete || (prot !== null && prot > 50) ? 'up' : '');
            this.markDone(d.id);
            this._chart();
            this._infer();
        }

        _chart() {
            const trs = this.cfg.treatments, pts = [];
            trs.forEach((t, i) => {
                const r = this.results[t.id];
                if (!r) return;
                pts.push([i + 1, M.mean(r.map(x => x.pcd)), r.length > 1 ? M.sem(r.map(x => x.pcd)) : 0]);
            });
            this.chart.draw(Object.assign({}, this.cfg.chartEmpty, {
                xFmt: v => (trs[v - 1] ? trs[v - 1].short : ''),
                series: [{ name: 'Mean PCD (s)', color: '#0d9488', type: 'bar', points: pts, barWidth: 0.5, labels: true }],
                annotations: [{ y: CUTOFF, text: 'cut-off', color: '#15803d' }]
            }));
        }

        _infer() {
            const R = this.results;
            const ctrl = R.saline ? M.mean(R.saline.map(x => x.pcd)) : null;
            let html = this.cfg.treatments.filter(t => R[t.id]).map(t => {
                const r = R[t.id];
                const m = M.mean(r.map(x => x.pcd));
                const p = ctrl ? (1 - ctrl / m) * 100 : null;
                return `<div class="kv"><span>${t.short} (n=${r.length}) PCD / protection</span><span>${m.toFixed(0)} s / ${p === null ? '—' : p.toFixed(0) + '%'}</span></div>`;
            }).join('');
            const n = [];
            if (!ctrl) n.push('Run a <b>control</b> animal to establish the untreated PCD time.');
            else {
                if (R.ranitidine) {
                    const m = M.mean(R.ranitidine.map(x => x.pcd));
                    const p = (1 - ctrl / m) * 100;
                    n.push(`<b>Ranitidine gives only ${p.toFixed(0)}% protection</b> despite being a potent antihistamine — because it blocks H₂, and bronchial constriction is H₁-mediated. Its failure is the positive control that identifies the receptor.`);
                }
                const h1 = ['chlorphen', 'mepyramine', 'promethazine', 'cetirizine'].filter(id => R[id]);
                if (h1.length >= 2) n.push('All the H₁ antagonists prolong PCD severalfold, confirming that one receptor underlies the response regardless of chemical class.');
                if (R.cetirizine && R.promethazine) n.push('Cetirizine protects as well as promethazine peripherally; the two differ in CNS penetration and therefore in sedation, not in H₁ blockade.');
            }
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        /* ---------- simulation ---------- */
        update(dt) {
            const p = this.pig;
            const e = this.exp;

            if (e && this.phase === 'expose') {
                e.t += dt * (e.fast ? 70 : 22);
                const f = M.clamp(e.t / e.pcd, 0, 1);
                // dyspnoea builds through the exposure, ataxia only near the end
                p.set({
                    dyspnoea: Math.pow(f, 1.8),
                    ataxia: M.clamp((f - 0.72) / 0.28, 0, 1) * 0.9,
                    crouch: M.clamp((f - 0.5) / 0.5, 0, 1) * 0.45,
                    walk: 0, sniff: 1 - f
                });
                p.gaitSpeed = 0;
                if (e.t >= e.pcd) this._reachPCD(false);
                else if (e.t >= CUTOFF) this._reachPCD(true);
            } else if (this.phase === 'pcd') {
                p.set({ dyspnoea: 1, ataxia: 0.95, crouch: 0.5, walk: 0 });
            } else if (this.phase === 'done') {
                p.set({ dyspnoea: 0, ataxia: 0, crouch: 0.1, sniff: 1 });
                this._wander(p, CH.x + 30, CH.x + CH.w - 30, dt);
            } else if (this.where === 'cage') {
                this._wander(p, CAGE.x + 28, CAGE.x + CAGE.w - 28, dt);
            } else if (this.where === 'chamber') {
                this._wander(p, CH.x + 30, CH.x + CH.w - 30, dt);
            }
            p.update(dt);

            // aerosol mist inside the chamber
            if (this.phase === 'expose' || this.phase === 'pcd') {
                if (Math.random() < dt * 90) {
                    this.mist.push({
                        x: CH.x + CH.w - 26, y: CH.y + 34 + M.rand(-10, 10),
                        vx: M.rand(-56, -18), vy: M.rand(-4, 10),
                        r: M.rand(7, 22), life: M.rand(1.6, 3.4), age: 0
                    });
                }
            }
            for (let i = this.mist.length - 1; i >= 0; i--) {
                const m = this.mist[i];
                m.age += dt;
                if (m.age > m.life) { this.mist.splice(i, 1); continue; }
                m.x += m.vx * dt; m.y += m.vy * dt;
                m.r += 7 * dt;
                if (m.y > CH.floor - 8) m.vy = -Math.abs(m.vy) * 0.3;
            }

            const e2 = this.exp;
            this.hud('r', [
                { k: 'Exposure', v: e2 ? Math.round(e2.t) + ' s' : '—' },
                { k: 'Breathing', v: p.p.dyspnoea > 0.75 ? 'laboured' : (p.p.dyspnoea > 0.35 ? 'rapid' : 'normal'), tone: p.p.dyspnoea > 0.75 ? 'bad' : (p.p.dyspnoea > 0.35 ? 'warn' : '') },
                { k: 'PCD', v: this.lastRun && this.exp && this.exp.done ? (this.lastRun.complete ? 'none' : Math.round(this.lastRun.t) + ' s') : '—' }
            ]);
        }

        _wander(p, lo, hi, dt) {
            const held = this.inject || this.syringeFill > 0 || this.busy || this.drag;
            const spd = 22;
            const moving = !held && Math.abs(this.walkTo - p.x) > 6;
            if (!held && (Math.abs(p.x - this.walkTo) < 6 || Math.random() < dt * 0.05)) this.walkTo = M.rand(lo, hi);
            if (moving) { p.facing = Math.sign(this.walkTo - p.x); p.x += p.facing * spd * dt; }
            p.set({ walk: moving ? 1 : 0 });
            p.gaitSpeed = moving ? spd / 13 : 0;
            p.x = M.clamp(p.x, lo - 6, hi + 6);
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._chamber(ctx, false);
            this._cage(ctx, false);
            if (this.where === 'cage' || this.where === 'carry') this.pig.draw(ctx);
            this._cage(ctx, true);
            if (this.where === 'chamber') this.pig.draw(ctx);
            this._mist(ctx);
            this._chamber(ctx, true);
            this._unit(ctx);
        }

        _cage(ctx, front) {
            const c = CAGE;
            if (!front) {
                G.shadow(ctx, c.x + c.w / 2, c.y + c.h + 2, c.w * 0.6, 9, 0.4);
                ctx.fillStyle = 'rgba(210,225,235,0.16)'; G.rr(ctx, c.x, c.y, c.w, c.h, 7); ctx.fill();
                const bg = ctx.createLinearGradient(0, c.floor - 8, 0, c.y + c.h);
                bg.addColorStop(0, '#dcbc8d'); bg.addColorStop(1, '#a98455');
                ctx.fillStyle = bg; ctx.fillRect(c.x + 3, c.floor - 6, c.w - 6, c.y + c.h - c.floor + 3);
            } else {
                G.glass(ctx, c.x, c.y, c.w, c.h, { r: 7, tint: 'rgba(200,225,240,0.07)' });
                G.text(ctx, 'HOLDING CAGE', c.x + 8, c.y - 8, { size: 9, color: 'rgba(226,232,240,0.7)', weight: 800 });
            }
        }

        _chamber(ctx, front) {
            const c = CH;
            if (!front) {
                G.shadow(ctx, c.x + c.w / 2, c.y + c.h + 4, c.w * 0.55, 10, 0.42);
                ctx.fillStyle = 'rgba(214,230,242,0.13)'; G.rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill();
                const fg = ctx.createLinearGradient(0, c.floor - 10, 0, c.y + c.h);
                fg.addColorStop(0, '#e7edf3'); fg.addColorStop(1, '#b9c5d1');
                ctx.fillStyle = fg; ctx.fillRect(c.x + 3, c.floor - 8, c.w - 6, c.y + c.h - c.floor + 5);
            } else {
                G.glass(ctx, c.x, c.y, c.w, c.h, { r: 8, tint: 'rgba(200,225,240,0.05)' });
                G.metal(ctx, c.x - 6, c.y - 13, c.w + 12, 15, { tone: 'steel', r: 4 });
                for (let i = 0; i < 4; i++) G.screw(ctx, c.x + 24 + i * (c.w / 4), c.y - 6, 2.6);
                G.text(ctx, 'AEROSOL EXPOSURE CHAMBER', c.x + 8, c.y - 21,
                    { size: 9, color: 'rgba(226,232,240,0.78)', weight: 800 });
                // aerosol inlet on the right, exhaust on the left
                G.metal(ctx, c.x + c.w - 4, c.y + 26, 18, 12, { tone: 'dark', r: 3 });
                G.metal(ctx, c.x - 14, c.y + 26, 18, 12, { tone: 'dark', r: 3 });
                if (this.phase === 'expose' || this.phase === 'pcd') {
                    const on = performance.now() % 700 < 420;
                    G.led(ctx, c.x + c.w - 18, c.y + 14, 5, '#ef4444', on);
                    G.text(ctx, 'AEROSOL ON', c.x + c.w - 28, c.y + 18,
                        { size: 8, weight: 800, align: 'right', color: '#fca5a5' });
                }
            }
        }

        _mist(ctx) {
            if (!this.mist.length) return;
            ctx.save();
            ctx.beginPath(); ctx.rect(CH.x + 3, CH.y + 3, CH.w - 6, CH.h - 6); ctx.clip();
            this.mist.forEach(m => {
                const k = 1 - m.age / m.life;
                const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
                g.addColorStop(0, `rgba(236,248,255,${0.3 * k})`);
                g.addColorStop(1, 'rgba(236,248,255,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fill();
            });
            ctx.restore();
        }

        _unit(ctx) {
            const u = UNIT, e = this.exp;
            G.shadow(ctx, u.x + u.w / 2, u.y + u.h + 2, u.w * 0.55, 10, 0.5);
            const g = ctx.createLinearGradient(0, u.y, 0, u.y + u.h);
            g.addColorStop(0, '#e8edf2'); g.addColorStop(0.1, '#cfd8e1'); g.addColorStop(1, '#8b97a4');
            ctx.fillStyle = g; G.rr(ctx, u.x, u.y, u.w, u.h, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            G.text(ctx, 'NEBULISER · EXPOSURE TIMER', u.x + 22, u.y + 26, { size: 11, weight: 800, color: '#1e293b' });
            G.text(ctx, '0.2% HISTAMINE DIHYDROCHLORIDE', u.x + 22, u.y + 40, { size: 8, weight: 700, color: '#64748b' });
            G.metal(ctx, u.x + 18, u.y + 50, u.w - 36, u.h - 70, { r: 8, tone: 'dark' });

            G.lcd(ctx, u.x + 32, u.y + 62, 140, 48, e ? Math.round(e.t) + ' s' : '0 s',
                { label: 'EXPOSURE', color: '#34f5c5' });
            const lr = this.lastRun;
            G.lcd(ctx, u.x + 184, u.y + 62, 140, 48,
                lr ? (lr.complete ? 'NONE' : Math.round(lr.t) + ' s') : '----',
                { label: 'PCD TIME', color: lr && !lr.complete ? '#fb7185' : '#4ade80' });

            // nebuliser jar with fluid
            G.glass(ctx, u.x + 40, u.y + 126, 54, 56, { r: 5 });
            ctx.fillStyle = 'rgba(186,230,253,0.55)';
            G.rr(ctx, u.x + 43, u.y + 150, 48, 29, 3); ctx.fill();
            G.text(ctx, 'HISTAMINE', u.x + 67, u.y + 192, { size: 7.5, align: 'center', weight: 800, color: '#cbd5e1' });
            G.knob(ctx, u.x + 140, u.y + 152, 16, (this.phase === 'expose' || this.phase === 'pcd') ? 0.9 : -1.1);
            G.text(ctx, 'FLOW', u.x + 140, u.y + 176, { size: 8, align: 'center', weight: 700, color: '#94a3b8' });
            G.led(ctx, u.x + 196, u.y + 146, 6, '#22c55e', true);
            G.text(ctx, 'POWER', u.x + 208, u.y + 150, { size: 8, color: '#cbd5e1', weight: 700 });
            G.led(ctx, u.x + 196, u.y + 166, 6, '#ef4444', this.phase === 'expose' || this.phase === 'pcd');
            G.text(ctx, 'NEBULISING', u.x + 208, u.y + 170, { size: 8, color: '#cbd5e1', weight: 700 });

            // tubing to the chamber inlet
            ctx.save();
            ctx.strokeStyle = 'rgba(148,163,184,0.85)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(u.x + 67, u.y + 126);
            ctx.bezierCurveTo(u.x + 20, u.y + 80, CH.x + CH.w + 60, CH.y - 10, CH.x + CH.w + 12, CH.y + 32);
            ctx.stroke();
            ctx.restore();

            if (e) {
                const bx = u.x + 32, by = u.y + 196, bw = u.w - 64;
                ctx.fillStyle = 'rgba(15,23,42,0.6)'; G.rr(ctx, bx, by, bw, 7, 3.5); ctx.fill();
                ctx.fillStyle = e.t / CUTOFF > 0.95 ? '#4ade80' : '#fb7185';
                G.rr(ctx, bx, by, bw * M.clamp(e.t / CUTOFF, 0, 1), 7, 3.5); ctx.fill();
            }
        }
    }

    LAB.register(4, HistamineChamber);
})();
