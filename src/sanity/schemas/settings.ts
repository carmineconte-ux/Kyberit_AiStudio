export default {
  name: 'settings',
  title: 'Impostazioni Sito',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Titolo Sito',
      type: 'string',
    },
    {
      name: 'smtp',
      title: 'Configurazione SMTP',
      type: 'object',
      fields: [
        { name: 'host', title: 'Host', type: 'string' },
        { name: 'port', title: 'Porta', type: 'number' },
        { name: 'user', title: 'Utente', type: 'string' },
        { name: 'pass', title: 'Password', type: 'string', description: 'Nota: Per sicurezza è meglio usare variabili d\'ambiente, ma puoi configurarlo qui per demo.' },
        { name: 'from', title: 'Email Mittente', type: 'string' },
      ]
    },
    {
      name: 'iubenda',
      title: 'Iubenda',
      type: 'object',
      fields: [
        { name: 'siteId', title: 'Site ID', type: 'string' },
        { name: 'policyId', title: 'Policy ID', type: 'string' },
      ]
    },
    {
      name: 'turnstile',
      title: 'Cloudflare Turnstile',
      type: 'object',
      fields: [
        { name: 'siteKey', title: 'Site Key', type: 'string' },
        { name: 'secretKey', title: 'Secret Key', type: 'string' },
      ]
    }
  ]
}
