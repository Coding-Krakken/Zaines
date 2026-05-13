"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import { Camera, ClipboardList, MessageSquareMore, NotebookPen } from "lucide-react";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { PhotoGallery } from "@/components/PhotoGallery";
import { MessageThread } from "@/components/MessageThread";
import { NotificationBanner } from "@/components/NotificationBanner";
import { getBookingStatusMeta } from "@/lib/dashboard-status";
import { useSettings } from "@/providers/settings-provider";

interface BookingDetailClientProps {
  booking: {
    id: string;
    bookingNumber: string;
    checkInDate: Date;
    checkOutDate: Date;
    total: number;
    status: string;
    suite?: { name?: string; tier?: string } | null;
    bookingPets: Array<{ id: string; pet?: { name?: string } | null }>;
    payments: Array<{ id: string; status: string; amount: number }>;
  };
  canCancel: boolean;
  CancelButton: ComponentType<{
    bookingId: string;
    bookingStatus: string;
    canCancel: boolean;
  }>;
}

type TabType = "overview" | "timeline" | "gallery" | "messages";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

function formatDate(dateValue: Date | string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return DATE_FORMATTER.format(date);
}

function formatDateTime(dateValue: Date | string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return DATE_TIME_FORMATTER.format(date);
}

export default function BookingDetailClient({
  booking,
  canCancel,
  CancelButton,
}: BookingDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { settings } = useSettings();
  const fullRefundHours = settings?.cancellationPolicySettings.fullRefundHours ?? 48;
  const partialRefundHours = settings?.cancellationPolicySettings.partialRefundHours ?? 24;
  const partialRefundPercent =
    settings?.cancellationPolicySettings.partialRefundPercent ?? 50;

  const tabs: Array<{ id: TabType; label: string; icon: ComponentType<{ className?: string }> }> = [
    { id: "overview", label: "Overview", icon: ClipboardList },
    { id: "timeline", label: "Activity", icon: NotebookPen },
    { id: "gallery", label: "Photos", icon: Camera },
    { id: "messages", label: "Messages", icon: MessageSquareMore },
  ];

  const canRecoverPayment =
    (booking.status === "pending" || booking.status === "confirmed") &&
    !booking.payments.some((payment) => payment.status === "succeeded");

  return (
    <div className="space-y-6">
      {/* Notification Banner */}
      <NotificationBanner bookingId={booking.id} />

      <DashboardPageHeader
        eyebrow="Booking Details"
        title={`Booking ${booking.bookingNumber}`}
        description={`${formatDate(booking.checkInDate)} - ${formatDate(booking.checkOutDate)}`}
      />

      {/* Tab Navigation */}
      <div
        className="flex gap-2 overflow-x-auto border-b"
        role="tablist"
        aria-label="Booking details navigation"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tab-${tab.id}`}
            >
              <Icon className="mr-2 inline size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div role="tabpanel" id={`tab-${activeTab}`} className="space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Suite Information */}
            <div className="p-6 border rounded-lg space-y-4">
              <h2 className="text-lg font-semibold">Suite Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Suite</p>
                  <p className="font-medium">
                    {booking.suite?.name} ({booking.suite?.tier})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-in</p>
                  <p className="font-medium">{formatDateTime(booking.checkInDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-out</p>
                  <p className="font-medium">{formatDateTime(booking.checkOutDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${getBookingStatusMeta(booking.status).toneClass}`}
                    >
                      {getBookingStatusMeta(booking.status).label}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Pets Information */}
            <div className="p-6 border rounded-lg space-y-4">
              <h2 className="text-lg font-semibold">Pets</h2>
              <div className="space-y-2">
                {booking.bookingPets.length === 0 ? (
                  <p className="text-gray-600">No pets for this booking.</p>
                ) : (
                  booking.bookingPets.map((bp) => (
                    <div
                      key={bp.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <p className="font-medium text-lg">
                        {bp.pet?.name || "Pet"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div className="p-6 border rounded-lg md:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold">Payment</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className="text-gray-600">Total Amount:</p>
                  <p className="font-semibold text-lg">${booking.total}</p>
                </div>

                {booking.payments.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Payment History:</p>
                    <div className="space-y-2">
                      {booking.payments.map((pay) => (
                        <div
                          key={pay.id}
                          className="flex justify-between text-sm p-2 bg-gray-50 rounded"
                        >
                          <span>
                            {pay.status} - ${pay.amount}
                          </span>
                          <span
                            className={`font-medium ${
                              pay.status === "succeeded"
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            {pay.status === "succeeded" ? "✓" : "◯"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canRecoverPayment ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-900">
                      Payment has not been completed yet. Use the secure recovery link below.
                    </p>
                    <a
                      href={`/book/recover/${booking.id}`}
                      className="mt-2 inline-flex rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
                    >
                      Complete Payment
                    </a>
                  </div>
                ) : null}

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600 mb-3">
                      Cancellation policy: {fullRefundHours}+ hours full refund, {partialRefundHours}-{fullRefundHours} hours {partialRefundPercent}%
                      refund, under {partialRefundHours} hours no refund.
                  </p>
                  {canCancel && (
                    <CancelButton
                      bookingId={booking.id}
                      bookingStatus={booking.status}
                      canCancel={canCancel}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Timeline Tab */}
        {activeTab === "timeline" && (
          <div className="p-6 border rounded-lg">
            <ActivityTimeline bookingId={booking.id} />
          </div>
        )}

        {/* Photo Gallery Tab */}
        {activeTab === "gallery" && (
          <div className="p-6 border rounded-lg">
            <PhotoGallery bookingId={booking.id} />
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MessageThread
                bookingId={booking.id}
                bookingNumber={booking.bookingNumber}
              />
            </div>
            <div className="p-6 border rounded-lg bg-blue-50">
              <h3 className="font-semibold mb-3">Quick Tips</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Get real-time updates on your pet&apos;s activities</li>
                <li>✓ Receive notifications of new photos</li>
                <li>✓ Direct messaging with staff</li>
                <li>✓ Messages update every 30 seconds</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
