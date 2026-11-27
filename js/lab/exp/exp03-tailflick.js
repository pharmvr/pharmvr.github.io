/**
 * EXP 3 — Analgesic activity: Tail-flick (radiant heat) analgesiometer
 * Flow: basal latency → choose group → s.c. injection → readings at 30, 60, 90 min.
 * The tail lies over the heat slot; the nichrome element glows, the tail warms and the
 * rat flicks its tail out of the beam at the reaction time (or the 10 s cut-off is reached).
 */
(function () {
    const { M, G, Rodent } = LAB;
    const TOP = 330;                 // unit top surface
    const TUBE = { x: 196, y: 262, w: 290, h: 70 };
    const HEAT_X = 590;              // radiant heat slot
    const CUT = 10;                  // s cut-off
    const TIMES = [30, 60, 90];
    const K = 1.3, PX = 495, PY = 430;          // composition zoom about the bench line
    const T = (x, y) => [PX + (x - PX) * K, PY + (y - PY) * K];
    const TR = r => { const [x, y] = T(r.x, r.y); return Object.assign({}, r, { x, y, w: r.w * K, h: r.h * K }); };

    /* rat with a controllable, restrained tail */
    class TailRat extends Rodent {
        constructor(o) { super(o); this.flick = 0; this.heat = 0; this.twitch = 0; }
        _tail(ctx, L) {
            const n = 20, seg = 5;
            let x = -45 * L, y = -18, a = Math.PI - 0.7;
            const pts = [[x, y]];
            for (let i = 0; i < n; i++) {
                if (y < -3.5) a = Math.PI - 0.7; else a = Math.PI;
                if (i >= 5) a += this.flick * (0.62 + (i - 5) * 0.06) + this.twitch * Math.sin(i * 0.8) * 0.05;
                x += Math.cos(a) * seg; y += Math.sin(a) * seg;
                if (y > -2) y = -2;
                pts.push([x, y]);
            }
            ctx.lineCap = 'round';
            for (let i = 0; i < pts.length - 1; i++) {
                const wx = this.x + pts[i][0] * this.scale * this.facing;
                const hot = this.heat * Math.max(0, 1 - Math.abs(wx - HEAT_X) / 26);
                const base = i % 2 ? '#f4b6c2' : '#eeaab8';
                ctx.strokeStyle = hot > 0.02 ? G.mix('#f0a9b7', '#e11d48', Math.min(1, hot)) : base;
                ctx.lineWidth = M.lerp(6.5, 1.8, i / pts.length);
                ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke();
            }
            // scale rings
            ctx.strokeStyle = 'rgba(190,110,130,0.35)'; ctx.lineWidth = 0.6;
            for (let i = 2; i < pts.length - 1; i += 1) {
                const [px, py] = pts[i], [qx, qy] = pts[i + 1];
                const nx = -(qy - py), ny = qx - px, d = Math.hypot(nx, ny) || 1, w = M.lerp(2.4, 0.7, i / pts.length);
                ctx.beginPath(); ctx.moveTo(px + nx / d * w, py + ny / d * w); ctx.lineTo(px - nx / d * w, py - ny / d * w); ctx.stroke();
            }
            this.tailTip = pts[pts.length - 1];
        }
    }

    class TailFlick extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 430 },
                tray: { x: 40, y: 520 },
                steps: [
                    'Rat placed in the restrainer with the tail over the radiant-heat slot (2–3 cm from the tip). Record the <b>basal reaction time</b>.',
                    'Choose a treatment group and click the syringe to <b>draw up the dose</b>.',
                    'Drag the syringe onto the rat to administer the drug (<b>s.c.</b> at the scruff; aspirin by oral gavage).',
                    'Wait until <b>30 min</b> and record the tail-flick latency.',
                    'Repeat the reading at <b>60</b> and <b>90 min</b>.',
                    'Calculate <b>% MPE</b> and compare groups (cut-off 10 s to avoid tissue damage).'
                ],
                treatments: [
                    { id: 'saline', name: 'Normal saline 1 mL/kg s.c.', short: 'Saline', cls: 'Vehicle control', color: '#64748b', mpe: 0, peak: 40 },
                    { id: 'morphine', name: 'Morphine 5 mg/kg s.c.', short: 'Morphine', cls: 'μ-opioid agonist', color: '#0d9488', mpe: 0.92, peak: 45 },
                    { id: 'pentaz', name: 'Pentazocine 10 mg/kg s.c.', short: 'Pentaz.', cls: 'κ agonist / weak μ partial agonist', color: '#6366f1', mpe: 0.52, peak: 30 },
                    { id: 'aspirin', name: 'Aspirin 100 mg/kg p.o.', short: 'Aspirin', cls: 'NSAID (peripheral COX)', color: '#d97706', mpe: 0.06, peak: 50 }
                ],
                table: ['Group', 'Time', 'Latency (s)', '% MPE'],
                chart: true, chartTitle: 'Tail-flick latency vs time',
                chartEmpty: { xMin: 0, xMax: 90, yMin: 0, yMax: 12, xTicks: [0, 30, 60, 90], xLabel: 'Time after drug (min)', yLabel: 'Latency (s)', annotations: [{ y: CUT, text: 'cut-off 10 s', color: '#f59e0b' }] },
                viva: [
                    { q: 'The tail-flick response is mainly a:', opts: ['Spinal reflex', 'Cortical response', 'Peripheral axon reflex', 'Cerebellar reflex'], ans: 0, exp: 'Tail withdrawal from radiant heat is a spinally integrated nociceptive reflex — hence sensitive to centrally acting (opioid) analgesics acting at the dorsal horn.' },
                    { q: 'Why is aspirin nearly inactive in the tail-flick test?', opts: ['It is not absorbed', 'Acute thermal pain is not prostaglandin-dependent; NSAIDs act on inflammatory pain', 'It blocks opioid receptors', 'The dose is lethal'], ans: 1, exp: 'NSAIDs reduce PG-mediated sensitisation of nociceptors; brief phasic heat pain in a non-inflamed tail is not PG-mediated.' },
                    { q: 'Why is a cut-off time (10–12 s) imposed?', opts: ['To prevent tissue (burn) damage to the tail', 'To save electricity', 'To measure LD₅₀', 'To allow the drug to be absorbed'], ans: 0, exp: 'An analgesic may abolish the response; prolonged heating would burn the tail and confound later readings.' },
                    { q: '% Maximum possible effect (MPE) is calculated as:', opts: ['(Test − Basal) / (Cut-off − Basal) × 100', 'Test / Basal × 100', '(Basal − Test) × 100', 'Cut-off / Test × 100'], ans: 0, exp: '%MPE normalises the increase in latency to the maximum measurable increase (up to the cut-off).' },
                    { q: 'Naloxone pretreatment would:', opts: ['Potentiate morphine', 'Abolish morphine-induced increase in latency', 'Have no effect', 'Cause convulsions'], ans: 1, exp: 'Naloxone is a competitive μ-opioid antagonist and reverses morphine analgesia, proving an opioid mechanism.' }
                ],
                inferenceHint: 'Record the basal latency, inject, and take readings at 30, 60 and 90 min.'
            };
        }

        setup() {
            this.results = {};
            this.ratNo = 0;
            this.hotspots = [
                { x: TUBE.x, y: TUBE.y, w: TUBE.w, h: TUBE.h, label: 'Acrylic rat restrainer' },
                { x: HEAT_X - 24, y: TOP - 14, w: 48, h: 26, label: 'Radiant heat slot (nichrome wire, focused)' },
                { x: 640, y: 352, w: 160, h: 60, label: 'Reaction timer — stops on tail flick (photocell)' },
                { x: 240, y: 352, w: 200, h: 60, label: 'Heat intensity & cut-off controller' }
            ].map(TR);
            this.resetAnimal();
        }

        resetAnimal() {
            this.ratNo++;
            this.rat = new TailRat({ x: 400, y: TOP - 5, scale: 1.45, kind: 'rat', facing: -1 });
            this.rat.shadow = false;
            this.rat.set({ sniff: 1 });
            this.phase = 'basal';
            this.basal = null;
            this.injected = null;
            this.drugMin = null;
            this.readIdx = 0;
            this.heat = null;
            this.lat = 0;
            this.series = [];
            this.setStep(0);
            this._refresh();
        }

        _refresh() {
            const busy = this.busy;
            const ph = this.phase;
            if (ph === 'basal') {
                this.status('Switch on the radiant heat and time the tail flick — this is the <b>basal reaction time</b> (normal 2–4 s).');
                this.actions([{ label: '🔥 Apply heat — basal', primary: true, disabled: busy, onClick: () => this.applyHeat() }]);
            } else if (ph === 'treat') {
                this.status(`Basal = <b>${this.basal.toFixed(2)} s</b>. Select a group, load the syringe and inject <b>${this.tr.name}</b>.`);
                this.actions([{ label: '💉 Load & inject', primary: true, disabled: busy, onClick: () => this.autoInject() }]);
            } else if (ph === 'wait') {
                const t = TIMES[this.readIdx];
                this.status(`<b>${this.injected.short}</b> given. Next reading at <b>${t} min</b>.`);
                this.actions([{ label: `⏩ Wait until ${t} min`, primary: true, disabled: busy, onClick: () => this.wait() }]);
            } else if (ph === 'read') {
                const t = TIMES[this.readIdx];
                this.status(`T = ${t} min. Apply heat and record the latency.`);
                this.actions([{ label: `🔥 Apply heat — ${t} min`, primary: true, disabled: busy, onClick: () => this.applyHeat() }]);
            } else if (ph === 'done') {
                this.status('All readings recorded for this rat. Use a <b>fresh rat</b> for the next group.');
                this.actions([{ label: '↺ Next rat', primary: true, disabled: busy, onClick: () => this.resetAnimal() }]);
            }
        }

        getInjectZone() {
            if (this.phase !== 'treat') return null;
            if (this.tr && this.tr.id === 'aspirin') {
                const [x, y] = T(this.rat.x - 66, TOP - 22);
                return { x, y, r: 26, label: 'Mouth (oral gavage)', angle: 0.25 };
            }
            const [x, y] = T(this.rat.x - 20, TUBE.y + 14);
            return { x, y, r: 28, label: 'Scruff of neck (s.c.)', angle: Math.PI / 2 - 0.5 };
        }
        onSelect() { if (this.phase === 'treat') this._refresh(); }

        onInjected(tr) {
            this.injected = tr;
            this.drugMin = 0;
            this.floatText(...T(this.rat.x - 20, TUBE.y - 20), `${tr.short} ${tr.id === 'aspirin' ? 'p.o.' : 's.c.'}`, '#fde68a');
            this.phase = 'wait';
            this.readIdx = 0;
            this.series = [[0, this.basal]];
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
            if (!this.injected) return M.clamp(M.gauss(3.2, 0.4), 2.1, 4.6);
            const d = this.injected, t = this.drugMin;
            const f = (t / d.peak) * Math.exp(1 - t / d.peak);
            return M.clamp(this.basal + (CUT - this.basal) * d.mpe * f + M.gauss(0, 0.35), 1.8, 12);
        }

        applyHeat() {
            if (this.busy) return;
            this.busy = true;
            const L = this._latency();
            this.heat = { t: 0, L: Math.min(L, CUT), cut: L >= CUT, done: false };
            this.lat = 0;
            this.actions([]);
            this.status('Radiant heat ON — watching the tail…');
        }

        _finishReading() {
            const h = this.heat;
            if (!h) return;   // a fresh animal was taken while this reading was pending
            if (this.phase !== 'basal' && !this.injected) { this.busy = false; return; }
            const val = h.cut ? CUT : h.L;
            if (this.phase === 'basal') {
                this.basal = val;
                this.toast(`Basal reaction time: <b>${val.toFixed(2)} s</b>`, 'success');
                this.phase = 'treat';
                this.setStep(1);
            } else {
                const t = TIMES[this.readIdx];
                const mpe = M.clamp((val - this.basal) / (CUT - this.basal) * 100, -50, 100);
                const g = this.injected;
                this.series.push([t, val]);
                this.addRow([`<b>${g.short}</b> · R${this.ratNo}`, `${t} min`, `<b>${val.toFixed(2)}</b>${h.cut ? ' (cut-off)' : ''}`, `${mpe.toFixed(0)}%`], mpe > 30 ? 'up' : '');
                (this.results[g.id] = this.results[g.id] || {})[t] = (this.results[g.id][t] || []).concat([{ lat: val, mpe }]);
                this.results[g.id].basal = (this.results[g.id].basal || []).concat(this.readIdx === 0 ? [this.basal] : []);
                this.toast(h.cut ? `Cut-off reached at ${t} min — heat switched off automatically.` : `${t} min: latency <b>${val.toFixed(2)} s</b> (%MPE ${mpe.toFixed(0)})`, mpe > 30 ? 'success' : 'info');
                this.readIdx++;
                if (this.readIdx >= TIMES.length) { this.phase = 'done'; this.setStep(5); this.markDone(g.id); }
                else { this.phase = 'wait'; this.setStep(4); }
                this._chart(); this._infer();
            }
            this.busy = false;
            this._refresh();
        }

        _chart() {
            const series = this.cfg.treatments.filter(t => this.results[t.id]).map(t => {
                const r = this.results[t.id];
                const pts = [[0, M.mean(r.basal || [3.2])]];
                TIMES.forEach(tt => { if (r[tt]) pts.push([tt, M.mean(r[tt].map(x => x.lat))]); });
                return { name: t.short, color: t.color, points: pts, markers: true };
            });
            this.chart.draw({ xMin: 0, xMax: 90, yMin: 0, yMax: 12, xTicks: [0, 30, 60, 90], xLabel: 'Time after drug (min)', yLabel: 'Latency (s)', series, annotations: [{ y: CUT, text: 'cut-off 10 s', color: '#f59e0b' }] });
        }

        _infer() {
            const R = this.results;
            let html = this.cfg.treatments.filter(t => R[t.id]).map(t => {
                const best = Math.max(...TIMES.filter(x => R[t.id][x]).map(x => M.mean(R[t.id][x].map(y => y.mpe))));
                return `<div class="kv"><span>${t.short} — peak %MPE</span><span>${best.toFixed(0)}%</span></div>`;
            }).join('');
            const n = [];
            if (R.morphine) n.push('Morphine produces a marked, sustained rise in latency (peak 30–60 min) → <b>potent central (spinal/supraspinal) analgesia</b> via μ receptors.');
            if (R.pentaz) n.push('Pentazocine gives a moderate effect (partial agonist ceiling).');
            if (R.aspirin) n.push('Aspirin is practically <b>inactive</b> — tail-flick detects centrally acting analgesics, not NSAIDs.');
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        update(dt) {
            const r = this.rat;
            const h = this.heat;
            // opioid → mild sedation in the restrainer
            if (this.injected && this.drugMin !== null) {
                const d = this.injected, t = this.drugMin;
                const f = t > 0 ? (t / d.peak) * Math.exp(1 - t / d.peak) : 0;
                r.set({ sedation: d.mpe * f * 0.45, sniff: 1 - d.mpe * f * 0.6 });
            }
            if (h && !h.done) {
                h.t += dt;
                this.lat = Math.min(h.t, h.L);
                r.heat = Math.min(1, h.t / Math.max(2, h.L)) * 0.9;
                r.twitch = h.t > h.L * 0.7 ? 1 : 0;
                if (h.t >= h.L) {
                    h.done = true;
                    if (!h.cut) {
                        // flick! tail whips out of the beam
                        this.tw.add(0.12, e => { r.flick = e; }, { ease: LAB.ease.out, onDone: () => this.tw.add(0.9, e => { r.flick = 1 - e; }, { delay: 0.5 }) });
                        r.jitter.b = -3; r.jitter.h = -0.2;
                        this.floatText(...T(HEAT_X + 20, TOP - 90), `Flick! ${h.L.toFixed(2)} s`, '#fda4af');
                    } else {
                        this.floatText(...T(HEAT_X, TOP - 70), 'Cut-off 10 s — no flick', '#fde68a');
                    }
                    // resolve only this trial: a fresh animal taken meanwhile replaces this.heat
                    setTimeout(() => { if (this.heat === h) this._finishReading(); }, 700);
                }
            } else {
                r.heat = Math.max(0, r.heat - dt * 0.5);
                r.twitch = 0;
            }
            this.glow = M.approach(this.glow || 0, h && !h.done ? 1 : 0, h && !h.done ? 3 : 5, dt);
            if (this.glow > 0.3 && Math.random() < dt * 30) this.fx.emit({ x: T(HEAT_X + M.rand(-6, 6), 0)[0], y: T(0, TOP - 6)[1], vy: M.rand(-50, -25), vx: M.rand(-5, 5), r: M.rand(4, 8), grow: 8, life: 0.9, color: 'rgba(255,170,90,0.25)', shape: 'soft' });
            r.update(dt);
            this.hud('l', [{ k: 'Rat', v: '#' + this.ratNo }, { k: 'Group', v: this.injected ? this.injected.short : 'untreated' }]);
            this.hud('r', [
                { k: 'Reaction time', v: this.lat.toFixed(2) + ' s', tone: h && h.done ? (h.cut ? 'warn' : 'good') : '' },
                { k: 'Cut-off', v: CUT + ' s' },
                { k: 'Since injection', v: this.drugMin !== null ? Math.round(this.drugMin) + ' min' : '—' }
            ]);
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(PX, PY); ctx.scale(K, K); ctx.translate(-PX, -PY);
            this._drawUnit(ctx);
            this._drawTubeBack(ctx);
            this.rat.draw(ctx);
            this._drawTubeFront(ctx);
            this._drawHeatBeam(ctx);
            ctx.restore();
        }

        _drawUnit(ctx) {
            const x = 150, w = 690, y = TOP, h = 100;
            G.shadow(ctx, x + w / 2, 432, w * 0.55, 10, 0.5);
            // top deck
            G.metal(ctx, x - 6, y - 8, w + 12, 12, { r: 3, tone: 'steel' });
            const hg = ctx.createLinearGradient(0, y, 0, y + h);
            hg.addColorStop(0, '#e5e9ee'); hg.addColorStop(0.1, '#cfd6dd'); hg.addColorStop(1, '#9aa4ae');
            ctx.fillStyle = hg; G.rr(ctx, x, y + 4, w, h - 4, 6); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
            // tail groove
            ctx.fillStyle = '#5b6470'; G.rr(ctx, 480, y - 6, 220, 5, 2); ctx.fill();
            // heat window
            const gl = this.glow || 0;
            G.metal(ctx, HEAT_X - 24, y - 9, 48, 9, { r: 2, tone: 'dark' });
            ctx.fillStyle = gl > 0.02 ? G.mix('#3b0a05', '#ffb347', gl) : '#1f2329';
            G.rr(ctx, HEAT_X - 12, y - 7, 24, 5, 2); ctx.fill();
            // front panel: controller (left) & timer (right)
            G.metal(ctx, 230, y + 20, 230, 66, { r: 5, tone: 'dark' });
            G.text(ctx, 'INTENSITY', 250, y + 38, { size: 9, color: '#94a3b8', weight: 800 });
            G.knob(ctx, 268, y + 62, 15, -2.2 + 0.4 * 6);
            G.lcd(ctx, 300, y + 30, 70, 44, '6', { label: 'LEVEL', color: '#fbbf24' });
            G.lcd(ctx, 380, y + 30, 66, 44, CUT + 's', { label: 'CUT-OFF', color: '#7dd3fc' });
            // nichrome element view-port
            const vx = 520, vy = y + 24;
            G.metal(ctx, vx - 6, vy - 6, 92, 58, { r: 6, tone: 'dark' });
            ctx.fillStyle = '#0b0d10'; G.rr(ctx, vx, vy, 80, 46, 4); ctx.fill();
            ctx.save();
            if (gl > 0.02) { ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 16 * gl; }
            ctx.strokeStyle = gl > 0.02 ? G.mix('#5b2a12', '#ffd27a', gl) : '#4b2a1a'; ctx.lineWidth = 3;
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) { const px = vx + 8 + i * 1.6, py = vy + 23 + Math.sin(i * 1.2) * 9; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
            ctx.stroke(); ctx.restore();
            G.text(ctx, 'NICHROME', vx + 40, vy + 58, { size: 8, color: '#475569', weight: 800, align: 'center' });
            const h0 = this.heat;
            G.lcd(ctx, 640, y + 24, 150, 54, this.lat.toFixed(2).padStart(5, '0') + ' s', { label: 'REACTION TIME', color: h0 && h0.done && !h0.cut ? '#fb7185' : '#34f5c5' });
            G.led(ctx, 812, y + 38, 5, '#f97316', gl > 0.5);
            G.led(ctx, 812, y + 62, 5, '#22c55e', !(h0 && !h0.done));
            G.text(ctx, 'TAIL-FLICK ANALGESIOMETER', x + 14, y + h - 6, { size: 9, color: '#334155', weight: 800 });
        }

        _drawTubeBack(ctx) {
            const { x, y, w, h } = TUBE;
            const g = ctx.createLinearGradient(0, y, 0, y + h);
            g.addColorStop(0, 'rgba(190,215,235,0.22)'); g.addColorStop(1, 'rgba(120,150,175,0.18)');
            ctx.fillStyle = g; G.rr(ctx, x, y, w, h, h / 2); ctx.fill();
            // support cradles
            [x + 40, x + w - 60].forEach(cx => G.metal(ctx, cx, y + h - 4, 22, TOP - (y + h) + 2, { r: 2, tone: 'steel' }));
        }

        _drawTubeFront(ctx) {
            const { x, y, w, h } = TUBE;
            G.glass(ctx, x, y, w, h, { r: h / 2, tint: 'rgba(200,225,240,0.08)', edge: 'rgba(225,240,255,0.7)' });
            // ventilation holes & adjustable nose cone
            ctx.fillStyle = 'rgba(15,23,42,0.25)';
            for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + 60 + i * 30, y + 12, 3, 0, Math.PI * 2); ctx.fill(); }
            ctx.fillStyle = 'rgba(148,163,184,0.55)'; G.rr(ctx, x - 6, y + 4, 14, h - 8, 5); ctx.fill();
            // tail-end cap with slot
            G.metal(ctx, x + w - 10, y + 2, 16, h - 4, { r: 4, tone: 'steel', vertical: true });
            ctx.fillStyle = '#1e293b'; G.rr(ctx, x + w - 6, y + h - 28, 8, 20, 3); ctx.fill();
            G.text(ctx, 'RESTRAINER', x + 18, y - 8, { size: 9, color: 'rgba(226,232,240,0.75)', weight: 800 });
        }

        _drawHeatBeam(ctx) {
            const gl = this.glow || 0;
            if (gl < 0.02) return;
            ctx.save();
            const g = ctx.createRadialGradient(HEAT_X, TOP - 6, 2, HEAT_X, TOP - 6, 40);
            g.addColorStop(0, `rgba(255,200,120,${0.55 * gl})`); g.addColorStop(1, 'rgba(255,120,40,0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(HEAT_X, TOP - 6, 40, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    LAB.register(3, TailFlick);
})();
