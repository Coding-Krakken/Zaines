/**
 * Photo Digest Email Template
 * 
 * Daily batch email with photos of pet's stay.
 * Sent at end of day if photos were captured.
 */

import * as React from 'react';
import {
  Button,
  Heading,
  Img,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';
import { EmailLayout } from './_components/Layout';
import { format } from 'date-fns';

interface PhotoDigestProps {
  customerName: string;
  petName: string;
  date: string;
  photos: Array<{
    url: string;
    caption: string;
    timestamp: string;
  }>;
  bookingNumber?: string;
}

export function PhotoDigest({
  customerName = 'Valued Customer',
  petName = 'Buddy',
  date = new Date().toISOString(),
  photos = [],
  bookingNumber,
}: PhotoDigestProps) {
  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');

  return (
    <EmailLayout preview={`${petName}'s photo update from ${formattedDate}`}>
      <Heading style={h1}>📸 Today's Photo Update!</Heading>
      
      <Text style={paragraph}>
        Hi {customerName},
      </Text>
      
      <Text style={paragraph}>
        {petName} had an amazing day at Zaine's! Here are some highlights from {formattedDate}.
      </Text>

      {/* Photo Grid */}
      <Section style={photoGrid}>
        {photos.map((photo, index) => (
          <div key={index} style={photoCard}>
            <Img
              src={photo.url}
              alt={photo.caption}
              style={photoImage}
            />
            <Text style={photoCaption}>{photo.caption}</Text>
            <Text style={photoTime}>
              {format(new Date(photo.timestamp), 'h:mm a')}
            </Text>
          </div>
        ))}
      </Section>

      {/* CTA */}
      <Section style={buttonSection}>
        <Button
          href={`${process.env.NEXTAUTH_URL}/dashboard/photos`}
          style={button}
        >
          View All Photos
        </Button>
      </Section>

      <Text style={paragraph}>
        We'll send another update tomorrow with more photos of {petName}'s adventures! 🐾
      </Text>

      <Text style={signature}>
        The Zaine's Team
      </Text>
    </EmailLayout>
  );
}

export default PhotoDigest;

// Styles
const h1 = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '700',
  lineHeight: '36px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
};

const paragraph = {
  color: '#333333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const photoGrid = {
  margin: '32px 0',
};

const photoCard = {
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const photoImage = {
  width: '100%',
  maxWidth: '500px',
  borderRadius: '12px',
  margin: '0 auto',
};

const photoCaption = {
  color: '#1a1a1a',
  fontSize: '16px',
  fontWeight: '600',
  margin: '12px 0 4px',
};

const photoTime = {
  color: '#666666',
  fontSize: '14px',
  margin: '0',
};

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const signature = {
  color: '#666666',
  fontSize: '15px',
  fontStyle: 'italic',
  margin: '24px 0 0',
};
