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
- PostgreSQL database (optional for development - see below)
- Stripe account (optional for development - see below)

### Quick Start (Minimal Setup)

The app is designed to boot and run without any external services configured. You can start with minimal setup and add services as needed.

1. Clone the repository
```bash
git clone <repository-url>
cd pawfect-stays
```

2. Install dependencies
```bash
npm install
```

3. Generate Prisma Client (required)
```bash
npm run prisma:generate
```

**Note:** You must run `npm run prisma:generate` after installing dependencies or after any changes to the Prisma schema. This generates the TypeScript types for database operations.

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

**Note:** The app will run with limited functionality. Payment and booking features will return helpful error messages if environment variables are not configured.

### Full Setup (All Features)

To enable all features including payments, authentication, and database operations:

1. **Set up environment variables**

Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. **Configure required services**

Edit `.env` and configure the following:

#### Database (Required for bookings, users, payments)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/pawfect_stays"
```

**Local PostgreSQL Setup:**
```bash
# Install PostgreSQL (if not already installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb pawfect_stays

# Run migrations
npx prisma migrate dev
```

#### Authentication (Required for user accounts)
```env
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

**Generate a secret:**
```bash
openssl rand -base64 32
```

#### Stripe Payments (Required for booking payments)
```env
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Get Stripe keys:**
1. Sign up at https://stripe.com
2. Get test keys from https://dashboard.stripe.com/test/apikeys
3. Create webhook endpoint at https://dashboard.stripe.com/test/webhooks
   - URL: `http://localhost:3000/api/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`, `charge.refunded`
4. Copy webhook secret

#### Email (Optional - for email auth)
```env
EMAIL_FROM="noreply@pawfectstays.com"
RESEND_API_KEY="re_..."
```

#### Google OAuth (Optional)
```env
GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"
```

**Get Google OAuth credentials:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

3. **Run database migrations** (if database is configured)
```bash
npx prisma migrate dev
```

4. **Seed the database** (optional)
```bash
npx prisma db seed
```

5. **Run the development server**
```bash
npm run dev
```

### Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No* | - | PostgreSQL connection string. *Required for database features |
| `NEXTAUTH_SECRET` | No* | - | Secret for NextAuth.js session encryption. *Required for authentication |
| `NEXTAUTH_URL` | No* | `http://localhost:3000` | Base URL of the application |
| `STRIPE_SECRET_KEY` | No* | - | Stripe secret key (use test key `sk_test_...`). *Required for payments |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No* | - | Stripe publishable key (use test key `pk_test_...`). *Required for payments |
| `STRIPE_WEBHOOK_SECRET` | No* | - | Stripe webhook signing secret. *Required for webhook handling |
| `EMAIL_FROM` | No | `noreply@pawfectstays.com` | Default sender email address |
| `RESEND_API_KEY` | No | - | Resend API key for sending emails |
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth client secret |
| `NODE_ENV` | No | `development` | Node environment (`development` or `production`) |

**Note:** Services marked as "No*" are optional for starting the app but required for specific features. The app will display helpful error messages when trying to use features that require missing configuration.

### Development vs Production Behavior

**Development Mode (`NODE_ENV=development` or not set):**
- App starts even if required environment variables are missing
- Console warnings displayed for missing services (DATABASE_URL, Stripe keys)
- API routes return clear 400 errors with actionable messages when services are unavailable
- Allows developers to work on UI/frontend without backend setup

**Production Mode (`NODE_ENV=production`):**
- Same graceful degradation as development
- Services should be properly configured for production deployments
- Missing critical environment variables will cause API routes to return 400 errors
- Use environment-specific validation in CI/CD to enforce required variables

**Best Practices:**
- Use test/sandbox keys in development (e.g., `sk_test_...` for Stripe)
- Set up `.env.local` for local overrides (automatically ignored by git)
- Use environment variable validation in your CI/CD pipeline for production
- Test without environment variables to ensure graceful degradation works

### What Works Without Configuration?

✅ **Works without any env vars:**
- Homepage and all marketing pages
- Service pages (boarding, daycare, grooming, training)
- Contact page and forms (except email sending)
- Dog Mode and Calm Mode
- UI components and navigation

⚠️ **Requires configuration:**
- User authentication (needs `NEXTAUTH_SECRET`, `DATABASE_URL`)
- Booking system (needs `DATABASE_URL`)
- Payment processing (needs Stripe keys)
- Email sending (needs email service keys)

## 🛠️ Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **dev** | `npm run dev` | Start development server on http://localhost:3000 |
| **build** | `npm run build` | Build production bundle |
| **start** | `npm start` | Start production server |
| **lint** | `npm run lint` | Run ESLint to check code quality |
| **typecheck** | `npm run typecheck` | Run TypeScript type checking |
| **prisma:generate** | `npm run prisma:generate` | Generate Prisma Client (run after schema changes) |
| **test** | `npm test` | Run test suite |
| **test:watch** | `npm run test:watch` | Run tests in watch mode |

**Important Notes:**
- Run `npm run prisma:generate` after cloning the repo or updating the Prisma schema
- Run `npm run typecheck` before committing to catch type errors
- Tests validate that API routes return proper errors when environment variables are missing

