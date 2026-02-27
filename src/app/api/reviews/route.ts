import { NextResponse } from "next/server";
import { getApprovedPublicReviews } from "@/lib/api/issue26";

export async function GET() {
  const reviews = await getApprovedPublicReviews();
  return NextResponse.json({ reviews }, { status: 200 });
}
