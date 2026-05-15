import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zaine's Stay & Play",
    short_name: "Zaine's Stay & Play",
    description:
      'Fun, safe doggy daycare in Syracuse, NY with supervised play, enrichment activities, and tail-wagging care.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFDF5',
    theme_color: '#4FC3F7',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
