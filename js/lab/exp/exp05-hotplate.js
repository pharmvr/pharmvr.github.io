/**
 * EXP 5 — Analgesic activity: Eddy's hot plate (55 ± 0.5 °C)
 * Flow: basal latency → treat → readings at 30, 60, 90 min.
 * The mouse is lifted by the tail into the acrylic cylinder on the heated plate; it walks,
 * lifts its paws and — at the reaction time — licks a paw or jumps. It is removed immediately
 * (or at the 15 s cut-off) and returned to the holding cage.
 */
(function () {
    const { M, G, Rodent } = LAB;
    const PLATE = { x: 600, y: 316, rx: 128 };     // plate centre / top surface
    const CYL = { x: PLATE.x - 112, w: 224, top: 128 };
    const CAGE = { x: 34, y: 318, w: 250, h: 110, floor: 420 };
    const CUT = 15;
    const TIMES = [30, 60, 90];

    class HotPlate extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 430 },
                tray: { x: 40, y: 520 },
                steps: [
                    'Place the mouse on the hot plate (55 °C) inside the cylinder and record the <b>basal reaction time</b> (paw licking or jumping).',
                    'Choose a treatment group and click the syringe to <b>draw up the dose</b>.',
                    'Drag the syringe onto the mouse in the holding cage to administer the drug.',
                    'Wait until <b>30 min</b> and record the reaction time.',
                    'Repeat at <b>60</b> and <b>90 min</b>. Remove the mouse immediately after the response.',
                    'Compare groups — cut-off <b>15 s</b> to prevent paw injury.'
                ],
                treatments: [
                    { id: 'saline', name: 'Normal saline 10 mL/kg i.p.', short: 'Saline', cls: 'Vehicle control', color: '#64748b', mpe: 0, peak: 40, route: 'i.p.' },
                    { id: 'morphine', name: 'Morphine 5 mg/kg s.c.', short: 'Morphine', cls: 'μ-opioid agonist', color: '#0d9488', mpe: 0.85, peak: 45, route: 's.c.' },
                    { id: 'tramadol', name: 'Tramadol 20 mg/kg i.p.', short: 'Tramadol', cls: 'Weak μ agonist + SNRI', color: '#6366f1', mpe: 0.5, peak: 35, route: 'i.p.' },
                    { id: 'aspirin', name: 'Aspirin 100 mg/kg p.o.', short: 'Aspirin', cls: 'NSAID (peripheral)', color: '#d97706', mpe: 0.07, peak: 50, route: 'p.o.' }
                ],
                table: ['Group', 'Time', 'Reaction (s)', 'Response'],
                chart: true, chartTitle: 'Hot-plate reaction time vs time',
                chartEmpty: { xMin: 0, xMax: 90, yMin: 0, yMax: 18, xTicks: [0, 30, 60, 90], xLabel: 'Time after drug (min)', yLabel: 'Reaction time (s)', annotations: [{ y: CUT, text: 'cut-off 15 s', color: '#f59e0b' }] },
                viva: [
                    { q: 'Which responses are timed on Eddy’s hot plate?', opts: ['Tail flick', 'Paw licking or jumping', 'Writhing', 'Righting reflex'], ans: 1, exp: 'Licking of a fore/hind paw or jumping off the plate are the end-points; they are supraspinally integrated responses.' },
                    { q: 'The hot-plate test differs from the tail-flick test in that it:', opts: ['Measures a supraspinally organised response', 'Uses chemical pain', 'Is only sensitive to NSAIDs', 'Uses electrical stimuli'], ans: 0, exp: 'Paw licking/jumping require supraspinal integration, whereas tail flick is mainly a spinal reflex. Both are sensitive to opioids.' },
                    { q: 'The plate temperature usually used is:', opts: ['37 °C', '45 °C', '55 ± 0.5 °C', '75 °C'], ans: 2, exp: '55 °C gives a clear response within a few seconds in normal mice without tissue injury when a cut-off is used.' },
                    { q: 'Why is the hot-plate test poorly sensitive to aspirin?', opts: ['Acute thermal nociception is not prostaglandin-mediated', 'Aspirin is not absorbed', 'Aspirin is a local anaesthetic', 'The plate is too cold'], ans: 0, exp: 'NSAIDs act mainly on inflammatory, PG-sensitised pain; they have little effect on phasic thermal pain in normal tissue.' }
                ],
                inferenceHint: 'Record the basal reaction time, give the drug and test at 30, 60 and 90 min.'
            };
        }

        setup() {
            this.results = {};
            this.mouseNo = 0;
            this.hotspots = [
                { x: CYL.x, y: CYL.top, w: CYL.w, h: PLATE.y - CYL.top - 10, label: 'Open-top acrylic cylinder (restricts the mouse to the plate)' },
                { x: PLATE.x - 130, y: PLATE.y - 8, w: 260, h: 20, label: 'Heated plate 55 ± 0.5 °C' },
                { x: 430, y: 350, w: 330, h: 70, label: 'Thermostat & reaction timer' },
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Holding cage' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.mouseNo++;
            this.mouse = new Rodent({ x: 160, y: CAGE.floor, scale: 1.35, facing: 1 });
            this.mouse.groundY = CAGE.floor;
            this.where = 'cage';
            this.cageTarget = 160;
            this.phase = 'basal';
            this.basal = null;
            this.injected = null;
            this.drugMin = null;
            this.readIdx = 0;
            this.trial = null;
            this.lastLat = 0;
            this.setStep(0);
            this._refresh();
        }

        _refresh() {
            const busy = this.busy || this.where !== 'cage';
            const ph = this.phase;
            if (ph === 'basal') {
                this.status('Plate at <b>55 °C</b>. Drop the mouse into the cylinder and time the first paw lick or jump.');
                this.actions([{ label: '▶ Place on hot plate — basal', primary: true, disabled: busy, onClick: () => this.runTrial() }]);
            } else if (ph === 'treat') {
                this.status(`Basal = <b>${this.basal.toFixed(1)} s</b>. Select a group, load the syringe and give <b>${this.tr.name}</b>.`);
                this.actions([{ label: '💉 Load & administer', primary: true, disabled: busy, onClick: () => this.autoInject() }]);
            } else if (ph === 'wait') {
                const t = TIMES[this.readIdx];
                this.status(`<b>${this.injected.short}</b> given. Next reading at <b>${t} min</b>.`);
                this.actions([{ label: `⏩ Wait until ${t} min`, primary: true, disabled: busy, onClick: () => this.wait() }]);
            } else if (ph === 'read') {
                const t = TIMES[this.readIdx];
                this.status(`T = ${t} min. Place the mouse on the plate and time the response.`);
                this.actions([{ label: `▶ Place on hot plate — ${t} min`, primary: true, disabled: busy, onClick: () => this.runTrial() }]);
            } else if (ph === 'done') {
                this.status('All readings done. Use a <b>fresh mouse</b> for the next group.');
                this.actions([{ label: '↺ Next mouse', primary: true, disabled: busy, onClick: () => this.resetAnimal() }]);
            }
        }

        getInjectZone() {
            if (this.phase !== 'treat' || this.where !== 'cage') return null;
            const m = this.mouse;
            if (this.tr && this.tr.route === 'p.o.') return { x: m.x + 36 * m.facing, y: m.y - 22, r: 24, label: 'Mouth (oral gavage)', angle: m.facing > 0 ? Math.PI - 0.3 : 0.3 };
            return { x: m.x - 4 * m.facing, y: m.y - 18, r: 26, label: this.tr && this.tr.route === 's.c.' ? 'Scruff (s.c.)' : 'Abdomen (i.p.)', angle: Math.PI / 2 - 0.35 };
        }
        onSelect() { if (this.phase === 'treat') this._refresh(); }

        onInjected(tr) {
            this.injected = tr;
            this.drugMin = 0;
            this.floatText(this.mouse.x, this.mouse.y - 50, `${tr.short} ${tr.route}`, '#fde68a');
            this.phase = 'wait';
            this.readIdx = 0;
            this.setStep(3);
            setTimeout(() => this._refresh(), 950);
        }

        wait() {
            const target = TIMES[this.readIdx], from = this.drugMin;
            this.timeLapse(target - from, 3.5, {
                label: 'Waiting',
                onTick: (s, p) => { this.drugMin = from + (target - from) * p; },
                onDone: () => { this.drugMin = target; this.phase = 'read'; this._refresh(); }
            });
            this._refresh();
        }

        _latency() {
            if (!this.injected) return M.clamp(M.gauss(6.2, 0.9), 3.8, 9);
            const d = this.injected, t = this.drugMin;
            const f = (t / d.peak) * Math.exp(1 - t / d.peak);
            return M.clamp(this.basal + (CUT - this.basal) * d.mpe * f + M.gauss(0, 0.6), 3, 17);
        }

        /* ---------- carry helpers ---------- */
        _carry(tx, ty, cb) {
            const m = this.mouse, sx = m.x, sy = m.y, r0 = m.rot;
            this.where = 'carry';
            m.set({ walk: 0, lick: 0, crouch: 0 });
            m.groundY = null;
            const hang = -Math.PI / 2 * m.facing;
            this.tw.add(0.3, e => { m.rot = M.lerp(r0, hang, e); m.y = sy - 40 * e; }, {
                onDone: () => this.tw.add(0.85, e => { m.x = M.lerp(sx, tx, e); m.y = M.lerp(sy - 40, ty - 80, e) - Math.sin(e * Math.PI) * 60; }, {
                    onDone: () => this.tw.add(0.35, e => { m.y = M.lerp(ty - 80, ty, e); m.rot = M.lerp(hang, 0, e); }, { onDone: cb })
                })
            });
        }

        runTrial() {
            if (this.busy) return;
            this.busy = true;
            const L = this._latency();
            this.trial = { t: 0, L: Math.min(L, CUT), cut: L >= CUT, kind: Math.random() < 0.7 ? 'lick' : 'jump', state: 'placing', target: PLATE.x };
            this.lastLat = 0;
            this._refresh();
            this.actions([]);
            this._carry(PLATE.x - 20, PLATE.y, () => {
                if (!this.trial) return;   // a fresh mouse was taken while it was being carried
                this.where = 'plate';
                this.mouse.groundY = PLATE.y;
                this.trial.state = 'run';
                this.status('On the plate — timer running. Watch for paw licking or jumping…');
            });
        }

        _respond() {
            const tr = this.trial, m = this.mouse;
            if (!tr) return;
            tr.state = 'resp';
            if (tr.cut) {
                this.floatText(m.x, m.y - 80, 'Cut-off 15 s — removed', '#fde68a');
                setTimeout(() => this._finish(), 500);
                return;
            }
            if (tr.kind === 'lick') {
                m.set({ walk: 0, lick: 1, sniff: 0 });
                this.floatText(m.x, m.y - 80, `Paw lick @ ${tr.L.toFixed(1)} s`, '#fda4af');
                setTimeout(() => { m.set({ lick: 0, sniff: 1 }); this._finish(); }, 1300);
            } else {
                m.set({ walk: 0, crouch: 1 });
                this.floatText(m.x, m.y - 80, `Jump @ ${tr.L.toFixed(1)} s`, '#fda4af');
                const y0 = m.y;
                this.tw.add(0.12, () => {}, {
                    onDone: () => { m.set({ crouch: 0, tonic: 0.35 }); this.tw.add(0.7, (e, p) => { m.y = y0 - Math.sin(p * Math.PI) * 120; m.rot = Math.sin(p * Math.PI) * -0.4 * m.facing; }, { ease: LAB.ease.linear, onDone: () => { m.set({ tonic: 0 }); m.rot = 0; this._finish(); } }); }
                });
            }
        }

        _finish() {
            const tr = this.trial;
            if (!tr) { this.busy = false; return; }
            const val = tr.cut ? CUT : tr.L;
            const resp = tr.cut ? 'none (cut-off)' : (tr.kind === 'lick' ? 'paw licking' : 'jumping');
            if (this.phase === 'basal') {
                this.basal = val;
                this.toast(`Basal reaction time: <b>${val.toFixed(1)} s</b> (${resp})`, 'success');
                this.phase = 'treat';
                this.setStep(1);
            } else {
                const t = TIMES[this.readIdx], g = this.injected;
                const r = (this.results[g.id] = this.results[g.id] || { basal: [] });
                if (this.readIdx === 0) r.basal.push(this.basal);
                (r[t] = r[t] || []).push(val);
                const pct = (val - this.basal) / this.basal * 100;
                this.addRow([`<b>${g.short}</b> · M${this.mouseNo}`, `${t} min`, `<b>${val.toFixed(1)}</b>`, resp], pct > 40 ? 'up' : '');
                this.toast(`${t} min: <b>${val.toFixed(1)} s</b> (${pct >= 0 ? '+' : ''}${pct.toFixed(0)}% vs basal)`, pct > 40 ? 'success' : 'info');
                this.readIdx++;
                if (this.readIdx >= TIMES.length) { this.phase = 'done'; this.setStep(5); this.markDone(g.id); }
                else { this.phase = 'wait'; this.setStep(4); }
                this._chart(); this._infer();
            }
            setTimeout(() => this._carry(160, CAGE.floor, () => {
                this.where = 'cage'; this.mouse.groundY = CAGE.floor; this.mouse.rot = 0; this.trial = null; this.busy = false; this._refresh();
            }), 300);
        }

        _chart() {
            const series = this.cfg.treatments.filter(t => this.results[t.id]).map(t => {
                const r = this.results[t.id];
                const pts = [[0, M.mean(r.basal)]];
                TIMES.forEach(tt => { if (r[tt]) pts.push([tt, M.mean(r[tt])]); });
                return { name: t.short, color: t.color, points: pts, markers: true };
            });
            this.chart.draw({ xMin: 0, xMax: 90, yMin: 0, yMax: 18, xTicks: [0, 30, 60, 90], xLabel: 'Time after drug (min)', yLabel: 'Reaction time (s)', series, annotations: [{ y: CUT, text: 'cut-off 15 s', color: '#f59e0b' }] });
        }

        _infer() {
            const R = this.results;
            let html = this.cfg.treatments.filter(t => R[t.id]).map(t => {
                const r = R[t.id], b = M.mean(r.basal);
                const peak = Math.max(...TIMES.filter(x => r[x]).map(x => M.mean(r[x])));
                return `<div class="kv"><span>${t.short}: basal → peak</span><span>${b.toFixed(1)} → ${peak.toFixed(1)} s</span></div>`;
            }).join('');
            const n = [];
            if (R.morphine) n.push('Morphine markedly prolongs the reaction time → <b>centrally acting (supraspinal) opioid analgesia</b>.');
            if (R.tramadol) n.push('Tramadol shows a moderate effect (weak μ agonism + monoamine reuptake inhibition).');
            if (R.aspirin) n.push('Aspirin barely changes the response — the hot plate is <b>insensitive to peripherally acting NSAIDs</b>.');
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        /* ---------- simulation ---------- */
        update(dt) {
            const m = this.mouse;
            let e = 0;
            if (this.injected && this.drugMin !== null) {
                const d = this.injected, f = this.drugMin > 0 ? (this.drugMin / d.peak) * Math.exp(1 - this.drugMin / d.peak) : 0;
                e = d.mpe * f * (d.id === 'aspirin' ? 0 : 1);
            }
            m.set({ sedation: e * 0.35, straub: this.injected && this.injected.id === 'morphine' ? e : 0 });
            if (this.where === 'cage') {
                const speed = 26 * (1 - e * 0.5);
                if (Math.abs(m.x - this.cageTarget) < 4 || Math.random() < dt * 0.05) this.cageTarget = M.rand(CAGE.x + 60, CAGE.x + CAGE.w - 60);
                const dir = Math.sign(this.cageTarget - m.x);
                const moving = Math.abs(this.cageTarget - m.x) > 4 && !this.inject;
                if (moving) { m.facing = dir; m.x += dir * speed * dt; }
                m.set({ walk: moving ? 1 : 0 });
                m.gaitSpeed = moving ? speed / 16 : 0;
                m.y = CAGE.floor;
            } else if (this.where === 'plate' && this.trial) {
                const tr = this.trial;
                if (tr.state === 'run') {
                    tr.t += dt;
                    this.lastLat = Math.min(tr.t, tr.L);
                    // restless walking inside the cylinder, paw lifting increases with time
                    if (Math.abs(m.x - tr.target) < 4) tr.target = M.rand(CYL.x + 60, CYL.x + CYL.w - 60);
                    const dir = Math.sign(tr.target - m.x), speed = 30 + 40 * Math.min(1, tr.t / tr.L) * (1 - e);
                    m.facing = dir; m.x += dir * speed * dt;
                    m.set({ walk: 1 }); m.gaitSpeed = speed / 15;
                    if (Math.random() < dt * (1 + 5 * tr.t / tr.L)) { const k = Math.floor(Math.random() * 4); m.jitter.legs[k] = -8; }
                    if (tr.t >= tr.L) this._respond();
                }
            }
            m.update(dt);
            // heat shimmer
            if (Math.random() < dt * 14) this.fx.emit({ x: PLATE.x + M.rand(-100, 100), y: PLATE.y - 4, vy: M.rand(-45, -25), vx: M.rand(-4, 4), r: M.rand(5, 9), grow: 10, life: 1.4, color: 'rgba(255,190,140,0.10)', shape: 'soft' });

            const tr = this.trial;
            this.hud('l', [{ k: 'Mouse', v: '#' + this.mouseNo }, { k: 'Group', v: this.injected ? this.injected.short : 'untreated' }]);
            this.hud('r', [
                { k: 'Reaction time', v: this.lastLat.toFixed(1) + ' s', tone: tr && tr.state === 'resp' ? (tr.cut ? 'warn' : 'good') : '' },
                { k: 'Plate', v: (55 + Math.sin(performance.now() / 2300) * 0.2).toFixed(1) + ' °C', tone: 'warn' },
                { k: 'Since drug', v: this.drugMin !== null ? Math.round(this.drugMin) + ' min' : '—' }
            ]);
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._drawCage(ctx, false);
            this._drawUnit(ctx);
            this._drawCylinder(ctx, false);
            if (this.where !== 'cage') this.mouse.draw(ctx);
            this._drawCylinder(ctx, true);
            if (this.where === 'cage') this.mouse.draw(ctx);
            this._drawCage(ctx, true);
        }

        _drawUnit(ctx) {
            const x = 410, w = 380, y = PLATE.y + 8, h = 432 - y;
            G.shadow(ctx, x + w / 2, 432, w * 0.62, 12, 0.5);
            const hg = ctx.createLinearGradient(0, y, 0, y + h);
            hg.addColorStop(0, '#e2e8f0'); hg.addColorStop(0.12, '#cbd5e1'); hg.addColorStop(1, '#8794a1');
            ctx.fillStyle = hg; G.rr(ctx, x, y, w, h, 8); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
            // plate (elliptical top) — colour shows heat
            const pg = ctx.createLinearGradient(PLATE.x - PLATE.rx, 0, PLATE.x + PLATE.rx, 0);
            pg.addColorStop(0, '#5a3b2e'); pg.addColorStop(0.35, '#c26b3a'); pg.addColorStop(0.5, '#e08a50'); pg.addColorStop(1, '#4a2d22');
            ctx.fillStyle = '#6b7280';
            ctx.beginPath(); ctx.ellipse(PLATE.x, PLATE.y + 6, PLATE.rx + 14, 18, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = pg;
            ctx.beginPath(); ctx.ellipse(PLATE.x, PLATE.y + 2, PLATE.rx, 13, 0, 0, Math.PI * 2); ctx.fill();
            const glow = ctx.createRadialGradient(PLATE.x, PLATE.y, 4, PLATE.x, PLATE.y, PLATE.rx * 1.2);
            glow.addColorStop(0, `rgba(255,140,60,${0.25 + 0.05 * Math.sin(performance.now() / 400)})`); glow.addColorStop(1, 'rgba(255,120,40,0)');
            ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(PLATE.x, PLATE.y, PLATE.rx * 1.2, 40, 0, 0, Math.PI * 2); ctx.fill();
            // panel
            G.metal(ctx, x + 18, y + 30, w - 36, h - 44, { r: 6, tone: 'dark' });
            const tr = this.trial;
            G.lcd(ctx, x + 32, y + 40, 110, 46, (55 + Math.sin(performance.now() / 2300) * 0.2).toFixed(1) + '°C', { label: 'PLATE TEMP', color: '#fb923c' });
            G.lcd(ctx, x + 152, y + 40, 130, 46, this.lastLat.toFixed(1).padStart(4, '0') + ' s', { label: 'REACTION TIME', color: tr && tr.state === 'resp' ? '#fb7185' : '#34f5c5' });
            G.led(ctx, x + 300, y + 52, 5, '#f97316', true);
            G.led(ctx, x + 300, y + 74, 5, '#22c55e', !!(tr && tr.state === 'run'));
            G.knob(ctx, x + 336, y + 63, 14, 0.4);
            G.text(ctx, "EDDY'S HOT PLATE", x + 20, y + 20, { size: 10, color: '#334155', weight: 800 });
        }

        _drawCylinder(ctx, front) {
            const x = CYL.x, w = CYL.w, top = CYL.top, bot = PLATE.y + 4;
            if (!front) {
                ctx.fillStyle = 'rgba(200,225,240,0.10)';
                ctx.fillRect(x, top, w, bot - top);
                ctx.strokeStyle = 'rgba(225,240,255,0.45)'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.ellipse(x + w / 2, top, w / 2, 12, 0, Math.PI, Math.PI * 2); ctx.stroke();
            } else {
                G.glass(ctx, x, top, w, bot - top, { r: 3, tint: 'rgba(200,225,240,0.05)', edge: 'rgba(225,240,255,0.55)' });
                ctx.strokeStyle = 'rgba(235,245,255,0.7)'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.ellipse(x + w / 2, top, w / 2, 12, 0, 0, Math.PI); ctx.stroke();
                ctx.beginPath(); ctx.ellipse(x + w / 2, bot, w / 2, 12, 0, 0, Math.PI); ctx.stroke();
                G.text(ctx, 'PERSPEX CYLINDER Ø 20 cm', x + w / 2, top - 18, { size: 9, color: 'rgba(226,232,240,0.7)', weight: 800, align: 'center' });
            }
        }

        _drawCage(ctx, front) {
            const c = CAGE;
            if (!front) {
                G.shadow(ctx, c.x + c.w / 2, c.y + c.h + 2, c.w * 0.6, 8, 0.4);
                ctx.fillStyle = 'rgba(210,225,235,0.18)';
                G.rr(ctx, c.x, c.y, c.w, c.h, 6); ctx.fill();
                const bg = ctx.createLinearGradient(0, c.floor - 6, 0, c.y + c.h);
                bg.addColorStop(0, '#d9b98a'); bg.addColorStop(1, '#a98455');
                ctx.fillStyle = bg; ctx.fillRect(c.x + 3, c.floor - 4, c.w - 6, c.y + c.h - c.floor + 1);
                ctx.fillStyle = 'rgba(120,84,40,0.5)';
                for (let i = 0; i < 40; i++) { const sx = c.x + 6 + (i * 53) % (c.w - 12), sy = c.floor - 3 + (i * 7) % 8; ctx.fillRect(sx, sy, 5, 1.6); }
            } else {
                G.glass(ctx, c.x, c.y, c.w, c.h, { r: 6, tint: 'rgba(200,225,240,0.07)' });
                ctx.strokeStyle = 'rgba(148,163,184,0.9)'; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(c.x - 4, c.y); ctx.lineTo(c.x + c.w + 4, c.y); ctx.stroke();
                G.text(ctx, 'HOLDING CAGE', c.x + 10, c.y + 16, { size: 9, color: 'rgba(226,232,240,0.7)', weight: 800 });
            }
        }
    }

    LAB.register(5, HotPlate);
})();
