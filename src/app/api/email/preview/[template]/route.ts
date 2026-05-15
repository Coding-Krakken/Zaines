/**
 * Email Preview API Route
 * 
 * Development-only endpoint to preview email templates in browser.
 * 
 * Usage:
 * - /api/email/preview/booking-confirmation
 * - /api/email/preview/photo-digest
 * - /api/email/preview/payment-receipt
 * - /api/email/preview/welcome
 * 
 * Security: Only accessible in development mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import BookingConfirmation from '@/emails/BookingConfirmation';
import PhotoDigest from '@/emails/PhotoDigest';
import PaymentReceipt from '@/emails/PaymentReceipt';
import WelcomeEmail from '@/emails/WelcomeEmail';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ template: string }> }
) {
  // Security: Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Email previews only available in development mode' },
      { status: 403 }
    );
  }

  const { template } = await params;

  // Mock data for each template
  const mockData = {
    'booking-confirmation': {
      customerName: 'Sarah Johnson',
      bookingNumber: 'ZSP-20260601-001',
      checkInDate: '2026-06-15',
      checkOutDate: '2026-06-17',
      suiteType: 'Deluxe Suite',
      suitePrice: 85,
      nights: 2,
      petNames: ['Buddy', 'Max'],
      subtotal: 195,
      tax: 15.6,
      total: 210.6,
      addOns: [
        { name: 'Extra Walk', price: 10 },
        { name: 'Nail Trim', price: 15 },
      ],
    },
    'photo-digest': {
      customerName: 'Sarah Johnson',
      petName: 'Buddy',
      date: new Date().toISOString(),
      bookingNumber: 'ZSP-20260601-001',
      photos: [
        {
          url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
          caption: 'Playing with friends in the yard! 🎾',
          timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          url: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600',
          caption: 'Relaxing after an active morning',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
        {
          url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600',
          caption: 'Enjoying a treat! 🦴',
          timestamp: new Date().toISOString(),
        },
      ],
    },
    'payment-receipt': {
      customerName: 'Sarah Johnson',
      receiptNumber: 'RCT-20260601-001',
      paymentDate: new Date().toISOString(),
      bookingNumber: 'ZSP-20260601-001',
      paymentMethod: 'Visa',
      lastFourDigits: '4242',
      items: [
        {
          description: 'Deluxe Suite (2 nights)',
          quantity: 2,
          unitPrice: 85,
          total: 170,
        },
        {
          description: 'Extra Walk',
          quantity: 1,
          unitPrice: 10,
          total: 10,
        },
        {
          description: 'Nail Trim',
          quantity: 1,
          unitPrice: 15,
          total: 15,
        },
      ],
      subtotal: 195,
      tax: 15.6,
      total: 210.6,
    },
    welcome: {
      customerName: 'Sarah Johnson',
    },
  };

  // Render appropriate template
  let html: string;
  try {
    switch (template) {
      case 'booking-confirmation':
        html = await render(BookingConfirmation(mockData['booking-confirmation']));
        break;
      case 'photo-digest':
        html = await render(PhotoDigest(mockData['photo-digest']));
        break;
      case 'payment-receipt':
        html = await render(PaymentReceipt(mockData['payment-receipt']));
        break;
      case 'welcome':
        html = await render(WelcomeEmail(mockData.welcome));
        break;
      default:
        return NextResponse.json(
          {
            error: 'Template not found',
            available: ['booking-confirmation', 'photo-digest', 'payment-receipt', 'welcome'],
          },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('Error rendering email template:', error);
    return NextResponse.json(
      {
        error: 'Failed to render template',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }

  // Return HTML for browser preview
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
