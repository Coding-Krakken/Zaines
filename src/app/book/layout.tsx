import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book | Zaine's Stay & Play",
  description:
    "Book your pet's stay with Zaine's Stay & Play. Select your dates, confirm availability, and complete your reservation.",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
