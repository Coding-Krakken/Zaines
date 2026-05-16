/**
 * Activity Feed Dashboard Widget
 * 
 * Phase 6: Customer Portal - Recent activity timeline
 * 
 * Features:
 * - Recent bookings, messages, and updates
 * - Chronological timeline display
 * - Action links for each item
 */

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { 
  Calendar,
  MessageSquare, 
  CreditCard,
  CheckCircle,
  Image as ImageIcon,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "booking" | "message" | "payment" | "photo" | "update";
  title: string;
  description: string;
  timestamp: Date;
  href?: string;
  status?: "success" | "pending" | "info";
}

interface ActivityFeedProps {
  items: ActivityItem[];
  maxItems?: number;
  className?: string;
}

const ACTIVITY_ICONS = {
  booking: Calendar,
  message: MessageSquare,
  payment: CreditCard,
  photo: ImageIcon,
  update: CheckCircle,
};

const ACTIVITY_COLORS = {
  success: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  info: "bg-blue-100 text-blue-700",
};

export function ActivityFeed({ items, maxItems = 10, className }: ActivityFeedProps) {
  const displayItems = items.slice(0, maxItems);

  if (displayItems.length === 0) {
    return (
      <div className={cn("paw-card p-6 text-center", className)}>
        <Clock className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-sm text-muted-foreground">
          No recent activity yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        {items.length > maxItems && (
          <Link href="/dashboard/updates" className="text-sm text-primary hover:underline">
            View all
          </Link>
        )}
      </div>
      
      <div className="paw-card divide-y divide-border">
        {displayItems.map((item) => {
          const Icon = ACTIVITY_ICONS[item.type];
          const colorClass = item.status ? ACTIVITY_COLORS[item.status] : "bg-muted text-muted-foreground";

          return (
            <div key={item.id} className="flex items-start gap-4 p-4 hover:bg-accent/50 transition-colors">
              {/* Icon Badge */}
              <div className={cn("rounded-full p-2", colorClass)}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">
                      {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </time>
                </div>
                
                {item.href && (
                  <Link 
                    href={item.href}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    View details →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Generate activity items from booking, message, and payment data
 */
export function generateActivityItems(data: {
  recentBookings?: Array<{
    id: string;
    bookingNumber: string;
    status: string;
    createdAt: Date;
    checkInDate: Date;
  }>;
  unreadMessages?: number;
  lastMessageAt?: Date;
  recentPayments?: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
}): ActivityItem[] {
  const items: ActivityItem[] = [];

  // Add booking activities
  data.recentBookings?.forEach((booking) => {
    items.push({
      id: `booking-${booking.id}`,
      type: "booking",
      title: `Booking ${booking.bookingNumber}`,
      description: `Check-in on ${new Date(booking.checkInDate).toLocaleDateString()}`,
      timestamp: booking.createdAt,
      href: `/dashboard/bookings/${booking.id}`,
      status: booking.status === "confirmed" ? "success" : booking.status === "pending" ? "pending" : "info",
    });
  });

  // Add message notification
  if (data.unreadMessages && data.unreadMessages > 0 && data.lastMessageAt) {
    items.push({
      id: "messages-unread",
      type: "message",
      title: `${data.unreadMessages} new message${data.unreadMessages > 1 ? "s" : ""}`,
      description: "From our team",
      timestamp: data.lastMessageAt,
      href: "/dashboard/messages",
      status: "info",
    });
  }

  // Add payment activities
  data.recentPayments?.forEach((payment) => {
    items.push({
      id: `payment-${payment.id}`,
      type: "payment",
      title: `Payment ${payment.status}`,
      description: `$${payment.amount.toFixed(2)}`,
      timestamp: payment.createdAt,
      status: payment.status === "succeeded" ? "success" : "pending",
    });
  });

  // Sort by most recent first
  return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
