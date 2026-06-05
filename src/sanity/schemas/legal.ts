import { defineType, defineField } from 'sanity'
import { Scale } from 'lucide-react'

export default defineType({
  name: 'legal',
  title: 'Documenti Legali',
  type: 'document',
  icon: Scale as any,
  fields: [
    defineField({
      name: 'title',
      title: 'Titolo Documento',
      type: 'string',
      description: 'Es: Privacy Policy o Cookie Policy',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      description: 'Il percorso della pagina (es: privacy-policy)',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Testo del Documento',
      type: 'localeText', // Uso localeText per supportare multilingua
      description: 'Inserisci il testo legale della policy',
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Data Ultimo Aggiornamento',
      type: 'date',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug.current',
    },
  },
})
