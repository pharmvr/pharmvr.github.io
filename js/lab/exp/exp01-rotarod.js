/**
 * EXP 1 — Muscle relaxant activity: Rota-Rod (side view, rod seen end-on)
 * Flow: baseline trial → select group → load syringe → i.p. injection → 30 min absorption
 *       → post-drug trial (mouse struggles, slips & falls onto trip plate) → record → repeat.
 */
(function () {
    const { M, G, Rodent } = LAB;
    const ROD = { x: 540, y: 222, r: 30, rpm: 25 };
    const PLATE_Y = 338;
    const CAGE = { x: 40, y: 318, w: 250, h: 110, floor: 420 };
    const CUTOFF = 180;

    class RotaRod extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 430 },
                steps: [
                    'Place the untreated mouse on the rotating rod (25 rpm) and record the <b>basal fall-off time</b> (cut-off 180 s).',
                    'Choose a treatment group, then click the syringe on the tray to <b>draw up the dose</b>.',
                    'Drag the syringe onto the mouse in the holding cage to inject <b>intraperitoneally</b>.',
                    'Wait <b>30 min</b> for absorption — watch the mouse for sedation / ataxia.',
                    'Place the mouse back on the rod and record the <b>post-drug fall-off time</b>.',
                    'Repeat with a fresh mouse for every group and compare the % decrease.'
                ],
                treatments: [
                    { id: 'saline', name: 'Normal saline 10 mL/kg', short: 'Saline', cls: 'Vehicle control', color: '#64748b', mean: 172, sd: 7, eff: 0 },
                    { id: 'dzp1', name: 'Diazepam 1 mg/kg i.p.', short: 'DZP 1', cls: 'Benzodiazepine — low dose', color: '#f59e0b', mean: 112, sd: 14, eff: 0.35 },
                    { id: 'dzp4', name: 'Diazepam 4 mg/kg i.p.', short: 'DZP 4', cls: 'Benzodiazepine — high dose', color: '#dc2626', mean: 31, sd: 7, eff: 0.85 },
                    { id: 'cpz', name: 'Chlorpromazine 3 mg/kg i.p.', short: 'CPZ 3', cls: 'Phenothiazine (D₂ block)', color: '#7c3aed', mean: 54, sd: 10, eff: 0.65 }
                ],
                table: ['Group', 'Basal (s)', 'Post-drug (s)', '% ↓'],
                chart: true, chartTitle: 'Fall-off time (s) — basal vs post-drug',
                chartEmpty: { xMin: 0, xMax: 4, yMin: 0, yMax: 200, yLabel: 'Fall-off time (s)', xTicks: [], annotations: [{ y: 180, text: 'cut-off 180 s', color: '#f59e0b' }] },
                viva: [
                    { q: 'Which receptor mediates the muscle relaxant action of diazepam detected on the rota-rod?', opts: ['GABA-A (benzodiazepine site)', 'NMDA', 'Muscarinic M₃', 'α₁-adrenergic'], ans: 0, exp: 'Diazepam is a positive allosteric modulator at the GABA-A receptor; enhanced Cl⁻ conductance in spinal and supraspinal circuits reduces muscle tone and coordination.' },
                    { q: 'Why is a basal reading taken from every mouse before drug administration?', opts: ['To warm up the rod', 'To exclude animals that cannot stay on the rod and serve as each animal’s own control', 'To calculate LD₅₀', 'It is not required'], ans: 1, exp: 'Only mice that stay on the rod for the cut-off period are selected; each animal’s post-drug time is compared with its own basal time.' },
                    { q: 'Why is a cut-off time (e.g. 180 s) used?', opts: ['To prevent exhaustion and standardise the endpoint', 'To induce seizures', 'The motor stops automatically', 'To measure body temperature'], ans: 0, exp: 'Normal mice could stay on the rod for very long periods; a cut-off avoids fatigue and allows uniform comparison.' },
                    { q: 'A drug reducing fall-off time could act by:', opts: ['Central muscle relaxation', 'Sedation / motor incoordination', 'Neuromuscular blockade', 'All of the above'], ans: 3, exp: 'The rota-rod detects any impairment of motor coordination — central relaxants, sedatives and peripheral NM blockers all shorten the time.' }
                ],
                inferenceHint: 'Run the basal trial, treat the mouse and record the post-drug fall-off time for at least two groups.'
            };
        }

        setup() {
            this.timeScale = 8;
            this.rodAngle = 0;
            this.results = {};
            this.mouseNo = 0;
            this.controls(`
                <div class="lab2-card-h"><span>Trial time-lapse</span></div>
                <div class="lab2-seg" id="rr-speed">
                    <button data-s="4">×4</button><button data-s="8" class="active">×8</button><button data-s="16">×16</button>
                </div>
                <p style="font-size:.72rem;color:#64748b;margin-top:8px">The rod turns at its true 25 rpm; the trial timer runs faster so a 180 s cut-off takes ~20 s.</p>`);
            this.ctrl.querySelectorAll('#rr-speed button').forEach(b => b.onclick = () => {
                this.timeScale = +b.dataset.s;
                this.ctrl.querySelectorAll('#rr-speed button').forEach(x => x.classList.toggle('active', x === b));
            });
            this.hotspots = [
                { x: ROD.x - 30, y: ROD.y - 30, w: 60, h: 60, label: 'Knurled rod Ø 3 cm — 25 rpm' },
                { x: 340, y: PLATE_Y - 6, w: 400, h: 18, label: 'Trip plate — stops lane timer on fall' },
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Holding cage' },
                { x: 480, y: 360, w: 180, h: 60, label: 'Lane timer & speed controller' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.mouseNo++;
            this.mouse = new Rodent({ x: 160, y: CAGE.floor, scale: 1.35, facing: 1 });
            this.mouse.groundY = CAGE.floor;
            this.where = 'cage';
            this.phase = 'baseline';
            this.effect = 0;
            this.drugT = null;
            this.basal = null;
            this.trial = null;
            this.injected = null;
            this.cageTarget = 150;
            this.setStep(0);
            this.hud('l', [{ k: 'Mouse', v: '#' + this.mouseNo }, { k: 'Group', v: 'untreated' }]);
            this._refresh();
        }

        _refresh() {
            const ph = this.phase;
            const busy = this.busy || this.where !== 'cage';
            if (ph === 'baseline') {
                this.status('Basal screening: put the mouse on the rod. Only mice that stay on for the cut-off period are used.');
                this.actions([{ label: '▶ Run basal trial', primary: true, disabled: busy, onClick: () => this.runTrial(false) }]);
            } else if (ph === 'treat') {
                this.status(`Basal = <b>${this.basal.toFixed(0)} s</b>. Select a group (left), click the syringe to load <b>${this.tr.name}</b>, then drag it onto the mouse.`);
                this.actions([{ label: '💉 Load & inject', primary: true, disabled: busy, onClick: () => this.autoInject() }]);
            } else if (ph === 'absorb') {
                this.status(`<b>${this.injected.name}</b> given i.p. Allow 30 min for absorption before testing.`);
                this.actions([{ label: '⏩ Wait 30 min', primary: true, disabled: busy, onClick: () => this.wait() }]);
            } else if (ph === 'test') {
                this.status('Absorption period over. Test motor coordination on the rod.');
                this.actions([{ label: '▶ Run post-drug trial', primary: true, disabled: busy, onClick: () => this.runTrial(true) }]);
            } else if (ph === 'done') {
                this.status('Trial recorded. Take a <b>fresh mouse</b> and test the next group.');
                this.actions([{ label: '↺ Next mouse', primary: true, disabled: busy, onClick: () => { this.resetAnimal(); } }]);
            }
        }

        getInjectZone() {
            if (this.phase !== 'treat' || this.where !== 'cage') return null;
            const m = this.mouse;
            return { x: m.x - 4 * m.facing, y: m.y - 16, r: 26, label: 'Mouse abdomen (i.p.)', angle: Math.PI / 2 - 0.35 };
        }

        onSelect() { if (this.phase === 'treat') this._refresh(); }

        onInjected(tr) {
            this.injected = tr;
            this.drugT = 0;
            this.fx.emit({ x: this.mouse.x, y: this.mouse.y - 18, r: 2, vy: -20, life: 0.6, color: G.hexA(tr.color, 0.9) });
            this.mouse.set({ walk: 1 });
            this.floatText(this.mouse.x, this.mouse.y - 50, `${tr.short} i.p.`, '#fde68a');
            this.phase = 'absorb';
            this.setStep(3);
            this.hud('l', [{ k: 'Mouse', v: '#' + this.mouseNo }, { k: 'Group', v: tr.short }]);
            setTimeout(() => this._refresh(), 950);
        }

        wait() {
            this.timeLapse(30, 4.5, {
                label: 'Absorption',
                onTick: (sim, p) => { this.drugT = 30 * p; },
                onDone: () => { this.phase = 'test'; this.setStep(4); this._refresh(); this.toast('30 min elapsed — observe the posture before the trial.', 'info'); }
            });
            this._refresh();
        }

        /* ---------- trial ---------- */
        runTrial(post) {
            if (this.busy) return;
            const tr = this.injected;
            let T;
            if (!post) T = Math.min(CUTOFF, M.gauss(178, 4));
            else T = Math.max(4, Math.min(CUTOFF, M.gauss(tr.mean, tr.sd)));
            this.trial = { post, T, t: 0, slip: 0, state: 'placing' };
            this.busy = true;
            this._refresh();
            // carry mouse by the tail to the top of the rod
            const m = this.mouse;
            m.facing = -1;
            m.set({ walk: 0 });
            this.where = 'carry';
            const sx = m.x, sy = m.y;
            const tx = ROD.x, ty = ROD.y - ROD.r;
            this.tw.add(0.35, e => { m.rot = -e * Math.PI / 2 * m.facing; m.y = sy - 40 * e; m.x = sx; }, {
                onDone: () => this.tw.add(0.9, e => {
                    m.x = M.lerp(sx, tx, e); m.y = M.lerp(sy - 40, ty - 70, e) - Math.sin(e * Math.PI) * 40;
                }, {
                    onDone: () => this.tw.add(0.4, e => { m.y = M.lerp(ty - 70, ty, e); m.rot = -(1 - e) * Math.PI / 2 * m.facing; }, {
                        onDone: () => { if (!this.trial) return; this.where = 'rod'; m.groundY = null; this.trial.state = 'run'; this.setStep(post ? 4 : 0); }
                    })
                })
            });
        }

        _endTrial(fell) {
            const tr = this.trial;
            const val = Math.min(CUTOFF, tr.t);
            if (!tr.post) {
                this.basal = val;
                this.toast(`Basal fall-off time: <b>${val.toFixed(0)} s</b> ${val >= CUTOFF ? '(cut-off reached ✓ selected)' : ''}`, 'success');
                this.phase = 'treat';
                this.setStep(1);
            } else {
                const dec = Math.max(0, (this.basal - val) / this.basal * 100);
                const g = this.injected;
                (this.results[g.id] = this.results[g.id] || []).push({ basal: this.basal, post: val });
                this.addRow([`<b>${g.short}</b> · M${this.mouseNo}`, this.basal.toFixed(0), `<b>${val.toFixed(0)}</b>`, `${dec.toFixed(0)}%`], dec > 25 ? 'down' : '');
                this.markDone(g.id);
                this.phase = 'done';
                this.setStep(5);
                this.toast(`${g.short}: fell after <b>${val.toFixed(0)} s</b> (${dec.toFixed(0)}% decrease)`, dec > 25 ? 'warn' : 'success');
                this._chart();
                this._infer();
            }
            // return mouse to cage after a moment
            setTimeout(() => this._returnToCage(), fell ? 1400 : 600);
        }

        _returnToCage() {
            const m = this.mouse;
            const sx = m.x, sy = m.y;
            this.where = 'carry';
            m.set({ walk: 0, crouch: 0 });
            this.tw.add(0.35, e => { m.rot = M.lerp(m.rot, Math.PI / 2 * m.facing * -1, e); m.y = sy - 40 * e; }, {
                onDone: () => this.tw.add(0.9, e => { m.x = M.lerp(sx, 150, e); m.y = M.lerp(sy - 40, CAGE.floor - 60, e) - Math.sin(e * Math.PI) * 50; }, {
                    onDone: () => this.tw.add(0.35, e => { m.y = M.lerp(CAGE.floor - 60, CAGE.floor, e); m.rot = M.lerp(-Math.PI / 2 * m.facing, 0, e); }, {
                        onDone: () => { this.where = 'cage'; m.groundY = CAGE.floor; m.rot = 0; this.trial = null; this.busy = false; this._refresh(); }
                    })
                })
            });
        }

        _chart() {
            const ids = this.cfg.treatments.filter(t => this.results[t.id]);
            const basal = [], post = [];
            ids.forEach((t, i) => {
                const r = this.results[t.id];
                basal.push([i + 1, M.mean(r.map(x => x.basal)), M.sem(r.map(x => x.basal))]);
                post.push([i + 1, M.mean(r.map(x => x.post)), M.sem(r.map(x => x.post))]);
            });
            this.chart.draw({
                xMin: 0.4, xMax: Math.max(2, ids.length) + 0.6, yMin: 0, yMax: 200,
                xTicks: ids.map((_, i) => i + 1), xFmt: v => (ids[v - 1] || {}).short || '',
                yLabel: 'Fall-off time (s)', barCount: Math.max(2, ids.length) + 0.2,
                series: [
                    { name: 'Basal', color: '#94a3b8', type: 'bar', points: basal, barWidth: 0.36, offset: -0.5 },
                    { name: 'Post-drug', color: '#0d9488', type: 'bar', points: post, barWidth: 0.36, offset: 0.5, labels: true }
                ],
                annotations: [{ y: CUTOFF, text: 'cut-off 180 s', color: '#f59e0b' }]
            });
        }

        _infer() {
            const lines = this.cfg.treatments.filter(t => this.results[t.id]).map(t => {
                const r = this.results[t.id];
                const dec = M.mean(r.map(x => (x.basal - x.post) / x.basal * 100));
                return `<div class="kv"><span>${t.short}</span><span>${dec.toFixed(0)}% ↓</span></div>`;
            }).join('');
            const has = id => this.results[id];
            let msg = '';
            if (has('dzp4') && has('saline')) msg = '<p style="margin-top:8px">Diazepam markedly shortens the fall-off time versus saline → <b>central muscle relaxant / motor-incoordinating</b> activity (GABA-A potentiation).';
            if (has('dzp1') && has('dzp4')) msg += ' The effect is <b>dose-dependent</b>.';
            if (has('cpz')) msg += ' Chlorpromazine also impairs performance (sedation & extrapyramidal D₂ blockade).';
            this.infer(lines + (msg ? msg + '</p>' : ''));
        }

        /* ---------- simulation ---------- */
        update(dt) {
            const m = this.mouse;
            const omega = ROD.rpm / 60 * Math.PI * 2;
            this.rodAngle += omega * dt;
            // drug effect builds during absorption
            if (this.injected && this.drugT !== null) {
                const target = this.injected.eff * (1 - Math.exp(-this.drugT / 9));
                this.effect = M.approach(this.effect, target, 3, dt);
            }
            const e = this.effect;
            m.set({ sedation: e * 0.75, ataxia: e * 0.9 });

            if (this.where === 'cage') {
                // idle exploration in the holding cage (slower when sedated)
                const speed = 26 * (1 - e * 0.85);
                if (Math.abs(m.x - this.cageTarget) < 4 || Math.random() < dt * 0.05) this.cageTarget = M.rand(CAGE.x + 60, CAGE.x + CAGE.w - 60);
                const dir = Math.sign(this.cageTarget - m.x);
                const moving = Math.abs(this.cageTarget - m.x) > 4 && !this.inject && (e < 0.6 || Math.random() < 0.3);
                if (moving) { m.facing = dir; m.x += dir * speed * dt; }
                m.set({ walk: moving ? 1 : 0 });
                m.gaitSpeed = moving ? speed / 16 : 0;
                m.y = CAGE.floor; m.groundY = CAGE.floor;
            } else if (this.where === 'rod' && this.trial) {
                const tr = this.trial;
                if (tr.state === 'run') {
                    tr.t += dt * this.timeScale;
                    const surf = omega * ROD.r;
                    m.set({ walk: 1 });
                    m.gaitSpeed = surf / (m.stride * m.scale) * 1.1;
                    // slip angle grows as the predicted fall time approaches
                    const k = Math.min(1, tr.t / tr.T);
                    const wob = Math.sin(performance.now() / 260) * 0.12 * (tr.post ? e : 0.1) + M.noise1(tr.t * 0.7) * 0.05;
                    tr.slip = (tr.T < CUTOFF ? Math.pow(k, 3) * 0.8 : 0) + wob;
                    if (tr.T < CUTOFF && tr.t >= tr.T) {
                        tr.state = 'fall';
                        tr.vx = surf * 1.2; tr.vy = -40; tr.spin = 5;
                        m.set({ walk: 0 });
                        this.fx.emit({ x: m.x, y: m.y, r: 0, life: 0.01 });
                    } else if (tr.t >= CUTOFF) {
                        tr.t = CUTOFF; tr.state = 'end';
                        this._endTrial(false);
                    }
                    const a = tr.slip;
                    m.x = ROD.x + Math.sin(a) * ROD.r;
                    m.y = ROD.y - Math.cos(a) * ROD.r;
                    m.rot = a;
                } else if (tr.state === 'fall') {
                    tr.vy += 900 * dt;
                    m.x += tr.vx * dt; m.y += tr.vy * dt;
                    m.rot += tr.spin * dt;
                    if (m.y >= PLATE_Y) {
                        m.y = PLATE_Y; m.rot = 0; m.groundY = PLATE_Y;
                        tr.state = 'landed';
                        this.plateHit = 1;
                        m.set({ crouch: 1 });
                        for (let i = 0; i < 8; i++) this.fx.emit({ x: m.x + M.rand(-30, 30), y: PLATE_Y, vx: M.rand(-40, 40), vy: M.rand(-60, -20), ay: 300, r: 1.4, life: 0.6, color: 'rgba(203,213,225,0.8)' });
                        this.floatText(m.x, m.y - 60, `Fell at ${tr.t.toFixed(1)} s`, '#fda4af');
                        this._endTrial(true);
                    }
                }
            }
            if (this.plateHit) this.plateHit = Math.max(0, this.plateHit - dt * 0.4);
            m.update(dt);

            // HUD
            const tt = this.trial ? this.trial.t : 0;
            this.hud('r', [
                { k: 'Lane timer', v: tt.toFixed(1) + ' s', tone: this.trial && this.trial.state === 'landed' ? 'bad' : '' },
                { k: 'Time-lapse', v: '×' + this.timeScale },
                { k: 'Since injection', v: this.drugT !== null ? Math.round(this.drugT) + ' min' : '—' }
            ]);
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._drawCage(ctx, false);
            this._drawApparatusBack(ctx);
            if (this.where === 'rod' || (this.where === 'carry' && this.mouse.x > 330)) this.mouse.draw(ctx);
            this._drawRod(ctx);
            this._drawBase(ctx);
            if (this.trial && (this.trial.state === 'landed' || this.trial.state === 'fall' || this.trial.state === 'end')) this.mouse.draw(ctx);
            if (this.where === 'cage' || (this.where === 'carry' && this.mouse.x <= 330)) this.mouse.draw(ctx);
            this._drawCage(ctx, true);
        }

        _drawApparatusBack(ctx) {
            // rear housing wall & lane divider disc (acrylic, seen face-on)
            G.shadow(ctx, ROD.x, 430, 230, 14, 0.45);
            G.metal(ctx, ROD.x - 12, ROD.y, 24, PLATE_Y - ROD.y, { vertical: true, tone: 'steel' });
            ctx.save();
            const R = 150;
            const dg = ctx.createRadialGradient(ROD.x - 30, ROD.y - 40, 10, ROD.x, ROD.y, R);
            dg.addColorStop(0, 'rgba(226,240,250,0.30)'); dg.addColorStop(1, 'rgba(160,190,215,0.18)');
            ctx.fillStyle = dg;
            ctx.beginPath(); ctx.arc(ROD.x, ROD.y, R, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(230,245,255,0.75)'; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.arc(ROD.x, ROD.y, R - 8, -2.6, -1.7); ctx.stroke();
            G.text(ctx, 'LANE 1', ROD.x, ROD.y - R + 22, { size: 10, color: 'rgba(15,23,42,0.45)', align: 'center', weight: 800 });
            ctx.restore();
        }

        _drawRod(ctx) {
            const { x, y, r } = ROD;
            ctx.save();
            // knurled rod end-on
            const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 2, x, y, r);
            g.addColorStop(0, '#f8fafc'); g.addColorStop(0.55, '#9aa5b1'); g.addColorStop(1, '#3f4954');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            // grooves rotate with the rod
            ctx.strokeStyle = 'rgba(30,41,59,0.55)'; ctx.lineWidth = 2;
            for (let i = 0; i < 14; i++) {
                const a = this.rodAngle + i * Math.PI * 2 / 14;
                ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4)); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
            // axle hub with a spoke to show rotation clearly
            G.metal(ctx, x - 7, y - 7, 14, 14, { r: 7, tone: 'chrome' });
            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(this.rodAngle) * 6, y + Math.sin(this.rodAngle) * 6); ctx.stroke();
            // rotation arrow
            ctx.strokeStyle = 'rgba(94,234,212,0.7)'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(x, y, r + 12, -0.4 + this.rodAngle % 0.6, 0.6 + this.rodAngle % 0.6); ctx.stroke();
            ctx.restore();
        }

        _drawBase(ctx) {
            const bx = 330, by = PLATE_Y + 4, bw = 420, bh = 432 - by;
            // trip plate
            const tilt = this.plateHit ? Math.sin(this.plateHit * 20) * this.plateHit * 2 : 0;
            ctx.save(); ctx.translate(0, tilt);
            G.metal(ctx, bx + 10, PLATE_Y - 2, bw - 20, 7, { r: 2, tone: 'steel' });
            ctx.restore();
            // housing
            const hg = ctx.createLinearGradient(0, by, 0, by + bh);
            hg.addColorStop(0, '#3b4450'); hg.addColorStop(0.15, '#2a313a'); hg.addColorStop(1, '#161a20');
            ctx.fillStyle = hg; G.rr(ctx, bx, by, bw, bh, 6); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.stroke();
            // front panel
            G.metal(ctx, bx + 16, by + 16, bw - 32, bh - 30, { r: 4, tone: 'steel' });
            const tt = this.trial ? this.trial.t : 0;
            G.lcd(ctx, bx + 32, by + 24, 112, 44, String(ROD.rpm).padStart(2, '0') + ' rpm', { label: 'SPEED', color: '#7dd3fc' });
            G.lcd(ctx, bx + 158, by + 24, 150, 44, tt.toFixed(1).padStart(5, '0') + ' s', { label: 'LANE 1 · LATENCY', color: this.trial && this.trial.state === 'landed' ? '#fb7185' : '#34f5c5' });
            const running = this.trial && this.trial.state === 'run';
            G.led(ctx, bx + 330, by + 38, 4.5, '#22c55e', running);
            G.led(ctx, bx + 330, by + 56, 4.5, '#ef4444', !!(this.trial && this.trial.state === 'landed'));
            G.knob(ctx, bx + 374, by + 46, 15, -0.8 + 0.06 * ROD.rpm);
            G.text(ctx, 'ROTA-ROD · PV-25', bx + 32, by + bh - 6, { size: 9, color: '#334155', weight: 800 });
        }

        _drawCage(ctx, front) {
            const c = CAGE;
            if (!front) {
                G.shadow(ctx, c.x + c.w / 2, c.y + c.h + 2, c.w * 0.6, 8, 0.4);
                // back wall + bedding
                ctx.fillStyle = 'rgba(210,225,235,0.18)';
                G.rr(ctx, c.x, c.y, c.w, c.h, 6); ctx.fill();
                const bg = ctx.createLinearGradient(0, c.floor - 6, 0, c.y + c.h);
                bg.addColorStop(0, '#d9b98a'); bg.addColorStop(1, '#a98455');
                ctx.fillStyle = bg; ctx.fillRect(c.x + 3, c.floor - 4, c.w - 6, c.y + c.h - c.floor + 1);
                ctx.fillStyle = 'rgba(120,84,40,0.5)';
                for (let i = 0; i < 40; i++) { const sx = c.x + 6 + (i * 53) % (c.w - 12), sy = c.floor - 3 + (i * 7) % 8; ctx.fillRect(sx, sy, 5, 1.6); }
            } else {
                G.glass(ctx, c.x, c.y, c.w, c.h, { r: 6, tint: 'rgba(200,225,240,0.07)' });
                // wire lid
                ctx.strokeStyle = 'rgba(148,163,184,0.9)'; ctx.lineWidth = 1.2;
                ctx.beginPath(); ctx.moveTo(c.x - 4, c.y); ctx.lineTo(c.x + c.w + 4, c.y); ctx.stroke();
                G.text(ctx, 'HOLDING CAGE', c.x + 10, c.y + 16, { size: 9, color: 'rgba(226,232,240,0.7)', weight: 800 });
            }
        }
    }

    LAB.register(1, RotaRod);
})();
