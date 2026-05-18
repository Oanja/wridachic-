/**
 * WridaChic — Google Sheets sync (Apps Script Web App)
 * ────────────────────────────────────────────────────
 * Deploy: Extensions → Apps Script → Deploy → New deployment →
 *   Type: Web app
 *   Execute as: Me
 *   Who has access: Anyone (no Google account needed)
 * Copy the /exec URL into Vercel env GOOGLE_SHEETS_WEBHOOK_URL.
 * Set Script property SECRET = same as GOOGLE_SHEETS_WEBHOOK_SECRET.
 *
 * Tabs created automatically:
 *   - "Commandes"  → live order ledger (one row per order, upserted by order_number)
 *   - "Historique" → daily backup snapshots, all stacked in one tab with date separator rows
 *   - "Dashboard"  → KPI summary (rebuilt by setup_dashboard action)
 *
 * Column layout (Commandes & Historique):
 *   A=Date  B=N°  C=Statut  D=Nom  E=Téléphone  F=Email
 *   G=Ville  H=Adresse  I=Articles  J=Total
 *   K=Raison annulation  L=Lang  M=Coût produit  N=Frais livraison  O=Marge brute
 *
 * Marge brute formula:  = J - M - N   (Total − cost_total − delivery_cost)
 */

const SHEET_ORDERS = 'Commandes';
const SHEET_BACKUP = 'Historique';
const SHEET_DASHBOARD = 'Dashboard';
const SHEET_ADS = 'Ads';

const ADS_HEADERS = ['Date', 'Montant (MAD)', 'Plateforme', 'Notes'];

const HEADERS = [
  'Date', 'N°', 'Statut', 'Nom', 'Téléphone', 'Email',
  'Ville', 'Adresse', 'Articles', 'Total',
  'Raison annulation', 'Lang', 'Coût produit', 'Frais livraison', 'Marge brute'
];
const COLS = HEADERS.length; // 15

const STATUS_COLORS = {
  'nouveau':                 '#FFF9C4', // pale yellow
  'confirmé':                '#C8E6C9', // green
  'expédié':                 '#BBDEFB', // blue
  'livré':                   '#A5D6A7', // darker green
  'annulé':                  '#FFCDD2', // red
  'modification demandée':   '#FFE0B2', // orange
};

const LANG_FLAG = { fr: '🇫🇷 FR', en: '🇬🇧 EN', ar: '🇲🇦 AR' };

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, reason: 'invalid-json' });
  }

  const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
  if (!secret || body.secret !== secret) {
    return json({ ok: false, reason: 'unauthorized' });
  }

  try {
    switch (body.action) {
      case 'upsert':
        return json(upsertOrder(body.order));
      case 'bulk_upsert':
        return json(bulkUpsertOrders(body.orders || []));
      case 'delete':
        return json(deleteOrder(body.orderNumber));
      case 'setup_dashboard':
        return json(setupDashboard());
      case 'snapshot':
        return json(snapshotOrders(body.tabName, body.orders || []));
      default:
        return json({ ok: false, reason: 'unknown-action: ' + body.action });
    }
  } catch (err) {
    return json({ ok: false, reason: String(err && err.message || err) });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Sheet helpers ─────────────────────────────────────────────────

function getOrCreateOrdersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ORDERS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ORDERS);
    sheet.getRange(1, 1, 1, COLS).setValues([HEADERS])
      .setFontWeight('bold')
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, COLS, 120);
    sheet.setRightToLeft(true); // Arabic-first reading layout
  }
  return sheet;
}

/**
 * Ads tab — daily ad spend tracker.
 * The admin manually enters one row per day (or per platform per day):
 *   Date | Montant (MAD) | Plateforme (FB/IG/TikTok) | Notes
 * Dashboard reads from here to compute CAC, ROAS, Marge nette.
 */
function getOrCreateAdsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ADS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ADS);
    sheet.getRange(1, 1, 1, ADS_HEADERS.length).setValues([ADS_HEADERS])
      .setFontWeight('bold')
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 120); // Date
    sheet.setColumnWidth(2, 140); // Montant
    sheet.setColumnWidth(3, 140); // Plateforme
    sheet.setColumnWidth(4, 260); // Notes
    // Pre-fill today's row as a hint for the admin.
    sheet.getRange(2, 1).setValue(new Date()).setNumberFormat('yyyy-mm-dd');
    sheet.getRange(2, 3).setValue('Facebook');
    // Format Date column nicely going forward.
    sheet.getRange('A2:A').setNumberFormat('yyyy-mm-dd');
    // Format Montant as currency.
    sheet.getRange('B2:B').setNumberFormat('#,##0 "MAD"');
    sheet.setRightToLeft(true); // Arabic-first reading layout
  }
  return sheet;
}

function getOrCreateBackupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_BACKUP);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_BACKUP);
    sheet.getRange(1, 1, 1, COLS).setValues([HEADERS])
      .setFontWeight('bold')
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, COLS, 120);
    sheet.setRightToLeft(true); // Arabic-first reading layout
  }
  return sheet;
}

function orderToRow(o, rowIndex) {
  const items = (o.items || [])
    .map(it => `${it.qty}× ${it.name} (${it.size}/${it.color})`)
    .join('\n');
  const dateStr = o.created_at ? new Date(o.created_at) : new Date();
  const langStr = o.lang && LANG_FLAG[o.lang] ? LANG_FLAG[o.lang] : (o.lang || '');
  const cost = typeof o.cost_total === 'number' ? o.cost_total : '';
  const delivery = typeof o.delivery_cost === 'number' ? o.delivery_cost : '';
  // Marge brute formula references the actual row so it always recomputes:
  const margeFormula = rowIndex
    ? `=IFERROR(J${rowIndex}-IFERROR(M${rowIndex},0)-IFERROR(N${rowIndex},0),"")`
    : '';
  return [
    dateStr,                  // A Date
    o.orderNumber || '',      // B N°
    o.status || 'nouveau',    // C Statut
    o.fullName || '',         // D Nom
    o.phone || '',            // E Téléphone
    o.email || '',            // F Email
    o.city || '',             // G Ville
    o.address || '',          // H Adresse
    items,                    // I Articles
    o.total || 0,             // J Total
    o.cancel_reason || '',    // K Raison annulation
    langStr,                  // L Lang
    cost,                     // M Coût produit
    delivery,                 // N Frais livraison
    margeFormula,             // O Marge brute (formula)
  ];
}

function findOrderRow(sheet, orderNumber) {
  if (!orderNumber) return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const numbers = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // column B
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i][0] === orderNumber) return i + 2;
  }
  return -1;
}

function applyStatusColor(sheet, row, status) {
  const color = STATUS_COLORS[status] || '#ffffff';
  sheet.getRange(row, 1, 1, COLS).setBackground(color);
}

// ─── Actions ───────────────────────────────────────────────────────

function upsertOrder(order) {
  const sheet = getOrCreateOrdersSheet();
  let row = findOrderRow(sheet, order.orderNumber);

  if (row === -1) {
    row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, COLS).setValues([orderToRow(order, row)]);
  } else {
    sheet.getRange(row, 1, 1, COLS).setValues([orderToRow(order, row)]);
  }
  applyStatusColor(sheet, row, order.status || 'nouveau');
  return { ok: true, row: row };
}

/**
 * Bulk upsert with O(N) complexity (was O(N*M) before — full column scan
 * per order). The naive loop became unusable past ~200 orders: every
 * findOrderRow re-read column B, and every applyStatusColor was its own
 * sheets-API roundtrip.
 *
 * New strategy:
 *   1. Read column B ONCE → build Map<orderNumber, rowIndex>
 *   2. Split incoming orders into UPDATES (already in sheet) and APPENDS (new)
 *   3. Batch-write each update individually (still 1 setValues per update,
 *      since rows aren't contiguous), but skip the scan
 *   4. Batch-write all APPENDS as a single big setValues call (huge win)
 *   5. Apply status colors with setBackgrounds(2D array) instead of N
 *      individual setBackground calls
 *
 * Result on 500-order syncs: ~30s → ~3s.
 */
