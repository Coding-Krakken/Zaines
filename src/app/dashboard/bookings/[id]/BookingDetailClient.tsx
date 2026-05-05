"use client";

import { useState } from "react";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { PhotoGallery } from "@/components/PhotoGallery";
import { MessageThread } from "@/components/MessageThread";
import { NotificationBanner } from "@/components/NotificationBanner";

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
  CancelButton: any;
}

type TabType = "overview" | "timeline" | "gallery" | "messages";

export default function BookingDetailClient({
  booking,
  canCancel,
  CancelButton,
}: BookingDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "timeline", label: "Activity", icon: "📝" },
    { id: "gallery", label: "Photos", icon: "📸" },
    { id: "messages", label: "Messages", icon: "💬" },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Notification Banner */}
      <NotificationBanner bookingId={booking.id} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Booking {booking.bookingNumber}</h1>
        <p className="text-gray-600 mt-2">
          {new Date(booking.checkInDate).toLocaleDateString()} →{" "}
          {new Date(booking.checkOutDate).toLocaleDateString()}
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        className="border-b flex gap-2 overflow-x-auto"
        role="tablist"
        aria-label="Booking details navigation"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 font-medium"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tab-${tab.id}`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
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
                  <p className="font-medium">
                    {new Date(booking.checkInDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Check-out</p>
                  <p className="font-medium">
                    {new Date(booking.checkOutDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="font-medium capitalize">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "checked_in"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {booking.status}
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
                  booking.bookingPets.map((bp: any) => (
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
                      {booking.payments.map((pay: any) => (
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

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-600 mb-3">
                    Cancellation policy: 48+ hours full refund, 24-48 hours 50%
                    refund, under 24 hours no refund.
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
                <li>✓ Get real-time updates on your pet's activities</li>
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
