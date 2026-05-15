export const siteConfig = {
  name: "Paws & Play Doggy Daycare",
  description:
    "Fun, safe doggy daycare in Syracuse, NY with supervised play, enrichment activities, and tail-wagging care for your best friend.",
  url: "https://zainesstayandplay.com",
  ogImage: "https://zainesstayandplay.com/og-default.svg",
  links: {
    facebook:
      "https://www.facebook.com/people/Zaines-Stay-Play/61550036005682/",
    instagram: "https://instagram.com/zainesstayandplay",
    twitter: "https://twitter.com/zainesstayandplay",
  },
  contact: {
    phone: "(315) 555-PAWS",
    email: "hello@pawsandplaydaycare.com",
    address: "123 Pet Paradise Lane",
    city: "Syracuse",
    state: "NY",
    zip: "13202",
  },
  hours: {
    weekday: "6:00 AM - 8:00 PM",
    weekend: "8:00 AM - 6:00 PM",
    available: "24/7 Supervision",
  },
  serviceArea: [
    "Syracuse",
    "Liverpool",
    "Cicero",
    "Baldwinsville",
    "Fayetteville",
    "Manlius",
    "Clay",
    "North Syracuse",
  ],
};

type NavChildItem = {
  title: string;
  href: string;
};

type NavItem = {
  title: string;
  href: string;
  children?: NavChildItem[];
};

export const navItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
  },
  {
    title: "About Us",
    href: "/about",
  },
  {
    title: "Services",
    href: "/services/daycare",
  },
  {
    title: "Pricing",
    href: "/pricing",
  },
  {
    title: "Photo Gallery",
    href: "/gallery",
  },
  {
    title: "Reviews",
    href: "/reviews",
  },
  {
    title: "Contact",
    href: "/contact",
  },
];

export const cities = [
  "Syracuse",
  "Liverpool",
  "Cicero",
  "Baldwinsville",
  "Fayetteville",
  "Manlius",
  "Clay",
  "North Syracuse",
];
