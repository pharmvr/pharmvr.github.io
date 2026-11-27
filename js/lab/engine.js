/**
 * PharmVR 2D — LabEngine base class
 * Shared shell for every animated experiment:
 *   left  : protocol steps, treatment groups, custom controls
 *   centre: 960×540 animated canvas stage + HUD chips + time-lapse banner + action bar
 *   right : observation table, live chart, inference
 * Sub-classes implement:  config(), setup(), update(dt), draw(ctx), and optional hooks:
 *   onSelect(tr), onInjected(tr), getInjectZone(), resetAnimal(), onPointerDown/Move/Up(x,y)
 */
(function () {
    const { M, G } = LAB;

    class LabEngine {
        constructor(expNum, mount) {
            this.expNum = expNum;
            this.mount = mount;
            this.meta = (window.EXPERIMENTS_DATA || []).find(e => e.num === expNum) || { title: 'Experiment ' + expNum };
            this.cfg = Object.assign({ steps: [], treatments: [], table: [], viva: [], chart: false, syringe: true, tray: { x: 70, y: 512 } }, this.config());
            this.W = LAB.W; this.H = LAB.H;
            this.tw = new LAB.Tweens();
            this.fx = new LAB.Particles();
            this.floats = [];
            this.simMin = 0;          // simulated experiment clock (minutes)
            this.busy = false;
            this.stepIdx = 0;
            this.rows = [];
            this.ptr = { x: -1, y: -1, down: false, over: false };
            this.drag = null;
            this.inject = null;       // active injection animation state
            this.hotspots = [];       // [{x,y,w,h,label}] hover callouts
            this.tr = this.cfg.treatments[0] || null;
            this.syringeFill = 0;     // 0 = empty syringe in tray
            this.dead = false;
            this._build();
            this.setup();
            if (this.tr) this._markTreatment();
            this._last = performance.now();
            this._loop = this._loop.bind(this);
            this._raf = requestAnimationFrame(this._loop);
        }

        /* ---------- overridable ---------- */
        config() { return {}; }
        setup() {}
        update(dt) {}
        draw(ctx) {}
        onSelect(tr) {}
        onInjected(tr) {}
        getInjectZone() { return null; }   // {x,y,r,label,angle}
        resetAnimal() {}
        drawBackground(ctx) { G.labRoom(ctx, this.W, this.H, this.cfg.room || {}); }

        /* ---------- DOM shell ---------- */
        _build() {
            const c = this.cfg;
            this.mount.innerHTML = `
            <div class="lab2">
              <aside class="lab2-col lab2-left">
                <section class="lab2-card">
                  <div class="lab2-card-h"><span>Protocol</span><span class="lab2-pill" id="l2-stepcount"></span></div>
                  <ol class="lab2-steps" id="l2-steps">${c.steps.map((s, i) => `<li data-i="${i}"><span class="lab2-stepnum">${i + 1}</span><span>${s}</span></li>`).join('')}</ol>
                </section>
                ${c.treatments.length ? `
                <section class="lab2-card">
                  <div class="lab2-card-h"><span>${c.treatmentTitle || 'Treatment groups'}</span></div>
                  <div class="lab2-tr-list" id="l2-tr">${c.treatments.map(t => `
                    <button class="lab2-tr" data-id="${t.id}">
                      <span class="lab2-tr-swatch" style="--c:${t.color}"></span>
                      <span class="lab2-tr-txt"><strong>${t.name}</strong><small>${t.cls || ''}</small></span>
                      <span class="lab2-tr-done">✓</span>
                    </button>`).join('')}
                  </div>
                </section>` : ''}
                <section class="lab2-card" id="l2-ctrl-card" style="display:none"><div id="l2-ctrl"></div></section>
                <div class="lab2-btnrow">
                  <button class="lab2-btn ghost" id="l2-reset">↺ Fresh animal</button>
                  <button class="lab2-btn ghost" id="l2-viva">🎓 Viva voce</button>
                </div>
              </aside>
              <main class="lab2-col lab2-center">
                <div class="lab2-stage" id="l2-stage">
                  <canvas id="l2-canvas"></canvas>
                  <div class="lab2-hud lab2-hud-l" id="l2-hud-l"></div>
                  <div class="lab2-hud lab2-hud-r" id="l2-hud-r"></div>
                  <div class="lab2-lapse" id="l2-lapse"><div class="lab2-lapse-t" id="l2-lapse-t"></div><div class="lab2-lapse-bar"><i id="l2-lapse-bar"></i></div></div>
                  <div class="lab2-toast" id="l2-toast"></div>
                </div>
                <div class="lab2-actionbar">
                  <div class="lab2-status" id="l2-status"></div>
                  <div class="lab2-actions" id="l2-actions"></div>
                </div>
              </main>
              <aside class="lab2-col lab2-right">
                <section class="lab2-card">
                  <div class="lab2-card-h"><span>${c.tableTitle || 'Observation table'}</span><span class="lab2-pill" id="l2-rowcount">0</span></div>
                  <div class="lab2-table-wrap"><table class="lab2-table"><thead><tr>${c.table.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody id="l2-tbody"><tr class="empty"><td colspan="${c.table.length || 1}">No readings yet</td></tr></tbody></table></div>
                </section>
                ${c.chart ? `<section class="lab2-card"><div class="lab2-card-h"><span id="l2-chart-title">${c.chartTitle || 'Live graph'}</span></div><canvas id="l2-chart"></canvas></section>` : ''}
                <section class="lab2-card">
                  <div class="lab2-card-h"><span>Inference</span></div>
                  <div class="lab2-infer" id="l2-infer">${c.inferenceHint || 'Complete the protocol to draw a pharmacological conclusion.'}</div>
                </section>
              </aside>
            </div>`;
            const $ = id => this.mount.querySelector('#' + id);
            this.$ = $;
            this.canvas = $('l2-canvas');
            const dpr = Math.min(2, window.devicePixelRatio || 1);
            this.canvas.width = this.W * dpr; this.canvas.height = this.H * dpr;
            this.ctx = this.canvas.getContext('2d');
            this.ctx.scale(dpr, dpr);
            if (c.chart) {
                this.chart = new LAB.Chart($('l2-chart'), { w: 300, h: 210 });
                this.chart.draw(Object.assign({ xMin: 0, xMax: 10, yMin: 0, yMax: 100, series: [] }, c.chartEmpty || {}));
            }

            this.mount.querySelectorAll('.lab2-tr').forEach(b => b.onclick = () => this.select(b.dataset.id));
            $('l2-reset').onclick = () => { if (this.busy) return this.toast('Wait for the current procedure to finish.', 'warn'); this.syringeFill = 0; this.resetAnimal(); };
            $('l2-viva').onclick = () => openGenericViva(this.meta.title, this.cfg.viva);
            this.ctrl = $('l2-ctrl');
            this._bindPointer();
            this.setStep(0);
        }

        /** show custom controls HTML in the left column; returns container */
        controls(html) {
            this.$('l2-ctrl-card').style.display = html ? '' : 'none';
            this.ctrl.innerHTML = html || '';
            return this.ctrl;
        }

        select(id) {
            if (this.busy) { this.toast('Busy — wait for the current step to finish.', 'warn'); return; }
            const tr = this.cfg.treatments.find(t => t.id === id);
            if (!tr) return;
            this.tr = tr;
            this.syringeFill = 0;
            this._markTreatment();
            this.onSelect(tr);
        }
        _markTreatment() {
            this.mount.querySelectorAll('.lab2-tr').forEach(b => b.classList.toggle('active', this.tr && b.dataset.id === this.tr.id));
        }
        markDone(id) {
            const b = this.mount.querySelector(`.lab2-tr[data-id="${id}"]`);
            if (b) b.classList.add('done');
        }

        setStep(i) {
            this.stepIdx = i;
            this.mount.querySelectorAll('#l2-steps li').forEach((li, k) => {
                li.classList.toggle('done', k < i);
                li.classList.toggle('current', k === i);
            });
            const sc = this.$('l2-stepcount');
            if (sc) sc.textContent = `${Math.min(i + 1, this.cfg.steps.length)}/${this.cfg.steps.length}`;
        }

        status(html) { this.$('l2-status').innerHTML = html; }

        /** actions: [{id,label,primary,disabled,onClick,title}] */
        actions(list) {
            const el = this.$('l2-actions');
            el.innerHTML = '';
            (list || []).forEach(a => {
                const b = document.createElement('button');
                b.className = 'lab2-btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : '');
                b.innerHTML = a.label;
                b.disabled = !!a.disabled;
                if (a.title) b.title = a.title;
                b.onclick = () => { if (!this.busy || a.always) a.onClick(); };
                el.appendChild(b);
            });
        }

        /** HUD chips: hud('l'|'r', [{k,v,tone}]) */
        hud(side, items) {
            const el = this.$('l2-hud-' + side);
            el.innerHTML = (items || []).map(i => `<div class="lab2-chip ${i.tone || ''}"><span>${i.k}</span><b>${i.v}</b></div>`).join('');
        }

        toast(msg, type = 'info', ms = 2600) {
            const el = this.$('l2-toast');
            el.className = 'lab2-toast show ' + type;
            el.innerHTML = msg;
            clearTimeout(this._toastT);
            this._toastT = setTimeout(() => el.classList.remove('show'), ms);
        }

        infer(html) { this.$('l2-infer').innerHTML = html; }

        addRow(cells, cls = '') {
            this.rows.push({ cells, cls });
            this._renderRows();
        }
        setRows(rows) { this.rows = rows.map(r => Array.isArray(r) ? { cells: r, cls: '' } : r); this._renderRows(); }
        _renderRows() {
            const tb = this.$('l2-tbody');
            this.$('l2-rowcount').textContent = this.rows.length;
            if (!this.rows.length) { tb.innerHTML = `<tr class="empty"><td colspan="${this.cfg.table.length || 1}">No readings yet</td></tr>`; return; }
            tb.innerHTML = this.rows.map((r, i) => `<tr class="${r.cls} ${i === this.rows.length - 1 ? 'fresh' : ''}">${r.cells.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
            const wrap = tb.closest('.lab2-table-wrap'); if (wrap) wrap.scrollTop = wrap.scrollHeight;
        }

        floatText(x, y, text, color = '#5eead4') { this.floats.push({ x, y, text, color, age: 0 }); }

        /* ---------- time ---------- */
        /** animate the simulated clock forward `minutes` over `sec` real seconds */
        timeLapse(minutes, sec, { label = 'Waiting', onTick, onDone } = {}) {
            const start = this.simMin;
            const el = this.$('l2-lapse');
            el.classList.add('show');
            this.busy = true;
            this.lapsing = true;
            this.tw.add(sec, (e, p) => {
                this.simMin = start + minutes * p;
                this.$('l2-lapse-t').innerHTML = `⏩ ${label} <b>${fmtClock(minutes * p)}</b> / ${fmtClock(minutes)}`;
                this.$('l2-lapse-bar').style.width = (p * 100) + '%';
                if (onTick) onTick(this.simMin, p);
            }, {
                ease: LAB.ease.linear,
                onDone: () => { el.classList.remove('show'); this.busy = false; this.lapsing = false; if (onDone) onDone(); }
            });
        }

        /* ---------- syringe / injection ---------- */
        get trayPos() { return this.cfg.tray; }

        /** draw vial + syringe on the instrument tray (call from draw() where appropriate, or base draws it) */
        drawTray(ctx) {
            if (!this.cfg.syringe || this.inject) return;
            const { x, y } = this.trayPos;
            // kidney tray
            ctx.save();
            G.shadow(ctx, x + 55, y + 6, 86, 9, 0.4);
            const g = ctx.createLinearGradient(0, y - 14, 0, y + 8);
            g.addColorStop(0, '#e2e8f0'); g.addColorStop(0.5, '#a8b3bf'); g.addColorStop(1, '#6b7683');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.ellipse(x + 55, y - 2, 80, 11, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(30,41,59,0.35)';
            ctx.beginPath(); ctx.ellipse(x + 55, y - 4, 72, 7, 0, 0, Math.PI * 2); ctx.fill();
            if (this.tr) G.vial(ctx, x + 118, y - 4, { color: this.tr.color, label: this.tr.short || '', h: 48, w: 22, fill: 0.75 });
            if (!this.drag || this.drag.kind !== 'syringe') {
                const hov = this._overTraySyringe(this.ptr.x, this.ptr.y);
                const lift = hov ? -3 : 0;
                G.syringe(ctx, x + 96, y - 8 + lift, Math.PI - 0.02, { fill: this.syringeFill, color: this.tr ? this.tr.color : '#94a3b8', scale: 0.62 });
                if (hov) G.text(ctx, this.syringeFill > 0 ? 'Drag to inject' : 'Click to draw up dose', x + 44, y - 26, { size: 11, color: '#f8fafc', align: 'center', shadow: true });
            }
            ctx.restore();
        }
        _overTraySyringe(mx, my) {
            if (!this.cfg.syringe) return false;
            const { x, y } = this.trayPos;
            return mx > x - 30 && mx < x + 104 && my > y - 26 && my < y + 8;
        }

        /** animate drawing the selected drug into the syringe */
        loadSyringe(cb) {
            if (!this.tr) return;
            this.busy = true;
            this.tw.add(0.7, e => { this.syringeFill = e * 0.85; }, { onDone: () => { this.busy = false; this.toast(`Syringe loaded with <b>${this.tr.name}</b>. Drag it onto the ${this.getInjectZone()?.label || 'animal'}.`, 'info'); if (cb) cb(); } });
        }

        /** full injection animation; zone = {x,y,angle}. Calls onInjected when plunger is depressed */
        playInjection(zone, done) {
            if (!zone) return;
            if (this.syringeFill <= 0) this.syringeFill = 0.85;
            const tr = this.tr;
            const a = zone.angle !== undefined ? zone.angle : Math.PI * 0.25;
            const sx = this.drag ? this.drag.x : this.trayPos.x + 60, sy = this.drag ? this.drag.y : this.trayPos.y - 10;
            const bx = zone.x - Math.cos(a) * 46, by = zone.y - Math.sin(a) * 46;
            const inj = this.inject = { x: sx, y: sy, a: Math.PI - 0.02, fill: this.syringeFill, plunger: this.syringeFill, color: tr ? tr.color : '#0ea5e9', depth: 0 };
            this.busy = true;
            const a0 = inj.a;
            let da = a - a0; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
            this.tw.add(0.55, e => { inj.x = M.lerp(sx, bx, e); inj.y = M.lerp(sy, by, e); inj.a = a0 + da * e; }, {
                onDone: () => this.tw.add(0.3, e => { inj.x = M.lerp(bx, zone.x, e); inj.y = M.lerp(by, zone.y, e); }, {
                    onDone: () => this.tw.add(0.8, e => { inj.plunger = inj.fill * (1 - e); }, {
                        ease: LAB.ease.linear,
                        onDone: () => {
                            this.syringeFill = 0;
                            this.onInjected(tr);
                            this.tw.add(0.35, e => { inj.x = M.lerp(zone.x, bx, e); inj.y = M.lerp(zone.y, by, e); }, {
                                onDone: () => { this.inject = null; this.busy = false; if (done) done(); }
                            });
                        }
                    })
                })
            });
        }

        /** convenience: load (if needed) then inject without dragging */
        autoInject() {
            const z = this.getInjectZone();
            if (!z) return this.toast('No injection target available right now.', 'warn');
            if (this.syringeFill > 0) return this.playInjection(z);
            this.loadSyringe(() => this.playInjection(z));
        }

        /* ---------- pointer ---------- */
        _bindPointer() {
            const cv = this.canvas;
            const pos = e => {
                const r = cv.getBoundingClientRect();
                return { x: (e.clientX - r.left) / r.width * this.W, y: (e.clientY - r.top) / r.height * this.H };
            };
            this._pd = e => {
                const p = pos(e); this.ptr.x = p.x; this.ptr.y = p.y; this.ptr.down = true;
                if (this.busy) return;
                if (this._overTraySyringe(p.x, p.y) && !this.inject) {
                    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
                    if (this.syringeFill <= 0) { this.loadSyringe(); return; }
                    this.drag = { kind: 'syringe', x: p.x, y: p.y };
                    return;
                }
                if (this.onPointerDown) this.onPointerDown(p.x, p.y, e);
            };
            this._pm = e => {
                const p = pos(e); this.ptr.x = p.x; this.ptr.y = p.y; this.ptr.over = true;
                if (this.drag) { this.drag.x = p.x; this.drag.y = p.y; }
                else if (this.onPointerMove) this.onPointerMove(p.x, p.y, e);
                cv.style.cursor = this.drag ? 'grabbing' : (this._overTraySyringe(p.x, p.y) || (this.cursorAt && this.cursorAt(p.x, p.y))) ? 'pointer' : 'default';
            };
            this._pu = e => {
                const p = pos(e); this.ptr.down = false;
                if (this.drag && this.drag.kind === 'syringe') {
                    const z = this.getInjectZone();
                    if (z && Math.hypot(p.x - z.x, p.y - z.y) < (z.r || 50) + 20) {
                        this.playInjection(z);
                    } else if (z) {
                        this.toast(`Drop the syringe on the glowing ${z.label || 'injection site'}.`, 'warn');
                    } else {
                        this.toast('Not the right time to inject — follow the protocol steps.', 'warn');
                    }
                    this.drag = null;
                    return;
                }
                if (this.onPointerUp) this.onPointerUp(p.x, p.y, e);
            };
            this._pl = () => { this.ptr.over = false; };
            cv.addEventListener('pointerdown', this._pd);
            window.addEventListener('pointermove', this._pm);
            window.addEventListener('pointerup', this._pu);
            cv.addEventListener('pointerleave', this._pl);
        }

        /* ---------- loop ---------- */
        _loop(now) {
            if (this.dead) return;
            const dt = Math.min(0.05, (now - this._last) / 1000);
            this._last = now;
            this.tw.update(dt);
            this.fx.update(dt);
            this.update(dt);
            const ctx = this.ctx;
            ctx.save();
            this.drawBackground(ctx);
            this.draw(ctx);
            this.fx.draw(ctx);
            this.drawTray(ctx);
            this._drawOverlays(ctx, dt);
            ctx.restore();
            this._raf = requestAnimationFrame(this._loop);
        }

        _drawOverlays(ctx, dt) {
            // hover callouts
            if (!this.drag && !this.inject && this.ptr.over) {
                const h = this.hotspots.find(s => this.ptr.x > s.x && this.ptr.x < s.x + s.w && this.ptr.y > s.y && this.ptr.y < s.y + s.h);
                if (h) G.callout(ctx, h.label, h.ax ?? h.x + h.w / 2, h.ay ?? h.y + h.h / 2, this.ptr.x + 18, this.ptr.y - 18);
            }
            // injection target glow
            const z = (this.drag || (this.syringeFill > 0 && !this.inject)) ? this.getInjectZone() : null;
            if (z) {
                const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 240);
                const near = this.drag && Math.hypot(this.drag.x - z.x, this.drag.y - z.y) < (z.r || 50) + 20;
                ctx.save();
                ctx.strokeStyle = near ? 'rgba(52,245,197,0.95)' : `rgba(52,245,197,${0.35 + pulse * 0.4})`;
                ctx.lineWidth = near ? 3 : 2; ctx.setLineDash([6, 5]);
                ctx.lineDashOffset = -performance.now() / 40;
                ctx.beginPath(); ctx.arc(z.x, z.y, (z.r || 30) + pulse * 4, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
                G.text(ctx, z.label || 'Inject here', z.x, z.y - (z.r || 30) - 10, { size: 11, align: 'center', color: '#a7f3d0', shadow: true });
                ctx.restore();
            }
            // dragged syringe
            if (this.drag && this.drag.kind === 'syringe') {
                const zz = this.getInjectZone();
                const ang = zz && zz.angle !== undefined ? zz.angle : Math.PI * 0.25;
                G.syringe(ctx, this.drag.x, this.drag.y, ang, { fill: this.syringeFill, color: this.tr ? this.tr.color : '#0ea5e9', scale: 0.9 });
            }
            if (this.inject) {
                const i = this.inject;
                G.syringe(ctx, i.x, i.y, i.a, { fill: i.plunger, plunger: i.plunger, color: i.color, scale: 0.9 });
            }
            // floating texts
            for (let k = this.floats.length - 1; k >= 0; k--) {
                const f = this.floats[k];
                f.age += dt;
                if (f.age > 1.8) { this.floats.splice(k, 1); continue; }
                ctx.globalAlpha = Math.min(1, (1.8 - f.age) * 2);
                G.text(ctx, f.text, f.x, f.y - f.age * 26, { size: 13, weight: 700, color: f.color, align: 'center', shadow: true });
                ctx.globalAlpha = 1;
            }
        }

        destroy() {
            this.dead = true;
            cancelAnimationFrame(this._raf);
            window.removeEventListener('pointermove', this._pm);
            window.removeEventListener('pointerup', this._pu);
            clearTimeout(this._toastT);
            if (this.onDestroy) this.onDestroy();
        }
    }

    function fmtClock(min) {
        if (min >= 120) return (min / 60).toFixed(1) + ' h';
        if (min >= 1) return Math.round(min) + ' min';
        return Math.round(min * 60) + ' s';
    }
    LAB.fmtClock = fmtClock;
    LAB.LabEngine = LabEngine;
})();
