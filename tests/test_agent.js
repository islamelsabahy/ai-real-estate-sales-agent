"use strict";
const assert = require("assert"), fs = require("fs"), path = require("path"), vm = require("vm");
const A = require("../docs/app/agent.js");
const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../docs/app/inventory.js"), "utf8").replace("var INVENTORY", "this.INVENTORY"), ctx);
const INV = ctx.INVENTORY;
let n = 0; const t = (name, f) => { try { f(); n++; } catch (e) { console.error("FAIL", name); throw e; } };
t("inventory.js matches sample-data/units.csv", () => {
  const rows = fs.readFileSync(path.join(__dirname, "../sample-data/units.csv"), "utf8").trim().split(/\r?\n/).slice(1);
  assert.strictEqual(rows.length, INV.units.length); rows.forEach((r, i) => assert.strictEqual(r.split(",")[0], INV.units[i].unit_id));
});
t("egyptian arabic extraction", () => {
  const r = A.extract("عايز شقة ٣ غرف في التجمع من 6 لـ 8 مليون تقسيط حوالي 60 ألف في الشهر، للسكن، استلام خلال سنة").req;
  assert.strictEqual(r.property_type, "Apartment"); assert.strictEqual(r.bedrooms, 3); assert.strictEqual(r.location, "East Cairo");
  assert.strictEqual(r.budget_min, 6e6); assert.strictEqual(r.budget_max, 8e6); assert.strictEqual(r.monthly_max, 60000); assert.strictEqual(r.payment, "installments");
  assert.strictEqual(r.purpose, "Primary Residence"); assert.strictEqual(r.timeline_months, 12);
});
t("english extraction", () => { const r = A.extract("Looking for a 4 bedroom villa in Sheikh Zayed, budget 20 million cash, for investment").req; assert.strictEqual(r.property_type, "Villa"); assert.strictEqual(r.location, "West Cairo"); assert.strictEqual(r.budget_max, 2e7); assert.strictEqual(r.payment, "cash"); assert.strictEqual(r.purpose, "Investment"); });
t("only available units, within budget, ranked", () => { const m = A.match({ location: "East Cairo", property_type: "Apartment", budget_max: 8e6, bedrooms: 3 }, INV.units); assert.ok(m.length); assert.ok(m.every((x) => x.unit.status === "Available" && x.unit.price <= 8.4e6)); assert.strictEqual(m[0].unit.unit_id, "DEMO-U-102"); });
t("installment estimate", () => { const u = INV.units[0]; assert.ok(Math.abs(A.installment(u) - 6200000 * 0.9 / 96) < 1e-6); });
t("lead score classes", () => { const s = A.leadScore({ budget_max: 8e6, location: "East Cairo", property_type: "Apartment", bedrooms: 3, timeline_months: 3, payment: "cash", decision: "self" }, INV.units, 4); assert.strictEqual(s.total, 100); assert.strictEqual(s.cls, "Hot"); assert.strictEqual(A.leadScore({}, INV.units, 1).cls, "Low Priority"); });
t("multi-turn memory", () => { let st = {}; let r = A.turn(st, "عايز شقة في زايد", INV.units, INV.projects); st = r.state; r = A.turn(st, "الميزانية 7 مليون", INV.units, INV.projects); assert.strictEqual(r.state.req.location, "West Cairo"); assert.ok(r.matches.length); assert.ok(r.matches.every((m) => m.unit.location === "West Cairo")); });
t("replies never fail their own audit", () => { ["عايز شقة 3 غرف في التجمع لحد 8 مليون", "villa in zayed 22 million", "شاليه في الساحل 9 مليون كاش", "apartment in new capital 5 million installments 40k a month"].forEach((m) => { const r = A.turn({}, m, INV.units, INV.projects); assert.deepStrictEqual(A.audit(r.reply, INV.units), [], m + "\n" + r.reply); }); });
t("crm note has every field", () => { const r = A.turn({}, "شقة في التجمع 8 مليون", INV.units, INV.projects); const note = A.crmNote(r.state, r.score, r.next, "en"); assert.strictEqual(note.split("\n").length, 12); assert.ok(/Units Discussed: DEMO-U-/.test(note)); });
t("all evaluation cases pass", () => { const c = A.evaluate(INV.units, INV.projects); c.forEach((x) => assert.ok(x.pass, x.name)); assert.strictEqual(c.length, 7); });
console.log(`ok: ${n} sales-agent tests passed`);
