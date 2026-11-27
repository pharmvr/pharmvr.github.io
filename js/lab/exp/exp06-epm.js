/**
 * EXP 6 — Anxiolytic activity: Elevated Plus Maze (mouse)
 * Overhead-camera view of a plus-shaped maze (2 open + 2 enclosed arms, 50 cm above floor).
 * Flow: treat in home cage → 30 min absorption → place mouse on centre facing an open arm →
 * 5-min video-tracked session → % open-arm entries & % open-arm time.
 * The mouse's arm choices, dwell times, head dips, rearing and stretched-attend postures are
 * driven by an anxiety profile set by the drug (diazepam ↑ open-arm exploration, picrotoxin ↓).
 */
(function () {
    const { M, G, RodentTop } = LAB;
    const C = { x: 470, y: 270 };     // maze centre
    const HW = 27;                    // half arm width (≈ 5 cm)
    const AL = 192;                   // arm length (≈ 35 cm)
    const PXCM = 5.4;
    const SESSION = 300;              // s
    const CAGE = { x: 34, y: 96, w: 190, h: 178 };
    const PANEL = { x: 726, y: 64, w: 218, h: 318 };
    const ARMS = {
        oL: { ux: -1, uy: 0, open: true, label: 'Open arm' },
        oR: { ux: 1, uy: 0, open: true, label: 'Open arm' },
        cU: { ux: 0, uy: -1, open: false, label: 'Closed arm' },
        cD: { ux: 0, uy: 1, open: false, label: 'Closed arm' }
    };

    class PlusMaze extends LAB.LabEngine {
        config() {
            return {
                tray: { x: 40, y: 520 },
                steps: [
                    'Select a treatment group, click the syringe to <b>draw up the dose</b> and inject the mouse in its home cage (i.p.).',
                    'Allow <b>30 min</b> for drug absorption.',
                    'Pick up the mouse and <b>drop it on the central platform</b>, facing an open arm.',
                    'Record behaviour for <b>5 min</b> by overhead video tracking.',
                    'Note open/closed arm <b>entries</b> (all four paws inside) and <b>time</b> spent in each arm.',
                    'Calculate <b>% open-arm entries</b> and <b>% open-arm time</b>; compare with the control group.'
                ],
                treatments: [
                    { id: 'saline', name: 'Normal saline 10 mL/kg i.p.', short: 'Saline', cls: 'Vehicle control', color: '#64748b', pOpen: 0.22, openStay: 9, closedStay: 32, depth: 0.55, speed: 44, sap: 0.55, freeze: 0.01 },
                    { id: 'dzp1', name: 'Diazepam 1 mg/kg i.p.', short: 'DZP 1', cls: 'BZD — anxiolytic dose', color: '#0d9488', pOpen: 0.44, openStay: 19, closedStay: 22, depth: 0.85, speed: 42, sap: 0.25, freeze: 0.005 },
                    { id: 'dzp2', name: 'Diazepam 2 mg/kg i.p.', short: 'DZP 2', cls: 'BZD — higher dose (mild sedation)', color: '#6366f1', pOpen: 0.52, openStay: 25, closedStay: 20, depth: 0.92, speed: 31, sap: 0.15, freeze: 0.004 },
                    { id: 'picro', name: 'Picrotoxin 1 mg/kg i.p.', short: 'Picrotoxin', cls: 'GABA-A antagonist — anxiogenic', color: '#e11d48', pOpen: 0.07, openStay: 4, closedStay: 48, depth: 0.32, speed: 50, sap: 0.85, freeze: 0.05 }
                ],
                table: ['Group', 'Open entries', 'Closed entries', '% OAE', '% OAT'],
                chart: true, chartTitle: '% open-arm entries & time',
                chartEmpty: this._chartOpts([]),
                viva: [
                    { q: 'The elevated plus maze is based on the natural conflict between:', opts: ['Hunger and thirst', 'Exploration of a novel area and fear of open, elevated spaces', 'Pain and analgesia', 'Sleep and wakefulness'], ans: 1, exp: 'Rodents have an innate aversion to open, elevated, brightly lit spaces (thigmotaxis) that competes with their drive to explore novelty.' },
                    { q: 'An anxiolytic drug in the EPM characteristically:', opts: ['Decreases total arm entries only', 'Increases % open-arm entries and % open-arm time', 'Increases time in the closed arms', 'Produces catalepsy'], ans: 1, exp: 'Benzodiazepines selectively increase the proportion of entries into and time spent on the open arms without (at anxiolytic doses) reducing total activity.' },
                    { q: 'An arm entry is counted when:', opts: ['The snout enters the arm', 'All four paws are inside the arm', 'The mouse looks into the arm', 'The tail crosses the centre'], ans: 1, exp: 'The standard criterion is all four paws in the arm; total (open + closed) entries are an index of general locomotor activity.' },
                    { q: 'Why is closed-arm entry count useful?', opts: ['It measures anxiety directly', 'It is an index of locomotor activity, to rule out sedation/stimulation', 'It measures analgesia', 'It is not used'], ans: 1, exp: 'A sedative dose reduces closed-arm and total entries; a pure anxiolytic changes the open-arm proportion while closed entries stay similar.' },
                    { q: 'Picrotoxin reduces open-arm exploration because it:', opts: ['Blocks the GABA-A receptor chloride channel', 'Is a 5-HT1A agonist', 'Is a BZD agonist', 'Blocks Na⁺ channels'], ans: 0, exp: 'Picrotoxin is a non-competitive GABA-A channel blocker; reduced GABAergic inhibition is anxiogenic (and convulsant at higher doses).' },
                    { q: 'Ethological measures such as head dips and stretched-attend postures indicate:', opts: ['Risk assessment behaviour', 'Motor incoordination', 'Analgesia', 'Hypothermia'], ans: 0, exp: 'Stretched-attend postures (risk assessment) are reduced, and head dipping over the open-arm edge is increased, by anxiolytics.' }
                ],
                inferenceHint: 'Run at least the saline control and one diazepam group to compare open-arm exploration.'
            };
        }

        _chartOpts(series) {
            const trs = this.cfg ? this.cfg.treatments : [];
            return {
                xMin: 0.4, xMax: 4.6, yMin: 0, yMax: 100, xTicks: [1, 2, 3, 4], barCount: 4,
                xFmt: v => (trs[v - 1] ? trs[v - 1].short : ''), xLabel: 'Group', yLabel: '% of total', series
            };
        }

        setup() {
            this.timeScale = 10;
            this.results = {};
            this.mouseNo = 0;
            this.controls(`
                <div class="lab2-card-h"><span>Session time-lapse</span></div>
                <div class="lab2-seg" id="epm-speed">
                    <button data-s="5">×5</button><button data-s="10" class="active">×10</button><button data-s="20">×20</button>
                </div>
                <div class="lab2-field" style="margin-top:10px">
                    <label><span><input type="checkbox" id="epm-trail" checked> Show tracking path</span></label>
                </div>
                <p style="font-size:.72rem;color:#64748b;margin-top:4px">Overhead camera, dim light (~50 lux). Maze 50 cm above the floor; arms 35 × 5 cm, closed-arm walls 15 cm.</p>`);
            this.ctrl.querySelectorAll('#epm-speed button').forEach(b => b.onclick = () => this._setSpeed(+b.dataset.s));
            this.showTrail = true;
            this.ctrl.querySelector('#epm-trail').onchange = e => { this.showTrail = e.target.checked; };
            this.hotspots = [
                { x: C.x - HW - AL, y: C.y - HW, w: AL - 10, h: HW * 2, label: 'Open arm — no walls, 0.5 cm lip' },
                { x: C.x + HW + 10, y: C.y - HW, w: AL - 10, h: HW * 2, label: 'Open arm — no walls, 0.5 cm lip' },
                { x: C.x - HW, y: C.y - HW - AL, w: HW * 2, h: AL - 10, label: 'Closed (enclosed) arm — 15 cm walls' },
                { x: C.x - HW, y: C.y + HW + 10, w: HW * 2, h: AL - 10, label: 'Closed (enclosed) arm — 15 cm walls' },
                { x: C.x - HW, y: C.y - HW, w: HW * 2, h: HW * 2, label: 'Central platform 5 × 5 cm' },
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Home cage' },
                { x: PANEL.x, y: PANEL.y, w: PANEL.w, h: PANEL.h, label: 'Video-tracking read-out' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            // bumped on every fresh animal: callbacks from animations started for the
            // previous animal check it and bail out instead of mutating new state
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.mouseNo++;
            this.mouse = new RodentTop({ x: CAGE.x + CAGE.w / 2, y: CAGE.y + CAGE.h / 2, heading: -0.6, scale: 1.18, maxSpeed: 32, turnRate: 9 });
            this.where = 'cage';
            this.phase = 'treat';
            this.injected = null;
            this.prof = null;
            this.drugMin = null;
            this.sess = null;
            this.trail = [];
            this.setStep(0);
            this._refresh();
        }

        _refresh() {
            const busy = this.busy;
            const ph = this.phase;
            if (ph === 'treat') {
                this.status(`Select a group, click the syringe to load <b>${this.tr.name}</b> and drag it onto the mouse.`);
                this.actions([{ label: '💉 Load & inject', primary: true, disabled: busy, onClick: () => this.autoInject() }]);
            } else if (ph === 'absorb') {
                this.status(`<b>${this.injected.name}</b> given. Allow 30 min before testing.`);
                this.actions([{ label: '⏩ Wait 30 min', primary: true, disabled: busy, onClick: () => this.wait() }]);
            } else if (ph === 'place') {
                this.status('Drag the mouse from the home cage onto the <b>central platform</b> (it will face an open arm).');
                this.actions([{ label: '🐭 Place on maze centre', primary: true, disabled: busy, onClick: () => this.place() }]);
            } else if (ph === 'run') {
                const left = this.sess ? Math.max(0, SESSION - this.sess.t) : SESSION;
                this.status(`Recording… <b>${Math.ceil(left)} s</b> of the 5-min session remain. Arm entries and dwell times are logged by the tracker.`);
                this.actions([{
                    label: this.timeScale >= 20 ? '▶ Normal speed' : '⏩ Speed up ×20',
                    always: true,
                    onClick: () => this._setSpeed(this.timeScale >= 20 ? 10 : 20)
                }]);
            } else if (ph === 'done') {
                this.status('Session complete. Clean the maze with 70% ethanol and take a <b>fresh mouse</b>.');
                this.actions([{ label: '↺ Next mouse', primary: true, disabled: busy, onClick: () => this.resetAnimal() }]);
            }
        }

        onSelect() { if (this.phase === 'treat') this._refresh(); }

        _setSpeed(v) {
            this.timeScale = v;
            this.ctrl.querySelectorAll('#epm-speed button').forEach(x => x.classList.toggle('active', +x.dataset.s === v));
            this._refresh();
        }

        getInjectZone() {
            if (this.phase !== 'treat' || this.where !== 'cage') return null;
            return { x: this.mouse.x, y: this.mouse.y, r: 28, label: 'Mouse (i.p.)', angle: Math.PI / 2 - 0.45 };
        }

        onInjected(tr) {
            this.injected = tr;
            const v = k => tr[k] * M.clamp(M.gauss(1, 0.14), 0.7, 1.3);
            this.prof = { pOpen: M.clamp(v('pOpen'), 0.02, 0.8), openStay: v('openStay'), closedStay: v('closedStay'), depth: M.clamp(v('depth'), 0.25, 1), speed: v('speed'), sap: tr.sap, freeze: tr.freeze };
            this.drugMin = 0;
            this.floatText(this.mouse.x, this.mouse.y - 30, `${tr.short} i.p.`, '#fde68a');
            this.phase = 'absorb';
            this.setStep(1);
            setTimeout(() => this._refresh(), 950);
        }

        wait() {
            const gen = this.gen;
            this.timeLapse(30, 3.5, {
                label: 'Absorption',
                onTick: (s, p) => { if (gen === this.gen) this.drugMin = 30 * p; },
                onDone: () => { if (gen !== this.gen) return; this.phase = 'place'; this.setStep(2); this._refresh(); }
            });
            this._refresh();
        }

        /* ---------- pick & drop the mouse ---------- */
        _nearMouse(x, y) { return this.where === 'cage' && Math.hypot(x - this.mouse.x, y - this.mouse.y) < 36; }
        cursorAt(x, y) { return this.phase === 'place' && this._nearMouse(x, y); }
        onPointerDown(x, y) {
            if (this.phase === 'place' && this._nearMouse(x, y)) { this.drag = { kind: 'mouse', x, y }; this.where = 'held'; }
            else if (this.phase === 'place') this.toast('Grab the mouse in the home cage.', 'info');
        }
        onPointerUp(x, y) {
            if (!this.drag || this.drag.kind !== 'mouse') return;
            const d = this.drag; this.drag = null;
            if (Math.hypot(d.x - C.x, d.y - C.y) < 70) {
                this.mouse.x = d.x; this.mouse.y = d.y;
                this.place(true);
            } else {
                this.where = 'cage';
                this.mouse.x = M.clamp(this.mouse.x, CAGE.x + 30, CAGE.x + CAGE.w - 30);
                this.mouse.y = M.clamp(this.mouse.y, CAGE.y + 30, CAGE.y + CAGE.h - 30);
                this.toast('Drop the mouse on the glowing <b>central platform</b>.', 'warn');
            }
        }

        place(fromDrag) {
            if (this.busy && !fromDrag) return;
            if (!this.injected) { this.toast('Treat the mouse before testing it on the maze.', 'warn'); return; }
            const gen = this.gen;
            const m = this.mouse;
            this.busy = true;
            this.where = 'carry';
            m.target = null; m.speed = 0;
            const sx = m.x, sy = m.y, h0 = m.heading;
            const face = Math.random() < 0.5 ? 0 : Math.PI;   // face an open arm
            let dh = face - h0; while (dh > Math.PI) dh -= Math.PI * 2; while (dh < -Math.PI) dh += Math.PI * 2;
            this.tw.add(fromDrag ? 0.35 : 0.9, e => {
                m.x = M.lerp(sx, C.x, e); m.y = M.lerp(sy, C.y, e) - (fromDrag ? 0 : Math.sin(e * Math.PI) * 50);
                m.heading = h0 + dh * e;
            }, { onDone: () => { if (gen !== this.gen) return; this.busy = false; this._start(); } });
        }

        _start() {
            if (!this.injected) return;
            const m = this.mouse;
            this.where = 'maze';
            m.distance = 0;
            this.trail = [{ x: m.x, y: m.y }];
            this.sess = { t: 0, tOpen: 0, tClosed: 0, tCentre: 0, oe: 0, ce: 0, dips: 0, rears: 0, saps: 0, arm: null, lastZone: 'centre' };
            this.beh = { mode: 'wait', t: M.rand(1.5, 4), path: [], stayArm: null, wT: 0, kind: 'sap' };
            this.sess.saps++;
            this.phase = 'run';
            this.setStep(3);
            this._refresh();
        }

        /* ---------- behaviour ---------- */
        _armPoint(id, depth, lat = 0) {
            const a = ARMS[id], d = HW + depth;
            return { x: C.x + a.ux * d + (-a.uy) * lat, y: C.y + a.uy * d + a.ux * lat };
        }

        _decide() {
            const P = this.prof, b = this.beh;
            const open = Math.random() < P.pOpen;
            const ids = open ? ['oL', 'oR'] : ['cU', 'cD'];
            let id = ids[Math.random() < 0.5 ? 0 : 1];
            if (id === b.stayArm && Math.random() < 0.65) id = ids[0] === id ? ids[1] : ids[0];
            const maxD = (open ? P.depth : M.rand(0.6, 1)) * (AL - 14);
            const depth = M.clamp(M.rand(0.45, 1) * maxD, 22, AL - 14);
            const path = [{ x: C.x + M.rand(-6, 6), y: C.y + M.rand(-6, 6) }];
            // stretched-attend posture at the centre before committing (risk assessment)
            if (Math.random() < P.sap * (open ? 1 : 0.4)) path[0].wait = M.rand(1.5, 4), path[0].sap = true;
            path.push(Object.assign(this._armPoint(id, depth, M.rand(-7, 7)), { stay: open ? M.gauss(P.openStay, P.openStay * 0.35) : M.gauss(P.closedStay, P.closedStay * 0.35), arm: id, maxD: depth }));
            b.mode = 'path'; b.path = path; b.stayArm = null;
            this._nextPt();
        }

        _nextPt() {
            const b = this.beh, m = this.mouse, p = b.path.shift();
            if (!p) { this._decide(); return; }
            b.cur = p;
            m.goTo(p.x, p.y, this.prof.speed);
        }

        _beh(sdt) {
            const b = this.beh, m = this.mouse, s = this.sess, P = this.prof;
            if (b.mode === 'path') {
                if (m.atTarget) {
                    const p = b.cur;
                    if (p && p.sap) { b.mode = 'wait'; b.t = p.wait; b.kind = 'sap'; s.saps++; m.target = null; }
                    else if (p && p.stay !== undefined) { b.mode = 'stay'; b.t = Math.max(2, p.stay); b.stayArm = p.arm; b.maxD = p.maxD; b.wT = M.rand(1, 3); m.target = null; }
                    else this._nextPt();
                }
            } else if (b.mode === 'wait') {
                b.t -= sdt;
                m.rearing = b.kind === 'sap' ? 0 : m.rearing;
                if (b.t <= 0) { b.mode = 'path'; this._nextPt(); }
            } else if (b.mode === 'stay') {
                b.t -= sdt;
                const arm = ARMS[b.stayArm];
                if (m.atTarget) {
                    b.wT -= sdt;
                    if (b.wT <= 0) {
                        b.wT = M.rand(2, 5);
                        const r = Math.random();
                        if (arm.open && r < 0.35) {
                            // head dip over the open-arm edge
                            const side = Math.random() < 0.5 ? -1 : 1;
                            const cur = Math.abs(arm.ux ? m.x - C.x : m.y - C.y) - HW;
                            const pt = this._armPoint(b.stayArm, M.clamp(cur, 20, b.maxD), side * (HW - 9));
                            m.goTo(pt.x, pt.y, P.speed * 0.5);
                            s.dips++;
                            this.floatText(pt.x, pt.y - 22, 'head dip', '#a7f3d0');
                        } else if (!arm.open && r < 0.4) {
                            s.rears++;
                            this.tw.add(1.6, (e, p) => { m.rearing = Math.sin(p * Math.PI); }, { ease: LAB.ease.linear });
                        } else {
                            const pt = this._armPoint(b.stayArm, M.rand(20, b.maxD), M.rand(-9, 9));
                            m.goTo(pt.x, pt.y, P.speed * 0.6);
                        }
                    }
                }
                if (Math.random() < sdt * P.freeze) { m.freeze = 1; this.tw.wait(M.rand(0.6, 1.4), () => { m.freeze = 0; }); }
                if (b.t <= 0) this._decide();
            }
        }

        _zone(x, y) {
            const dx = x - C.x, dy = y - C.y;
            if (Math.abs(dx) <= HW && Math.abs(dy) <= HW) return 'centre';
            return Math.abs(dy) <= HW ? 'open' : 'closed';
        }

        _clampToMaze(m) {
            const mg = 10;
            let dx = m.x - C.x, dy = m.y - C.y;
            if (Math.abs(dx) > HW - 2) dy = M.clamp(dy, -(HW - mg), HW - mg);
            else if (Math.abs(dy) > HW - 2) dx = M.clamp(dx, -(HW - mg), HW - mg);
            dx = M.clamp(dx, -(HW + AL - mg), HW + AL - mg);
            dy = M.clamp(dy, -(HW + AL - mg), HW + AL - mg);
            m.x = C.x + dx; m.y = C.y + dy;
        }

        _track(sdt) {
            const s = this.sess, m = this.mouse;
            const z = this._zone(m.x, m.y);
            if (z === 'open') s.tOpen += sdt; else if (z === 'closed') s.tClosed += sdt; else s.tCentre += sdt;
            // entry = whole body (all four paws) beyond the centre square
            const dx = m.x - C.x, dy = m.y - C.y;
            let arm = null;
            if (Math.abs(dy) <= HW && Math.abs(dx) > HW + 14) arm = dx < 0 ? 'oL' : 'oR';
            else if (Math.abs(dx) <= HW && Math.abs(dy) > HW + 14) arm = dy < 0 ? 'cU' : 'cD';
            if (arm && arm !== s.arm) {
                s.arm = arm;
                if (ARMS[arm].open) { s.oe++; this.floatText(m.x, m.y - 26, 'open entry', '#5eead4'); }
                else s.ce++;
            }
            if (z === 'centre') s.arm = null;
            const last = this.trail[this.trail.length - 1];
            if (!last || Math.hypot(last.x - m.x, last.y - m.y) > 4) { this.trail.push({ x: m.x, y: m.y }); if (this.trail.length > 900) this.trail.shift(); }
        }

        _finish() {
            const s = this.sess, g = this.injected;
            if (!s || !g) { this.sess = null; this.where = 'cage'; return; }
            const tot = s.oe + s.ce;
            const oae = tot ? s.oe / tot * 100 : 0;
            const oat = (s.tOpen + s.tClosed) > 0 ? s.tOpen / (s.tOpen + s.tClosed) * 100 : 0;
            (this.results[g.id] = this.results[g.id] || []).push({ oe: s.oe, ce: s.ce, oae, oat, dips: s.dips, saps: s.saps, dist: this.mouse.distance / PXCM / 100 });
            this.addRow([`<b>${g.short}</b> · M${this.mouseNo}`, s.oe, s.ce, `<b>${oae.toFixed(0)}</b>`, `<b>${oat.toFixed(0)}</b>`], oat > 30 ? 'up' : '');
            this.toast(`5-min session: <b>${oae.toFixed(0)}%</b> open entries, <b>${oat.toFixed(0)}%</b> open time, ${s.dips} head dips`, oat > 30 ? 'success' : 'info', 3600);
            this.markDone(g.id);
            this.phase = 'done';
            this.where = 'maze-end';
            this.mouse.target = null;
            this.setStep(5);
            this._refresh();
            this._chart(); this._infer();
        }

        _chart() {
            const trs = this.cfg.treatments;
            const ent = [], tim = [];
            trs.forEach((t, i) => {
                const r = this.results[t.id];
                if (!r) return;
                ent.push([i + 1, M.mean(r.map(x => x.oae)), r.length > 1 ? M.sem(r.map(x => x.oae)) : 0]);
                tim.push([i + 1, M.mean(r.map(x => x.oat)), r.length > 1 ? M.sem(r.map(x => x.oat)) : 0]);
            });
            this.chart.draw(this._chartOpts([
                { name: '% open entries', color: '#0d9488', type: 'bar', points: ent, offset: -0.5, barWidth: 0.34 },
                { name: '% open time', color: '#6366f1', type: 'bar', points: tim, offset: 0.5, barWidth: 0.34 }
            ]));
        }

        _infer() {
            const R = this.results, avg = (id, k) => M.mean(R[id].map(x => x[k]));
            let html = this.cfg.treatments.filter(t => R[t.id]).map(t =>
                `<div class="kv"><span>${t.short} (n=${R[t.id].length}) OAE / OAT</span><span>${avg(t.id, 'oae').toFixed(0)}% / ${avg(t.id, 'oat').toFixed(0)}%</span></div>`).join('');
            const n = [];
            if (R.saline) {
                const b = avg('saline', 'oat');
                ['dzp1', 'dzp2'].forEach(id => {
                    if (!R[id]) return;
                    const d = avg(id, 'oat'), ce = avg(id, 'ce'), cs = avg('saline', 'ce');
                    n.push(`${id === 'dzp1' ? 'Diazepam 1 mg/kg' : 'Diazepam 2 mg/kg'} raised open-arm time from ${b.toFixed(0)}% to ${d.toFixed(0)}% → <b>anxiolytic</b>${ce < cs * 0.75 ? ' (fewer closed entries suggest some sedation)' : ' with unchanged locomotion'}.`);
                });
                if (R.picro) n.push(`Picrotoxin reduced open-arm exploration to ${avg('picro', 'oat').toFixed(0)}% → <b>anxiogenic</b> (GABA-A blockade).`);
            } else if (Object.keys(R).length) n.push('Run the <b>saline control</b> group to compare.');
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        /* ---------- simulation ---------- */
        update(dt) {
            const m = this.mouse;
            if (this.where === 'cage') {
                const frozen = this.inject || this.syringeFill > 0 || this.phase === 'place' && this.ptr.down;
                if (!frozen && (m.atTarget || Math.random() < dt * 0.08)) m.goTo(M.rand(CAGE.x + 34, CAGE.x + CAGE.w - 34), M.rand(CAGE.y + 34, CAGE.y + CAGE.h - 34), 30 * (1 - (this.prof && this.drugMin > 10 ? (1 - this.prof.speed / 44) : 0)));
                if (frozen) m.target = null;
                m.update(dt);
                m.x = M.clamp(m.x, CAGE.x + 24, CAGE.x + CAGE.w - 24);
                m.y = M.clamp(m.y, CAGE.y + 24, CAGE.y + CAGE.h - 24);
            } else if (this.where === 'held' && this.drag) {
                m.x = this.drag.x; m.y = this.drag.y; m.t += dt;
            } else if (this.where === 'maze' && this.sess) {
                let sdt = dt * this.timeScale;
                if (this.sess.t + sdt > SESSION) sdt = Math.max(0, SESSION - this.sess.t);
                const n = Math.max(1, Math.ceil(sdt / 0.04)), h = sdt / n;
                for (let i = 0; i < n; i++) {
                    this._beh(h);
                    m.update(h);
                    this._clampToMaze(m);
                    this._track(h);
                }
                this.sess.t += sdt;
                if (this.sess.t >= SESSION) this._finish();
            } else if (this.where === 'maze-end') {
                m.update(dt * 0.5);
            }
            const s = this.sess;
            this.hud('l', [{ k: 'Mouse', v: '#' + this.mouseNo }, { k: 'Group', v: this.injected ? this.injected.short : 'untreated' }]);
            this.hud('r', this.phase === 'run' ? [{ k: 'Speed', v: '×' + this.timeScale, tone: 'warn' }] : [{ k: 'Since drug', v: this.drugMin !== null ? Math.round(this.drugMin) + ' min' : '—' }]);
        }

        /* ---------- drawing ---------- */
        drawBackground(ctx) {
            if (!this._bg) {
                const c = document.createElement('canvas');
                const dpr = Math.min(2, window.devicePixelRatio || 1);
                c.width = this.W * dpr; c.height = this.H * dpr;
                const x = c.getContext('2d'); x.scale(dpr, dpr);
                this._paintFloor(x);
                this._bg = c;
            }
            ctx.drawImage(this._bg, 0, 0, this.W, this.H);
        }

        _paintFloor(ctx) {
            const W = this.W, H = this.H;
            ctx.fillStyle = '#20262e'; ctx.fillRect(0, 0, W, H);
            // vinyl floor tiles
            for (let ty = 0; ty < H; ty += 60) for (let tx = 0; tx < W; tx += 60) {
                const k = ((tx / 60 + ty / 60) % 2) ? 0.035 : 0;
                ctx.fillStyle = `rgba(255,255,255,${0.02 + k})`; ctx.fillRect(tx + 1, ty + 1, 58, 58);
            }
            for (let i = 0; i < 380; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
                ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
            }
            // pool of dim overhead light
            const lg = ctx.createRadialGradient(C.x, C.y, 30, C.x, C.y, 420);
            lg.addColorStop(0, 'rgba(255,244,220,0.20)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
            const vg = ctx.createRadialGradient(W / 2, H / 2, 260, W / 2, H / 2, 620);
            vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
            ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
            // maze drop shadow on the floor (maze is 50 cm above the floor)
            ctx.save();
            ctx.translate(22, 28);
            ctx.fillStyle = 'rgba(0,0,0,0.22)';
            for (let k = 0; k < 4; k++) { this._plusPath(ctx, k * 3); ctx.fill(); }
            ctx.restore();
            // support legs (seen from above under arm ends)
            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([ux, uy]) => { ctx.beginPath(); ctx.arc(C.x + ux * (HW + AL - 20) + 26, C.y + uy * (HW + AL - 20) + 30, 9, 0, Math.PI * 2); ctx.fill(); });
            // the maze itself
            this._paintMaze(ctx);
        }

        _plusPath(ctx, grow = 0) {
            const a = HW + grow, L = HW + AL + grow;
            ctx.beginPath();
            ctx.moveTo(C.x - a, C.y - L); ctx.lineTo(C.x + a, C.y - L); ctx.lineTo(C.x + a, C.y - a);
            ctx.lineTo(C.x + L, C.y - a); ctx.lineTo(C.x + L, C.y + a); ctx.lineTo(C.x + a, C.y + a);
            ctx.lineTo(C.x + a, C.y + L); ctx.lineTo(C.x - a, C.y + L); ctx.lineTo(C.x - a, C.y + a);
            ctx.lineTo(C.x - L, C.y + a); ctx.lineTo(C.x - L, C.y - a); ctx.lineTo(C.x - a, C.y - a);
            ctx.closePath();
        }

        _paintMaze(ctx) {
            const L = HW + AL;
            // arm surfaces (matte black PVC)
            this._plusPath(ctx);
            const sg = ctx.createRadialGradient(C.x - 40, C.y - 60, 20, C.x, C.y, 260);
            sg.addColorStop(0, '#4a515b'); sg.addColorStop(1, '#2c3138');
            ctx.fillStyle = sg; ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
            // subtle surface grain
            ctx.save(); this._plusPath(ctx); ctx.clip();
            ctx.strokeStyle = 'rgba(255,255,255,0.025)'; ctx.lineWidth = 1;
            for (let i = -L; i < L; i += 5) { ctx.beginPath(); ctx.moveTo(C.x - L, C.y + i); ctx.lineTo(C.x + L, C.y + i + 18); ctx.stroke(); }
            // centre square marking
            ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.setLineDash([4, 4]);
            ctx.strokeRect(C.x - HW, C.y - HW, HW * 2, HW * 2); ctx.setLineDash([]);
            // inner wall shadows on closed arms
            [-1, 1].forEach(sd => {
                const g = ctx.createLinearGradient(C.x + sd * HW, 0, C.x + sd * (HW - 12), 0);
                g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = g;
                ctx.fillRect(sd < 0 ? C.x - HW : C.x + HW - 12, C.y - L, 12, AL);
                ctx.fillRect(sd < 0 ? C.x - HW : C.x + HW - 12, C.y + HW, 12, AL);
            });
            ctx.restore();
            // open-arm lips (0.5 cm raised edge)
            ctx.strokeStyle = 'rgba(203,213,225,0.55)'; ctx.lineWidth = 2;
            [[-1], [1]].forEach(([sd]) => {
                const x0 = sd < 0 ? C.x - L : C.x + HW, x1 = sd < 0 ? C.x - HW : C.x + L;
                ctx.beginPath(); ctx.moveTo(x0, C.y - HW + 1); ctx.lineTo(x1, C.y - HW + 1); ctx.moveTo(x0, C.y + HW - 1); ctx.lineTo(x1, C.y + HW - 1); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(sd < 0 ? x0 + 1 : x1 - 1, C.y - HW); ctx.lineTo(sd < 0 ? x0 + 1 : x1 - 1, C.y + HW); ctx.stroke();
            });
            // closed-arm walls (15 cm high, seen from above: thick tops with a lit inner face)
            const WT = 9;
            const wall = (x, y, w, h, vert) => {
                const g = vert ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
                g.addColorStop(0, '#5d6670'); g.addColorStop(0.45, '#aab3bd'); g.addColorStop(1, '#6b747e');
                ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
                ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
                ctx.strokeStyle = 'rgba(255,255,255,0.35)';
                ctx.beginPath(); vert ? (ctx.moveTo(x + w / 2, y + 2), ctx.lineTo(x + w / 2, y + h - 2)) : (ctx.moveTo(x + 2, y + h / 2), ctx.lineTo(x + w - 2, y + h / 2)); ctx.stroke();
            };
            [-1, 1].forEach(vy => {
                const y0 = vy < 0 ? C.y - L - WT : C.y + HW, h = AL + WT;
                wall(C.x - HW - WT, y0, WT, h, true);
                wall(C.x + HW, y0, WT, h, true);
                wall(C.x - HW - WT, vy < 0 ? C.y - L - WT : C.y + L, HW * 2 + WT * 2, WT, false);
            });
            // labels
            const lab = (t, x, y, rot) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); G.text(ctx, t, 0, 0, { size: 9, weight: 800, color: 'rgba(226,232,240,0.35)', align: 'center' }); ctx.restore(); };
            lab('OPEN ARM', C.x - HW - AL / 2, C.y + HW + 14); lab('OPEN ARM', C.x + HW + AL / 2, C.y + HW + 14);
            lab('CLOSED ARM', C.x + HW + WT + 12, C.y - HW - AL / 2, Math.PI / 2); lab('CLOSED ARM', C.x + HW + WT + 12, C.y + HW + AL / 2, Math.PI / 2);
        }

        draw(ctx) {
            const now = performance.now();
            const s = this.sess;
            // occupied-zone tint
            if (this.where === 'maze' && s) {
                const z = this._zone(this.mouse.x, this.mouse.y);
                ctx.save(); this._plusPath(ctx); ctx.clip();
                ctx.fillStyle = z === 'open' ? 'rgba(45,212,191,0.10)' : z === 'closed' ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.06)';
                if (z === 'open') ctx.fillRect(C.x - HW - AL, C.y - HW, AL * 2 + HW * 2, HW * 2);
                else if (z === 'closed') ctx.fillRect(C.x - HW, C.y - HW - AL, HW * 2, AL * 2 + HW * 2);
                else ctx.fillRect(C.x - HW, C.y - HW, HW * 2, HW * 2);
                ctx.restore();
            }
            // tracking path
            if (this.showTrail && this.trail.length > 1 && this.where !== 'cage') {
                ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                ctx.strokeStyle = 'rgba(56,189,248,0.55)'; ctx.lineWidth = 1.4;
                ctx.beginPath(); this.trail.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
                ctx.restore();
            }
            // drop target on the central platform
            if (this.phase === 'place' && this.where !== 'carry') {
                const pulse = 0.5 + 0.5 * Math.sin(now / 240);
                const near = this.drag && Math.hypot(this.drag.x - C.x, this.drag.y - C.y) < 70;
                ctx.save();
                ctx.strokeStyle = near ? 'rgba(52,245,197,0.95)' : `rgba(52,245,197,${0.35 + pulse * 0.45})`;
                ctx.lineWidth = near ? 3 : 2; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -now / 40;
                ctx.strokeRect(C.x - HW - 4 - pulse * 3, C.y - HW - 4 - pulse * 3, HW * 2 + 8 + pulse * 6, HW * 2 + 8 + pulse * 6);
                ctx.setLineDash([]);
                G.text(ctx, 'Central platform — drop here', C.x, C.y - HW - 16, { size: 11, align: 'center', color: '#a7f3d0', shadow: true });
                ctx.restore();
            }
            this._drawCage(ctx, false);
            // mouse (stretched-attend posture = elongated, low)
            const m = this.mouse;
            if (this.beh && this.beh.mode === 'wait' && this.beh.kind === 'sap' && this.where === 'maze') {
                ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.heading); ctx.scale(1.12, 0.9); ctx.rotate(-m.heading); ctx.translate(-m.x, -m.y);
                m.draw(ctx); ctx.restore();
                G.text(ctx, 'stretched-attend', m.x, m.y - 30, { size: 10, align: 'center', color: '#fde68a', shadow: true });
            } else if (this.where === 'held' || this.where === 'carry') {
                ctx.save(); ctx.globalAlpha = 0.35; G.shadow(ctx, m.x + 14, m.y + 22, 30, 14, 0.5); ctx.restore();
                ctx.save(); ctx.translate(m.x, m.y); ctx.scale(1.12, 1.12); ctx.translate(-m.x, -m.y); m.draw(ctx); ctx.restore();
            } else m.draw(ctx);
            this._drawCage(ctx, true);
            this._drawCamera(ctx, now);
            this._drawPanel(ctx, now);
        }

        _drawCage(ctx, front) {
            const c = CAGE;
            if (!front) {
                G.shadow(ctx, c.x + c.w / 2 + 8, c.y + c.h / 2 + 10, c.w * 0.58, c.h * 0.55, 0.45);
                ctx.fillStyle = '#c9a777'; G.rr(ctx, c.x, c.y, c.w, c.h, 10); ctx.fill();
                // bedding chips
                ctx.save(); G.rr(ctx, c.x, c.y, c.w, c.h, 10); ctx.clip();
                for (let i = 0; i < 260; i++) {
                    const x = c.x + ((i * 73) % c.w), y = c.y + ((i * 41 + (i % 7) * 13) % c.h);
                    ctx.fillStyle = i % 3 ? 'rgba(120,84,40,0.35)' : 'rgba(255,240,210,0.35)';
                    ctx.save(); ctx.translate(x, y); ctx.rotate(i); ctx.fillRect(-3, -1, 6, 2); ctx.restore();
                }
                ctx.restore();
            } else {
                ctx.strokeStyle = 'rgba(226,232,240,0.75)'; ctx.lineWidth = 3;
                G.rr(ctx, c.x, c.y, c.w, c.h, 10); ctx.stroke();
                ctx.fillStyle = 'rgba(210,230,245,0.06)'; G.rr(ctx, c.x, c.y, c.w, c.h, 10); ctx.fill();
                // wire lid bars
                ctx.strokeStyle = 'rgba(203,213,225,0.22)'; ctx.lineWidth = 1;
                for (let x = c.x + 14; x < c.x + c.w; x += 14) { ctx.beginPath(); ctx.moveTo(x, c.y + 4); ctx.lineTo(x, c.y + c.h * 0.32); ctx.stroke(); }
                G.text(ctx, 'HOME CAGE', c.x + 10, c.y - 8, { size: 9, color: 'rgba(226,232,240,0.7)', weight: 800 });
            }
        }

        _drawCamera(ctx, now) {
            const L = HW + AL + 22;
            ctx.save();
            ctx.strokeStyle = 'rgba(226,232,240,0.5)'; ctx.lineWidth = 2;
            const br = (x, y, sx, sy) => { ctx.beginPath(); ctx.moveTo(x, y + sy * 18); ctx.lineTo(x, y); ctx.lineTo(x + sx * 18, y); ctx.stroke(); };
            br(C.x - L, C.y - L + 6, 1, 1); br(C.x + L, C.y - L + 6, -1, 1); br(C.x - L, C.y + L - 6, 1, -1); br(C.x + L, C.y + L - 6, -1, -1);
            const rec = this.phase === 'run';
            if (rec && Math.floor(now / 500) % 2) G.led(ctx, C.x - L + 12, C.y - L + 22, 5, '#ef4444', true);
            G.text(ctx, rec ? 'REC' : 'CAM 1', C.x - L + 22, C.y - L + 26, { size: 10, weight: 800, color: rec ? '#fca5a5' : 'rgba(226,232,240,0.6)' });
            ctx.restore();
        }

        _drawPanel(ctx, now) {
            const p = PANEL, s = this.sess;
            ctx.save();
            ctx.fillStyle = 'rgba(8,15,26,0.82)'; G.rr(ctx, p.x, p.y, p.w, p.h, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(94,234,212,0.35)'; ctx.lineWidth = 1; ctx.stroke();
            G.text(ctx, 'VIDEO TRACKING', p.x + 14, p.y + 22, { size: 10, weight: 800, color: '#5eead4' });
            const t = s ? s.t : 0;
            const mm = String(Math.floor(t / 60)).padStart(2, '0'), ss = String(Math.floor(t % 60)).padStart(2, '0');
            G.lcd(ctx, p.x + 14, p.y + 32, p.w - 28, 40, `${mm}:${ss} / 05:00`, { label: 'SESSION', color: this.phase === 'run' ? '#34f5c5' : '#64748b' });
            const tot = s ? Math.max(1e-6, s.tOpen + s.tClosed + s.tCentre) : 1;
            const bars = [
                ['Open arms', s ? s.tOpen : 0, '#2dd4bf'],
                ['Closed arms', s ? s.tClosed : 0, '#fbbf24'],
                ['Centre', s ? s.tCentre : 0, '#94a3b8']
            ];
            let y = p.y + 96;
            bars.forEach(([lab, v, col]) => {
                G.text(ctx, lab, p.x + 14, y, { size: 10, color: '#cbd5e1' });
                G.text(ctx, `${v.toFixed(0)} s`, p.x + p.w - 14, y, { size: 10, color: '#f8fafc', weight: 700, align: 'right' });
                ctx.fillStyle = 'rgba(148,163,184,0.18)'; G.rr(ctx, p.x + 14, y + 5, p.w - 28, 7, 3); ctx.fill();
                ctx.fillStyle = col; G.rr(ctx, p.x + 14, y + 5, Math.max(0, (p.w - 28) * (s ? v / tot : 0)), 7, 3); ctx.fill();
                y += 32;
            });
            y += 4;
            const row = (k, v, col = '#f8fafc') => { G.text(ctx, k, p.x + 14, y, { size: 10, color: '#94a3b8' }); G.text(ctx, String(v), p.x + p.w - 14, y, { size: 12, color: col, weight: 800, align: 'right' }); y += 20; };
            const oe = s ? s.oe : 0, ce = s ? s.ce : 0;
            row('Open-arm entries', oe, '#5eead4');
            row('Closed-arm entries', ce, '#fcd34d');
            row('% open entries', s && oe + ce ? (oe / (oe + ce) * 100).toFixed(0) + '%' : '—');
            row('% open time', s && s.tOpen + s.tClosed > 0 ? (s.tOpen / (s.tOpen + s.tClosed) * 100).toFixed(0) + '%' : '—');
            row('Head dips · SAPs', s ? `${s.dips} · ${s.saps}` : '—');
            row('Distance', s ? (this.mouse.distance / PXCM / 100).toFixed(1) + ' m' : '—');
            ctx.restore();
        }
    }

    LAB.register(6, PlusMaze);
})();
