/**
 * EXP 25 — Antipyretic activity: Brewer's yeast-induced pyrexia in rats
 * Flow: basal rectal temperature → 15% yeast s.c. → 18 h time-lapse (fever develops)
 *       → confirm pyrexia → oral test drug → rectal temperature at 1, 2, 3 h → chart & inference.
 */
(function () {
    const { M, G, Rodent } = LAB;
    const REST = { x: 430, y: 428 };
    const UNIT = { x: 640, y: 300, w: 260, h: 132 };
    const YEAST = { id: 'yeast', name: '15% Brewer’s yeast 10 mL/kg s.c.', short: 'Yeast 15%', color: '#d6b98c' };
    const LABELS = ['Basal', '18 h', '+1 h', '+2 h', '+3 h'];

    class Antipyretic extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 430, seed: 7 },
                treatmentTitle: 'Test drug (p.o. after pyrexia)',
                steps: [
                    'Record the <b>basal rectal temperature</b> with the digital thermometer probe (inserted 2 cm).',
                    'Inject <b>15% Brewer’s yeast</b> (10 mL/kg) subcutaneously below the nape of the neck.',
                    'Withdraw food and wait <b>18 h</b> for pyrexia to develop.',
                    'Re-record temperature — use only rats showing a rise of <b>≥ 0.5 °C</b>.',
                    'Select a group and give the test drug <b>orally</b>.',
                    'Record rectal temperature at <b>1, 2 and 3 h</b> after drug and compare groups.'
                ],
                treatments: [
                    { id: 'veh', name: 'Vehicle — 0.5% CMC 10 mL/kg', short: 'Vehicle', cls: 'Control', color: '#64748b', drop: -0.05 },
                    { id: 'pcm', name: 'Paracetamol 150 mg/kg p.o.', short: 'PCM 150', cls: 'Central COX inhibitor', color: '#0d9488', drop: 1.25 },
                    { id: 'asa', name: 'Aspirin 100 mg/kg p.o.', short: 'ASA 100', cls: 'Salicylate NSAID', color: '#7c3aed', drop: 0.95 },
                    { id: 'ibu', name: 'Ibuprofen 40 mg/kg p.o.', short: 'IBU 40', cls: 'Propionic acid NSAID', color: '#d97706', drop: 1.05 }
                ],
                table: ['Group', 'Time', 'Temp (°C)', 'Δ vs 18 h'],
                chart: true, chartTitle: 'Rectal temperature (°C) over time',
                chartEmpty: { xMin: 0, xMax: 4, yMin: 36.5, yMax: 39.5, xTicks: [0, 1, 2, 3, 4], xFmt: v => LABELS[v] || '', yLabel: 'Temperature (°C)' },
                viva: [
                    { q: 'How does Brewer’s yeast cause fever?', opts: ['Direct heating of tissues', 'It induces cytokines (IL-1, IL-6, TNF-α) that raise hypothalamic PGE₂ and the set-point', 'It blocks sweating', 'It increases thyroid hormone release'], ans: 1, exp: 'Yeast acts as an exogenous pyrogen; endogenous pyrogens induce COX-2 in the hypothalamus, PGE₂ acts on EP₃ receptors and raises the thermoregulatory set-point.' },
                    { q: 'Antipyretics lower body temperature by:', opts: ['Lowering a raised set-point by inhibiting hypothalamic PG synthesis', 'Lowering normal body temperature in afebrile animals', 'Blocking muscarinic receptors', 'Acting as uncouplers'], ans: 0, exp: 'NSAIDs and paracetamol reset the elevated set-point; they do not lower normal temperature.' },
                    { q: 'Why are only rats with a rise of ≥ 0.5 °C used?', opts: ['To exclude non-responders so that antipyresis can be measured reliably', 'To reduce the number of animals', 'Because yeast is toxic', 'To calibrate the thermometer'], ans: 0, exp: 'Animals that fail to develop pyrexia would dilute the drug effect.' },
                    { q: 'Why is food withdrawn during the 18 h after yeast injection?', opts: ['To prevent diet-induced thermogenesis and variability in temperature', 'To make the rat sleep', 'To increase yeast absorption', 'It is not withdrawn'], ans: 0, exp: 'Feeding alters metabolic heat production; fasting gives a more uniform febrile baseline.' }
                ],
                inferenceHint: 'Record the full time course for the vehicle group and at least one antipyretic.'
            };
        }

        setup() {
            this.results = {};
            this.ratNo = 0;
            this.lcd = 25.0;
            this.probe = 0;   // 0 = in holder, 1 = inserted
            this.mates = LAB.e1 ? LAB.e1.mates(2, 110, 200, 420) : [];
            this.hotspots = [
                { x: UNIT.x, y: UNIT.y, w: UNIT.w, h: UNIT.h, label: 'Digital tele-thermometer (±0.1 °C)' },
                { x: UNIT.x - 40, y: UNIT.y - 10, w: 40, h: 50, label: 'Rectal thermistor probe' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.ratNo++;
            this.rat = new Rodent({ x: REST.x, y: REST.y, scale: 1.6, kind: 'rat', facing: -1, breathRate: 1.5 });
            this.phase = 'basal';
            this.group = null;
            this.fever = 0;        // displayed fever 0..1
            this.basal = M.gauss(37.2, 0.15);
            this.peak = this.basal + M.gauss(1.35, 0.15);
            this.hPost = 0;
            this.readings = [];
            this.tr = YEAST; this._markTreatment();
            this.setStep(0);
            this._refresh();
        }

        select(id) {
            if (this.phase !== 'treat') { this.toast('Test drugs are given only after pyrexia is confirmed (18 h).', 'warn'); return; }
            super.select(id);
            this._refresh();
        }

        trueTemp() {
            if (this.phase === 'basal' || this.phase === 'yeast') return this.basal;
            if (!this.group) return M.lerp(this.basal, this.peak, this.fever);
            const g = this.group;
            return this.peak - g.drop * (1 - Math.exp(-this.hPost / 0.8));
        }

        _refresh() {
            const b = this.busy, ph = this.phase;
            this.hud('l', [{ k: 'Rat', v: '#' + this.ratNo }, { k: 'Group', v: this.group ? this.group.short : (ph === 'basal' ? 'untreated' : 'yeast') }]);
            if (ph === 'basal') {
                this.status('Lubricate the thermistor probe and insert it 2 cm into the rectum to record the <b>basal temperature</b>.');
                this.actions([{ label: '🌡️ Record temperature', primary: true, disabled: b, onClick: () => this.measure() }]);
            } else if (ph === 'yeast') {
                this.status('Load the yeast suspension and inject it <b>s.c. below the nape</b> (drag the syringe to the neck).');
                this.actions([{ label: '💉 Inject yeast s.c.', primary: true, disabled: b, onClick: () => this.autoInject() }]);
            } else if (ph === 'incub') {
                this.status('Food withdrawn, water ad libitum. Fever develops over the next 18 h.');
                this.actions([{ label: '⏩ Wait 18 h', primary: true, disabled: b, onClick: () => this.incubate() }]);
            } else if (ph === 'confirm') {
                this.status('18 h after yeast — the rat looks lethargic with piloerection. Record temperature to confirm pyrexia.');
                this.actions([{ label: '🌡️ Record temperature', primary: true, disabled: b, onClick: () => this.measure() }]);
            } else if (ph === 'treat') {
                this.status(`Pyrexia confirmed. Select a group (left) and give <b>${this.tr.name}</b> orally.`);
                this.actions([{ label: '💉 Give orally', primary: true, disabled: b, onClick: () => this.autoInject() }]);
            } else if (ph === 'post') {
                const n = this.readings.length - 2;
                this.status(`${this.group.short} given. ${n}/3 post-drug readings recorded.`);
                this.actions([{ label: `⏩ +1 h & record (${n + 1} h)`, primary: true, disabled: b, onClick: () => this.nextHour() }]);
            } else {
                this.status('Time course complete. Take a <b>fresh febrile rat</b> for the next group.');
                this.actions([{ label: '↺ Next rat', primary: true, disabled: b, onClick: () => this.resetAnimal() }]);
            }
        }

        getInjectZone() {
            const r = this.rat;
            if (this.probe > 0.01) return null;
            if (this.phase === 'yeast') return { x: r.x - 12, y: r.y - 70, r: 24, label: 'Nape / dorsal skin (s.c.)', angle: Math.PI / 2 + 0.55 };
            if (this.phase === 'treat') return { x: r.x - 84, y: r.y - 38, r: 24, label: 'Mouth (oral feeding needle)', angle: Math.PI * 0.3 };
            return null;
        }

        onInjected(tr) {
            if (this.phase === 'yeast') {
                this.floatText(this.rat.x, this.rat.y - 110, 'Yeast s.c. — pyrogen', '#fde68a');
                this.phase = 'incub'; this.setStep(2);
            } else if (this.phase === 'treat') {
                this.group = tr; this.hPost = 0;
                this.floatText(this.rat.x - 60, this.rat.y - 90, `${tr.short} p.o.`, '#fde68a');
                this.phase = 'post'; this.setStep(5);
            }
            setTimeout(() => this._refresh(), 900);
        }

        incubate() {
            this.timeLapse(18 * 60, 6, {
                label: 'Pyrexia developing',
                onTick: (s, p) => { this.fever = M.smooth(Math.min(1, p * 1.25)); },
                onDone: () => { this.fever = 1; this.phase = 'confirm'; this.setStep(3); this._refresh(); }
            });
            this._refresh();
        }

        nextHour() {
            const h0 = this.hPost;
            this.timeLapse(60, 2.6, {
                label: 'Drug acting',
                onTick: (s, p) => { this.hPost = h0 + p; },
                onDone: () => { this.hPost = h0 + 1; this.measure(); }
            });
            this._refresh();
        }

        /** thermistor probe travels to the rat, LCD equilibrates, then probe returns */
        measure() {
            this.busy = true;
            const target = this.trueTemp() + M.gauss(0, 0.05);
            const start = 25.0;
            this.tw.add(1.0, e => { this.probe = e; }, {
                onDone: () => this.tw.add(2.0, (e, p) => { this.lcd = target + (start - target) * Math.exp(-p * 5); }, {
                    ease: LAB.ease.linear,
                    onDone: () => {
                        this.lcd = target; this.beep = 1;
                        this.floatText(UNIT.x + 130, UNIT.y - 14, `${target.toFixed(1)} °C`, target > 38 ? '#fca5a5' : '#5eead4');
                        this.tw.wait(0.6, () => this.tw.add(0.8, e => { this.probe = 1 - e; }, { onDone: () => { this.busy = false; this._record(target); } }));
                    }
                })
            });
            this._refresh();
        }

        _record(T) {
            const ph = this.phase;
            const label = LABELS[this.readings.length];
            this.readings.push([this.readings.length, T]);
            if (ph === 'basal') {
                this.addRow([`R${this.ratNo}`, 'Basal', T.toFixed(1), '—']);
                this.phase = 'yeast'; this.setStep(1);
            } else if (ph === 'confirm') {
                const rise = T - this.readings[0][1];
                this.addRow([`R${this.ratNo}`, '18 h', `<b>${T.toFixed(1)}</b>`, `+${rise.toFixed(1)} vs basal`], 'up');
                this.toast(`Rise of <b>${rise.toFixed(1)} °C</b> — pyrexic rat selected ✓`, 'success');
                this.phase = 'treat'; this.setStep(4);
                this.tr = this.cfg.treatments[0]; this._markTreatment();
            } else if (ph === 'post') {
                const d = T - this.readings[1][1];
                this.addRow([`<b>${this.group.short}</b> R${this.ratNo}`, label, `<b>${T.toFixed(1)}</b>`, `${d >= 0 ? '+' : ''}${d.toFixed(1)}`], d < -0.4 ? 'down' : '');
                if (this.readings.length >= 5) {
                    (this.results[this.group.id] = this.results[this.group.id] || []).push(this.readings.map(r => r[1]));
                    this.markDone(this.group.id);
                    this.phase = 'done';
                    this._infer();
                }
            }
            this._chart();
            this._refresh();
        }

        _chart() {
            const series = [];
            this.cfg.treatments.forEach(t => {
                const runs = this.results[t.id];
                if (runs) series.push({ name: t.short, color: t.color, markers: true, points: [0, 1, 2, 3, 4].map(i => [i, M.mean(runs.map(r => r[i]))]) });
            });
            if (this.phase !== 'done') series.push({ name: 'current rat', color: this.group ? this.group.color : '#f59e0b', dashed: true, markers: true, points: this.readings });
            this.chart.draw({ xMin: 0, xMax: 4, yMin: 36.5, yMax: 39.5, xTicks: [0, 1, 2, 3, 4], xFmt: v => LABELS[v] || '', yLabel: 'Temperature (°C)', series, annotations: [{ y: 37.5, text: 'normal range', color: '#94a3b8' }] });
        }

        _infer() {
            const red = id => { const r = this.results[id]; return r ? M.mean(r.map(x => x[1] - x[4])) : null; };
            let html = this.cfg.treatments.filter(t => this.results[t.id]).map(t => `<div class="kv"><span>${t.short} — fall at 3 h</span><span>${red(t.id).toFixed(2)} °C</span></div>`).join('');
            if (this.results.veh && Object.keys(this.results).length > 1) html += '<p style="margin-top:8px">Vehicle-treated rats stay febrile, whereas the test drugs bring the temperature back towards normal → <b>antipyretic activity</b> by inhibiting hypothalamic PGE₂ synthesis (resetting the raised set-point).</p>';
            else if (!this.results.veh) html += '<p style="margin-top:8px">Run the <b>vehicle</b> group to compare.</p>';
            this.infer(html);
        }

        update(dt) {
            const r = this.rat, f = this.fever;
            r.set({ walk: 0, sedation: f * 0.35, hunch: f * 0.7, sniff: 1 - f * 0.6 });
            r.breathRate = 1.5 + f * 0.9;
            r.update(dt);
            this.mates.forEach(m => m.update(dt));
            this.beep = Math.max(0, (this.beep || 0) - dt * 1.5);
            // heat shimmer from febrile rat
            const tNow = this.trueTemp();
            const k = M.clamp((tNow - 37.4) / 1.2, 0, 1);
            if (Math.random() < dt * 8 * k) this.fx.emit({ x: r.x + M.rand(-60, 60), y: r.y - 60, vy: -24, vx: M.rand(-6, 6), r: 10, grow: 14, life: 1.4, shape: 'soft', color: 'rgba(251,113,133,0.18)' });
            this.hud('r', [
                { k: 'Thermometer', v: this.lcd.toFixed(1) + ' °C', tone: this.lcd > 38 ? 'bad' : '' },
                { k: 'Since yeast', v: this.phase === 'basal' || this.phase === 'yeast' ? '—' : (18 + (this.group ? this.hPost : 0)).toFixed(1) + ' h' }
            ]);
        }

        draw(ctx) {
            if (LAB.e1) {
                LAB.e1.clock(ctx, 470, 190, 34, this.simMin, 9);
                LAB.e1.homeCage(ctx, 34, 318, 240, 110, this.mates, 'HOME CAGE · FASTED');
            }
            const r = this.rat;
            const k = M.clamp((this.trueTemp() - 37.4) / 1.2, 0, 1);
            if (k > 0.02) { // thermal glow behind febrile rat
                const g = ctx.createRadialGradient(r.x, r.y - 40, 10, r.x, r.y - 40, 120);
                g.addColorStop(0, `rgba(248,113,113,${0.32 * k})`); g.addColorStop(1, 'rgba(248,113,113,0)');
                ctx.fillStyle = g; ctx.fillRect(r.x - 130, r.y - 170, 260, 180);
            }
            this._drawUnit(ctx);
            r.draw(ctx);
            if (k > 0.3) this._piloerection(ctx, r, k);
            this._drawProbe(ctx);
        }

        _piloerection(ctx, r, k) {
            ctx.save();
            ctx.translate(r.x, r.y); ctx.scale(r.facing * r.scale, r.scale);
            ctx.strokeStyle = `rgba(148,163,184,${0.6 * k})`; ctx.lineWidth = 0.8;
            for (let i = 0; i < 14; i++) {
                const a = -2.6 + i * 0.13, cx = -8 + Math.cos(a) * 36, cy = -26 + Math.sin(a) * 20;
                ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 3.5, cy + Math.sin(a) * 3.5 - 1); ctx.stroke();
            }
            ctx.restore();
        }

        _probeTip() {
            const r = this.rat;
            const holder = { x: UNIT.x - 18, y: UNIT.y + 18 };
            const rump = { x: r.x + 74, y: r.y - 20 };
            const e = LAB.ease.inOut(this.probe);
            return { x: M.lerp(holder.x, rump.x, e), y: M.lerp(holder.y, rump.y, e) - Math.sin(e * Math.PI) * 40, a: M.lerp(-Math.PI / 2, Math.PI - 0.2, e) };
        }

        _drawProbe(ctx) {
            const t = this._probeTip();
            const jack = { x: UNIT.x + 20, y: UNIT.y + 96 };
            // coiled cable
            ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 3; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(jack.x, jack.y);
            ctx.bezierCurveTo(jack.x - 70, jack.y + 30, t.x + 40, t.y + 70, t.x - Math.cos(t.a) * 26, t.y - Math.sin(t.a) * 26);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
            // probe body
            ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.a);
            G.metal(ctx, -30, -3, 22, 6, { r: 2, tone: 'dark', stroke: false });
            G.metal(ctx, -9, -1.6, 10, 3.2, { r: 1.5, tone: 'chrome', stroke: false });
            ctx.restore();
            // holder clip on unit
            G.metal(ctx, UNIT.x - 26, UNIT.y + 6, 14, 30, { r: 3, tone: 'steel' });
        }

        _drawUnit(ctx) {
            const { x, y, w, h } = UNIT;
            G.shadow(ctx, x + w / 2, 432, w * 0.6, 9, 0.45);
            const g = ctx.createLinearGradient(0, y, 0, y + h);
            g.addColorStop(0, '#f1f5f9'); g.addColorStop(0.1, '#d5dce3'); g.addColorStop(1, '#94a0ac');
            ctx.fillStyle = g; G.rr(ctx, x, y, w, h, 12); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
            G.rr(ctx, x + 14, y + 14, w - 28, 70, 8); ctx.fillStyle = '#20262e'; ctx.fill();
            const hot = this.lcd > 38;
            G.lcd(ctx, x + 24, y + 22, w - 48, 54, this.lcd.toFixed(1) + ' °C', { label: 'RECTAL TEMPERATURE', color: hot ? '#fda4af' : '#34f5c5' });
            G.led(ctx, x + 30, y + 104, 4.5, '#22c55e', true);
            G.led(ctx, x + 50, y + 104, 4.5, '#f59e0b', (this.beep || 0) > 0.2);
            G.knob(ctx, x + w - 40, y + 106, 12, 0.4);
            G.text(ctx, 'THERMISTOR TELE-THERMOMETER', x + 66, y + 108, { size: 8.5, color: '#334155', weight: 800 });
        }
    }

    LAB.register(25, Antipyretic);
})();
