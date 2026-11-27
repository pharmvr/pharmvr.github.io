/**
 * EXP 26 — Diuretic activity: Lipschitz test in saline-loaded rats
 * Flow: select group → dose p.o. with normal saline load (25 mL/kg) → place in metabolic cage
 *       → 5 h collection with live dripping urine into a graduated cylinder
 *       → flame photometer reads Na⁺/K⁺ → urine volume, Na⁺/K⁺ ratio and Lipschitz value.
 */
(function () {
    const { M, G, Rodent } = LAB;
    const CAGE = { x: 296, y: 138, w: 258, h: 162 };
    const FUNNEL = { x: 425, y: 300, w: 120, h: 58 };
    const CYL = { x: 425, w: 60, top: 352, bot: 432, cap: 14 };  // cap = mL at full height
    const FP = { x: 640, y: 296, w: 250, h: 136 };

    class Diuretic extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 434, seed: 11 },
                treatmentTitle: 'Treatment (p.o. with saline load)',
                steps: [
                    'Fast the rat 18 h with water ad libitum, then weigh it.',
                    'Select a group and give the drug <b>orally with normal saline 25 mL/kg</b> as the water load.',
                    'Place the rat in the <b>metabolic cage</b> (wire floor, urine funnel, food/faeces separator).',
                    'Collect urine for <b>5 h</b> and read the volume in the graduated cylinder.',
                    'Aspirate an aliquot into the <b>flame photometer</b> for Na⁺ and K⁺.',
                    'Compare urine volume, Na⁺/K⁺ ratio and the <b>Lipschitz value</b> (test ÷ urea) with control.'
                ],
                treatments: [
                    { id: 'ctrl', name: 'Normal saline only (control)', short: 'Control', cls: 'Saline load 25 mL/kg', color: '#64748b', vol: 2.6, na: 112, k: 42 },
                    { id: 'urea', name: 'Urea 1 g/kg p.o.', short: 'Urea', cls: 'Osmotic — Lipschitz standard', color: '#0ea5e9', vol: 5.2, na: 148, k: 48 },
                    { id: 'furo', name: 'Furosemide 20 mg/kg p.o.', short: 'Furo 20', cls: 'Loop — NKCC2 inhibitor', color: '#dc2626', vol: 9.1, na: 268, k: 76 },
                    { id: 'hctz', name: 'Hydrochlorothiazide 10 mg/kg p.o.', short: 'HCTZ 10', cls: 'Thiazide — NCC inhibitor', color: '#7c3aed', vol: 6.3, na: 192, k: 68 },
                    { id: 'spiro', name: 'Spironolactone 20 mg/kg p.o.', short: 'Spiro 20', cls: 'K⁺-sparing — aldosterone antag.', color: '#16a34a', vol: 4.4, na: 156, k: 26 }
                ],
                table: ['Group', 'Urine (mL/5 h)', 'Na⁺ (mEq/L)', 'Na⁺/K⁺'],
                chart: true, chartTitle: 'Urine output (mL / 5 h per 100 g)',
                chartEmpty: { xMin: 0.4, xMax: 5.6, yMin: 0, yMax: 11, yLabel: 'Urine volume (mL)', xTicks: [] },
                viva: [
                    { q: 'What is the Lipschitz value?', opts: ['Ratio of urine volume of the test drug to that of urea (the standard osmotic diuretic)', 'The LD₅₀ of a diuretic', 'Na⁺ divided by K⁺', 'Urine pH'], ans: 0, exp: 'Lipschitz value = (urine volume with test) / (urine volume with urea). A value > 1 indicates diuretic activity greater than the standard.' },
                    { q: 'Why are the rats given a saline water load?', opts: ['To standardise hydration so urine flow is measurable in all animals', 'To make them sleep', 'To raise blood pressure', 'To acidify the urine'], ans: 0, exp: 'A uniform water and salt load ensures comparable baseline urine flow; without it, output is too low and variable.' },
                    { q: 'A high Na⁺/K⁺ ratio in the urine indicates:', opts: ['Good natriuresis with relative K⁺ sparing', 'Severe hypokalaemia', 'Poor diuretic activity', 'Renal failure'], ans: 0, exp: 'Loop and thiazide diuretics increase Na⁺ excretion; a higher Na⁺/K⁺ ratio suggests less kaliuresis, as seen with K⁺-sparing agents.' },
                    { q: 'Furosemide acts on which part of the nephron?', opts: ['Thick ascending limb of the loop of Henle (NKCC2)', 'Proximal tubule carbonic anhydrase', 'Distal convoluted tubule NCC', 'Collecting duct ENaC'], ans: 0, exp: 'Loop diuretics inhibit the Na⁺-K⁺-2Cl⁻ cotransporter, abolishing the corticomedullary gradient and producing a powerful diuresis.' }
                ],
                inferenceHint: 'Run the control, the urea standard and at least one test diuretic.'
            };
        }

        setup() {
            this.results = {};
            this.ratNo = 0;
            this.vol = 0;          // mL collected
            this.rate = 0;         // mL/h
            this.na = 0; this.k = 0;
            this.flame = 0.4;
            this.hotspots = [
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Metabolic cage — wire mesh floor' },
                { x: FUNNEL.x - 60, y: FUNNEL.y, w: 120, h: 58, label: 'Urine funnel with faeces separator' },
                { x: CYL.x - 30, y: CYL.top, w: 60, h: 74, label: 'Graduated cylinder (12 mL)' },
                { x: FP.x, y: FP.y, w: FP.w, h: FP.h, label: 'Flame photometer — Na⁺ / K⁺' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.ratNo++;
            this.rat = new Rodent({ x: 150, y: 424, scale: 1.45, kind: 'rat', facing: 1, breathRate: 1.6 });
            this.rat.groundY = 424;
            this.phase = 'dose';
            this.group = null;
            this.where = 'bench';
            this.vol = 0; this.rate = 0; this.na = 0; this.k = 0;
            this.hours = 0;
            this.target = 160;
            this.setStep(1);
            this._refresh();
        }

        select(id) {
            if (this.phase !== 'dose') { this.toast('Dose already given — take a fresh rat for the next group.', 'warn'); return; }
            super.select(id);
            this._refresh();
        }

        _refresh() {
            const b = this.busy, ph = this.phase;
            this.hud('l', [{ k: 'Rat', v: '#' + this.ratNo }, { k: 'Group', v: this.group ? this.group.short : '—' }]);
            if (ph === 'dose') {
                this.status(`Give <b>${this.tr.name}</b> orally together with the saline load (drag the syringe to the mouth).`);
                this.actions([{ label: '💉 Dose + saline load', primary: true, disabled: b, onClick: () => this.autoInject() }]);
            } else if (ph === 'place') {
                this.status('Place the dosed rat into the metabolic cage over the urine funnel.');
                this.actions([{ label: '🐀 Place in metabolic cage', primary: true, disabled: b, onClick: () => this.place() }]);
            } else if (ph === 'collect') {
                this.status(`Collecting urine — <b>${this.vol.toFixed(2)} mL</b> after ${this.hours.toFixed(1)} h.`);
                this.actions([{ label: '⏩ Collect for 5 h', primary: true, disabled: b, onClick: () => this.collect() }]);
            } else if (ph === 'flame') {
                this.status(`Collection over: <b>${this.vol.toFixed(2)} mL</b>. Aspirate an aliquot for Na⁺ / K⁺ estimation.`);
                this.actions([{ label: '🔥 Run flame photometer', primary: true, disabled: b, onClick: () => this.runFlame() }]);
            } else {
                this.status('Readings recorded. Take a <b>fresh rat</b> for the next group.');
                this.actions([{ label: '↺ Next rat', primary: true, disabled: b, onClick: () => this.resetAnimal() }]);
            }
        }

        getInjectZone() {
            if (this.phase !== 'dose' || this.where !== 'bench') return null;
            const r = this.rat;
            return { x: r.x + 76, y: r.y - 34, r: 24, label: 'Mouth (oral feeding needle)', angle: Math.PI * 0.72 };
        }

        onInjected(tr) {
            this.group = tr;
            this.floatText(this.rat.x + 70, this.rat.y - 80, `${tr.short} + saline 25 mL/kg`, '#fde68a');
            this.phase = 'place'; this.setStep(2);
            setTimeout(() => this._refresh(), 900);
        }

        place() {
            this.busy = true;
            this.where = 'moving';
            const r = this.rat;
            const sx = r.x, sy = r.y, tx = CAGE.x + 70, ty = CAGE.y + CAGE.h - 16;
            this.tw.add(1.3, e => {
                r.x = M.lerp(sx, tx, e); r.y = M.lerp(sy, ty, e) - Math.sin(e * Math.PI) * 70;
                r.rot = Math.sin(e * Math.PI) * -0.3;
            }, {
                onDone: () => {
                    r.rot = 0; r.groundY = ty; this.where = 'cage'; this.busy = false;
                    this.phase = 'collect'; this.setStep(3); this._refresh();
                }
            });
            this._refresh();
        }

        collect() {
            const g = this.group;
            const total = g.vol * (1 + M.gauss(0, 0.07));
            this.timeLapse(5 * 60, 9, {
                label: 'Urine collection',
                onTick: (s, p) => {
                    this.hours = 5 * p;
                    // loop diuretics peak early, thiazides are flatter
                    const shape = g.id === 'furo' ? 1 - Math.exp(-p * 3.2) : (g.id === 'ctrl' ? p : 1 - Math.exp(-p * 2.0));
                    const norm = g.id === 'furo' ? 1 - Math.exp(-3.2) : (g.id === 'ctrl' ? 1 : 1 - Math.exp(-2.0));
                    const v = total * shape / norm;
                    this.rate = (v - this.vol) / Math.max(1e-3, 5 * (p - (this._lastP || 0))) ;
                    this._lastP = p;
                    this.vol = v;
                },
                onDone: () => { this.vol = total; this.hours = 5; this.phase = 'flame'; this.setStep(4); this._refresh(); }
            });
            this._refresh();
        }

        runFlame() {
            const g = this.group;
            if (!g) { this.toast('Treat and collect urine from a rat first.', 'warn'); return; }
            this.busy = true;
            const na = M.gauss(g.na, 6), k = M.gauss(g.k, 3);
            this.flameBoost = 1;
            this.tw.add(1.6, e => { this.na = na * e; this.k = k * e; }, {
                ease: LAB.ease.out,
                onDone: () => {
                    this.na = na; this.k = k; this.busy = false;
                    this.floatText(FP.x + FP.w / 2, FP.y - 16, `Na⁺ ${na.toFixed(0)} · K⁺ ${k.toFixed(0)}`, '#fdba74');
                    this._record(na, k);
                }
            });
            this._refresh();
        }

        _record(na, k) {
            const g = this.group;
            (this.results[g.id] = this.results[g.id] || []).push({ vol: this.vol, na, k });
            this.markDone(g.id);
            this.addRow([`<b>${g.short}</b> R${this.ratNo}`, `<b>${this.vol.toFixed(2)}</b>`, na.toFixed(0), (na / k).toFixed(2)], this.vol > 5 ? 'up' : '');
            this.phase = 'done'; this.setStep(5);
            this.toast(`${g.short}: <b>${this.vol.toFixed(2)} mL</b> urine in 5 h`, 'success');
            this._chart(); this._infer();
            this._refresh();
        }

        _chart() {
            const ids = this.cfg.treatments.filter(t => this.results[t.id]);
            const pts = ids.map((t, i) => {
                const r = this.results[t.id].map(x => x.vol);
                return [i + 1, M.mean(r), M.sem(r)];
            });
            this.chart.draw({
                xMin: 0.4, xMax: Math.max(3, ids.length) + 0.6, yMin: 0, yMax: 11,
                xTicks: ids.map((_, i) => i + 1), xFmt: v => (ids[v - 1] || {}).short || '',
                yLabel: 'Urine volume (mL / 5 h)',
                series: [{ color: '#0d9488', type: 'bar', points: pts, barWidth: 0.55, labels: true }],
                annotations: this.results.urea ? [{ y: M.mean(this.results.urea.map(x => x.vol)), text: 'urea standard', color: '#0ea5e9' }] : []
            });
        }

        _infer() {
            const mv = id => this.results[id] ? M.mean(this.results[id].map(x => x.vol)) : null;
            const urea = mv('urea');
            let html = this.cfg.treatments.filter(t => this.results[t.id]).map(t => {
                const r = this.results[t.id];
                const v = M.mean(r.map(x => x.vol));
                const lip = urea ? ' · Lipschitz ' + (v / urea).toFixed(2) : '';
                return `<div class="kv"><span>${t.short}</span><span>${v.toFixed(2)} mL${lip}</span></div>`;
            }).join('');
            if (urea && (this.results.furo || this.results.hctz)) html += '<p style="margin-top:8px">Urine output ranks <b>furosemide &gt; hydrochlorothiazide &gt; urea &gt; control</b>, with a high urinary Na⁺ confirming <b>natriuresis</b>. A Lipschitz value &gt; 1 means the test drug is a more effective diuretic than the urea standard. Spironolactone raises Na⁺ while <b>sparing K⁺</b> (low K⁺, high Na⁺/K⁺ ratio).</p>';
            else if (!urea) html += '<p style="margin-top:8px">Run the <b>urea standard</b> to compute Lipschitz values.</p>';
            this.infer(html);
        }

        update(dt) {
            const r = this.rat;
            if (this.where === 'cage') {
                const x0 = CAGE.x + 34, x1 = CAGE.x + CAGE.w - 40;
                if (Math.abs(r.x - this.target) < 5 || Math.random() < dt * 0.1) this.target = M.rand(x0, x1);
                const moving = Math.abs(this.target - r.x) > 5;
                if (moving) { r.facing = Math.sign(this.target - r.x); r.x += r.facing * 22 * dt; }
                r.set({ walk: moving ? 1 : 0, sniff: 1 });
                r.gaitSpeed = moving ? 1.4 : 0;
            } else r.set({ walk: 0 });
            r.update(dt);

            // dripping urine while collecting
            if (this.lapsing && this.where === 'cage' && this.group) {
                const perHour = this.group.vol / 5;
                if (Math.random() < dt * (1.2 + perHour * 2.4)) {
                    this.fx.emit({
                        x: FUNNEL.x + M.rand(-6, 6), y: FUNNEL.y + 50, vy: 60, ay: 420, r: 2.2, life: 0.8,
                        shape: 'drop', color: 'rgba(250,204,21,0.85)',
                        update: q => { if (q.y > this._surface()) { q.age = q.life; this.splash = 1; } }
                    });
                }
            }
            this.splash = Math.max(0, (this.splash || 0) - dt * 2);
            this.flameBoost = Math.max(0, (this.flameBoost || 0) - dt * 0.35);
            this.flame = 0.4 + (this.flameBoost || 0) * 0.6;

            this.hud('r', [
                { k: 'Urine volume', v: this.vol.toFixed(2) + ' mL' },
                { k: 'Collection', v: this.hours.toFixed(1) + ' / 5 h' },
                { k: 'Na⁺ / K⁺', v: this.k ? `${this.na.toFixed(0)} / ${this.k.toFixed(0)}` : '—' }
            ]);
        }

        _surface() { return CYL.bot - 6 - (this.vol / CYL.cap) * (CYL.bot - CYL.top - 10); }

        draw(ctx) {
            this._drawStand(ctx);
            this._drawCage(ctx, false);
            if (this.where !== 'bench') this.rat.draw(ctx);
            this._drawCage(ctx, true);
            this._drawFunnel(ctx);
            this._drawCylinder(ctx);
            this._drawFlamePhotometer(ctx);
            if (this.where === 'bench') this.rat.draw(ctx);
        }

        _drawStand(ctx) {
            G.metal(ctx, CAGE.x - 16, CAGE.y + 20, 10, 414 - CAGE.y, { vertical: true, tone: 'steel' });
            G.metal(ctx, CAGE.x + CAGE.w + 6, CAGE.y + 20, 10, 414 - CAGE.y, { vertical: true, tone: 'steel' });
            G.shadow(ctx, CAGE.x + CAGE.w / 2, 434, 170, 10, 0.4);
        }

        _drawCage(ctx, front) {
            const c = CAGE;
            if (!front) {
                ctx.fillStyle = 'rgba(190,212,228,0.22)'; G.rr(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill();
                ctx.strokeStyle = 'rgba(235,248,255,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
                // drinking bottle
                G.glass(ctx, c.x + c.w - 34, c.y + 10, 22, 56, { r: 6 });
                ctx.fillStyle = 'rgba(125,211,252,0.5)'; ctx.fillRect(c.x + c.w - 31, c.y + 24, 16, 40);
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5;
                ctx.beginPath(); ctx.moveTo(c.x + c.w - 23, c.y + 66); ctx.lineTo(c.x + c.w - 30, c.y + 86); ctx.stroke();
            } else {
                // wire mesh floor
                const fy = c.y + c.h - 8;
                ctx.strokeStyle = 'rgba(148,163,184,0.85)'; ctx.lineWidth = 1.2;
                for (let x = c.x + 4; x < c.x + c.w; x += 11) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x, fy + 8); ctx.stroke(); }
                ctx.beginPath(); ctx.moveTo(c.x + 2, fy + 3); ctx.lineTo(c.x + c.w - 2, fy + 3); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(c.x + 2, fy + 8); ctx.lineTo(c.x + c.w - 2, fy + 8); ctx.stroke();
                G.glass(ctx, c.x, c.y, c.w, c.h, { r: 8, tint: 'rgba(200,225,240,0.05)', edge: 'rgba(240,250,255,0.95)', lw: 2.5 });
                // wire lid
                ctx.strokeStyle = 'rgba(148,163,184,0.9)'; ctx.lineWidth = 1.1;
                for (let x = c.x + 6; x < c.x + c.w; x += 10) { ctx.beginPath(); ctx.moveTo(x, c.y - 7); ctx.lineTo(x, c.y + 2); ctx.stroke(); }
                G.metal(ctx, c.x - 5, c.y - 10, c.w + 10, 5, { r: 2, tone: 'steel' });
                G.text(ctx, 'METABOLIC CAGE', c.x + 12, c.y + 20, { size: 9.5, color: 'rgba(226,232,240,0.8)', weight: 800 });
            }
        }

        _drawFunnel(ctx) {
            const f = FUNNEL;
            ctx.save();
            const g = ctx.createLinearGradient(f.x - f.w / 2, 0, f.x + f.w / 2, 0);
            g.addColorStop(0, 'rgba(226,240,250,0.55)'); g.addColorStop(0.4, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(190,215,235,0.5)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(f.x - f.w / 2, f.y);
            ctx.lineTo(f.x + f.w / 2, f.y);
            ctx.lineTo(f.x + 7, f.y + 44);
            ctx.lineTo(f.x + 7, f.y + 54);
            ctx.lineTo(f.x - 7, f.y + 54);
            ctx.lineTo(f.x - 7, f.y + 44);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(226,245,255,0.8)'; ctx.lineWidth = 1.6; ctx.stroke();
            // faeces separator mesh across the throat
            ctx.strokeStyle = 'rgba(148,163,184,0.8)'; ctx.lineWidth = 1;
            for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(f.x + i * 9, f.y + 4); ctx.lineTo(f.x + i * 3.2, f.y + 30); ctx.stroke(); }
            ctx.beginPath(); ctx.moveTo(f.x - 34, f.y + 16); ctx.lineTo(f.x + 34, f.y + 16); ctx.stroke();
            // film of urine on the cone
            ctx.fillStyle = 'rgba(250,204,21,0.25)';
            ctx.beginPath(); ctx.moveTo(f.x - 18, f.y + 30); ctx.lineTo(f.x + 18, f.y + 30); ctx.lineTo(f.x + 6, f.y + 48); ctx.lineTo(f.x - 6, f.y + 48); ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        _drawCylinder(ctx) {
            const s = this._surface();
            const left = CYL.x - CYL.w / 2;
            // liquid
            const g = ctx.createLinearGradient(left, 0, left + CYL.w, 0);
            g.addColorStop(0, 'rgba(202,138,4,0.85)'); g.addColorStop(0.35, 'rgba(250,204,21,0.8)'); g.addColorStop(1, 'rgba(161,98,7,0.85)');
            ctx.fillStyle = g; ctx.fillRect(left + 4, s, CYL.w - 8, CYL.bot - s - 5);
            ctx.fillStyle = 'rgba(254,240,138,0.95)';
            ctx.beginPath(); ctx.ellipse(CYL.x, s, CYL.w / 2 - 4, 3.5 + (this.splash || 0) * 2, 0, 0, Math.PI * 2); ctx.fill();
            G.glass(ctx, left, CYL.top, CYL.w, CYL.bot - CYL.top, { r: 3 });
            // graduations with numbers
            ctx.strokeStyle = 'rgba(30,41,59,0.55)'; ctx.lineWidth = 1;
            for (let mL = 2; mL <= CYL.cap; mL += 2) {
                const yy = CYL.bot - 6 - (mL / CYL.cap) * (CYL.bot - CYL.top - 10);
                ctx.beginPath(); ctx.moveTo(left + CYL.w - 14, yy); ctx.lineTo(left + CYL.w - 3, yy); ctx.stroke();
                G.text(ctx, String(mL), left + CYL.w - 17, yy + 3, { size: 7, color: 'rgba(30,41,59,0.75)', align: 'right', weight: 700 });
            }
            G.metal(ctx, left - 6, CYL.bot - 5, CYL.w + 12, 9, { r: 3, tone: 'dark' });
        }

        _drawFlamePhotometer(ctx) {
            const { x, y, w, h } = FP;
            G.shadow(ctx, x + w / 2, 434, w * 0.55, 9, 0.45);
            const g = ctx.createLinearGradient(0, y, 0, y + h);
            g.addColorStop(0, '#eef2f6'); g.addColorStop(0.12, '#cdd5dd'); g.addColorStop(1, '#8c97a4');
            ctx.fillStyle = g; G.rr(ctx, x, y, w, h, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.stroke();
            // chimney with flame
            const cx = x + 40;
            G.metal(ctx, cx - 22, y - 86, 44, 88, { r: 5, tone: 'dark' });
            G.metal(ctx, cx - 28, y - 92, 56, 10, { r: 3, tone: 'steel' });
            ctx.fillStyle = '#0b0f14'; G.rr(ctx, cx - 14, y - 78, 28, 62, 3); ctx.fill();
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const fh = 40 + Math.sin(performance.now() / 90) * 4 + this.flame * 18;
            const fg = ctx.createLinearGradient(0, y - 18, 0, y - 20 - fh);
            fg.addColorStop(0, 'rgba(56,189,248,0.95)');
            fg.addColorStop(0.45, this.na > 50 ? 'rgba(253,186,116,0.9)' : 'rgba(147,197,253,0.8)');
            fg.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = fg;
            ctx.beginPath();
            ctx.moveTo(cx - 11, y - 18);
            ctx.quadraticCurveTo(cx - 5, y - 20 - fh * 0.7, cx, y - 20 - fh);
            ctx.quadraticCurveTo(cx + 5, y - 20 - fh * 0.7, cx + 11, y - 18);
            ctx.closePath(); ctx.fill();
            ctx.restore();
            // panel
            G.rr(ctx, x + 76, y + 14, w - 96, h - 34, 7); ctx.fillStyle = '#20262e'; ctx.fill();
            G.lcd(ctx, x + 86, y + 22, 68, 42, this.na.toFixed(0), { label: 'Na⁺ mEq/L', color: '#fdba74', size: 17 });
            G.lcd(ctx, x + 162, y + 22, 68, 42, this.k.toFixed(0), { label: 'K⁺ mEq/L', color: '#a5b4fc', size: 17 });
            G.led(ctx, x + 90, y + 78, 4.5, '#22c55e', true);
            G.led(ctx, x + 108, y + 78, 4.5, '#f59e0b', (this.flameBoost || 0) > 0.1);
            G.knob(ctx, x + 40, y + 94, 13, 0.7);
            G.text(ctx, 'FLAME PHOTOMETER', x + 130, y + 82, { size: 8.5, color: '#cbd5e1', weight: 800 });
            // aspiration capillary dipping toward the cylinder
            ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(cx - 14, y + 4); ctx.quadraticCurveTo(CYL.x + 60, y + 60, CYL.x + 18, this._surface() + 6); ctx.stroke();
        }
    }

    LAB.register(26, Diuretic);
})();
