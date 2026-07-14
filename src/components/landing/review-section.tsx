"use client";

import * as React from "react";
import { Users, MapPin, ShieldCheck, Star, ArrowLeft, ArrowRight } from "lucide-react";

export function ReviewSection() {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      // Each card is ~380px + gap of 24px = 404px. Skipping 2 cards = ~808px
      const scrollAmount = 808;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const reviews = [
    {
      id: 1,
      name: "Sneha Kapoor",
      purchase: "Purchased 4 BHK",
      location: "Sector 146, Noida",
      text: "Beautiful interface, detailed property information, and excellent support. The site made comparing projects effortless.",
    },
    {
      id: 2,
      name: "Rahul Sharma",
      purchase: "Purchased 3 BHK",
      location: "Sector 150, Noida",
      text: "Creators Arena helped me find the perfect investment property. The location analysis and ROI metrics were spot on!",
    },
    {
      id: 3,
      name: "Ananya Desai",
      purchase: "Purchased 2 BHK",
      location: "Golf Course Ext",
      text: "I loved the side-by-side comparison feature. It made choosing between different builders so much easier and transparent.",
    },
    {
      id: 4,
      name: "Vikram Singh",
      purchase: "Purchased Villa",
      location: "Yamuna Expressway",
      text: "Highly recommend this platform. The pricing details are accurate, and I felt confident making my final decision here.",
    },
    {
      id: 5,
      name: "Priya Mehta",
      purchase: "Purchased 3 BHK",
      location: "Greater Noida West",
      text: "A very smooth and premium experience. All the floor plans and amenity details were exactly as shown on the site.",
    },
  ];

  // Duplicate the reviews many times to simulate infinite scrolling without complex looping logic
  const duplicatedReviews = Array(20).fill(reviews).flat();

  return (
    <section className="bg-background pt-0 pb-8 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 md:px-12 lg:px-16">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-5 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Users className="w-3.5 h-3.5" />
            CUSTOMER REVIEWS
          </div>
          <h2 className="text-3xl md:text-[40px] font-display font-medium text-slate-900 max-w-4xl leading-[1.2] dark:text-foreground">
            Real experiences from people who found their <br className="hidden md:block" /> perfect property with <span className="text-brand-purple">Creators Arena</span>
          </h2>
        </div>

        {/* Carousel Controls & Container */}
        <div className="relative group">
          {/* Left Button */}
          <button
            onClick={() => scroll("left")}
            className="absolute -left-6 md:-left-16 lg:-left-20 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-brand-light/25 text-brand-purple hover:bg-brand-light/35 shadow-sm transition-colors dark:bg-brand-light/20 dark:hover:bg-brand-light/30"
            aria-label="Previous review"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Right Button */}
          <button
            onClick={() => scroll("right")}
            className="absolute -right-6 md:-right-16 lg:-right-20 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-brand-light/25 text-brand-purple hover:bg-brand-light/35 shadow-sm transition-colors dark:bg-brand-light/20 dark:hover:bg-brand-light/30"
            aria-label="Next review"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          {/* Scroll Area */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-4 pb-8 pt-4 -mx-4 no-scrollbar scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {duplicatedReviews.map((review, index) => (
              <div
                key={`${review.id}-${index}`}
                className="snap-center bg-white rounded-[1.25rem] p-7 shadow-sm border border-slate-100 flex flex-col justify-between w-[350px] md:w-[380px] shrink-0 min-h-[250px] dark:bg-card dark:border-border dark:shadow-none"
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 dark:bg-muted">
                        <img
                          src={`https://i.pravatar.cc/150?u=${review.id}`}
                          alt={review.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-foreground">{review.name}</span>
                        <div className="flex items-center text-[11px] text-slate-500 mt-0.5 dark:text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1" />
                          <div className="flex flex-col leading-tight">
                            <span>{review.purchase},</span>
                            <span>{review.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-[10px] font-semibold text-green-600 gap-1 bg-green-50 px-1.5 py-0.5 rounded dark:bg-green-500/10 dark:text-green-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified Buyer</span>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400" />
                    ))}
                  </div>

                  <p className="text-[13px] text-slate-600 leading-relaxed dark:text-muted-foreground">
                    "{review.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
