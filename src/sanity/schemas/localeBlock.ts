export default {
  title: 'Localized Rich Text',
  name: 'localeBlock',
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
      of: [{ type: 'block' }],
    },
    {
      title: 'English',
      name: 'en',
      type: 'array',
      of: [{ type: 'block' }],
      fieldset: 'translations',
    },
    {
      title: 'Français',
      name: 'fr',
      type: 'array',
      of: [{ type: 'block' }],
      fieldset: 'translations',
    },
    {
      title: 'Español',
      name: 'es',
      type: 'array',
      of: [{ type: 'block' }],
      fieldset: 'translations',
    },
    {
      title: 'Deutsch',
      name: 'de',
      type: 'array',
      of: [{ type: 'block' }],
      fieldset: 'translations',
    }
  ]
}
