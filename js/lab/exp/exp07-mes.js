/**
 * EXP 7 — Anticonvulsant activity: Maximal Electroshock Seizure (MES), mouse
 * 150 mA / 0.2 s through moistened corneal electrodes produces the classical sequence
 *   tonic flexion → TONIC HIND-LIMB EXTENSION → clonus → stupor → recovery
 * Abolition of the tonic hind-limb extensor phase (THLE) = protection.
 * Phenytoin and phenobarbitone abolish THLE (generalised tonic-clonic / partial seizures);
 * diazepam is only partly effective in this model.
 */
(function () {
    const { M, G, Rodent } = LAB;
    const CAGE = { x: 24, y: 268, w: 196, h: 140, floor: 398 };
    const PLAT = { x: 268, y: 392, w: 300 };          // padded platform surface
    const UNIT = { x: 606, y: 168, w: 330, h: 244 };
    const ELEC_HOME = { x: 300, y: 462 };
    const TL = { x: 258, y: 60, w: 330 };             // phase timeline
    const PHASES = [
        { id: 'flex', name: 'Tonic flexion', color: '#f59e0b' },
        { id: 'ext', name: 'Tonic extension (THLE)', color: '#e11d48' },
        { id: 'clon', name: 'Clonus', color: '#8b5cf6' },
        { id: 'stup', name: 'Stupor', color: '#64748b' }
    ];

    class MES extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 412 },
                tray: { x: 40, y: 520 },
                steps: [
                    'Select a group, draw up the dose and inject the mouse <b>i.p.</b> in its cage.',
                    'Wait for the drug to act (<b>30 min</b> — phenytoin needs its full pre-treatment time).',
                    'Place the mouse on the padded platform.',
                    'Moisten the <b>corneal electrodes</b> with normal saline, then drag them onto the eyes.',
                    'Deliver <b>150 mA for 0.2 s</b> and time each phase of the seizure.',
                    'Abolition of the <b>tonic hind-limb extension</b> = protection. Calculate % protection.'
                ],
                treatments: [
                    { id: 'saline', name: 'Normal saline 10 mL/kg i.p.', short: 'Control', cls: 'Vehicle control', color: '#64748b', pProt: 0.02, ext: 11.5, flex: 2.6, clon: 12, stup: 95 },
                    { id: 'phenytoin', name: 'Phenytoin sodium 25 mg/kg i.p.', short: 'Phenytoin', cls: 'Na⁺-channel blocker', color: '#0d9488', pProt: 0.9, ext: 2.6, flex: 2.0, clon: 8, stup: 70 },
                    { id: 'pheno', name: 'Phenobarbitone 30 mg/kg i.p.', short: 'Phenobarb', cls: 'Barbiturate, GABA-A', color: '#6366f1', pProt: 0.75, ext: 4.0, flex: 2.1, clon: 7, stup: 135 },
                    { id: 'diazepam', name: 'Diazepam 4 mg/kg i.p.', short: 'Diazepam', cls: 'BZD — weak in MES', color: '#d97706', pProt: 0.3, ext: 6.5, flex: 2.3, clon: 9, stup: 110 }
                ],
                table: ['Group', 'Flexion (s)', 'THLE (s)', 'Clonus (s)', 'Result'],
                chart: true, chartTitle: 'Mean THLE duration & protection',
                chartEmpty: { xMin: 0.4, xMax: 4.6, yMin: 0, yMax: 16, xTicks: [1, 2, 3, 4], xLabel: 'Group', yLabel: 'THLE (s)', series: [] },
                viva: [
                    { q: 'The end-point of the MES test is:', opts: ['Death of the animal', 'Abolition of the tonic hind-limb extensor phase', 'Loss of righting reflex', 'Onset of clonus'], ans: 1, exp: 'Abolition of the tonic hind-limb extension (THLE) is the criterion of protection; its duration is also reduced by partly effective drugs.' },
                    { q: 'The MES test in rodents predicts clinical efficacy against:', opts: ['Absence (petit mal) seizures', 'Generalised tonic-clonic and partial seizures', 'Febrile convulsions only', 'Myoclonic jerks only'], ans: 1, exp: 'MES models generalised tonic-clonic (grand mal) and partial seizures; the s.c. PTZ test models absence (petit mal) seizures.' },
                    { q: 'Standard electrical stimulus for MES in mice is about:', opts: ['15 mA for 2 s', '50 mA for 1 s', '150 mA for 0.2 s', '500 mA for 0.5 s'], ans: 2, exp: 'A supramaximal stimulus of 150 mA (50 Hz) for 0.2 s via corneal electrodes (or 60 mA in rats via ear electrodes) gives a maximal seizure in all normal animals.' },
                    { q: 'Why are the corneal electrodes moistened with saline?', opts: ['To anaesthetise the eye', 'To ensure good electrical contact and avoid corneal burns', 'To dilate the pupil', 'To sterilise them'], ans: 1, exp: 'Saline (or a drop of local anaesthetic) lowers contact resistance, giving a reproducible current and preventing corneal injury.' },
                    { q: 'Phenytoin abolishes THLE mainly by:', opts: ['Enhancing GABA-A chloride currents', 'Blocking T-type Ca²⁺ channels', 'Use-dependent block of voltage-gated Na⁺ channels', 'Blocking NMDA receptors'], ans: 2, exp: 'Phenytoin produces use- and voltage-dependent block of Na⁺ channels, prolonging inactivation and preventing the high-frequency repetitive firing that sustains seizure spread.' },
                    { q: 'The correct order of the maximal seizure is:', opts: ['Clonus → flexion → extension → stupor', 'Tonic flexion → tonic extension → clonus → stupor', 'Extension → flexion → stupor → clonus', 'Stupor → clonus → extension'], ans: 1, exp: 'A brief tonic flexion is followed by tonic hind-limb extension, then clonic convulsions, then a period of stupor before recovery.' }
                ],
                inferenceHint: 'Shock a control animal first to see a full tonic extensor phase, then test the drugs.'
            };
        }

        setup() {
            this.results = {};
            this.mouseNo = 0;
            this.controls(`
                <div class="lab2-card-h"><span>Stimulus settings</span></div>
                <div class="lab2-field">
                    <label><span>Current</span><b id="mes-ma">150 mA</b></label>
                    <input type="range" id="mes-cur" min="40" max="200" step="5" value="150">
                </div>
                <div class="lab2-seg" id="mes-dur">
                    <button data-d="0.1">0.1 s</button><button data-d="0.2" class="active">0.2 s</button><button data-d="0.3">0.3 s</button>
                </div>
                <p style="font-size:.72rem;color:#64748b;margin-top:8px">150 mA, 50 Hz for 0.2 s is supramaximal in mice — every unprotected animal shows tonic extension. Below ~70 mA the stimulus becomes sub-maximal.</p>`);
            this.current = 150; this.durSec = 0.2;
            this.ctrl.querySelector('#mes-cur').oninput = e => {
                this.current = +e.target.value;
                this.ctrl.querySelector('#mes-ma').textContent = this.current + ' mA';
            };
            this.ctrl.querySelectorAll('#mes-dur button').forEach(b => b.onclick = () => {
                this.durSec = +b.dataset.d;
                this.ctrl.querySelectorAll('#mes-dur button').forEach(x => x.classList.toggle('active', x === b));
            });
            this.hotspots = [
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Holding cage' },
                { x: PLAT.x, y: PLAT.y - 16, w: PLAT.w, h: 26, label: 'Padded observation platform' },
                { x: UNIT.x, y: UNIT.y, w: UNIT.w, h: UNIT.h, label: 'Electroconvulsiometer — constant-current stimulator' },
                { x: ELEC_HOME.x - 44, y: ELEC_HOME.y - 26, w: 100, h: 52, label: 'Corneal electrodes on their lead' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            // callbacks from animations started for the previous animal check this and bail out
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.mouseNo++;
            this.mouse = new Rodent({ x: CAGE.x + 96, y: CAGE.floor, scale: 1.3, facing: 1 });
            this.mouse.groundY = CAGE.floor;
            this.where = 'cage';
            this.walkTo = CAGE.x + 96;
            this.phase = 'treat';
            this.injected = null;
            this.drugMin = null;
            this.moist = false;
            this.elec = { x: ELEC_HOME.x, y: ELEC_HOME.y, on: false, attached: false };
            this.seiz = null;
            this.flash = 0;
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
                this.status('Transfer the mouse to the <b>padded platform</b>.');
                this.actions([{ label: '🐭 Place on platform', primary: true, disabled: busy, onClick: () => this.place() }]);
            } else if (ph === 'prep') {
                this.status(this.moist
                    ? 'Electrodes moistened. Drag them onto the mouse’s <b>eyes</b> (corneal contact).'
                    : 'Moisten the corneal electrodes with <b>normal saline</b> before applying them.');
                this.actions([
                    { label: '💧 Moisten with saline', disabled: busy || this.moist, onClick: () => this.moisten() },
                    { label: '🔌 Apply electrodes', primary: true, disabled: busy || !this.moist, onClick: () => this.attach() }
                ]);
            } else if (ph === 'ready') {
                this.status(`Electrodes in place. Deliver <b>${this.current} mA for ${this.durSec} s</b>.`);
                this.actions([{ label: `⚡ Deliver shock (${this.current} mA)`, primary: true, danger: true, disabled: busy, onClick: () => this.shock() }]);
            } else if (ph === 'seizure') {
                const s = this.seiz;
                this.status(`<b>${PHASES.find(p => p.id === s.cur) ? PHASES.find(p => p.id === s.cur).name : 'Recovery'}</b> — timing the response…`);
                this.actions(s.cur === 'stup' ? [{ label: '⏩ Fast-forward recovery', always: true, onClick: () => { s.fast = true; } }] : []);
            } else if (ph === 'done') {
                this.status('Recovered. Use a <b>fresh mouse</b> for the next group.');
                this.actions([{ label: '↺ Next mouse', primary: true, disabled: busy, onClick: () => this.resetAnimal() }]);
            }
        }

        onSelect() { if (this.phase === 'treat') this._refresh(); }

        getInjectZone() {
            if (this.phase !== 'treat' || this.where !== 'cage') return null;
            const m = this.mouse;
            return { x: m.x - 4 * m.facing, y: m.y - 18, r: 26, label: 'Abdomen (i.p.)', angle: Math.PI / 2 - 0.35 };
        }

        onInjected(tr) {
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
            if (!this.injected) { this.toast('Give the treatment before shocking the animal.', 'warn'); return; }
            this.busy = true;
            const gen = this.gen, ok = () => gen === this.gen;
            const m = this.mouse, sx = m.x, sy = m.y;
            const tx = PLAT.x + PLAT.w * 0.45;
            this.where = 'carry';
            m.set({ walk: 0 }); m.gaitSpeed = 0; m.groundY = null;
            this.tw.add(0.35, e => { m.rot = M.lerp(0, -Math.PI / 2 * m.facing, e); m.y = sy - 36 * e; }, {
                onDone: () => this.tw.add(0.85, e => {
                    m.x = M.lerp(sx, tx, e); m.y = M.lerp(sy - 36, PLAT.y - 70, e) - Math.sin(e * Math.PI) * 48;
                }, {
                    onDone: () => this.tw.add(0.35, e => { m.y = M.lerp(PLAT.y - 70, PLAT.y, e); m.rot = M.lerp(-Math.PI / 2 * m.facing, 0, e); }, {
                        onDone: () => {
                            if (!ok()) return;
                            m.groundY = PLAT.y; m.rot = 0; this.where = 'plat'; this.walkTo = tx;
                            this.busy = false; this.phase = 'prep'; this.setStep(3); this._refresh();
                        }
                    })
                })
            });
            this._refresh();
        }

        moisten() {
            if (this.busy) return;
            this.busy = true;
            const e = this.elec;
            for (let i = 0; i < 16; i++) {
                this.fx.emit({
                    x: e.x + M.rand(-14, 14), y: e.y - 14, vx: M.rand(-8, 8), vy: M.rand(20, 60), ay: 220,
                    r: M.rand(1.6, 3), life: M.rand(0.5, 0.9), color: 'rgba(125,211,252,0.85)', shape: 'drop'
                });
            }
            this.floatText(e.x, e.y - 30, 'saline', '#7dd3fc');
            const gen = this.gen;
            this.tw.wait(0.8, () => { if (gen !== this.gen) return; this.moist = true; this.busy = false; this.toast('Electrodes moistened — good contact, no corneal burn.', 'success'); this._refresh(); });
            this._refresh();
        }

        _eyeZone() {
            const m = this.mouse;
            return { x: m.x + 34 * m.facing, y: m.y - 44, r: 26 };
        }

        attach(fromDrag) {
            if (this.busy && !fromDrag) return;
            if (!this.moist) { this.toast('Moisten the electrodes with saline first.', 'warn'); return; }
            const z = this._eyeZone(), e = this.elec;
            const sx = e.x, sy = e.y;
            const gen = this.gen;
            this.busy = true;
            this.tw.add(fromDrag ? 0.2 : 0.5, t => { e.x = M.lerp(sx, z.x, t); e.y = M.lerp(sy, z.y, t); }, {
                onDone: () => { if (gen !== this.gen) return; e.attached = true; this.busy = false; this.phase = 'ready'; this.setStep(4); this._refresh(); this.toast('Corneal electrodes in contact.', 'info'); }
            });
            this._refresh();
        }

        /* ---------- electrode dragging ---------- */
        _overElec(x, y) { return !this.elec.attached && Math.hypot(x - this.elec.x, y - this.elec.y) < 32; }
        cursorAt(x, y) { return this.phase === 'prep' && this._overElec(x, y); }
        onPointerDown(x, y) {
            if (this.phase === 'prep' && this._overElec(x, y)) this.drag = { kind: 'elec', x, y };
        }
        onPointerUp(x, y) {
            if (!this.drag || this.drag.kind !== 'elec') return;
            const d = this.drag; this.drag = null;
            const z = this._eyeZone();
            this.elec.x = d.x; this.elec.y = d.y;
            if (Math.hypot(d.x - z.x, d.y - z.y) < z.r + 24) {
                if (!this.moist) { this._homeElec(); this.toast('Moisten the electrodes with saline first.', 'warn'); return; }
                this.attach(true);
            } else {
                this._homeElec();
                this.toast('Drop the electrodes on the glowing <b>eye</b> contact point.', 'warn');
            }
        }
        _homeElec() {
            const e = this.elec, sx = e.x, sy = e.y;
            this.tw.add(0.3, t => { e.x = M.lerp(sx, ELEC_HOME.x, t); e.y = M.lerp(sy, ELEC_HOME.y, t); });
        }

        /* ---------- the shock & seizure ---------- */
        shock() {
            if (this.busy) return;
            if (!this.injected || !this.elec.attached) { this.toast('Apply the electrodes first.', 'warn'); return; }
            const gen = this.gen;
            const d = this.injected, cur = this.current;
            // sub-maximal current: THLE may fail even without a drug
            const subMax = M.clamp((cur - 60) / 50, 0, 1) * M.clamp(this.durSec / 0.2, 0.4, 1.2);
            const pProt = 1 - (1 - d.pProt) * M.clamp(subMax, 0, 1);
            const protect = Math.random() < pProt;
            const sc = M.clamp(M.gauss(1, 0.13), 0.65, 1.4);
            this.seiz = {
                t: 0, cur: 'flex', fast: false, protect,
                dur: {
                    flex: M.clamp(d.flex * sc, 0.8, 5),
                    ext: protect ? 0 : M.clamp(d.ext * sc, 1, 16),
                    clon: M.clamp(d.clon * sc, 3, 20),
                    stup: M.clamp(d.stup * sc, 30, 180)
                },
                rec: {}
            };
            this.busy = true;
            this.elec.on = true;
            this.flash = 1;
            this.fx.emit({ x: this.elec.x, y: this.elec.y, vx: 0, vy: 0, r: 10, grow: 180, life: 0.35, color: 'rgba(253,224,71,0.8)', shape: 'soft' });
            for (let i = 0; i < 18; i++) {
                const a = M.rand(0, Math.PI * 2), v = M.rand(60, 190);
                this.fx.emit({ x: this.elec.x, y: this.elec.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: M.rand(1, 2.2), life: M.rand(0.2, 0.45), color: '#fde68a', shape: 'spark', drag: 4 });
            }
            this.phase = 'seizure';
            this.setStep(4);
            this._refresh();
            this.tw.wait(this.durSec, () => {
                if (gen !== this.gen) return;
                this.elec.on = false;
                // electrodes are withdrawn the instant the stimulus ends
                const e = this.elec, sx = e.x, sy = e.y;
                e.attached = false;
                this.tw.add(0.35, t => { e.x = M.lerp(sx, ELEC_HOME.x, t); e.y = M.lerp(sy, ELEC_HOME.y, t); });
            });
        }

        _phaseDone() {
            const s = this.seiz, m = this.mouse;
            const order = ['flex', 'ext', 'clon', 'stup'];
            s.rec[s.cur] = s.dur[s.cur];
            let i = order.indexOf(s.cur) + 1;
            while (i < order.length && s.dur[order[i]] <= 0) { s.rec[order[i]] = 0; i++; }
            if (i >= order.length) { this._recover(); return; }
            s.cur = order[i]; s.t = 0;
            if (s.cur === 'ext') this.floatText(m.x, m.y - 76, 'tonic extension', '#fda4af');
            if (s.cur === 'clon') this.floatText(m.x, m.y - 76, 'clonus', '#c4b5fd');
            if (s.cur === 'ext' && s.dur.ext === 0) this.floatText(m.x, m.y - 76, 'THLE abolished', '#5eead4');
        }

        _recover() {
            const s = this.seiz, m = this.mouse;
            if (!s) return;
            const gen = this.gen;
            this.seiz.cur = 'rec';
            m.set({ tonic: 0, clonic: 0, sedation: 0.25, crouch: 0.2, hunch: 0.3, sniff: 1 });
            m.rot = 0;
            this.tw.wait(0.8, () => { if (gen === this.gen) this._record(); });
        }

        _record() {
            const s = this.seiz, g = this.injected;
            if (!s || !g) { this.busy = false; return; }
            const r = (this.results[g.id] = this.results[g.id] || []);
            r.push({ flex: s.rec.flex || 0, ext: s.rec.ext || 0, clon: s.rec.clon || 0, stup: s.rec.stup || 0, protect: s.protect });
            this.addRow([
                `<b>${g.short}</b> · M${this.mouseNo}`,
                (s.rec.flex || 0).toFixed(1),
                s.protect ? '<b style="color:#0f766e">0 (abolished)</b>' : `<b>${(s.rec.ext || 0).toFixed(1)}</b>`,
                (s.rec.clon || 0).toFixed(1),
                s.protect ? '<span style="color:#15803d">Protected</span>' : '<span style="color:#be123c">Not protected</span>'
            ], s.protect ? 'up' : '');
            this.toast(s.protect
                ? `Tonic hind-limb extension <b>abolished</b> — animal protected.`
                : `THLE lasted <b>${(s.rec.ext || 0).toFixed(1)} s</b> — not protected.`, s.protect ? 'success' : 'info', 3400);
            this.markDone(g.id);
            this.busy = false;
            this.phase = 'done';
            this.setStep(5);
            this._refresh();
            this._chart(); this._infer();
        }

        _chart() {
            const trs = this.cfg.treatments, pts = [];
            trs.forEach((t, i) => {
                const r = this.results[t.id];
                if (!r) return;
                pts.push([i + 1, M.mean(r.map(x => x.ext)), r.length > 1 ? M.sem(r.map(x => x.ext)) : 0]);
            });
            this.chart.draw(Object.assign({}, this.cfg.chartEmpty, {
                xFmt: v => (trs[v - 1] ? trs[v - 1].short : ''),
                series: [{ name: 'Mean THLE (s)', color: '#e11d48', type: 'bar', points: pts, barWidth: 0.5, labels: true }],
                annotations: [{ y: 0.001, text: 'abolition = protection', color: '#0f766e' }]
            }));
        }

        _infer() {
            const R = this.results;
            const pct = id => { const r = R[id]; return r.filter(x => x.protect).length / r.length * 100; };
            let html = this.cfg.treatments.filter(t => R[t.id]).map(t => {
                const r = R[t.id];
                return `<div class="kv"><span>${t.short} (n=${r.length}) THLE / protection</span><span>${M.mean(r.map(x => x.ext)).toFixed(1)} s / ${pct(t.id).toFixed(0)}%</span></div>`;
            }).join('');
            const n = [];
            if (R.saline) {
                const base = M.mean(R.saline.map(x => x.ext));
                ['phenytoin', 'pheno', 'diazepam'].forEach(id => {
                    if (!R[id]) return;
                    const name = this.cfg.treatments.find(t => t.id === id).short;
                    const red = base > 0 ? (1 - M.mean(R[id].map(x => x.ext)) / base) * 100 : 0;
                    n.push(`${name}: ${pct(id).toFixed(0)}% protection, THLE reduced by ${red.toFixed(0)}%.`);
                });
                if (R.phenytoin) n.push('Phenytoin abolishes the tonic extensor phase → effective in <b>generalised tonic-clonic and partial seizures</b>.');
                if (R.diazepam) n.push('Diazepam only partly suppresses THLE — benzodiazepines are weak in the MES model but potent against PTZ/status epilepticus.');
            } else if (Object.keys(R).length) n.push('Shock a <b>control</b> animal to establish the full THLE duration.');
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        /* ---------- simulation ---------- */
        update(dt) {
            const m = this.mouse;
            this.flash = Math.max(0, this.flash - dt * 3.2);
            // drug-related baseline sedation
            let sed = 0;
            if (this.injected && this.drugMin !== null) {
                const k = { saline: 0, phenytoin: 0.12, pheno: 0.45, diazepam: 0.5 }[this.injected.id] || 0;
                sed = k * M.clamp(this.drugMin / 25, 0, 1);
            }
            const s = this.seiz;
            if (s && this.phase === 'seizure') {
                const sp = s.cur === 'stup' && s.fast ? 14 : 1;
                s.t += dt * sp;
                if (s.cur === 'flex') {
                    const k = M.clamp(s.t / 0.25, 0, 1);
                    m.set({ walk: 0, sniff: 0, crouch: k, hunch: k, tonic: 0, clonic: 0, sedation: 0 });
                    m.gaitSpeed = 0;
                    m.rot = -0.12 * k * m.facing;
                } else if (s.cur === 'ext') {
                    const k = M.clamp(s.t / 0.3, 0, 1);
                    m.set({ crouch: 0, hunch: 0, tonic: k, clonic: 0, sedation: 0, straub: k });
                    m.rot = M.lerp(m.rot, 0.06 * m.facing, dt * 6);
                } else if (s.cur === 'clon') {
                    m.set({ tonic: 0, straub: 0, clonic: 1, crouch: 0.3, sedation: 0 });
                    m.rot = M.approach(m.rot, 0, 6, dt);
                } else if (s.cur === 'stup') {
                    m.set({ clonic: 0, tonic: 0, sedation: 1, crouch: 0.6, hunch: 0.4, sniff: 0 });
                    m.rot = M.approach(m.rot, 0, 6, dt);
                }
                if (s.cur !== 'rec' && s.t >= s.dur[s.cur]) this._phaseDone();
            } else if (this.where === 'cage' || this.where === 'plat') {
                const lo = this.where === 'cage' ? CAGE.x + 30 : PLAT.x + 26;
                const hi = this.where === 'cage' ? CAGE.x + CAGE.w - 30 : PLAT.x + PLAT.w - 26;
                const held = this.inject || this.syringeFill > 0 || this.elec.attached || this.phase === 'done' || this.drag;
                const spd = 26 * (1 - sed * 0.8);
                const moving = !held && Math.abs(this.walkTo - m.x) > 5 && spd > 4;
                if (!held && (Math.abs(m.x - this.walkTo) < 5 || Math.random() < dt * 0.06)) this.walkTo = M.rand(lo, hi);
                if (moving) { m.facing = Math.sign(this.walkTo - m.x); m.x += m.facing * spd * dt; }
                m.set({ walk: moving ? 1 : 0, sedation: sed, ataxia: sed * 0.5, sniff: 1 });
                m.gaitSpeed = moving ? spd / 15 : 0;
                m.x = M.clamp(m.x, lo - 8, hi + 8);
            }
            // electrode follows the drag
            if (this.drag && this.drag.kind === 'elec') { this.elec.x = this.drag.x; this.elec.y = this.drag.y; }
            else if (this.elec.attached) { const z = this._eyeZone(); this.elec.x = z.x; this.elec.y = z.y; }
            m.update(dt);

            const cp = s && this.phase === 'seizure' ? PHASES.find(p => p.id === s.cur) : null;
            this.hud('l', [{ k: 'Mouse', v: '#' + this.mouseNo }, { k: 'Group', v: this.injected ? this.injected.short : 'untreated' }]);
            this.hud('r', [
                { k: 'Stimulus', v: `${this.current} mA · ${this.durSec} s`, tone: this.current < 100 ? 'warn' : '' },
                { k: 'Phase', v: cp ? cp.name.replace(' (THLE)', '') : (s ? 'recovery' : '—'), tone: cp && cp.id === 'ext' ? 'bad' : '' },
                { k: 'THLE', v: s ? (s.protect ? 'abolished' : (s.rec.ext !== undefined ? s.rec.ext.toFixed(1) : (s.cur === 'ext' ? s.t.toFixed(1) : '0.0')) + ' s') : '—', tone: s && s.protect ? 'good' : '' }
            ]);
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._platform(ctx);
            this._unit(ctx);
            this._lead(ctx);
            this._cage(ctx, false);
            if (this.where === 'cage' || this.where === 'carry') this.mouse.draw(ctx);
            this._cage(ctx, true);
            if (this.where === 'plat') this.mouse.draw(ctx);
            this._electrodes(ctx);
            this._timeline(ctx);
            if (this.flash > 0) {
                ctx.save();
                ctx.globalAlpha = this.flash * 0.3;
                ctx.fillStyle = '#fef9c3'; ctx.fillRect(0, 0, this.W, this.H);
                ctx.restore();
            }
            // drop-target glow for the electrodes
            if (this.phase === 'prep' && this.moist) {
                const z = this._eyeZone(), pulse = 0.5 + 0.5 * Math.sin(performance.now() / 240);
                const near = this.drag && this.drag.kind === 'elec' && Math.hypot(this.drag.x - z.x, this.drag.y - z.y) < z.r + 24;
                ctx.save();
                ctx.strokeStyle = near ? 'rgba(52,245,197,0.95)' : `rgba(52,245,197,${0.35 + pulse * 0.4})`;
                ctx.lineWidth = near ? 3 : 2; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -performance.now() / 40;
                ctx.beginPath(); ctx.arc(z.x, z.y, z.r + pulse * 4, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
                G.text(ctx, 'Corneal contact', z.x, z.y - z.r - 10, { size: 11, align: 'center', color: '#a7f3d0', shadow: true });
                ctx.restore();
            }
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

        _platform(ctx) {
            const p = PLAT;
            G.shadow(ctx, p.x + p.w / 2, 414, p.w * 0.5, 9, 0.4);
            // padded top (foam mat)
            const g = ctx.createLinearGradient(0, p.y - 12, 0, p.y + 8);
            g.addColorStop(0, '#2f4858'); g.addColorStop(0.5, '#24394a'); g.addColorStop(1, '#16242f');
            ctx.fillStyle = g; G.rr(ctx, p.x, p.y - 12, p.w, 20, 4); ctx.fill();
            ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let x = p.x + 8; x < p.x + p.w - 6; x += 16) ctx.fillRect(x, p.y - 9, 8, 2);
            // legs
            ctx.fillStyle = '#64748b';
            [p.x + 18, p.x + p.w - 24].forEach(x => ctx.fillRect(x, p.y + 6, 7, 412 - p.y - 6));
            G.text(ctx, 'OBSERVATION PLATFORM', p.x + 6, p.y - 18, { size: 9, color: 'rgba(226,232,240,0.6)', weight: 800 });
        }

        _unit(ctx) {
            const u = UNIT;
            G.shadow(ctx, u.x + u.w / 2, u.y + u.h + 2, u.w * 0.55, 10, 0.5);
            const g = ctx.createLinearGradient(0, u.y, 0, u.y + u.h);
            g.addColorStop(0, '#e8edf2'); g.addColorStop(0.1, '#cfd8e1'); g.addColorStop(1, '#8b97a4');
            ctx.fillStyle = g; G.rr(ctx, u.x, u.y, u.w, u.h, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            [[u.x + 10, u.y + 10], [u.x + u.w - 10, u.y + 10], [u.x + 10, u.y + u.h - 10], [u.x + u.w - 10, u.y + u.h - 10]].forEach(([x, y]) => G.screw(ctx, x, y, 3.5));
            G.text(ctx, 'ELECTROCONVULSIOMETER', u.x + 22, u.y + 26, { size: 11, weight: 800, color: '#1e293b' });
            G.text(ctx, 'CONSTANT CURRENT · 50 Hz', u.x + 22, u.y + 40, { size: 8, weight: 700, color: '#64748b' });
            G.metal(ctx, u.x + 18, u.y + 50, u.w - 36, u.h - 70, { r: 8, tone: 'dark' });
            const s = this.seiz;
            const live = this.elec.on;
            G.lcd(ctx, u.x + 32, u.y + 62, 118, 48, this.current + ' mA', { label: 'CURRENT', color: live ? '#fde047' : '#34f5c5' });
            G.lcd(ctx, u.x + 162, u.y + 62, 118, 48, this.durSec.toFixed(2) + ' s', { label: 'DURATION', color: '#34f5c5' });
            const el = s && this.phase === 'seizure' && s.cur === 'ext' ? s.t : (s && s.rec.ext) || 0;
            G.lcd(ctx, u.x + 32, u.y + 124, 248, 46, el.toFixed(1).padStart(4, '0') + ' s', { label: 'TONIC EXTENSOR TIMER', color: s && s.cur === 'ext' ? '#fb7185' : '#34f5c5' });
            // current selector knob + indicator lamps
            G.knob(ctx, u.x + 60, u.y + 196, 16, (this.current - 40) / 160 * 2.4 - 1.2);
            G.text(ctx, 'mA', u.x + 60, u.y + 220, { size: 8, color: '#94a3b8', align: 'center', weight: 700 });
            G.led(ctx, u.x + 118, u.y + 190, 6, '#22c55e', true);
            G.text(ctx, 'POWER', u.x + 130, u.y + 194, { size: 8, color: '#cbd5e1', weight: 700 });
            G.led(ctx, u.x + 118, u.y + 208, 6, '#f59e0b', this.elec.attached);
            G.text(ctx, 'READY', u.x + 130, u.y + 212, { size: 8, color: '#cbd5e1', weight: 700 });
            // shock button
            const bx = u.x + u.w - 72, by = u.y + 200;
            ctx.save();
            const bg2 = ctx.createRadialGradient(bx - 4, by - 5, 2, bx, by, 24);
            bg2.addColorStop(0, live ? '#fecaca' : '#f87171'); bg2.addColorStop(1, live ? '#dc2626' : '#991b1b');
            ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(bx, by, live ? 17 : 19, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.6)'; ctx.lineWidth = 2; ctx.stroke();
            G.text(ctx, 'SHOCK', bx, by + 3.5, { size: 9, weight: 800, color: '#fff1f2', align: 'center' });
            ctx.restore();
            // output terminals
            ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(u.x + 24, u.y + u.h - 16, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(u.x + 42, u.y + u.h - 16, 5, 0, Math.PI * 2); ctx.fill();
        }

        _lead(ctx) {
            const e = this.elec;
            const x0 = UNIT.x + 24, y0 = UNIT.y + UNIT.h - 16;
            const sag = 60 + Math.hypot(e.x - x0, e.y - y0) * 0.12;
            ctx.save();
            ctx.lineCap = 'round';
            ctx.strokeStyle = this.elec.on ? 'rgba(253,224,71,0.9)' : 'rgba(30,41,59,0.85)';
            ctx.lineWidth = 3.4;
            ctx.beginPath(); ctx.moveTo(x0, y0);
            ctx.bezierCurveTo(x0 - 60, y0 + sag * 0.5, e.x + 70, e.y + sag, e.x + 12, e.y + 4);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(248,250,252,0.25)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x0, y0 - 1);
            ctx.bezierCurveTo(x0 - 60, y0 + sag * 0.5 - 1, e.x + 70, e.y + sag - 1, e.x + 12, e.y + 3);
            ctx.stroke();
            ctx.restore();
        }

        _electrodes(ctx) {
            const e = this.elec;
            ctx.save();
            ctx.translate(e.x, e.y);
            const hov = !e.attached && this.phase === 'prep' && this._overElec(this.ptr.x, this.ptr.y);
            if (hov && !this.drag) ctx.translate(0, -3);
            // insulated holder
            const g = ctx.createLinearGradient(0, -9, 0, 9);
            g.addColorStop(0, '#475569'); g.addColorStop(0.5, '#1e293b'); g.addColorStop(1, '#0f172a');
            ctx.fillStyle = g; G.rr(ctx, -4, -9, 30, 18, 5); ctx.fill();
            ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 1; ctx.stroke();
            // two sprung contacts
            [-6, 6].forEach(dy => {
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(-4, dy * 0.6); ctx.lineTo(-18, dy); ctx.stroke();
                const bg = ctx.createRadialGradient(-20, dy - 1, 0.5, -20, dy, 5);
                bg.addColorStop(0, '#f8fafc'); bg.addColorStop(1, '#94a3b8');
                ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(-20, dy, 4.2, 0, Math.PI * 2); ctx.fill();
                if (this.moist) { ctx.fillStyle = 'rgba(125,211,252,0.55)'; ctx.beginPath(); ctx.arc(-20, dy, 5.4, 0, Math.PI * 2); ctx.fill(); }
                if (e.on) {
                    ctx.strokeStyle = 'rgba(253,224,71,0.95)'; ctx.lineWidth = 1.4;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath(); ctx.moveTo(-24, dy);
                        ctx.lineTo(-24 - M.rand(4, 9), dy + M.rand(-6, 6));
                        ctx.lineTo(-24 - M.rand(10, 16), dy + M.rand(-5, 5));
                        ctx.stroke();
                    }
                }
            });
            ctx.restore();
            if (!e.attached && this.phase === 'prep') {
                G.text(ctx, this.moist ? 'Drag onto the eyes' : 'Moisten with saline', e.x + 10, e.y - 18, { size: 10, color: this.moist ? '#a7f3d0' : '#fcd34d', align: 'center', shadow: true });
            }
        }

        _timeline(ctx) {
            const s = this.seiz;
            if (!s) return;
            const t = TL, total = Math.max(12, s.dur.flex + s.dur.ext + s.dur.clon + Math.min(30, s.dur.stup));
            ctx.save();
            ctx.fillStyle = 'rgba(8,15,26,0.72)'; G.rr(ctx, t.x - 10, t.y - 22, t.w + 20, 56, 8); ctx.fill();
            G.text(ctx, 'SEIZURE PHASES', t.x, t.y - 8, { size: 9, weight: 800, color: '#94a3b8' });
            let acc = 0;
            const order = ['flex', 'ext', 'clon', 'stup'];
            order.forEach(id => {
                const ph = PHASES.find(p => p.id === id);
                const dur = id === 'stup' ? Math.min(30, s.dur[id]) : s.dur[id];
                if (dur <= 0) return;
                const x = t.x + acc / total * t.w, w = dur / total * t.w;
                const done = order.indexOf(s.cur) > order.indexOf(id) || s.cur === 'rec';
                const active = s.cur === id;
                ctx.fillStyle = done || active ? ph.color : G.hexA(ph.color, 0.25);
                G.rr(ctx, x, t.y, Math.max(2, w - 2), 14, 3); ctx.fill();
                if (active) {
                    const p = M.clamp(s.t / s.dur[id], 0, 1);
                    ctx.fillStyle = 'rgba(255,255,255,0.85)';
                    ctx.fillRect(x + Math.max(2, w - 2) * p - 1, t.y - 3, 2, 20);
                }
                acc += dur;
            });
            if (s.dur.ext <= 0) {
                const x = t.x + s.dur.flex / total * t.w;
                ctx.strokeStyle = '#34f5c5'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x, t.y - 4); ctx.lineTo(x, t.y + 18); ctx.stroke();
                G.text(ctx, 'THLE abolished', x + 6, t.y + 28, { size: 9, weight: 800, color: '#5eead4' });
            } else {
                const cp = PHASES.find(p => p.id === s.cur);
                G.text(ctx, cp ? cp.name : 'Recovery', t.x, t.y + 28, { size: 10, weight: 700, color: cp ? cp.color : '#94a3b8' });
            }
            ctx.restore();
        }
    }

    LAB.register(7, MES);
})();
