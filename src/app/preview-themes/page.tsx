import React from "react";

const themes = [
  { id: "01-ocean-breeze.html", name: "Ocean Breeze" },
  { id: "02-sunset-warmth.html", name: "Sunset Warmth" },
  { id: "03-forest-retreat.html", name: "Forest Retreat" },
  { id: "04-playful-rainbow.html", name: "Playful Rainbow" },
  { id: "05-luxury-gold.html", name: "Luxury Gold" },
  { id: "06-rustic-farmhouse.html", name: "Rustic Farmhouse" },
  { id: "07-modern-minimal.html", name: "Modern Minimal" },
  { id: "08-coastal-cottage.html", name: "Coastal Cottage" },
  { id: "09-urban-chic.html", name: "Urban Chic" },
  { id: "10-meadow-fresh.html", name: "Meadow Fresh" },
];

export const metadata = {
  title: "Theme previews - Zaine's Stay & Play",
  description: "Temporary preview page showing 10 theme variants.",
};

export default function Page() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Theme previews (temporary)</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Each card shows an embedded preview — click &quot;Open&quot; to view
          full page.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => (
          <div
            key={t.id}
            className="overflow-hidden rounded-lg border bg-card shadow-sm"
          >
            <div className="h-64 bg-muted">
              <iframe
                src={`/themes/${t.id}`}
                title={t.name}
                className="w-full h-full border-0"
              />
            </div>
            <div className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">
                  Preview of the exact site content with this theme
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground shadow-sm"
                  href={`/themes/${t.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        Remove this page when you&apos;ve chosen a theme.
      </div>
    </div>
  );
}
