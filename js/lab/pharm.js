/**
 * PharmVR 2D — quantitative pharmacology helpers
 *
 * The analysis a student is actually asked to perform on isolated-tissue data:
 * Hill plots for potency, Schild regression for antagonist affinity, and the
 * interpolation / parallel-line arithmetic of the classical bioassays.
 *
 * Everything here is plain maths on arrays — no canvas, no DOM.
 */
(function () {
    const { M } = LAB;
    const PHARM = LAB.PHARM = {};

    /** µg of drug placed in a bath of `bathL` litres → molar concentration */
    PHARM.molar = (ug, mw, bathL) => (ug * 1e-6) / mw / bathL;

    /**
     * Hill plot by least squares.
     *   rows: [{ conc (molar), resp }]
     * Returns slope (nH), the x-intercept as log EC50, and pD2 = −log EC50.
     * Points at the floor and ceiling of the curve are dropped — the logit is
     * undefined there and they would otherwise dominate the regression.
     */
    PHARM.hillFit = function (rows, emaxHint) {
        if (!rows || rows.length < 3) return null;
        const emax = Math.max(emaxHint || 0, ...rows.map(r => r.resp)) * 1.02;
        if (!(emax > 0)) return null;
        const xs = [], ys = [];
        rows.forEach(r => {
            const f = r.resp / emax;
            if (f > 0.03 && f < 0.97 && r.conc > 0) {
                xs.push(Math.log10(r.conc));
                ys.push(Math.log10(f / (1 - f)));
            }
        });
        if (xs.length < 3) return null;
        const fit = M.linreg(xs, ys);
        if (!fit.slope) return null;
        const logEC50 = -fit.intercept / fit.slope;
        return {
            emax, nH: fit.slope, logEC50, ec50: Math.pow(10, logEC50),
            pD2: -logEC50, r2: fit.r2, xs, ys,
            at: a => emax * Math.pow(a, fit.slope) / (Math.pow(Math.pow(10, logEC50), fit.slope) + Math.pow(a, fit.slope))
        };
    };

    /**
     * Schild regression: log(DR − 1) against log[B].
     *   pts: [{ B (molar antagonist), dr (dose ratio) }]
     * A slope near 1 is the test of simple competitive antagonism; the
     * x-intercept gives pA2, the negative log of the antagonist concentration
     * that doubles the agonist EC50.
     */
    PHARM.schild = function (pts) {
        const xs = [], ys = [];
        (pts || []).forEach(p => {
            if (p.B > 0 && p.dr > 1.05) { xs.push(Math.log10(p.B)); ys.push(Math.log10(p.dr - 1)); }
        });
        if (xs.length < 2) return null;
        const fit = M.linreg(xs, ys);
        if (!fit.slope) return null;
        const xInt = -fit.intercept / fit.slope;
        return { slope: fit.slope, intercept: fit.intercept, pA2: -xInt, r2: fit.r2, xs, ys };
    };

    /** single-point Schild estimate from one dose ratio */
    PHARM.pA2single = (dr, B) => (dr > 1.05 && B > 0) ? Math.log10(dr - 1) - Math.log10(B) : null;

    /**
     * Three-point (interpolation) bioassay.
     * The unknown's response is bracketed by two standard doses and read off
     * the log-dose line between them.
     *   s1,s2: { dose, resp } for the standard;  u: { vol, resp } for the unknown
     * Returns the equivalent standard dose and hence the unknown's strength.
     */
    PHARM.assay3 = function (s1, s2, u) {
        if (!s1 || !s2 || !u) return null;
        if (s2.resp === s1.resp) return null;
        const f = (u.resp - s1.resp) / (s2.resp - s1.resp);
        const logEq = M.lerp(Math.log10(s1.dose), Math.log10(s2.dose), f);
        const equiv = Math.pow(10, logEq);
        const bracketed = u.resp >= Math.min(s1.resp, s2.resp) && u.resp <= Math.max(s1.resp, s2.resp);
        return { equiv, conc: u.vol > 0 ? equiv / u.vol : null, bracketed, f };
    };

    /**
     * Four-point (2 + 2) parallel-line bioassay.
     *   s1,s2 = low/high standard responses;  u1,u2 = low/high unknown responses
     *   d     = the dose ratio used within each preparation (usually 2)
     * M = log potency ratio; the two slopes should agree if the lines are
     * parallel, which is the validity condition for the assay.
     */
    PHARM.assay4 = function (s1, s2, u1, u2, d) {
        const denom = (s2 - s1) + (u2 - u1);
        if (!denom) return null;
        const logR = Math.log10(d) * ((u1 + u2) - (s1 + s2)) / denom;
        const slopeS = s2 - s1, slopeU = u2 - u1;
        const mean = (slopeS + slopeU) / 2;
        const parallelism = mean ? Math.abs(slopeS - slopeU) / Math.abs(mean) : 1;
        return { logR, ratio: Math.pow(10, logR), slopeS, slopeU, parallelism };
    };
})();
