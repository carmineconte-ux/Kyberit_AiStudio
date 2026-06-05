export default {
  title: 'Localized Text',
  name: 'localeText',
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
      type: 'text',
    },
    {
      title: 'English',
      name: 'en',
      type: 'text',
    },
    {
      title: 'Français',
      name: 'fr',
      type: 'text',
    },
    {
      title: 'Deutsch',
      name: 'de',
      type: 'text',
    }
  ]
};
