# PharmVR 2D — working notes

Interactive pharmacology lab simulator: 31 classical experiments, free alternative to
ExPharm. Plain static HTML/CSS/JS — **no build step, no framework, no package manager.**

- **Live at** https://pharmvr.github.io (root domain). Pushing to `main` deploys.
- Repo is `pharmvr/pharmvr.github.io`. The old `pharmvr-2d` repo is dead — ignore it.
- SEO matters here. Target terms: *ExPharm alternative*, *free pharmacology lab*.
  Every new experiment gets a `sitemap.xml` entry.

## Read this instead of the source

This file exists so a new session does not have to read ~2,000 lines of `js/lab/` to
write a correct experiment. Read the source only when changing the framework itself.

## How an experiment is wired

1. Write `js/lab/exp/expNN-name.js`, ending with `LAB.register(NN, ClassName)`.
2. Add a `<script>` tag in `index.html` (order matters — see below).
3. Add a `<url>` entry to `sitemap.xml`.

`js/app.js` checks `LAB.registry[expNum]` **first**, so registering overrides the
legacy `js/engines/*.js` dispatch automatically. The legacy engines are fallbacks for
experiments not yet rebuilt; don't edit them.

**Script order in index.html** (dependencies load first):
`core.js` → `rodent.js` → `engine.js` → `pharm.js` → `kymograph.js` →
`organbath.js` → `heartrig.js` → `exp/*.js`

`organbath.js` reads `LAB.Kymograph.STYLUS_A` at load time, so `kymograph.js`
must come before it.

## Framework

### `LAB.LabEngine` (js/lab/engine.js) — base for every experiment

Renders a 3-column shell: protocol steps + treatments left, 960×540 canvas centre,
observation table + chart + inference right.

Override: `config()` `setup()` `update(dt)` `draw(ctx)` and optionally
`onSelect(tr)` `onInjected(tr)` `getInjectZone()` `resetAnimal()`
`onPointerDown/Move/Up(x,y)` `cursorAt(x,y)` `drawBackground(ctx)`.

`config()` returns: `{ room, syringe, tray, steps[], treatmentTitle, treatments[],
table[], tableTitle, chart, chartTitle, chartEmpty, viva[], inferenceHint }`.
Each treatment needs `{id, name, short, cls, color}`. Each viva item is
`{q, opts[], ans, exp}`.

Useful methods: `status(html)` `actions([{label,primary,danger,disabled,onClick}])`
`hud('l'|'r', [{k,v,tone}])` `toast(msg,type)` `infer(html)` `addRow(cells,cls)`
`setRows(rows)` `controls(html)` `setStep(i)` `markDone(id)` `floatText(x,y,txt,color)`
`timeLapse(minutes, realSec, {label,onTick,onDone})`.

State you can rely on: `this.tr` (selected treatment), `this.busy`, `this.simMin`,
`this.ptr`, `this.tw` (tweens), `this.fx` (particles), `this.chart`, `this.$(id)`.

`timeLapse` sets `busy = true`, then `busy = false` *before* calling `onDone`.

### `LAB.OrganBath` (js/lab/organbath.js) — isolated-tissue rig

Organ bath + frontal writing lever (×6) + smoked-drum kymograph, with the trace
wrapped onto the rotating cylinder. Used by exps 10, 11, 13, 14, 15, 16, 17, 22.

Override `rig()` → `{solution, tempC, restLen, spont, tissueLabel}`
(`tempC` non-null draws a heated jacket + thermostat; `spont: {amp, period}` adds a
spontaneous rhythm to the baseline), plus `drawTissue(ctx, geom)`, `response(...)`
and `pipetteDropped()`.

Call `initRig()` from `setup()`, `resetRig()` from `resetAnimal()`,
`updateRig(dt)` from `update(dt)`, `drawRig(ctx)` from `draw(ctx)`.

Then use: `markAddition(drug, dose)` (drum mark + bath tint + plume),
`washBath(cb)` (3× wash animation), and set `this.ampTarget` to drive the trace.
`this.amp` is in **mm of lever excursion**; negative = relaxation.
`this.mod` holds the current bath pre-treatment; `this.spontTarget` damps the rhythm.
`this.drug` must be set — the reagent rack renders from it.

### `LAB.Kymograph` (js/lab/kymograph.js) — smoked drum

Rotating cylinder with the trace wrapped onto the visible face. Owns its own
`trace`/`marks`/`ticks`/`rot`; both rigs delegate to it.

