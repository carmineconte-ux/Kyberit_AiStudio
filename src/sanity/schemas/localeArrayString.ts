export default {
  title: 'Localized Array of Strings',
  name: 'localeArrayString',
  type: 'object',
  fieldsets: [
    {
      title: 'Translations',
      name: 'translations',
      options: { collapsible: true }
    }
  ],
  fields: [
    {
      title: 'Italiano',
      name: 'it',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      title: 'English',
      name: 'en',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      title: 'Français',
      name: 'fr',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      title: 'Deutsch',
      name: 'de',
      type: 'array',
      of: [{ type: 'string' }]
    }
  ]
};
