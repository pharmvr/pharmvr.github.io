# Headless smoke test for the lab engines

Runs an experiment without a browser (stubbed DOM + canvas), drives its protocol by
clicking the primary action repeatedly, sweeps pointer drags over the whole stage and
reports any runtime error, plus the pharmacological means it produced.

No Node needed — macOS ships JavaScriptCore:

    JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
    $JSC tools/smoke-test.js -- . 7 9000              # experiment 7, 9000 frames
    $JSC tools/smoke-test.js -- . 7 9000 phenytoin    # force one treatment group
    $JSC tools/smoke-test.js -- . 7 9000 "" debug     # trace phase/actions each 3 s

`DATA` lines report the per-group means, so the pharmacology can be checked
(e.g. phenytoin should abolish tonic hind-limb extension in ~90% of animals).

Add new experiments to the `EXPFILES` map at the top.