`new LAB.Kymograph({cx, top, bot, r, benchY, speed, label,
channels: [{baseline, px, color, width}]})`, then `update(dt, value|[values])`,
`mark(label, color)`, `reset()`, `draw(ctx)`.

### `LAB.HeartRig` (js/lab/heartrig.js) — amphibian heart rig

Cannula on a stand, suspended frog heart, heart lever (×5) and drum. Used by
exps 12 and 20. `rig()` → `{perfused, baseRate, baseForce, baseFlow}`; when
`perfused` is true it adds a constant-head reservoir, a drop counter and a
second drum channel for coronary outflow (and scales the force channel down so
the two traces don't collide).

Call `initHeart()`, `resetHeart()`, `updateHeart(dt)`, `drawHeart(ctx)` from the
matching lifecycle methods. Drive the heart with `rateTarget`, `forceTarget`,
`flowTarget` and `arrest` (`null` | `'systole'` | `'diastole'`); the rig supplies
the beat waveform, the reagent rack, the pipette and `drawReadout(ctx)`.
Override `pipetteDropped()`.

### `LAB.PHARM` (js/lab/pharm.js) — quantitative analysis

`molar(ug, mw, bathL)` · `hillFit(rows, emaxHint)` → `{nH, ec50, pD2, r2, xs, ys, at()}`
· `schild(pts)` → `{slope, pA2, r2}` · `pA2single(dr, B)` · `assay3(s1, s2, u)`
· `assay4(s1, s2, u1, u2, d)`.

### `LAB.TISSUE` — tissue painters

`rectus(ctx, geom)` · `ileum(ctx, geom, pale)` · `uterus(ctx, geom)`.
`geom` is `{x, topY, hookY, len, w}`, supplied by the rig.

### `LAB.Rodent` / `LAB.RodentTop` (js/lab/rodent.js)

Procedural animated mouse/rat. Side view: `new LAB.Rodent({x, y, scale, kind, facing})`,
then `set({walk, sedation, ataxia, tonic, clonic, lick, straub, crouch, hunch, rear, sniff})`
(0–1, smoothed internally), `gaitSpeed`, `groundY`, `update(dt)`, `draw(ctx)`.
Top view (`RodentTop`) is for arenas/mazes: `goTo(x,y,speed)`, `atTarget`, `distance`.

### `LAB.G` — canvas primitives

`rr` `hexA` `mix` `shadow` `metal(tone: steel|dark|brass|chrome|black)` `cylinder`
`glass` `lcd` `led` `knob` `screw` `callout` `text` `vial` `syringe` `labRoom`.

### `LAB.Chart`

`draw({xMin,xMax,yMin,yMax, logX, logY, xLabel,yLabel, xTicks,yTicks, xFmt,yFmt,
series:[{name,color,points,type:'line'|'scatter'|'bar'|'step', markers,dashed,width,
barWidth,offset,labels}], annotations:[{x,y,text,color}], barCount})`.
Bars with a negative `yMin` baseline at 0, so relaxations draw downward.

Also: `LAB.M` (clamp lerp rand randn gauss approach smooth noise1 mean sem **linreg**),
`LAB.ease`, `LAB.fmtClock`, `LAB.W/H` (960×540).

## Conventions

- Canvas is a **fixed 960×540 logical stage**; everything is drawn procedurally.
- Pharmacology is **modelled, not hard-coded** — Hill equations, dose ratios, real
  EC50/pA2 values. Teaching points should fall out of the simulation. Getting the
  pharmacology exactly right matters more than anything else in this project.
- Every experiment ships 5–6 viva questions with explanations.
- Reuse the apparatus. Building a rig is the expensive part; batch experiments that
  share one.

## Working style

- **Ship without a test pass.** No browser verification, no smoke tests. Say plainly
  when work is untested so the user knows to look.
- Build in batches of ~3 experiments per session to spread AI usage.
- There is no `node` or `jsc` on this machine — JS cannot be syntax-checked locally.
  A syntax error takes down the whole page, so be careful with large new files.

## Status

Built (25): 1 2 3 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 22 23 24 25 26 31
Remaining (6): 4 21 27 28 29 30

All the apparatus-heavy experiments are done. The remaining six are assorted
small rigs: 4 (histamine aerosol chamber), 21 (guinea pig wheal), 27
(hypoglycaemia), 28 (charcoal meal), 29 (CuSO₄ emesis), 30 (ciliary motility).
27 and 28 reuse the rodent pattern of exps 24–26.

Once 4, 21, 27–30 are rebuilt, the whole legacy `js/engines/` layer and about
3 MB of JPEG backdrops can be deleted — they are only referenced from there.
