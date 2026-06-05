export default {
  title: 'Localized String',
  name: 'localeString',
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
      type: 'string',
    },
    {
      title: 'English',
      name: 'en',
      type: 'string',
    },
    {
      title: 'Français',
      name: 'fr',
      type: 'string',
    },
    {
      title: 'Deutsch',
      name: 'de',
      type: 'string',
    }
  ]
};
