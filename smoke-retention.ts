// Run-link + retention schema-bump smoke (design-note-v2 §1 deferred step).
// Verifies: every Retention value round-trips through the run-link; the
// friction map is exact + strictly monotone; legacy "lockin" still maps to its
// v1 friction (byte-identical reproduction); retentionOpts surfaces legacy only
// when an incoming link carries it; FIELDS/GLOSSARY hide legacy.
import {
  encodeRunLink, decodeRunLink, businessToCfg, retentionOpts,
  RETENTION_MECHANISMS, FIELDS, GLOSSARY, WORLDS,
  type Retention, type BizInput, type RunLinkState,
} from "./src/lib/business.ts";

let fails = 0;
const ok = (name: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!cond) fails++;
};

const ALL: Retention[] = ["none", "loyalty", "promo", "default", "switchcost", "contract", "lockin"];
const baseBiz: BizInput = { name: "t", sell: "t", price: "hold", value: "par", retention: "none", threat: "none" };
const mkState = (r: Retention): RunLinkState => ({
  biz: { ...baseBiz, retention: r },
  bizB: { ...baseBiz },
  compare: false, fragility: false,
  selected: { mainstream: true },
  adv: { rounds: 12, lossAversion: 2.25, difficulty: "normal", anchorShift: 0, anchorRound: 0 },
  fin: { launchPrice: 0, marginPct: 0, cac: 0, discountPct: 0 },
});

// 1. Round-trip every retention value through the link.
for (const r of ALL) {
  const dec = decodeRunLink(encodeRunLink(mkState(r)));
  ok(`round-trip ${r}`, dec?.state.biz.retention === r, `got ${dec?.state.biz.retention}`);
}

// 2. Friction map exact + strictly monotone; lockin == v1 value 72.
const expected: Record<Retention, number> = {
  none: 18, promo: 32, loyalty: 45, default: 52, switchcost: 58, contract: 68, lockin: 72,
};
const order: Retention[] = ["none", "promo", "loyalty", "default", "switchcost", "contract", "lockin"];
let prev = -1, mono = true;
for (const r of order) {
  const f = businessToCfg({ ...baseBiz, retention: r }, WORLDS[0]).friction;
  ok(`friction ${r}=${f}`, f === expected[r]);
  if (f <= prev) mono = false;
  prev = f;
}
ok("friction strictly monotone none<...<lockin", mono);
ok("lockin reproduces v1 friction 72", businessToCfg({ ...baseBiz, retention: "lockin" }, WORLDS[0]).friction === 72);

// 3. retentionOpts surfaces legacy only when carried.
ok("retentionOpts(contract) hides lockin", !retentionOpts("contract").some((o) => o.v === "lockin"));
ok("retentionOpts(lockin) shows lockin", retentionOpts("lockin").some((o) => o.v === "lockin"));

// 4. FIELDS + GLOSSARY hide legacy; new mechanisms present.
const retField = FIELDS.find((f) => f.key === "retention")!;
ok("FIELDS retention hides lockin", !retField.opts.some((o) => o.v === "lockin"));
for (const k of ["default", "switchcost", "contract"] as const)
  ok(`FIELDS retention has ${k}`, retField.opts.some((o) => o.v === k));
const legacyTerm = RETENTION_MECHANISMS.find((m) => m.legacy)!.term;
ok("GLOSSARY excludes legacy term", !GLOSSARY.some((g) => g.term === legacyTerm));
for (const t of ["Default / auto-renew", "Switching cost", "Contract / commitment"])
  ok(`GLOSSARY has ${t}`, GLOSSARY.some((g) => g.term === t));

console.log(`\n${fails === 0 ? "ALL PASS" : fails + " FAIL(S)"}`);
process.exit(fails === 0 ? 0 : 1);
