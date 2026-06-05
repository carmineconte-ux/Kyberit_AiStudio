export default {
  name: 'pricingTier',
  title: 'Protocollo SLA (Pricing)',
  type: 'document',
  fields: [
    { name: 'subtitle', title: 'Badge / Sottotitolo', type: 'localeString' },
    { name: 'title', title: 'Nome Protocollo', type: 'localeString' },
    { name: 'price', title: 'Prezzo', type: 'localeString' },
    { name: 'period', title: 'Periodo (es. /mese)', type: 'localeString' },
    { name: 'features', title: 'Funzionalità Incluse', type: 'localeArrayString' },
    { 
      name: 'icon', 
      title: 'Icona', 
      type: 'string', 
      description: 'Nome dell\'icona Lucide (es. Target, Shield, Crown)',
      initialValue: 'Target'
    },
    { 
      name: 'styleKey', 
      title: 'Stile Visivo', 
      type: 'string', 
      options: { 
        list: [
          { title: 'Standard (Bianco/Ciano)', value: 'default' },
          { title: 'Avanzato (Blu)', value: 'blue' },
          { title: 'Enterprise (Oro)', value: 'gold' }
        ]
      },
      initialValue: 'default'
    },
    { name: 'order', title: 'Ordine di visualizzazione', type: 'number' }
  ]
}
