/**
 * EXP 28 — Effect of drugs on gastrointestinal motility (charcoal meal)
 *
 * A fasted mouse is dosed, then given a charcoal meal by gavage. Thirty minutes
 * later the small intestine is removed from pylorus to caecum and laid out, and
 * the distance the black charcoal front has travelled is expressed as a
 * percentage of the total length:
 *
 *   % intestinal transit = (distance travelled by charcoal / total length) × 100
 *
 * The panel separates drugs that slow the gut from drugs that hurry it, and by
 * three different mechanisms: antimuscarinic (atropine), opioid on the myenteric
 * plexus (loperamide), anticholinesterase (neostigmine) and direct mucosal
 * irritation (castor oil).
 */
(function () {
    const { M, G, Rodent } = LAB;

    const BENCH = 430;
    const CAGE = { x: 26, y: 262, w: 182, h: 144, floor: 396 };
    const BOARD = { x: 244, y: 196, w: 672, h: 210 };
    const GUT_LEN = 580;        // mm of intestine, in the model

    const DRUGS = [
        {
            id: 'saline', name: 'Normal saline 10 mL/kg p.o.', short: 'Control', cls: 'Vehicle control',
            color: '#64748b', transit: 62,
            note: 'The untreated transit, against which everything else is compared. Normal mouse transit in 30 min is roughly 60% of the small intestine.'
        },
        {
            id: 'atropine', name: 'Atropine 1 mg/kg i.p.', short: 'Atropine', cls: 'Antimuscarinic',
            color: '#dc2626', transit: 30,
            note: 'Atropine blocks the <b>M₃</b> receptors through which the myenteric plexus drives peristalsis, so propulsion slows markedly. The same action underlies its use as an antispasmodic.'
        },
        {
            id: 'loperamide', name: 'Loperamide 1 mg/kg p.o.', short: 'Loperamide', cls: 'μ-opioid agonist (peripheral)',
            color: '#7c3aed', transit: 20,
            note: 'Loperamide is a μ-opioid agonist acting on the myenteric plexus, reducing propulsive contractions and prolonging transit. It is a P-glycoprotein substrate and <b>does not enter the CNS</b>, which is why it is an antidiarrhoeal and not an analgesic.'
        },
        {
            id: 'neostigmine', name: 'Neostigmine 0.1 mg/kg i.p.', short: 'Neostig', cls: 'Anticholinesterase',
            color: '#0d9488', transit: 86,
            note: 'Inhibiting cholinesterase lets acetylcholine accumulate at the myenteric plexus, so peristalsis is <b>enhanced</b> and the charcoal travels further — the exact opposite of atropine, and through the same receptor.'
        },
        {
            id: 'castoroil', name: 'Castor oil 0.5 mL p.o.', short: 'Castor oil', cls: 'Irritant/secretory purgative',
            color: '#d97706', transit: 90,
            note: 'Castor oil is hydrolysed to <b>ricinoleic acid</b>, which irritates the mucosa and promotes secretion. Transit accelerates without any action on cholinergic receptors — so atropine does not prevent it.'
        }
    ];

    class CharcoalMeal extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: BENCH, seed: 20 },
                syringe: true,
                tray: { x: 50, y: 518 },
                steps: [
                    'Fast the mice for <b>18 h</b> with free access to water.',
                    'Give the test drug, and allow <b>30 min</b> for it to act.',
                    'Administer the <b>charcoal meal</b> — 0.2 mL of 10% charcoal in 5% gum acacia, by oral gavage.',
                    'Wait a further <b>30 min</b> for the meal to be propelled along the gut.',
                    'Sacrifice humanely, remove the small intestine from <b>pylorus to caecum</b> and lay it out without stretching.',
                    'Measure the distance travelled by the charcoal front and express it as a percentage of total length.'
                ],
                treatmentTitle: 'Treatment groups',
                treatments: DRUGS.map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Group', 'Charcoal (mm)', 'Total (mm)', '% transit'],
                tableTitle: 'Transit measurements',
                chart: true, chartTitle: 'Mean intestinal transit',
                chartEmpty: { xMin: 0.4, xMax: 5.6, yMin: 0, yMax: 100, xTicks: [1, 2, 3, 4, 5], xLabel: 'Group', yLabel: '% transit', series: [] },
                viva: [
                    {
                        q: 'Why is the result expressed as a percentage of total intestinal length?',
                        opts: ['It looks neater', 'Intestinal length varies between animals, so a percentage makes the measurements comparable', 'Charcoal is expensive', 'To avoid using a ruler'],
                        ans: 1,
                        exp: 'Absolute distance depends on how big the animal is. Normalising to each animal’s own gut length removes that variation, which is the same logic as normalising responses in a bioassay.'
                    },
                    {
                        q: 'Atropine reduces transit because it:',
                        opts: ['Kills the gut flora', 'Blocks muscarinic receptors through which the myenteric plexus drives peristalsis', 'Absorbs the charcoal', 'Causes vomiting'],
                        ans: 1,
                        exp: 'Propulsion depends on acetylcholine released onto M₃ receptors of the circular muscle. Blocking them removes the drive, which is why antimuscarinics are antispasmodic and constipating.'
                    },
                    {
                        q: 'Loperamide is an opioid, yet it is not analgesic. Why?',
                        opts: ['It is a weak agonist', 'It is a P-glycoprotein substrate and does not cross the blood–brain barrier, so its μ-agonism is confined to the gut', 'It is destroyed in the liver', 'It acts on κ receptors only'],
                        ans: 1,
                        exp: 'Confining a drug to one compartment separates a wanted effect from an unwanted one. Loperamide gets full μ-agonist action on the myenteric plexus with essentially no central effect.'
                    },
                    {
                        q: 'Neostigmine increases transit because it:',
                        opts: ['Blocks muscarinic receptors', 'Inhibits cholinesterase, so acetylcholine accumulates and peristalsis is enhanced', 'Irritates the mucosa', 'Increases secretion'],
                        ans: 1,
                        exp: 'Neostigmine and atropine act on opposite sides of the same synapse, which is why they move transit in opposite directions — and why neostigmine is used for postoperative ileus.'
                    },
                    {
                        q: 'Castor oil accelerates transit through:',
                        opts: ['Muscarinic stimulation', 'Hydrolysis to ricinoleic acid, which irritates the mucosa and promotes secretion', 'Blocking opioid receptors', 'Osmotic retention of water only'],
                        ans: 1,
                        exp: 'Because its action is not receptor-mediated at the cholinergic synapse, atropine does not block it — the same distinction as direct spasmogens in the smooth-muscle experiments.'
                    },
                    {
                        q: 'Why must the intestine be laid out without stretching?',
                        opts: ['To avoid tearing it', 'Stretching alters the measured total length and so falsifies the percentage', 'To keep the charcoal in place', 'It does not matter'],
                        ans: 1,
                        exp: 'Both the numerator and denominator are lengths. Stretching the gut inflates the total more than the charcoal segment and makes transit look falsely low.'
                    }
                ],
                inferenceHint: 'Run a control animal first, then compare drugs that slow the gut with those that hurry it.'
            };
        }

        setup() {
            this.results = {};
            this.mouseNo = 0;
            this.hotspots = [
                { x: CAGE.x, y: CAGE.y, w: CAGE.w, h: CAGE.h, label: 'Holding cage' },
                { x: BOARD.x, y: BOARD.y, w: BOARD.w, h: BOARD.h, label: 'Dissection board — intestine laid out with a scale' }
            ];
            this.resetAnimal();
        }

        resetAnimal() {
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.mouseNo++;
            this.mouse = new Rodent({ x: CAGE.x + 90, y: CAGE.floor, scale: 1.15, facing: 1 });
            this.mouse.groundY = CAGE.floor;
            this.walkTo = CAGE.x + 90;
            this.phase = 'fast';
            this.injected = null;
            this.charcoal = null;
            this.gut = null;
            this.reveal = 0;
            this.setStep(0);
            this._refresh();
        }

        onSelect() { if (this.phase === 'treat') this._refresh(); }

        _refresh() {
            const b = this.busy, ph = this.phase;
            if (ph === 'fast') {
                this.status('Fast the mouse for 18 h before dosing.');
                this.actions([{ label: '⏩ Fast 18 h', primary: true, disabled: b, onClick: () => this.fast() }]);
            } else if (ph === 'treat') {
                this.status(`Select a group and give <b>${this.tr.name}</b>.`);
                this.actions([{ label: '💉 Administer ' + this.tr.short, primary: true, disabled: b, onClick: () => this.autoInject() }]);
            } else if (ph === 'wait1') {
                this.status(`<b>${this.injected.name}</b> given. Allow 30 min for it to act.`);
                this.actions([{ label: '⏩ Wait 30 min', primary: true, disabled: b, onClick: () => this.wait1() }]);
            } else if (ph === 'charcoal') {
                this.status('Give the <b>charcoal meal</b> — 0.2 mL of 10% charcoal in gum acacia, by gavage.');
                this.actions([{ label: '⬤ Give charcoal meal', primary: true, disabled: b, onClick: () => this.giveCharcoal() }]);
            } else if (ph === 'wait2') {
                this.status('Charcoal given. Allow <b>30 min</b> for it to be propelled along the gut.');
                this.actions([{ label: '⏩ Wait 30 min', primary: true, disabled: b, onClick: () => this.wait2() }]);
            } else if (ph === 'dissect') {
                this.status('Remove the small intestine from <b>pylorus to caecum</b> and lay it on the board.');
                this.actions([{ label: '✂️ Dissect and lay out', primary: true, disabled: b, onClick: () => this.dissect() }]);
            } else if (ph === 'measure') {
                this.status('Measure the distance travelled by the charcoal front against the scale.');
                this.actions([{ label: '📏 Measure transit', primary: true, disabled: b, onClick: () => this.measure() }]);
            } else {
                this.status('Measurement recorded. Use a <b>fresh mouse</b> for the next group.');
                this.actions([{ label: '↺ Next mouse', primary: true, disabled: b, onClick: () => this.resetAnimal() }]);
            }
            this.hud('l', [
                { k: 'Mouse', v: '#' + this.mouseNo },
                { k: 'Group', v: this.injected ? this.injected.short : 'untreated' }
            ]);
        }

        fast() {
            const gen = this.gen;
            this.timeLapse(18 * 60, 2.6, {
                label: 'Overnight fast',
                onDone: () => { if (gen !== this.gen) return; this.phase = 'treat'; this.simMin = 0; this.setStep(1); this._refresh(); }
            });
            this._refresh();
        }

        getInjectZone() {
            if (this.phase !== 'treat') return null;
            const m = this.mouse;
            const oral = this.tr.id === 'loperamide' || this.tr.id === 'castoroil' || this.tr.id === 'saline';
            return {
                x: m.x + (oral ? 30 : -4) * m.facing, y: m.y - (oral ? 36 : 18),
                r: 25, label: oral ? 'Oral gavage' : 'Abdomen (i.p.)',
                angle: oral ? Math.PI * 0.1 : Math.PI / 2 - 0.35
            };
        }

        onInjected(tr) {
            this.injected = tr;
            this.floatText(this.mouse.x, this.mouse.y - 56, `${tr.short}`, tr.color);
            this.phase = 'wait1';
            this.setStep(2);
            setTimeout(() => this._refresh(), 800);
        }

        wait1() {
            const gen = this.gen;
            this.timeLapse(30, 2.6, {
                label: 'Drug acting',
                onDone: () => { if (gen !== this.gen) return; this.phase = 'charcoal'; this.setStep(2); this._refresh(); }
            });
            this._refresh();
        }

        giveCharcoal() {
            if (this.busy) return;
            this.busy = true;
            const gen = this.gen, m = this.mouse;
            for (let i = 0; i < 14; i++) {
                this.fx.emit({
                    x: m.x + 30, y: m.y - 38, vx: M.rand(-10, 10), vy: M.rand(-16, 6), ay: 180,
                    r: M.rand(1.6, 3), life: M.rand(0.4, 0.8), color: 'rgba(24,24,27,0.9)'
                });
            }
            this.floatText(m.x, m.y - 62, 'charcoal meal p.o.', '#e2e8f0');
            this.tw.wait(0.9, () => {
                if (gen !== this.gen) return;
                this.charcoal = true;
                this.busy = false;
                this.phase = 'wait2';
                this.setStep(3);
                this._refresh();
            });
            this._refresh();
        }

        wait2() {
            const gen = this.gen;
            this.timeLapse(30, 2.8, {
                label: 'Transit',
                onDone: () => { if (gen !== this.gen) return; this.phase = 'dissect'; this.setStep(4); this._refresh(); }
            });
            this._refresh();
        }

        dissect() {
            if (this.busy) return;
            const d = this.injected;
            const sc = M.clamp(M.gauss(1, 0.11), 0.7, 1.35);
            const pct = M.clamp(d.transit * sc, 6, 98);
            const total = Math.round(GUT_LEN * M.clamp(M.gauss(1, 0.06), 0.85, 1.15));
            this.gut = { pct, total, dist: Math.round(total * pct / 100) };
            this.busy = true;
            const gen = this.gen;
            this.tw.add(1.1, e => { this.reveal = e; }, {
                onDone: () => {
                    if (gen !== this.gen) return;
                    this.busy = false;
                    this.phase = 'measure';
                    this.setStep(5);
                    this.toast('Intestine laid out from pylorus to caecum without stretching.', 'info');
                    this._refresh();
                }
            });
            this._refresh();
        }

        measure() {
            if (this.busy || !this.gut) return;
            const d = this.injected, g = this.gut;
            const r = (this.results[d.id] = this.results[d.id] || []);
            r.push({ pct: g.pct, dist: g.dist, total: g.total });
            this.addRow([
                `<b>${d.short}</b> · M${this.mouseNo}`,
                String(g.dist),
                String(g.total),
                `<b>${g.pct.toFixed(1)}%</b>`
            ], g.pct > 75 ? 'up' : (g.pct < 40 ? 'down' : ''));
            this.markDone(d.id);
            this.phase = 'done';
            this.toast(`Charcoal travelled <b>${g.dist} mm</b> of <b>${g.total} mm</b> — ${g.pct.toFixed(1)}% transit.`, 'success', 3400);
            this._chart();
            this._infer();
            this._refresh();
        }

        _chart() {
            const pts = [];
            DRUGS.forEach((d, i) => {
                const r = this.results[d.id];
                if (!r) return;
                pts.push([i + 1, M.mean(r.map(x => x.pct)), r.length > 1 ? M.sem(r.map(x => x.pct)) : 0]);
            });
            this.chart.draw(Object.assign({}, this.cfg.chartEmpty, {
                xFmt: v => (DRUGS[v - 1] ? DRUGS[v - 1].short : ''),
                series: [{ name: 'Mean % transit', color: '#0d9488', type: 'bar', points: pts, barWidth: 0.5, labels: true }],
                annotations: this.results.saline
                    ? [{ y: M.mean(this.results.saline.map(x => x.pct)), color: '#94a3b8', text: 'control' }] : []
            }));
        }

        _infer() {
            const R = this.results;
            const ctrl = R.saline ? M.mean(R.saline.map(x => x.pct)) : null;
            let html = DRUGS.filter(d => R[d.id]).map(d => {
                const r = R[d.id];
                const m = M.mean(r.map(x => x.pct));
                const rel = ctrl ? ((m - ctrl) / ctrl * 100) : null;
                return `<div class="kv"><span>${d.short} (n=${r.length}) transit</span><span>${m.toFixed(1)}%${rel === null ? '' : ` (${rel > 0 ? '+' : ''}${rel.toFixed(0)}% vs control)`}</span></div>`;
            }).join('');
            const n = [];
            if (!ctrl) n.push('Run a <b>control</b> animal to establish normal transit.');
            else {
                const slow = ['atropine', 'loperamide'].filter(id => R[id]);
                const fast = ['neostigmine', 'castoroil'].filter(id => R[id]);
                if (slow.length) n.push('Atropine and loperamide both <b>reduce</b> transit, but by different routes — one blocks the muscarinic receptor, the other acts on μ-opioid receptors of the myenteric plexus.');
                if (R.atropine && R.neostigmine) n.push('Atropine and neostigmine move transit in <b>opposite directions</b> through the same cholinergic synapse, one blocking the receptor and the other sparing the transmitter.');
                if (R.castoroil) n.push('Castor oil accelerates transit by mucosal irritation rather than through any cholinergic receptor, which is why an antimuscarinic would not prevent it.');
                if (fast.length && slow.length) n.push('The two directions together show the assay can detect both <b>prokinetic</b> and <b>antimotility</b> activity.');
            }
            const last = this.injected;
            if (last) n.push(DRUGS.find(d => d.id === last.id).note);
            this.infer(html + (n.length ? `<p style="margin-top:8px">${n.join(' ')}</p>` : ''));
        }

        /* ---------- simulation ---------- */
        update(dt) {
            const m = this.mouse;
            if (this.phase !== 'dissect' && this.phase !== 'measure' && this.phase !== 'done') {
                const held = this.inject || this.syringeFill > 0 || this.busy || this.drag;
                const spd = 24;
                const moving = !held && Math.abs(this.walkTo - m.x) > 5;
                if (!held && (Math.abs(m.x - this.walkTo) < 5 || Math.random() < dt * 0.05)) {
                    this.walkTo = M.rand(CAGE.x + 28, CAGE.x + CAGE.w - 28);
                }
                if (moving) { m.facing = Math.sign(this.walkTo - m.x); m.x += m.facing * spd * dt; }
                m.set({ walk: moving ? 1 : 0, sniff: 1, crouch: 0 });
                m.gaitSpeed = moving ? spd / 15 : 0;
                m.x = M.clamp(m.x, CAGE.x + 20, CAGE.x + CAGE.w - 20);
            }
            m.update(dt);
            const g = this.gut;
            this.hud('r', [
                { k: 'Stage', v: { fast: 'fasting', treat: 'dosing', wait1: 'drug acting', charcoal: 'charcoal', wait2: 'transit', dissect: 'dissection', measure: 'measuring', done: 'recorded' }[this.phase] || '—' },
                { k: 'Transit', v: g && this.phase !== 'dissect' ? g.pct.toFixed(1) + '%' : '—', tone: g && g.pct > 75 ? 'good' : (g && g.pct < 40 ? 'warn' : '') }
            ]);
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._board(ctx);
            this._cage(ctx, false);
            if (this.phase !== 'dissect' && this.phase !== 'measure' && this.phase !== 'done') this.mouse.draw(ctx);
            this._cage(ctx, true);
        }

        _cage(ctx, front) {
            const c = CAGE;
            if (!front) {
                G.shadow(ctx, c.x + c.w / 2, c.y + c.h + 2, c.w * 0.6, 9, 0.4);
                ctx.fillStyle = 'rgba(210,225,235,0.16)'; G.rr(ctx, c.x, c.y, c.w, c.h, 7); ctx.fill();
                const bg = ctx.createLinearGradient(0, c.floor - 8, 0, c.y + c.h);
                bg.addColorStop(0, '#dcbc8d'); bg.addColorStop(1, '#a98455');
                ctx.fillStyle = bg; ctx.fillRect(c.x + 3, c.floor - 6, c.w - 6, c.y + c.h - c.floor + 3);
            } else {
                G.glass(ctx, c.x, c.y, c.w, c.h, { r: 7, tint: 'rgba(200,225,240,0.07)' });
                G.text(ctx, 'HOLDING CAGE', c.x + 8, c.y - 8, { size: 9, color: 'rgba(226,232,240,0.7)', weight: 800 });
            }
        }

        /** dissection board with the intestine laid out in a serpentine and a scale */
        _board(ctx) {
            const b = BOARD;
            ctx.save();
            G.shadow(ctx, b.x + b.w / 2, b.y + b.h + 6, b.w * 0.45, 10, 0.42);
            const wg = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
            wg.addColorStop(0, '#d8c39c'); wg.addColorStop(1, '#b49a6e');
            ctx.fillStyle = wg; G.rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
            ctx.strokeStyle = 'rgba(90,70,40,0.5)'; ctx.lineWidth = 1; ctx.stroke();
            G.text(ctx, 'DISSECTION BOARD', b.x + 10, b.y + 16, { size: 9, weight: 800, color: 'rgba(70,52,28,0.75)' });

            if (!this.gut || this.reveal <= 0.01) {
                G.text(ctx, 'intestine not yet laid out', b.x + b.w / 2, b.y + b.h / 2,
                    { size: 11, align: 'center', weight: 700, color: 'rgba(90,70,40,0.5)' });
                ctx.restore();
                return;
            }

            // three serpentine rows representing the gut from pylorus to caecum
            const rows = 3, pad = 44;
            const rowW = b.w - pad * 2, rowY = i => b.y + 56 + i * 48;
            const total = rows * rowW;
            const shown = total * this.reveal;
            const charcoalLen = total * (this.gut.pct / 100);

            const segAt = L => {
                const i = Math.min(rows - 1, Math.floor(L / rowW));
                const within = L - i * rowW;
                const ltr = i % 2 === 0;
                return { i, x: b.x + pad + (ltr ? within : rowW - within), y: rowY(i), ltr };
            };

            // the gut wall
            for (let i = 0; i < rows; i++) {
                const start = i * rowW;
                if (start > shown) break;
                const end = Math.min(rowW, shown - start);
                const ltr = i % 2 === 0;
                const x0 = b.x + pad + (ltr ? 0 : rowW - end);
                ctx.strokeStyle = '#d9b3a8'; ctx.lineWidth = 13; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(ltr ? x0 : x0 + end, rowY(i)); ctx.lineTo(ltr ? x0 + end : x0, rowY(i)); ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.moveTo(ltr ? x0 : x0 + end, rowY(i) - 3); ctx.lineTo(ltr ? x0 + end : x0, rowY(i) - 3); ctx.stroke();
                // bends joining the rows
                if (i < rows - 1 && shown > (i + 1) * rowW) {
                    const bx = ltr ? b.x + pad + rowW : b.x + pad;
                    ctx.strokeStyle = '#d9b3a8'; ctx.lineWidth = 13;
                    ctx.beginPath(); ctx.arc(bx, rowY(i) + 24, 24, -Math.PI / 2, Math.PI / 2, !ltr); ctx.stroke();
                }
            }

            // the charcoal column, filling from the pyloric end
            const cShown = Math.min(charcoalLen, shown);
            for (let i = 0; i < rows; i++) {
                const start = i * rowW;
                if (start > cShown) break;
                const end = Math.min(rowW, cShown - start);
                const ltr = i % 2 === 0;
                const x0 = b.x + pad + (ltr ? 0 : rowW - end);
                ctx.strokeStyle = '#1c1c1f'; ctx.lineWidth = 9; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(ltr ? x0 : x0 + end, rowY(i)); ctx.lineTo(ltr ? x0 + end : x0, rowY(i)); ctx.stroke();
                if (i < rows - 1 && cShown > (i + 1) * rowW) {
                    const bx = ltr ? b.x + pad + rowW : b.x + pad;
                    ctx.beginPath(); ctx.arc(bx, rowY(i) + 24, 24, -Math.PI / 2, Math.PI / 2, !ltr); ctx.stroke();
                }
            }

            // front marker
            if (cShown > 4 && cShown < shown - 2) {
                const f = segAt(cShown);
                ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(f.x, f.y - 14); ctx.lineTo(f.x, f.y + 14); ctx.stroke();
                G.text(ctx, 'charcoal front', f.x, f.y - 19,
                    { size: 8.5, align: 'center', weight: 800, color: '#b45309' });
            }

            // ends
            const p0 = segAt(1), pEnd = segAt(Math.max(2, shown - 1));
            G.text(ctx, 'pylorus', p0.x - 4, p0.y + 26, { size: 8.5, weight: 800, color: 'rgba(70,52,28,0.8)' });
            if (this.reveal > 0.96) G.text(ctx, 'caecum', pEnd.x - 16, pEnd.y + 26, { size: 8.5, weight: 800, color: 'rgba(70,52,28,0.8)' });

            // scale along the foot of the board
            const sy = b.y + b.h - 22;
            ctx.strokeStyle = 'rgba(60,45,22,0.8)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(b.x + pad, sy); ctx.lineTo(b.x + pad + rowW, sy); ctx.stroke();
            for (let mm = 0; mm <= 200; mm += 10) {
                const x = b.x + pad + rowW * (mm / 200);
                ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x, sy + (mm % 50 ? 4 : 8)); ctx.stroke();
                if (mm % 50 === 0) G.text(ctx, String(mm), x, sy + 18, { size: 8, align: 'center', weight: 700, color: 'rgba(60,45,22,0.8)' });
            }
            G.text(ctx, 'mm', b.x + pad + rowW + 14, sy + 18, { size: 8, weight: 700, color: 'rgba(60,45,22,0.8)' });

            if (this.phase === 'done' || this.phase === 'measure') {
                const g = this.gut;
                ctx.fillStyle = 'rgba(8,15,26,0.78)';
                G.rr(ctx, b.x + b.w - 186, b.y + 10, 176, 46, 7); ctx.fill();
                G.text(ctx, `${g.dist} / ${g.total} mm`, b.x + b.w - 98, b.y + 28,
                    { size: 11, align: 'center', weight: 800, color: '#e2e8f0' });
                G.text(ctx, `${g.pct.toFixed(1)}% transit`, b.x + b.w - 98, b.y + 46,
                    { size: 13, align: 'center', weight: 800, color: g.pct > 75 ? '#86efac' : (g.pct < 40 ? '#fca5a5' : '#5eead4') });
            }
            ctx.restore();
        }
    }

    LAB.register(28, CharcoalMeal);
})();