function bulkUpsertOrders(orders) {
  if (!orders || orders.length === 0) return { ok: true, count: 0 };

  const sheet = getOrCreateOrdersSheet();
  const lastRow = sheet.getLastRow();

  // 1. Build the existing-row index in one read.
  const rowByNumber = {};
  if (lastRow >= 2) {
    const numbers = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i][0];
      if (num) rowByNumber[num] = i + 2;
    }
  }

  // 2. Sort into updates vs appends.
  const updates = [];   // {row, values, color}
  const appends = [];   // {orderObj}
  for (const o of orders) {
    const existingRow = rowByNumber[o.orderNumber];
    if (existingRow) {
      updates.push({
        row: existingRow,
        values: orderToRow(o, existingRow),
        color: STATUS_COLORS[o.status || 'nouveau'] || '#ffffff',
      });
    } else {
      appends.push(o);
    }
  }

  // 3. Apply updates (one setValues per row — unavoidable when rows are
  //    scattered, but we save the scan cost which was the real killer).
  for (const u of updates) {
    sheet.getRange(u.row, 1, 1, COLS).setValues([u.values]);
    sheet.getRange(u.row, 1, 1, COLS).setBackground(u.color);
  }

  // 4. Append all new rows in ONE batch call. This is the big win — going
  //    from N writes to 1 write when the user does a full backfill.
  if (appends.length > 0) {
    const startRow = sheet.getLastRow() + 1;
    const rows = appends.map((o, idx) => orderToRow(o, startRow + idx));
    sheet.getRange(startRow, 1, rows.length, COLS).setValues(rows);

    // setBackgrounds (plural) takes a 2D array of color strings — one
    // roundtrip instead of N. Each "row" of colors is a 1-element array
    // repeated COLS times because backgrounds are per-cell.
    const colors = appends.map((o) => {
      const c = STATUS_COLORS[o.status || 'nouveau'] || '#ffffff';
      return new Array(COLS).fill(c);
    });
    sheet.getRange(startRow, 1, colors.length, COLS).setBackgrounds(colors);
  }

  return {
    ok: true,
    count: orders.length,
    updated: updates.length,
    appended: appends.length,
  };
}

function deleteOrder(orderNumber) {
  const sheet = getOrCreateOrdersSheet();
  const row = findOrderRow(sheet, orderNumber);
  if (row === -1) return { ok: true, reason: 'not-found' };
  sheet.deleteRow(row);
  return { ok: true, reason: 'deleted', row: row };
}

/**
 * Daily backup: appends a date separator row + every order of the day
 * to the single "Historique" tab. Called by /api/cron/backup.
 *
 * Payload:  { tabName: "backup-2026-05-17", orders: [...] }
 *
 * We keep tabName for backwards compatibility but use it only as the
 * separator label — everything goes into one tab so old backups never
 * scroll off the tab bar.
 */
function snapshotOrders(tabName, orders) {
  const sheet = getOrCreateBackupSheet();
  const label = tabName || ('backup-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'));

  // Separator row: bold, dark background, spans all columns.
  const sepRow = sheet.getLastRow() + 1;
  const sepCell = sheet.getRange(sepRow, 1);
  sepCell.setValue('═══  ' + label + '  ·  ' + orders.length + ' commande(s)  ·  ' + new Date().toLocaleString('fr-FR') + '  ═══');
  sheet.getRange(sepRow, 1, 1, COLS)
    .merge()
    .setBackground('#1a1a1a')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');

  if (orders.length === 0) {
    return { ok: true, label: label, count: 0 };
  }

  // Write all order rows in one batch (much faster than row-by-row).
  const startRow = sepRow + 1;
  const rows = orders.map((o, idx) => orderToRow(o, startRow + idx));
  sheet.getRange(startRow, 1, rows.length, COLS).setValues(rows);

  // Apply status colors row-by-row (small N, fast enough).
  for (let i = 0; i < orders.length; i++) {
    applyStatusColor(sheet, startRow + i, orders[i].status || 'nouveau');
  }

  return { ok: true, label: label, count: orders.length, startRow: startRow };
}

// ─── Dashboard (KPI tab) ───────────────────────────────────────────

// ─── Section colors used by the side-by-side dashboard layout ──────
const DASH_H1_COLORS = {
  blue:   '#1976D2',
  green:  '#2E7D32',
  dark:   '#3D352E',
  clay:   '#C85C3F',
  purple: '#6A1B9A',
  orange: '#E65100',
};

