/**
 * EXP 24 — Anti-inflammatory activity: carrageenan-induced rat paw oedema
 * Flow: choose group → oral pretreatment → wait 1 h → basal paw volume (plethysmometer)
 *       → 0.1 mL 1% carrageenan sub-plantar → hourly readings 1–4 h (paw visibly swells)
 *       → oedema & % inhibition vs control.
 */
(function () {
    const { M, G, Rodent } = LAB;
    const REST = { x: 380, y: 428 };
    const CELL = { x: 620, w: 66, top: 212, bot: 330, level0: 240 };
    const REF = { x: 744, w: 38, top: 246 };
    const CARR = { id: 'carr', name: '1% λ-carrageenan 0.1 mL', short: 'Carrag.', color: '#e2e8f0' };
    const FOOT = { x: -32, y: -2 };

    /* shared group-E1 scenery helpers (wall clock with simulated time, home cage) */
    LAB.e1 = LAB.e1 || {
        clock(ctx, x, y, r, simMin, startH = 9) {
            const tot = startH * 60 + simMin;
            const hh = (tot / 60) % 12, mm = tot % 60;
            G.shadow(ctx, x + 3, y + r + 6, r * 0.9, 5, 0.25);
            const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);
            g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#dfe6ec');
            ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(x, y, r + 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#334155';
            for (let i = 0; i < 12; i++) {
                const a = i / 12 * Math.PI * 2; ctx.lineWidth = i % 3 ? 1 : 2.2;
                ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82); ctx.lineTo(x + Math.cos(a) * r * 0.94, y + Math.sin(a) * r * 0.94); ctx.stroke();
            }
            const hand = (a, len, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - Math.PI / 2) * len, y + Math.sin(a - Math.PI / 2) * len); ctx.stroke(); };
            hand(hh / 12 * Math.PI * 2, r * 0.5, 3, '#0f172a');
            hand(mm / 60 * Math.PI * 2, r * 0.75, 2, '#0f172a');
            ctx.fillStyle = '#dc2626'; ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.4, r * 0.5, r * 0.25, -0.4, 0, Math.PI * 2); ctx.fill();
        },
        homeCage(ctx, x, y, w, h, mates, label = 'HOME CAGE') {
            const floor = y + h - 8;
            G.shadow(ctx, x + w / 2, y + h + 2, w * 0.6, 8, 0.4);
            ctx.fillStyle = 'rgba(210,225,235,0.16)'; G.rr(ctx, x, y, w, h, 6); ctx.fill();
            const bg = ctx.createLinearGradient(0, floor - 6, 0, y + h);
            bg.addColorStop(0, '#d9b98a'); bg.addColorStop(1, '#a98455');
            ctx.fillStyle = bg; ctx.fillRect(x + 3, floor - 4, w - 6, y + h - floor + 1);
            ctx.fillStyle = 'rgba(120,84,40,0.5)';
            for (let i = 0; i < 36; i++) ctx.fillRect(x + 6 + (i * 53) % (w - 12), floor - 3 + (i * 7) % 8, 5, 1.6);
            (mates || []).forEach(m => m.draw(ctx));
            G.glass(ctx, x, y, w, h, { r: 6, tint: 'rgba(200,225,240,0.06)' });
            ctx.strokeStyle = 'rgba(148,163,184,0.95)'; ctx.lineWidth = 1;
            for (let gx = x + 8; gx < x + w; gx += 9) { ctx.beginPath(); ctx.moveTo(gx, y - 6); ctx.lineTo(gx, y + 2); ctx.stroke(); }
            G.metal(ctx, x - 4, y - 8, w + 8, 5, { r: 2, tone: 'steel' });
            G.text(ctx, label, x + 10, y + 18, { size: 9, color: 'rgba(226,232,240,0.75)', weight: 800 });
        },
        mates(n, x0, x1, floor, kind = 'rat', scale = 1.05) {
            const out = [];
            for (let i = 0; i < n; i++) {
                const r = new LAB.Rodent({ x: M.lerp(x0, x1, n > 1 ? i / (n - 1) : 0.5), y: floor, kind, scale, facing: i % 2 ? -1 : 1, breathRate: 1.3 });
                r.set({ sedation: 0.25 + 0.2 * i, crouch: 0.5, sniff: 0.3 }); r.groundY = floor;
                out.push(r);
            }
            return out;
        }
    };

    // oedema (mL) model — early (histamine/5-HT/kinins) + late (prostaglandin) phase
    function oedema(t, g) {
        if (t <= 0) return 0;
        const early = 0.28 * (1 - Math.exp(-t / 0.5)) * (1 - g.early);
        const s = x => 1 / (1 + Math.exp(-(x - 2.0) / 0.45));
        const late = 0.52 * (s(t) - s(0)) * (1 - g.late);
        return early + late;
    }

    class PawOedema extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 430, seed: 4 },
                treatmentTitle: 'Pretreatment (p.o., 1 h before)',
                steps: [
                    'Select a treatment group and give the drug <b>orally</b> (drag the feeding-needle syringe to the mouth).',
                    'Wait <b>1 h</b> for absorption of the test drug.',
                    'Dip the right hind paw up to the ink mark into the plethysmometer cell to record <b>basal volume V₀</b>.',
                    'Inject <b>0.1 mL of 1% carrageenan</b> into the sub-plantar tissue of the right hind paw.',
                    'Record paw volume every hour for <b>4 h</b> — oedema = Vₜ − V₀.',
                    'Repeat for each group and calculate <b>% inhibition</b> of oedema vs control.'
                ],
                treatments: [
                    { id: 'ctrl', name: 'Vehicle — 1% CMC 10 mL/kg', short: 'Vehicle', cls: 'Control', color: '#64748b', early: 0, late: 0 },
                    { id: 'indo', name: 'Indomethacin 10 mg/kg p.o.', short: 'Indo 10', cls: 'Non-selective COX inhibitor', color: '#0d9488', early: 0.12, late: 0.72 },
                    { id: 'diclo', name: 'Diclofenac 10 mg/kg p.o.', short: 'Diclo 10', cls: 'COX inhibitor (NSAID)', color: '#7c3aed', early: 0.1, late: 0.6 },
                    { id: 'pred', name: 'Dexamethasone 1 mg/kg p.o.', short: 'Dexa 1', cls: 'Glucocorticoid', color: '#d97706', early: 0.35, late: 0.75 }
                ],
                table: ['Group', 'Time', 'Paw vol (mL)', 'Oedema (mL)'],
                chart: true, chartTitle: 'Paw oedema (mL) vs time after carrageenan',
                chartEmpty: { xMin: 0, xMax: 4, yMin: 0, yMax: 1, xLabel: 'Time (h)', yLabel: 'Oedema (mL)' },
                viva: [
                    { q: 'The late phase (2–4 h) of carrageenan oedema is mediated mainly by:', opts: ['Histamine and 5-HT', 'Prostaglandins (COX-2 induction) and neutrophil infiltration', 'Acetylcholine', 'Noradrenaline'], ans: 1, exp: 'The early phase (0–1.5 h) involves histamine, 5-HT and bradykinin; the late phase is sustained by prostaglandins, which is why NSAIDs act mainly on the late phase.' },
                    { q: 'What does a plethysmometer measure?', opts: ['Paw temperature', 'Paw volume by fluid displacement', 'Blood flow', 'Pain threshold'], ans: 1, exp: 'Archimedes’ principle: the paw displaces a volume of fluid equal to its own volume; a transducer converts the level change to mL.' },
                    { q: '% inhibition of oedema is calculated as:', opts: ['(Vc − Vt) / Vc × 100', 'Vt / Vc × 100', '(Vt − V₀) × 100', 'V₀ / Vt'], ans: 0, exp: 'Vc and Vt are the mean oedema (Vₜ − V₀) of control and treated groups at the same time point.' },
                    { q: 'Why is the paw dipped exactly up to an ink mark each time?', opts: ['To keep the rat calm', 'To ensure the same immersion depth so readings are comparable', 'To sterilise the paw', 'To stop bleeding'], ans: 1, exp: 'Variable immersion depth would change the displaced volume independently of oedema.' }
                ],
                inferenceHint: 'Complete the 4-hour time course for the control group and at least one NSAID group.'
            };
        }

        setup() {
            this.results = {};
            this.ratNo = 0;
            this.reading = 0;      // LCD value
            this.immersion = 0;    // 0..1 how deep the paw is
            this.hotspots = [
                { x: CELL.x - CELL.w / 2, y: CELL.top, w: CELL.w, h: CELL.bot - CELL.top, label: 'Measuring cell (water + wetting agent)' },
                { x: REF.x - REF.w / 2, y: REF.top, w: REF.w, h: CELL.bot - REF.top, label: 'Transducer cell (conductance)' },
                { x: 580, y: 344, w: 210, h: 60, label: 'Digital plethysmometer read-out (mL)' }
            ];
            this.mates = LAB.e1.mates(2, 90, 210, 420);
            this.resetAnimal();
        }

        resetAnimal() {
            this.ratNo++;
            this.rat = new Rodent({ x: REST.x, y: REST.y, scale: 1.6, kind: 'rat', facing: 1, breathRate: 1.6 });
            this.rat.set({ sniff: 1 });
            this.phase = 'select';
            this.group = null;
            this.tCarr = null;
            this.v0 = null;
            this.hours = 0;
            this.series = [];
            this.where = 'rest';
            this.tr = this.cfg.treatments.find(t => t.id === (this.tr && this.tr.id)) || this.cfg.treatments[0];
            this._markTreatment();
            this.setStep(0);
            this._refresh();
        }

        select(id) {
            if (this.phase !== 'select') { this.toast('Treatment is already given — use “Fresh animal” for the next group.', 'warn'); return; }
            super.select(id);
            this._refresh();
        }

        _pawSwell() { return this.group && this.tCarr !== null ? oedema(this.hours, this.group) : 0; }

        _refresh() {
            const b = this.busy;
            this.hud('l', [{ k: 'Rat', v: '#' + this.ratNo }, { k: 'Group', v: this.group ? this.group.short : '—' }]);
            const ph = this.phase;
            if (ph === 'select') {
                this.status(`Pretreat with <b>${this.tr.name}</b> by oral gavage — click the syringe, then drag it to the rat’s mouth.`);
                this.actions([{ label: '💉 Give orally', primary: true, disabled: b, onClick: () => this.autoInject() }]);
            } else if (ph === 'pre') {
                this.status('Drug given. Allow 1 h for absorption before inducing inflammation.');
                this.actions([{ label: '⏩ Wait 1 h', primary: true, disabled: b, onClick: () => this.timeLapse(60, 3, { label: 'Absorption', onDone: () => { this.phase = 'basal'; this.setStep(2); this._refresh(); } }) }]);
            } else if (ph === 'basal') {
                this.status('Mark the lateral malleolus with ink and dip the paw into the cell to read the <b>basal paw volume V₀</b>.');
                this.actions([{ label: '📏 Measure V₀', primary: true, disabled: b, onClick: () => this.measure(0) }]);
            } else if (ph === 'carr') {
                this.status(`V₀ = <b>${this.v0.toFixed(2)} mL</b>. Load carrageenan and inject 0.1 mL into the plantar surface of the right hind paw.`);
                this.actions([{ label: '💉 Inject carrageenan', primary: true, disabled: b, onClick: () => this.autoInject() }]);
            } else if (ph === 'read') {
                this.status(`Carrageenan injected. ${this.hours}/4 hourly readings done — the paw is ${this.hours >= 2 ? 'red and markedly swollen' : 'starting to swell'}.`);
                this.actions([{ label: `⏩ +1 h & measure (${this.hours + 1} h)`, primary: true, disabled: b, onClick: () => this.nextHour() }]);
            } else {
                this.status('Time course complete. Take a <b>fresh rat</b> for the next group.');
                this.actions([{ label: '↺ Next rat', primary: true, disabled: b, onClick: () => this.resetAnimal() }]);
            }
        }

        getInjectZone() {
            const r = this.rat;
            if (this.where !== 'rest') return null;
            if (this.phase === 'select') return { x: r.x + 84, y: r.y - 38, r: 24, label: 'Mouth (oral feeding needle)', angle: Math.PI * 0.72 };
            if (this.phase === 'carr') { const f = this._footWorld(); return { x: f.x, y: f.y - 2, r: 22, label: 'Right hind paw (sub-plantar)', angle: Math.PI / 2 + 0.35 }; }
            return null;
        }

        onInjected(tr) {
            if (this.phase === 'select') {
                this.group = tr;
                this.floatText(this.rat.x + 80, this.rat.y - 80, `${tr.short} p.o.`, '#fde68a');
                this.phase = 'pre'; this.setStep(1);
            } else if (this.phase === 'carr') {
                this.tCarr = 0; this.hours = 0;
                const f = this._footWorld();
                for (let i = 0; i < 6; i++) this.fx.emit({ x: f.x, y: f.y, vx: M.rand(-20, 20), vy: M.rand(-30, -5), r: 1.5, life: 0.5, color: 'rgba(248,250,252,0.9)' });
                this.floatText(f.x, f.y - 40, 'Carrageenan 0.1 mL', '#fecaca');
                this.tr = this.group;
                this.series = [[0, 0]];
                this.phase = 'read'; this.setStep(4);
            }
            setTimeout(() => this._refresh(), 900);
        }

        nextHour() {
            const h0 = this.hours;
            this.timeLapse(60, 2.6, {
                label: 'Inflammation developing',
                onTick: (s, p) => { this.hours = h0 + p; },
                onDone: () => { this.hours = h0 + 1; this.measure(this.hours); }
            });
            this._refresh();
        }

        _footWorld(rot = this.rat.rot, x = this.rat.x, y = this.rat.y) {
            const s = this.rat.scale;
            const lx = FOOT.x * s, ly = FOOT.y * s;
            return { x: x + lx * Math.cos(rot) - ly * Math.sin(rot), y: y + lx * Math.sin(rot) + ly * Math.cos(rot) };
        }

        /** dip the paw into the plethysmometer cell and read the volume */
        measure(hour) {
            this.busy = true;
            this.where = 'dip';
            const r = this.rat;
            const ROT = -1.22;
            const off = (() => { const f = this._footWorld(ROT, 0, 0); return f; })();
            const above = { x: CELL.x - off.x, y: CELL.level0 - 70 - off.y };
            const inside = { x: CELL.x - off.x, y: CELL.level0 + 34 - off.y };
            const sx = r.x, sy = r.y;
            const trueV = (this.v0 || M.gauss(1.22, 0.05)) + (hour ? oedema(hour, this.group) + M.gauss(0, 0.025) : 0);
            const val = hour ? trueV : trueV;
            this.reading = 0;
            this.lcdHold = false;
            this.tw.add(0.9, e => { r.x = M.lerp(sx, above.x, e); r.y = M.lerp(sy, above.y, e) - Math.sin(e * Math.PI) * 30; r.rot = ROT * e; }, {
                onDone: () => this.tw.add(0.6, e => { r.y = M.lerp(above.y, inside.y, e); this.immersion = Math.max(0, (e - 0.35) / 0.65); }, {
                    onDone: () => this.tw.add(1.2, e => { this.reading = val * e + M.rand(-0.01, 0.01) * (1 - e); }, {
                        ease: LAB.ease.out,
                        onDone: () => {
                            this.reading = val; this.lcdHold = true;
                            this.floatText(CELL.x + 90, 190, `${val.toFixed(2)} mL`, '#5eead4');
                            this.tw.wait(0.7, () => this.tw.add(0.5, e => { r.y = M.lerp(inside.y, above.y, e); this.immersion = Math.max(0, 1 - e * 1.6); }, {
                                onDone: () => this.tw.add(0.9, e => { r.x = M.lerp(above.x, REST.x, e); r.y = M.lerp(above.y, REST.y, e) - Math.sin(e * Math.PI) * 30; r.rot = ROT * (1 - e); }, {
                                    onDone: () => { r.rot = 0; this.where = 'rest'; this.busy = false; this._record(hour, val); }
                                })
                            }));
                        }
                    })
                })
            });
            this._refresh();
        }

        _record(hour, v) {
            const g = this.group;
            if (!g) return;
            if (hour === 0) {
                this.v0 = v;
                this.addRow([`<b>${g.short}</b> R${this.ratNo}`, 'basal', v.toFixed(2), '—']);
                this.phase = 'carr'; this.setStep(3); this.tr = CARR; this.syringeFill = 0;
            } else {
                const ed = Math.max(0, v - this.v0);
                this.series.push([hour, ed]);
                this.addRow([`<b>${g.short}</b> R${this.ratNo}`, hour + ' h', v.toFixed(2), `<b>${ed.toFixed(2)}</b>`], ed > 0.5 ? 'up' : '');
                if (hour >= 4) {
                    (this.results[g.id] = this.results[g.id] || []).push(this.series.slice());
                    this.markDone(g.id);
                    this.phase = 'done'; this.setStep(5);
                    this.toast(`${g.short}: oedema at 3 h = <b>${this.series[3][1].toFixed(2)} mL</b>`, 'success');
                    this._infer();
                }
                this._chart();
            }
            this._refresh();
        }

        _chart() {
            const series = [];
            this.cfg.treatments.forEach(t => {
                const runs = this.results[t.id];
                if (!runs) return;
                const pts = [0, 1, 2, 3, 4].map(h => [h, M.mean(runs.map(r => r[h][1]))]);
                series.push({ name: t.short, color: t.color, points: pts, markers: true });
            });
            if (this.phase !== 'done' && this.series.length) series.push({ name: 'current', color: this.group.color, points: this.series, dashed: true, markers: true });
            this.chart.draw({ xMin: 0, xMax: 4, yMin: 0, yMax: 1, xTicks: [0, 1, 2, 3, 4], xLabel: 'Time after carrageenan (h)', yLabel: 'Oedema (mL)', series });
        }

        _infer() {
            const at3 = id => this.results[id] ? M.mean(this.results[id].map(r => r[3][1])) : null;
            const c = at3('ctrl');
            let html = this.cfg.treatments.filter(t => this.results[t.id]).map(t => {
                const v = at3(t.id);
                const inh = c && t.id !== 'ctrl' ? ` · ${((c - v) / c * 100).toFixed(0)}% inhib.` : '';
                return `<div class="kv"><span>${t.short} (3 h)</span><span>${v.toFixed(2)} mL${inh}</span></div>`;
            }).join('');
            if (c && Object.keys(this.results).length > 1) html += '<p style="margin-top:8px">NSAIDs produce little effect on the <b>early phase</b> (histamine, 5-HT) but strongly suppress the <b>late prostaglandin phase</b> (2–4 h) → evidence of <b>COX inhibition</b>. Dexamethasone inhibits both phases (phospholipase A₂ / COX-2 induction blocked).</p>';
            else if (!c) html += '<p style="margin-top:8px">Run the <b>vehicle control</b> group to calculate % inhibition.</p>';
            this.infer(html);
        }

        update(dt) {
            const r = this.rat;
            r.set({ walk: 0, sniff: this.where === 'rest' ? 1 : 0.3 });
            // swollen paw makes the rat favour it (slight hunch)
            r.set({ hunch: Math.min(1, this._pawSwell() * 0.8) });
            r.update(dt);
            this.mates.forEach(m => m.update(dt));
            if (!this.lcdHold && this.where === 'rest') this.reading = M.approach(this.reading, 0, 2, dt);
            this.hud('r', [
                { k: 'Plethysmometer', v: this.reading.toFixed(2) + ' mL' },
                { k: 'Since carrageenan', v: this.tCarr !== null ? this.hours.toFixed(1) + ' h' : '—', tone: this.hours >= 2 ? 'warn' : '' }
            ]);
            // gentle bubbles in cell
            if (Math.random() < dt * 1.5) this.fx.emit({ x: CELL.x + M.rand(-20, 20), y: CELL.bot - 8, vy: -18, r: 1.4, life: 2.5, shape: 'bubble', color: 'rgba(255,255,255,0.6)', update: q => { if (q.y < this._level() + 2) q.age = q.life; } });
        }

        _level() {
            // displaced volume raises the level (exaggerated for visibility)
            const disp = this.immersion * (this.reading || 1.2);
            return CELL.level0 - disp * 14;
        }

        draw(ctx) {
            LAB.e1.clock(ctx, 470, 190, 34, this.simMin);
            LAB.e1.homeCage(ctx, 34, 318, 240, 110, this.mates, 'HOME CAGE · GROUP RATS');
            this._drawUnit(ctx);
            this._drawCellBack(ctx);
            this._drawRat(ctx);
            this._drawCellFront(ctx);
        }

        _drawRat(ctx) {
            const r = this.rat;
            r.shadow = this.where === 'rest';
            r.draw(ctx);
            // swollen, inflamed paw + ink mark, drawn in the rat's frame
            const sw = this._pawSwell();
            ctx.save();
            ctx.translate(r.x, r.y); ctx.rotate(r.rot); ctx.scale(r.facing * r.scale, r.scale);
            if (sw > 0.01) {
                const k = Math.min(1, sw / 0.8);
                const g = ctx.createRadialGradient(-31, -4, 1, -31, -4, 7 + k * 6);
                g.addColorStop(0, `rgba(239,68,68,${0.55 + k * 0.35})`);
                g.addColorStop(0.7, `rgba(244,114,182,${0.5 + k * 0.3})`);
                g.addColorStop(1, 'rgba(244,114,182,0)');
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.ellipse(-30, -4, 7 + k * 5, 4 + k * 4, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = `rgba(185,28,28,${0.25 + k * 0.4})`; ctx.lineWidth = 0.7; ctx.stroke();
            }
            // ink mark at the malleolus
            ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(-36, -12); ctx.lineTo(-30, -13); ctx.stroke();
            ctx.restore();
        }

        _drawUnit(ctx) {
            const x = 540, y = 330, w = 360, h = 102;
            G.shadow(ctx, x + w / 2, 432, w * 0.55, 10, 0.45);
            const g = ctx.createLinearGradient(0, y, 0, y + h);
            g.addColorStop(0, '#eef2f6'); g.addColorStop(0.12, '#cfd7df'); g.addColorStop(1, '#8b96a3');
            ctx.fillStyle = g; G.rr(ctx, x, y, w, h, 8); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
            G.rr(ctx, x + 14, y + 12, w - 28, h - 24, 6); ctx.fillStyle = '#2a313a'; ctx.fill();
            G.lcd(ctx, x + 40, y + 20, 200, 56, this.reading.toFixed(2) + ' mL', { label: 'PAW VOLUME', color: '#34f5c5' });
            G.led(ctx, x + 262, y + 34, 4.5, '#22c55e', true);
            G.led(ctx, x + 262, y + 58, 4.5, '#f59e0b', this.immersion > 0.5);
            G.text(ctx, 'ZERO', x + 296, y + 38, { size: 9, color: '#cbd5e1', weight: 700 });
            G.text(ctx, 'HOLD', x + 296, y + 62, { size: 9, color: '#cbd5e1', weight: 700 });
            G.text(ctx, 'DIGITAL PLETHYSMOMETER', x + 40, y + 92, { size: 9, color: '#475569', weight: 800 });
            // connecting tube between cells
            ctx.strokeStyle = 'rgba(203,225,240,0.9)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(CELL.x, CELL.bot - 6); ctx.quadraticCurveTo(CELL.x + 60, CELL.bot + 4, REF.x, CELL.bot - 6); ctx.stroke();
            ctx.strokeStyle = 'rgba(56,189,248,0.55)'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(CELL.x, CELL.bot - 6); ctx.quadraticCurveTo(CELL.x + 60, CELL.bot + 4, REF.x, CELL.bot - 6); ctx.stroke();
        }

        _liquid(ctx, cx, w, top, bot, alpha) {
            const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
            g.addColorStop(0, `rgba(14,116,144,${alpha})`); g.addColorStop(0.4, `rgba(56,189,248,${alpha * 0.7})`); g.addColorStop(1, `rgba(14,116,144,${alpha})`);
            ctx.fillStyle = g; ctx.fillRect(cx - w / 2 + 3, top, w - 6, bot - top - 3);
            ctx.fillStyle = `rgba(186,230,253,${alpha + 0.2})`;
            ctx.beginPath(); ctx.ellipse(cx, top, w / 2 - 3, 4, 0, 0, Math.PI * 2); ctx.fill();
        }

        _drawCellBack(ctx) {
            const lv = this._level();
            // reference cell (level follows measuring cell)
            this._liquid(ctx, REF.x, REF.w, lv + 10, CELL.bot, 0.55);
            G.glass(ctx, REF.x - REF.w / 2, REF.top, REF.w, CELL.bot - REF.top, { r: 4 });
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(REF.x - 6, REF.top - 20); ctx.lineTo(REF.x - 6, CELL.bot - 20); ctx.moveTo(REF.x + 6, REF.top - 20); ctx.lineTo(REF.x + 6, CELL.bot - 20); ctx.stroke();
            // measuring cell interior back
            ctx.fillStyle = 'rgba(200,225,240,0.10)';
            ctx.fillRect(CELL.x - CELL.w / 2, CELL.top, CELL.w, CELL.bot - CELL.top);
            this._liquid(ctx, CELL.x, CELL.w, lv, CELL.bot, 0.35);
        }

        _drawCellFront(ctx) {
            const lv = this._level();
            // front water layer tints the submerged paw
            ctx.fillStyle = 'rgba(56,189,248,0.22)';
            ctx.fillRect(CELL.x - CELL.w / 2 + 3, lv, CELL.w - 6, CELL.bot - lv - 3);
            G.glass(ctx, CELL.x - CELL.w / 2, CELL.top, CELL.w, CELL.bot - CELL.top, { r: 5 });
            // graduations
            ctx.strokeStyle = 'rgba(30,41,59,0.5)'; ctx.lineWidth = 1;
            for (let i = 0; i < 10; i++) { const yy = CELL.bot - 14 - i * 12; ctx.beginPath(); ctx.moveTo(CELL.x + CELL.w / 2 - 12, yy); ctx.lineTo(CELL.x + CELL.w / 2 - 3, yy); ctx.stroke(); }
            // electrodes
            ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(CELL.x - 24, CELL.top - 6); ctx.lineTo(CELL.x - 24, CELL.bot - 12); ctx.stroke();
            G.metal(ctx, CELL.x - CELL.w / 2 - 6, CELL.bot - 4, CELL.w + 12, 10, { r: 3, tone: 'dark' });
        }
    }

    LAB.register(24, PawOedema);
})();
