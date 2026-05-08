'use client';

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";

const reviews = [
  {
    id: 1,
    author: "Sarah M.",
    rating: 5,
    date: "2 weeks ago",
    petName: "Max",
    text: "Max had an amazing time! The staff sent us photos throughout our vacation and he seemed so happy. The webcam access was a game-changer for our peace of mind. Highly recommend!",
    verified: true,
  },
  {
    id: 2,
    author: "James T.",
    rating: 5,
    date: "1 month ago",
    petName: "Luna",
    text: "Luna settled in quickly and got the calm routine she needs. The updates were clear and on time, and pickup was smooth.",
    verified: true,
  },
  {
    id: 3,
    author: "Emily R.",
    rating: 5,
    date: "1 month ago",
    petName: "Charlie",
    text: "Charlie can be nervous in new places, but the small-capacity setup helped him relax. Communication was excellent from start to finish.",
    verified: true,
  },
  {
    id: 4,
    author: "Michael K.",
    rating: 5,
    date: "2 months ago",
    petName: "Bella",
    text: "This was Bella's first time boarding and I was nervous. The staff made the process so easy and kept us updated. When we picked her up, she didn't want to leave! That says it all.",
    verified: true,
  },
  {
    id: 5,
    author: "Lisa P.",
    rating: 5,
    date: "2 months ago",
    petName: "Rocky",
    text: "Rocky did great with the structured boarding routine. We appreciated the safety-first approach and daily check-ins.",
    verified: true,
  },
  {
    id: 6,
    author: "David W.",
    rating: 5,
    date: "3 months ago",
    petName: "Daisy",
    text: "The luxury suite was absolutely worth it! Daisy had her own little paradise. Clean facilities, attentive staff, and so many activities. She's already booked for next month!",
    verified: true,
  },
];

const stats = [
  { value: "4.9/5", label: "Average Rating" },
  { value: "150+", label: "Verified Reviews" },
  { value: "98%", label: "Would Recommend" },
  { value: "1,200+", label: "Dogs Boarded" },
];

export default function ReviewsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <FadeUp>
        <section className="relative bg-gradient-to-br from-primary/5 via-primary/2 to-secondary/3 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Reviews & Testimonials
              </Badge>
              <h1 className="mb-6 font-display text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                Trusted by Families Across Syracuse
              </h1>
              <p className="mb-8 text-lg md:text-xl text-foreground/70">
                Read what pet parents say about their experience with Zaine's Stay & Play
              </p>
              
              {/* Star Rating Display */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-6 w-6 fill-primary text-primary"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <span className="font-display text-3xl font-semibold text-primary">4.9/5</span>
                <span className="text-foreground/60">(150+ verified reviews)</span>
              </div>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Stats */}
      <FadeUp>
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="mb-3 font-display text-3xl md:text-4xl font-semibold text-primary">
                    {stat.value}
                  </div>
                  <div className="text-sm text-foreground/60 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Reviews Grid */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <FadeUp>
            <div className="mb-16 text-center">
              <h2 className="mb-4 font-display text-3xl md:text-4xl font-semibold">
                Real Feedback From Real Pet Parents
              </h2>
              <p className="text-lg text-foreground/60">
                Every review is verified from families we've served
              </p>
            </div>
          </FadeUp>

          <StaggerContainer>
            <div className="grid gap-6 md:grid-cols-2 auto-rows-max">
              {reviews.map((review) => (
                <StaggerItem key={review.id}>
                  <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
                    <CardContent className="flex flex-1 flex-col pt-6">
                      {/* Header with Quote Icon */}
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center gap-2">
                            <h3 className="font-display font-semibold text-foreground">
                              {review.author}
                            </h3>
                            {review.verified && (
                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-foreground/60 font-medium">
                            {review.petName} • {review.date}
                          </div>
                        </div>
                        <Quote className="h-6 w-6 text-primary/10 shrink-0" />
                      </div>

                      {/* Star Rating */}
                      <div className="mb-4 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-primary text-primary"
                                : "text-border"
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>

                      {/* Review Text */}
                      <p className="flex-1 text-foreground/70 leading-relaxed">
                        {review.text}
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </section>

      {/* Why Pet Parents Trust Us */}
      <FadeUp>
        <section className="bg-secondary/40 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-xl border border-primary/20 bg-background/80 backdrop-blur-sm p-8">
              <h3 className="mb-6 font-display text-2xl font-semibold">
                Why Families Trust Us
              </h3>
              <ul className="space-y-3 text-foreground/70">
                <li className="flex gap-3">
                  <span className="text-primary font-semibold">✓</span>
                  <span><strong className="text-foreground">Small capacity:</strong> Only 3 suites means your dog gets individualized attention, not a crowded kennel</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-semibold">✓</span>
                  <span><strong className="text-foreground">Owner on-site:</strong> 24/7 supervision from someone who genuinely cares about your pet</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-semibold">✓</span>
                  <span><strong className="text-foreground">Transparent pricing:</strong> No hidden fees, no surprises at checkout</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-semibold">✓</span>
                  <span><strong className="text-foreground">Calm environment:</strong> Reduced stress, predictable routines, personalized care</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-semibold">✓</span>
                  <span><strong className="text-foreground">Daily updates:</strong> Photos, videos, and regular check-ins keep you connected</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* CTA */}
      <FadeUp>
        <section className="bg-gradient-to-r from-primary/90 to-primary py-16 md:py-24 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 font-display text-3xl md:text-4xl font-semibold">
              Join Our Community of Happy Pet Parents
            </h2>
            <p className="mb-8 text-lg opacity-90 max-w-2xl mx-auto">
              Experience the personalized care, calm environment, and peace of mind that earns us 4.9 stars.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                asChild
              >
                <Link href="/book">Book Your Stay</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/contact">Schedule a Tour</Link>
              </Button>
            </div>
          </div>
        </section>
      </FadeUp>

      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "Zaine's Stay & Play",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              ratingCount: 150,
              bestRating: "5",
              worstRating: "1",
            },
            review: reviews.slice(0, 6).map((review) => ({
              "@type": "Review",
              reviewRating: {
                "@type": "Rating",
                ratingValue: review.rating,
                bestRating: "5",
                worstRating: "1",
              },
              author: {
                "@type": "Person",
                name: review.author,
              },
              reviewBody: review.text,
              datePublished: new Date().toISOString().split("T")[0],
            })),
          }),
        }}
      />
    </div>
  );
}
