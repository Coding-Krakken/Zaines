import type { Metadata } from "next";
import { simplePageMetadataFromSettings } from "@/lib/seo-page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return simplePageMetadataFromSettings({
    title: "Book Private Dog Boarding Syracuse",
    description:
      "Book private dog boarding Syracuse pet parents can trust. Choose dates, check small dog boarding Syracuse availability, and confirm your stay.",
    canonicalPath: "/book",
  });
}

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
