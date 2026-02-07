export const siteConfig = {
  name: "Zaine's Stay & Play",
  description: "Syracuse's premier dog boarding, daycare, and grooming resort. Licensed, certified, and open 24/7 with luxury suites and expert care.",
  url: "https://zainesstayandplay.com",
  ogImage: "https://zainesstayandplay.com/og.jpg",
  links: {
    facebook: "https://www.facebook.com/people/Zaines-Stay-Play/61550036005682/",
    instagram: "https://instagram.com/zainesstayandplay",
    twitter: "https://twitter.com/zainesstayandplay",
  },
  contact: {
    phone: "(315) 657-1332",
    email: "hello@zainesstayandplay.com",
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
  serviceArea: ["Syracuse", "Liverpool", "Cicero", "Baldwinsville", "Fayetteville", "Manlius"],
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

export const cities = ["Syracuse", "Liverpool", "Cicero", "Baldwinsville", "Fayetteville", "Manlius"];
