import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Private Dog Boarding Syracuse",
  description:
    "Book private dog boarding Syracuse pet parents can trust. Choose dates, check small dog boarding Syracuse availability, and confirm your stay.",
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
