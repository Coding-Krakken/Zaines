export const siteConfig = {
  name: "Pawfect Stays",
  description: "Seattle's premier dog boarding, daycare, and grooming resort. Licensed, certified, and open 24/7 with luxury suites and expert care.",
  url: "https://pawfectstays.com",
  ogImage: "https://pawfectstays.com/og.jpg",
  links: {
    facebook: "https://facebook.com/pawfectstays",
    instagram: "https://instagram.com/pawfectstays",
    twitter: "https://twitter.com/pawfectstays",
  },
  contact: {
    phone: "(555) 123-4567",
    email: "hello@pawfectstays.com",
    address: "123 Pet Paradise Lane",
    city: "Seattle",
    state: "WA",
    zip: "98101",
  },
  hours: {
    weekday: "6:00 AM - 8:00 PM",
    weekend: "8:00 AM - 6:00 PM",
    available: "24/7 Supervision",
  },
  serviceArea: ["Seattle", "Bellevue", "Redmond", "Kirkland", "Renton", "Tacoma"],
};

export const navItems = [
  {
    title: "Services",
    href: "/services",
    children: [
      { title: "Dog Boarding", href: "/services/boarding" },
      { title: "Daycare", href: "/services/daycare" },
      { title: "Grooming", href: "/services/grooming" },
      { title: "Training", href: "/services/training" },
    ],
  },
  {
    title: "Suites",
    href: "/suites",
  },
  {
    title: "Pricing",
    href: "/pricing",
  },
  {
    title: "Gallery",
    href: "/gallery",
  },
  {
    title: "Reviews",
    href: "/reviews",
  },
  {
    title: "About",
    href: "/about",
  },
  {
    title: "Contact",
    href: "/contact",
  },
];

export const cities = ["Seattle", "Bellevue", "Redmond", "Kirkland", "Renton", "Tacoma"];
