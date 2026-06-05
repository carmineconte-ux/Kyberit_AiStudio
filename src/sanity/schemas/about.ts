export default {
  name: 'about',
  title: 'Identity & Vision',
  type: 'document',
  fields: [
    { name: 'badge', title: 'Badge', type: 'localeString' },
    { name: 'title', title: 'Titolo Principale', type: 'localeString' },
    { name: 'pilotTitle', title: 'Titolo Timoniere', type: 'localeString' },
    { name: 'pilotDesc', title: 'Descrizione Timoniere (HTML)', type: 'localeText' },
    { name: 'founderTitle', title: 'Titolo Founder', type: 'localeString' },
    { name: 'founderDesc', title: 'Descrizione Founder (HTML)', type: 'localeText' },
  ]
}
