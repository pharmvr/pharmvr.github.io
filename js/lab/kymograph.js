/**
 * PharmVR 2D — smoked-drum kymograph
 *
 * A rotating cylinder of smoked paper with one or more styli writing on it.
 * The trace is wrapped onto the visible face: a sample written at drum rotation
 * φ sits at screen angle STYLUS_A − (φ_now − φ), so the newest point is at the
 * right of the face and older trace drifts left as the drum turns. Only the
 * front half is drawn, and history is capped at exactly one visible face so the
 * trace never wraps round and overwrites itself.
 *
 * Supports several channels (e.g. cardiac force plus coronary outflow), each
 * with its own baseline, scale and colour.
 *
 *   const k = new LAB.Kymograph({ cx, top, bot, r, benchY,
 *                                 channels: [{ baseline, px, color }] });
 *   k.update(dt, value)        // or k.update(dt, [v1, v2])
 *   k.mark('ACh 10', '#0d9488')
 *   k.draw(ctx)
 */
(function () {
    const { M, G } = LAB;

    const STYLUS_A = 78 * Math.PI / 180;        // where a stylus meets the drum
    const DEFAULT_SPEED = 6 * Math.PI / 180;    // one visible face ≈ 28 s
    const HISTORY = STYLUS_A + Math.PI / 2;     // keep exactly one face

    class Kymograph {
        constructor(o = {}) {
            this.cx = o.cx !== undefined ? o.cx : 320;
            this.top = o.top !== undefined ? o.top : 36;
            this.bot = o.bot !== undefined ? o.bot : 268;
            this.r = o.r !== undefined ? o.r : 108;
            this.benchY = o.benchY !== undefined ? o.benchY : 452;
            this.speed = o.speed !== undefined ? o.speed : DEFAULT_SPEED;
            this.label = o.label || 'SMOKED DRUM';
            this.channels = o.channels || [{ baseline: 230, px: 3, color: '#f8fafc' }];
            this.showTicks = o.showTicks !== false;
            this.reset();
        }

        reset() {
            this.trace = [];
            this.marks = [];
            this.ticks = [];
            this.rot = 0;
            this._sampleT = 0;
            this._tickT = 0;
        }

        /** x on screen where the stylus touches the drum */
        get stylusX() { return this.cx + Math.sin(STYLUS_A) * this.r; }

        /** advance the drum and lay down one sample per channel */
        update(dt, values) {
            this.rot += this.speed * dt;
            const v = Array.isArray(values) ? values.slice() : [values];
            this._sampleT += dt;
            if (this._sampleT >= 0.045) {
                this._sampleT = 0;
                this.trace.push({ a: this.rot, v });
            }
            while (this.trace.length && this.rot - this.trace[0].a > HISTORY) this.trace.shift();
            while (this.marks.length && this.rot - this.marks[0].a > HISTORY) this.marks.shift();

            if (this.showTicks) {
                this._tickT += dt;
                if (this._tickT >= 10) { this._tickT = 0; this.ticks.push({ a: this.rot }); }
                while (this.ticks.length && this.rot - this.ticks[0].a > HISTORY) this.ticks.shift();
            }
        }

        /** signal mark along the foot of the drum, as a drug is added */
        mark(label, color) { this.marks.push({ a: this.rot, label, color: color || '#f8fafc' }); }

        _onFace(a) { return Math.cos(a) > 0.045; }
        _sx(a) { return this.cx + Math.sin(a) * this.r; }

        /* ---------------- drawing ---------------- */
        draw(ctx) {
            const { cx, top, bot, r } = this;
            const ry = r * 0.17;
            ctx.save();

            // base box + clockwork pillar
            G.shadow(ctx, cx, this.benchY + 2, 96, 11, 0.45);
            G.metal(ctx, cx - 74, this.benchY - 30, 148, 32, { tone: 'dark', r: 5 });
            G.metal(ctx, cx - 13, bot - 8, 26, this.benchY - bot - 22, { tone: 'steel', r: 3 });
            G.led(ctx, cx + 50, this.benchY - 14, 3.2, '#22c55e', true);
            G.text(ctx, 'KYMOGRAPH', cx - 56, this.benchY - 10, { size: 8.5, weight: 800, color: 'rgba(226,232,240,0.8)' });
            for (let i = 0; i < 3; i++) G.screw(ctx, cx - 60 + i * 60, this.benchY - 24, 2.4);

            // smoked paper on a brass cylinder
            const bg = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
            bg.addColorStop(0, '#07070a'); bg.addColorStop(0.16, '#17171c');
            bg.addColorStop(0.42, '#26262c'); bg.addColorStop(0.7, '#15151a');
            bg.addColorStop(1, '#050507');
            ctx.fillStyle = bg;
            ctx.fillRect(cx - r, top, r * 2, bot - top);

            ctx.save();
            ctx.beginPath(); ctx.rect(cx - r, top, r * 2, bot - top); ctx.clip();
            ctx.globalAlpha = 0.06;
            for (let i = 0; i < 160; i++) {
                const gx = cx - r + (i * 53) % (r * 2);
                const gy = top + (i * 97) % (bot - top);
                ctx.fillStyle = i % 2 ? '#ffffff' : '#000000';
                ctx.fillRect(gx, gy, 2, 1);
            }
            ctx.globalAlpha = 1;
            this.drawTrace(ctx);
            ctx.restore();

            // brass rims + spindle
            [top, bot].forEach((yy, k) => {
                const g2 = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
                g2.addColorStop(0, '#5e4a16'); g2.addColorStop(0.3, '#d9b64b');
                g2.addColorStop(0.55, '#f4e3a4'); g2.addColorStop(1, '#4a3a10');
                ctx.fillStyle = g2;
                ctx.beginPath(); ctx.ellipse(cx, yy, r, ry, 0, 0, Math.PI * 2); ctx.fill();
                if (k === 0) {
                    ctx.fillStyle = 'rgba(8,8,10,0.92)';
                    ctx.beginPath(); ctx.ellipse(cx, yy, r * 0.82, ry * 0.8, 0, 0, Math.PI * 2); ctx.fill();
                    G.metal(ctx, cx - 4, top - 26, 8, 30, { tone: 'chrome', r: 2 });
                    ctx.fillStyle = '#b45309';
                    ctx.beginPath(); ctx.ellipse(cx, top - 26, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
                }
                ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();
            });

            G.text(ctx, `${this.label} · ${(this.speed * 180 / Math.PI).toFixed(0)}°/s`, cx, bot + 24,
                { size: 9.5, align: 'center', weight: 800, color: '#e2e8f0', shadow: true });
            ctx.restore();
        }

        /** the traces themselves — call inside a clip of the drum face */
        drawTrace(ctx) {
            const { cx, bot, r } = this;

            // baselines
            this.channels.forEach(ch => {
                ctx.strokeStyle = 'rgba(255,255,255,0.16)';
                ctx.lineWidth = 0.8;
                ctx.beginPath(); ctx.moveTo(cx - r, ch.baseline); ctx.lineTo(cx + r, ch.baseline); ctx.stroke();
            });

            // 10 s time markers along the foot
            if (this.showTicks) {
                const footY = bot - 16;
                ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(cx - r, footY); ctx.lineTo(cx + r, footY); ctx.stroke();
                this.ticks.forEach(t => {
                    const a = STYLUS_A - (this.rot - t.a);
                    if (!this._onFace(a)) return;
                    const x = this._sx(a);
                    ctx.beginPath(); ctx.moveTo(x, footY); ctx.lineTo(x, footY - 6); ctx.stroke();
                });
            }

            // drug-addition signal marks
            this.marks.forEach(m => {
                const a = STYLUS_A - (this.rot - m.a);
                if (!this._onFace(a)) return;
                const x = this._sx(a);
                ctx.strokeStyle = m.color; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.moveTo(x, bot - 30); ctx.lineTo(x, bot - 46); ctx.stroke();
                ctx.save();
                ctx.translate(x, bot - 50); ctx.rotate(-Math.PI / 2);
                G.text(ctx, m.label, 0, 3.5, { size: 8.5, weight: 700, color: m.color });
                ctx.restore();
            });

            // one polyline per channel
            this.channels.forEach((ch, ci) => {
                ctx.strokeStyle = ch.color || '#f8fafc';
                ctx.lineWidth = ch.width || 1.7;
                ctx.lineJoin = 'round'; ctx.lineCap = 'round';
                ctx.shadowColor = 'rgba(255,255,255,0.3)'; ctx.shadowBlur = 3;
                ctx.beginPath();
                let pen = false;
                for (const s of this.trace) {
                    const val = s.v[ci];
                    if (val === undefined) { pen = false; continue; }
                    const a = STYLUS_A - (this.rot - s.a);
                    if (!this._onFace(a)) { pen = false; continue; }
                    const x = this._sx(a), y = ch.baseline - val * ch.px;
                    if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
                }
                ctx.stroke();
                ctx.shadowBlur = 0;
            });
        }
    }

    Kymograph.STYLUS_A = STYLUS_A;
    LAB.Kymograph = Kymograph;
})();
