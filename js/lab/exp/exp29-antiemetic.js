/**
 * EXP 29 — Antiemetic activity against copper sulphate induced emesis (pigeon)
 *
 * Copper sulphate given orally irritates the gastric mucosa and excites vagal
 * afferents, which release 5-HT onto 5-HT₃ receptors — a PERIPHERAL emetic
 * stimulus. The pigeon is pre-treated, then dosed, and watched for 30 minutes
 * for latency to the first emetic episode and the number of episodes.
 *
 * Which drugs work tells you where the stimulus arises:
 *   Ondansetron (5-HT₃)        most effective — it blocks the afferent limb itself
 *   Metoclopramide, chlorpromazine, domperidone (D₂)  moderately effective
 *   Hyoscine (antimuscarinic)  almost useless here, although it is the drug of
 *                              choice for motion sickness, because that stimulus
 *                              travels by a vestibular–cholinergic pathway instead
 *
 * Domperidone is worth noting: it does not cross the blood–brain barrier, yet it
 * still works, because the chemoreceptor trigger zone lies outside that barrier.
 */
(function () {
    const { M, G } = LAB;

    const CAGE = { x: 28, y: 254, w: 190, h: 152, floor: 398 };
    const OBS = { x: 252, y: 196, w: 310, h: 212, floor: 400 };
    const UNIT = { x: 598, y: 168, w: 338, h: 242 };
    const OBS_SEC = 1800;        // 30 min observation

    class Pigeon {
        constructor(o) {
            this.x = o.x; this.y = o.y; this.scale = o.scale || 1; this.facing = o.facing || 1;
            this.t = Math.random() * 6; this.retch = 0; this.walk = 0; this.phase = 0; this.groundY = o.y;
        }
        update(dt) { this.t += dt; this.phase = (this.phase + this.walk * dt * 2.2) % 1; }
        draw(ctx) {
            const s = this.scale;
            ctx.save();
            G.shadow(ctx, this.x, this.groundY + 1, 32 * s, 6 * s, 0.3);
            ctx.translate(this.x, this.y);
            ctx.scale(this.facing * s, s);
            const bob = Math.sin(this.t * 2) * 1.2 + (this.walk ? Math.abs(Math.sin(this.phase * Math.PI * 2)) * 2 : 0);
            const r = this.retch;
            // legs
            ctx.strokeStyle = '#d4737a'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
            [-6, 7].forEach((lx, i) => {
                const sw = this.walk ? Math.sin((this.phase + i * 0.5) * Math.PI * 2) * 4 : 0;
                ctx.beginPath(); ctx.moveTo(lx, -14); ctx.lineTo(lx + sw, 0); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(lx + sw - 4, 0); ctx.lineTo(lx + sw + 5, 0); ctx.stroke();
            });
            // body
            ctx.save();
            ctx.translate(0, -26 - bob * 0.3 + r * 5);
            ctx.rotate(r * 0.42);
            const bg = ctx.createLinearGradient(0, -16, 0, 14);
            bg.addColorStop(0, '#b9c3cf'); bg.addColorStop(0.55, '#8d99a8'); bg.addColorStop(1, '#5f6b7a');
            ctx.fillStyle = bg;
            ctx.beginPath(); ctx.ellipse(0, 0, 24, 16, -0.12, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(60,72,88,0.4)'; ctx.lineWidth = 0.8; ctx.stroke();
            // wing
            ctx.fillStyle = 'rgba(96,108,124,0.85)';
            ctx.beginPath(); ctx.ellipse(-2, 1, 16, 9, -0.15, 0, Math.PI * 2); ctx.fill();
            // tail
            ctx.fillStyle = '#6b7786';
            ctx.beginPath();
            ctx.moveTo(-20, -2); ctx.lineTo(-42, 4 + r * 6); ctx.lineTo(-41, 11 + r * 6); ctx.lineTo(-19, 5);
            ctx.closePath(); ctx.fill();
            // neck and head, lowered and extended while retching
            ctx.save();
            ctx.translate(16, -10 + r * 9);
            ctx.rotate(r * 0.8);
            ctx.strokeStyle = '#95a1b0'; ctx.lineWidth = 9; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-4, 4); ctx.lineTo(4, -5); ctx.stroke();
            const hg = ctx.createRadialGradient(5, -9, 1, 7, -7, 10);
            hg.addColorStop(0, '#cdd6e0'); hg.addColorStop(1, '#7e8a99');
            ctx.fillStyle = hg;
            ctx.beginPath(); ctx.arc(6, -8, 8, 0, Math.PI * 2); ctx.fill();
            // iridescent neck patch
            ctx.fillStyle = 'rgba(110,170,140,0.5)';
            ctx.beginPath(); ctx.ellipse(1, -2, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
            // beak
            ctx.fillStyle = '#4b5563';
            ctx.beginPath(); ctx.moveTo(13, -9); ctx.lineTo(22, -7 + r * 2); ctx.lineTo(13, -5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#e8edf2';
            ctx.beginPath(); ctx.ellipse(13, -11, 3, 2, 0, 0, Math.PI * 2); ctx.fill();
            // eye
            ctx.fillStyle = '#e8601c';
            ctx.beginPath(); ctx.arc(9, -10, 2.4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1c1917';
            ctx.beginPath(); ctx.arc(9, -10, 1.1, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            ctx.restore();
            ctx.restore();
        }
    }

    class Antiemetic extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 412, seed: 22 },
                tray: { x: 40, y: 522 },
                steps: [
                    'Fast the pigeon for <b>12 h</b>, weigh it and place it in the holding cage.',
                    'Give the test drug <b>intramuscularly</b> into the pectoral muscle.',
                    'Allow <b>30 min</b> for the drug to act.',
                    'Transfer the bird to the observation cage and give <b>copper sulphate 50 mg/kg orally</b>.',
                    'Observe for <b>30 min</b>: record the latency to the first emetic episode and count the episodes.',
                    'Calculate percentage protection from the reduction in the number of episodes against control.'
                ],
                treatments: [
                    { id: 'saline', name: 'Normal saline 1 mL/kg i.m.', short: 'Control', cls: 'Vehicle control', color: '#64748b', lat: 290, n: 8 },
                    { id: 'ondansetron', name: 'Ondansetron 2 mg/kg i.m.', short: 'Ondans', cls: '5-HT₃ antagonist', color: '#0d9488', lat: 1500, n: 0.8 },
                    { id: 'metoclopramide', name: 'Metoclopramide 5 mg/kg i.m.', short: 'Metoclop', cls: 'D₂ antagonist + prokinetic', color: '#16a34a', lat: 950, n: 2.4 },
                    { id: 'chlorpromazine', name: 'Chlorpromazine 5 mg/kg i.m.', short: 'CPZ', cls: 'D₂ antagonist (CTZ)', color: '#6366f1', lat: 820, n: 2.9 },
                    { id: 'domperidone', name: 'Domperidone 5 mg/kg i.m.', short: 'Domper', cls: 'D₂ antagonist, no CNS entry', color: '#7c3aed', lat: 760, n: 3.2 },
                    { id: 'hyoscine', name: 'Hyoscine 1 mg/kg i.m.', short: 'Hyoscine', cls: 'Antimuscarinic — vestibular', color: '#dc2626', lat: 340, n: 6.8 }
                ],
                table: ['Group', 'Latency (s)', 'Episodes', '% protection'],
                chart: true, chartTitle: 'Mean number of emetic episodes',
                chartEmpty: { xMin: 0.4, xMax: 6.6, yMin: 0, yMax: 11, xTicks: [1, 2, 3, 4, 5, 6], xLabel: 'Group', yLabel: 'Episodes in 30 min', series: [] },
                viva: [
                    {
                        q: 'How does copper sulphate induce emesis when given orally?',
                        opts: ['By acting on the vestibular apparatus', 'By irritating the gastric mucosa and exciting vagal afferents, which release 5-HT onto 5-HT₃ receptors', 'By blocking dopamine receptors', 'By raising intracranial pressure'],
                        ans: 1,
                        exp: 'Orally administered copper sulphate is a <b>peripherally</b> acting emetic. That is why 5-HT₃ antagonists, which block the afferent limb itself, are the most effective drugs against it.'
                    },
                    {
                        q: 'Hyoscine is the drug of choice for motion sickness yet gives little protection here. Why?',
                        opts: ['The dose is too low', 'Motion sickness is mediated by a vestibular–cholinergic pathway, whereas copper sulphate acts through vagal 5-HT₃ afferents', 'Hyoscine is destroyed by copper', 'It is not absorbed after i.m. injection'],
                        ans: 1,
                        exp: 'Antiemetics are pathway-specific. A drug that blocks one input to the vomiting centre does nothing about another, which is why the choice of antiemetic depends on the cause of the vomiting.'
                    },
                    {
                        q: 'Domperidone does not cross the blood–brain barrier, yet it is an effective antiemetic because:',
                        opts: ['It acts on the stomach only', 'The chemoreceptor trigger zone lies outside the blood–brain barrier and is therefore accessible to it', 'It is converted to metoclopramide', 'It blocks 5-HT₃ receptors'],
                        ans: 1,
                        exp: 'The CTZ in the area postrema is deliberately outside the barrier so it can sample the blood. Domperidone can therefore reach it while avoiding the extrapyramidal effects of central D₂ blockade.'
                    },
                    {
                        q: 'The vomiting centre receives inputs from all of the following EXCEPT:',
                        opts: ['The chemoreceptor trigger zone', 'Vagal and sympathetic afferents from the gut', 'The vestibular apparatus', 'The juxtaglomerular apparatus'],
                        ans: 3,
                        exp: 'The vomiting centre integrates CTZ, vagal/gut, vestibular and higher cortical inputs. The juxtaglomerular apparatus regulates renin release and has nothing to do with emesis.'
                    },
                    {
                        q: 'Why is the pigeon used for this experiment?',
                        opts: ['It is small', 'It vomits readily and reproducibly to emetic stimuli, unlike rats and mice which cannot vomit at all', 'It has no CTZ', 'It is resistant to copper'],
                        ans: 1,
                        exp: 'Rodents lack the emetic reflex entirely, so they are useless for antiemetic screening. Pigeons, dogs, ferrets and cats all vomit readily and are used instead.'
                    },
                    {
                        q: 'Metoclopramide differs from domperidone mainly in that it:',
                        opts: ['Does not block D₂', 'Crosses the blood–brain barrier and so can cause extrapyramidal reactions', 'Is a 5-HT₃ agonist', 'Is given only intravenously'],
                        ans: 1,
                        exp: 'Both block D₂ and both are prokinetic, but central penetration gives metoclopramide a risk of dystonia and parkinsonism, particularly in the young and the elderly.'
                    }
                ],
                inferenceHint: 'Run a control bird first, then compare ondansetron with hyoscine — the contrast identifies the pathway.'
            };
        }

        setup() {
            this.results = {};
            this.birdNo = 0;
            this.hotspots = [
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Holding cage' },
                { x: OBS.x, y: OBS.y, w: OBS.w, h: OBS.h, label: 'Observation cage' },
                { x: UNIT.x, y: UNIT.y, w: UNIT.w, h: UNIT.h, label: 'Emesis event recorder' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.birdNo++;
            this.bird = new Pigeon({ x: CAGE.x + 92, y: CAGE.floor, scale: 1.1, facing: 1 });
            this.where = 'cage';
            this.walkTo = CAGE.x + 92;
            this.phase = 'treat';
            this.injected = null;
            this.obs = null;
            this.episode = null;
            this.setStep(1);
            this._refresh();
        }

        onSelect() { if (this.phase === 'treat') this._refresh(); }

        _refresh() {
            const b = this.busy, ph = this.phase;
            if (ph === 'treat') {
                this.status(`Select a group and give <b>${this.tr.name}</b> into the pectoral muscle.`);
                this.actions([{ label: '💉 Load & inject i.m.', primary: true, disabled: b, onClick: () => this.autoInject() }]);
            } else if (ph === 'absorb') {
                this.status(`<b>${this.injected.name}</b> given. Allow 30 min for it to act.`);
                this.actions([{ label: '⏩ Wait 30 min', primary: true, disabled: b, onClick: () => this.wait() }]);
            } else if (ph === 'place') {
                this.status('Transfer the pigeon to the <b>observation cage</b>.');
                this.actions([{ label: '🐦 Place in observation cage', primary: true, disabled: b, onClick: () => this.place() }]);
            } else if (ph === 'cuso4') {
                this.status('Give <b>copper sulphate 50 mg/kg orally</b> and start the clock.');
                this.actions([{ label: '🧪 Give CuSO₄ 50 mg/kg p.o.', primary: true, danger: true, disabled: b, onClick: () => this.giveCuSO4() }]);
            } else if (ph === 'observe') {
                const o = this.obs;
                this.status(this.episode
                    ? `<b style="color:#be123c">Emetic episode</b> — number ${o.count}.`
                    : (o.latency !== null
                        ? `Observing — first emesis at <b>${Math.round(o.latency)} s</b>; ${o.count} episode${o.count > 1 ? 's' : ''}.`
                        : 'Observing for emesis…'));
                this.actions([{ label: '⏩ Skip to end', always: true, onClick: () => { o.skip = true; } }]);
            } else {
                this.status('Observation complete. Use a <b>fresh bird</b> for the next group.');
                this.actions([{ label: '↺ Next pigeon', primary: true, disabled: b, onClick: () => this.resetAnimal() }]);
            }
            this.hud('l', [
                { k: 'Pigeon', v: '#' + this.birdNo },
                { k: 'Group', v: this.injected ? this.injected.short : 'untreated' }
            ]);
        }

        getInjectZone() {
            if (this.phase !== 'treat' || this.where !== 'cage') return null;
            const b = this.bird;
            return { x: b.x + 2, y: b.y - 30, r: 24, label: 'Pectoral muscle (i.m.)', angle: Math.PI / 2 - 0.5 };
        }

        onInjected(tr) {
            this.injected = tr;
            this.floatText(this.bird.x, this.bird.y - 60, `${tr.short} i.m.`, tr.color);
            this.phase = 'absorb';
            this.setStep(2);
            setTimeout(() => this._refresh(), 800);
        }

        wait() {
            const gen = this.gen;
            this.timeLapse(30, 3, {
                label: 'Drug acting',
                onDone: () => { if (gen !== this.gen) return; this.phase = 'place'; this.setStep(3); this._refresh(); }
            });
            this._refresh();
        }

        place() {
            if (this.busy) return;
            if (!this.injected) return this.toast('Give the treatment before the emetic.', 'warn');
            this.busy = true;
            const gen = this.gen, b = this.bird, sx = b.x, sy = b.y;
            const tx = OBS.x + OBS.w * 0.45;
            this.where = 'carry';
            b.walk = 0;
            this.tw.add(1.0, e => {
                b.x = M.lerp(sx, tx, e);
                b.y = M.lerp(sy, OBS.floor, e) - Math.sin(e * Math.PI) * 60;
                b.groundY = b.y;
            }, {
                onDone: () => {
                    if (gen !== this.gen) return;
                    b.y = OBS.floor; b.groundY = OBS.floor;
                    this.where = 'obs'; this.walkTo = tx;
                    this.busy = false; this.phase = 'cuso4'; this.setStep(4); this._refresh();
                }
            });
            this._refresh();
        }

        giveCuSO4() {
            if (this.busy) return;
            const d = this.injected;
            const sc = M.clamp(M.gauss(1, 0.2), 0.55, 1.8);
            const lat = M.clamp(d.lat * sc, 60, OBS_SEC * 1.6);
            const n = Math.max(0, Math.round(d.n * M.clamp(M.gauss(1, 0.28), 0.3, 1.9)));
            const events = [];
            if (n > 0 && lat < OBS_SEC) {
                let t = lat;
                for (let i = 0; i < n && t < OBS_SEC - 25; i++) {
                    events.push(t);
                    t += M.rand(110, 240);
                }
            }
            this.obs = { sec: 0, events, idx: 0, count: 0, latency: null, skip: false };
            this.floatText(this.bird.x, this.bird.y - 62, 'CuSO₄ 50 mg/kg p.o.', '#60a5fa');
            this.phase = 'observe';
            this.setStep(5);
            this.toast('Copper sulphate given. Observing for 30 min.', 'info');
            this._refresh();
        }

        _finish() {
            const o = this.obs, d = this.injected;
            if (!o || !d) return;
            const r = (this.results[d.id] = this.results[d.id] || []);
            r.push({ latency: o.latency === null ? OBS_SEC : o.latency, count: o.count });
            const ctrlN = this.results.saline ? M.mean(this.results.saline.map(x => x.count)) : null;
            const prot = ctrlN ? M.clamp((1 - o.count / ctrlN) * 100, 0, 100) : null;
            this.addRow([
                `<b>${d.short}</b> · P${this.birdNo}`,
                o.latency === null ? `<b style="color:#0f766e">&gt;${OBS_SEC}</b>` : `<b>${Math.round(o.latency)}</b>`,
                String(o.count),
                prot === null ? '—' : `<b>${prot.toFixed(0)}%</b>`
            ], prot !== null && prot > 50 ? 'up' : '');
            this.markDone(d.id);
            this.phase = 'done';
            this.episode = null;
            this.toast(o.count === 0
                ? 'No emesis in 30 min — <b>complete protection</b>.'
                : `<b>${o.count}</b> episodes, first at <b>${Math.round(o.latency)} s</b>.`,
                o.count === 0 ? 'success' : 'info', 3400);
            this._chart();
            this._infer();
            this._refresh();
        }

        _chart() {
            const trs = this.cfg.treatments, pts = [];
            trs.forEach((t, i) => {
                const r = this.results[t.id];
                if (!r) return;
                pts.push([i + 1, M.mean(r.map(x => x.count)), r.length > 1 ? M.sem(r.map(x => x.count)) : 0]);
            });
            this.chart.draw(Object.assign({}, this.cfg.chartEmpty, {
                xFmt: v => (trs[v - 1] ? trs[v - 1].short : ''),
                series: [{ name: 'Mean episodes', color: '#dc2626', type: 'bar', points: pts, barWidth: 0.5, labels: true }],
                annotations: [{ y: 0.001, text: 'complete protection', color: '#0f766e' }]
            }));
        }

        _infer() {
            const R = this.results;
            const ctrlN = R.saline ? M.mean(R.saline.map(x => x.count)) : null;
            let html = this.cfg.treatments.filter(t => R[t.id]).map(t => {
                const r = R[t.id];
                const c = M.mean(r.map(x => x.count));
                const p = ctrlN ? M.clamp((1 - c / ctrlN) * 100, 0, 100) : null;
                return `<div class="kv"><span>${t.short} (n=${r.length}) episodes / protection</span><span>${c.toFixed(1)} / ${p === null ? '—' : p.toFixed(0) + '%'}</span></div>`;
            }).join('');
            const n = [];
            if (!ctrlN) n.push('Run a <b>control</b> bird to establish the untreated number of episodes.');
            else {
                if (R.ondansetron) n.push('<b>Ondansetron is the most effective</b> drug here, because orally given copper sulphate works through vagal 5-HT₃ afferents — it blocks the afferent limb itself.');
                if (R.hyoscine) {
                    const c = M.mean(R.hyoscine.map(x => x.count));
                    const p = M.clamp((1 - c / ctrlN) * 100, 0, 100);
                    n.push(`<b>Hyoscine gives only ${p.toFixed(0)}% protection</b> despite being the drug of choice for motion sickness — that stimulus travels by a vestibular–cholinergic route, this one does not. Antiemetics are pathway-specific.`);
                }
                if (R.domperidone) n.push('Domperidone protects although it does not enter the CNS, because the chemoreceptor trigger zone lies <b>outside</b> the blood–brain barrier.');
                if (R.metoclopramide && R.domperidone) n.push('Metoclopramide and domperidone give similar protection; they differ clinically in that only metoclopramide penetrates the brain and risks extrapyramidal reactions.');
            }
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        /* ---------- simulation ---------- */
        update(dt) {
            const b = this.bird, o = this.obs;
            if (o && this.phase === 'observe') {
                const rate = this.episode ? 1.4 : (o.skip ? 240 : 30);
                o.sec = Math.min(OBS_SEC, o.sec + dt * rate);
                if (!this.episode && o.idx < o.events.length && o.sec >= o.events[o.idx]) {
                    o.idx++; o.count++;
                    this.episode = { t: 0, dur: M.rand(5, 8) };
                    if (o.latency === null) {
                        o.latency = o.events[o.idx - 1];
                        this.floatText(b.x, b.y - 72, `emesis at ${Math.round(o.latency)} s`, '#fda4af');
                    } else this.floatText(b.x, b.y - 72, 'emesis', '#c4b5fd');
                }
                if (this.episode) {
                    const ep = this.episode;
                    ep.t += dt * 1.4;
                    b.retch = Math.abs(Math.sin(ep.t * 5)) * M.clamp(ep.t / 0.6, 0, 1) * M.clamp((ep.dur - ep.t) / 0.8, 0, 1);
                    b.walk = 0;
                    if (ep.t >= ep.dur) { this.episode = null; b.retch = 0; }
                    this._refresh();
                } else {
                    b.retch = M.approach(b.retch, 0, 6, dt);
                    this._wander(b, OBS.x + 36, OBS.x + OBS.w - 36, dt);
                }
                if (o.sec >= OBS_SEC) this._finish();
            } else if (this.where === 'cage') {
                this._wander(b, CAGE.x + 36, CAGE.x + CAGE.w - 36, dt);
            } else if (this.where === 'obs') {
                this._wander(b, OBS.x + 36, OBS.x + OBS.w - 36, dt);
            }
            b.update(dt);
            this.hud('r', [
                { k: 'Elapsed', v: o ? LAB.fmtClock(o.sec / 60) : '—' },
                { k: 'Episodes', v: o ? String(o.count) : '—', tone: this.episode ? 'bad' : '' },
                { k: 'Latency', v: o ? (o.latency !== null ? Math.round(o.latency) + ' s' : (o.sec >= OBS_SEC ? 'none' : 'watching')) : '—', tone: o && o.latency === null && o.sec >= OBS_SEC ? 'good' : '' }
            ]);
        }

        _wander(b, lo, hi, dt) {
            const held = this.inject || this.syringeFill > 0 || this.busy || this.drag;
            const spd = 20;
            const moving = !held && Math.abs(this.walkTo - b.x) > 6;
            if (!held && (Math.abs(b.x - this.walkTo) < 6 || Math.random() < dt * 0.05)) this.walkTo = M.rand(lo, hi);
            if (moving) { b.facing = Math.sign(this.walkTo - b.x); b.x += b.facing * spd * dt; }
            b.walk = moving ? 1 : 0;
            b.x = M.clamp(b.x, lo - 6, hi + 6);
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._box(ctx, OBS, false, 'OBSERVATION CAGE');
            this._box(ctx, CAGE, false, 'HOLDING CAGE');
            if (this.where === 'cage' || this.where === 'carry') this.bird.draw(ctx);
            this._box(ctx, CAGE, true, 'HOLDING CAGE');
            if (this.where === 'obs') this.bird.draw(ctx);
            this._box(ctx, OBS, true, 'OBSERVATION CAGE');
            this._unit(ctx);
        }

        _box(ctx, c, front, label) {
            const floor = c.floor;
            if (!front) {
                G.shadow(ctx, c.x + c.w / 2, c.y + c.h + 2, c.w * 0.6, 9, 0.4);
                ctx.fillStyle = 'rgba(212,228,240,0.14)'; G.rr(ctx, c.x, c.y, c.w, c.h, 7); ctx.fill();
                const bg = ctx.createLinearGradient(0, floor - 8, 0, c.y + c.h);
                bg.addColorStop(0, '#e7edf3'); bg.addColorStop(1, '#b4c0cc');
                ctx.fillStyle = bg; ctx.fillRect(c.x + 3, floor - 6, c.w - 6, c.y + c.h - floor + 3);
            } else {
                G.glass(ctx, c.x, c.y, c.w, c.h, { r: 7, tint: 'rgba(200,225,240,0.05)' });
                // wire bars
                ctx.strokeStyle = 'rgba(148,163,184,0.5)'; ctx.lineWidth = 1.2;
                for (let x = c.x + 14; x < c.x + c.w - 6; x += 18) {
                    ctx.beginPath(); ctx.moveTo(x, c.y + 4); ctx.lineTo(x, c.y + c.h - 4); ctx.stroke();
                }
                G.metal(ctx, c.x - 5, c.y - 12, c.w + 10, 14, { tone: 'steel', r: 4 });
                G.text(ctx, label, c.x + 8, c.y - 18, { size: 9, color: 'rgba(226,232,240,0.72)', weight: 800 });
                if (c === OBS && this.phase === 'observe') {
                    const on = this.episode ? (performance.now() % 500 < 260) : true;
                    G.led(ctx, c.x + c.w - 16, c.y + 14, 5, this.episode ? '#ef4444' : '#22c55e', on);
                    G.text(ctx, this.episode ? 'EMESIS' : 'OBSERVING', c.x + c.w - 26, c.y + 18,
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
            G.text(ctx, 'EMESIS EVENT RECORDER', u.x + 22, u.y + 26, { size: 11, weight: 800, color: '#1e293b' });
            G.text(ctx, 'CuSO₄ 50 mg/kg ORAL · 30 min', u.x + 22, u.y + 40, { size: 8, weight: 700, color: '#64748b' });
            G.metal(ctx, u.x + 18, u.y + 50, u.w - 36, u.h - 70, { r: 8, tone: 'dark' });

            G.lcd(ctx, u.x + 32, u.y + 62, 130, 48, o ? LAB.fmtClock(o.sec / 60) : '—',
                { label: 'ELAPSED', color: '#34f5c5' });
            G.lcd(ctx, u.x + 174, u.y + 62, 130, 48, o ? String(o.count) : '0',
                { label: 'EPISODES', color: this.episode ? '#fb7185' : '#34f5c5' });
            G.lcd(ctx, u.x + 32, u.y + 124, 272, 46,
                o && o.latency !== null ? Math.round(o.latency) + ' s' : (o && o.sec >= OBS_SEC ? 'NO EMESIS' : '----'),
                { label: 'LATENCY TO FIRST EPISODE', color: o && o.latency !== null ? '#fb7185' : (o && o.sec >= OBS_SEC ? '#4ade80' : '#34f5c5') });

            G.led(ctx, u.x + 44, u.y + 192, 6, '#22c55e', true);
            G.text(ctx, 'POWER', u.x + 56, u.y + 196, { size: 8, color: '#cbd5e1', weight: 700 });
            G.led(ctx, u.x + 130, u.y + 192, 6, '#f59e0b', this.phase === 'observe');
            G.text(ctx, 'RUNNING', u.x + 142, u.y + 196, { size: 8, color: '#cbd5e1', weight: 700 });

            if (o) {
                const bx = u.x + 32, by = u.y + 212, bw = u.w - 64;
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

    LAB.register(29, Antiemetic);
})();
