const fs = require('fs');
const translations = require('c:/sitinew/Kyberit_AiStudio-main/src/temp_translations.js');
const path = 'C:/Users/carmi/.gemini/antigravity/brain/643d2d56-fd52-4892-bdb5-3dac382c14ff/testi_per_sanity.md';

let md = '# Testi Completi del Sito per Sanity\n\n';
md += '> Qui troverai tutti i testi organizzati per sezione per un facile copia-incolla all\\'interno di Sanity.\n\n';

const langs = ['it', 'en', 'fr', 'de'];

// 1. IDENTITY & VISION (About)
md += '## 1. IDENTITY & VISION (About)\n\n';
const aboutKeys = ['badge', 'title', 'founderTitle', 'founderDesc', 'pilotTitle', 'pilotDesc'];
aboutKeys.forEach(k => {
  md += `### Campo: ${k}\n`;
  langs.forEach(l => {
    md += `- **${l.toUpperCase()}**: ${translations[l].translation.about[k]}\n`;
  });
  md += '\n';
});

// 2. SERVIZI (Services)
md += '## 2. SERVIZI (Services)\n\n';
const sKeys = Object.keys(translations.it.translation.services.items);
sKeys.forEach(s => {
  md += `### Servizio: ${s}\n`;
  const fKeys = ['title', 'sub', 'desc'];
  fKeys.forEach(k => {
    md += `#### Campo: ${k}\n`;
    langs.forEach(l => {
      md += `- **${l.toUpperCase()}**: ${translations[l].translation.services.items[s][k]}\n`;
    });
    md += '\n';
  });
  
  md += `#### Campo: features (Punti elenco)\n`;
  langs.forEach(l => {
    md += `- **${l.toUpperCase()}**:\n`;
    translations[l].translation.services.items[s].features.forEach(f => {
      md += `  - ${f}\n`;
    });
  });
  md += '\n';
});

// 3. PROTOCOLLI SLA (Pricing)
md += '## 3. PROTOCOLLI SLA (Pricing)\n\n';
const pKeys = ['oneShot', 'shield', 'enterprise'];
pKeys.forEach(p => {
  md += `### Pacchetto: ${p}\n`;
  const fKeys = ['title', 'subtitle', 'price', 'period'];
  fKeys.forEach(k => {
    md += `#### Campo: ${k}\n`;
    langs.forEach(l => {
      md += `- **${l.toUpperCase()}**: ${translations[l].translation.pricing[p][k]}\n`;
    });
    md += '\n';
  });

  md += `#### Campo: features (Punti elenco)\n`;
  langs.forEach(l => {
    md += `- **${l.toUpperCase()}**:\n`;
    translations[l].translation.pricing[p].features.forEach(f => {
      md += `  - ${f}\n`;
    });
  });
  md += '\n';
});

// 4. TESTIMONIALS
md += '## 4. TESTIMONIALS\n\n';
const tItems = translations.it.translation.testimonials.items;
tItems.forEach((_, idx) => {
  md += `### Testimonial ${idx + 1}\n`;
  const keys = ['name', 'role', 'quote'];
  keys.forEach(k => {
    md += `#### Campo: ${k}\n`;
    langs.forEach(l => {
      md += `- **${l.toUpperCase()}**: ${translations[l].translation.testimonials.items[idx][k]}\n`;
    });
    md += '\n';
  });
  md += '\n';
});

fs.writeFileSync(path, md, 'utf-8');
