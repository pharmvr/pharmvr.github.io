/**
 * PharmVR 2D — amphibian heart rig
 *
 * Shared apparatus for the isolated frog heart experiments (exps 12 and 20):
 * a cannula clamped to a stand, the heart suspended from it, a light heart
 * lever taking a thread from the ventricular apex, and the smoked drum.
 *
 * The heart beats on a cardiac cycle the subclass modulates through two
 * variables — RATE (beats/min) and FORCE (mm of lever excursion) — plus an
 * ARREST state, because the classical ion effects stop the heart in a
 * particular phase: calcium in systole, potassium in diastole.
 *
 *   rig()          -> { perfused }   perfused adds a reservoir and drop counter
 *   drugEffect(d, dose) -> { rate, force, flow, arrest }  multipliers / state
 *
 * Lifecycle, as with OrganBath: initHeart() from setup(), resetHeart() from
 * resetAnimal(), updateHeart(dt) from update(dt), drawHeart(ctx) from draw(ctx).
 */
(function () {
    const { M, G } = LAB;

    const BENCH = 452;
    const DRUM = { cx: 346, top: 30, bot: 380, r: 108 };
    const LEVER = { px: 762, py: 360, threadX: 700, stylusX: 452 };
    const MAG = (LEVER.px - LEVER.stylusX) / (LEVER.px - LEVER.threadX);   // ×5
    const PX_MM = 3.0;
    const CAN = { x: 727, w: 26, top: 86, bot: 236 };      // cannula tube
    const HEART = { cx: 716, cy: 272, apex: 322 };
    const FLOW_PX = 2.4;                                    // drum px per drop/min

    LAB.HEART_RIG = { BENCH, DRUM, LEVER, MAG, PX_MM, CAN, HEART };

    /** asymmetric cardiac pulse: fast systolic upstroke, slower diastolic fall */
    function beatWave(p) {
        if (p < 0.12) return LAB.ease.out(p / 0.12);
        if (p < 0.32) return 1;
        const d = (p - 0.32) / 0.34;
        return d >= 1 ? 0 : 1 - LAB.ease.inOut(d);
    }

    class HeartRig extends LAB.LabEngine {
        /* ---------------- subclass hooks ---------------- */
        rig() { return {}; }
        drugEffect() { return {}; }

        /* ---------------- lifecycle ---------------- */
        initHeart() {
            this.R = Object.assign({ perfused: false, baseRate: 40, baseForce: 40, baseFlow: 22 }, this.rig());
            // the perfused rig writes two traces, so the force channel is scaled
            // down to leave a clear band at the top of the drum for outflow
            this.forcePx = this.R.perfused ? 2.0 : PX_MM;
            const channels = [{ baseline: LEVER.py, px: this.forcePx, color: '#f8fafc', width: 1.7 }];
            if (this.R.perfused) {
                channels.push({ baseline: 174, px: FLOW_PX, color: '#7dd3fc', width: 1.4 });
            }
            this.kymo = new LAB.Kymograph({
                cx: DRUM.cx, top: DRUM.top, bot: DRUM.bot, r: DRUM.r, benchY: BENCH, channels
            });
            this.hotspots = [
                { x: CAN.x - 20, y: CAN.top, w: 66, h: CAN.bot - CAN.top, label: this.R.perfused ? 'Perfusion cannula' : 'Straub cannula — Ringer column' },
                { x: HEART.cx - 44, y: HEART.cy - 52, w: 88, h: 110, label: 'Frog heart — two atria, single ventricle' },
                { x: DRUM.cx - DRUM.r, y: DRUM.top, w: DRUM.r * 2, h: 60, label: 'Smoked drum kymograph' },
                { x: 500, y: LEVER.py - 24, w: 220, h: 32, label: 'Heart lever — ×' + MAG.toFixed(0) }
            ];
            this.resetHeart();
        }

        resetHeart() {
            this.rate = this.R.baseRate;
            this.rateTarget = this.R.baseRate;
            this.force = this.R.baseForce;
            this.forceTarget = this.R.baseForce;
            this.flow = this.R.baseFlow;
            this.flowTarget = this.R.baseFlow;
            this.beatPhase = 0;
            this.beats = 0;
            this.arrest = null;
            this.mod = null;
            this.tint = null;
            this.drops = [];
            this.dropT = 0;
            this.vigour = 1;
            if (this.kymo) this.kymo.reset();
        }

        /** what the stylus traces: 0 in diastole, `force` at the peak of systole */
        get penValue() {
            if (this.arrest === 'systole') return this.force;
            if (this.arrest === 'diastole') return 0;
            return this.force * beatWave(this.beatPhase);
        }

        get apexLift() { return this.penValue * this.forcePx / MAG; }

        /* ---------------- applying a drug ---------------- */
        markAddition(d, dose) {
            this.kymo.mark(`${d.short} ${dose}`, d.color);
            this.tint = { color: d.color, a: 0.3 };
            this.floatText(CAN.x + CAN.w / 2, CAN.top - 12, `${d.short} ${dose} ${d.unit}`, d.color);
        }

        /** replace the fluid in the cannula and let the heart recover */
        washHeart(done) {
            this.busy = true;
            this.arrest = null;
            this.rateTarget = this.R.baseRate * this.vigour;
            this.forceTarget = this.R.baseForce * this.vigour;
            this.flowTarget = this.R.baseFlow * this.vigour;
            let n = 0;
            const cycle = () => {
                n++;
                this.tw.add(0.4, e => { if (this.tint) this.tint.a = 0.3 * (1 - e) * (1 - (n - 1) / 3); }, {
                    onDone: () => {
                        if (n < 3) return cycle();
                        this.tint = null;
                        this.busy = false;
                        this.toast('Cannula flushed with fresh frog Ringer.', 'success');
                        if (done) done();
                    }
                });
            };
            cycle();
        }

        /* ---------------- per-frame ---------------- */
        updateHeart(dt) {
            this.rate = M.approach(this.rate, this.rateTarget, 1.1, dt);
            this.force = M.approach(this.force, this.forceTarget, 1.2, dt);
            this.flow = M.approach(this.flow, this.flowTarget, 1.0, dt);

            if (!this.arrest) {
                const prev = this.beatPhase;
                this.beatPhase += dt * Math.max(0, this.rate) / 60;
                while (this.beatPhase >= 1) { this.beatPhase -= 1; this.beats++; }
                if (prev > this.beatPhase) this.onBeat && this.onBeat();
            }

            this.kymo.update(dt, this.R.perfused ? [this.penValue, this.flow] : this.penValue);

            // coronary effluent dripping into the counter
            if (this.R.perfused) {
                this.dropT += dt * Math.max(0, this.flow) / 60;
                if (this.dropT >= 1) {
                    this.dropT -= 1;
                    this.drops.push({ y: 300, v: 0 });
                }
                for (let i = this.drops.length - 1; i >= 0; i--) {
                    const d = this.drops[i];
                    d.v += 420 * dt;
                    d.y += d.v * dt;
                    if (d.y > 392) this.drops.splice(i, 1);
                }
            }
        }

        /* ---------------- drawing ---------------- */
        drawHeart(ctx) {
            this.kymo.draw(ctx);
            if (this.R.perfused) this._reservoir(ctx);
            this._stand(ctx);
            this._cannula(ctx);
            this._heart(ctx);
            this._lever(ctx);
            if (this.R.perfused) this._dropCounter(ctx);
            this._rack(ctx);
            this.drawReadout(ctx);
        }

        _stand(ctx) {
            ctx.save();
            G.shadow(ctx, 822, BENCH + 2, 70, 9, 0.45);
            G.metal(ctx, 772, BENCH - 10, 100, 14, { tone: 'dark', r: 4 });
            G.metal(ctx, 816, 96, 12, BENCH - 106, { tone: 'steel', r: 3 });
            // boss head clamping the cannula
            G.metal(ctx, CAN.x + CAN.w - 2, 128, 36, 16, { tone: 'dark', r: 3 });
            G.metal(ctx, CAN.x + CAN.w - 2, 198, 36, 16, { tone: 'dark', r: 3 });
            G.screw(ctx, CAN.x + CAN.w + 26, 136, 3);
            G.screw(ctx, CAN.x + CAN.w + 26, 206, 3);
            ctx.restore();
        }

        _cannula(ctx) {
            const L = CAN.x, w = CAN.w;
            ctx.save();
            // Ringer column, tinted when a drug is in it
            ctx.save();
            G.rr(ctx, L, CAN.top, w, CAN.bot - CAN.top, 4); ctx.clip();
            const fg = ctx.createLinearGradient(L, 0, L + w, 0);
            fg.addColorStop(0, 'rgba(165,215,240,0.6)');
            fg.addColorStop(0.35, 'rgba(214,240,253,0.45)');
            fg.addColorStop(1, 'rgba(140,190,220,0.65)');
            ctx.fillStyle = fg;
            ctx.fillRect(L, CAN.top + 14, w, CAN.bot - CAN.top - 14);
            if (this.tint) {
                ctx.fillStyle = G.hexA(this.tint.color, this.tint.a);
                ctx.fillRect(L, CAN.top + 14, w, CAN.bot - CAN.top - 14);
            }
            // the fluid column rises and falls a little with each beat
            const men = CAN.top + 14 - this.penValue * 0.12;
            ctx.fillStyle = 'rgba(255,255,255,0.65)';
            ctx.fillRect(L, men, w, 2.5);
            ctx.restore();

            G.glass(ctx, L, CAN.top, w, CAN.bot - CAN.top, { r: 4, tint: 'rgba(255,255,255,0.03)' });
            // graduations
            ctx.strokeStyle = 'rgba(30,41,59,0.55)'; ctx.lineWidth = 0.8;
            for (let i = 1; i < 8; i++) {
                const y = CAN.top + 18 + i * 14;
                ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(L + (i % 2 ? 5 : 8), y); ctx.stroke();
            }
            // flared mouth for adding drugs
            ctx.fillStyle = 'rgba(226,240,250,0.5)';
            ctx.beginPath();
            ctx.moveTo(L - 7, CAN.top - 10); ctx.lineTo(L + w + 7, CAN.top - 10);
            ctx.lineTo(L + w, CAN.top + 3); ctx.lineTo(L, CAN.top + 3); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = 'rgba(226,240,250,0.8)'; ctx.lineWidth = 1.2; ctx.stroke();
            G.text(ctx, this.R.perfused ? 'PERFUSION CANNULA' : 'STRAUB CANNULA', L + w / 2, CAN.top - 18,
                { size: 8.5, align: 'center', weight: 800, color: 'rgba(226,232,240,0.8)', shadow: true });
            ctx.restore();
        }

        /** frog heart: sinus venosus, paired atria, single conical ventricle */
        _heart(ctx) {
            const c = beatWave(this.beatPhase);
            const vc = this.arrest === 'systole' ? 1 : (this.arrest === 'diastole' ? 0 : c);
            const ac = this.arrest ? (this.arrest === 'systole' ? 0.6 : 0) : beatWave((this.beatPhase + 0.82) % 1);
            const apexY = HEART.apex - this.apexLift;
            const cx = HEART.cx, cy = HEART.cy;

            ctx.save();
            // bulbus arteriosus running up into the cannula
            ctx.strokeStyle = '#c98f84'; ctx.lineWidth = 11; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(cx + 10, cy - 24); ctx.lineTo(CAN.x + CAN.w / 2, CAN.bot - 2); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.moveTo(cx + 8, cy - 26); ctx.lineTo(CAN.x + CAN.w / 2 - 2, CAN.bot - 4); ctx.stroke();

            // sinus venosus behind the atria
            ctx.fillStyle = '#9b6f72';
            ctx.beginPath(); ctx.ellipse(cx - 4, cy - 34, 18, 11, -0.2, 0, Math.PI * 2); ctx.fill();

            // atria — contract just before the ventricle
            [[-16, -0.35], [14, 0.3]].forEach(([dx, rot]) => {
                ctx.save();
                ctx.translate(cx + dx, cy - 24);
                ctx.rotate(rot);
                ctx.scale(1 - ac * 0.16, 1 - ac * 0.12);
                const ag = ctx.createRadialGradient(-3, -4, 2, 0, 0, 18);
                ag.addColorStop(0, '#e6a8a2'); ag.addColorStop(0.6, '#c57f7c'); ag.addColorStop(1, '#9c5d5c');
                ctx.fillStyle = ag;
                ctx.beginPath(); ctx.ellipse(0, 0, 15, 13, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = 'rgba(120,60,60,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();
                ctx.restore();
            });

            // ventricle — a cone from the base down to the apex
            const half = 30 * (1 - vc * 0.2);
            const baseY = cy - 10;
            const vg = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
            const deep = vc;   // contracted muscle looks paler and firmer
            vg.addColorStop(0, G.mix('#8c4b4a', '#b06a66', deep * 0.5));
            vg.addColorStop(0.32, G.mix('#c87f78', '#dba49c', deep * 0.5));
            vg.addColorStop(0.52, G.mix('#dda7a0', '#eec5bd', deep * 0.5));
            vg.addColorStop(0.8, G.mix('#b06d68', '#c58d86', deep * 0.5));
            vg.addColorStop(1, G.mix('#7d4140', '#9a5c58', deep * 0.5));
            ctx.fillStyle = vg;
            ctx.beginPath();
            ctx.moveTo(cx - half, baseY);
            ctx.bezierCurveTo(cx - half - 4, baseY + (apexY - baseY) * 0.45,
                cx - half * 0.5, apexY - 16, cx - 2, apexY);
            ctx.bezierCurveTo(cx + half * 0.55, apexY - 16,
                cx + half + 4, baseY + (apexY - baseY) * 0.45, cx + half, baseY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(110,55,55,0.5)'; ctx.lineWidth = 0.9; ctx.stroke();

            // coronary vessels over the ventricle
            ctx.strokeStyle = 'rgba(150,40,50,0.4)'; ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(cx - 8, baseY + 4);
            ctx.bezierCurveTo(cx - 16, baseY + 24, cx - 8, apexY - 26, cx - 3, apexY - 10);
            ctx.stroke();
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(cx + 9, baseY + 6);
            ctx.bezierCurveTo(cx + 18, baseY + 26, cx + 10, apexY - 28, cx + 4, apexY - 14);
            ctx.stroke();

            // wet highlight
            ctx.fillStyle = 'rgba(255,255,255,0.33)';
            ctx.beginPath();
            ctx.ellipse(cx - half * 0.34, baseY + (apexY - baseY) * 0.34, half * 0.18, (apexY - baseY) * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();

            // thread from the apex down to the lever
            ctx.strokeStyle = '#f1f5f9'; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(cx - 2, apexY); ctx.lineTo(LEVER.threadX, LEVER.py - this.apexLift); ctx.stroke();
            // small clip on the apex
            G.metal(ctx, cx - 5, apexY - 1, 7, 5, { tone: 'chrome', r: 1, stroke: false });
            ctx.restore();
        }

        _lever(ctx) {
            const rise = this.penValue * this.forcePx;
            const pX = LEVER.px, pY = LEVER.py;
            const tipX = LEVER.stylusX, tipY = pY - rise;
            const ang = Math.atan2(pY - tipY, pX - tipX);
            ctx.save();
            G.metal(ctx, pX - 7, pY + 6, 14, BENCH - pY - 6, { tone: 'steel', r: 3 });
            G.metal(ctx, pX - 20, pY - 10, 40, 20, { tone: 'dark', r: 4 });

            ctx.save();
            ctx.translate(pX, pY);
            ctx.rotate(-ang);
            const longArm = pX - tipX;
            G.metal(ctx, -longArm, -2.5, longArm + 40, 5, { tone: 'chrome', r: 2, stroke: false });
            G.metal(ctx, 26, -7, 14, 14, { tone: 'brass', r: 2 });
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(-longArm, -2.5); ctx.lineTo(-longArm - 11, 0); ctx.lineTo(-longArm, 2.5);
            ctx.closePath(); ctx.fill();
            ctx.restore();

            G.metal(ctx, pX - 5, pY - 6, 10, 12, { tone: 'dark', r: 2 });
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.arc(pX, pY, 3.2, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath(); ctx.arc(LEVER.threadX, pY - this.apexLift, 2.4, 0, Math.PI * 2); ctx.fill();

            G.text(ctx, 'HEART LEVER · ×' + MAG.toFixed(0), (tipX + pX) / 2, pY - rise - 14,
                { size: 9, align: 'center', weight: 800, color: 'rgba(226,232,240,0.85)', shadow: true });
            ctx.restore();
        }

        /* --- perfused version only --- */
        _reservoir(ctx) {
            const x = 128, y = 150;
            ctx.save();
            G.shadow(ctx, x, BENCH + 2, 56, 9, 0.42);
            G.metal(ctx, x - 5, y + 56, 10, BENCH - y - 56, { tone: 'steel', r: 2 });
            G.metal(ctx, x - 40, BENCH - 10, 80, 12, { tone: 'dark', r: 3 });
            G.glass(ctx, x - 34, y - 104, 68, 112, { r: 7 });
            ctx.fillStyle = 'rgba(186,230,253,0.55)';
            G.rr(ctx, x - 31, y - 66, 62, 72, 5); ctx.fill();
            ctx.fillStyle = 'rgba(224,242,254,0.9)';
            ctx.fillRect(x - 31, y - 68, 62, 3);
            G.text(ctx, 'FROG', x, y - 42, { size: 8.5, align: 'center', weight: 800, color: '#0c4a6e' });
            G.text(ctx, 'RINGER', x, y - 31, { size: 8.5, align: 'center', weight: 800, color: '#0c4a6e' });
            // constant-head air inlet (Mariotte bottle)
            G.metal(ctx, x - 3, y - 128, 6, 26, { tone: 'chrome', r: 2 });
            G.text(ctx, 'constant head', x, y - 134, { size: 8, align: 'center', weight: 700, color: '#94a3b8' });
            // tubing across to the cannula
            ctx.strokeStyle = 'rgba(148,163,184,0.85)'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + 24, y - 40);
            ctx.bezierCurveTo(x + 150, y - 120, CAN.x - 110, CAN.top - 96, CAN.x + 4, CAN.top - 12);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(190,225,245,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
            ctx.restore();
        }

        _dropCounter(ctx) {
            const x = 884;
            ctx.save();
            // side tube carrying coronary effluent out of the heart
            ctx.strokeStyle = 'rgba(203,213,225,0.9)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(HEART.cx + 26, HEART.cy + 10);
            ctx.bezierCurveTo(HEART.cx + 90, HEART.cy + 4, x - 24, 250, x, 292);
            ctx.stroke();
            // falling drops
            this.drops.forEach(d => {
                ctx.fillStyle = 'rgba(186,230,253,0.9)';
                ctx.beginPath(); ctx.ellipse(x, d.y, 2.6, 3.8, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.beginPath(); ctx.arc(x - 1, d.y - 1.4, 0.9, 0, Math.PI * 2); ctx.fill();
            });
            // photo-electric drop sensor
            G.metal(ctx, x - 24, 304, 14, 20, { tone: 'dark', r: 3 });
            G.metal(ctx, x + 10, 304, 14, 20, { tone: 'dark', r: 3 });
            G.led(ctx, x - 17, 314, 2.6, '#ef4444', true);
            // measuring cylinder
            G.glass(ctx, x - 20, 392, 40, 52, { r: 4 });
            ctx.fillStyle = 'rgba(186,230,253,0.55)';
            G.rr(ctx, x - 17, 416, 34, 26, 3); ctx.fill();
            ctx.strokeStyle = 'rgba(30,41,59,0.5)'; ctx.lineWidth = 0.8;
            for (let i = 1; i < 4; i++) {
                ctx.beginPath(); ctx.moveTo(x - 20, 400 + i * 11); ctx.lineTo(x - 13, 400 + i * 11); ctx.stroke();
            }
            G.text(ctx, 'CORONARY', x, 456, { size: 8, align: 'center', weight: 800, color: 'rgba(226,232,240,0.8)', shadow: true });
            G.text(ctx, 'OUTFLOW', x, 466, { size: 8, align: 'center', weight: 800, color: 'rgba(226,232,240,0.8)', shadow: true });
            ctx.restore();
        }

        /* ---------------- reagent rack + pipette ---------------- */
        _rack(ctx) {
            const list = this.cfg.treatments;
            const x0 = 56, gap = 44;
            ctx.save();
            G.shadow(ctx, x0 + (list.length - 1) * gap / 2, 528, 150, 9, 0.4);
            G.metal(ctx, x0 - 26, 506, (list.length - 1) * gap + 52, 22, { tone: 'dark', r: 5 });
            list.forEach((t, i) => {
                const vx = x0 + i * gap;
                const sel = this.drug && this.drug.id === t.id;
                const hov = Math.abs(this.ptr.x - vx) < 19 && this.ptr.y > 470 && this.ptr.y < 532;
                G.vial(ctx, vx, 512 - (sel || hov ? 4 : 0), { color: t.color, label: t.short, h: 44, w: 20, fill: 0.72 });
                if (sel) {
                    ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 1.6;
                    G.rr(ctx, vx - 13, 460, 26, 56, 5); ctx.stroke();
                }
            });
            if (!this.dragTool) {
                const hov = Math.abs(this.ptr.x - 440) < 48 && Math.abs(this.ptr.y - 500) < 32;
                this._pipette(ctx, 440, 500 - (hov ? 4 : 0), 0);
                G.text(ctx, hov ? 'Drag to the cannula mouth' : 'Micropipette', 440, 532,
                    { size: 9.5, align: 'center', weight: 700, color: '#e2e8f0', shadow: true });
            } else {
                this._pipette(ctx, this.dragTool.x, this.dragTool.y, -0.35);
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
            ctx.fillStyle = G.hexA(c, 0.8); ctx.fillRect(-4, 4, 8, 14);
            ctx.fillStyle = G.hexA(c, 0.9);
            ctx.beginPath(); ctx.moveTo(-4, 18); ctx.lineTo(4, 18); ctx.lineTo(1, 32); ctx.lineTo(-1, 32); ctx.closePath(); ctx.fill();
            ctx.restore();
        }

        _vialAt(x, y) {
            if (y < 470 || y > 532) return null;
            const list = this.cfg.treatments;
            const i = Math.round((x - 56) / 44);
            if (i < 0 || i >= list.length) return null;
            return Math.abs(x - (56 + i * 44)) < 19 ? list[i] : null;
        }
        _overPipette(x, y) { return Math.abs(x - 440) < 48 && Math.abs(y - 500) < 32; }
        cursorAt(x, y) { return !this.busy && (!!this._vialAt(x, y) || this._overPipette(x, y)); }

        onPointerDown(x, y) {
            if (this.busy) return;
            const v = this._vialAt(x, y);
            if (v) return this.select(v.id);
            if (this._overPipette(x, y)) this.dragTool = { x, y };
        }
        onPointerMove(x, y) { if (this.dragTool) { this.dragTool.x = x; this.dragTool.y = y; } }
        onPointerUp(x, y) {
            if (!this.dragTool) return;
            this.dragTool = null;
            const atMouth = Math.abs(x - (CAN.x + CAN.w / 2)) < 54 && y > CAN.top - 44 && y < CAN.bot;
            if (!atMouth) return this.toast('Drop the micropipette into the mouth of the cannula.', 'warn');
            this.pipetteDropped();
        }
        pipetteDropped() {}

        /* ---------------- shared readout panel ---------------- */
        drawReadout(ctx) {
            const x = 24, y = 398;
            ctx.save();
            ctx.fillStyle = 'rgba(8,15,26,0.72)';
            G.rr(ctx, x, y, this.R.perfused ? 300 : 206, 46, 8); ctx.fill();
            G.lcd(ctx, x + 10, y + 8, 88, 30, Math.round(this.rate) + '', { label: 'RATE / min', color: '#34f5c5', size: 15 });
            G.lcd(ctx, x + 108, y + 8, 88, 30, this.force.toFixed(0) + '', { label: 'FORCE mm', color: '#fbbf24', size: 15 });
            if (this.R.perfused) {
                G.lcd(ctx, x + 206, y + 8, 84, 30, Math.round(this.flow) + '', { label: 'DROPS / min', color: '#7dd3fc', size: 15 });
            }
            ctx.restore();
            if (this.arrest) {
                G.text(ctx, this.arrest === 'systole' ? 'ARREST IN SYSTOLE' : 'ARREST IN DIASTOLE',
                    HEART.cx, HEART.cy - 68,
                    { size: 12, align: 'center', weight: 800, color: '#fb7185', shadow: true });
            }
        }
    }

    LAB.HeartRig = HeartRig;
})();
