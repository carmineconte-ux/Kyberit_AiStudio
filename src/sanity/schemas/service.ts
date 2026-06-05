export default {
  name: 'service',
  title: 'Servizio',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Titolo',
      type: 'localeString',
    },
    {
      name: 'subtitle',
      title: 'Sottotitolo',
      type: 'localeString',
    },
    {
      name: 'description',
      title: 'Descrizione',
      type: 'localeText',
    },
    {
      name: 'features',
      title: 'Funzionalità (Elenco)',
      type: 'localeArrayString',
    },
    {
      name: 'icon',
      title: 'Icona (Lucide name)',
      type: 'string',
      description: 'Esempio: Globe, Shield, Zap',
    },
    {
      name: 'image',
      title: 'Immagine',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'order',
      title: 'Ordine',
      type: 'number',
    }
  ]
}
