/**
 * PharmVR — content protection
 * © 2026 Dr. Karthik Thiyagarajan. All rights reserved.
 *
 * NOTE ON WHAT THIS DOES AND DOES NOT DO
 * These are deterrents, not security. Anything a browser can render, a
 * determined person can capture — that is how the web works, and no script
 * can change it. What actually protects this work is the LICENCE, the
 * copyright notices, and the fact that the apparatus is drawn procedurally
 * at runtime rather than shipped as downloadable image files.
 *
 * The measures here are deliberately kept light so they never get in a
 * student's way: no blocked keyboard shortcuts, no devtools traps, no
 * disabled text selection in places people legitimately need to read.
 */
(function () {
    'use strict';

    /* Right-click on the simulation canvases and artwork offers no useful
       action anyway, and the menu's "Save image as…" is the one route worth
       closing. Text stays selectable so students can quote and take notes. */
    document.addEventListener('contextmenu', function (e) {
        if (e.target.closest('canvas, img, svg, .lab2-stage')) {
            e.preventDefault();
        }
    });

    /* Block dragging artwork out of the page. */
    document.addEventListener('dragstart', function (e) {
        if (e.target.closest('canvas, img, svg')) e.preventDefault();
    });

    /* Ownership notice for anyone who does open the console. */
    try {
        var tag = 'background:linear-gradient(135deg,#0C2149,#1B8FEF);color:#fff;' +
            'padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700';
        console.log('%cPharmVR', tag);
        console.log(
            '%c© 2026 Dr. Karthik Thiyagarajan, Pharm.D — All rights reserved.\n' +
            'Free to use. NOT open source: copying, re-hosting or reusing this\n' +
            'code or its simulation models is not permitted. See LICENSE.\n' +
            'Licensing enquiries: linkedin.com/in/karthik-thiyagarajan',
            'color:#15306B;font-size:12px;line-height:1.6'
        );
    } catch (e) { /* console unavailable */ }

    /* Append attribution to anything copied from the page. */
    document.addEventListener('copy', function (e) {
        var sel = window.getSelection();
        if (!sel || String(sel).length < 180) return;      // leave short quotes alone
        var note = '\n\n— PharmVR (https://pharmvr.github.io) © Dr. Karthik Thiyagarajan. All rights reserved.';
        try {
            e.clipboardData.setData('text/plain', String(sel) + note);
            e.preventDefault();
        } catch (err) { /* clipboard blocked */ }
    });
})();
