/**
 * EXP 23 — Acute oral toxicity: LD50 by the up-and-down (staircase) method, OECD 425
 * One mouse at a time is weighed, dosed by oral gavage and observed for 48 h.
 * Survival → next animal gets a HIGHER dose (× progression factor)
 * Death    → next animal gets a LOWER  dose (÷ progression factor)
 * Testing stops after 4 reversals (or 8 animals); LD50 is the geometric mean of the
 * doses from the first reversal onwards, and is compared with the literature value.
 */
(function () {
    const { M, G, Rodent } = LAB;
    const CAGE = { x: 24, y: 262, w: 214, h: 146, floor: 398 };
    const BAL = { x: 262, y: 300, w: 136 };
    const BOX = { x: 420, y: 232, w: 232, h: 176, floor: 400 };
    const PANEL = { x: 676, y: 54, w: 268, h: 352 };
    const DMIN = 0.5, DMAX = 5000;
    const MAXN = 8, REVS = 4;

    class LD50 extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 412 },
                tray: { x: 268, y: 520 },
                treatmentTitle: 'Test substance (oral)',
                steps: [
                    'Select a <b>test substance</b> and set the <b>starting dose</b> (begin below the expected LD₅₀).',
                    'Weigh the fasted mouse — the gavage volume is 10 mL/kg of body weight.',
                    'Click the syringe to fill it, then drag it to the mouse’s <b>mouth</b> for oral gavage.',
                    'Observe for <b>48 h</b> and record signs of toxicity and death/survival.',
                    'Survivor → <b>raise</b> the dose; death → <b>lower</b> the dose. Dose the next animal.',
                    'After <b>4 reversals</b>, calculate the LD₅₀ as the geometric mean of the doses.'
                ],
                treatments: [
                    { id: 'caffeine', name: 'Caffeine', short: 'Caffeine', cls: 'CNS stimulant — lit. LD₅₀ ≈ 127 mg/kg', color: '#b45309', ld50: 127, slope: 0.115, start: 60, sign: 'stim', tDeath: [0.4, 3] },
                    { id: 'paracetamol', name: 'Paracetamol', short: 'PCM', cls: 'Analgesic — lit. LD₅₀ ≈ 338 mg/kg', color: '#0d9488', ld50: 338, slope: 0.13, start: 150, sign: 'sed', tDeath: [16, 40] },
                    { id: 'diazepam', name: 'Diazepam', short: 'DZP', cls: 'BZD — lit. LD₅₀ ≈ 720 mg/kg', color: '#6366f1', ld50: 720, slope: 0.14, start: 300, sign: 'narc', tDeath: [1.5, 8] },
                    { id: 'strychnine', name: 'Strychnine', short: 'Strych', cls: 'Glycine antagonist — lit. LD₅₀ ≈ 2 mg/kg', color: '#e11d48', ld50: 2, slope: 0.09, start: 1, sign: 'conv', tDeath: [0.2, 0.8] }
                ],
                table: ['Animal', 'Dose (mg/kg)', 'Signs', 'Outcome', 'Next dose'],
                chart: true, chartTitle: 'Up-and-down staircase',
                chartEmpty: { xMin: 0.5, xMax: MAXN + 0.5, yMin: DMIN, yMax: DMAX, logY: true, xTicks: [1, 2, 3, 4, 5, 6, 7, 8], xLabel: 'Animal number', yLabel: 'Dose (mg/kg, log)', series: [] },
                viva: [
                    { q: 'LD₅₀ is defined as the dose that:', opts: ['Produces toxicity in 50% of animals', 'Kills 50% of the test animals in a stated period', 'Is 50% of the therapeutic dose', 'Kills all animals in 50 h'], ans: 1, exp: 'LD₅₀ (median lethal dose) is the statistically derived single dose expected to kill 50% of the animals within a stated observation period, usually 24–48 h or 14 days.' },
                    { q: 'The main advantage of the up-and-down method over the classical method is:', opts: ['It is faster but uses more animals', 'It uses far fewer animals (3Rs)', 'It needs no statistics', 'It gives the ED₅₀ as well'], ans: 1, exp: 'OECD 425 (up-and-down) estimates the LD₅₀ with about 6–10 animals instead of the 40–50 needed for the classical graded-dose method — a major refinement under the 3Rs.' },
                    { q: 'In the up-and-down method, if an animal survives the dose, the next animal receives:', opts: ['The same dose', 'A lower dose', 'A higher dose', 'No dose'], ans: 2, exp: 'Survival moves the staircase up by the progression factor (default 3.2); death moves it down. Each change of direction is a reversal.' },
                    { q: 'The therapeutic index is calculated as:', opts: ['LD₅₀ × ED₅₀', 'LD₅₀ / ED₅₀', 'ED₅₀ / LD₅₀', 'LD₅₀ − ED₅₀'], ans: 1, exp: 'TI = LD₅₀/ED₅₀. A larger value means a wider margin of safety; a safer index is the certain safety factor LD₁/ED₉₉.' },
                    { q: 'Strychnine kills by producing:', opts: ['Respiratory depression', 'Tonic extensor convulsions and respiratory arrest', 'Hepatic necrosis', 'Cardiac arrhythmia'], ans: 1, exp: 'Strychnine blocks glycine receptors in the spinal cord, causing violent tonic extensor convulsions; death results from asphyxia during a sustained convulsion.' },
                    { q: 'Why are animals fasted overnight before oral toxicity testing?', opts: ['To reduce body weight', 'To make absorption of the oral dose uniform', 'To prevent vomiting', 'To reduce pain'], ans: 1, exp: 'Food in the stomach alters the rate and extent of absorption; overnight fasting (with free access to water) standardises exposure. Mice cannot vomit.' }
                ],
                inferenceHint: 'Dose one animal at a time and let the staircase reverse four times to estimate the LD₅₀.'
            };
        }

        setup() {
            this.animalNo = 0;
            this.series = null;
            this.weight = 20;
            this.obsH = 0;
            this.result = null;
            this.factor = 3.2;
            this.controls(`
                <div class="lab2-field">
                    <label><span>Dose for this animal</span><b id="ld-dv">—</b></label>
                    <input type="range" id="ld-dose" min="0" max="1000" value="500">
                </div>
                <div class="lab2-card-h"><span>Progression factor</span></div>
                <div class="lab2-seg" id="ld-fac">
                    <button data-f="1.5">×1.5</button><button data-f="2">×2</button><button data-f="3.2" class="active">×3.2</button>
                </div>
                <p style="font-size:.72rem;color:#64748b;margin-top:8px">OECD 425 default factor is 3.2 (half a log unit). Start below the expected LD₅₀ so the first animal is likely to survive.</p>`);
            this.slider = this.ctrl.querySelector('#ld-dose');
            this.slider.oninput = () => { if (this.locked) { this._syncSlider(); return; } this.dose = this._fromSlider(+this.slider.value); this._doseLabel(); this._refresh(); };
            this.ctrl.querySelectorAll('#ld-fac button').forEach(b => b.onclick = () => {
                this.factor = +b.dataset.f;
                this.ctrl.querySelectorAll('#ld-fac button').forEach(x => x.classList.toggle('active', x === b));
                if (this.series && this.series.next) { this.dose = this._nextDose(); this._syncSlider(); this._doseLabel(); this._refresh(); }
            });
            this.hotspots = [
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Stock cage — fasted Swiss albino mice, 18–22 g' },
                { x: BAL.x, y: BAL.y, w: BAL.w, h: 80, label: 'Digital balance — dose volume is 10 mL/kg' },
                { x: BOX.x, y: BOX.y, w: BOX.w, h: BOX.h, label: 'Individual observation chamber (48 h)' },
                { x: PANEL.x, y: PANEL.y, w: PANEL.w, h: PANEL.h, label: 'Up-and-down record sheet' }
            ];
            this.dose = this.tr.start;
            this._newSeries(true);
        }

        /* ---------- dose slider maps linearly in log space ---------- */
        _toSlider(d) { return M.clamp(Math.round(M.inv(Math.log10(DMIN), Math.log10(DMAX), Math.log10(d)) * 1000), 0, 1000); }
        _fromSlider(v) {
            const d = Math.pow(10, M.lerp(Math.log10(DMIN), Math.log10(DMAX), v / 1000));
            return d >= 100 ? Math.round(d / 5) * 5 : d >= 10 ? Math.round(d) : +d.toFixed(2);
        }
        _syncSlider() { this.slider.value = this._toSlider(this.dose); }
        _doseLabel() {
            const el = this.ctrl.querySelector('#ld-dv');
            if (el) el.textContent = this.dose + ' mg/kg';
            this.slider.disabled = !!this.locked;
        }

        _newSeries(initial) {
            this.series = { doses: [], outcomes: [], revs: 0, done: false, next: null, subst: this.tr };
            this.seriesTrId = this.tr.id;
            this.result = null;
            this.rows = []; this._renderRows();
            this.dose = this.tr.start;
            this._syncSlider(); this._doseLabel();
            if (this.chart) this.chart.draw(this.cfg.chartEmpty);
            this.infer(this.cfg.inferenceHint);
            if (!initial) this.toast(`New series started for <b>${this.tr.name}</b>.`, 'info');
            this.resetAnimal();
        }

        onSelect(tr) {
            // the animal in the chamber has already swallowed the dose — its outcome
            // belongs to the substance it was given, so the choice is locked until recorded
            if (this.obs && this.series && !this.series.done) {
                this.tr = this.lockedTr || this.tr;
                this._markTreatment();
                this.toast(`Finish observing animal #${this.animalNo} before changing the substance.`, 'warn');
                return;
            }
            // clicking the substance already under test must not discard the series
            if (this.series && !this.series.done && tr.id === this.seriesTrId) { this._refresh(); return; }
            if (this.series && this.series.doses.length && !this.series.done) {
                if (!confirm(`A series for ${this.series.subst ? this.series.subst.name : 'the previous drug'} is in progress. Start a new series with ${tr.name}?`)) return;
            }
            this._newSeries();
        }

        resetAnimal() {
            if (this.series && this.series.done) { this._refresh(); return; }
            // callbacks belonging to the previous animal check this and bail out
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.animalNo = (this.series.doses.length) + 1;
            this.weight = +M.clamp(M.gauss(20, 1.4), 17, 24).toFixed(1);
            this.mouse = new Rodent({ x: CAGE.x + 110, y: CAGE.floor, scale: 1.2, facing: 1 });
            this.mouse.groundY = CAGE.floor;
            this.where = 'cage';
            this.walkTo = CAGE.x + 110;
            this.phase = 'weigh';
            this.obsH = 0;
            this.obs = null;
            this.died = false;            // animal outcome (not the engine's destroy flag)
            this.lockedTr = null;
            this.locked = false;
            if (this.series.next) { this.dose = this.series.next; this._syncSlider(); }
            this._doseLabel();
            this.setStep(this.series.doses.length ? 4 : 0);
            this._refresh();
        }

        _nextDose() {
            const s = this.series;
            if (!s.outcomes.length) return this.dose;
            const last = s.outcomes[s.outcomes.length - 1], d = s.doses[s.doses.length - 1];
            const raw = last === 'died' ? d / this.factor : d * this.factor;
            const v = M.clamp(raw, DMIN, DMAX);
            return v >= 100 ? Math.round(v / 5) * 5 : v >= 10 ? Math.round(v) : +v.toFixed(2);
        }

        _refresh() {
            const busy = this.busy, s = this.series;
            if (s.done) {
                this.status(`Series complete — <b>LD₅₀ ≈ ${this.result.ld50.toFixed(this.result.ld50 < 10 ? 2 : 0)} mg/kg</b> for ${s.subst.name}.`);
                this.actions([{ label: '↺ New series', primary: true, disabled: busy, onClick: () => this._newSeries() }]);
                return;
            }
            if (this.phase === 'weigh') {
                this.status(`Animal #${this.animalNo}. Weigh the fasted mouse before dosing.`);
                this.actions([{ label: '⚖ Weigh the mouse', primary: true, disabled: busy, onClick: () => this.weigh() }]);
            } else if (this.phase === 'dose') {
                const vol = (this.weight / 100).toFixed(2);
                this.status(`Dose <b>${this.dose} mg/kg</b> = <b>${vol} mL</b> of ${(this.dose / 10).toFixed(this.dose < 10 ? 2 : 1)} mg/mL. Fill the syringe and gavage.`);
                this.actions([{ label: '💉 Fill & gavage (p.o.)', primary: true, disabled: busy, onClick: () => this.autoInject() }]);
            } else if (this.phase === 'observe') {
                this.status('Dosed. Observe continuously for 4 h, then at 24 h and 48 h.');
                this.actions([{ label: '⏩ Observe 48 h', primary: true, disabled: busy, onClick: () => this.observe() }]);
            } else if (this.phase === 'result') {
                const s2 = this.series;
                this.status(this.died
                    ? `Animal #${this.animalNo} <b>died</b> at ${this.obs.tDeath.toFixed(1)} h → lower the next dose to <b>${s2.next} mg/kg</b>.`
                    : `Animal #${this.animalNo} <b>survived</b> 48 h → raise the next dose to <b>${s2.next} mg/kg</b>.`);
                this.actions([{ label: `▶ Next animal at ${s2.next} mg/kg`, primary: true, disabled: busy, onClick: () => this.resetAnimal() }]);
            }
        }

        weigh() {
            if (this.busy) return;
            this.busy = true;
            const gen = this.gen;
            const ok = () => gen === this.gen;
            const m = this.mouse, sx = m.x, sy = m.y;
            this.where = 'carry';
            m.set({ walk: 0 }); m.gaitSpeed = 0; m.groundY = null;
            const tx = BAL.x + BAL.w / 2, ty = BAL.y - 6;
            this.tw.add(0.75, e => {
                m.x = M.lerp(sx, tx, e); m.y = M.lerp(sy, ty, e) - Math.sin(e * Math.PI) * 52;
                m.rot = Math.sin(e * Math.PI) * -0.5;
            }, {
                onDone: () => {
                    if (!ok()) return;
                    m.rot = 0; m.groundY = ty; this.where = 'balance';
                    this.tw.wait(1.1, () => {
                        if (!ok()) return;
                        this.floatText(tx, ty - 60, `${this.weight} g`, '#5eead4');
                        this.tw.wait(0.5, () => {
                            if (!ok()) return;
                            const bx = BOX.x + BOX.w / 2 - 20;
                            this.where = 'carry'; m.groundY = null;
                            this.tw.add(0.8, e => {
                                m.x = M.lerp(tx, bx, e); m.y = M.lerp(ty, BOX.floor, e) - Math.sin(e * Math.PI) * 58;
                                m.rot = Math.sin(e * Math.PI) * -0.5;
                            }, {
                                onDone: () => {
                                    if (!ok()) return;
                                    m.rot = 0; m.groundY = BOX.floor; this.where = 'box';
                                    this.walkTo = bx; this.busy = false;
                                    this.phase = 'dose'; this.setStep(2); this._refresh();
                                }
                            });
                        });
                    });
                }
            });
            this._refresh();
        }

        getInjectZone() {
            if (this.phase !== 'dose' || this.where !== 'box') return null;
            const m = this.mouse;
            return { x: m.x + 40 * m.facing, y: m.y - 28, r: 24, label: 'Mouth — oral gavage', angle: m.facing > 0 ? Math.PI - 0.35 : 0.35 };
        }

        onInjected() {
            const tr = this.tr, d = this.dose;
            const z = (Math.log10(d) - Math.log10(tr.ld50)) / tr.slope;
            const p = 1 / (1 + Math.exp(-z));
            const died = Math.random() < p;
            const sev = M.clamp(0.25 + 0.75 * p + M.gauss(0, 0.08), 0.05, 1);
            this.obs = {
                died, sev,
                tDeath: died ? M.clamp(M.lerp(tr.tDeath[1], tr.tDeath[0], M.clamp(p, 0, 1)) * M.clamp(M.gauss(1, 0.2), 0.5, 1.6), 0.15, 46) : null,
                onset: M.clamp(M.gauss(0.35, 0.1), 0.1, 1.2)
            };
            this.locked = true; this.lockedTr = this.tr; this._doseLabel();
            this.floatText(this.mouse.x, this.mouse.y - 56, `${this.tr.short} ${this.dose} mg/kg p.o.`, '#fde68a');
            this.phase = 'observe';
            this.setStep(3);
            setTimeout(() => this._refresh(), 900);
        }

        observe() {
            if (this.busy || !this.obs) return;
            const gen = this.gen;
            this.timeLapse(48 * 60, 7, {
                label: 'Observation',
                onTick: (min) => {
                    if (gen !== this.gen || !this.obs) return;
                    this.obsH = min / 60;
                    if (this.obs.died && !this.died && this.obsH >= this.obs.tDeath) this._die();
                },
                onDone: () => { if (gen !== this.gen || !this.obs) return; this.obsH = 48; this._outcome(); }
            });
            this._refresh();
        }

        _die() {
            this.died = true;
            const m = this.mouse;
            const sign = this.tr.sign;
            this.toast(`Animal #${this.animalNo} died at <b>${this.obs.tDeath.toFixed(1)} h</b>.`, 'error', 3200);
            this.floatText(m.x, m.y - 70, 'death', '#fda5a5');
            if (sign === 'conv') {
                m.set({ walk: 0, clonic: 0, tonic: 1, sniff: 0 });
                this.tw.add(1.4, () => {}, { onDone: () => this._collapse() });
            } else {
                m.set({ walk: 0, sedation: 1, crouch: 1, sniff: 0 });
                this.tw.add(0.8, () => {}, { onDone: () => this._collapse() });
            }
        }

        _collapse() {
            const m = this.mouse, r0 = m.rot;
            m.gaitSpeed = 0;
            this.tw.add(0.7, e => { m.rot = M.lerp(r0, -1.45 * m.facing, e); m.y = BOX.floor + 12 * e; }, {
                ease: LAB.ease.out,
                onDone: () => { m.breathRate = 0; m.set({ tonic: 0.15, clonic: 0, sedation: 1 }); }
            });
        }

        _outcome() {
            const s = this.series, d = this.dose;
            if (!this.obs || !s || s.done) return;
            s.subst = this.tr;
            s.doses.push(d);
            s.outcomes.push(this.died ? 'died' : 'lived');
            const n = s.outcomes.length;
            if (n > 1 && s.outcomes[n - 1] !== s.outcomes[n - 2]) {
                s.revs++;
                if (s.revFirst === undefined) s.revFirst = n - 1;   // index of the first animal that reversed
            }
            s.next = this._nextDose();
            const signs = this._signText();
            this.addRow([`#${this.animalNo} (${this.weight} g)`, `<b>${d}</b>`, signs, this.died ? '<b style="color:#be123c">Died</b>' : '<span style="color:#15803d">Survived</span>', s.done ? '—' : s.next],
                this.died ? 'down' : 'up');
            this._chart();
            if (s.revs >= REVS || n >= MAXN) { this._calculate(); return; }
            this.phase = 'result';
            this.setStep(4);
            this._refresh();
            this._infer();
        }

        _signText() {
            const sv = this.obs.sev, k = this.tr.sign;
            if (sv < 0.2) return 'no abnormal signs';
            const sets = {
                stim: ['increased locomotion, piloerection', 'restlessness, tremors, rapid respiration', 'tremors with clonic convulsions'],
                sed: ['reduced activity, hunched posture', 'sedation, ptosis, decreased grooming', 'deep sedation, laboured respiration'],
                narc: ['ataxia, decreased activity', 'loss of righting reflex, ataxia', 'deep narcosis, respiratory depression'],
                conv: ['stiffness, exaggerated startle', 'extensor rigidity on handling', 'violent tonic extensor convulsions']
            }[k];
            return sets[sv < 0.5 ? 0 : sv < 0.78 ? 1 : 2];
        }

        _calculate() {
            const s = this.series;
            s.done = true;
            const from = s.revFirst !== undefined ? s.revFirst : 0;
            const used = s.doses.slice(from);
            const ld50 = Math.pow(10, M.mean(used.map(Math.log10)));
            const lit = s.subst.ld50;
            this.result = { ld50, used, from, lit, err: (ld50 - lit) / lit * 100 };
            this.markDone(s.subst.id);
            this.setStep(5);
            this._chart();
            this._infer();
            this._refresh();
            this.toast(`LD₅₀ (${s.subst.name}) ≈ <b>${ld50.toFixed(ld50 < 10 ? 2 : 0)} mg/kg</b>`, 'success', 4200);
        }

        _chart() {
            const s = this.series;
            const died = [], lived = [];
            s.doses.forEach((d, i) => (s.outcomes[i] === 'died' ? died : lived).push([i + 1, d]));
            const series = [
                { color: '#94a3b8', points: s.doses.map((d, i) => [i + 1, d]), width: 1.5, dashed: true },
                { name: 'Survived ○', color: '#0d9488', type: 'scatter', points: lived, r: 5 },
                { name: 'Died ✕', color: '#e11d48', type: 'scatter', points: died, r: 5 }
            ];
            const ann = [];
            if (this.result) ann.push({ y: this.result.ld50, text: 'LD₅₀ ' + this.result.ld50.toFixed(this.result.ld50 < 10 ? 2 : 0), color: '#0f766e' });
            this.chart.draw(Object.assign({}, this.cfg.chartEmpty, { series, annotations: ann }));
        }

        _infer() {
            const s = this.series;
            let html = `<div class="kv"><span>Substance</span><span>${s.subst.name}</span></div>
                        <div class="kv"><span>Animals used</span><span>${s.doses.length}</span></div>
                        <div class="kv"><span>Reversals</span><span>${s.revs} / ${REVS}</span></div>
                        <div class="kv"><span>Sequence</span><span>${s.outcomes.map(o => o === 'died' ? '✕' : '○').join(' ')}</span></div>`;
            if (this.result) {
                const r = this.result;
                html += `<div class="kv"><span>Doses averaged</span><span>${r.used.join(', ')}</span></div>
                         <div class="kv"><span>Estimated LD₅₀</span><span>${r.ld50.toFixed(r.ld50 < 10 ? 2 : 0)} mg/kg</span></div>
                         <div class="kv"><span>Literature LD₅₀</span><span>${r.lit} mg/kg</span></div>
                         <p style="margin-top:8px">LD₅₀ = antilog of the mean log dose from the first reversal onwards = <b>${r.ld50.toFixed(r.ld50 < 10 ? 2 : 0)} mg/kg</b>, within <b>${Math.abs(r.err).toFixed(0)}%</b> of the reported value. ${s.subst.name} is therefore classed as <b>${tox(r.ld50)}</b> by the oral route in mice. Only ${s.doses.length} animals were needed — the 3Rs advantage of the up-and-down method.</p>`;
            } else {
                html += `<p style="margin-top:8px">Continue until <b>${REVS} reversals</b> (✕ after ○ or ○ after ✕) are obtained.</p>`;
            }
            this.infer(html);
        }

        /* ---------- simulation ---------- */
        update(dt) {
            const m = this.mouse;
            if (!m) return;
            let sev = 0;
            if (this.obs && this.phase !== 'dose') {
                const h = this.obsH, on = this.obs.onset;
                const rise = M.clamp((h - on) / Math.max(0.2, on), 0, 1);
                const decay = this.obs.died ? 1 : Math.exp(-Math.max(0, h - 6) / 10);
                sev = this.obs.sev * rise * decay;
            }
            if (!this.died) {
                const k = this.tr.sign;
                if (k === 'stim') { m.set({ sedation: 0, ataxia: sev * 0.5, clonic: sev > 0.75 ? (sev - 0.75) * 4 : 0, sniff: 1, hunch: sev * 0.3 }); m.breathRate = 2.6 + sev * 3.4; }
                else if (k === 'conv') { m.set({ tonic: sev > 0.7 ? (sev - 0.7) * 2.6 : 0, clonic: sev > 0.45 ? sev * 0.5 : 0, ataxia: sev * 0.3, sedation: 0 }); m.breathRate = 2.6 + sev * 2; }
                else { m.set({ sedation: sev * 0.95, ataxia: sev * 0.7, hunch: sev * 0.5, crouch: sev * 0.4, clonic: 0, tonic: 0 }); m.breathRate = Math.max(0.7, 2.6 - sev * 1.6); }
            }
            // locomotion
            if ((this.where === 'cage' || this.where === 'box') && !this.died && !this.inject) {
                const lo = this.where === 'cage' ? CAGE.x + 36 : BOX.x + 32;
                const hi = this.where === 'cage' ? CAGE.x + CAGE.w - 36 : BOX.x + BOX.w - 32;
                const slow = this.tr.sign === 'stim' ? 1 + sev * 1.4 : 1 - sev * 0.92;
                if (Math.abs(m.x - this.walkTo) < 5 || Math.random() < dt * 0.06) this.walkTo = M.rand(lo, hi);
                const moving = Math.abs(this.walkTo - m.x) > 5 && slow > 0.18;
                if (moving) { m.facing = Math.sign(this.walkTo - m.x); m.x += m.facing * 26 * slow * dt; }
                m.set({ walk: moving ? 1 : 0 });
                m.gaitSpeed = moving ? 26 * slow / 15 : 0;
                m.x = M.clamp(m.x, lo - 10, hi + 10);
            } else if (!this.died) m.set({ walk: 0 });
            m.update(dt);
            const s = this.series;
            this.hud('l', [
                { k: 'Animal', v: `#${this.animalNo}` },
                { k: 'Dose', v: this.phase === 'weigh' || this.phase === 'dose' ? this.dose + ' mg/kg' : (s.doses[this.animalNo - 1] || this.dose) + ' mg/kg' },
                { k: 'Weight', v: this.weight + ' g' }
            ]);
            this.hud('r', [
                { k: 'Observation', v: this.obsH ? this.obsH.toFixed(1) + ' h' : '—' },
                { k: 'Status', v: this.died ? 'DEAD' : this.obs ? 'alive' : '—', tone: this.died ? 'bad' : this.obs ? 'good' : '' },
                { k: 'Reversals', v: `${s.revs}/${REVS}` }
            ]);
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._cage(ctx, false);
            this._balance(ctx);
            this._box(ctx, false);
            if (this.mouse) this.mouse.draw(ctx);
            this._box(ctx, true);
            this._cage(ctx, true);
            this._panel(ctx);
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
                for (let i = 0; i < 46; i++) ctx.fillRect(c.x + 8 + (i * 59) % (c.w - 16), c.floor - 5 + (i * 7) % 10, 5, 1.6);
                // water bottle
                ctx.save();
                G.glass(ctx, c.x + c.w - 34, c.y + 16, 22, 54, { r: 5 });
                ctx.fillStyle = 'rgba(125,211,252,0.45)'; G.rr(ctx, c.x + c.w - 32, c.y + 34, 18, 34, 4); ctx.fill();
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.4;
                ctx.beginPath(); ctx.moveTo(c.x + c.w - 23, c.y + 70); ctx.lineTo(c.x + c.w - 23, c.y + 88); ctx.stroke();
                ctx.restore();
            } else {
                G.glass(ctx, c.x, c.y, c.w, c.h, { r: 7, tint: 'rgba(200,225,240,0.07)' });
                ctx.strokeStyle = 'rgba(148,163,184,0.85)'; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(c.x - 5, c.y); ctx.lineTo(c.x + c.w + 5, c.y); ctx.stroke();
                ctx.strokeStyle = 'rgba(203,213,225,0.3)'; ctx.lineWidth = 1;
                for (let x = c.x + 12; x < c.x + c.w; x += 12) { ctx.beginPath(); ctx.moveTo(x, c.y); ctx.lineTo(x, c.y + 14); ctx.stroke(); }
                G.text(ctx, 'STOCK CAGE · FASTED 18 h', c.x + 8, c.y - 8, { size: 9, color: 'rgba(226,232,240,0.7)', weight: 800 });
            }
        }

        _balance(ctx) {
            const b = BAL, y = b.y, h = 412 - y;
            G.shadow(ctx, b.x + b.w / 2, 412, b.w * 0.6, 9, 0.45);
            G.metal(ctx, b.x, y + 22, b.w, h - 22, { r: 6 });
            // weighing pan
            const pg = ctx.createLinearGradient(0, y - 8, 0, y + 6);
            pg.addColorStop(0, '#f1f5f9'); pg.addColorStop(1, '#94a3b8');
            ctx.fillStyle = pg;
            ctx.beginPath(); ctx.ellipse(b.x + b.w / 2, y - 2, b.w * 0.42, 9, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.35)'; ctx.lineWidth = 1; ctx.stroke();
            const on = this.where === 'balance';
            G.lcd(ctx, b.x + 14, y + 34, b.w - 28, 34, (on ? this.weight.toFixed(1) : '0.0') + ' g', { label: 'BALANCE', color: on ? '#34f5c5' : '#2b6b5c' });
            G.led(ctx, b.x + 16, y + 80, 4, '#22c55e', true);
            G.text(ctx, 'TARE', b.x + 26, y + 84, { size: 8, color: '#475569', weight: 700 });
        }

        _box(ctx, front) {
            const b = BOX;
            if (!front) {
                G.shadow(ctx, b.x + b.w / 2, b.y + b.h + 4, b.w * 0.58, 10, 0.45);
                ctx.fillStyle = 'rgba(210,228,240,0.14)'; G.rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
                const bg = ctx.createLinearGradient(0, b.floor - 10, 0, b.y + b.h);
                bg.addColorStop(0, '#e2cba0'); bg.addColorStop(1, '#b08f5f');
                ctx.fillStyle = bg; ctx.fillRect(b.x + 3, b.floor - 8, b.w - 6, b.y + b.h - b.floor + 5);
                ctx.fillStyle = 'rgba(120,84,40,0.45)';
                for (let i = 0; i < 52; i++) ctx.fillRect(b.x + 8 + (i * 47) % (b.w - 16), b.floor - 7 + (i * 11) % 12, 5, 1.6);
            } else {
                G.glass(ctx, b.x, b.y, b.w, b.h, { r: 8, tint: 'rgba(200,225,240,0.05)', edge: 'rgba(225,240,255,0.6)' });
                ctx.strokeStyle = 'rgba(203,213,225,0.9)'; ctx.lineWidth = 2;
                G.rr(ctx, b.x - 2, b.y - 2, b.w + 4, 10, 4); ctx.stroke();
                // identification card
                const cx = b.x + b.w - 96, cy = b.y + 10;
                ctx.fillStyle = '#f8fafc'; G.rr(ctx, cx, cy, 88, 42, 4); ctx.fill();
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.stroke();
                ctx.fillStyle = this.tr.color; G.rr(ctx, cx, cy, 88, 11, 4); ctx.fill();
                G.text(ctx, this.tr.short.toUpperCase(), cx + 44, cy + 8.5, { size: 8, weight: 800, color: '#fff', align: 'center' });
                G.text(ctx, `#${this.animalNo} · ${this.weight} g`, cx + 6, cy + 23, { size: 9, color: '#334155', weight: 700 });
                G.text(ctx, `${this.dose} mg/kg p.o.`, cx + 6, cy + 35, { size: 9, color: '#0f172a', weight: 800 });
                G.text(ctx, 'OBSERVATION CHAMBER', b.x + 8, b.y - 10, { size: 9, color: 'rgba(226,232,240,0.7)', weight: 800 });
                if (this.died) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(190,18,60,0.14)'; G.rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
                    ctx.translate(b.x + 70, b.y + 80); ctx.rotate(-0.18);
                    ctx.strokeStyle = 'rgba(225,29,72,0.85)'; ctx.lineWidth = 2.5;
                    G.rr(ctx, -52, -16, 104, 32, 5); ctx.stroke();
                    G.text(ctx, 'DEAD', 0, 7, { size: 20, weight: 800, color: 'rgba(225,29,72,0.9)', align: 'center' });
                    ctx.restore();
                }
            }
        }

        _panel(ctx) {
            const p = PANEL, s = this.series;
            ctx.save();
            ctx.fillStyle = 'rgba(248,250,252,0.96)'; G.rr(ctx, p.x, p.y, p.w, p.h, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(100,116,139,0.5)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#0f172a'; G.rr(ctx, p.x, p.y, p.w, 30, 10); ctx.fill();
            ctx.fillRect(p.x, p.y + 20, p.w, 10);
            G.text(ctx, 'UP-AND-DOWN RECORD SHEET', p.x + 14, p.y + 20, { size: 10, weight: 800, color: '#e2e8f0' });
            G.text(ctx, `Substance: ${this.tr.name}`, p.x + 14, p.y + 50, { size: 11, weight: 700, color: '#0f172a' });
            G.text(ctx, `Progression factor ×${this.factor}`, p.x + 14, p.y + 66, { size: 10, color: '#64748b' });
            // staircase of circles, log-spaced rows
            const gx = p.x + 30, gy = p.y + 86, gw = p.w - 56, gh = 176;
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
            const all = s.doses.concat(s.done ? [] : [this.dose]);
            const lo = Math.min.apply(null, all.map(Math.log10)) - 0.35;
            const hi = Math.max.apply(null, all.map(Math.log10)) + 0.35;
            const Y = d => gy + gh - (Math.log10(d) - lo) / Math.max(0.3, hi - lo) * gh;
            for (let i = 0; i <= 4; i++) { const yy = Math.round(gy + gh * i / 4) + 0.5; ctx.beginPath(); ctx.moveTo(gx, yy); ctx.lineTo(gx + gw, yy); ctx.stroke(); }
            ctx.strokeStyle = '#94a3b8';
            ctx.beginPath(); ctx.moveTo(gx + 0.5, gy); ctx.lineTo(gx + 0.5, gy + gh); ctx.lineTo(gx + gw, gy + gh); ctx.stroke();
            const X = i => gx + 16 + i * ((gw - 24) / Math.max(5, MAXN - 1));
            // connecting staircase line
            if (s.doses.length) {
                ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
                ctx.beginPath(); s.doses.forEach((d, i) => i ? ctx.lineTo(X(i), Y(d)) : ctx.moveTo(X(i), Y(d)));
                if (!s.done) ctx.lineTo(X(s.doses.length), Y(this.dose));
                ctx.stroke(); ctx.setLineDash([]);
            }
            s.doses.forEach((d, i) => {
                const x = X(i), y = Y(d), died = s.outcomes[i] === 'died';
                ctx.lineWidth = 2;
                if (died) {
                    ctx.strokeStyle = '#e11d48';
                    ctx.beginPath(); ctx.moveTo(x - 5, y - 5); ctx.lineTo(x + 5, y + 5); ctx.moveTo(x + 5, y - 5); ctx.lineTo(x - 5, y + 5); ctx.stroke();
                } else {
                    ctx.strokeStyle = '#0d9488'; ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(x, y, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                }
                G.text(ctx, String(d), x, y - 10, { size: 8, weight: 700, color: '#475569', align: 'center' });
            });
            if (!s.done) {
                const x = X(s.doses.length), y = Y(this.dose);
                ctx.strokeStyle = 'rgba(14,165,233,0.9)'; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
                ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
                G.text(ctx, this.dose + '', x, y - 12, { size: 8, weight: 800, color: '#0284c7', align: 'center' });
            }
            if (this.result) {
                const y = Y(this.result.ld50);
                ctx.strokeStyle = '#0f766e'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
                ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke(); ctx.setLineDash([]);
                G.text(ctx, 'LD₅₀', gx + gw - 2, y - 4, { size: 9, weight: 800, color: '#0f766e', align: 'right' });
            }
            G.text(ctx, 'Dose (mg/kg, log scale)   ○ survived   ✕ died', p.x + 14, gy + gh + 22, { size: 9, color: '#64748b' });
            const r = this.result;
            G.text(ctx, r ? `LD₅₀ = ${r.ld50.toFixed(r.ld50 < 10 ? 2 : 0)} mg/kg  (lit. ${r.lit})` : `Reversals ${s.revs}/${REVS} · animals ${s.doses.length}/${MAXN}`,
                p.x + 14, gy + gh + 42, { size: 12, weight: 800, color: r ? '#0f766e' : '#334155' });
            ctx.restore();
        }
    }

    function tox(d) {
        if (d < 5) return 'extremely toxic';
        if (d < 50) return 'highly toxic';
        if (d < 500) return 'moderately toxic';
        if (d < 5000) return 'slightly toxic';
        return 'practically non-toxic';
    }

    LAB.register(23, LD50);
})();