const DASH_ROW_COLORS = {
  good: '#C8E6C9',
  warn: '#FFE0B2',
  bad:  '#FFCDD2',
  kpi:  '#E1F5FE',
};

/**
 * Draw a single dashboard section at (startRow, leftCol) with bilingual
 * labels. Each row is { label, formula, tag? } and `tag` is one of:
 *   header   → section title bar (merged across both columns)
 *   good/warn/bad/kpi → highlighted data row
 *   null     → regular data row
 *
 * Returns the next free row beneath the section so callers can stack
 * vertically inside one column.
 */
function drawDashSection(sheet, startRow, leftCol, headerColor, rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const r = startRow + i;
    sheet.getRange(r, leftCol).setValue(row.label);
    if (row.formula !== '') sheet.getRange(r, leftCol + 1).setValue(row.formula);

    if (row.tag === 'header') {
      sheet.getRange(r, leftCol, 1, 2).merge()
        .setFontWeight('bold').setFontSize(13)
        .setBackground(headerColor).setFontColor('#ffffff')
        .setHorizontalAlignment('left').setVerticalAlignment('middle')
        .setWrap(true);
      sheet.setRowHeight(r, 36);
    } else {
      const fill = DASH_ROW_COLORS[row.tag];
      if (fill) {
        sheet.getRange(r, leftCol, 1, 2).setBackground(fill);
      }
      if (row.tag === 'good' || row.tag === 'bad' || row.tag === 'kpi') {
        sheet.getRange(r, leftCol, 1, 2).setFontWeight('bold');
      }
      sheet.getRange(r, leftCol, 1, 2).setWrap(true).setVerticalAlignment('middle');
      sheet.setRowHeight(r, 44);
    }

    // Money formatting on the value cell — same heuristic as before.
    const label = String(row.label || '');
    if (/CA |Marge|Ads|Coût|CAC|Panier|Frais|encaissé|brut|nette|potentiel/i.test(label) && row.formula !== '' && !label.includes('ALERTE')) {
      sheet.getRange(r, leftCol + 1).setNumberFormat('#,##0 "MAD"');
    }
    if (label.includes('ROAS')) sheet.getRange(r, leftCol + 1).setNumberFormat('0.00"×"');
    if (label.includes('Taux')) sheet.getRange(r, leftCol + 1).setNumberFormat('0.0%');
  }
  return startRow + rows.length;
}

function setupDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // Ensure Orders + Ads tabs exist first — Google Sheets won't let us
  // delete the Dashboard if it's the only sheet, and the Dashboard formulas
  // will #REF if the Ads tab is missing.
  getOrCreateOrdersSheet();
  getOrCreateAdsSheet();
  let dash = ss.getSheetByName(SHEET_DASHBOARD);
  if (dash) ss.deleteSheet(dash);
  dash = ss.insertSheet(SHEET_DASHBOARD, 0);

  const O = `'${SHEET_ORDERS}'`;
  const J = `${O}!J2:J`;      // Total
  const C = `${O}!C2:C`;      // Statut
  const M = `${O}!M2:M`;      // Coût produit
  const N = `${O}!N2:N`;      // Frais livraison
  const Oo = `${O}!O2:O`;     // Marge brute
  const A = `${O}!A2:A`;      // Date commande

  const Ad = `'${SHEET_ADS}'`;
  const AdDate = `${Ad}!A2:A`;
  const AdAmt = `${Ad}!B2:B`;

  // Reusable date predicates
  const TODAY = `${A},">="&TODAY(),${A},"<"&TODAY()+1`;
  const WEEK = `${A},">="&TODAY()-WEEKDAY(TODAY(),3),${A},"<"&TODAY()+1`;
  const MONTH = `${A},">="&EOMONTH(TODAY(),-1)+1,${A},"<="&EOMONTH(TODAY(),0)`;
  const AD_TODAY = `${AdDate},">="&TODAY(),${AdDate},"<"&TODAY()+1`;
  const AD_WEEK = `${AdDate},">="&TODAY()-WEEKDAY(TODAY(),3),${AdDate},"<"&TODAY()+1`;
  const AD_MONTH = `${AdDate},">="&EOMONTH(TODAY(),-1)+1,${AdDate},"<="&EOMONTH(TODAY(),0)`;

  // Each entry: [label, formula, rowFormat?]
  //   rowFormat values: 'h1-*' (section header, color suffix), 'kpi'
  //   (highlighted KPI), 'good' (green), 'warn' (orange), 'bad' (red),
  //   'normal' (default)
  // Labels are bilingual: French on first line, Arabic on second line
  // (separated by \n — we enable wrap-text below so the cell shows both).
  const bi = (fr, ar) => fr + '\n' + ar;

  // ───── Side-by-side dashboard layout ──────────────────────────────
  //
  // Columns are organised in 4 visual blocks (one spacer col between):
  //
  //   A-B (statuts + potentiel + global)
  //   D-E (réel livré)
  //   G-H (today + week + month, stacked)
  //   J-K (performance pub + alerte)
  //
  // Each section is drawn independently with drawDashSection() and the
  // function returns the next free row so we can stack inside a column.

  // ── Title bar (full width across all 4 columns: A-K) ──────────────
  dash.getRange(1, 1).setValue('🏆  WridaChic — Tableau de bord  ·  لوحة القيادة');
  dash.getRange(1, 1, 1, 11).merge()
    .setFontSize(18).setFontWeight('bold')
    .setBackground('#1a1a1a').setFontColor('#ffffff')
    .setHorizontalAlignment('center').setVerticalAlignment('middle');
  dash.setRowHeight(1, 46);

  // ── Column A-B : STATUTS + POTENTIEL + GLOBAL (stacked) ───────────
  let next = 3;
  next = drawDashSection(dash, next, 1, DASH_H1_COLORS.blue, [
    { label: '📊  STATUTS  ·  حالات الطلبيات', formula: '', tag: 'header' },
    { label: bi('Commandes totales', 'مجموع الطلبيات'),       formula: `=COUNTA(${O}!B2:B)` },
    { label: bi('Nouvelles (à traiter)', 'جديدة (للمعالجة)'),  formula: `=COUNTIF(${C},"nouveau")`, tag: 'warn' },
    { label: bi('Confirmées', 'مؤكدة'),                        formula: `=COUNTIF(${C},"confirmé")` },
    { label: bi('Expédiées', 'مُرسلة'),                        formula: `=COUNTIF(${C},"expédié")` },
    { label: bi('Livrées', 'مُسلَّمة'),                         formula: `=COUNTIF(${C},"livré")`, tag: 'good' },
    { label: bi('Modifications demandées', 'تعديل مطلوب'),     formula: `=COUNTIF(${C},"modification demandée")` },
    { label: bi('Annulées', 'ملغاة'),                          formula: `=COUNTIF(${C},"annulé")`, tag: 'bad' },
  ]);
  next += 1;
  next = drawDashSection(dash, next, 1, DASH_H1_COLORS.blue, [
    { label: '📊  POTENTIEL  ·  محتمل', formula: '', tag: 'header' },
    { label: bi('Commandes actives', 'الطلبيات النشطة'),       formula: `=COUNTA(${O}!B2:B)-COUNTIF(${C},"annulé")` },
    { label: bi('CA potentiel', 'الرقم المحتمل'),              formula: `=SUMIFS(${J},${C},"<>annulé")` },
    { label: bi('Marge brute potentielle', 'الربح المحتمل'),   formula: `=SUMIFS(${Oo},${C},"<>annulé")` },
  ]);
  next += 1;
  drawDashSection(dash, next, 1, DASH_H1_COLORS.dark, [
    { label: '💸  GLOBAL  ·  الإجمالي', formula: '', tag: 'header' },
    { label: bi('Chiffre d\'affaires brut', 'رقم الأعمال الإجمالي'), formula: `=SUM(${J})` },
    { label: bi('Coût produits', 'تكلفة المنتجات'),            formula: `=SUM(${M})` },
    { label: bi('Frais livraison', 'تكلفة التوصيل'),           formula: `=SUM(${N})` },
    { label: bi('Marge brute totale', 'الربح الإجمالي'),       formula: `=SUM(${Oo})` },
    { label: bi('Total Ads dépensé', 'مجموع الإعلانات'),       formula: `=SUM(${AdAmt})` },
  ]);

  // ── Column D-E : RÉEL (livré only) ────────────────────────────────
  drawDashSection(dash, 3, 4, DASH_H1_COLORS.green, [
    { label: '📦  RÉEL — livrées uniquement  ·  حقيقي', formula: '', tag: 'header' },
    { label: bi('Commandes livrées', 'الطلبيات المُسلَّمة'),    formula: `=COUNTIF(${C},"livré")` },
    { label: bi('CA encaissé', 'المبلغ المُحَصَّل'),             formula: `=SUMIFS(${J},${C},"livré")`, tag: 'good' },
    { label: bi('Coût produits livrés', 'تكلفة المنتجات'),     formula: `=SUMIFS(${M},${C},"livré")` },
    { label: bi('Frais livraison réels', 'تكلفة التوصيل'),     formula: `=SUMIFS(${N},${C},"livré")` },
    { label: bi('Marge brute livrée', 'الربح الإجمالي'),       formula: `=SUMIFS(${Oo},${C},"livré")` },
    { label: bi('Marge nette (− ads)', 'الربح الصافي'),         formula: `=IFERROR(SUMIFS(${Oo},${C},"livré")-SUM(${AdAmt}),0)`, tag: 'good' },
  ]);

  // ── Column G-H : Today + Week + Month (stacked) ───────────────────
  next = 3;
  next = drawDashSection(dash, next, 7, DASH_H1_COLORS.clay, [
    { label: '📅  AUJOURD\'HUI  ·  اليوم', formula: '', tag: 'header' },
    { label: bi('Commandes livrées', 'الطلبيات المُسلَّمة'),    formula: `=COUNTIFS(${C},"livré",${TODAY})` },
    { label: bi('CA encaissé', 'المُحَصَّل'),                    formula: `=SUMIFS(${J},${C},"livré",${TODAY})` },
    { label: bi('Marge brute', 'الربح الإجمالي'),              formula: `=SUMIFS(${Oo},${C},"livré",${TODAY})` },
    { label: bi('Ads dépensé', 'الإعلانات'),                   formula: `=SUMIFS(${AdAmt},${AD_TODAY})`, tag: 'warn' },
    { label: bi('Marge nette', 'الربح الصافي'),                formula: `=IFERROR(SUMIFS(${Oo},${C},"livré",${TODAY})-SUMIFS(${AdAmt},${AD_TODAY}),0)`, tag: 'good' },
  ]);
  next += 1;
  next = drawDashSection(dash, next, 7, DASH_H1_COLORS.clay, [
    { label: '📆  CETTE SEMAINE  ·  هذا الأسبوع', formula: '', tag: 'header' },
    { label: bi('Commandes livrées', 'الطلبيات المُسلَّمة'),    formula: `=COUNTIFS(${C},"livré",${WEEK})` },
    { label: bi('CA encaissé', 'المُحَصَّل'),                    formula: `=SUMIFS(${J},${C},"livré",${WEEK})` },
    { label: bi('Marge brute', 'الربح الإجمالي'),              formula: `=SUMIFS(${Oo},${C},"livré",${WEEK})` },
    { label: bi('Ads dépensé', 'الإعلانات'),                   formula: `=SUMIFS(${AdAmt},${AD_WEEK})`, tag: 'warn' },
    { label: bi('Marge nette', 'الربح الصافي'),                formula: `=IFERROR(SUMIFS(${Oo},${C},"livré",${WEEK})-SUMIFS(${AdAmt},${AD_WEEK}),0)`, tag: 'good' },
  ]);
  next += 1;
  drawDashSection(dash, next, 7, DASH_H1_COLORS.clay, [
    { label: '🗓️  CE MOIS  ·  هذا الشهر', formula: '', tag: 'header' },
    { label: bi('Commandes livrées', 'الطلبيات المُسلَّمة'),    formula: `=COUNTIFS(${C},"livré",${MONTH})` },
    { label: bi('CA encaissé', 'المُحَصَّل'),                    formula: `=SUMIFS(${J},${C},"livré",${MONTH})` },
    { label: bi('Marge brute', 'الربح الإجمالي'),              formula: `=SUMIFS(${Oo},${C},"livré",${MONTH})` },
    { label: bi('Ads dépensé', 'الإعلانات'),                   formula: `=SUMIFS(${AdAmt},${AD_MONTH})`, tag: 'warn' },
    { label: bi('Marge nette', 'الربح الصافي'),                formula: `=IFERROR(SUMIFS(${Oo},${C},"livré",${MONTH})-SUMIFS(${AdAmt},${AD_MONTH}),0)`, tag: 'good' },
  ]);

  // ── Column J-K : Performance Pub + Alerte ─────────────────────────
  next = 3;
  next = drawDashSection(dash, next, 10, DASH_H1_COLORS.purple, [
    { label: '🎯  PERFORMANCE PUB (ce mois)  ·  أداء الإعلانات', formula: '', tag: 'header' },
    { label: bi('CAC — Coût d\'acquisition', 'تكلفة جلب عميل'), formula: `=IFERROR(SUMIFS(${AdAmt},${AD_MONTH})/COUNTIFS(${C},"confirmé",${MONTH}),0)`, tag: 'kpi' },
    { label: bi('Panier moyen confirmé', 'متوسط السلة'),       formula: `=IFERROR(SUMIFS(${J},${C},"confirmé",${MONTH})/COUNTIFS(${C},"confirmé",${MONTH}),0)`, tag: 'kpi' },
    { label: bi('Marge moyenne par commande', 'متوسط الربح'), formula: `=IFERROR(SUMIFS(${Oo},${C},"confirmé",${MONTH})/COUNTIFS(${C},"confirmé",${MONTH}),0)`, tag: 'kpi' },
    { label: bi('ROAS — Retour sur pub (×)', 'العائد على الإعلان'), formula: `=IFERROR(SUMIFS(${J},${C},"confirmé",${MONTH})/SUMIFS(${AdAmt},${AD_MONTH}),0)`, tag: 'kpi' },
    { label: bi('Taux de confirmation', 'نسبة التأكيد'),       formula: `=IFERROR(COUNTIFS(${C},"confirmé",${MONTH})/COUNTIFS(${MONTH}),0)`, tag: 'kpi' },
  ]);
  next += 1;
  drawDashSection(dash, next, 10, DASH_H1_COLORS.orange, [
    { label: '⚠️  ALERTE RENTABILITÉ  ·  تنبيه الربحية', formula: '', tag: 'header' },
    { label: bi('Statut', 'الحالة'), formula: `=IFS(COUNTIFS(${C},"confirmé",${MONTH})=0,"⏳ Pas encore de commande confirmée ce mois",SUMIFS(${AdAmt},${AD_MONTH})=0,"⚪ Pas de pub ce mois",IFERROR(SUMIFS(${Oo},${C},"confirmé",${MONTH})/COUNTIFS(${C},"confirmé",${MONTH}),0)>IFERROR(SUMIFS(${AdAmt},${AD_MONTH})/COUNTIFS(${C},"confirmé",${MONTH}),0),"✅ Rentable — marge > CAC",TRUE,"❌ Tu perds de l'argent — CAC > marge moyenne")`, tag: 'kpi' },
  ]);

  // ── Column widths ──────────────────────────────────────────────────
  // Each section uses 2 cols (label + value). Spacer cols between blocks.
  dash.setColumnWidth(1, 230);  // A label
  dash.setColumnWidth(2, 140);  // B value
  dash.setColumnWidth(3, 16);   // C spacer
  dash.setColumnWidth(4, 230);  // D label
  dash.setColumnWidth(5, 140);  // E value
  dash.setColumnWidth(6, 16);   // F spacer
  dash.setColumnWidth(7, 230);  // G label
  dash.setColumnWidth(8, 140);  // H value
  dash.setColumnWidth(9, 16);   // I spacer
  dash.setColumnWidth(10, 240); // J label
  dash.setColumnWidth(11, 140); // K value

  dash.setFrozenRows(1);

  // RTL — Arabic-first reading direction.
  // Locks in the preferred direction so we don't lose it on every
  // setupDashboard rebuild. setRightToLeft(true) flips column A to the
  // right edge of the sheet, which matches how the bilingual labels
  // (French + Arabic) flow most naturally for an Arabic reader.
  dash.setRightToLeft(true);

  return { ok: true, layout: 'side-by-side', rtl: true };
}

