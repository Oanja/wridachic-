// Generates a Word document with the Tailscale + Remote Access setup
// guide for the wridachic PC. Saves to Desktop.
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, LevelFormat, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageBreak,
} from 'docx';

const FONT = 'Calibri';
const ACCENT = '2E75B6';
const SOFT_BG = 'F2F2F2';
const SUCCESS_BG = 'E2F0D9';
const WARN_BG = 'FFF2CC';
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

const r = (text, opts = {}) => new TextRun({ text, font: FONT, ...opts });
const p = (children, opts = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [r(children)],
  spacing: { after: 120 },
  ...opts,
});
const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  children: [new TextRun({ text, font: FONT, bold: true, size: 36, color: ACCENT })],
  spacing: { before: 360, after: 200 },
});
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  children: [new TextRun({ text, font: FONT, bold: true, size: 28, color: '1F3864' })],
  spacing: { before: 280, after: 160 },
});
const bullet = (text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  children: [r(text)],
  spacing: { after: 80 },
});
const num = (text) => new Paragraph({
  numbering: { reference: 'nums', level: 0 },
  children: [r(text)],
  spacing: { after: 80 },
});

// Reusable info / warning box (single-cell table).
const box = (text, fill) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({
    children: [new TableCell({
      borders: BORDERS,
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 160, bottom: 160, left: 200, right: 200 },
      children: text.split('\n').map((line) => new Paragraph({
        children: [r(line)],
        spacing: { after: 60 },
      })),
    })],
  })],
});

const codeBox = (text) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [9360],
  rows: [new TableRow({
    children: [new TableCell({
      borders: BORDERS,
      width: { size: 9360, type: WidthType.DXA },
      shading: { fill: '1E1E1E', type: ShadingType.CLEAR },
      margins: { top: 160, bottom: 160, left: 200, right: 200 },
      children: text.split('\n').map((line) => new Paragraph({
        children: [new TextRun({ text: line || ' ', font: 'Consolas', color: 'E5E5E5', size: 20 })],
        spacing: { after: 40 },
      })),
    })],
  })],
});

// Simple 2-col info table for the PC summary.
const infoTable = (rows) => new Table({
  width: { size: 9360, type: WidthType.DXA },
  columnWidths: [3500, 5860],
  rows: rows.map((row, i) => new TableRow({
    children: row.map((cell, j) => new TableCell({
      borders: BORDERS,
      width: { size: j === 0 ? 3500 : 5860, type: WidthType.DXA },
      shading: { fill: i === 0 ? ACCENT : (i % 2 ? SOFT_BG : 'FFFFFF'), type: ShadingType.CLEAR },
      margins: { top: 100, bottom: 100, left: 150, right: 150 },
      children: [new Paragraph({
        children: [new TextRun({
          text: cell,
          font: FONT,
          bold: i === 0,
          color: i === 0 ? 'FFFFFF' : '000000',
        })],
      })],
    })),
  })),
});

