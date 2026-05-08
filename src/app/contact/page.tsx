import { Metadata } from "next";
import ContactPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Contact Syracuse Dog Boarding Team",
  description:
    "Contact Zaine's Stay & Play for private dog boarding Syracuse support, small dog boarding Syracuse availability, and transparent care policy questions.",
};

export default function ContactPage() {
  return <ContactPageContent />;
}
