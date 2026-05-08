/**
 * Admin Types - Centralized types for admin pages and operations
 * Single source of truth for admin domain models
 */

// ============================================================================
// SETTINGS
// ============================================================================

export interface BusinessHours {
  monday: { openTime: string; closeTime: string; isClosed: boolean };
  tuesday: { openTime: string; closeTime: string; isClosed: boolean };
  wednesday: { openTime: string; closeTime: string; isClosed: boolean };
  thursday: { openTime: string; closeTime: string; isClosed: boolean };
  friday: { openTime: string; closeTime: string; isClosed: boolean };
  saturday: { openTime: string; closeTime: string; isClosed: boolean };
  sunday: { openTime: string; closeTime: string; isClosed: boolean };
}

export interface AvailabilityRules {
  minNightsPerBooking: number;
  maxNightsPerBooking: number;
  advanceBookingWindowDays: number; // How many days ahead customers can book
  minimumLeadTimeDays: number; // Minimum days before check-in to allow booking
}

export interface AdminSettings {
  // Operational Preferences
  autoConfirmBookings: boolean;
  photoNotificationType: 'instant' | 'daily_batch';
  photoNotificationTime?: string; // HH:mm format, e.g., "17:00"
  dashboardDateRange: 'today' | 'today_tomorrow' | 'this_week';
  
  // Phase 1: Business Hours & Contact Info
  businessHours: BusinessHours;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  state: string;
  zip: string;

  // Phase 3: Availability & Scheduling Rules
  availabilityRules: AvailabilityRules;
}

export interface SettingsRecord {
  key: string;
  value: string;
  updatedAt: Date;
}

// ============================================================================
// BOOKING MANAGEMENT
// ============================================================================

export interface AdminBookingFormData {
  customerId: string;
  petIds: string[];
  suiteId: string;
  checkInDate: string; // ISO date
  checkOutDate: string; // ISO date
  specialRequests?: string;
  autoConfirm?: boolean;
}

export interface AdminBookingResponse {
  id: string;
  bookingNumber: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: string;
  total: number;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
  suite: {
    id: string;
    name: string;
  };
  bookingPets: Array<{
    pet: {
      id: string;
      name: string;
      breed: string;
    };
  }>;
}

export interface BookingListFilters {
  status?: string;
  suiteId?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

// ============================================================================
// CHECK-IN WORKFLOW
// ============================================================================

export interface CheckInData {
  bookingId: string;
  waiversSigned: boolean;
  vaccinesCurrent: boolean;
  medicationsReviewed: boolean;
  specialRequestsAcknowledged: boolean;
  notes?: string;
}

export interface WaiverStatus {
  type: 'liability' | 'medical' | 'photo_release';
  signed: boolean;
  signedAt?: Date;
  signature?: string;
}

export interface PetHealthStatus {
  petId: string;
  petName: string;
  vaccinesCurrent: boolean;
  vaccineExpiry?: Date;
  hasActiveMedications: boolean;
  activeMedications: Array<{
    name: string;
    frequency: string;
  }>;
  specialNeeds?: string;
}

// ============================================================================
// DASHBOARD & KPIS
// ============================================================================

export interface DashboardKPI {
  label: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'critical';
  action?: {
    label: string;
    href: string;
  };
}

export interface DashboardMetrics {
  todayCheckIns: number;
  todayCheckOuts: number;
  currentOccupancyPercent: number;
  totalOccupiedSuites: number;
  totalSuites: number;
  pendingConfirmations: number;
  alerts: Array<{
    type: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// CUSTOMERS (For CRM integration - Phase 1 but typings ready)
// ============================================================================

export interface CustomerProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  pets: Array<{
    id: string;
    name: string;
    breed: string;
  }>;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate?: Date;
  createdAt: Date;
}

// ============================================================================
// PETS (For Phase 1 but typings ready)
// ============================================================================

export interface PetProfile {
  id: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  gender: string;
  temperament?: string;
  specialNeeds?: string;
  vaccines: Array<{
    name: string;
    expiryDate: Date;
    status: 'current' | 'expiring_soon' | 'expired';
  }>;
}
