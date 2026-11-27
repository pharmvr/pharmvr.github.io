/**
 * EXP 2 — CNS stimulant / depressant activity: Digital Actophotometer (top-down view)
 * Flow: basal 10-min count → choose group → load syringe → i.p. injection → 30 min absorption
 *       → post-drug 10-min count → record → repeat with a fresh mouse.
 * Counts are produced ONLY when the simulated mouse's body centre actually crosses one of the
 * six infrared beams drawn in the arena.
 */
(function () {
    const { M, G, RodentTop } = LAB;
    const AR = { x: 262, y: 58, s: 424 };          // arena floor (interior)
    const NB = 3;                                  // beams per axis
    const BX = [...Array(NB)].map((_, i) => AR.x + AR.s * (i + 1) / (NB + 1));
    const BY = [...Array(NB)].map((_, i) => AR.y + AR.s * (i + 1) / (NB + 1));
    const SESSION = 600;                           // s (10 min)
    const TL = 20;                                 // time-lapse factor during a session

    class Actophotometer extends LAB.LabEngine {
        config() {
            return {
                steps: [
                    'Place the mouse in the actophotometer and record the <b>basal locomotor count for 10 min</b>.',
                    'Choose a treatment group, then click the syringe on the tray to <b>draw up the dose</b>.',
                    'Drag the syringe onto the mouse to inject <b>intraperitoneally</b>.',
                    'Wait <b>30 min</b> for absorption.',
                    'Record the <b>post-drug count for 10 min</b> (beam interruptions).',
                    'Repeat with a fresh mouse for each group and compare the % change.'
                ],
                treatments: [
                    { id: 'saline', name: 'Normal saline 10 mL/kg', short: 'Saline', cls: 'Vehicle control', color: '#64748b', speed: 55, pause: 3.0 },
                    { id: 'caffeine', name: 'Caffeine 20 mg/kg i.p.', short: 'Caffeine', cls: 'CNS stimulant (adenosine antagonist)', color: '#16a34a', speed: 66, pause: 1.1 },
                    { id: 'dzp', name: 'Diazepam 5 mg/kg i.p.', short: 'DZP 5', cls: 'CNS depressant (GABA-A)', color: '#f59e0b', speed: 38, pause: 6.5 },
                    { id: 'cpz', name: 'Chlorpromazine 3 mg/kg i.p.', short: 'CPZ 3', cls: 'Neuroleptic (D₂ block) — sedation', color: '#dc2626', speed: 30, pause: 9.5 }
                ],
                table: ['Group', 'Basal', 'Post-drug', '% change'],
                chart: true, chartTitle: 'Locomotor counts / 10 min',
                chartEmpty: { xMin: 0, xMax: 4, yMin: 0, yMax: 500, yLabel: 'Counts / 10 min', xTicks: [] },
                viva: [
                    { q: 'How does the actophotometer quantify locomotor activity?', opts: ['By weighing the animal', 'By counting interruptions of infrared/photocell beams as the animal moves', 'By rectal temperature', 'By ECG telemetry'], ans: 1, exp: 'Each time the animal crosses a light beam, the photocell circuit is interrupted and a digital count is registered.' },
                    { q: 'Caffeine increases locomotor counts mainly by:', opts: ['Blocking adenosine A₁/A₂A receptors', 'Activating GABA-A receptors', 'Blocking D₂ receptors', 'Inhibiting MAO'], ans: 0, exp: 'Adenosine is an inhibitory neuromodulator; caffeine antagonises A₁/A₂A receptors, disinhibiting dopaminergic transmission → psychomotor stimulation.' },
                    { q: 'Why is the basal count of each mouse recorded before the drug?', opts: ['To calibrate the beam', 'Animals vary; each mouse serves as its own control', 'To induce tolerance', 'To measure LD₅₀'], ans: 1, exp: 'Spontaneous activity varies widely between mice; comparing post-drug counts with the same animal’s basal count reduces variability.' },
                    { q: 'Why should the test be done in a quiet, dimly lit room at the same time of day?', opts: ['Rodents are nocturnal and activity is influenced by light, noise and circadian rhythm', 'The beam needs darkness only', 'To reduce the drug dose', 'It does not matter'], ans: 0, exp: 'Environmental stimuli and circadian phase strongly alter exploratory locomotion; standard conditions are essential.' }
                ],
                tray: { x: 36, y: 516 },
                inferenceHint: 'Record basal and post-drug counts for at least two groups.'
            };
        }

        drawBackground(ctx) {
            if (!this._bg) {
                const c = document.createElement('canvas');
                const dpr = Math.min(2, window.devicePixelRatio || 1);
                c.width = this.W * dpr; c.height = this.H * dpr;
                const x = c.getContext('2d'); x.scale(dpr, dpr);
                topBench(x, this.W, this.H);
                this._bg = c;
            }
            ctx.drawImage(this._bg, 0, 0, this.W, this.H);
        }

        setup() {
            this.results = {};
            this.mouseNo = 0;
            this.flash = {};
            this.hotspots = [
                { x: AR.x - 30, y: BY[0] - 10, w: 30, h: 20, label: 'IR emitter (infra-red LED)' },
                { x: AR.x + AR.s, y: BY[1] - 10, w: 30, h: 20, label: 'Photocell receiver' },
                { x: AR.x + 40, y: AR.y + 40, w: AR.s - 80, h: AR.s - 80, label: 'Arena 30 × 30 cm — 6 IR beams' },
                { x: 712, y: 110, w: 226, h: 300, label: 'Digital counter: beam-break counts & timer' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.mouseNo++;
            this.mouse = new RodentTop({ x: AR.x + AR.s / 2, y: AR.y + AR.s / 2, heading: -0.5, scale: 1.55, maxSpeed: 55, turnRate: 7 });
            this.beh = { mode: 'pause', t: 1 };
            this.phase = 'baseline';
            this.session = null;
            this.count = 0;
            this.lastT = 0;
            this.basal = null;
            this.injected = null;
            this.effect = 0;
            this.drugT = null;
            this.setStep(0);
            this._refresh();
        }

        _refresh() {
            const busy = this.busy;
            const ph = this.phase;
            if (ph === 'baseline') {
                this.status('Mouse placed in the arena. Start a <b>10-min basal recording</b> — every beam break is counted.');
                this.actions([{ label: '▶ Record basal (10 min)', primary: true, disabled: busy, onClick: () => this.runSession(false) }]);
            } else if (ph === 'treat') {
                this.status(`Basal = <b>${this.basal} counts</b>. Select a group, click the syringe to load <b>${this.tr.name}</b>, then drag it onto the mouse.`);
                this.actions([{ label: '💉 Load & inject', primary: true, disabled: busy, onClick: () => this.autoInject() }]);
            } else if (ph === 'absorb') {
                this.status(`<b>${this.injected.name}</b> given i.p. Allow 30 min for absorption.`);
                this.actions([{ label: '⏩ Wait 30 min', primary: true, disabled: busy, onClick: () => this.wait() }]);
            } else if (ph === 'test') {
                this.status('Absorption complete. Record the <b>post-drug count</b> for 10 min.');
                this.actions([{ label: '▶ Record post-drug (10 min)', primary: true, disabled: busy, onClick: () => this.runSession(true) }]);
            } else if (ph === 'done') {
                this.status('Recorded. Take a <b>fresh mouse</b> for the next group.');
                this.actions([{ label: '↺ Next mouse', primary: true, disabled: busy, onClick: () => this.resetAnimal() }]);
            } else this.actions([]);
        }

        getInjectZone() {
            if (this.phase !== 'treat' || this.session) return null;
            return { x: this.mouse.x, y: this.mouse.y, r: 28, label: 'Mouse (i.p.)', angle: Math.PI / 2 - 0.45 };
        }
        onSelect() { if (this.phase === 'treat') this._refresh(); }

        onInjected(tr) {
            this.injected = tr;
            this.drugT = 0;
            this.floatText(this.mouse.x, this.mouse.y - 30, `${tr.short} i.p.`, '#fde68a');
            this.phase = 'absorb';
            this.setStep(3);
            setTimeout(() => this._refresh(), 950);
        }

        wait() {
            this.timeLapse(30, 4.5, {
                label: 'Absorption',
                onTick: (s, p) => { this.drugT = 30 * p; },
                onDone: () => { this.phase = 'test'; this.setStep(4); this._refresh(); }
            });
            this._refresh();
        }

        runSession(post) {
            if (this.busy) return;
            this.busy = true;
            this.count = 0;
            this.lastT = 0;
            this.session = { post, t: 0 };
            this.setStep(post ? 4 : 0);
            this.actions([]);
            this.status(`Recording ${post ? 'post-drug' : 'basal'} activity… (time-lapse ×${TL})`);
        }

        _endSession() {
            const s = this.session;
            this.lastT = s.t;
            this.session = null;
            this.busy = false;
            if (!s.post) {
                this.basal = this.count;
                this.toast(`Basal count: <b>${this.count}</b> beam breaks / 10 min`, 'success');
                this.phase = 'treat';
                this.setStep(1);
            } else {
                const g = this.injected;
                const ch = (this.count - this.basal) / Math.max(1, this.basal) * 100;
                (this.results[g.id] = this.results[g.id] || []).push({ basal: this.basal, post: this.count });
                this.addRow([`<b>${g.short}</b> · M${this.mouseNo}`, this.basal, `<b>${this.count}</b>`, `${ch >= 0 ? '+' : ''}${ch.toFixed(0)}%`], ch > 15 ? 'up' : (ch < -15 ? 'down' : ''));
                this.markDone(g.id);
                this.toast(`${g.short}: <b>${this.count}</b> counts (${ch >= 0 ? '+' : ''}${ch.toFixed(0)}% vs basal)`, ch > 15 ? 'success' : (ch < -15 ? 'warn' : 'info'));
                this.phase = 'done';
                this.setStep(5);
                this._chart(); this._infer();
            }
            this._refresh();
        }

        _chart() {
            const ids = this.cfg.treatments.filter(t => this.results[t.id]);
            const b = [], p = [];
            ids.forEach((t, i) => {
                const r = this.results[t.id];
                b.push([i + 1, M.mean(r.map(x => x.basal)), M.sem(r.map(x => x.basal))]);
                p.push([i + 1, M.mean(r.map(x => x.post)), M.sem(r.map(x => x.post))]);
            });
            const ymax = Math.max(300, ...p.map(v => v[1] * 1.2), ...b.map(v => v[1] * 1.2));
            this.chart.draw({
                xMin: 0.4, xMax: Math.max(2, ids.length) + 0.6, yMin: 0, yMax: Math.ceil(ymax / 100) * 100,
                xTicks: ids.map((_, i) => i + 1), xFmt: v => (ids[v - 1] || {}).short || '',
                yLabel: 'Counts / 10 min', barCount: Math.max(2, ids.length) + 0.2,
                series: [
                    { name: 'Basal', color: '#94a3b8', type: 'bar', points: b, barWidth: 0.36, offset: -0.5 },
                    { name: 'Post-drug', color: '#0d9488', type: 'bar', points: p, barWidth: 0.36, offset: 0.5, labels: true }
                ]
            });
        }

        _infer() {
            const R = this.results;
            const pct = id => M.mean(R[id].map(x => (x.post - x.basal) / x.basal * 100));
            let html = this.cfg.treatments.filter(t => R[t.id]).map(t => `<div class="kv"><span>${t.short}</span><span>${pct(t.id) >= 0 ? '+' : ''}${pct(t.id).toFixed(0)}%</span></div>`).join('');
            const notes = [];
            if (R.caffeine) notes.push('Caffeine <b>increases</b> beam-break counts → CNS stimulant (adenosine A₁/A₂A antagonism).');
            if (R.dzp || R.cpz) notes.push(`${R.cpz ? 'Chlorpromazine' : 'Diazepam'}${R.cpz && R.dzp ? ' and diazepam' : ''} <b>decrease</b> counts → CNS depressant / sedative activity.`);
            if (R.saline) notes.push('Saline shows only minor change (habituation).');
            this.infer(html + (notes.length ? `<p style="margin-top:8px">${notes.join(' ')}</p>` : ''));
        }

        /* ---------- simulation ---------- */
        _params() {
            const sal = this.cfg.treatments[0];
            const d = this.injected || sal;
            const e = this.effect;
            return { speed: M.lerp(sal.speed, d.speed, e), pause: M.lerp(sal.pause, d.pause, e) };
        }

        _pickTarget() {
            const m = 30;
            let x, y;
            if (Math.random() < 0.62) { // thigmotaxis: run along walls
                const side = Math.floor(Math.random() * 4), u = M.rand(m, AR.s - m), w = M.rand(m, m + 34);
                [x, y] = [[u, w], [AR.s - w, u], [u, AR.s - w], [w, u]][side];
            } else { x = M.rand(m, AR.s - m); y = M.rand(m, AR.s - m); }
            return [AR.x + x, AR.y + y];
        }

        _substep(h) {
            const ms = this.mouse, b = this.beh, P = this._params();
            if (b.mode === 'pause') {
                b.t -= h;
                ms.target = null;
                if (b.t <= 0) {
                    const [tx, ty] = this._pickTarget();
                    ms.goTo(tx, ty, P.speed * M.rand(0.8, 1.25));
                    b.mode = 'move';
                    ms.groom = 0; ms.rearing = 0;
                }
            } else if (ms.atTarget) {
                b.mode = 'pause';
                b.t = -Math.log(Math.random() + 1e-6) * P.pause;
                b.kind = Math.random();
            }
            const px = ms.x, py = ms.y;
            ms.update(h);
            ms.x = M.clamp(ms.x, AR.x + 22, AR.x + AR.s - 22);
            ms.y = M.clamp(ms.y, AR.y + 22, AR.y + AR.s - 22);
            // beam crossings (body centre)
            BX.forEach((bx, i) => { if ((px - bx) * (ms.x - bx) < 0) this._hit('x' + i); });
            BY.forEach((by, i) => { if ((py - by) * (ms.y - by) < 0) this._hit('y' + i); });
        }

        _hit(key) {
            this.flash[key] = 1;
            if (this.session) this.count++;
        }

        update(dt) {
            if (this.injected && this.drugT !== null) {
                const target = 1 - Math.exp(-this.drugT / 8);
                this.effect = M.approach(this.effect, target, 3, dt);
            }
            const ms = this.mouse;
            const t0 = ms.t, ph0 = ms.phase;
            const scale = this.session ? TL : (this.lapsing ? 6 : 1);
            const simDt = dt * scale;
            const n = Math.max(1, Math.ceil(simDt / (1 / 60)));
            if (!this.inject) for (let i = 0; i < n; i++) this._substep(simDt / n);
            // keep the cosmetic animation (tail, gait) at real speed
            ms.t = t0 + dt;
            ms.phase = (ph0 + Math.min(ms.speed, 140) * dt / 22) % 1;
            const pausing = this.beh.mode === 'pause';
            ms.groom = pausing && this.beh.kind < 0.4 ? 1 : 0;
            ms.rearing = M.approach(ms.rearing, pausing && this.beh.kind > 0.75 ? 1 : 0, 6, dt);
            for (const k in this.flash) this.flash[k] = Math.max(0, this.flash[k] - dt * 2.5);

            if (this.session) {
                this.session.t += simDt;
                if (this.session.t >= SESSION) { this.session.t = SESSION; this._endSession(); }
            }
            const st = this.session ? this.session.t : (this.lastT || 0);
            this.hud('l', [{ k: 'Mouse', v: '#' + this.mouseNo }, { k: 'Group', v: this.injected ? this.injected.short : 'untreated' }]);
            this.hud('r', [
                { k: 'Counts', v: String(this.count) },
                { k: 'Session', v: mmss(st) + ' / 10:00' },
                { k: 'Since injection', v: this.drugT !== null ? Math.round(this.drugT) + ' min' : '—' }
            ]);
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._drawClipboard(ctx);
            this._drawArena(ctx);
            this.mouse.draw(ctx);
            this._drawBeams(ctx);
            this._drawCounter(ctx);
        }

        _drawArena(ctx) {
            const { x, y, s } = AR, wall = 26;
            G.shadow(ctx, x + s / 2 + 10, y + s / 2 + 14, s * 0.72, s * 0.62, 0.45);
            // outer housing
            const og = ctx.createLinearGradient(x - wall, y - wall, x + s + wall, y + s + wall);
            og.addColorStop(0, '#4b5563'); og.addColorStop(0.5, '#2f3640'); og.addColorStop(1, '#1b2027');
            ctx.fillStyle = og; G.rr(ctx, x - wall, y - wall, s + wall * 2, s + wall * 2, 10); ctx.fill();
            // inner walls (bevel to suggest depth)
            const walls = [
                [[x - wall + 6, y - wall + 6], [x + s + wall - 6, y - wall + 6], [x + s, y], [x, y], '#8d99a6'],
                [[x + s + wall - 6, y - wall + 6], [x + s + wall - 6, y + s + wall - 6], [x + s, y + s], [x + s, y], '#5e6976'],
                [[x - wall + 6, y + s + wall - 6], [x + s + wall - 6, y + s + wall - 6], [x + s, y + s], [x, y + s], '#46505b'],
                [[x - wall + 6, y - wall + 6], [x - wall + 6, y + s + wall - 6], [x, y + s], [x, y], '#727e8b']
            ];
            walls.forEach(w => { ctx.fillStyle = w[4]; ctx.beginPath(); ctx.moveTo(...w[0]); ctx.lineTo(...w[1]); ctx.lineTo(...w[2]); ctx.lineTo(...w[3]); ctx.closePath(); ctx.fill(); });
            // floor — perforated stainless plate
            const fg = ctx.createRadialGradient(x + s * 0.4, y + s * 0.35, 20, x + s / 2, y + s / 2, s * 0.75);
            fg.addColorStop(0, '#e6ebf0'); fg.addColorStop(1, '#b4bec8');
            ctx.fillStyle = fg; ctx.fillRect(x, y, s, s);
            ctx.fillStyle = 'rgba(71,85,105,0.22)';
            for (let i = 12; i < s; i += 16) for (let j = 12; j < s; j += 16) { ctx.beginPath(); ctx.arc(x + i, y + j, 1.6, 0, Math.PI * 2); ctx.fill(); }
            // inner shadow at walls
            const isd = 18;
            [[x, y, s, isd, 0, 1], [x, y, isd, s, 1, 0]].forEach(([a, b, w, h, gx, gy]) => {
                const g = ctx.createLinearGradient(a, b, a + gx * isd, b + gy * isd);
                g.addColorStop(0, 'rgba(15,23,42,0.35)'); g.addColorStop(1, 'rgba(15,23,42,0)');
                ctx.fillStyle = g; ctx.fillRect(a, b, w, h);
            });
            // screws
            [[x - wall + 12, y - wall + 12], [x + s + wall - 12, y - wall + 12], [x - wall + 12, y + s + wall - 12], [x + s + wall - 12, y + s + wall - 12]].forEach(([a, b]) => G.screw(ctx, a, b, 3.5));
            // emitters (left & top walls) and receivers (right & bottom walls)
            BY.forEach((by, i) => { this._sensor(ctx, x - 16, by, true, this.flash['y' + i]); this._sensor(ctx, x + s + 16, by, false, this.flash['y' + i]); });
            BX.forEach((bx, i) => { this._sensor(ctx, bx, y - 16, true, this.flash['x' + i]); this._sensor(ctx, bx, y + s + 16, false, this.flash['x' + i]); });
            // cable to counter
            ctx.strokeStyle = '#111827'; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(x + s + wall, y + s - 40); ctx.bezierCurveTo(x + s + 60, y + s - 20, 690, 420, 724, 380); ctx.stroke();
            G.text(ctx, 'ARENA · 30 × 30 cm', x + 8, y + s + wall - 6, { size: 9, color: 'rgba(226,232,240,0.55)', weight: 800 });
        }

        _sensor(ctx, x, y, emitter, flash) {
            G.metal(ctx, x - 8, y - 6, 16, 12, { r: 3, tone: 'dark' });
            G.led(ctx, x, y, 3, emitter ? '#ef4444' : (flash > 0.1 ? '#facc15' : '#22c55e'), emitter || flash > 0.1 || true);
        }

        _drawBeams(ctx) {
            const { x, y, s } = AR;
            ctx.save();
            const t = performance.now() / 1000;
            const beam = (x1, y1, x2, y2, f) => {
                ctx.strokeStyle = f > 0.05 ? `rgba(255,70,70,${0.35 + 0.6 * f})` : 'rgba(255,60,60,0.22)';
                ctx.lineWidth = f > 0.05 ? 2 + f * 2 : 1.2;
                ctx.setLineDash(f > 0.05 ? [] : [10, 6]);
                ctx.lineDashOffset = -t * 30;
                ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = f > 0.05 ? 10 * f : 3;
                ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
            };
            BY.forEach((by, i) => beam(x, by, x + s, by, this.flash['y' + i] || 0));
            BX.forEach((bx, i) => beam(bx, y, bx, y + s, this.flash['x' + i] || 0));
            ctx.restore();
        }

        _drawCounter(ctx) {
            const x = 716, y = 112, w = 222, h = 292;
            G.shadow(ctx, x + w / 2, y + h + 6, w * 0.6, 10, 0.5);
            G.metal(ctx, x, y, w, h, { r: 10, tone: 'dark' });
            G.metal(ctx, x + 10, y + 10, w - 20, h - 20, { r: 7, tone: 'steel' });
            G.text(ctx, 'DIGITAL ACTOPHOTOMETER', x + w / 2, y + 30, { size: 10.5, color: '#1e293b', weight: 800, align: 'center' });
            G.lcd(ctx, x + 22, y + 44, w - 44, 70, String(this.count).padStart(4, '0'), { label: 'BEAM-BREAK COUNTS', color: '#34f5c5' });
            const st = this.session ? this.session.t : (this.lastT || 0);
            G.lcd(ctx, x + 22, y + 126, w - 44, 50, mmss(st), { label: 'ELAPSED (mm:ss)', color: '#fbbf24' });
            // per-beam indicators
            G.text(ctx, 'BEAMS', x + 22, y + 198, { size: 9, color: '#334155', weight: 800 });
            ['x0', 'x1', 'x2', 'y0', 'y1', 'y2'].forEach((k, i) => G.led(ctx, x + 32 + i * 30, y + 214, 5, '#ef4444', (this.flash[k] || 0) > 0.1));
            G.led(ctx, x + 32, y + 250, 5, '#22c55e', !!this.session);
            G.text(ctx, this.session ? 'RECORDING' : 'STANDBY', x + 44, y + 254, { size: 10, color: '#1e293b', weight: 700 });
            G.knob(ctx, x + w - 40, y + 248, 15, -0.6);
        }

        _drawClipboard(ctx) {
            const x = 24, y = 116, w = 196, h = 270;
            ctx.save();
            ctx.translate(x + w / 2, y + h / 2); ctx.rotate(-0.05); ctx.translate(-w / 2, -h / 2);
            G.shadow(ctx, w / 2 + 6, h / 2 + 8, w * 0.62, h * 0.55, 0.35);
            ctx.fillStyle = '#8b5a2b'; G.rr(ctx, 0, 0, w, h, 8); ctx.fill();
            ctx.fillStyle = '#fdfdf8'; ctx.fillRect(10, 22, w - 20, h - 32);
            G.metal(ctx, w / 2 - 34, -6, 68, 24, { r: 5, tone: 'chrome' });
            G.text(ctx, 'Locomotor record', 22, 48, { size: 12, color: '#1e293b', weight: 800 });
            ctx.strokeStyle = 'rgba(59,130,246,0.25)'; ctx.lineWidth = 1;
            for (let ly = 62; ly < h - 16; ly += 18) { ctx.beginPath(); ctx.moveTo(16, ly); ctx.lineTo(w - 16, ly); ctx.stroke(); }
            const lines = [`Mouse #${this.mouseNo}`, `Basal: ${this.basal !== null ? this.basal : '—'}`, `Group: ${this.injected ? this.injected.short : '—'}`];
            this.rows.slice(-6).forEach(r => lines.push(r.cells[0].replace(/<[^>]+>/g, '') + ' → ' + String(r.cells[2]).replace(/<[^>]+>/g, '')));
            lines.forEach((l, i) => G.text(ctx, l, 20, 76 + i * 18, { size: 11, color: '#1d4ed8', weight: 500, font: '"Segoe Print", "Bradley Hand", cursive' }));
            ctx.restore();
        }
    }

    function mmss(s) { const m = Math.floor(s / 60), r = Math.floor(s % 60); return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0'); }

    /** top-down epoxy bench */
    function topBench(ctx, W, H) {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#2b333d'); g.addColorStop(1, '#151a20');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.06;
        for (let i = 0; i < 2200; i++) { ctx.fillStyle = Math.random() < 0.5 ? '#fff' : '#000'; ctx.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2); }
        ctx.globalAlpha = 1;
        const lg = ctx.createRadialGradient(W * 0.45, H * 0.3, 40, W * 0.5, H * 0.5, W * 0.7);
        lg.addColorStop(0, 'rgba(255,255,240,0.10)'); lg.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    }
    LAB.topBench = LAB.topBench || topBench;

    LAB.register(2, Actophotometer);
})();
