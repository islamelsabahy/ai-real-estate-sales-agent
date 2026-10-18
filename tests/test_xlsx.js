"use strict";
const assert = require("assert"), fs = require("fs"), path = require("path"), os = require("os");
const X = require("../docs/app/xlsx.js");
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log("ok -", name); };
(async () => {
  const units = [["unit_id","project_id","location","property_type","bedrooms","area_sqm","price","status","payment_plan","down_pct"],
    ["A-1","P-1","East Cairo","Apartment",3,165,7400000,"Available","8 years",0.1],
    ["A-2","P-1","New Capital","villa",4,300,"15,500,000","reserved","7 years","15%"],
    ["A-3","P-9","Mars","Spaceship",2,90,0,"Available","",""],
    ["A-1","P-1","East Cairo","Apartment",3,165,1,"Available","",""]];
  const sheets = [{ name: "Units", rows: units }, { name: "Projects", rows: [["project_id","project_name","location","status"],["P-1","Sky & <Towers>","East Cairo","Active"]] }];
  await t("xlsx round trip keeps text, numbers and escapes", async () => {
    const back = await X.read(X.write(sheets));
    assert.deepStrictEqual(back.map(s => s.name), ["Units", "Projects"]);
    assert.strictEqual(back[1].rows[1][1], "Sky & <Towers>");
    assert.strictEqual(back[0].rows[1][6], "7400000");
  });
  await t("import validates rows, normalises values, reports errors and warnings", async () => {
    const back = await X.read(X.write(sheets));
    const r = X.importInventory(back, { types: ["Apartment","Villa"], locations: ["East Cairo","New Capital"] });
    assert.strictEqual(r.units.length, 2);
    assert.strictEqual(r.units[1].price, 15500000); assert.strictEqual(r.units[1].status, "Reserved"); assert.strictEqual(r.units[1].down_pct, 0.15); assert.strictEqual(r.units[1].property_type, "Villa");
    assert.deepStrictEqual(r.errors.map(e => e.msg), ["price", "duplicate_unit_id"]);
    assert.strictEqual(r.projects["P-1"], "Sky & <Towers>");
  });
  await t("csv with quotes and BOM parses", async () => {
    const rows = X.parseCsv('﻿unit_id,payment_plan\r\nA-1,"8 years, 10% down"\n');
    assert.deepStrictEqual(rows[1], ["A-1", "8 years, 10% down"]);
  });
  await t("sample-data units.csv imports with no errors", async () => {
    const rows = X.parseCsv(fs.readFileSync(path.join(__dirname, "../sample-data/units.csv"), "utf8"));
    const r = X.importInventory([{ name: "Units", rows }], { types: ["Apartment","Townhouse","Villa","Duplex","Chalet"], locations: ["East Cairo","West Cairo","New Capital","North Coast"] });
    assert.strictEqual(r.errors.length, 0); assert.strictEqual(r.warnings.length, 0); assert.strictEqual(r.units.length, rows.length - 1);
  });
  fs.writeFileSync(path.join(os.tmpdir(), "inv-test.xlsx"), X.write(sheets));
  console.log(n + " xlsx tests passed");
})().catch(e => { console.error(e); process.exit(1); });
