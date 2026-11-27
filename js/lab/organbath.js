/**
 * PharmVR 2D — shared isolated-tissue rig
 *
 * Organ bath + frontal writing lever + smoked-drum kymograph, factored out so
 * every isolated-tissue experiment shares one apparatus.
 *   in use by : exp 10 (rabbit intestine), 11 (frog rectus), 13 (ACh CRC)
 *   reusable for: exps 14-17 (bioassay / pA2), 19, 20, 22
 *
 * A subclass supplies the pharmacology and the tissue; the rig supplies the
 * glassware, the lever, the drum, the trace and the bench furniture.
 *
 *   rig()                  -> { solution, tempC, spont, restLen, tissueLabel }
 *   drawTissue(ctx, geom)  -> paint the muscle belly between geom.topY/hookY
 *   response(drug, dose)   -> mm of lever excursion (negative = relaxation)
 *
 * Lifecycle: call initRig() from setup(), resetRig() from resetAnimal(),
 * updateRig(dt) from update(), drawRig(ctx) from draw().
 */
(function () {
    const { M, G } = LAB;

    const BENCH = 452;
    const BATH = { x: 711, top: 272, bot: 448, w: 70 };
    const LEVER = { px: 768, py: 230, threadX: 711, stylusX: 426 };
    const DRUM = { cx: 320, top: 36, bot: 268, r: 108 };
    const MAG = (LEVER.px - LEVER.stylusX) / (LEVER.px - LEVER.threadX); // ×6
    const PX_MM = 3.0;                      // drum pixels per mm of excursion

    LAB.RIG = { BENCH, BATH, LEVER, DRUM, MAG, PX_MM, STYLUS_A: LAB.Kymograph.STYLUS_A };

    class OrganBath extends LAB.LabEngine {
        /* ---------------- subclass hooks ---------------- */
        rig() { return {}; }
        drawTissue(ctx, geom) {}
        response(drug, dose) { return 0; }

        /* ---------------- lifecycle ---------------- */
        initRig() {
            this.R = Object.assign({
                solution: 'Ringer',
                tempC: null,          // number → heated jacket + thermostat
                restLen: 96,
                spont: null,          // { amp, period } spontaneous rhythm in mm / s
                tissueLabel: 'Tissue'
            }, this.rig());
            this.tools = [{ id: 'pipette', label: 'Micropipette', x: 165, y: 500 }];
            this.hotspots = [
                { x: BATH.x - 46, y: BATH.top, w: 92, h: BATH.bot - BATH.top, label: `20 mL organ bath — ${this.R.solution}` },
                { x: DRUM.cx - DRUM.r, y: DRUM.top, w: DRUM.r * 2, h: 60, label: 'Smoked drum kymograph' },
                { x: 470, y: LEVER.py - 26, w: 240, h: 34, label: 'Frontal writing lever — ×' + MAG.toFixed(0) },
                { x: 388, y: 470, w: 300, h: 60, label: 'Reagent rack — click a vial to select it' }
            ];
            this.kymo = new LAB.Kymograph({
                cx: DRUM.cx, top: DRUM.top, bot: DRUM.bot, r: DRUM.r, benchY: BENCH,
                channels: [{ baseline: LEVER.py, px: PX_MM, color: '#f8fafc' }]
            });
            this.resetRig();
        }

        resetRig() {
            this.amp = 0;
            this.ampTarget = 0;
            if (this.kymo) this.kymo.reset();
            this.spontPhase = 0;
            this.spontGain = 1;
            this.spontTarget = 1;
            this.mod = null;
            this.tint = null;
            this.cloud = null;
            this.level = 1;
            this.bubbles = [];
            this.agonistIn = false;
            this.vigour = 1;
        }

        /** what the stylus is actually tracing: drug tone + spontaneous rhythm */
        get penValue() {
            const s = this.R.spont;
            if (!s) return this.amp;
            return this.amp + s.amp * this.spontGain * Math.sin(this.spontPhase);
        }

        /* ---------------- bath actions ---------------- */

        /** marks the drum, tints the bath and plays the plume. Returns the drug. */
        markAddition(d, dose) {
            this.kymo.mark(`${d.short} ${dose}`, d.color);
            this.tint = { color: d.color, a: 0.28 };
            this.cloud = { color: d.color, t: 0 };
            this.tw.add(2.2, e => { if (this.cloud) this.cloud.t = e; }, { onDone: () => { this.cloud = null; } });
            this.floatText(BATH.x, BATH.top - 14, `${d.short} ${dose} ${d.unit}`, d.color);
            return d;
        }

        /** three changes of fresh physiological salt solution */
        washBath(done) {
            this.busy = true;
            this.ampTarget = 0;
            this.agonistIn = false;
            this.spontTarget = 1;
            let n = 0;
            const cycle = () => {
                n++;
                this.tw.add(0.42, e => {
                    this.level = 1 - e * 0.8;
                    if (this.tint) this.tint.a = 0.28 * (1 - e) * (1 - (n - 1) / 3);
                }, {
                    onDone: () => this.tw.add(0.46, e => { this.level = 0.2 + e * 0.8; }, {
                        onDone: () => {
                            if (n < 3) return cycle();
                            this.level = 1;
                            this.tint = null;
                            this.busy = false;
                            this.toast(`Bath washed 3× with fresh ${this.R.solution}.`, 'success');
                            if (done) done();
                        }
                    })
                });
            };
            cycle();
        }

        /* ---------------- per-frame ---------------- */
        updateRig(dt) {
            const rate = this.ampTarget > this.amp ? 1.3 : 0.85;
            this.amp = M.approach(this.amp, this.ampTarget, rate, dt);
            this.spontGain = M.approach(this.spontGain, this.spontTarget, 1.1, dt);
            if (this.R.spont) this.spontPhase += dt * Math.PI * 2 / this.R.spont.period;

            this.kymo.update(dt, this.penValue);

            if (Math.random() < dt * 26) {
                this.bubbles.push({ x: BATH.x - 16 + M.rand(-5, 5), y: BATH.bot - 20, r: M.rand(1.4, 3.4), v: M.rand(26, 46), w: M.rand(0.6, 1.6) });
            }
            const surface = this.surfaceY;
            for (let i = this.bubbles.length - 1; i >= 0; i--) {
                const b = this.bubbles[i];
                b.y -= b.v * dt;
                b.x += Math.sin(b.y / 16 + b.w) * 0.3;
                if (b.y < surface + 4) this.bubbles.splice(i, 1);
            }
        }

        get surfaceY() { return BATH.top + 14 + (1 - this.level) * (BATH.bot - BATH.top - 30); }

        /* ---------------- drawing ---------------- */
        drawRig(ctx) {
            this.kymo.draw(ctx);
            this._reservoir(ctx);
            this._bath(ctx);
            this._lever(ctx);
            this._rack(ctx);
            if (this.dragTool) this._pipette(ctx, this.dragTool.x, this.dragTool.y, -0.35);
        }

        /* --- reservoir of physiological salt solution --- */
        _reservoir(ctx) {
            const x = 862, y = 150;
            ctx.save();
            G.metal(ctx, x - 4, y + 54, 8, BENCH - y - 54, { tone: 'steel', r: 2 });
            G.metal(ctx, x - 44, BENCH - 8, 88, 12, { tone: 'dark', r: 3 });
            G.glass(ctx, x - 30, y - 90, 60, 100, { r: 6 });
            ctx.fillStyle = 'rgba(186,230,253,0.5)';
            G.rr(ctx, x - 27, y - 60, 54, 68, 5); ctx.fill();
            ctx.fillStyle = 'rgba(224,242,254,0.85)';
            ctx.fillRect(x - 27, y - 62, 54, 3);
            const words = this.R.solution.toUpperCase().split(/[\s']/).slice(0, 2);
            words.forEach((wd, i) => G.text(ctx, wd, x, y - 36 + i * 11, { size: 8, align: 'center', weight: 800, color: '#0c4a6e' }));
            ctx.strokeStyle = 'rgba(148,163,184,0.85)'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 10, y + 10);
            ctx.bezierCurveTo(x - 60, y + 40, BATH.x + 70, BATH.top - 60, BATH.x + 24, BATH.top - 6);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(226,232,240,0.5)'; ctx.lineWidth = 1.2; ctx.stroke();
            ctx.restore();
        }

        /* --- jacketed organ bath with the mounted tissue --- */
        _bath(ctx) {
            const { x, top, bot, w } = BATH;
            const L = x - w / 2;
            const surface = this.surfaceY;
            ctx.save();

            G.shadow(ctx, x, BENCH + 2, 70, 10, 0.4);
            G.metal(ctx, x - 52, BENCH - 10, 104, 14, { tone: 'dark', r: 4 });
            G.metal(ctx, x + 40, top + 20, 9, BENCH - top - 28, { tone: 'steel', r: 2 });
            G.metal(ctx, x + 18, top + 34, 30, 11, { tone: 'dark', r: 3 });

            // outer water jacket, warmed when the prep needs it
            const warm = this.R.tempC !== null;
            G.glass(ctx, L - 11, top - 6, w + 22, bot - top + 12,
                { r: 10, tint: warm ? 'rgba(254,215,170,0.16)' : 'rgba(186,230,253,0.14)' });
            if (warm) {
                ctx.strokeStyle = 'rgba(248,113,113,0.45)'; ctx.lineWidth = 2;
                for (let i = 0; i < 5; i++) {
                    const yy = top + 20 + i * ((bot - top - 40) / 4);
                    ctx.beginPath(); ctx.moveTo(L - 9, yy); ctx.lineTo(L - 1, yy + 6); ctx.stroke();
                }
            }

            ctx.save();
            G.rr(ctx, L, top, w, bot - top, 8); ctx.clip();
            const fg = ctx.createLinearGradient(L, 0, L + w, 0);
            fg.addColorStop(0, 'rgba(165,215,240,0.55)');
            fg.addColorStop(0.35, 'rgba(214,240,253,0.4)');
            fg.addColorStop(1, 'rgba(140,190,220,0.6)');
            ctx.fillStyle = fg;
            ctx.fillRect(L, surface, w, bot - surface);
            if (this.tint) {
                ctx.fillStyle = G.hexA(this.tint.color, this.tint.a);
                ctx.fillRect(L, surface, w, bot - surface);
            }
            if (this.cloud) {
                const t = this.cloud.t;
                const cy = M.lerp(surface, bot - 24, LAB.ease.out(t));
                const g = ctx.createRadialGradient(x, cy, 2, x, cy, 20 + t * 46);
                g.addColorStop(0, G.hexA(this.cloud.color, 0.5 * (1 - t)));
                g.addColorStop(1, G.hexA(this.cloud.color, 0));
                ctx.fillStyle = g;
                ctx.fillRect(L, surface, w, bot - surface);
            }
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillRect(L, surface - 1.5, w, 3);

            this._tissueBlock(ctx, surface);

            this.bubbles.forEach(b => {
                ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.35, 0, Math.PI * 2); ctx.fill();
            });
            ctx.restore();

            // aeration tube
            ctx.strokeStyle = 'rgba(203,213,225,0.9)'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(L - 26, top - 30);
            ctx.bezierCurveTo(L - 16, top + 10, x - 20, top + 40, x - 16, bot - 22);
            ctx.stroke();
            G.text(ctx, warm ? 'O₂/CO₂' : 'O₂', L - 40, top - 34, { size: 9, weight: 800, color: '#bae6fd', shadow: true });

            G.glass(ctx, L, top, w, bot - top, { r: 8, tint: 'rgba(255,255,255,0.02)' });

            G.metal(ctx, x - 6, bot - 2, 12, 16, { tone: 'steel', r: 2 });
            G.knob(ctx, x + 14, bot + 6, 7, this.busy ? performance.now() / 180 : 0.6);
            G.text(ctx, '20 mL', L - 4, bot + 26, { size: 9, weight: 700, color: '#e2e8f0', shadow: true });

            if (warm) G.lcd(ctx, x - 70, bot + 14, 52, 22, this.R.tempC.toFixed(1) + '°', { color: '#fb923c', label: 'BATH' });
            ctx.restore();
        }

        /** threads + the subclass's muscle belly */
        _tissueBlock(ctx, surface) {
            const x = BATH.x;
            const hookY = BATH.bot - 22;
            const pen = this.penValue;
            const shorten = pen * PX_MM / MAG;
            const len = M.clamp(this.R.restLen - shorten, 26, this.R.restLen + 26);
            const topY = hookY - len;
            const w = 13 * (1 + M.clamp(shorten / this.R.restLen, -0.35, 0.9) * 0.85);

            ctx.save();
            ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x, hookY); ctx.lineTo(x, hookY + 14); ctx.stroke();
            G.metal(ctx, x - 2.5, hookY + 12, 5, 12, { tone: 'chrome', r: 1, stroke: false });

            this.drawTissue(ctx, { x, topY, hookY, len, w, surface });

            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(x, topY); ctx.lineTo(x, Math.min(surface, topY) - 2); ctx.stroke();
            ctx.restore();
        }

        /* --- frontal writing lever --- */
        _lever(ctx) {
            const rise = this.penValue * PX_MM;
            const pX = LEVER.px, pY = LEVER.py;
            const tipX = LEVER.stylusX, tipY = pY - rise;
            const thX = LEVER.threadX, thY = pY - rise / MAG;
            const ang = Math.atan2(pY - tipY, pX - tipX);

            ctx.save();
            G.metal(ctx, pX - 7, pY + 6, 14, BENCH - pY - 6, { tone: 'steel', r: 3 });
            G.metal(ctx, pX - 20, pY - 10, 40, 20, { tone: 'dark', r: 4 });

            ctx.save();
            ctx.translate(pX, pY);
            ctx.rotate(-ang);
            const longArm = pX - tipX;
            G.metal(ctx, -longArm, -3, longArm + 46, 6, { tone: 'chrome', r: 2, stroke: false });
            G.metal(ctx, 30, -8, 16, 16, { tone: 'brass', r: 2 });
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(-longArm, -3); ctx.lineTo(-longArm - 12, 0); ctx.lineTo(-longArm, 3);
            ctx.closePath(); ctx.fill();
            ctx.restore();

            G.metal(ctx, pX - 5, pY - 6, 10, 12, { tone: 'dark', r: 2 });
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.arc(pX, pY, 3.4, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.stroke();

            const hookY = BATH.bot - 22;
            const topY = hookY - M.clamp(this.R.restLen - this.penValue * PX_MM / MAG, 26, this.R.restLen + 26);
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.3;
            ctx.beginPath(); ctx.moveTo(thX, thY); ctx.lineTo(thX, topY); ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath(); ctx.arc(thX, thY, 2.6, 0, Math.PI * 2); ctx.fill();

            if (Math.abs(this.penValue) > 0.4) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath(); ctx.arc(tipX - 12, tipY, 2.4, 0, Math.PI * 2); ctx.fill();
            }

            G.text(ctx, 'FRONTAL WRITING LEVER · ×' + MAG.toFixed(0), (tipX + pX) / 2, pY - rise - 16,
                { size: 9, align: 'center', weight: 800, color: 'rgba(226,232,240,0.85)', shadow: true });
            ctx.restore();
        }

        /* --- reagent rack + micropipette --- */
        _rack(ctx) {
            const list = this.cfg.treatments;
            const x0 = 396, gap = 46;
            ctx.save();
            G.shadow(ctx, x0 + (list.length - 1) * gap / 2, 528, 150, 9, 0.4);
            G.metal(ctx, x0 - 28, 506, (list.length - 1) * gap + 56, 22, { tone: 'dark', r: 5 });
            list.forEach((t, i) => {
                const vx = x0 + i * gap;
                const sel = this.drug && this.drug.id === t.id;
                const hov = Math.abs(this.ptr.x - vx) < 20 && this.ptr.y > 470 && this.ptr.y < 532;
                G.vial(ctx, vx, 512 - (sel || hov ? 4 : 0), { color: t.color, label: t.short, h: 46, w: 21, fill: 0.72 });
                if (sel) {
                    ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 1.6;
                    G.rr(ctx, vx - 14, 458, 28, 58, 5); ctx.stroke();
                }
            });
            if (!this.dragTool) {
                const t = this.tools[0];
                const hov = Math.abs(this.ptr.x - t.x) < 52 && Math.abs(this.ptr.y - t.y) < 34;
                this._pipette(ctx, t.x, t.y - (hov ? 4 : 0), 0);
                G.text(ctx, hov ? 'Drag into the organ bath' : t.label, t.x, 532,
                    { size: 9.5, align: 'center', weight: 700, color: '#e2e8f0', shadow: true });
            }
            ctx.restore();
        }

        _pipette(ctx, x, y, rot) {
            const c = this.drug ? this.drug.color : '#94a3b8';
            ctx.save();
            ctx.translate(x, y); ctx.rotate(rot);
            G.metal(ctx, -9, -34, 18, 30, { tone: 'dark', r: 5 });
            ctx.fillStyle = '#334155'; G.rr(ctx, -7, -40, 14, 8, 3); ctx.fill();
            G.glass(ctx, -6, -6, 12, 26, { r: 3, tint: 'rgba(230,240,250,0.3)' });
            ctx.fillStyle = G.hexA(c, 0.8);
            ctx.fillRect(-4, 4, 8, 14);
            ctx.fillStyle = G.hexA(c, 0.9);
            ctx.beginPath(); ctx.moveTo(-4, 18); ctx.lineTo(4, 18); ctx.lineTo(1, 32); ctx.lineTo(-1, 32); ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        /* ---------------- pointer plumbing ---------------- */
        _toolAt(x, y) { return this.tools.find(t => Math.abs(x - t.x) < 52 && Math.abs(y - t.y) < 34); }
        _vialAt(x, y) {
            if (y < 470 || y > 532) return null;
            const list = this.cfg.treatments;
            const i = Math.round((x - 396) / 46);
            if (i < 0 || i >= list.length) return null;
            return Math.abs(x - (396 + i * 46)) < 20 ? list[i] : null;
        }
        cursorAt(x, y) { return !this.busy && (!!this._toolAt(x, y) || !!this._vialAt(x, y)); }

        onPointerDown(x, y) {
            if (this.busy) return;
            const v = this._vialAt(x, y);
            if (v) return this.select(v.id);
            const t = this._toolAt(x, y);
            if (t) this.dragTool = { t, x, y };
        }
        onPointerMove(x, y) { if (this.dragTool) { this.dragTool.x = x; this.dragTool.y = y; } }
        onPointerUp(x, y) {
            if (!this.dragTool) return;
            this.dragTool = null;
            const overBath = Math.abs(x - BATH.x) < 62 && y > BATH.top - 50 && y < BATH.bot;
            if (!overBath) return this.toast('Drop the micropipette into the mouth of the organ bath.', 'warn');
            this.pipetteDropped();
        }

        /** subclass decides what a pipette drop means */
        pipetteDropped() {}
    }

    /* ---------------- shared tissue painters ----------------
     * Each takes the geometry the rig computes: { x, topY, hookY, len, w }.
     * A subclass's drawTissue() normally just delegates to one of these.
     */
    LAB.TISSUE = {
        /** striated skeletal strip, segmented by myotome inscriptions — frog rectus */
        rectus(ctx, o) {
            const { x, topY, hookY, len, w } = o;
            const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
            g.addColorStop(0, '#8d4f4b'); g.addColorStop(0.3, '#c98a86');
            g.addColorStop(0.5, '#dba9a3'); g.addColorStop(0.8, '#b06e69'); g.addColorStop(1, '#7c423f');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - w * 0.45, topY);
            ctx.bezierCurveTo(x - w, topY + len * 0.3, x - w, hookY - len * 0.3, x - w * 0.45, hookY);
            ctx.lineTo(x + w * 0.45, hookY);
            ctx.bezierCurveTo(x + w, hookY - len * 0.3, x + w, topY + len * 0.3, x + w * 0.45, topY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(90,40,38,0.5)'; ctx.lineWidth = 0.8; ctx.stroke();

            ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.1;
            for (let i = 1; i < 5; i++) {
                const yy = topY + len * (i / 5);
                ctx.beginPath();
                ctx.moveTo(x - w * 0.8, yy);
                ctx.quadraticCurveTo(x, yy + 2.5, x + w * 0.8, yy);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(120,50,48,0.28)'; ctx.lineWidth = 0.6;
            for (let i = -2; i <= 2; i++) {
                const fx = x + i * w * 0.3;
                ctx.beginPath(); ctx.moveTo(fx, topY + 3); ctx.lineTo(fx, hookY - 3); ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath(); ctx.ellipse(x - w * 0.35, topY + len * 0.35, w * 0.14, len * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        },

        /** intestinal segment with circular constrictions and a mesenteric border.
         *  pale: true for guinea pig ileum, which is thinner and paler than rabbit. */
        ileum(ctx, o, pale) {
            const { x, topY, hookY, len, w } = o;
            const ww = pale ? w * 0.86 : w;
            const g = ctx.createLinearGradient(x - ww, 0, x + ww, 0);
            if (pale) {
                g.addColorStop(0, '#a8958c'); g.addColorStop(0.28, '#e3cfc4');
                g.addColorStop(0.5, '#f5e6dc'); g.addColorStop(0.78, '#d5bcae'); g.addColorStop(1, '#9b857b');
            } else {
                g.addColorStop(0, '#9a8079'); g.addColorStop(0.28, '#d9bdb2');
                g.addColorStop(0.5, '#eed6cb'); g.addColorStop(0.78, '#c7a79b'); g.addColorStop(1, '#8c7269');
            }
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - ww * 0.6, topY);
            ctx.bezierCurveTo(x - ww, topY + len * 0.25, x - ww, hookY - len * 0.25, x - ww * 0.6, hookY);
            ctx.lineTo(x + ww * 0.6, hookY);
            ctx.bezierCurveTo(x + ww, hookY - len * 0.25, x + ww, topY + len * 0.25, x + ww * 0.6, topY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(110,80,70,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();

            ctx.strokeStyle = 'rgba(130,95,85,0.3)'; ctx.lineWidth = 1.1;
            for (let i = 1; i < 6; i++) {
                const yy = topY + len * (i / 6);
                ctx.beginPath();
                ctx.moveTo(x - ww * 0.82, yy);
                ctx.quadraticCurveTo(x, yy + 3, x + ww * 0.82, yy);
                ctx.stroke();
            }
            ctx.strokeStyle = 'rgba(190,120,120,0.5)'; ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x + ww * 0.5, topY + 4);
            ctx.bezierCurveTo(x + ww * 0.78, topY + len * 0.35, x + ww * 0.72, hookY - len * 0.3, x + ww * 0.5, hookY - 4);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.32)';
            ctx.beginPath(); ctx.ellipse(x - ww * 0.32, topY + len * 0.4, ww * 0.15, len * 0.26, 0, 0, Math.PI * 2); ctx.fill();
        },

        /** oestrogenised uterine horn — plump, smooth, translucent, no mesentery */
        uterus(ctx, o) {
            const { x, topY, hookY, len, w } = o;
            const ww = w * 1.05;
            const g = ctx.createLinearGradient(x - ww, 0, x + ww, 0);
            g.addColorStop(0, '#a8737a'); g.addColorStop(0.26, '#e0a8ae');
            g.addColorStop(0.5, '#f3cbd0'); g.addColorStop(0.76, '#d095a0'); g.addColorStop(1, '#96646d');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(x - ww * 0.4, topY);
            ctx.bezierCurveTo(x - ww, topY + len * 0.22, x - ww, hookY - len * 0.22, x - ww * 0.4, hookY);
            ctx.lineTo(x + ww * 0.4, hookY);
            ctx.bezierCurveTo(x + ww, hookY - len * 0.22, x + ww, topY + len * 0.22, x + ww * 0.4, topY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(130,80,88,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();

            // longitudinal myometrial fibres
            ctx.strokeStyle = 'rgba(165,105,115,0.26)'; ctx.lineWidth = 0.7;
            for (let i = -2; i <= 2; i++) {
                const fx = x + i * ww * 0.26;
                ctx.beginPath();
                ctx.moveTo(fx, topY + 4);
                ctx.quadraticCurveTo(fx + ww * 0.08, topY + len * 0.5, fx, hookY - 4);
                ctx.stroke();
            }
            // fine vasculature over the serosa
            ctx.strokeStyle = 'rgba(200,110,120,0.4)'; ctx.lineWidth = 0.9;
            for (let i = 0; i < 3; i++) {
                const yy = topY + len * (0.2 + i * 0.28);
                ctx.beginPath();
                ctx.moveTo(x - ww * 0.5, yy);
                ctx.quadraticCurveTo(x, yy + 5, x + ww * 0.45, yy - 3);
                ctx.stroke();
            }
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath(); ctx.ellipse(x - ww * 0.3, topY + len * 0.38, ww * 0.16, len * 0.28, 0, 0, Math.PI * 2); ctx.fill();
        }
    };

    LAB.OrganBath = OrganBath;
})();