const doc = new Document({
  creator: 'Claude · wridachic setup',
  title: 'Tailscale + Remote Access — Guide d\'installation',
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: FONT, color: ACCENT },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: FONT, color: '1F3864' },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: 'nums', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children: [
      // ── Title ─────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: 'Accès à distance au PC — wridachic',
          font: FONT, bold: true, size: 44, color: ACCENT,
        })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: 'Tailscale + Sleep désactivé — accès depuis le téléphone',
          font: FONT, italics: true, size: 22, color: '595959',
        })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({
          text: 'Préparé par Claude · 19 mai 2026',
          font: FONT, size: 18, color: '7F7F7F',
        })],
        spacing: { after: 400 },
      }),

      // ── Pourquoi pas Wake on LAN ──────────────────────
      h1('1. Pourquoi pas Wake on LAN (WoL) classique ?'),
      p('Le PC est connecté en WiFi (pas en Ethernet). Wake on LAN ne fonctionne pas de manière fiable sur WiFi — la carte WiFi s\'éteint complètement en mode Sleep, donc impossible de recevoir le « magic packet » de réveil.'),
      p('La meilleure solution pour ton setup : empêcher le PC de se mettre en veille, et utiliser Tailscale (déjà installé !) pour t\'y connecter de n\'importe où.'),

      box(
        '✓ Tailscale est déjà installé et fonctionne sur ton PC.\n' +
        '✓ Pas besoin de configuration réseau compliquée (port forwarding, DDNS…).\n' +
        '✓ Fonctionne même depuis l\'extérieur de la maison (4G, WiFi public, etc.).',
        SUCCESS_BG,
      ),
      p(' '),

      // ── Infos du PC ───────────────────────────────────
      h1('2. Infos techniques de ton PC'),
      p('Ces infos ont été récupérées automatiquement le 19 mai 2026 :'),
      infoTable([
        ['Paramètre', 'Valeur'],
        ['Adaptateur réseau', 'WiFi (RZ616 Wi-Fi 6E 160MHz)'],
        ['Adresse MAC WiFi', 'C8-A3-E8-5B-A8-15'],
        ['IP locale (WiFi)', '192.168.11.100'],
        ['IP Tailscale (à utiliser)', '100.110.250.55'],
        ['Vitesse WiFi', '866.7 Mbps'],
      ]),
      p(' '),
      box(
        '👉 L\'IP Tailscale 100.110.250.55 est celle que tu utiliseras depuis ton téléphone\n' +
        '   pour te connecter au PC, où que tu sois dans le monde.',
        WARN_BG,
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ── Étape 1 : Sleep désactivé ─────────────────────
      h1('3. Étape 1 — Désactiver Sleep + Hibernate'),
      p('Cette étape a déjà été faite automatiquement via PowerShell. Le PC ne se mettra plus jamais en veille.'),
      h2('Commandes exécutées :'),
      codeBox(
        'powercfg /change standby-timeout-ac 0\n' +
        'powercfg /change standby-timeout-dc 0\n' +
        'powercfg /change hibernate-timeout-ac 0\n' +
        'powercfg /change hibernate-timeout-dc 0',
      ),
      p(' '),
      h2('L\'écran s\'éteint après 5 minutes (pour économiser l\'électricité) :'),
      codeBox(
        'powercfg /change monitor-timeout-ac 5\n' +
        'powercfg /change monitor-timeout-dc 5',
      ),
      p(' '),
      box(
        '✓ Le PC reste allumé en permanence.\n' +
        '✓ L\'écran s\'éteint tout seul après 5 min d\'inactivité.\n' +
        '✓ Consommation : ~10-30 W = environ 5-15 MAD/mois.',
        SUCCESS_BG,
      ),

      // ── Étape 2 : Réglages manuels ────────────────────
      h1('4. Étape 2 — Réglages manuels (Control Panel)'),
      p('À faire manuellement (ne peut pas être automatisé) :'),
      num('Appuie sur Windows + R, tape : control puis Entrée.'),
      num('Va dans Power Options → à gauche : « Choose what closing the lid does ».'),
      num('Change « When I close the lid » à « Do nothing » (au moins pour Plugged in).'),
      num('Clique sur « Change settings that are currently unavailable ».'),
      num('Décoche ❌ « Turn on fast startup ».'),
      num('Clique Save changes.'),
      p(' '),
      box(
        'Pourquoi ? Pour que le PC reste allumé même si tu refermes le couvercle du laptop.',
        WARN_BG,
      ),

      new Paragraph({ children: [new PageBreak()] }),

      // ── Étape 3 : Tailscale sur téléphone ─────────────
      h1('5. Étape 3 — Installer Tailscale sur ton téléphone'),
      h2('Android :'),
      num('Ouvre Google Play Store.'),
      num('Cherche « Tailscale ».'),
      num('Installe l\'application.'),
      h2('iPhone :'),
      num('Ouvre l\'App Store.'),
      num('Cherche « Tailscale ».'),
      num('Installe l\'application.'),
      h2('Après l\'installation :'),
      num('Ouvre l\'app Tailscale.'),
      num('Connecte-toi avec le MÊME compte (Google / Microsoft / email) que celui utilisé sur le PC.'),
      num('Tu verras « My PC » dans la liste — clique dessus pour voir l\'IP : 100.110.250.55.'),

      // ── Étape 4 : Utilisation ─────────────────────────
      h1('6. Étape 4 — Comment l\'utiliser ?'),
      h2('Option A — Termius (pour Claude Code en SSH) :'),
      p('C\'est probablement ce que tu utilises déjà. Configure ton hôte SSH avec :'),
      codeBox(
        'Host: 100.110.250.55\n' +
        'Port: 22\n' +
        'User: (ton utilisateur Windows)',
      ),
      p('Et tu pourras accéder à Claude Code depuis n\'importe où.'),
      p(' '),
      h2('Option B — Microsoft Remote Desktop (écran complet) :'),
      num('Sur le PC : Settings → System → Remote Desktop → Enable.'),
      num('Sur le téléphone : installe « Microsoft Remote Desktop » (Android / iPhone).'),
      num('Ajoute un PC avec l\'IP : 100.110.250.55.'),
      num('Username + Password = ceux de ton compte Windows.'),
      num('Tu verras ton écran de PC en entier sur le téléphone !'),

      new Paragraph({ children: [new PageBreak()] }),

      // ── Résumé ────────────────────────────────────────
      h1('7. Résumé du setup'),
      infoTable([
        ['Composant', 'Statut'],
        ['PC sleep', '❌ Désactivé (PC reste allumé)'],
        ['Écran', '✓ S\'éteint après 5 min (économie d\'énergie)'],
        ['Fast Startup', '⚠ À désactiver manuellement (Control Panel)'],
        ['Lid close action', '⚠ À régler sur « Do nothing »'],
        ['Tailscale (PC)', '✓ Installé et actif'],
        ['Tailscale (téléphone)', '⚠ À installer'],
        ['IP Tailscale', '100.110.250.55'],
        ['IP WiFi locale', '192.168.11.100'],
      ]),

      // ── Workflow ──────────────────────────────────────
      h1('8. Ton nouveau workflow'),
      codeBox(
        'Matin   →  Tu sors de la maison, PC allumé écran éteint\n' +
        'Partout →  Tu ouvres Termius → Tailscale → connect → Claude Code !\n' +
        'Soir    →  Tu rentres, tu travailles normalement sur le PC',
      ),

      // ── Conseils ──────────────────────────────────────
      h1('9. Conseils & dépannage'),
      bullet('Si Tailscale ne se connecte pas : vérifie que tu utilises le MÊME compte sur le PC et le téléphone.'),
      bullet('Si le PC ne répond pas : vérifie qu\'il est bien allumé (l\'écran peut être éteint mais le PC doit tourner).'),
      bullet('Pour économiser plus d\'électricité : éteins l\'écran manuellement quand tu sors.'),
      bullet('Pour la sécurité : Tailscale chiffre tout — personne d\'autre que toi ne peut accéder au PC.'),
      bullet('Coût électrique : ~10-30 W = 5-15 MAD/mois. Très raisonnable.'),

      p(' '),
      box(
        '🎯 Une fois Tailscale installé sur le téléphone + Fast Startup désactivé,\n' +
        '   tu pourras accéder à ton PC (et à Claude Code) de n\'importe où dans le monde,\n' +
        '   24/7, sans aucune configuration réseau supplémentaire.',
        SUCCESS_BG,
      ),

      // ── Footer ────────────────────────────────────────
      new Paragraph({ spacing: { before: 600 }, children: [new TextRun({
        text: '— Fin du guide —', font: FONT, italics: true, color: '7F7F7F',
      })], alignment: AlignmentType.CENTER }),
    ],
  }],
});

const outPath = path.join(os.homedir(), 'Desktop', 'Tailscale-Remote-Access-Guide.docx');
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log('Saved:', outPath);
