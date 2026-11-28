/**
 * EXP 21 — Local anaesthetic activity by the intradermal wheal method
 *
 * Four sites on the shaved back of a guinea pig each receive 0.2 mL of a
 * different solution intradermally, raising a visible wheal. Each wheal is then
 * tested with six pinpricks at intervals, and the number of pricks that fail to
 * provoke a response (out of six) grades the anaesthesia.
 *
 * Running all four sites on one animal is the whole design: it controls for
 * differences in skin sensitivity between animals, so onset and duration can be
 * compared directly.
 *
 *   Procaine (ester)      fast-ish onset, SHORT duration — hydrolysed by plasma esterases
 *   Lignocaine (amide)    rapid onset, moderate duration
 *   + adrenaline          same onset, duration roughly doubled by local vasoconstriction
 *   Bupivacaine           SLOW onset, very long duration — highly protein bound
 */
(function () {
    const { M, G } = LAB;

    const PIG = { x: 150, y: 418 };
    const PANEL = { x: 330, y: 136, w: 368, h: 262 };
    const UNIT = { x: 724, y: 150, w: 214, h: 248 };
    const PRICKS = 6;

    const DRUGS = [
        {
            id: 'saline', name: 'Normal saline 0.9%', short: 'Saline', cls: 'Vehicle control',
            color: '#64748b', onset: 0, duration: 0,
            note: 'The vehicle control. It raises an identical wheal, which shows that the wheal itself does not abolish sensation — only the drug does.'
        },
        {
            id: 'procaine', name: 'Procaine 2%', short: 'Procaine', cls: 'Ester — short acting',
            color: '#0891b2', onset: 5, duration: 32,
            note: 'An <b>ester</b>, hydrolysed rapidly by plasma and tissue cholinesterases, so the block is short-lived. Its breakdown product PABA accounts for the allergic reactions esters are known for.'
        },
        {
            id: 'lignocaine', name: 'Lignocaine 1%', short: 'Lignocaine', cls: 'Amide — rapid onset',
            color: '#0d9488', onset: 2, duration: 48,
            note: 'An <b>amide</b>, metabolised slowly in the liver rather than in plasma. Its low pKₐ leaves more unionised drug to cross the nerve membrane, which is why onset is quick.'
        },
        {
            id: 'lignoadr', name: 'Lignocaine 1% + adrenaline 1:200 000', short: 'Lig+Adr', cls: 'With vasoconstrictor',
            color: '#d97706', onset: 2, duration: 95,
            note: 'Adrenaline constricts the local vessels, so the drug is carried away more slowly. Onset is unchanged but <b>duration roughly doubles</b> — and the peak plasma concentration, and so systemic toxicity, falls.'
        },
        {
            id: 'bupivacaine', name: 'Bupivacaine 0.25%', short: 'Bupivacaine', cls: 'Amide — long acting',
            color: '#7c3aed', onset: 8, duration: 170,
            note: 'Highly lipid-soluble and about 95% protein bound, so it leaves the receptor slowly: <b>slow onset, very long duration</b>. The same properties make its cardiotoxicity difficult to reverse.'
        }
    ];
    const byId = id => DRUGS.find(d => d.id === id);

    class LocalAnaesthetic extends LAB.LabEngine {
        config() {
            return {
                room: { benchY: 430, seed: 16 },
                tray: { x: 56, y: 520 },
                steps: [
                    'Shave a 4 × 4 cm area on the back of the guinea pig the day before and mark out <b>four sites</b>.',
                    'Select a site, choose a solution, and inject <b>0.2 mL intradermally</b> to raise a wheal.',
                    'Repeat for the remaining sites so that each carries a different drug on the same animal.',
                    'After a short latent period, test each wheal with <b>six pinpricks</b> and count how many fail to provoke a response.',
                    'Repeat the testing at intervals to follow onset and recovery at every site.',
                    'Plot the score against time: the <b>onset</b> is where the line rises and the <b>duration</b> is how long it stays up.'
                ],
                treatmentTitle: 'Solutions',
                treatments: DRUGS.map(d => ({ id: d.id, name: d.name, short: d.short, cls: d.cls, color: d.color })),
                table: ['Time (min)', 'Site', 'Drug', 'Score /6'],
                tableTitle: 'Pinprick scores',
                chart: true,
                chartTitle: 'Anaesthesia score against time',
                chartEmpty: { xMin: 0, xMax: 120, yMin: 0, yMax: 6.4, xLabel: 'Time after injection (min)', yLabel: 'Pricks not felt (/6)' },
                viva: [
                    {
                        q: 'Why are all four solutions tested on the same animal?',
                        opts: ['To save animals only', 'Skin sensitivity varies between animals, so using one animal lets onset and duration be compared directly', 'The drugs interact usefully', 'It is faster'],
                        ans: 1,
                        exp: 'Within one animal the threshold to pinprick is common to all four sites, so differences between the wheals can only be due to the drugs. Between animals that threshold varies considerably.'
                    },
                    {
                        q: 'Adrenaline is added to lignocaine in order to:',
                        opts: ['Speed the onset', 'Produce local vasoconstriction, prolonging the block and reducing systemic absorption', 'Reduce the pH', 'Prevent allergy'],
                        ans: 1,
                        exp: 'Slowing removal from the injection site keeps the drug at the nerve for longer and lowers peak plasma levels — longer duration and less systemic toxicity from the same dose.'
                    },
                    {
                        q: 'Procaine has a shorter duration than lignocaine because it is:',
                        opts: ['Less potent', 'An ester, rapidly hydrolysed by plasma and tissue esterases', 'Not absorbed', 'More protein bound'],
                        ans: 1,
                        exp: 'Esters are destroyed in the plasma within minutes; amides must reach the liver to be metabolised. That single structural difference governs duration, allergy risk and metabolism.'
                    },
                    {
                        q: 'Bupivacaine has a slow onset but a very long duration because it is:',
                        opts: ['Weakly protein bound and water soluble', 'Highly lipid soluble and about 95% protein bound, with a relatively high pKₐ', 'Given in a higher concentration', 'An ester'],
                        ans: 1,
                        exp: 'A high pKₐ leaves less unionised drug to penetrate the nerve, so onset is slow; heavy protein binding then holds it at the receptor, so the block persists.'
                    },
                    {
                        q: 'Local anaesthetics block nerve conduction by:',
                        opts: ['Opening potassium channels', 'Binding to the inner surface of voltage-gated sodium channels and preventing depolarisation', 'Blocking calcium channels', 'Depleting acetylcholine'],
                        ans: 1,
                        exp: 'The unionised form crosses the membrane, is protonated inside, and blocks the sodium channel from within. That is also why anaesthetics work poorly in inflamed, acidic tissue.'
                    },
                    {
                        q: 'Why does the saline wheal still show a normal response to pinprick?',
                        opts: ['The needle missed', 'Raising a wheal does not itself abolish sensation — it is the drug that blocks conduction', 'Saline is anaesthetic at low dose', 'The animal is habituated'],
                        ans: 1,
                        exp: 'The saline site is the control that separates the mechanical effect of the injection from the pharmacological effect of the drug.'
                    }
                ],
                inferenceHint: 'Inject all four sites, then test them repeatedly over the next two hours to follow onset and recovery.'
            };
        }

        /* ---------------- lifecycle ---------------- */
        setup() {
            this.records = [];
            this.hotspots = [
                { x: PIG.x - 80, y: PIG.y - 70, w: 170, h: 80, label: 'Guinea pig, back shaved the previous day' },
                { x: PANEL.x, y: PANEL.y, w: PANEL.w, h: PANEL.h, label: 'Shaved dorsum — four injection sites' },
                { x: UNIT.x, y: UNIT.y, w: UNIT.w, h: UNIT.h, label: 'Clock and pinprick scoreboard' }
            ];
            this.pig = new LAB.GuineaPig({ x: PIG.x, y: PIG.y, scale: 0.78, facing: 1 });
            this.pig.groundY = PIG.y;
            this.resetAnimal();
        }

        resetAnimal() {
            this.gen = (this.gen || 0) + 1;
            this.busy = false;
            this.pigNo = (this.pigNo || 0) + 1;
            this.clock = 0;
            this.started = false;
            this.site = 0;
            this.testing = null;
            this.records = [];
            this.sites = [0, 1, 2, 3].map(i => ({
                i, drug: null, at: null, wheal: 0, score: null, flash: 0,
                x: PANEL.x + 108 + (i % 2) * 150,
                y: PANEL.y + 86 + Math.floor(i / 2) * 96
            }));
            this.setRows([]);
            this.setStep(1);
            this._controls();
            this._refresh();
            this._chart();
        }

        onSelect() { this._refresh(); }

        get freeSite() { return this.sites.find(s => !s.drug); }
        get anyInjected() { return this.sites.some(s => s.drug); }

        /* ---------------- pharmacology ---------------- */
        /** anaesthesia intensity 0..1 at `t` minutes after injection */
        intensity(d, t) {
            if (!d || d.duration <= 0) return 0;
            const rise = 1 / (1 + Math.exp(-(t - d.onset) / Math.max(0.6, d.onset * 0.35)));
            const fall = 1 / (1 + Math.exp((t - d.duration) / Math.max(2, d.duration * 0.12)));
            return M.clamp(rise * fall, 0, 1);
        }

        scoreOf(site) {
            if (!site.drug || site.at === null) return 0;
            const a = this.intensity(site.drug, this.clock - site.at);
            return M.clamp(Math.round(a * PRICKS + M.randn() * 0.45), 0, PRICKS);
        }

        /* ---------------- left column ---------------- */
        _controls() {
            this.controls(`
                <div style="font-size:11.5px;font-weight:700;color:#334155;margin-bottom:6px">Injection site</div>
                <div class="lab2-seg" id="la-site">${this.sites.map(s =>
                `<button data-i="${s.i}" class="${s.i === this.site ? 'active' : ''}">${s.i + 1}</button>`).join('')}</div>
                <div style="font-size:10.5px;color:#64748b;margin-top:4px">
                    ${this.sites[this.site].drug
                    ? `Site ${this.site + 1}: <b>${this.sites[this.site].drug.short}</b>`
                    : `Site ${this.site + 1} is empty — 0.2 mL intradermally`}
                </div>
                <p style="margin-top:10px;font-size:11px;color:#475569">
                    Each site takes one solution. Inject all four, then test them repeatedly over two hours.</p>
            `);
            const seg = this.$('la-site');
            if (seg) seg.querySelectorAll('button').forEach(b => b.onclick = () => {
                if (this.busy) return;
                this.site = +b.dataset.i;
                this._controls();
                this._refresh();
            });
        }

        _refresh() {
            const s = this.sites[this.site];
            const list = [];
            if (!s.drug) {
                this.status(`Select a solution and inject <b>0.2 mL intradermally</b> into site ${this.site + 1}.`);
                list.push({ label: '💉 Inject into site ' + (this.site + 1), primary: true, disabled: this.busy, onClick: () => this.autoInject() });
            } else {
                this.status(this.anyInjected
                    ? `t = <b>${Math.round(this.clock)} min</b>. Test the wheals with six pinpricks, or let more time pass.`
                    : 'Inject the remaining sites.');
                list.push({ label: '📍 Test all sites (6 pricks)', primary: true, disabled: this.busy, onClick: () => this.testAll() });
            }
            if (this.anyInjected) {
                list.push({ label: '⏩ +5 min', disabled: this.busy, onClick: () => this.advance(5) });
                list.push({ label: '⏩ +15 min', disabled: this.busy, onClick: () => this.advance(15) });
                list.push({ label: '↺ Fresh animal', disabled: this.busy, onClick: () => this.resetAnimal() });
            }
            this.actions(list);
            this.hud('l', [
                { k: 'Guinea pig', v: '#' + this.pigNo },
                { k: 'Clock', v: Math.round(this.clock) + ' min' },
                { k: 'Sites used', v: this.sites.filter(x => x.drug).length + '/4' }
            ]);
        }

        /* ---------------- procedure ---------------- */
        getInjectZone() {
            const s = this.sites[this.site];
            if (s.drug || this.busy) return null;
            return { x: s.x, y: s.y, r: 26, label: 'Site ' + (s.i + 1) + ' (intradermal)', angle: Math.PI * 0.3 };
        }

        onInjected(tr) {
            const s = this.sites[this.site];
            const d = byId(tr.id);
            s.drug = d;
            s.at = this.clock;
            this.started = true;
            this.tw.add(0.6, e => { s.wheal = e; });
            this.floatText(s.x, s.y - 34, `${d.short} 0.2 mL i.d.`, d.color);
            this.markDone(d.id);
            this.toast(`Wheal raised at site ${s.i + 1} with <b>${d.name}</b>.`, 'success');
            const next = this.freeSite;
            if (next) this.site = next.i;
            this.setStep(this.sites.filter(x => x.drug).length >= 4 ? 3 : 2);
            this._controls();
            this._refresh();
        }

        advance(mins) {
            if (this.busy) return;
            const gen = this.gen;
            this.timeLapse(mins, M.clamp(mins / 9, 0.8, 2.4), {
                label: 'Waiting',
                onTick: (sim, p) => { if (gen === this.gen) this.clockLive = this.clock + mins * p; },
                onDone: () => {
                    if (gen !== this.gen) return;
                    this.clock += mins;
                    this.clockLive = this.clock;
                    this._controls();
                    this._refresh();
                }
            });
            this._refresh();
        }

        testAll() {
            if (this.busy) return;
            const live = this.sites.filter(s => s.drug);
            if (!live.length) return this.toast('Inject at least one site first.', 'warn');
            this.busy = true;
            const gen = this.gen;
            let k = 0;
            const next = () => {
                if (gen !== this.gen) return;
                if (k >= live.length) {
                    this.busy = false;
                    this.clock += 1;                 // the testing itself takes about a minute
                    this.testing = null;
                    this.setStep(4);
                    this._chart();
                    this._infer();
                    this._controls();
                    this._refresh();
                    return;
                }
                const s = live[k++];
                this.testing = { site: s, prick: 0 };
                const sc = this.scoreOf(s);
                let p = 0;
                const prick = () => {
                    if (gen !== this.gen) return;
                    p++;
                    this.testing.prick = p;
                    s.flash = 1;
                    if (p >= PRICKS) {
                        s.score = sc;
                        this.records.push({ t: Math.round(this.clock), site: s.i, drug: s.drug, score: sc });
                        this.addRow([
                            Math.round(this.clock) + '',
                            String(s.i + 1),
                            `<b>${s.drug.short}</b>`,
                            `<b>${sc}</b> / ${PRICKS}`
                        ], sc >= 5 ? 'up' : (sc === 0 ? '' : 'muted'));
                        this.floatText(s.x, s.y - 34, `${sc}/${PRICKS}`, sc >= 4 ? '#5eead4' : '#fda4af');
                        this.tw.wait(0.25, next);
                    } else this.tw.wait(0.12, prick);
                };
                prick();
            };
            next();
            this._refresh();
        }

        /* ---------------- graph & inference ---------------- */
        _chart() {
            const used = this.sites.filter(s => s.drug);
            if (!this.records.length) return;
            const maxT = Math.max(30, ...this.records.map(r => r.t)) * 1.12;
            this.chart.draw({
                xMin: 0, xMax: maxT,
                yMin: 0, yMax: 6.4,
                xLabel: 'Time after injection (min)',
                yLabel: 'Pricks not felt (/6)',
                yTicks: [0, 2, 4, 6],
                annotations: [{ y: 3, color: '#cbd5e1', text: '50% block' }],
                series: used.map(s => ({
                    name: s.drug.short,
                    color: s.drug.color,
                    markers: true,
                    width: 1.8,
                    points: this.records.filter(r => r.site === s.i).map(r => [r.t - (s.at || 0), r.score])
                })).filter(x => x.points.length)
            });
        }

        _infer() {
            const used = this.sites.filter(s => s.drug && this.records.some(r => r.site === s.i));
            if (!used.length) return;
            let html = '<table style="width:100%;font-size:11.5px;border-collapse:collapse">';
            html += '<tr style="color:#64748b"><th style="text-align:left">Drug</th><th>Onset</th><th>Peak</th><th>Still blocked</th></tr>';
            used.forEach(s => {
                const rows = this.records.filter(r => r.site === s.i).map(r => ({ t: r.t - s.at, sc: r.score }));
                const first = rows.find(r => r.sc >= 3);
                const peak = Math.max(...rows.map(r => r.sc));
                const lastBlocked = rows.filter(r => r.sc >= 3).pop();
                html += `<tr><td><b>${s.drug.short}</b></td>
                    <td style="text-align:center">${first ? '≤' + first.t + ' min' : '—'}</td>
                    <td style="text-align:center">${peak}/${PRICKS}</td>
                    <td style="text-align:center">${lastBlocked ? lastBlocked.t + ' min' : '—'}</td></tr>`;
            });
            html += '</table>';

            const lig = used.find(s => s.drug.id === 'lignocaine');
            const adr = used.find(s => s.drug.id === 'lignoadr');
            if (lig && adr) {
                const dur = s => {
                    const rows = this.records.filter(r => r.site === s.i).map(r => ({ t: r.t - s.at, sc: r.score }));
                    const l = rows.filter(r => r.sc >= 3).pop();
                    return l ? l.t : 0;
                };
                const a = dur(lig), b = dur(adr);
                if (a && b && b > a) {
                    html += `<p style="margin-top:8px;padding:8px;background:#fffbeb;border-radius:6px">
                        Lignocaine was still blocking at <b>${a} min</b>, lignocaine with adrenaline at <b>${b} min</b>.
                        Onset is the same, but the vasoconstrictor keeps the drug at the nerve for longer — and lowers its peak plasma level at the same time.</p>`;
                }
            }
            const sal = used.find(s => s.drug.id === 'saline');
            if (sal) {
                html += `<p style="margin-top:6px;color:#475569">The saline wheal keeps responding throughout, which shows the wheal itself does not abolish sensation.</p>`;
            }
            const last = this.records[this.records.length - 1];
            if (last) html += `<p style="margin-top:6px;color:#475569">${last.drug.note}</p>`;
            this.infer(html);
        }

        /* ---------------- interaction ---------------- */
        _siteAt(x, y) { return this.sites.find(s => Math.hypot(x - s.x, y - s.y) < 26); }
        cursorAt(x, y) { return !this.busy && !!this._siteAt(x, y); }
        onPointerDown(x, y) {
            if (this.busy) return;
            const s = this._siteAt(x, y);
            if (s) { this.site = s.i; this._controls(); this._refresh(); }
        }

        /* ---------------- per-frame ---------------- */
        update(dt) {
            const p = this.pig;
            const t = this.testing;
            // a flinch when a prick is felt
            const felt = t && t.site.drug && this.intensity(t.site.drug, this.clock - t.site.at) < 0.5;
            p.set({ crouch: 0.3, sniff: 1, ataxia: felt && t.prick ? 0.5 : 0, walk: 0 });
            p.gaitSpeed = 0;
            p.update(dt);
            this.sites.forEach(s => { s.flash = Math.max(0, s.flash - dt * 3.2); });

            const shown = this.clockLive !== undefined ? this.clockLive : this.clock;
            this.hud('r', [
                { k: 'Clock', v: Math.round(shown) + ' min' },
                { k: 'Testing', v: t ? `site ${t.site.i + 1} · prick ${t.prick}/${PRICKS}` : '—' },
                { k: 'Blocked', v: this.sites.filter(s => s.score >= 3).length + '/4' }
            ]);
        }

        /* ---------------- drawing ---------------- */
        draw(ctx) {
            this._table(ctx);
            this.pig.draw(ctx);
            this._panel(ctx);
            this._unit(ctx);
        }

        _table(ctx) {
            G.shadow(ctx, PIG.x + 10, PIG.y + 12, 120, 9, 0.4);
            const g = ctx.createLinearGradient(0, PIG.y - 8, 0, PIG.y + 10);
            g.addColorStop(0, '#2f4858'); g.addColorStop(1, '#16242f');
            ctx.fillStyle = g; G.rr(ctx, PIG.x - 110, PIG.y - 8, 240, 16, 4); ctx.fill();
            ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1; ctx.stroke();
            ctx.fillStyle = '#64748b';
            [PIG.x - 92, PIG.x + 106].forEach(x => ctx.fillRect(x, PIG.y + 6, 7, 430 - PIG.y - 6));
        }

        /** magnified view of the shaved dorsum with the four wheals */
        _panel(ctx) {
            const p = PANEL;
            ctx.save();
            G.shadow(ctx, p.x + p.w / 2, p.y + p.h + 6, p.w * 0.45, 10, 0.4);
            // bezel
            const bz = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
            bz.addColorStop(0, '#e2e8f0'); bz.addColorStop(0.5, '#64748b'); bz.addColorStop(1, '#1e293b');
            ctx.fillStyle = bz; G.rr(ctx, p.x - 8, p.y - 8, p.w + 16, p.h + 16, 10); ctx.fill();

            // shaved skin
            const sg = ctx.createRadialGradient(p.x + p.w * 0.4, p.y + p.h * 0.35, 20, p.x + p.w / 2, p.y + p.h / 2, p.w * 0.72);
            sg.addColorStop(0, '#f7e3dc'); sg.addColorStop(1, '#e2c6bd');
            ctx.fillStyle = sg; G.rr(ctx, p.x, p.y, p.w, p.h, 6); ctx.fill();
            // stubble at the margins
            ctx.strokeStyle = 'rgba(150,120,96,0.3)'; ctx.lineWidth = 1;
            for (let i = 0; i < 90; i++) {
                const a = i * 2.39996, rr = p.w * 0.36 + (i * 13) % 42;
                const hx = p.x + p.w / 2 + Math.cos(a) * rr, hy = p.y + p.h / 2 + Math.sin(a) * rr * 0.62;
                if (hx < p.x + 4 || hx > p.x + p.w - 4 || hy < p.y + 4 || hy > p.y + p.h - 4) continue;
                ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + 3, hy + 4); ctx.stroke();
            }
            // grid marking out the sites
            ctx.strokeStyle = 'rgba(120,90,80,0.28)'; ctx.setLineDash([5, 5]); ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x + p.w / 2, p.y + 16); ctx.lineTo(p.x + p.w / 2, p.y + p.h - 16);
            ctx.moveTo(p.x + 20, p.y + p.h / 2); ctx.lineTo(p.x + p.w - 20, p.y + p.h / 2);
            ctx.stroke(); ctx.setLineDash([]);

            this.sites.forEach(s => {
                const sel = s.i === this.site;
                const a = s.drug && s.at !== null ? this.intensity(s.drug, this.clock - s.at) : 0;
                // the wheal
                if (s.wheal > 0.01) {
                    const r = 19 * s.wheal;
                    const wg = ctx.createRadialGradient(s.x - 4, s.y - 5, 2, s.x, s.y, r);
                    wg.addColorStop(0, '#fdf4f1'); wg.addColorStop(0.7, '#f3ddd6'); wg.addColorStop(1, '#dcb9ae');
                    ctx.fillStyle = wg;
                    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = 'rgba(200,120,110,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
                    // orange-peel dimpling
                    ctx.fillStyle = 'rgba(190,140,130,0.3)';
                    for (let i = 0; i < 7; i++) {
                        const aa = i * 0.9, rr = r * 0.55;
                        ctx.beginPath(); ctx.arc(s.x + Math.cos(aa) * rr, s.y + Math.sin(aa) * rr, 1.5, 0, Math.PI * 2); ctx.fill();
                    }
                    // tint by drug
                    ctx.fillStyle = G.hexA(s.drug.color, 0.16);
                    ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
                }
                // anaesthetised halo
                if (a > 0.05) {
                    ctx.strokeStyle = `rgba(52,245,197,${0.25 + a * 0.5})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(s.x, s.y, 24, 0, Math.PI * 2); ctx.stroke();
                }
                // pinprick flash
                if (s.flash > 0) {
                    ctx.strokeStyle = `rgba(239,68,68,${s.flash})`; ctx.lineWidth = 1.6;
                    ctx.beginPath(); ctx.arc(s.x, s.y, 8 + (1 - s.flash) * 14, 0, Math.PI * 2); ctx.stroke();
                }
                // selection ring
                if (sel) {
                    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
                    ctx.strokeStyle = `rgba(52,245,197,${0.45 + pulse * 0.4})`;
                    ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -performance.now() / 40;
                    ctx.beginPath(); ctx.arc(s.x, s.y, 28, 0, Math.PI * 2); ctx.stroke();
                    ctx.setLineDash([]);
                }
                // label and score
                G.text(ctx, String(s.i + 1), s.x - 27, s.y - 20, { size: 11, weight: 800, color: '#7c5a50' });
                if (s.drug) G.text(ctx, s.drug.short, s.x, s.y + 34, { size: 8.5, align: 'center', weight: 800, color: s.drug.color });
                if (s.score !== null) {
                    G.text(ctx, `${s.score}/${PRICKS}`, s.x, s.y + 4,
                        { size: 12, align: 'center', weight: 800, color: s.score >= 3 ? '#0f766e' : '#b91c1c' });
                }
            });

            // the needle, shown while testing
            const t = this.testing;
            if (t) {
                const s = t.site;
                const dip = Math.sin(performance.now() / 70) * 3;
                ctx.save();
                ctx.translate(s.x + 26, s.y - 30 + dip);
                ctx.rotate(Math.PI * 0.72);
                G.metal(ctx, -4, -20, 8, 22, { tone: 'dark', r: 2 });
                ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
                ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, 20); ctx.stroke();
                ctx.restore();
            }

            G.text(ctx, 'SHAVED DORSUM · ×3', p.x + p.w / 2, p.y + p.h + 22,
                { size: 9.5, align: 'center', weight: 800, color: '#e2e8f0', shadow: true });
            ctx.restore();
        }

        _unit(ctx) {
            const u = UNIT;
            G.shadow(ctx, u.x + u.w / 2, u.y + u.h + 2, u.w * 0.55, 10, 0.5);
            const g = ctx.createLinearGradient(0, u.y, 0, u.y + u.h);
            g.addColorStop(0, '#e8edf2'); g.addColorStop(0.1, '#cfd8e1'); g.addColorStop(1, '#8b97a4');
            ctx.fillStyle = g; G.rr(ctx, u.x, u.y, u.w, u.h, 10); ctx.fill();
            ctx.strokeStyle = 'rgba(15,23,42,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            G.text(ctx, 'PINPRICK SCORE', u.x + 18, u.y + 26, { size: 11, weight: 800, color: '#1e293b' });
            G.metal(ctx, u.x + 14, u.y + 38, u.w - 28, u.h - 56, { r: 8, tone: 'dark' });

            const shown = this.clockLive !== undefined ? this.clockLive : this.clock;
            G.lcd(ctx, u.x + 26, u.y + 50, u.w - 52, 40, Math.round(shown) + ' min',
                { label: 'TIME SINCE FIRST INJECTION', color: '#34f5c5' });

            this.sites.forEach((s, i) => {
                const y = u.y + 102 + i * 32;
                ctx.fillStyle = 'rgba(15,23,42,0.5)';
                G.rr(ctx, u.x + 26, y, u.w - 52, 26, 4); ctx.fill();
                ctx.fillStyle = s.drug ? s.drug.color : '#475569';
                G.rr(ctx, u.x + 30, y + 5, 5, 16, 2); ctx.fill();
                G.text(ctx, s.drug ? s.drug.short.slice(0, 11) : 'site ' + (i + 1), u.x + 42, y + 17,
                    { size: 9, weight: 700, color: s.drug ? '#e2e8f0' : '#64748b' });
                // six prick pips
                for (let k = 0; k < PRICKS; k++) {
                    const px = u.x + u.w - 56 + k * 8;
                    const on = s.score !== null && k < s.score;
                    ctx.fillStyle = on ? '#34f5c5' : 'rgba(148,163,184,0.35)';
                    ctx.beginPath(); ctx.arc(px, y + 13, 2.6, 0, Math.PI * 2); ctx.fill();
                }
            });
        }
    }

    LAB.register(21, LocalAnaesthetic);
})();
