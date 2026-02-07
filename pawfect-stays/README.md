# 🐾 Pawfect Stays

A modern, full-featured dog boarding, daycare, and grooming website built with Next.js 15, TypeScript, and Tailwind CSS.

## ✨ Features Implemented

### Core Pages
- **Homepage** - Hero section, services overview, testimonials, and CTAs
- **About Us** - Company story, team, values, and certifications
- **Contact** - Contact form, location map, hours, and social links

### Service Pages
- **Dog Boarding** - Suite options, daily schedule, pricing, requirements
- **Daycare** - Full-day care programs, packages, and pricing
- **Grooming** - Bath packages, full groom services, spa treatments
- **Training** - Puppy preschool, obedience classes, private sessions

### Interactive Features
- **Booking Funnel** - Multi-step form with date selection, service type, suite choice, and contact info
- **Dog Mode** 🐶 - Unique dog-friendly interface with:
  - Large "Boop Me!" interaction button
  - Daily schedule display
  - Treat meter gamification
  - Accessibility toggles (high contrast, low motion)
  - Calm Mode with ambient animations

### Navigation
- **Responsive Header** - Desktop navigation with dropdowns
- **Mobile Menu** - Slide-out drawer with accordion navigation
- **Footer** - Comprehensive links, contact info (NAP), social media
- **User Account Menu** - Sign in/out, dashboard links (ready for auth)

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (25+ components)
- **Database:** Prisma ORM + PostgreSQL (schema ready)
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation (prepared)
- **Auth:** NextAuth.js v5 (configured, not yet implemented)
- **Payments:** Stripe (configured, not yet implemented)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (optional for now)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd pawfect-stays
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` and configure required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (required for database operations)
  - Format: `postgresql://user:password@localhost:5432/database_name`
  - Example: `postgresql://postgres:password@localhost:5432/pawfect_stays`
  - **Behavior without DATABASE_URL:**
    - Development: App starts with warning, DB operations return 503
    - Production: App fails to start with clear error message

4. Set up the database (if using PostgreSQL)
```bash
# Generate Prisma Client (MUST run before build/typecheck)
npm run prisma:generate

# Run database migrations (creates tables and schema)
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

**Important Prisma Commands:**
- `npm run prisma:generate` - Generate Prisma Client from schema (run after clone or schema changes)
- `npm run prisma:migrate` - Apply database migrations in development
- `npm run prisma:studio` - Open visual database browser

5. Run tests

```bash
# Run all tests with vitest
npm test

# Run TypeScript type checking
npm run typecheck

# Run Prisma smoke test (no network/DB required)
npm run test:smoke

# Run comprehensive Prisma test (generates client + smoke test)
npm run test:prisma
```

**Expected test:smoke output:**
```
⚠️  DATABASE_URL is not set. Database operations will fail.
   To fix: Create a .env file with DATABASE_URL=postgresql://localhost:5432/dbname
✓ Prisma client imported successfully
✓ Type: object
✓ No "engine type client requires adapter" error
✓ prisma.$connect exists
✓ isDatabaseConfigured helper exists
✓ Database configured: false

✅ All smoke tests passed!
```

6. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
pawfect-stays/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── about/             # About page
│   │   ├── contact/           # Contact page
│   │   ├── services/          # Service pages
│   │   │   ├── boarding/
│   │   │   ├── daycare/
│   │   │   ├── grooming/
│   │   │   └── training/
│   │   ├── book/              # Booking funnel
│   │   ├── dog/               # Dog Mode feature
│   │   │   └── calm/          # Calm Mode
│   │   ├── layout.tsx         # Root layout with header/footer
│   │   └── page.tsx           # Homepage
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── site-header.tsx    # Main navigation header
│   │   ├── site-footer.tsx    # Footer
│   │   ├── main-nav.tsx       # Desktop navigation
│   │   ├── mobile-nav.tsx     # Mobile menu
│   │   └── user-nav.tsx       # User account dropdown
│   ├── config/                # Configuration files
│   │   └── site.ts            # Site config (NAP, nav, etc.)
│   └── lib/                   # Utility functions
│       ├── prisma.ts          # Prisma client
│       └── utils.ts           # Helper utilities
├── prisma/
│   └── schema.prisma          # Database schema (22 models)
├── COMPETITIVE_EDGE_PLAN.md   # Strategy document
├── PROJECT_SUMMARY.md         # Detailed project documentation
└── README.md                  # This file
```

## 🎯 Key Pages

### Marketing Pages
- `/` - Homepage with hero, services, and CTAs
- `/about` - About us, team, values
- `/contact` - Contact form and location
- `/services/boarding` - Dog boarding details
- `/services/daycare` - Daycare programs
- `/services/grooming` - Grooming services
- `/services/training` - Training classes

### Interactive Features
- `/book` - Multi-step booking wizard
- `/dog` - Dog Mode (unique feature!)
- `/dog/calm` - Calm Mode (ambient relaxation)

## 🔧 What's Next

### Ready to Implement
- ✅ Database setup (schema ready)
- ✅ Authentication (NextAuth configured)
- ✅ Payment processing (Stripe configured)
- 📝 User dashboard & portal
- 📝 Admin panel
- 📝 Email notifications
- 📝 Real-time messaging
- 📝 Photo upload system

### Future Enhancements
- Blog/content management
- City-specific landing pages (SEO)
- Review system integration
- Advanced analytics
- Mobile app (PWA)

## 📝 Environment Variables

See `.env.example` for required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret key
- `NEXTAUTH_URL` - Application URL
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe public key
- Additional vars for email, storage, maps, etc.

## 🐕 Dog Mode

One of our unique features! Dog Mode (`/dog`) is an interface designed specifically for our furry guests:

- **Large touch targets** optimized for paws/noses
- **High contrast mode** for better visibility
- **Reduced motion** option for sensitive pets
- **Interactive elements** like the "Boop Me!" button
- **Treat meter** gamification (just for fun!)
- **Calm Mode** with ambient animations for anxious pets

## 📚 Documentation

- **COMPETITIVE_EDGE_PLAN.md** - Competitive analysis & strategy
- **PROJECT_SUMMARY.md** - Comprehensive feature list & roadmap

## 🤝 Contributing

This is a demonstration project. For production use, additional features needed:
- Complete authentication flow
- Payment integration
- Email service setup
- Database hosting
- File storage for uploads
- Testing suite
- CI/CD pipeline

## 📄 License

This project is for demonstration purposes.

## ✨ Credits

Built with modern tools:
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Lucide Icons](https://lucide.dev/)

---

Made with ❤️ for dogs and their humans 🐾
