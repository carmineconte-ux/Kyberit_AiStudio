import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import settings from './schemas/settings';
import service from './schemas/service';
import testimonial from './schemas/testimonial';

export const createSanityConfig = (projectId?: string, dataset?: string) => defineConfig({
  name: 'default',
  title: 'Kyberit Backend',
  projectId: projectId || import.meta.env.VITE_SANITY_PROJECT_ID || 'your-project-id',
  dataset: dataset || import.meta.env.VITE_SANITY_DATASET || 'production',
  basePath: '/admin',
  plugins: [structureTool(), visionTool()],
  schema: {
    types: [settings, service, testimonial],
  },
});

export const sanityConfig = createSanityConfig();
