/**
 * Generate .ics calendar file for bookings
 * Allows customers to add booking to their calendar
 */

interface BookingDetails {
  bookingNumber: string;
  checkIn: Date | string;
  checkOut: Date | string;
  petNames: string[];
  suiteName?: string;
}

/**
 * Format date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  const pad = (num: number) => num.toString().padStart(2, "0");

  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Generate ICS file content
 */
export function generateICSFile(booking: BookingDetails): string {
  const checkIn =
    typeof booking.checkIn === "string"
      ? new Date(booking.checkIn)
      : booking.checkIn;

  const checkOut =
    typeof booking.checkOut === "string"
      ? new Date(booking.checkOut)
      : booking.checkOut;

  // Set check-in to 2 PM (14:00)
  checkIn.setHours(14, 0, 0, 0);

  // Set check-out to 12 PM (12:00)
  checkOut.setHours(12, 0, 0, 0);

  const now = new Date();
  const summary = `Dog Boarding - ${booking.petNames.join(", ")} - Zaine's Stay & Play`;
  const description =
    `Booking #${booking.bookingNumber}\\n\\n` +
    `Pet(s): ${booking.petNames.join(", ")}\\n` +
    (booking.suiteName ? `Suite: ${booking.suiteName}\\n` : "") +
    `\\nCheck-in: 2:00 PM\\n` +
    `Check-out: 12:00 PM\\n\\n` +
    `Questions? Call (315) 555-0100`;

  const location = "Zaine's Stay & Play, Syracuse, NY";

  // Create ICS content
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zaine's Stay & Play//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Zaine's Booking",
    "X-WR-TIMEZONE:America/New_York",
    "BEGIN:VEVENT",
    `UID:${booking.bookingNumber}@zaines.com`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(checkIn)}`,
    `DTEND:${formatICSDate(checkOut)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT24H",
    "DESCRIPTION:Reminder: Dog boarding tomorrow",
    "ACTION:DISPLAY",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return ics;
}

/**
 * Download ICS file
 */
export function downloadICSFile(booking: BookingDetails): void {
  const icsContent = generateICSFile(booking);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `zaines-booking-${booking.bookingNumber}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