## � Booking & Payment Flow

The booking and payment system is fully integrated, creating a seamless experience from reservation to payment confirmation.

### Flow Overview

```
1. Customer creates booking → 2. Payment intent created → 3. Customer completes payment → 4. Webhook confirms → 5. Booking confirmed
```

### API Endpoints

#### POST /api/bookings
Creates a new booking and optionally generates a Stripe payment intent.

**Request Body:**
```json
{
  "checkIn": "2026-03-01",
  "checkOut": "2026-03-05",
  "suiteType": "standard",
  "petCount": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "petNames": "Buddy",
  "specialRequests": "Extra playtime",
  "addOns": []
}
```

**Response (with Stripe configured):**
```json
{
  "success": true,
  "booking": {
    "id": "clx...",
    "bookingNumber": "PB-20260208-0001",
    "checkIn": "2026-03-01T00:00:00.000Z",
    "checkOut": "2026-03-05T00:00:00.000Z",
    "suite": {
      "id": "suite-123",
      "name": "Standard Suite 1",
      "tier": "standard",
      "pricePerNight": 65
    },
    "total": 286,
    "status": "pending"
  },
  "payment": {
    "clientSecret": "pi_xxx_secret_yyy"
  },
  "message": "Booking created. Please complete payment."
}
```

**Response (without Stripe configured):**
```json
{
  "success": true,
  "booking": { ... },
  "message": "Booking created successfully."
}
```

**Key Features:**
- **Graceful Degradation**: Booking succeeds even if Stripe is unavailable
- **Idempotent Payment Creation**: Checks for existing payments to prevent duplicates
- **Metadata Tracking**: Stores `bookingId`, `bookingNumber`, and `userId` in Stripe for reconciliation

#### POST /api/payments/webhook
Handles Stripe webhook events for payment lifecycle updates.

**Supported Events:**
- `payment_intent.succeeded` → Updates payment to `succeeded`, booking to `confirmed`
- `payment_intent.payment_failed` → Updates payment to `failed`, booking to `cancelled`
- `payment_intent.canceled` → Updates payment to `cancelled`, booking to `cancelled`
- `charge.refunded` → Updates payment to `refunded`, booking to `cancelled`

**Webhook Setup:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local development server
stripe listen --forward-to localhost:3000/api/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

### Status Values

#### Booking Status
- `pending` - Initial state after creation, awaiting payment
- `confirmed` - Payment succeeded, booking confirmed
- `checked_in` - Customer checked in
- `completed` - Stay completed
- `cancelled` - Booking cancelled (payment failed or manually cancelled)

#### Payment Status
- `pending` - Payment intent created, awaiting payment
- `succeeded` - Payment completed successfully
- `failed` - Payment attempt failed
- `cancelled` - Payment cancelled
- `refunded` - Payment refunded

### Testing the Flow

#### 1. Happy Path (Payment Success)
```bash
# Start dev server
npm run dev

# In another terminal, start webhook forwarding
stripe listen --forward-to localhost:3000/api/payments/webhook

# Create a booking via API or UI
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "checkIn": "2026-03-01",
    "checkOut": "2026-03-05",
    "suiteType": "standard",
    "petCount": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "petNames": "Buddy"
  }'

# Use Stripe test card that succeeds: 4242 4242 4242 4242
# Payment intent succeeds → Webhook fires → Booking confirmed
```

#### 2. Failure Path (Payment Failure)
```bash
# Use Stripe test card that fails: 4000 0000 0000 0002
# Payment intent fails → Webhook fires → Booking cancelled
```

#### 3. Degraded Mode (No Stripe)
```bash
# Unset Stripe keys
unset STRIPE_SECRET_KEY

# Create booking → Succeeds without payment integration
# Booking status remains "pending"
```

### Test Cards (Stripe Test Mode)

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Payment declined |
| `4000 0000 0000 9995` | Payment fails |
| `4000 0025 0000 3155` | Requires authentication |

**CVV:** Any 3 digits  
**Expiry:** Any future date  
**ZIP:** Any 5 digits

### Automated Tests

Run the E2E test suite covering the full booking → payment → webhook flow:

```bash
npm test src/__tests__/booking-payment-e2e.test.ts
```

**Test Coverage:**
- ✅ Booking creation with payment intent
- ✅ Payment record creation with pending status
- ✅ Graceful handling of Stripe failures
- ✅ Webhook: payment success → booking confirmed
- ✅ Webhook: payment failure → booking cancelled
- ✅ Idempotent payment creation

### Security Considerations

- ✅ **Webhook Signature Verification**: All webhooks verify Stripe signatures
- ✅ **Test Keys Only**: Use `sk_test_*` and `pk_test_*` in development
- ✅ **No Client Secret Logging**: Secrets only returned in intended API responses
- ✅ **Graceful Degradation**: Payment failures don't block booking creation
- ✅ **Idempotency**: Duplicate payment records prevented via booking ID check

## �📁 Project Structure

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

See the **Environment Variables Reference** table in the [Getting Started](#getting-started) section above for a complete list of all environment variables.

For a template with example values, see `.env.example` in the project root.

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
