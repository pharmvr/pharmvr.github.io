/**
 * EXP 8 — Effect of drugs on the rabbit eye
 * Albino rabbit in a restrainer (side view) + live magnified eye scope.
 * Tools (drag onto the eye or use the action bar): dropper, pen-torch, cotton wisp, mm ruler.
 * Flow: baseline (pupil, light reflex, corneal reflex) → instil 2 drops into the TEST eye
 *       (control eye gets saline) → 15 min → re-test both eyes → compare → identify unknowns.
 */
(function () {
    const { M, G } = LAB;
    const EYE = { x: 455, y: 226 };            // eye on the rabbit (right side)
    const SCOPE = { x: 778, y: 236, r: 150 };  // magnified view
    const PX_MM = 9.6;                          // scope scale: pixels per mm

    const DRUGS = {
        saline: { id: 'saline', name: 'Normal saline 0.9%', short: 'Saline', cls: 'Vehicle control', color: '#94a3b8', pupil: 0, light: true, corneal: true, note: 'No change.' },
        atropine: { id: 'atropine', name: 'Atropine sulphate 1%', short: 'Atropine', cls: 'Antimuscarinic (M₃ block)', color: '#dc2626', pupil: +3.6, light: false, corneal: true, note: 'Mydriasis with loss of light reflex (sphincter paralysed) — cycloplegia.' },
        physo: { id: 'physo', name: 'Physostigmine 0.5%', short: 'Physostig.', cls: 'Anticholinesterase', color: '#16a34a', pupil: -3.0, light: true, corneal: true, note: 'Miosis — ACh accumulates at sphincter pupillae M₃ receptors.' },
        ephedrine: { id: 'ephedrine', name: 'Ephedrine 2%', short: 'Ephedrine', cls: 'Indirect sympathomimetic', color: '#f59e0b', pupil: +2.6, light: true, corneal: true, note: 'Mydriasis via dilator pupillae (α₁) — light reflex retained (sphincter intact).' },
        lignocaine: { id: 'lignocaine', name: 'Lignocaine 4%', short: 'Lignocaine', cls: 'Local anaesthetic (Na⁺ channel)', color: '#7c3aed', pupil: 0.2, light: true, corneal: false, note: 'Corneal reflex abolished (sensory block); pupil essentially unchanged.' }
    };

    class RabbitEye extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 420, seed: 3 },
                syringe: false,
                steps: [
                    'Examine the <b>test (right) eye</b> before any drug: measure the pupil (ruler), test the <b>light reflex</b> (pen-torch) and the <b>corneal reflex</b> (cotton wisp).',
                    'Choose a drug and <b>instil 2 drops</b> into the test eye with the dropper (the left eye receives saline as control). Hold the lower lid for 1 min.',
                    'Wait <b>15 min</b> for corneal absorption.',
                    'Re-test pupil size, light reflex and corneal reflex in the test eye; compare with the control eye.',
                    'Use a fresh rabbit for each drug. Try the <b>Unknown X</b> and identify it.'
                ],
                treatmentTitle: 'Eye drops',
                treatments: [...Object.values(DRUGS).filter(d => d.id !== 'saline'), { id: 'unknown', name: 'Unknown drug X', short: 'Unknown X', cls: 'Identify from the eye signs', color: '#334155' }],
                table: ['Drug', 'Pupil (mm) before → after', 'Light reflex', 'Corneal reflex'],
                chart: true, chartTitle: 'Pupil diameter (mm)',
                chartEmpty: { xMin: 0, xMax: 5, yMin: 0, yMax: 12, yLabel: 'Pupil (mm)', xTicks: [] },
                viva: [
                    { q: 'Atropine instilled into the eye produces:', opts: ['Miosis with intact light reflex', 'Mydriasis with loss of light reflex', 'Mydriasis with intact light reflex', 'Loss of corneal reflex'], ans: 1, exp: 'Atropine blocks M₃ receptors on the sphincter pupillae, so the pupil dilates and cannot constrict to light; ciliary muscle paralysis causes cycloplegia.' },
                    { q: 'How can ephedrine-induced mydriasis be distinguished from atropine-induced mydriasis?', opts: ['Ephedrine abolishes the corneal reflex', 'The light reflex is retained with ephedrine', 'Ephedrine causes miosis in light', 'They cannot be distinguished'], ans: 1, exp: 'Sympathomimetics contract the dilator pupillae (α₁) but leave the parasympathetic sphincter functional, so the pupil still constricts to light.' },
                    { q: 'Why is the corneal reflex abolished by lignocaine but not by atropine?', opts: ['Lignocaine blocks sensory (trigeminal) nerve conduction', 'Atropine is more potent', 'Lignocaine blocks M₃ receptors', 'Atropine is not absorbed'], ans: 0, exp: 'The afferent limb of the corneal reflex is the ophthalmic division of the trigeminal nerve; local anaesthetics block its Na⁺ channels.' },
                    { q: 'Why is an albino rabbit preferred?', opts: ['It is cheaper', 'The unpigmented iris makes the pupil margin easy to see and drugs are not bound by melanin', 'It has no light reflex', 'It is resistant to atropine'], ans: 1, exp: 'Melanin binds drugs such as atropine and delays their effect; the clear iris also makes pupil margins easy to measure.' },
                    { q: 'Physostigmine causes miosis because it:', opts: ['Stimulates α₁ receptors', 'Inhibits acetylcholinesterase, increasing ACh at the sphincter pupillae', 'Blocks Na⁺ channels', 'Blocks dopamine receptors'], ans: 1, exp: 'Anticholinesterases prolong the action of endogenous ACh on muscarinic receptors of the sphincter pupillae and ciliary muscle.' }
                ],
                inferenceHint: 'Record baseline and post-drug signs for each drug; the pattern identifies the drug class.'
            };
        }

        setup() {
            this.results = [];
            this.rabbitNo = 0;
            this.tools = [
                { id: 'ruler', label: 'mm ruler', x: 110, y: 486 },
                { id: 'torch', label: 'Pen-torch', x: 250, y: 486 },
                { id: 'cotton', label: 'Cotton wisp', x: 390, y: 486 },
                { id: 'dropper', label: 'Dropper', x: 530, y: 486 }
            ];
            this.hotspots = [
                { x: 60, y: 210, w: 300, h: 190, label: 'Rabbit restrainer (head protrudes)' },
                { x: SCOPE.x - 60, y: SCOPE.y + 100, w: 120, h: 40, label: 'Magnified view of the test eye' }
            ];
            this.ruler = 0; this.torch = 0; this.cotton = 0; this.dropFx = 0;
            this.lid = 0; this.blinkT = -1; this.ear = 0;
            this.resetAnimal();
        }

        resetAnimal() {
            this.rabbitNo++;
            this.base = 6.2 + M.randn() * 0.3;
            this.pupil = this.base;
            this.pupilTarget = this.base;
            this.drug = null;            // pharmacological identity in the test eye
            this.given = null;           // treatment entry as chosen (may be 'unknown')
            this.tMin = null;
            this.obs = { pre: {}, post: {} };
            this.phase = 'pre';
            this.simMin = 0;
            this.setStep(0);
            this._refresh();
        }

        get stage() { return this.phase === 'post' ? 'post' : 'pre'; }

        /* effect fraction of instilled drug (first-order onset, ~6 min) */
        get f() { return this.drug && this.tMin !== null ? 1 - Math.exp(-this.tMin / 6) : 0; }
        get lightPresent() { return !(this.drug && !this.drug.light && this.f > 0.5); }
        get cornealPresent() { return !(this.drug && !this.drug.corneal && this.f > 0.5); }

        _refresh() {
            const o = this.obs[this.stage];
            const done = k => o[k] !== undefined ? ' ✓' : '';
            const testing = [
                { label: '📏 Pupil' + done('pupil'), onClick: () => this.use('ruler') },
                { label: '🔦 Light reflex' + done('light'), onClick: () => this.use('torch') },
                { label: '🪶 Corneal reflex' + done('corneal'), onClick: () => this.use('cotton') }
            ];
            const all = ['pupil', 'light', 'corneal'].every(k => o[k] !== undefined);
            if (this.phase === 'pre') {
                this.status(all ? `Baseline complete. Select a drug (left) and instil <b>2 drops</b> into the test eye.` : 'Record the <b>baseline</b> signs of the test eye — drag the tools onto the eye or use the buttons.');
                this.actions([...testing, { label: '💧 Instil 2 drops', primary: all, disabled: !all, onClick: () => this.use('dropper') }]);
            } else if (this.phase === 'dosed') {
                this.status(`<b>${this.given.short}</b> instilled into the right eye; saline into the left (control). Allow absorption.`);
                this.actions([{ label: '⏩ Wait 15 min', primary: true, onClick: () => this.wait() }]);
            } else if (this.phase === 'post') {
                this.status(all ? 'Post-drug signs recorded. Compare with baseline, then take a fresh rabbit.' : `<b>${Math.round(this.tMin)} min</b> after instillation — re-test the test eye.`);
                this.actions([...testing, { label: '↺ Fresh rabbit', primary: all, disabled: !all, onClick: () => this.resetAnimal() }]);
            }
            this.hud('l', [{ k: 'Rabbit', v: '#' + this.rabbitNo }, { k: 'Test eye', v: this.given ? this.given.short : 'untreated' }]);
        }

        /* ---------- tools ---------- */
        use(tool) {
            if (this.busy) return;
            const o = this.obs[this.stage];
            if (tool === 'dropper') {
                if (this.phase !== 'pre') return this.toast('Drug already instilled — wait and re-test.', 'warn');
                if (!['pupil', 'light', 'corneal'].every(k => o[k] !== undefined)) return this.toast('Record all three baseline signs first.', 'warn');
                return this.instil();
            }
            if (this.phase === 'dosed') return this.toast('Wait for absorption (15 min) before re-testing.', 'warn');
            this.busy = true;
            if (tool === 'ruler') {
                this.tw.add(0.5, e => { this.ruler = e; }, {
                    onDone: () => this.tw.wait(1.4, () => {
                        const v = Math.round(this.pupil * 2) / 2;
                        o.pupil = v;
                        this.floatText(SCOPE.x, SCOPE.y - 60, `Pupil ≈ ${v.toFixed(1)} mm`);
                        this.tw.add(0.4, e => { this.ruler = 1 - e; }, { onDone: () => this._afterTest() });
                    })
                });
            } else if (tool === 'torch') {
                this.tw.add(0.5, e => { this.torch = e; }, {
                    onDone: () => this.tw.wait(1.8, () => {
                        o.light = this.lightPresent;
                        this.floatText(SCOPE.x, SCOPE.y - 60, o.light ? 'Pupil constricts → reflex PRESENT' : 'No constriction → reflex ABSENT', o.light ? '#86efac' : '#fda4af');
                        this.tw.add(0.4, e => { this.torch = 1 - e; }, { onDone: () => this._afterTest() });
                    })
                });
            } else if (tool === 'cotton') {
                this.tw.add(0.8, e => { this.cotton = e; }, {
                    onDone: () => {
                        o.corneal = this.cornealPresent;
                        if (o.corneal) this.blinkT = 0;
                        this.floatText(SCOPE.x, SCOPE.y - 60, o.corneal ? 'Blink → corneal reflex PRESENT' : 'No blink → reflex ABSENT', o.corneal ? '#86efac' : '#fda4af');
                        this.tw.wait(0.9, () => this.tw.add(0.5, e => { this.cotton = 1 - e; }, { onDone: () => this._afterTest() }));
                    }
                });
            }
        }

        _afterTest() {
            this.busy = false;
            const o = this.obs[this.stage];
            const all = ['pupil', 'light', 'corneal'].every(k => o[k] !== undefined);
            if (all && this.phase === 'pre') this.setStep(1);
            if (all && this.phase === 'post') this._record();
            this._refresh();
        }

        instil() {
            const tr = this.tr;
            if (!tr) return;
            this.given = tr;
            this.drug = tr.id === 'unknown' ? DRUGS[['atropine', 'physo', 'ephedrine', 'lignocaine'][Math.floor(Math.random() * 4)]] : DRUGS[tr.id];
            this.busy = true;
            let n = 0;
            const drop = () => {
                n++;
                this.dropFx = 0.001;
                this.tw.add(0.7, e => { this.dropFx = e; }, {
                    ease: LAB.ease.linear,
                    onDone: () => {
                        this.dropFx = 0; this.blinkT = 0;
                        this.fx.emit({ x: SCOPE.x, y: SCOPE.y - 10, r: 4, grow: 60, life: 0.6, color: 'rgba(200,230,255,0.5)', shape: 'soft' });
                        if (n < 2) this.tw.wait(0.4, drop);
                        else {
                            this.tMin = 0;
                            this.phase = 'dosed';
                            this.busy = false;
                            this.setStep(2);
                            this.markDone(tr.id);
                            this.toast(`2 drops of <b>${tr.short}</b> instilled into the conjunctival sac.`, 'success');
                            this._refresh();
                        }
                    }
                });
            };
            this.tw.add(0.6, e => { this.dropperIn = e; }, { onDone: drop });
        }

        wait() {
            this.timeLapse(15, 4, {
                label: 'Corneal absorption',
                onTick: (sim, p) => { this.tMin = 15 * p; },
                onDone: () => { this.phase = 'post'; this.setStep(3); this.dropperIn = 0; this._refresh(); this.toast('15 min elapsed — compare the test eye with the control eye.', 'info'); }
            });
        }

        _record() {
            const pre = this.obs.pre, post = this.obs.post;
            const yn = (b) => b ? 'Present' : '<b style="color:#be123c">Absent</b>';
            const dPupil = post.pupil - pre.pupil;
            const sign = Math.abs(dPupil) < 1 ? 'no change' : (dPupil > 0 ? 'mydriasis' : 'miosis');
            this.results.push({ given: this.given, drug: this.drug, pre, post });
            this.addRow([`<b>${this.given.short}</b>`, `${pre.pupil.toFixed(1)} → <b>${post.pupil.toFixed(1)}</b> <small>(${sign})</small>`, yn(post.light), yn(post.corneal)], sign === 'mydriasis' ? 'up' : sign === 'miosis' ? 'down' : '');
            this.setStep(4);
            this._chart();
            this._infer(sign);
        }

        _chart() {
            const r = this.results;
            this.chart.draw({
                xMin: 0.4, xMax: Math.max(3, r.length) + 0.6, yMin: 0, yMax: 12,
                xTicks: r.map((_, i) => i + 1), xFmt: v => (r[v - 1] || {}).given ? r[v - 1].given.short.slice(0, 9) : '',
                yLabel: 'Pupil (mm)', barCount: Math.max(3, r.length) + 0.2,
                series: [
                    { name: 'Before', color: '#94a3b8', type: 'bar', barWidth: 0.36, offset: -0.5, points: r.map((x, i) => [i + 1, x.pre.pupil]) },
                    { name: 'After', color: '#0d9488', type: 'bar', barWidth: 0.36, offset: 0.5, labels: true, points: r.map((x, i) => [i + 1, x.post.pupil]) }
                ]
            });
        }

        _infer(sign) {
            const last = this.results[this.results.length - 1];
            const p = last.post;
            let cls;
            if (sign === 'mydriasis' && !p.light) cls = 'an <b>antimuscarinic (atropine-like)</b> drug — mydriasis with loss of light reflex';
            else if (sign === 'mydriasis' && p.light) cls = 'a <b>sympathomimetic</b> — mydriasis with light reflex retained';
            else if (sign === 'miosis') cls = 'a <b>parasympathomimetic / anticholinesterase</b> — miosis';
            else if (!p.corneal) cls = 'a <b>local anaesthetic</b> — corneal reflex abolished, pupil unchanged';
            else cls = 'inactive (vehicle-like)';
            let html = `<p>The latest pattern indicates ${cls}.</p>`;
            if (last.given.id === 'unknown') {
                html += `<p style="margin-top:8px"><b>Identify Unknown X:</b></p><div class="lab2-seg" id="re-guess">${['atropine', 'physo', 'ephedrine', 'lignocaine'].map(id => `<button data-id="${id}">${DRUGS[id].short}</button>`).join('')}</div><p id="re-verdict" style="margin-top:6px"></p>`;
            } else {
                html += `<p style="margin-top:6px;color:#475569">${last.drug.note}</p>`;
            }
            this.infer(html);
            const g = this.$('re-guess');
            if (g) g.querySelectorAll('button').forEach(b => b.onclick = () => {
                const ok = b.dataset.id === last.drug.id;
                g.querySelectorAll('button').forEach(x => { x.disabled = true; x.classList.toggle('active', x.dataset.id === last.drug.id); });
                this.$('re-verdict').innerHTML = ok ? `✅ Correct — <b>${last.drug.name}</b>. ${last.drug.note}` : `❌ It was <b>${last.drug.name}</b>. ${last.drug.note}`;
            });
        }

        /* ---------- canvas tool dragging ---------- */
        _toolAt(x, y) { return this.tools.find(t => Math.abs(x - t.x) < 55 && Math.abs(y - t.y) < 32); }
        cursorAt(x, y) { return !this.busy && !!this._toolAt(x, y); }
        onPointerDown(x, y) {
            const t = this._toolAt(x, y);
            if (t) this.dragTool = { t, x, y };
        }
        onPointerMove(x, y) { if (this.dragTool) { this.dragTool.x = x; this.dragTool.y = y; } }
        onPointerUp(x, y) {
            if (!this.dragTool) return;
            const t = this.dragTool.t;
            this.dragTool = null;
            const onEye = Math.hypot(x - EYE.x, y - EYE.y) < 70 || Math.hypot(x - SCOPE.x, y - SCOPE.y) < SCOPE.r;
            if (onEye) this.use(t.id);
            else this.toast('Drop the instrument onto the rabbit’s eye (or the magnified view).', 'warn');
        }

        /* ---------- simulation ---------- */
        update(dt) {
            // pupil physiology
            const d = this.drug;
            let target = this.base + (d ? d.pupil * this.f : 0);
            if (this.torch > 0.6 && this.lightPresent) target = Math.max(2.4, target * 0.55);
            this.pupilTarget = target;
            this.pupil = M.approach(this.pupil, target, this.torch > 0.6 ? 3.5 : 1.6, dt);
            // hippus (small physiological oscillation)
            this.hippus = Math.sin(performance.now() / 900) * 0.06;
            // blinking
            if (this.blinkT >= 0) {
                this.blinkT += dt;
                this.lid = this.blinkT < 0.09 ? this.blinkT / 0.09 : Math.max(0, 1 - (this.blinkT - 0.09) / 0.22);
                if (this.blinkT > 0.4) { this.blinkT = -1; this.lid = 0; }
            } else if (Math.random() < dt * 0.08 && !this.busy) this.blinkT = 0;
            this.ear += dt;
            this.hud('r', [
                { k: 'Since drops', v: this.tMin !== null ? Math.round(this.tMin) + ' min' : '—' },
                { k: 'Room light', v: this.torch > 0.5 ? 'torch ON' : 'diffuse', tone: this.torch > 0.5 ? 'warn' : '' }
            ]);
        }

        /* ---------- drawing ---------- */
        draw(ctx) {
            this._restrainer(ctx, false);
            this._rabbit(ctx);
            this._restrainer(ctx, true);
            this._scope(ctx);
            this._toolsTray(ctx);
            this._activeTools(ctx);
        }

        _restrainer(ctx, front) {
            const x = 40, y = 200, w = 330, h = 210;
            if (!front) {
                G.shadow(ctx, x + w / 2, 420, w * 0.6, 12, 0.45);
                ctx.fillStyle = 'rgba(205,225,240,0.16)'; G.rr(ctx, x, y, w, h, 8); ctx.fill();
                // floor
                G.metal(ctx, x - 6, y + h - 8, w + 12, 14, { tone: 'steel', r: 3 });
            } else {
                G.glass(ctx, x, y, w, h, { r: 8, tint: 'rgba(210,230,245,0.06)' });
                // front head-stock panel with neck aperture
                ctx.fillStyle = 'rgba(190,215,235,0.35)';
                ctx.beginPath(); ctx.rect(x + w - 16, y, 16, h); ctx.fill();
                ctx.strokeStyle = 'rgba(230,245,255,0.8)'; ctx.lineWidth = 1.5; ctx.stroke();
                G.metal(ctx, x - 4, y - 8, w + 8, 10, { tone: 'steel', r: 3 });
                for (let i = 0; i < 5; i++) G.screw(ctx, x + 20 + i * 70, y - 3, 2.6);
                G.text(ctx, 'RABBIT RESTRAINER', x + 14, y + h - 18, { size: 9, color: 'rgba(226,232,240,0.75)', weight: 800 });
            }
        }

        _rabbit(ctx) {
            const t = this.ear;
            ctx.save();
            // body inside restrainer
            const bg = ctx.createRadialGradient(190, 290, 20, 210, 320, 170);
            bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.7, '#eef2f6'); bg.addColorStop(1, '#c7d0da');
            ctx.fillStyle = bg;
            const br = Math.sin(t * 2.2) * 2;
            ctx.beginPath();
            ctx.moveTo(360, 250);
            ctx.bezierCurveTo(300, 210 - br, 120, 210 - br, 72, 300);
            ctx.bezierCurveTo(50, 350, 80, 400, 140, 404);
            ctx.lineTo(340, 404);
            ctx.bezierCurveTo(380, 380, 390, 300, 360, 250);
            ctx.fill();
            ctx.strokeStyle = 'rgba(100,116,139,0.25)'; ctx.stroke();
            // fur strokes
            ctx.strokeStyle = 'rgba(148,163,184,0.25)'; ctx.lineWidth = 1;
            for (let i = 0; i < 30; i++) { const fx = 90 + (i * 37) % 260, fy = 260 + (i * 53) % 130; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx - 4, fy + 4, fx - 8, fy + 6); ctx.stroke(); }
            // ears (behind head)
            const earSway = Math.sin(t * 0.8) * 0.04;
            [[370, 168, -0.55 + earSway, 0.85], [392, 160, -0.35 + earSway * 1.3, 1]].forEach(([ex, ey, rot, k]) => {
                ctx.save(); ctx.translate(ex, ey); ctx.rotate(rot);
                const eg = ctx.createLinearGradient(-20, 0, 20, 0);
                eg.addColorStop(0, '#e2e8f0'); eg.addColorStop(0.5, '#ffffff'); eg.addColorStop(1, '#cbd5e1');
                ctx.fillStyle = eg;
                ctx.beginPath(); ctx.ellipse(0, -70 * k, 22 * k, 78 * k, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(100,116,139,0.3)'; ctx.stroke();
                const ig = ctx.createLinearGradient(0, -140 * k, 0, 0);
                ig.addColorStop(0, '#f8c9d3'); ig.addColorStop(1, '#f2a7b8');
                ctx.fillStyle = ig;
                ctx.beginPath(); ctx.ellipse(4, -70 * k, 12 * k, 64 * k, 0, 0, Math.PI * 2); ctx.fill();
                // ear vessels (translucent albino ear)
                ctx.strokeStyle = 'rgba(200,60,90,0.35)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(4, -10 * k); ctx.bezierCurveTo(8, -50 * k, 0, -90 * k, 6, -128 * k); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(5, -60 * k); ctx.lineTo(12, -80 * k); ctx.moveTo(4, -95 * k); ctx.lineTo(-4, -112 * k); ctx.stroke();
                ctx.restore();
            });
            // head
            const hg = ctx.createRadialGradient(420, 215, 10, 430, 245, 110);
            hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.65, '#f1f5f9'); hg.addColorStop(1, '#c9d2dc');
            ctx.fillStyle = hg;
            ctx.beginPath();
            ctx.moveTo(352, 210);
            ctx.bezierCurveTo(380, 160, 470, 170, 512, 228);
            ctx.bezierCurveTo(540, 262, 538, 292, 512, 300);
            ctx.bezierCurveTo(470, 318, 400, 330, 360, 318);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(100,116,139,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            // cheek fur
            ctx.strokeStyle = 'rgba(148,163,184,0.3)';
            for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(400 + i * 9, 300); ctx.quadraticCurveTo(398 + i * 9, 306, 394 + i * 9, 310); ctx.stroke(); }
            // nose & mouth
            ctx.fillStyle = '#e88fa3';
            ctx.beginPath(); ctx.moveTo(524, 262); ctx.lineTo(534, 266); ctx.lineTo(526, 274); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(190,100,120,0.8)'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(526, 274); ctx.quadraticCurveTo(524, 286, 514, 290); ctx.stroke();
            const tw = Math.sin(t * 11) * 1.5;
            ctx.strokeStyle = 'rgba(100,116,139,0.5)'; ctx.lineWidth = 0.6;
            for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(518, 276); ctx.quadraticCurveTo(548, 272 + i * 6 + tw, 585, 262 + i * 12 + tw); ctx.stroke(); }
            // the eye on the rabbit (scaled-down copy of the scope rendering)
            this._eye(ctx, EYE.x, EYE.y, 1.45, false);
            // leader lines to the scope
            ctx.strokeStyle = 'rgba(94,234,212,0.45)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(EYE.x + 18, EYE.y - 14); ctx.lineTo(SCOPE.x - SCOPE.r * 0.7, SCOPE.y - SCOPE.r * 0.72);
            ctx.moveTo(EYE.x + 18, EYE.y + 14); ctx.lineTo(SCOPE.x - SCOPE.r * 0.7, SCOPE.y + SCOPE.r * 0.72); ctx.stroke();
            ctx.setLineDash([]);
            ctx.strokeStyle = 'rgba(94,234,212,0.8)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(EYE.x, EYE.y, 22, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }

        /** realistic albino-rabbit eye. k = px per mm */
        _eye(ctx, cx, cy, k, big) {
            const irisR = 6.4 * k, pupR = Math.max(1, (this.pupil / 2 + this.hippus) * k);
            ctx.save();
            // almond eye opening
            const ow = irisR * 1.32, oh = irisR * 1.08;
            ctx.save();
            ctx.beginPath(); ctx.ellipse(cx, cy, ow, oh, -0.05, 0, Math.PI * 2); ctx.clip();
            // sclera
            ctx.fillStyle = '#f3e6e8'; ctx.fillRect(cx - ow, cy - oh, ow * 2, oh * 2);
            // iris (albino: translucent, vascular, pink-red)
            const ig = ctx.createRadialGradient(cx, cy, pupR, cx, cy, irisR);
            ig.addColorStop(0, '#d9566f'); ig.addColorStop(0.35, '#e98a9c'); ig.addColorStop(0.85, '#f3b6c2'); ig.addColorStop(1, '#c96b80');
            ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(cx, cy, irisR, 0, Math.PI * 2); ctx.fill();
            if (big) {
                // radial iris stroma fibres + vessels
                for (let i = 0; i < 90; i++) {
                    const a = i / 90 * Math.PI * 2 + Math.sin(i * 7.3) * 0.03;
                    ctx.strokeStyle = i % 3 ? 'rgba(255,255,255,0.18)' : 'rgba(170,40,70,0.28)';
                    ctx.lineWidth = i % 3 ? 1 : 0.8;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a) * (pupR + 2), cy + Math.sin(a) * (pupR + 2));
                    ctx.quadraticCurveTo(cx + Math.cos(a + 0.08) * (irisR * 0.7), cy + Math.sin(a + 0.08) * (irisR * 0.7), cx + Math.cos(a) * irisR * 0.97, cy + Math.sin(a) * irisR * 0.97);
                    ctx.stroke();
                }
                // collarette ring
                ctx.strokeStyle = 'rgba(160,40,70,0.35)'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(cx, cy, pupR + (irisR - pupR) * 0.35, 0, Math.PI * 2); ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(120,30,55,0.55)'; ctx.lineWidth = big ? 2 : 1;
            ctx.beginPath(); ctx.arc(cx, cy, irisR, 0, Math.PI * 2); ctx.stroke();
            // pupil (red fundal reflex of albino)
            const pg = ctx.createRadialGradient(cx - pupR * 0.2, cy - pupR * 0.2, 0, cx, cy, pupR);
            pg.addColorStop(0, '#5a0d18'); pg.addColorStop(0.7, '#2a0509'); pg.addColorStop(1, '#14020500');
            ctx.fillStyle = '#1c0306'; ctx.beginPath(); ctx.arc(cx, cy, pupR, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, pupR, 0, Math.PI * 2); ctx.fill();
            // corneal glare
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.beginPath(); ctx.ellipse(cx - irisR * 0.35, cy - irisR * 0.38, irisR * 0.16, irisR * 0.1, -0.6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.ellipse(cx + irisR * 0.3, cy + irisR * 0.35, irisR * 0.07, irisR * 0.05, -0.6, 0, Math.PI * 2); ctx.fill();
            // drug film after instillation
            if (this.tMin !== null && this.tMin < 4) {
                ctx.fillStyle = `rgba(190,225,255,${0.25 * (1 - this.tMin / 4)})`;
                ctx.fillRect(cx - ow, cy, ow * 2, oh);
            }
            // eyelids (blink)
            const lid = this.lid;
            if (lid > 0.01) {
                const lg = ctx.createLinearGradient(0, cy - oh, 0, cy + oh);
                lg.addColorStop(0, '#f1f5f9'); lg.addColorStop(1, '#cbd5e1');
                ctx.fillStyle = lg;
                ctx.fillRect(cx - ow, cy - oh, ow * 2, oh * 2 * lid * 0.55);
                ctx.fillRect(cx - ow, cy + oh - oh * 2 * lid * 0.5, ow * 2, oh * 2 * lid * 0.5);
            }
            ctx.restore();
            // lid margins
            ctx.strokeStyle = big ? 'rgba(170,90,110,0.7)' : 'rgba(170,90,110,0.6)'; ctx.lineWidth = big ? 3 : 1.4;
            ctx.beginPath(); ctx.ellipse(cx, cy, ow, oh, -0.05, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }

        _scope(ctx) {
            const { x, y, r } = SCOPE;
            ctx.save();
            G.shadow(ctx, x, y + r + 6, r * 0.8, 12, 0.35);
            // bezel
            const bz = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
            bz.addColorStop(0, '#e2e8f0'); bz.addColorStop(0.5, '#64748b'); bz.addColorStop(1, '#1e293b');
            ctx.fillStyle = bz; ctx.beginPath(); ctx.arc(x, y, r + 10, 0, Math.PI * 2); ctx.fill();
            ctx.save();
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
            // fur background
            const fg = ctx.createRadialGradient(x - 40, y - 60, 10, x, y, r);
            fg.addColorStop(0, '#ffffff'); fg.addColorStop(1, '#d5dde5');
            ctx.fillStyle = fg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
            ctx.strokeStyle = 'rgba(148,163,184,0.3)'; ctx.lineWidth = 1;
            for (let i = 0; i < 70; i++) {
                const a = i * 2.39996, rr = 40 + (i * 37) % (r - 30);
                const fx = x + Math.cos(a) * rr, fy = y + Math.sin(a) * rr;
                ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(fx + 5, fy + 2, fx + 10, fy + 6); ctx.stroke();
            }
            // torch illumination
            if (this.torch > 0.01) {
                const lg = ctx.createRadialGradient(x - 10, y - 10, 5, x, y, r);
                lg.addColorStop(0, `rgba(255,250,220,${0.55 * this.torch})`); lg.addColorStop(1, 'rgba(255,250,220,0)');
                ctx.fillStyle = lg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
            }
            this._eye(ctx, x, y, PX_MM * 1.0, true);
            // mm ruler overlay
            if (this.ruler > 0.01) {
                ctx.globalAlpha = this.ruler;
                const ry = y + 34, rx0 = x - 120;
                ctx.fillStyle = 'rgba(255,255,255,0.78)'; G.rr(ctx, rx0, ry, 240, 30, 3); ctx.fill();
                ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
                for (let mm = 0; mm <= 24; mm++) {
                    const tx = rx0 + 6 + mm * PX_MM;
                    if (tx > rx0 + 236) break;
                    ctx.beginPath(); ctx.moveTo(tx, ry); ctx.lineTo(tx, ry + (mm % 5 === 0 ? 12 : 7)); ctx.stroke();
                    if (mm % 5 === 0) G.text(ctx, String(mm), tx, ry + 24, { size: 9, color: '#0f172a', align: 'center' });
                }
                // pupil callipers
                const pr = this.pupil / 2 * PX_MM;
                ctx.strokeStyle = '#0d9488'; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(x - pr, y - 30); ctx.lineTo(x - pr, ry); ctx.moveTo(x + pr, y - 30); ctx.lineTo(x + pr, ry); ctx.stroke();
                ctx.globalAlpha = 1;
            }
            ctx.restore();
            // glass reflection
            ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(x, y, r - 12, -2.5, -1.7); ctx.stroke();
            G.text(ctx, '×8 MAGNIFIED · RIGHT (TEST) EYE', x, y + r + 26, { size: 10, align: 'center', color: '#e2e8f0', weight: 800, shadow: true });
            ctx.restore();
        }

        _toolsTray(ctx) {
            G.shadow(ctx, 330, 518, 300, 10, 0.4);
            const g = ctx.createLinearGradient(0, 452, 0, 522);
            g.addColorStop(0, '#d7dee6'); g.addColorStop(1, '#8e9aa6');
            ctx.fillStyle = g; G.rr(ctx, 40, 452, 580, 70, 10); ctx.fill();
            ctx.fillStyle = 'rgba(15,23,42,0.18)'; G.rr(ctx, 48, 460, 564, 54, 8); ctx.fill();
            this.tools.forEach(t => {
                if (this.dragTool && this.dragTool.t === t) return;
                const hov = Math.abs(this.ptr.x - t.x) < 55 && Math.abs(this.ptr.y - t.y) < 32;
                this._drawTool(ctx, t.id, t.x, t.y - (hov ? 4 : 0), 0);
                G.text(ctx, t.label, t.x, 516, { size: 9.5, align: 'center', color: '#0f172a', weight: 700 });
            });
            if (this.dragTool) this._drawTool(ctx, this.dragTool.t.id, this.dragTool.x, this.dragTool.y, -0.3);
        }

        _drawTool(ctx, id, x, y, rot) {
            ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
            if (id === 'ruler') {
                ctx.fillStyle = 'rgba(255,255,255,0.85)'; G.rr(ctx, -46, -8, 92, 16, 2); ctx.fill();
                ctx.strokeStyle = '#475569'; ctx.lineWidth = 0.8; ctx.stroke();
                for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.moveTo(-42 + i * 5, -8); ctx.lineTo(-42 + i * 5, -8 + (i % 5 === 0 ? 8 : 4)); ctx.stroke(); }
            } else if (id === 'torch') {
                G.metal(ctx, -44, -6, 76, 12, { r: 4, tone: 'chrome' });
                G.metal(ctx, 30, -8, 14, 16, { r: 3, tone: 'dark' });
                ctx.fillStyle = '#fef9c3'; ctx.beginPath(); ctx.ellipse(44, 0, 3, 6, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-30, -9); ctx.lineTo(10, -9); ctx.stroke();
            } else if (id === 'cotton') {
                ctx.strokeStyle = '#e7d3a8'; ctx.lineWidth = 3; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(-44, 6); ctx.lineTo(30, -2); ctx.stroke();
                ctx.fillStyle = '#ffffff';
                [[34, -3, 7], [40, -6, 5], [42, 1, 4], [46, -3, 3]].forEach(([a, b, r]) => { ctx.beginPath(); ctx.arc(a, b, r, 0, Math.PI * 2); ctx.fill(); });
                ctx.strokeStyle = 'rgba(203,213,225,0.9)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(46, -3); ctx.quadraticCurveTo(54, -6, 58, -2); ctx.stroke();
            } else if (id === 'dropper') {
                const c = this.tr ? this.tr.color : '#94a3b8';
                ctx.rotate(Math.PI / 2);
                G.metal(ctx, -8, -36, 16, 18, { r: 6, tone: 'dark' });
                G.glass(ctx, -5, -18, 10, 40, { r: 3, tint: 'rgba(230,240,250,0.35)' });
                ctx.fillStyle = G.hexA(c, 0.8); ctx.fillRect(-3.5, 0, 7, 20);
                ctx.fillStyle = G.hexA(c, 0.9); ctx.beginPath(); ctx.moveTo(-3.5, 20); ctx.lineTo(3.5, 20); ctx.lineTo(0.8, 32); ctx.lineTo(-0.8, 32); ctx.fill();
            }
            ctx.restore();
        }

        _activeTools(ctx) {
            const { x, y, r } = SCOPE;
            // torch beam into the scope
            if (this.torch > 0.01) {
                const tx = M.lerp(x + r + 80, x + 70, this.torch), ty = M.lerp(y - r - 40, y - 85, this.torch);
                ctx.save();
                const beam = ctx.createLinearGradient(tx, ty, x, y);
                beam.addColorStop(0, `rgba(255,248,200,${0.55 * this.torch})`); beam.addColorStop(1, 'rgba(255,248,200,0)');
                ctx.fillStyle = beam;
                ctx.beginPath(); ctx.moveTo(tx - 8, ty + 4); ctx.lineTo(x - 50, y + 30); ctx.lineTo(x + 40, y + 40); ctx.lineTo(tx + 8, ty + 8); ctx.closePath(); ctx.fill();
                this._drawTool(ctx, 'torch', tx + 40, ty - 18, Math.atan2(y - ty, x - tx) + Math.PI);
                ctx.restore();
            }
            // cotton wisp approaching the cornea from the side
            if (this.cotton > 0.01) {
                const cx = M.lerp(x + r + 70, x + 52, this.cotton), cy = M.lerp(y + 30, y + 6, this.cotton);
                this._drawTool(ctx, 'cotton', cx + 50, cy, Math.PI);
            }
            // dropper over the eye with falling drop
            if (this.dropperIn > 0.01) {
                const dy = M.lerp(y - r - 60, y - 110, this.dropperIn);
                this._drawTool(ctx, 'dropper', x, dy, 0);
                if (this.dropFx > 0) {
                    const fy = M.lerp(dy + 34, y - 6, LAB.ease.in(this.dropFx));
                    ctx.fillStyle = G.hexA(this.tr ? this.tr.color : '#7dd3fc', 0.75);
                    ctx.beginPath(); ctx.ellipse(x, fy, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x - 1.5, fy - 2, 1.4, 0, Math.PI * 2); ctx.fill();
                }
            }
        }
    }

    LAB.register(8, RabbitEye);
})();
