"use client";

import { useState } from "react";
/* eslint-disable react/no-unescaped-entities */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Heart, Play } from "lucide-react";

const galleryImages = [
  // Suites
  { id: 1, category: "suites", title: "Luxury Suite", description: "Spacious luxury accommodations", placeholder: "🏠" },
  { id: 2, category: "suites", title: "Deluxe Suite", description: "Comfortable deluxe rooms", placeholder: "🛏️" },
  { id: 3, category: "suites", title: "Standard Suite", description: "Cozy standard rooms", placeholder: "🏡" },
  { id: 4, category: "suites", title: "Outdoor Patio", description: "Private outdoor spaces", placeholder: "🌳" },
  
  // Playtime
  { id: 5, category: "playtime", title: "Group Play", description: "Dogs socializing together", placeholder: "🐕" },
  { id: 6, category: "playtime", title: "Indoor Play Area", description: "Climate-controlled fun", placeholder: "🎾" },
  { id: 7, category: "playtime", title: "Agility Course", description: "Active play equipment", placeholder: "🏃" },
  { id: 8, category: "playtime", title: "Pool Time", description: "Splashing in the pool", placeholder: "🏊" },
  
  // Amenities
  { id: 9, category: "amenities", title: "Comfort Care Station", description: "Add-on wellness and comfort services", placeholder: "✂️" },
  { id: 10, category: "amenities", title: "Enrichment Area", description: "Structured play and enrichment space", placeholder: "🎓" },
  { id: 11, category: "amenities", title: "Reception", description: "Welcoming front desk", placeholder: "🎪" },
  { id: 12, category: "amenities", title: "Outdoor Yard", description: "Secure outdoor space", placeholder: "🌲" },
  
  // Happy Guests
  { id: 13, category: "guests", title: "Max the Golden", description: "Having a great time", placeholder: "🦮" },
  { id: 14, category: "guests", title: "Bella the Beagle", description: "Making new friends", placeholder: "🐶" },
  { id: 15, category: "guests", title: "Charlie & Luna", description: "Best friends forever", placeholder: "🐕‍🦺" },
  { id: 16, category: "guests", title: "Rocky the Bulldog", description: "Loving his stay", placeholder: "🐕" },
];

const categories = [
  { value: "all", label: "All Photos" },
  { value: "suites", label: "Suites" },
  { value: "playtime", label: "Playtime" },
  { value: "amenities", label: "Amenities" },
  { value: "guests", label: "Happy Guests" },
];

export default function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredImages = selectedCategory === "all" 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-50 to-pink-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4">Photo Gallery</Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              See Happy Tails in Action
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Take a virtual tour of our facilities and see the fun your pet will have at Zaine's Stay & Play
            </p>
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Category Tabs */}
          <Tabs defaultValue="all" className="mb-8" onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              {categories.map((category) => (
                <TabsTrigger key={category.value} value={category.value}>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Image Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredImages.map((image) => (
              <Card
                key={image.id}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
              >
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
                  {/* Placeholder - In production, use real images */}
                  <div className="flex h-full items-center justify-center text-6xl">
                    {image.placeholder}
                  </div>
                  <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/20">
                    <div className="flex h-full items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-12 w-12 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{image.title}</h3>
                  <p className="text-sm text-muted-foreground">{image.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredImages.length === 0 && (
            <div className="py-16 text-center">
              <Camera className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No photos yet</h3>
              <p className="text-muted-foreground">Check back soon for more photos!</p>
            </div>
          )}
        </div>
      </section>

      {/* Video Tours */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Facility Video Tours</h2>
            <p className="text-lg text-muted-foreground">
              Get a closer look at our amenities and what makes us special
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            {[
              { title: "Full Facility Tour", duration: "5:30", views: "1.2K" },
              { title: "Playtime Activities", duration: "3:15", views: "890" },
              { title: "Suite Walkthrough", duration: "4:00", views: "1.5K" },
              { title: "Meet Our Team", duration: "2:45", views: "750" },
            ].map((video) => (
              <Card key={video.title} className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                  <div className="flex h-full items-center justify-center">
                    <div className="rounded-full bg-white/90 p-6 transition-all group-hover:scale-110 group-hover:bg-white">
                      <Play className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-2 font-semibold">{video.title}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{video.duration}</span>
                    <span>•</span>
                    <span>{video.views} views</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Webcam Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="mx-auto max-w-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-8 text-center text-white">
              <Camera className="mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-3xl font-bold">Live Webcam Access</h2>
              <p className="text-lg opacity-90">
                Watch your pet in real-time from anywhere
              </p>
            </div>
            <div className="p-8">
              <div className="mb-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Heart className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">24/7 Streaming</h3>
                    <p className="text-sm text-muted-foreground">
                      Check in on your pet anytime, day or night
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">HD Quality</h3>
                    <p className="text-sm text-muted-foreground">
                      Crystal clear video with sound
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">Secure Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Private login credentials for your pet&apos;s suite only
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="mt-1 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-semibold">Mobile Friendly</h3>
                    <p className="text-sm text-muted-foreground">
                      Watch from your phone, tablet, or computer
                    </p>
                  </div>
                </div>
              </div>
              <p className="rounded-lg bg-blue-50 p-4 text-sm text-muted-foreground">
                Webcam access is included with Deluxe and Luxury suites. Available as an add-on for Standard suites.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Create Your Own Happy Memories?</h2>
          <p className="mb-8 text-lg opacity-90">
            Book your pet&apos;s stay and see firsthand why families love Zaine's Stay & Play
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" variant="secondary" asChild>
              <a href="/book">Book Now</a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <a href="/contact">Schedule a Tour</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
