import { createClient } from '@sanity/client';

export const getSanityClient = (projectId: string, dataset: string = 'production') => {
  return createClient({
    projectId,
    dataset,
    useCdn: true,
    apiVersion: '2024-03-11',
  });
};
