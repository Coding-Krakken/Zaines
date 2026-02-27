/* eslint-disable react/no-unescaped-entities */

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, Heart } from "lucide-react";
import { ReviewSubmissionForm } from "@/app/reviews/components/ReviewSubmissionForm";

const reviews = [
  {
    id: 1,
    author: "Sarah M.",
    rating: 5,
    date: "2 weeks ago",
    service: "Boarding",
    petName: "Max",
    text: "Max had an amazing time! The staff sent us photos throughout our vacation and he seemed so happy. The webcam access was a game-changer for our peace of mind. Highly recommend!",
    verified: true,
  },
  {
    id: 2,
    author: "James T.",
    rating: 5,
    date: "1 month ago",
    service: "Boarding",
    petName: "Luna",
    text: "Luna settled in quickly and got the calm routine she needs. The updates were clear and on time, and pickup was smooth.",
    verified: true,
  },
  {
    id: 3,
    author: "Emily R.",
    rating: 5,
    date: "1 month ago",
    service: "Boarding",
    petName: "Charlie",
    text: "Charlie can be nervous in new places, but the small-capacity setup helped him relax. Communication was excellent from start to finish.",
    verified: true,
  },
  {
    id: 4,
    author: "Michael K.",
    rating: 5,
    date: "2 months ago",
    service: "Boarding",
    petName: "Bella",
    text: "This was Bella's first time boarding and I was nervous. The staff made the process so easy and kept us updated. When we picked her up, she didn't want to leave! That says it all.",
    verified: true,
  },
  {
    id: 5,
    author: "Lisa P.",
    rating: 5,
    date: "2 months ago",
    service: "Boarding",
    petName: "Rocky",
    text: "Rocky did great with the structured boarding routine. We appreciated the safety-first approach and daily check-ins.",
    verified: true,
  },
  {
    id: 6,
    author: "David W.",
    rating: 5,
    date: "3 months ago",
    service: "Boarding",
    petName: "Daisy",
    text: "The luxury suite was absolutely worth it! Daisy had her own little paradise. Clean facilities, attentive staff, and so many activities. She's already booked for next month!",
    verified: true,
  },
  {
    id: 7,
    author: "Amanda H.",
    rating: 5,
    date: "3 months ago",
    service: "Boarding",
    petName: "Cooper",
    text: "We've tried larger facilities before, but this private setup is far better for Cooper. Calm, safe, and thoughtfully managed.",
    verified: true,
  },
  {
    id: 8,
    author: "Robert S.",
    rating: 5,
    date: "4 months ago",
    service: "Boarding",
    petName: "Sadie",
    text: "Zaine's Stay & Play lives up to its name! Sadie received excellent care during our 2-week vacation. The photo updates were daily and she looked so happy. Thank you for giving us peace of mind!",
    verified: true,
  },
];

const stats = [
  { value: "4.9/5", label: "Average Rating" },
  { value: "500+", label: "Happy Reviews" },
  { value: "98%", label: "Would Recommend" },
  { value: "1,200+", label: "Families Served" },
];

export default function ReviewsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-orange-50 to-yellow-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Reviews & Testimonials</Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              What Pet Parents Say
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Hear from local families who trust our private, small-capacity
              boarding model
            </p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="h-8 w-8 fill-yellow-400 text-yellow-400"
                  aria-hidden="true"
                />
              ))}
              <span className="ml-2 text-2xl font-bold">4.9/5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 text-4xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Recent Reviews</h2>
            <p className="text-lg text-muted-foreground">
              Real feedback from real pet parents
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
            {reviews.map((review) => (
              <Card key={review.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col pt-6">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold">{review.author}</h3>
                        {review.verified && (
                          <Badge variant="secondary" className="text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {review.petName} • {review.service}
                      </div>
                    </div>
                    <Quote className="h-8 w-8 text-muted-foreground/20" />
                  </div>

                  {/* Rating */}
                  <div className="mb-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-200"
                        }`}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {review.date}
                    </span>
                  </div>

                  {/* Review Text */}
                  <p className="flex-1 text-muted-foreground">{review.text}</p>

                  {/* Helpful Button */}
                  <div className="mt-4 flex items-center gap-2 border-t pt-4">
                    <Button variant="ghost" size="sm">
                      <Heart className="mr-2 h-4 w-4" />
                      Helpful
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg">
              Load More Reviews
            </Button>
          </div>
        </div>
      </section>

      {/* Leave a Review */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-2xl">
            <CardContent className="pt-6">
              <h2 className="mb-2 text-2xl font-bold">Share Your Experience</h2>
              <p className="mb-6 text-muted-foreground">
                Have you visited Zaine's Stay & Play? We&apos;d love to hear
                about your experience!
              </p>
              <ReviewSubmissionForm />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            Join Our Community of Happy Pet Parents
          </h2>
          <p className="mb-8 text-lg opacity-90">
            Experience the care and service that earns us 5-star reviews every
            day
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/book">Book Your Stay</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
