/* Tiny dependency-free .xlsx writer/reader (inline strings, stored zip) plus inventory import checks.
   write(sheets) -> Uint8Array ; read(bytes) -> Promise<[{name, rows}]> ; parseCsv(text) -> rows. */
(function (root, factory) { if (typeof module === "object" && module.exports) module.exports = factory(); else root.XLSX = factory(); })(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var enc = new TextEncoder(), dec = new TextDecoder("utf-8");
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""); }
  function unesc(s) { return s.replace(/&(#x?[0-9a-fA-F]+|lt|gt|amp|quot|apos);/g, function (m, e) { if (e === "lt") return "<"; if (e === "gt") return ">"; if (e === "amp") return "&"; if (e === "quot") return '"'; if (e === "apos") return "'"; return String.fromCodePoint(e[1] === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)); }); }
  function colName(i) { var s = ""; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function colIndex(ref) { var m = /^([A-Z]+)/.exec(ref)[1], n = 0; for (var i = 0; i < m.length; i++) n = n * 26 + m.charCodeAt(i) - 64; return n - 1; }

  function zip(files) {
    var parts = [], central = [], off = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.data), crc = crc32(data);
      var head = [].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(new Uint8Array(head), name, data);
      central.push({ name: name, crc: crc, size: data.length, off: off });
      off += head.length + name.length + data.length;
    });
    var cstart = off, csize = 0;
    central.forEach(function (c) {
      var h = [].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c.crc), u32(c.size), u32(c.size), u16(c.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.off));
      parts.push(new Uint8Array(h), c.name); csize += h.length + c.name.length;
    });
    parts.push(new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(csize), u32(cstart), u16(0))));
    var total = parts.reduce(function (a, p) { return a + p.length; }, 0), out = new Uint8Array(total), p = 0;
    parts.forEach(function (x) { out.set(x, p); p += x.length; });
    return out;
  }

  /* sheets: [{name, rows:[[...]], widths:[..], validations:[{col, list:[..]}]}] ; header row is styled bold. */
  function write(sheets) {
    var ct = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      sheets.map(function (s, i) { return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join("") + '</Types>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    var wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      sheets.map(function (s, i) { return '<sheet name="' + esc(s.name) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>'; }).join("") + '</sheets></workbook>';
    var wbr = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      sheets.map(function (s, i) { return '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>'; }).join("") +
      '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    var styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF8A6A12"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
    var files = [{ name: "[Content_Types].xml", data: ct }, { name: "_rels/.rels", data: rels }, { name: "xl/workbook.xml", data: wb }, { name: "xl/_rels/workbook.xml.rels", data: wbr }, { name: "xl/styles.xml", data: styles }];
    sheets.forEach(function (s, i) {
      var cols = s.widths ? '<cols>' + s.widths.map(function (w, k) { return '<col min="' + (k + 1) + '" max="' + (k + 1) + '" width="' + w + '" customWidth="1"/>'; }).join("") + '</cols>' : "";
      var data = s.rows.map(function (r, ri) {
        return '<row r="' + (ri + 1) + '">' + r.map(function (v, ci) {
          if (v === null || v === undefined || v === "") return "";
          var ref = colName(ci) + (ri + 1), st = s.header !== false && ri === 0 ? ' s="1"' : "";
          if (typeof v === "number" && isFinite(v)) return '<c r="' + ref + '"' + st + '><v>' + v + '</v></c>';
          return '<c r="' + ref + '"' + st + ' t="inlineStr"><is><t xml:space="preserve">' + esc(v) + '</t></is></c>';
        }).join("") + '</row>';
      }).join("");
      var dv = "";
      if (s.validations && s.validations.length) {
        dv = '<dataValidations count="' + s.validations.length + '">' + s.validations.map(function (v) {
          var c = colName(v.col);
          return '<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="' + c + '2:' + c + '1000"><formula1>"' + esc(v.list.join(",")) + '"</formula1></dataValidation>';
        }).join("") + '</dataValidations>';
      }
      var view = s.rtl ? '<sheetViews><sheetView rightToLeft="1" workbookViewId="0"/></sheetViews>' : '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
      files.push({ name: "xl/worksheets/sheet" + (i + 1) + ".xml", data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + view + cols + '<sheetData>' + data + '</sheetData>' + dv + '</worksheet>' });
    });
    return zip(files);
  }

  function inflate(bytes) {
    var ds = new DecompressionStream("deflate-raw"), w = ds.writable.getWriter();
    w.write(bytes); w.close();
    return new Response(ds.readable).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function unzip(buf) {
    var b = buf instanceof Uint8Array ? buf : new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength), i, eocd = -1;
    for (i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("not a zip/xlsx file");
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), out = {}, jobs = [];
    for (var k = 0; k < n; k++) {
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      var name = dec.decode(b.subarray(p + 46, p + 46 + nl)); p += 46 + nl + el + cl;
      var lnl = dv.getUint16(lo + 26, true), lel = dv.getUint16(lo + 28, true), start = lo + 30 + lnl + lel, raw = b.subarray(start, start + csize);
      (function (nm, m, r) { jobs.push((m === 0 ? Promise.resolve(r) : inflate(r)).then(function (d) { out[nm] = dec.decode(d); })); })(name, method, raw);
    }
    return Promise.all(jobs).then(function () { return out; });
  }
  function read(buf) {
    return unzip(buf).then(function (f) {
      var wb = f["xl/workbook.xml"], rl = f["xl/_rels/workbook.xml.rels"] || "", shared = [];
      if (!wb) throw new Error("no workbook.xml");
      if (f["xl/sharedStrings.xml"]) {
        var re = /<si\b[^>]*>([\s\S]*?)<\/si>/g, m;
        while ((m = re.exec(f["xl/sharedStrings.xml"]))) { var txt = "", tr = /<t\b[^>]*>([\s\S]*?)<\/t>/g, t; while ((t = tr.exec(m[1]))) txt += unesc(t[1]); shared.push(txt); }
      }
      var targets = {}, rr = /<Relationship\b([^>]*)\/?>/g, x;
      while ((x = rr.exec(rl))) { var id = /\bId="([^"]*)"/.exec(x[1]), tg = /\bTarget="([^"]*)"/.exec(x[1]); if (id && tg) targets[id[1]] = tg[1]; }
      var sheets = [], sr = /<sheet\b([^>]*)\/?>/g, s;
      while ((s = sr.exec(wb))) {
        var nm = /\bname="([^"]*)"/.exec(s[1]), rid = /\br:id="([^"]*)"/.exec(s[1]); if (!nm || !rid) continue;
        var tg2 = (targets[rid[1]] || "").replace(/^\//, ""), path = tg2.indexOf("xl/") === 0 ? tg2 : "xl/" + tg2, xml = f[path]; if (!xml) continue;
        var rows = [], rowRe = /<row\b[^>]*>([\s\S]*?)<\/row>/g, rm;
        while ((rm = rowRe.exec(xml))) {
          var cells = [], cre = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g, c;
          while ((c = cre.exec(rm[1]))) {
            var ref = /\br="([A-Z]+\d+)"/.exec(c[1]); if (!ref) continue;
            var ty = /\bt="([^"]*)"/.exec(c[1]), body = c[2] || "", val = "";
            if (ty && ty[1] === "inlineStr") { var tt = /<t\b[^>]*>([\s\S]*?)<\/t>/g, q; while ((q = tt.exec(body))) val += unesc(q[1]); }
            else { var v = /<v>([\s\S]*?)<\/v>/.exec(body); if (v) val = ty && ty[1] === "s" ? (shared[+v[1]] || "") : unesc(v[1]); }
            cells[colIndex(ref[1])] = val;
          }
          for (var z = 0; z < cells.length; z++) if (cells[z] === undefined) cells[z] = "";
          rows.push(cells);
        }
        sheets.push({ name: unesc(nm[1]), rows: rows });
      }
      return sheets;
    });
  }

  function parseCsv(text) {
    text = text.replace(/^﻿/, "");
    var rows = [], row = [], cur = "", q = false, i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
      else cur += c;
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return String(x).trim() !== ""; }); });
  }

  var UNIT_COLS = ["unit_id", "project_id", "location", "property_type", "bedrooms", "area_sqm", "price", "status", "payment_plan", "down_pct"];
  var PROJ_COLS = ["project_id", "project_name", "location", "status"];
  var STATUSES = ["Available", "Reserved", "Sold", "Pending"];

  /* sheets -> {units, projects, errors:[{sheet,row,msg}], warnings:[...]} ; accepts one sheet per kind, any order, detected by header. */
  function importInventory(sheets, known) {
    var res = { units: [], projects: {}, errors: [], warnings: [] }, uRows = null, pRows = null, uName = "Units", pName = "Projects";
    sheets.forEach(function (s) {
      if (!s.rows.length) return;
      var h = s.rows[0].map(function (x) { return String(x).trim().toLowerCase(); });
      if (h.indexOf("unit_id") >= 0) { uRows = s.rows; uName = s.name; }
      else if (h.indexOf("project_name") >= 0) { pRows = s.rows; pName = s.name; }
    });
    function table(rows, cols) { var h = rows[0].map(function (x) { return String(x).trim().toLowerCase(); }); return rows.slice(1).map(function (r, i) { var o = { _row: i + 2 }; cols.forEach(function (k) { var j = h.indexOf(k); o[k] = j >= 0 && r[j] !== undefined ? String(r[j]).trim() : ""; }); return o; }).filter(function (o) { return cols.some(function (k) { return o[k] !== ""; }); }); }
    if (pRows) table(pRows, PROJ_COLS).forEach(function (p) { if (!p.project_id) { res.errors.push({ sheet: pName, row: p._row, msg: "project_id" }); return; } res.projects[p.project_id] = p.project_name || p.project_id; });
    if (!uRows) { res.errors.push({ sheet: uName, row: 1, msg: "no_units_sheet" }); return res; }
    var seen = {};
    table(uRows, UNIT_COLS).forEach(function (u) {
      var e = function (m) { res.errors.push({ sheet: uName, row: u._row, msg: m }); };
      if (!u.unit_id) return e("unit_id");
      if (seen[u.unit_id]) return e("duplicate_unit_id");
      var price = +String(u.price).replace(/[, ]/g, ""), area = +u.area_sqm, bed = +u.bedrooms;
      if (!(price > 0)) return e("price");
      if (!(area > 0)) return e("area_sqm");
      if (u.bedrooms === "" || !(bed >= 0)) return e("bedrooms");
      var st = STATUSES.filter(function (x) { return x.toLowerCase() === u.status.toLowerCase(); })[0];
      if (!st) return e("status");
      var dp = u.down_pct === "" ? 0.1 : +String(u.down_pct).replace("%", ""); if (/%/.test(u.down_pct) || dp > 1) dp = dp / 100;
      if (!(dp >= 0 && dp < 1)) return e("down_pct");
      if (known) {
        var T = known.types.filter(function (x) { return x.toLowerCase() === u.property_type.toLowerCase(); })[0], L = known.locations.filter(function (x) { return x.toLowerCase() === u.location.toLowerCase(); })[0];
        if (!T) res.warnings.push({ sheet: uName, row: u._row, msg: "property_type" });
        if (!L) res.warnings.push({ sheet: uName, row: u._row, msg: "location" });
        u.property_type = T || u.property_type; u.location = L || u.location;
      }
      if (u.project_id && pRows && !res.projects[u.project_id]) res.warnings.push({ sheet: uName, row: u._row, msg: "unknown_project" });
      seen[u.unit_id] = 1;
      res.units.push({ unit_id: u.unit_id, project_id: u.project_id, location: u.location, property_type: u.property_type, bedrooms: bed, area_sqm: area, price: price, status: st, payment_plan: u.payment_plan, down_pct: dp });
    });
    if (!res.units.length && !res.errors.length) res.errors.push({ sheet: uName, row: 2, msg: "empty" });
    return res;
  }

  return { write: write, read: read, parseCsv: parseCsv, importInventory: importInventory, UNIT_COLS: UNIT_COLS, PROJ_COLS: PROJ_COLS, STATUSES: STATUSES, _crc32: crc32 };
});
