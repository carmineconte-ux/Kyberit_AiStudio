export default {
  name: 'testimonial',
  title: 'Testimonianza',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Nome',
      type: 'string',
    },
    {
      name: 'role',
      title: 'Ruolo / Azienda',
      type: 'localeString',
    },
    {
      name: 'quote',
      title: 'Citazione',
      type: 'localeText',
    },
    {
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'rating',
      title: 'Valutazione (1-5)',
      type: 'number',
      validation: (Rule: any) => Rule.min(1).max(5),
    }
  ]
}
