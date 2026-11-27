/**
 * EXP 9 — Anticonvulsant activity: subcutaneous pentylenetetrazol (PTZ) seizures
 *
 * The companion test to exp 7 (MES), and the contrast between them is the point.
 * PTZ 80 mg/kg s.c. blocks GABA-A chloride channels and produces, after a latent
 * period, repeated CLONIC convulsions. The end-points are the latency to the
 * first clonic seizure and whether any seizure occurs within 30 min.
 *
 *   MES  models generalised tonic-clonic / partial seizures → phenytoin works
 *   PTZ  models absence (petit mal) and myoclonic seizures  → ethosuximide works,
 *                                                             PHENYTOIN FAILS
 *
 * Phenytoin is in the panel precisely so the student sees it fail here after
 * seeing it abolish the tonic extensor phase in exp 7.
 */
(function () {
    const { M, G, Rodent } = LAB;

    const CAGE = { x: 24, y: 262, w: 190, h: 146, floor: 398 };
    const OBS = { x: 246, y: 206, w: 300, h: 200, floor: 400 };
    const UNIT = { x: 586, y: 172, w: 348, h: 238 };
    const OBS_MIN = 30;                      // observation period (min)
    const OBS_SEC = OBS_MIN * 60;

    class PTZ extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 412, seed: 4 },
                tray: { x: 40, y: 520 },
                steps: [
                    'Select a group, draw up the dose and inject the mouse <b>i.p.</b> in its holding cage.',
                    'Allow <b>30 min</b> pre-treatment time for the drug to reach the brain.',
                    'Transfer the mouse to the <b>observation chamber</b>.',
                    'Inject <b>pentylenetetrazol 80 mg/kg s.c.</b> into the loose skin of the neck and start the clock.',
                    'Observe for <b>30 min</b>: record the <b>latency to the first clonic convulsion</b> and count the episodes.',
                    'Absence of any clonic seizure within 30 min = <b>protection</b>. Compare with the MES result for the same drug.'
                ],
                treatments: [
                    { id: 'saline', name: 'Normal saline 10 mL/kg i.p.', short: 'Control', cls: 'Vehicle control', color: '#64748b', pProt: 0.02, lat: 95, nSeiz: 6, sev: 0.75, sed: 0 },
                    { id: 'diazepam', name: 'Diazepam 2 mg/kg i.p.', short: 'Diazepam', cls: 'BZD — GABA-A positive modulator', color: '#0d9488', pProt: 0.9, lat: 520, nSeiz: 1, sev: 0.15, sed: 0.5 },
                    { id: 'pheno', name: 'Phenobarbitone 30 mg/kg i.p.', short: 'Phenobarb', cls: 'Barbiturate, GABA-A', color: '#6366f1', pProt: 0.75, lat: 380, nSeiz: 2, sev: 0.25, sed: 0.45 },
                    { id: 'ethosux', name: 'Ethosuximide 150 mg/kg i.p.', short: 'Ethosux', cls: 'T-type Ca²⁺ channel blocker', color: '#16a34a', pProt: 0.7, lat: 340, nSeiz: 2, sev: 0.3, sed: 0.1 },
                    { id: 'valproate', name: 'Sodium valproate 200 mg/kg i.p.', short: 'Valproate', cls: 'Broad-spectrum', color: '#7c3aed', pProt: 0.8, lat: 430, nSeiz: 1, sev: 0.2, sed: 0.2 },
                    { id: 'phenytoin', name: 'Phenytoin sodium 25 mg/kg i.p.', short: 'Phenytoin', cls: 'Na⁺-channel blocker — fails in PTZ', color: '#dc2626', pProt: 0.1, lat: 120, nSeiz: 5, sev: 0.7, sed: 0.12 }
                ],
                table: ['Group', 'Latency (s)', 'Episodes', 'Tonic ext.', 'Result'],
                chart: true, chartTitle: 'Mean latency to first clonic seizure',
                chartEmpty: { xMin: 0.4, xMax: 6.6, yMin: 0, yMax: 1900, xTicks: [1, 2, 3, 4, 5, 6], xLabel: 'Group', yLabel: 'Latency (s)', series: [] },
                viva: [
                    {
                        q: 'The s.c. pentylenetetrazol test predicts clinical efficacy against:',
                        opts: ['Generalised tonic-clonic and partial seizures', 'Absence (petit mal) and myoclonic seizures', 'Febrile convulsions only', 'Status epilepticus only'],
                        ans: 1,
                        exp: 'PTZ models absence and myoclonic seizures. MES models generalised tonic-clonic and partial seizures — the two tests are complementary screens, which is why a new drug is run through both.'
                    },
                    {
                        q: 'Why does phenytoin abolish the MES response but fail against PTZ?',
                        opts: ['It is destroyed by PTZ', 'It blocks Na⁺ channels and so prevents the high-frequency firing of tonic-clonic seizures, but does not raise the threshold for the GABA-mediated absence-type seizure PTZ produces', 'The dose is too small', 'Phenytoin is only active orally'],
                        ans: 1,
                        exp: 'Mechanism dictates spectrum. Use-dependent Na⁺ channel block stops seizure spread but not the thalamocortical mechanism underlying absence seizures — clinically, phenytoin can even worsen absence seizures.'
                    },
                    {
                        q: 'How does pentylenetetrazol produce convulsions?',
                        opts: ['By blocking Na⁺ channels', 'By antagonising GABA-A mediated chloride conductance, reducing inhibition', 'By stimulating NMDA receptors directly', 'By releasing adrenaline'],
                        ans: 1,
                        exp: 'PTZ acts at the picrotoxin site of the GABA-A receptor complex, reducing chloride influx. Loss of inhibition is what makes the brain seize, which is why GABA-enhancing drugs are so effective here.'
                    },
                    {
                        q: 'Ethosuximide protects against PTZ seizures by:',
                        opts: ['Enhancing GABA release', 'Blocking T-type calcium channels in thalamic neurones', 'Blocking Na⁺ channels', 'Antagonising glutamate'],
                        ans: 1,
                        exp: 'T-type Ca²⁺ currents drive the thalamocortical oscillation that generates absence seizures — which is why ethosuximide is effective in absence epilepsy and in this test, but useless in MES.'
                    },
                    {
                        q: 'The accepted end-point of the s.c. PTZ test is:',
                        opts: ['Death of the animal', 'Absence of a clonic convulsion lasting at least 5 s during a 30 min observation', 'Loss of righting reflex', 'Tonic hind-limb extension'],
                        ans: 1,
                        exp: 'Protection is defined as failure to show a clonic spasm of at least about five seconds within 30 min of the convulsant dose. Latency to that first clonic episode grades partial protection.'
                    },
                    {
                        q: 'Why is the dose of PTZ chosen as the CD₉₇ rather than a much larger one?',
                        opts: ['To save drug', 'A dose convulsing nearly all untreated animals keeps the test sensitive; a much larger dose would overwhelm any protection and lose discrimination', 'To avoid pain', 'To shorten the experiment'],
                        ans: 1,
                        exp: 'The convulsant dose is set just high enough to convulse almost every control animal. Going higher would mask genuinely active drugs and make the screen falsely negative.'
                    }
                ],
                inferenceHint: 'Run a control animal first to establish the latency, then test the drugs — especially phenytoin.'
            };
        }

        setup() {
            this.results = {};
            this.mouseNo = 0;
            this.ptzDose = 80;
            this.controls(`
                <div class="lab2-card-h"><span>Convulsant dose</span></div>
                <div class="lab2-field">
                    <label><span>Pentylenetetrazol</span><b id="ptz-mg">80 mg/kg</b></label>
                    <input type="range" id="ptz-dose" min="40" max="110" step="5" value="80">
                </div>
                <p style="font-size:.72rem;color:#64748b;margin-top:8px">80 mg/kg s.c. is the CD₉ₗ in mice — it convulses almost every untreated animal. Below about 50 mg/kg the dose becomes sub-convulsive and even control animals may not seize, which invalidates the test.</p>`);
            this.ctrl.querySelector('#ptz-dose').oninput = e => {
                this.ptzDose = +e.target.value;
                this.ctrl.querySelector('#ptz-mg').textContent = this.ptzDose + ' mg/kg';
            };
            this.hotspots = [
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Holding cage' },
                { x: OBS.x, y: OBS.y, w: OBS.w, h: OBS.h, label: 'Observation chamber' },
                { x: UNIT.x, y: UNIT.y, w: UNIT.w, h: UNIT.h, label: 'Seizure timer / event recorder' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.mouseNo++;
            this.mouse = new Rodent({ x: CAGE.x + 94, y: CAGE.floor, scale: 1.25, facing: 1 });
            this.mouse.groundY = CAGE.floor;
            this.where = 'cage';
            this.walkTo = CAGE.x + 94;
            this.phase = 'treat';
            this.injected = null;
            this.drugMin = null;
            this.obs = null;
            this.episode = null;
            this.setStep(0);
            this._refresh();
        }

        _refresh() {
            const busy = this.busy, ph = this.phase;
            if (ph === 'treat') {
                this.status(`Select a group and give <b>${this.tr.name}</b> i.p.`);
                this.actions([{ label: '💉 Load & inject', primary: true, disabled: busy, onClick: () => this.autoInject() }]);
            } else if (ph === 'absorb') {
                this.status(`<b>${this.injected.name}</b> given. Allow 30 min pre-treatment time.`);
                this.actions([{ label: '⏩ Wait 30 min', primary: true, disabled: busy, onClick: () => this.wait() }]);
            } else if (ph === 'place') {
                this.status('Transfer the mouse to the <b>observation chamber</b>.');
                this.actions([{ label: '🐭 Place in chamber', primary: true, disabled: busy, onClick: () => this.place() }]);
            } else if (ph === 'ptz') {
                this.status(`Mouse in the chamber. Inject <b>PTZ ${this.ptzDose} mg/kg s.c.</b> and start the clock.`);
                this.actions([{ label: `💉 Inject PTZ ${this.ptzDose} mg/kg s.c.`, primary: true, danger: true, disabled: busy, onClick: () => this.autoInject() }]);
            } else if (ph === 'observe') {
                const o = this.obs;
                this.status(this.episode
                    ? `<b style="color:#be123c">Clonic convulsion in progress</b> — episode ${o.count}.`
                    : (o.latency !== null
                        ? `Observing — first clonic seizure at <b>${o.latency.toFixed(0)} s</b>; ${o.count} episode${o.count > 1 ? 's' : ''} so far.`
                        : 'Observing for a clonic convulsion…'));
                this.actions([{ label: '⏩ Skip to end of observation', always: true, onClick: () => { o.skip = true; } }]);
            } else if (ph === 'done') {
                this.status('Observation complete. Use a <b>fresh mouse</b> for the next group.');
                this.actions([{ label: '↺ Next mouse', primary: true, disabled: busy, onClick: () => this.resetAnimal() }]);
            }
        }

        onSelect() { if (this.phase === 'treat') this._refresh(); }

        getInjectZone() {
            const m = this.mouse;
            if (this.phase === 'treat' && this.where === 'cage') {
                return { x: m.x - 4 * m.facing, y: m.y - 18, r: 26, label: 'Abdomen (i.p.)', angle: Math.PI / 2 - 0.35 };
            }
            if (this.phase === 'ptz' && this.where === 'obs') {
                return { x: m.x + 14 * m.facing, y: m.y - 46, r: 24, label: 'Scruff (s.c.)', angle: Math.PI / 2 - 0.9 };
            }
            return null;
        }

        onInjected(tr) {
            if (this.phase === 'ptz') return this._startObs();
            this.injected = tr;
            this.drugMin = 0;
            this.floatText(this.mouse.x, this.mouse.y - 52, `${tr.short} i.p.`, '#fde68a');
            this.phase = 'absorb';
            this.setStep(1);
            setTimeout(() => this._refresh(), 900);
        }

        wait() {
            const gen = this.gen;
            this.timeLapse(30, 3.5, {
                label: 'Pre-treatment',
                onTick: (s, p) => { if (gen === this.gen) this.drugMin = 30 * p; },
                onDone: () => { if (gen !== this.gen) return; this.phase = 'place'; this.setStep(2); this._refresh(); }
            });
            this._refresh();
        }

        place() {
            if (this.busy) return;
            if (!this.injected) return this.toast('Give the treatment before the convulsant.', 'warn');
            this.busy = true;
            const gen = this.gen, ok = () => gen === this.gen;
            const m = this.mouse, sx = m.x, sy = m.y;
            const tx = OBS.x + OBS.w * 0.45;
            this.where = 'carry';
            m.set({ walk: 0 }); m.gaitSpeed = 0; m.groundY = null;
            this.tw.add(0.35, e => { m.rot = M.lerp(0, -Math.PI / 2 * m.facing, e); m.y = sy - 36 * e; }, {
                onDone: () => this.tw.add(0.85, e => {
                    m.x = M.lerp(sx, tx, e);
                    m.y = M.lerp(sy - 36, OBS.floor - 70, e) - Math.sin(e * Math.PI) * 52;
                }, {
                    onDone: () => this.tw.add(0.35, e => { m.y = M.lerp(OBS.floor - 70, OBS.floor, e); m.rot = M.lerp(-Math.PI / 2 * m.facing, 0, e); }, {
                        onDone: () => {
                            if (!ok()) return;
                            m.groundY = OBS.floor; m.rot = 0;
                            this.where = 'obs'; this.walkTo = tx;
                            this.busy = false; this.phase = 'ptz'; this.setStep(3); this._refresh();
                        }
                    })
                })
            });
            this._refresh();
        }

        /* ---------- the convulsant & observation ---------- */
        _startObs() {
            const d = this.injected;
            // sub-convulsive doses let even controls escape
            const potency = M.clamp((this.ptzDose - 45) / 35, 0, 1.25);
            const pProt = 1 - (1 - d.pProt) * M.clamp(potency, 0, 1);
            const protect = Math.random() < pProt;
            const sc = M.clamp(M.gauss(1, 0.18), 0.6, 1.7);
            const latency = M.clamp(d.lat * sc / Math.max(0.5, potency), 40, OBS_SEC);

            const events = [];
            if (!protect && latency < OBS_SEC) {
                const n = Math.max(1, Math.round(d.nSeiz * M.clamp(potency, 0.4, 1.4) * M.rand(0.7, 1.3)));
                let t = latency;
                for (let i = 0; i < n && t < OBS_SEC - 20; i++) {
                    events.push(t);
                    t += M.rand(110, 260) / M.clamp(potency, 0.5, 1.3);
                }
            }
            this.obs = {
                sec: 0, events, idx: 0, count: 0, latency: null,
                protect, tonicSeen: false, skip: false,
                severity: d.sev * M.clamp(potency, 0.3, 1.3)
            };
            this.floatText(this.mouse.x, this.mouse.y - 56, `PTZ ${this.ptzDose} mg/kg s.c.`, '#fca5a5');
            this.phase = 'observe';
            this.setStep(4);
            this.busy = false;
            this.toast(`PTZ given. Observing for ${OBS_MIN} min.`, 'info');
            this._refresh();
        }

        _finishObs() {
            const o = this.obs, g = this.injected;
            if (!o || !g) return;
            const r = (this.results[g.id] = this.results[g.id] || []);
            const protectedNow = o.latency === null;
            r.push({ latency: protectedNow ? OBS_SEC : o.latency, count: o.count, tonic: o.tonicSeen, protect: protectedNow });
            this.addRow([
                `<b>${g.short}</b> · M${this.mouseNo}`,
                protectedNow ? `<b style="color:#0f766e">&gt;${OBS_SEC}</b>` : `<b>${o.latency.toFixed(0)}</b>`,
                String(o.count),
                o.tonicSeen ? '<b style="color:#be123c">Yes</b>' : 'No',
                protectedNow ? '<span style="color:#15803d">Protected</span>' : '<span style="color:#be123c">Not protected</span>'
            ], protectedNow ? 'up' : '');
            this.toast(protectedNow
                ? `No clonic seizure in ${OBS_MIN} min — animal <b>protected</b>.`
                : `First clonic seizure at <b>${o.latency.toFixed(0)} s</b> — not protected.`,
                protectedNow ? 'success' : 'info', 3400);
            this.markDone(g.id);
            this.phase = 'done';
            this.setStep(5);
            this.episode = null;
            this._refresh();
            this._chart();
            this._infer();
        }

        _chart() {
            const trs = this.cfg.treatments, pts = [];
            trs.forEach((t, i) => {
                const r = this.results[t.id];
                if (!r) return;
                pts.push([i + 1, M.mean(r.map(x => x.latency)), r.length > 1 ? M.sem(r.map(x => x.latency)) : 0]);
            });
            this.chart.draw(Object.assign({}, this.cfg.chartEmpty, {
                xFmt: v => (trs[v - 1] ? trs[v - 1].short : ''),
                series: [{ name: 'Mean latency (s)', color: '#0d9488', type: 'bar', points: pts, barWidth: 0.5, labels: true }],
                annotations: [{ y: OBS_SEC, text: 'no seizure in 30 min', color: '#15803d' }]
            }));
        }

        _infer() {
            const R = this.results;
            const pct = id => { const r = R[id]; return r.filter(x => x.protect).length / r.length * 100; };
            let html = this.cfg.treatments.filter(t => R[t.id]).map(t => {
                const r = R[t.id];
                return `<div class="kv"><span>${t.short} (n=${r.length}) latency / protection</span><span>${M.mean(r.map(x => x.latency)).toFixed(0)} s / ${pct(t.id).toFixed(0)}%</span></div>`;
            }).join('');
            const n = [];
            if (R.saline) {
                const base = M.mean(R.saline.map(x => x.latency));
                ['diazepam', 'pheno', 'ethosux', 'valproate', 'phenytoin'].forEach(id => {
                    if (!R[id]) return;
                    const name = this.cfg.treatments.find(t => t.id === id).short;
                    const fold = base > 0 ? M.mean(R[id].map(x => x.latency)) / base : 1;
                    n.push(`${name}: ${pct(id).toFixed(0)}% protection, latency ×${fold.toFixed(1)}.`);
                });
                if (R.phenytoin) {
                    n.push('<b>Phenytoin fails here</b> despite abolishing the tonic extensor phase in the MES test — Na⁺ channel block stops seizure <i>spread</i> but does not raise the threshold for the GABA-mediated seizure PTZ produces.');
                }
                if (R.ethosux) n.push('Ethosuximide protects against PTZ but is inactive in MES — the mirror image of phenytoin, and the reason both screens are run.');
                if (R.diazepam) n.push('Diazepam is the most effective drug in this model, as expected of a GABA-A positive modulator against a GABA-A antagonist convulsant.');
            } else if (Object.keys(R).length) {
                n.push('Run a <b>control</b> animal to establish the untreated latency.');
            }
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        /* ---------- simulation ---------- */
        update(dt) {
            const m = this.mouse;
            let sed = 0;
            if (this.injected && this.drugMin !== null) {
                sed = (this.injected.sed || 0) * M.clamp(this.drugMin / 25, 0, 1);
            }

            const o = this.obs;
            if (o && this.phase === 'observe') {
                // fast-forward quiet stretches, run convulsions close to real time
                const rate = this.episode ? 1.4 : (o.skip ? 240 : 30);
                o.sec = Math.min(OBS_SEC, o.sec + dt * rate);

                if (!this.episode && o.idx < o.events.length && o.sec >= o.events[o.idx]) {
                    o.idx++;
                    o.count++;
                    const tonic = Math.random() < o.severity * 0.45;
                    this.episode = { t: 0, dur: M.rand(7, 13), tonic };
                    if (o.latency === null) {
                        o.latency = o.events[o.idx - 1];
                        this.floatText(m.x, m.y - 78, `clonus at ${o.latency.toFixed(0)} s`, '#fda4af');
                    } else {
                        this.floatText(m.x, m.y - 78, 'clonus', '#c4b5fd');
                    }
                    if (tonic) o.tonicSeen = true;
                }

                if (this.episode) {
                    const ep = this.episode;
                    ep.t += dt * 1.4;
                    const frac = ep.t / ep.dur;
                    if (ep.tonic && frac > 0.55) {
                        m.set({ clonic: 0, tonic: 1, straub: 1, crouch: 0, hunch: 0, sedation: 0, walk: 0, sniff: 0 });
                    } else {
                        m.set({ clonic: 1, tonic: 0, straub: 0, crouch: 0.3, hunch: 0.2, sedation: 0, walk: 0, sniff: 0 });
                    }
                    m.gaitSpeed = 0;
                    if (ep.t >= ep.dur) {
                        this.episode = null;
                        m.set({ clonic: 0, tonic: 0, straub: 0, sedation: 0.3, crouch: 0.4, hunch: 0.3 });
                    }
                    this._refresh();
                } else {
                    this._wander(m, OBS.x + 26, OBS.x + OBS.w - 26, sed, dt, true);
                }

                if (o.sec >= OBS_SEC) this._finishObs();
            } else if (this.where === 'cage' || this.where === 'obs') {
                const lo = this.where === 'cage' ? CAGE.x + 28 : OBS.x + 26;
                const hi = this.where === 'cage' ? CAGE.x + CAGE.w - 28 : OBS.x + OBS.w - 26;
                this._wander(m, lo, hi, sed, dt, false);
            }
            m.update(dt);

            this.hud('l', [
                { k: 'Mouse', v: '#' + this.mouseNo },
                { k: 'Group', v: this.injected ? this.injected.short : 'untreated' }
            ]);
            this.hud('r', [
                { k: 'PTZ', v: this.ptzDose + ' mg/kg', tone: this.ptzDose < 55 ? 'warn' : '' },
                { k: 'Elapsed', v: o ? LAB.fmtClock(o.sec / 60) : '—' },
                {
                    k: 'Latency',
                    v: o ? (o.latency !== null ? o.latency.toFixed(0) + ' s' : (o.sec >= OBS_SEC ? 'none' : 'watching')) : '—',
                    tone: o && o.latency === null && o.sec >= OBS_SEC ? 'good' : (this.episode ? 'bad' : '')
                }
            ]);
        }

        _wander(m, lo, hi, sed, dt, inObs) {
            const held = this.inject || this.syringeFill > 0 || this.phase === 'done' || this.drag;
            const spd = 26 * (1 - sed * 0.8);
            const moving = !held && Math.abs(this.walkTo - m.x) > 5 && spd > 4;
            if (!held && (Math.abs(m.x - this.walkTo) < 5 || Math.random() < dt * 0.06)) this.walkTo = M.rand(lo, hi);
            if (moving) { m.facing = Math.sign(this.walkTo - m.x); m.x += m.facing * spd * dt; }
            m.set({ walk: moving ? 1 : 0, sedation: sed, ataxia: sed * 0.5, sniff: 1, clonic: 0, tonic: 0 });
            m.gaitSpeed = moving ? spd / 15 : 0;
            m.x = M.clamp(m.x, lo - 8, hi + 8);
            if (inObs) m.groundY = OBS.floor;
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._chamber(ctx, false);
            this._cage(ctx, false);
            if (this.where === 'cage' || this.where === 'carry') this.mouse.draw(ctx);
            this._cage(ctx, true);
            if (this.where === 'obs') this.mouse.draw(ctx);
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
                ctx.fillStyle = 'rgba(120,84,40,0.5)';
                for (let i = 0; i < 40; i++) ctx.fillRect(c.x + 8 + (i * 61) % (c.w - 16), c.floor - 5 + (i * 7) % 9, 5, 1.6);
            } else {
                G.glass(ctx, c.x, c.y, c.w, c.h, { r: 7, tint: 'rgba(200,225,240,0.07)' });
                ctx.strokeStyle = 'rgba(148,163,184,0.85)'; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(c.x - 5, c.y); ctx.lineTo(c.x + c.w + 5, c.y); ctx.stroke();
                G.text(ctx, 'HOLDING CAGE', c.x + 8, c.y - 8, { size: 9, color: 'rgba(226,232,240,0.7)', weight: 800 });
            }
        }

        _chamber(ctx, front) {
            const o = OBS;
            if (!front) {
                G.shadow(ctx, o.x + o.w / 2, o.y + o.h + 4, o.w * 0.55, 10, 0.42);
                ctx.fillStyle = 'rgba(214,230,242,0.14)'; G.rr(ctx, o.x, o.y, o.w, o.h, 8); ctx.fill();
                // sawdust-free white floor for easy observation
                const fg = ctx.createLinearGradient(0, o.floor - 10, 0, o.y + o.h);
                fg.addColorStop(0, '#e7edf3'); fg.addColorStop(1, '#b9c5d1');
                ctx.fillStyle = fg; ctx.fillRect(o.x + 3, o.floor - 8, o.w - 6, o.y + o.h - o.floor + 5);
                // gridlines on the floor for scoring movement
                ctx.strokeStyle = 'rgba(100,116,139,0.28)'; ctx.lineWidth = 1;
                for (let gx = o.x + 40; gx < o.x + o.w - 10; gx += 48) {
                    ctx.beginPath(); ctx.moveTo(gx, o.floor - 6); ctx.lineTo(gx, o.y + o.h - 2); ctx.stroke();
                }
            } else {
                G.glass(ctx, o.x, o.y, o.w, o.h, { r: 8, tint: 'rgba(200,225,240,0.05)' });
                // lid with ventilation holes
                G.metal(ctx, o.x - 6, o.y - 12, o.w + 12, 14, { tone: 'steel', r: 4 });
                ctx.fillStyle = 'rgba(30,41,59,0.45)';
                for (let hx = o.x + 14; hx < o.x + o.w - 8; hx += 22) {
                    ctx.beginPath(); ctx.arc(hx, o.y - 5, 2.4, 0, Math.PI * 2); ctx.fill();
                }
                G.text(ctx, 'OBSERVATION CHAMBER', o.x + 8, o.y - 20, { size: 9, color: 'rgba(226,232,240,0.75)', weight: 800 });
                // live indicator while observing
                if (this.phase === 'observe') {
                    const on = this.episode ? (performance.now() % 500 < 260) : true;
                    G.led(ctx, o.x + o.w - 16, o.y + 14, 5, this.episode ? '#ef4444' : '#22c55e', on);
                    G.text(ctx, this.episode ? 'SEIZURE' : 'OBSERVING', o.x + o.w - 26, o.y + 18,
                        { size: 8, weight: 800, align: 'right', color: this.episode ? '#fca5a5' : '#86efac' });
                }
            }
        }

        _unit(ctx) {
            const u = UNIT, o = this.obs;
            G.shadow(ctx, u.x + u.w / 2, u.y + u.h + 2, u.w * 0.55, 10, 0.5);
            const g = ctx.createLinearGradient(0, u.y, 0, u.y + u.h);
            g.addColorStop(0, '#e8edf2'); g.addColorStop(0.1, '#cfd8e1'); g.addColorStop(1, '#8b97a4');
            ctx.fillStyle = g; G.rr(ctx, u.x, u.y, u.w, u.h, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            [[u.x + 10, u.y + 10], [u.x + u.w - 10, u.y + 10], [u.x + 10, u.y + u.h - 10], [u.x + u.w - 10, u.y + u.h - 10]]
                .forEach(([x, y]) => G.screw(ctx, x, y, 3.5));
            G.text(ctx, 'SEIZURE EVENT RECORDER', u.x + 22, u.y + 26, { size: 11, weight: 800, color: '#1e293b' });
            G.text(ctx, 's.c. PENTYLENETETRAZOL TEST', u.x + 22, u.y + 40, { size: 8, weight: 700, color: '#64748b' });
            G.metal(ctx, u.x + 18, u.y + 50, u.w - 36, u.h - 70, { r: 8, tone: 'dark' });

            const lat = o && o.latency !== null ? o.latency : null;
            G.lcd(ctx, u.x + 32, u.y + 62, 134, 48,
                o ? LAB.fmtClock(o.sec / 60) : '—',
                { label: 'ELAPSED', color: '#34f5c5' });
            G.lcd(ctx, u.x + 178, u.y + 62, 134, 48,
                o ? String(o.count) : '0',
                { label: 'EPISODES', color: this.episode ? '#fb7185' : '#34f5c5' });
            G.lcd(ctx, u.x + 32, u.y + 124, 280, 48,
                lat !== null ? lat.toFixed(0).padStart(4, '0') + ' s' : (o && o.sec >= OBS_SEC ? 'NO SEIZURE' : '----'),
                { label: 'LATENCY TO FIRST CLONIC SEIZURE', color: lat !== null ? '#fb7185' : (o && o.sec >= OBS_SEC ? '#4ade80' : '#34f5c5') });

            G.led(ctx, u.x + 44, u.y + 196, 6, '#22c55e', true);
            G.text(ctx, 'POWER', u.x + 56, u.y + 200, { size: 8, color: '#cbd5e1', weight: 700 });
            G.led(ctx, u.x + 128, u.y + 196, 6, '#f59e0b', this.phase === 'observe');
            G.text(ctx, 'RUNNING', u.x + 140, u.y + 200, { size: 8, color: '#cbd5e1', weight: 700 });
            G.led(ctx, u.x + 222, u.y + 196, 6, '#ef4444', !!this.episode);
            G.text(ctx, 'EVENT', u.x + 234, u.y + 200, { size: 8, color: '#cbd5e1', weight: 700 });

            // progress bar for the 30 min observation
            if (o) {
                const bx = u.x + 32, by = u.y + 214, bw = u.w - 64;
                ctx.fillStyle = 'rgba(15,23,42,0.6)'; G.rr(ctx, bx, by, bw, 7, 3.5); ctx.fill();
                ctx.fillStyle = '#34f5c5'; G.rr(ctx, bx, by, bw * (o.sec / OBS_SEC), 7, 3.5); ctx.fill();
                o.events.forEach(t => {
                    if (t > o.sec) return;
                    ctx.fillStyle = '#fb7185';
                    ctx.fillRect(bx + bw * (t / OBS_SEC) - 1, by - 3, 2, 13);
                });
            }
        }
    }

    LAB.register(9, PTZ);
})();
