"use client";

import * as React from "react";
import Link from "next/link";
import { Users, MapPin, ShieldCheck, Star, ArrowLeft, ArrowRight } from "lucide-react";
import type { ReviewWithProperty } from "@/lib/services/review.service";

/** The shape the carousel renders, whichever source it came from. */
interface Card {
  key: string;
  name: string;
  /** Line under the name — what they bought, or what they reviewed. */
  line1: string;
  line2: string;
  text: string;
  rating: number;
  /** Set for real reviews so the card can link to the project. */
  propertyId?: string;
  /** Only the curated cards carry the avatar service + buyer badge. */
  avatarSeed?: number;
}

/**
 * Home page customer reviews.
 *
 * Shows real reviews from the database once any exist, and falls back to the
 * curated launch copy while there are none — an empty carousel on the landing
 * page reads as a broken section. The two are never mixed: real reviews replace
 * the placeholders entirely rather than sitting beside them.
 */
function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ReviewSection({ reviews = [] }: { reviews?: ReviewWithProperty[] }) {
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

  const curated: Card[] = [
    {
      key: "c1",
      name: "Sneha Kapoor",
      line1: "Purchased 4 BHK,",
      line2: "Sector 146, Noida",
      rating: 5,
      avatarSeed: 1,
      text: "Beautiful interface, detailed property information, and excellent support. The site made comparing projects effortless.",
    },
    {
      key: "c2",
      name: "Rahul Sharma",
      line1: "Purchased 3 BHK,",
      line2: "Sector 150, Noida",
      rating: 5,
      avatarSeed: 2,
      text: "Creators Arena helped me find the perfect investment property. The location analysis and ROI metrics were spot on!",
    },
    {
      key: "c3",
      name: "Ananya Desai",
      line1: "Purchased 2 BHK,",
      line2: "Golf Course Ext",
      rating: 5,
      avatarSeed: 3,
      text: "I loved the side-by-side comparison feature. It made choosing between different builders so much easier and transparent.",
    },
    {
      key: "c4",
      name: "Vikram Singh",
      line1: "Purchased Villa,",
      line2: "Yamuna Expressway",
      rating: 5,
      avatarSeed: 4,
      text: "Highly recommend this platform. The pricing details are accurate, and I felt confident making my final decision here.",
    },
    {
      key: "c5",
      name: "Priya Mehta",
      line1: "Purchased 3 BHK,",
      line2: "Greater Noida West",
      rating: 5,
      avatarSeed: 5,
      text: "A very smooth and premium experience. All the floor plans and amenity details were exactly as shown on the site.",
    },
  ];

  const real: Card[] = reviews.map((r) => ({
    key: r.id,
    name: r.authorName,
    line1: `Reviewed ${r.propertyName},`,
    line2: [r.propertyLocality, r.propertyCity].filter(Boolean).join(", "),
    text: r.comment,
    rating: r.rating,
    propertyId: r.propertyId,
  }));

  const cards = real.length > 0 ? real : curated;

  // The track is padded out so the strip fills the row and scrolls, rather than
  // looping properly. With only one or two real reviews that repetition would
  // read as padding, so short lists are shown once, as they are.
  const track =
    cards.length >= 3
      ? Array(Math.ceil(20 / cards.length))
          .fill(cards)
          .flat()
          .map((c: Card, i) => ({ ...c, key: `${c.key}-${i}` }))
      : cards;

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
            {track.map((review) => (
              <div
                key={review.key}
                className="snap-center bg-white rounded-[1.25rem] p-7 shadow-sm border border-slate-100 flex flex-col justify-between w-[350px] md:w-[380px] shrink-0 min-h-[250px] dark:bg-card dark:border-border dark:shadow-none"
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 dark:bg-muted">
                        {review.avatarSeed ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`https://i.pravatar.cc/150?u=${review.avatarSeed}`}
                            alt={review.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          // Real reviewers get their initials, not a stock photo
                          // of someone else.
                          <span className="flex h-full w-full items-center justify-center bg-brand-purple/10 text-xs font-bold text-brand-purple">
                            {initialsOf(review.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-foreground">{review.name}</span>
                        <div className="flex items-center text-[11px] text-slate-500 mt-0.5 dark:text-muted-foreground">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" />
                          <div className="flex flex-col leading-tight">
                            <span>{review.line1}</span>
                            <span>{review.line2}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {review.propertyId ? (
                      <Link
                        href={`/properties/${review.propertyId}`}
                        className="shrink-0 rounded bg-brand-purple/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand-purple hover:bg-brand-purple/20"
                      >
                        View project
                      </Link>
                    ) : (
                      <div className="flex items-center text-[10px] font-semibold text-green-600 gap-1 bg-green-50 px-1.5 py-0.5 rounded dark:bg-green-500/10 dark:text-green-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified Buyer</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={
                          n <= review.rating
                            ? "w-4 h-4 fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400"
                            : "w-4 h-4 fill-transparent text-slate-300 dark:text-muted-foreground/40"
                        }
                      />
                    ))}
                  </div>

                  <p className="text-[13px] text-slate-600 leading-relaxed dark:text-muted-foreground line-clamp-6">
                    &quot;{review.text}&quot;
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
