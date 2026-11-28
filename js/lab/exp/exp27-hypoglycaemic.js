/**
 * EXP 27 — Hypoglycaemic activity in the fasted rat
 *
 * An overnight-fasted rat is given a test drug and blood glucose is followed by
 * tail-prick sampling onto a glucometer strip over four hours.
 *
 * The result that matters is the one that looks like a failure. Insulin and
 * glibenclamide both drive glucose down in a normal animal, but metformin
 * barely moves it — because metformin does not release insulin or act like it.
 * It suppresses hepatic gluconeogenesis and improves peripheral uptake, which
 * lowers glucose only when glucose is already high. It is ANTIHYPERGLYCAEMIC,
 * not hypoglycaemic, and that is precisely why it does not cause hypoglycaemia
 * when used alone in patients.
 */
(function () {
    const { M, G, Rodent } = LAB;

    const BENCH = 430;
    const PLAT = { x: 54, y: 392, w: 244 };
    const METER = { x: 352, y: 300, w: 180, h: 132 };
    const TIMES = [0, 30, 60, 120, 180, 240];        // minutes
    const BASE = 95;                                  // mg/dL, fasted

    const DRUGS = [
        {
            id: 'saline', name: 'Normal saline 10 mL/kg p.o.', short: 'Control', cls: 'Vehicle control',
            color: '#64748b', drop: 0.03, tPeak: 120, width: 90,
            note: 'The vehicle control. Glucose drifts only slightly over four hours of continued fasting.'
        },
        {
            id: 'insulin', name: 'Insulin 2 IU/kg s.c.', short: 'Insulin', cls: 'Hormone — direct',
            color: '#dc2626', drop: 0.58, tPeak: 60, width: 60,
            note: 'Insulin acts directly on its receptor to drive glucose into muscle and fat and to shut down hepatic output. The fall is <b>steep and deep</b>, and in a fasted animal it can reach dangerous levels — which is why insulin causes true hypoglycaemia.'
        },
        {
            id: 'glibenclamide', name: 'Glibenclamide 5 mg/kg p.o.', short: 'Gliben', cls: 'Sulphonylurea — secretagogue',
            color: '#0d9488', drop: 0.34, tPeak: 120, width: 95,
            note: 'A sulphonylurea closes the ATP-sensitive K⁺ channel on the β cell, depolarising it and releasing <b>endogenous insulin</b>. Because the insulin comes from the animal, the fall is slower and shallower than injected insulin — but it is still true hypoglycaemia.'
        },
        {
            id: 'metformin', name: 'Metformin 100 mg/kg p.o.', short: 'Metformin', cls: 'Biguanide — antihyperglycaemic',
            color: '#6366f1', drop: 0.09, tPeak: 150, width: 110,
            note: 'Metformin suppresses hepatic gluconeogenesis and improves peripheral uptake, but releases no insulin. In a <b>normoglycaemic</b> animal there is little to correct, so glucose barely moves — the experimental signature of an antihyperglycaemic rather than a hypoglycaemic drug.'
        }
    ];

    class Hypoglycaemic extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: BENCH, seed: 18 },
                syringe: true,
                tray: { x: 58, y: 516 },
                steps: [
                    'Fast the rat <b>overnight (18 h)</b> with free access to water, and weigh it.',
                    'Take a <b>baseline</b> blood sample from the tail vein and read the glucose on the glucometer.',
                    'Administer the test drug — insulin subcutaneously, the oral agents by gavage.',
                    'Sample again at <b>30, 60, 120, 180 and 240 min</b>, using a fresh strip each time.',
                    'Plot blood glucose against time and calculate the maximum percentage fall from baseline.',
                    'Compare the drugs: note which produce a true fall in a normal animal and which barely move it.'
                ],
                treatmentTitle: 'Treatment groups',
                treatments: DRUGS.map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['t (min)', 'Glucose (mg/dL)', '% of basal', 'Note'],
                tableTitle: 'Blood glucose',
                chart: true,
                chartTitle: 'Blood glucose against time',
                chartEmpty: { xMin: 0, xMax: 240, yMin: 20, yMax: 130, xLabel: 'Time (min)', yLabel: 'Glucose (mg/dL)' },
                viva: [
                    {
                        q: 'Why is the animal fasted overnight before the experiment?',
                        opts: ['To make it docile', 'To remove the variable contribution of absorbed food, giving a stable baseline against which a fall can be measured', 'To empty the bladder', 'To increase drug absorption only'],
                        ans: 1,
                        exp: 'A fed animal’s glucose swings with absorption. Fasting stabilises the baseline so any change can be attributed to the drug, and it also makes the animal more sensitive to hypoglycaemic agents.'
                    },
                    {
                        q: 'Metformin produces little fall in a normal animal because it:',
                        opts: ['Is poorly absorbed', 'Suppresses hepatic glucose output and improves uptake but releases no insulin, so it lowers glucose only when glucose is raised', 'Is destroyed in the stomach', 'Needs a higher dose'],
                        ans: 1,
                        exp: 'This is the defining distinction between antihyperglycaemic and hypoglycaemic drugs, and the clinical reason metformin alone does not cause hypoglycaemia.'
                    },
                    {
                        q: 'Glibenclamide lowers blood glucose by:',
                        opts: ['Acting on the insulin receptor', 'Closing ATP-sensitive K⁺ channels on the β cell, depolarising it and releasing endogenous insulin', 'Inhibiting glucose absorption', 'Inhibiting gluconeogenesis'],
                        ans: 1,
                        exp: 'Sulphonylureas are secretagogues. They therefore require functioning β cells, which is why they work in type 2 but not type 1 diabetes.'
                    },
                    {
                        q: 'Why does injected insulin lower glucose faster than glibenclamide?',
                        opts: ['It is a larger dose', 'It acts directly on the insulin receptor, whereas glibenclamide must first cause the pancreas to secrete insulin', 'It is given orally', 'It blocks glucose absorption'],
                        ans: 1,
                        exp: 'The extra step of endogenous secretion delays and limits the response, so the sulphonylurea curve is both later and shallower.'
                    },
                    {
                        q: 'Blood samples are taken from the tail vein rather than by cardiac puncture because:',
                        opts: ['It is more accurate', 'Repeated small samples can be taken from the same conscious animal with minimal distress', 'The tail has more glucose', 'Cardiac blood clots faster'],
                        ans: 1,
                        exp: 'Serial sampling is essential to a time course, and the tail vein allows it without anaesthesia, which would itself alter glucose handling.'
                    },
                    {
                        q: 'The maximum percentage fall is calculated as:',
                        opts: ['Lowest value − basal', '(basal − lowest) / basal × 100', 'basal / lowest', 'The area under the curve'],
                        ans: 1,
                        exp: 'Expressing the fall as a proportion of each animal’s own baseline removes differences in starting glucose between animals.'
                    }
                ],
                inferenceHint: 'Run a control animal first, then insulin, then the oral agents, and compare the depth and timing of the falls.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.results = {};
            this.rat = new Rodent({ x: PLAT.x + 132, y: PLAT.y, scale: 1.2, kind: 'rat', facing: 1 });
            this.rat.groundY = PLAT.y;
            this.hotspots = [
                { x: PLAT.x, y: PLAT.y - 80, w: PLAT.w, h: 90, label: 'Fasted rat — tail vein sampling' },
                { x: METER.x, y: METER.y, w: METER.w, h: METER.h, label: 'Glucometer and test strips' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.ratNo = (this.ratNo || 0) + 1;
            this.clock = 0;
            this.fasted = false;
            this.dosed = false;
            this.basal = null;
            this.samples = [];
            this.lastRead = null;
            this.setRows([]);
            this.setStep(0);
            this._refresh();
            this.infer(this.cfg.inferenceHint);
        }

        onSelect() { this._refresh(); }

        get drug() { return DRUGS.find(d => d.id === this.tr.id); }
        get nextTime() { return TIMES.find(t => t > 0 && !this.samples.some(s => s.t === t)); }

        /* ---------------- model ---------------- */
        glucose(t) {
            const d = this.drug;
            if (!this.dosed || !d) return BASE + M.randn() * 2.2;
            // a smooth dip centred on tPeak
            const dip = Math.exp(-Math.pow(t - d.tPeak, 2) / (2 * d.width * d.width));
            const g = BASE * (1 - d.drop * dip);
            return Math.max(18, g + M.randn() * 2.6);
        }

        /* ---------------- flow ---------------- */
        _refresh() {
            if (!this.fasted) {
                this.status('Fast the rat overnight before taking the baseline sample.');
                this.actions([{ label: '⏩ Fast 18 h', primary: true, disabled: this.busy, onClick: () => this.fast() }]);
            } else if (this.basal === null) {
                this.status('Take the <b>baseline</b> sample from the tail vein.');
                this.actions([{ label: '🩸 Baseline sample', primary: true, disabled: this.busy, onClick: () => this.sample(0) }]);
            } else if (!this.dosed) {
                this.status(`Baseline <b>${Math.round(this.basal)} mg/dL</b>. Give <b>${this.tr.name}</b>.`);
                this.actions([{ label: '💉 Administer ' + this.tr.short, primary: true, disabled: this.busy, onClick: () => this.autoInject() }]);
            } else {
                const n = this.nextTime;
                const list = [];
                if (n !== undefined) list.push({ label: `🩸 Sample at ${n} min`, primary: true, disabled: this.busy, onClick: () => this.sample(n) });
                list.push({ label: '🐀 Next rat', disabled: this.busy, onClick: () => this.resetAnimal() });
                this.status(n === undefined
                    ? 'Time course complete. Compare the groups on the graph.'
                    : `t = <b>${this.clock} min</b>. Next sample due at <b>${n} min</b>.`);
                this.actions(list);
            }
            this.hud('l', [
                { k: 'Rat', v: '#' + this.ratNo },
                { k: 'Group', v: this.dosed ? this.drug.short : this.tr.short },
                { k: 'Basal', v: this.basal === null ? '—' : Math.round(this.basal) + '' }
            ]);
        }

        fast() {
            const gen = this.gen;
            this.timeLapse(18 * 60, 3, {
                label: 'Overnight fast',
                onDone: () => {
                    if (gen !== this.gen) return;
                    this.fasted = true;
                    this.simMin = 0;
                    this.setStep(1);
                    this.toast('Rat fasted 18 h with free access to water.', 'success');
                    this._refresh();
                }
            });
            this._refresh();
        }

        getInjectZone() {
            if (!this.fasted || this.basal === null || this.dosed) return null;
            const r = this.rat;
            const sc = this.tr.id === 'insulin';
            return {
                x: r.x - (sc ? 10 : -26) * r.facing, y: r.y - (sc ? 44 : 30),
                r: 24, label: sc ? 'Scruff (s.c.)' : 'Oral gavage',
                angle: sc ? Math.PI / 2 - 0.9 : Math.PI * 0.1
            };
        }

        onInjected(tr) {
            this.dosed = true;
            this.floatText(this.rat.x, this.rat.y - 66, `${tr.short} given`, tr.color);
            this.markDone(tr.id);
            this.setStep(2);
            this.toast(`<b>${tr.name}</b> administered. Sample at 30, 60, 120, 180 and 240 min.`, 'info');
            this._refresh();
        }

        sample(t) {
            if (this.busy) return;
            const gen = this.gen;
            const gap = t - this.clock;
            const take = () => {
                if (gen !== this.gen) return;
                this.clock = t;
                const g = this.glucose(t);
                if (t === 0) this.basal = g;
                this.samples.push({ t, g });
                this.lastRead = { t, g };
                const r = this.rat;
                for (let i = 0; i < 6; i++) {
                    this.fx.emit({
                        x: r.x - 62, y: r.y - 10, vx: M.rand(-8, 8), vy: M.rand(10, 40), ay: 220,
                        r: M.rand(1.2, 2.2), life: M.rand(0.3, 0.6), color: 'rgba(190,24,60,0.9)', shape: 'drop'
                    });
                }
                const pct = this.basal ? g / this.basal * 100 : 100;
                this.addRow([
                    String(t),
                    `<b>${Math.round(g)}</b>`,
                    pct.toFixed(0) + '%',
                    t === 0 ? 'baseline' : (pct < 75 ? '<b style="color:#1d4ed8">marked fall</b>' : (pct < 92 ? 'fall' : 'little change'))
                ], pct < 80 ? 'down' : '');
                this.floatText(METER.x + METER.w / 2, METER.y - 14, Math.round(g) + ' mg/dL', g < BASE * 0.8 ? '#93c5fd' : '#5eead4');
                this.setStep(this.nextTime === undefined ? 4 : 3);
                this._chart();
                this._store();
                this._infer();
                this._refresh();
            };
            if (gap > 0) {
                this.timeLapse(gap, M.clamp(gap / 40, 0.8, 2.6), {
                    label: `Waiting to ${t} min`,
                    onTick: (sim, p) => { if (gen === this.gen) this.clockLive = this.clock + gap * p; },
                    onDone: take
                });
                this._refresh();
            } else take();
        }

        _store() {
            if (!this.dosed) return;
            const id = this.drug.id;
            this.results[id] = this.samples.slice();
        }

        /* ---------------- graph & inference ---------------- */
        _chart() {
            const series = [];
            DRUGS.forEach(d => {
                const rows = (this.results[d.id] && this.results[d.id].length) ? this.results[d.id]
                    : (this.dosed && this.drug.id === d.id ? this.samples : null);
                if (!rows || rows.length < 2) return;
                series.push({
                    name: d.short, color: d.color, markers: true, width: 1.8,
                    points: rows.slice().sort((a, b) => a.t - b.t).map(s => [s.t, s.g])
                });
            });
            if (!series.length && this.samples.length) {
                series.push({ name: this.tr.short, color: this.tr.color, markers: true, width: 1.8, points: this.samples.map(s => [s.t, s.g]) });
            }
            if (!series.length) return;
            let lo = BASE;
            series.forEach(s => s.points.forEach(p => { lo = Math.min(lo, p[1]); }));
            this.chart.draw({
                xMin: 0, xMax: 250, yMin: Math.max(10, lo - 18), yMax: 125,
                xLabel: 'Time after dosing (min)', yLabel: 'Blood glucose (mg/dL)',
                annotations: [{ y: BASE, color: '#cbd5e1', text: 'basal' }],
                series
            });
        }

        _infer() {
            const done = DRUGS.filter(d => this.results[d.id] && this.results[d.id].length >= 3);
            if (!done.length) {
                this.infer('<p>Complete a time course to see the fall in glucose.</p>');
                return;
            }
            let html = '<table style="width:100%;font-size:11.5px;border-collapse:collapse">';
            html += '<tr style="color:#64748b"><th style="text-align:left">Group</th><th>Nadir</th><th>at</th><th>Max fall</th></tr>';
            const falls = {};
            done.forEach(d => {
                const rows = this.results[d.id];
                const base = (rows.find(r => r.t === 0) || rows[0]).g;
                let nadir = rows[0];
                rows.forEach(r => { if (r.g < nadir.g) nadir = r; });
                const fall = (base - nadir.g) / base * 100;
                falls[d.id] = fall;
                html += `<tr><td><b>${d.short}</b></td><td style="text-align:center">${Math.round(nadir.g)}</td><td style="text-align:center">${nadir.t} min</td><td style="text-align:center"><b>${fall.toFixed(0)}%</b></td></tr>`;
            });
            html += '</table>';

            const n = [];
            if (falls.insulin && falls.glibenclamide) {
                n.push('Insulin falls further and sooner than glibenclamide, because it acts on the receptor directly while the sulphonylurea must first make the pancreas secrete.');
            }
            if (falls.metformin !== undefined) {
                n.push(`<b>Metformin produced only a ${falls.metformin.toFixed(0)}% fall</b> — in a normoglycaemic animal there is little excess glucose for it to suppress. It is <b>antihyperglycaemic, not hypoglycaemic</b>, and this is exactly why it does not cause hypoglycaemia when used alone clinically.`);
            }
            const last = this.dosed ? this.drug : null;
            if (last) n.push(last.note);
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            const r = this.rat;
            const hypo = this.lastRead && this.lastRead.g < BASE * 0.7;
            r.set({ walk: 0, sniff: hypo ? 0.3 : 1, crouch: hypo ? 0.55 : 0.2, sedation: hypo ? 0.4 : 0, ataxia: hypo ? 0.35 : 0 });
            r.gaitSpeed = 0;
            r.update(dt);
            const shown = this.clockLive !== undefined ? this.clockLive : this.clock;
            this.hud('r', [
                { k: 'Clock', v: Math.round(shown) + ' min' },
                { k: 'Glucose', v: this.lastRead ? Math.round(this.lastRead.g) + '' : '—', tone: hypo ? 'bad' : '' },
                { k: 'Samples', v: this.samples.length + '/' + TIMES.length }
            ]);
        }

        /* ---------------- drawing ---------------- */
        draw(ctx) {
            this._platform(ctx);
            this.rat.draw(ctx);
            this._meter(ctx);
        }

        _platform(ctx) {
            const p = PLAT;
            G.shadow(ctx, p.x + p.w / 2, p.y + 14, p.w * 0.46, 9, 0.4);
            const g = ctx.createLinearGradient(0, p.y - 10, 0, p.y + 8);
            g.addColorStop(0, '#2f4858'); g.addColorStop(1, '#16242f');
            ctx.fillStyle = g; G.rr(ctx, p.x, p.y - 10, p.w, 18, 4); ctx.fill();
            ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#64748b';
            [p.x + 24, p.x + p.w - 32].forEach(x => ctx.fillRect(x, p.y + 6, 8, BENCH - p.y - 6));
            G.text(ctx, 'FASTED RAT · TAIL VEIN', p.x + 6, p.y - 16,
                { size: 9, color: 'rgba(226,232,240,0.6)', weight: 800 });
        }

        _meter(ctx) {
            const m = METER, lr = this.lastRead;
            ctx.save();
            G.shadow(ctx, m.x + m.w / 2, m.y + m.h + 4, m.w * 0.46, 9, 0.44);
            const g = ctx.createLinearGradient(0, m.y, 0, m.y + m.h);
            g.addColorStop(0, '#f1f5f9'); g.addColorStop(0.12, '#cbd5e1'); g.addColorStop(1, '#7d8794');
            ctx.fillStyle = g; G.rr(ctx, m.x, m.y, m.w, m.h, 14); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            G.text(ctx, 'GLUCOMETER', m.x + 14, m.y + 20, { size: 9.5, weight: 800, color: '#1e293b' });

            G.lcd(ctx, m.x + 14, m.y + 28, m.w - 28, 48,
                lr ? Math.round(lr.g) + '' : '---',
                { label: 'mg/dL', color: lr && lr.g < BASE * 0.7 ? '#fb7185' : '#34f5c5' });

            // test strip in the port
            G.metal(ctx, m.x + m.w / 2 - 12, m.y + m.h - 16, 24, 20, { tone: 'dark', r: 2 });
            ctx.fillStyle = lr ? '#be123c' : '#e2e8f0';
            G.rr(ctx, m.x + m.w / 2 - 6, m.y + m.h - 8, 12, 9, 2); ctx.fill();

            G.led(ctx, m.x + 24, m.y + m.h - 24, 4, '#22c55e', true);
            G.text(ctx, lr ? 't = ' + lr.t + ' min' : 'insert strip', m.x + m.w - 16, m.y + m.h - 20,
                { size: 8.5, align: 'right', weight: 700, color: '#475569' });

            // strip pot beside the meter
            G.glass(ctx, m.x + m.w + 14, m.y + 52, 30, 56, { r: 4 });
            ctx.fillStyle = 'rgba(226,232,240,0.7)';
            for (let i = 0; i < 4; i++) G.rr(ctx, m.x + m.w + 18 + i * 5, m.y + 62, 3, 40, 1), ctx.fill();
            G.text(ctx, 'STRIPS', m.x + m.w + 29, m.y + 120, { size: 7.5, align: 'center', weight: 800, color: '#cbd5e1' });
            ctx.restore();
        }
    }

    LAB.register(27, Hypoglycaemic);
})();
