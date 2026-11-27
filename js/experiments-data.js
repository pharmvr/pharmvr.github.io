/**
 * PharmVR 2D — 31 Experiments Master Data
 * Complete directory for the landing page grid
 */

const EXPERIMENTS_DATA = [
    {
        num: 1, title: "Muscle Relaxant Activity (Rota-Rod)",
        desc: "Measure motor coordination on a rotating rod. CNS depressants reduce fall-off time.",
        category: "cns", animal: "Mice/Rats", engine: "CNS Behavioural",
        concept: "Motor coordination & muscle tone", status: "live"
    },
    {
        num: 2, title: "CNS Depressants & Stimulants (Actophotometer)",
        desc: "Locomotor activity via photocell beam breaks. Stimulants increase, depressants decrease counts.",
        category: "cns", animal: "Mice", engine: "CNS Behavioural",
        concept: "Locomotor activity modulation", status: "live"
    },
    {
        num: 3, title: "Analgesic Activity (Tail Flick)",
        desc: "Spinal reflex to radiant heat. Central analgesics increase reaction latency.",
        category: "cns", animal: "Mice/Rats", engine: "CNS Behavioural",
        concept: "Spinal pain reflex & analgesia", status: "live"
    },
    {
        num: 4, title: "Antihistaminic Drugs (Histamine Chamber)",
        desc: "Histamine aerosol challenge in guinea pig. Antihistamines delay pre-convulsive dyspnoea.",
        category: "special", animal: "Guinea Pig", engine: "Special Assay",
        concept: "H₁ receptor antagonism", status: "live"
    },
    {
        num: 5, title: "Analgesic Activity (Hot Plate)",
        desc: "Supraspinal pain threshold on 55°C plate. Opioids increase paw-lick/jump latency.",
        category: "cns", animal: "Mice", engine: "CNS Behavioural",
        concept: "Supraspinal pain pathway", status: "live"
    },
    {
        num: 6, title: "Anxiolytic Activity (Elevated Plus Maze)",
        desc: "Open arm exploration measures anxiety. Anxiolytics increase open arm time & entries.",
        category: "cns", animal: "Mice/Rats", engine: "CNS Behavioural",
        concept: "Anxiety-like behaviour", status: "live"
    },
    {
        num: 7, title: "Anticonvulsant Activity (MES)",
        desc: "Maximal electroshock induces tonic hind-limb extension. Anticonvulsants abolish it.",
        category: "cns", animal: "Mice/Rats", engine: "CNS Behavioural",
        concept: "Seizure threshold & Na⁺ channel block", status: "live"
    },
    {
        num: 8, title: "Effect of Drugs on Rabbit's Eye",
        desc: "Study autonomic drugs & local anaesthetics on pupil diameter, light reflex, and corneal reflex.",
        category: "ocular", animal: "Albino Rabbit", engine: "Ocular Reflex",
        concept: "Autonomic pharmacology of the eye", status: "live"
    },
    {
        num: 9, title: "Anticonvulsant Activity (PTZ)",
        desc: "Pentylenetetrazol-induced seizures. Anticonvulsants delay onset of clonic convulsions.",
        category: "cns", animal: "Mice/Rats", engine: "CNS Behavioural",
        concept: "GABA-ergic seizure modulation", status: "live"
    },
    {
        num: 10, title: "Effect of Drugs on Rabbit Intestine",
        desc: "Isolated ileum on organ bath. Record contractions on kymograph with ACh, Atropine, Adrenaline.",
        category: "tissue", animal: "Rabbit Ileum", engine: "Isolated Tissue",
        concept: "Autonomic GI smooth muscle responses", status: "live"
    },
    {
        num: 11, title: "Effect of Drugs on Frog Rectus Abdominis",
        desc: "Nicotinic receptor responses. ACh dose-response with d-tubocurarine antagonism.",
        category: "tissue", animal: "Frog Rectus", engine: "Isolated Tissue",
        concept: "Nicotinic receptor pharmacology", status: "live"
    },
    {
        num: 12, title: "Effect of Drugs on Frog Heart (Straub)",
        desc: "Isolated frog heart preparation. Record rate & force changes with autonomic drugs.",
        category: "cardio", animal: "Frog Heart", engine: "Cardiovascular",
        concept: "Cardiac autonomic innervation", status: "live"
    },
    {
        num: 13, title: "CRC of Acetylcholine on Frog Rectus",
        desc: "Cumulative concentration-response curve. Calculate EC₅₀ and Emax of ACh.",
        category: "bioassay", animal: "Frog Rectus", engine: "Bioassay & DRC",
        concept: "Concentration-response relationship", status: "live"
    },
    {
        num: 14, title: "CRC of Histamine on Guinea Pig Ileum",
        desc: "Dose-response curve of histamine. Demonstrate competitive antagonism with mepyramine.",
        category: "bioassay", animal: "Guinea Pig Ileum", engine: "Bioassay & DRC",
        concept: "Competitive H₁ antagonism & Schild plot", status: "live"
    },
    {
        num: 15, title: "pA₂ Determination (Schild Plot)",
        desc: "Quantify antagonist potency. Parallel rightward shifts of agonist CRC with increasing antagonist.",
        category: "bioassay", animal: "Guinea Pig Ileum", engine: "Bioassay & DRC",
        concept: "Schild equation & pA₂ value", status: "live"
    },
    {
        num: 16, title: "Bioassay of Histamine (3-Point)",
        desc: "3-point bioassay using guinea pig ileum. Bracket unknown between standard doses.",
        category: "bioassay", animal: "Guinea Pig Ileum", engine: "Bioassay & DRC",
        concept: "Biological standardization", status: "live"
    },
    {
        num: 17, title: "Bioassay of Acetylcholine (4-Point)",
        desc: "4-point (2+2) bioassay on frog rectus. Calculate potency ratio with fiducial limits.",
        category: "bioassay", animal: "Frog Rectus", engine: "Bioassay & DRC",
        concept: "Statistical bioassay design", status: "live"
    },
    {
        num: 18, title: "Effect of Drugs on Blood Pressure (Dog/Cat)",
        desc: "Record arterial BP on polygraph. Demonstrate pressor, depressor, and reversal responses.",
        category: "cardio", animal: "Dog/Cat", engine: "Cardiovascular",
        concept: "Vasomotor pharmacology", status: "live"
    },
    {
        num: 19, title: "Dale's Vasoperfusion (Rabbit Ear)",
        desc: "Perfuse isolated rabbit ear. Vasoconstriction/dilation with sympathomimetics & blockers.",
        category: "cardio", animal: "Rabbit Ear", engine: "Cardiovascular",
        concept: "Vascular smooth muscle responses", status: "live"
    },
    {
        num: 20, title: "Effect of Drugs on Perfused Frog Heart",
        desc: "Langendorff-style frog heart perfusion. Test inotropic and chronotropic drug effects.",
        category: "cardio", animal: "Frog Heart", engine: "Cardiovascular",
        concept: "Cardiac inotropy & chronotropy", status: "live"
    },
    {
        num: 21, title: "Local Anaesthetic Activity (Guinea Pig Wheal)",
        desc: "Intradermal wheal test. Compare onset, duration, and depth of local anaesthetic block.",
        category: "special", animal: "Guinea Pig", engine: "Special Assay",
        concept: "Na⁺ channel blockade kinetics", status: "live"
    },
    {
        num: 22, title: "Effect of Drugs on Uterus (Rat)",
        desc: "Isolated rat uterus preparation. Oxytocin, PGF₂α, and tocolytic responses on kymograph.",
        category: "tissue", animal: "Rat Uterus", engine: "Isolated Tissue",
        concept: "Uterine smooth muscle pharmacology", status: "live"
    },
    {
        num: 23, title: "Acute Toxicity Study (LD₅₀)",
        desc: "Up-and-down method for LD₅₀ estimation. Dose escalation, mortality observation, calculation.",
        category: "special", animal: "Mice", engine: "Special Assay",
        concept: "Dose-lethality relationship", status: "live"
    },
    {
        num: 24, title: "Anti-inflammatory Activity (Carrageenan Paw Oedema)",
        desc: "Carrageenan-induced rat paw swelling. Measure plethysmometric volume change with NSAIDs.",
        category: "special", animal: "Rats", engine: "Special Assay",
        concept: "COX inhibition & inflammation cascade", status: "live"
    },
    {
        num: 25, title: "Antipyretic Activity",
        desc: "Brewer's yeast-induced pyrexia in rats. Measure temperature reduction with antipyretics.",
        category: "special", animal: "Rats", engine: "Special Assay",
        concept: "Hypothalamic thermoregulation & PGE₂", status: "live"
    },
    {
        num: 26, title: "Diuretic Activity (Lipschitz Test)",
        desc: "Measure urine output in saline-loaded rats. Compare diuretics by volume & electrolyte excretion.",
        category: "special", animal: "Rats", engine: "Special Assay",
        concept: "Renal tubular transport & diuresis", status: "live"
    },
    {
        num: 27, title: "Hypoglycaemic Activity",
        desc: "Alloxan-induced diabetic rats. Blood glucose measurement after oral hypoglycaemic drugs.",
        category: "special", animal: "Rats", engine: "Special Assay",
        concept: "Insulin secretion & glucose homeostasis", status: "live"
    },
    {
        num: 28, title: "Effect of Drugs on GIT Motility (Charcoal Meal)",
        desc: "Charcoal meal transit in mice. Prokinetics increase and anticholinergics decrease transit distance.",
        category: "special", animal: "Mice", engine: "Special Assay",
        concept: "GI motility & peristalsis", status: "live"
    },
    {
        num: 29, title: "Antiemetic Activity (CuSO₄ Emesis)",
        desc: "Copper sulfate-induced vomiting in pigeons/dogs. Antiemetics delay or prevent emetic episodes.",
        category: "special", animal: "Pigeons/Dogs", engine: "Special Assay",
        concept: "CTZ & vomiting centre pharmacology", status: "live"
    },
    {
        num: 30, title: "Effect of Drugs on Ciliary Motility",
        desc: "Frog oesophageal ciliated epithelium. Measure cork disc transit time with drugs.",
        category: "special", animal: "Frog Oesophagus", engine: "Special Assay",
        concept: "Mucociliary clearance modulation", status: "live"
    },
    {
        num: 31, title: "Calculation of Pharmacokinetic Parameters",
        desc: "Compute Vd, t½, AUC, clearance from plasma concentration-time data. Semi-log plotting.",
        category: "bioassay", animal: "Computational", engine: "Bioassay & DRC",
        concept: "ADME & pharmacokinetic modelling", status: "live"
    }
];
