import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zaine's Stay & Play",
    short_name: "Zaine's",
    description:
      'Private, small-capacity dog boarding in Syracuse with owner-on-site care.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5efe5',
    theme_color: '#7c4a2d',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
