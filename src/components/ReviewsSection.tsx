import { useEffect, useRef, useState } from "react";
import { Star } from "lucide-react";
import { useReveal } from "../hooks/useReveal";
import { Avatar } from "./Avatar";
import { Container } from "./ui";

export const reviewCards = [
  {
    quote: "Same cleaner for four months now. She knows the flat better than we do — the fan blades and window tracks are always done without asking.",
    name: "Mei L.",
    city: "Tampines",
    service: "Weekly home cleaning",
    bookings: "18 bookings",
    date: "Jul 2026"
  },
  {
    quote: "Booked online in two minutes, got a WhatsApp confirmation the same day. The clean itself was thorough and the photo report is a nice touch.",
    name: "Daniel T.",
    city: "Queenstown",
    service: "Fortnightly cleaning",
    bookings: "9 bookings",
    date: "Jun 2026"
  },
  {
    quote: "After our reno, there was fine dust on every ledge and inside every cabinet. The team wiped it all down and the checklist showed exactly what was covered.",
    name: "Jessica N.",
    city: "Serangoon",
    service: "Post-renovation clean",
    bookings: "3 bookings",
    date: "Jun 2026"
  },
  {
    quote: "AE saved our weekends. The same cleaner comes every other week and the flat feels reset without us managing anything.",
    name: "Priya S.",
    city: "Bedok",
    service: "Fortnightly cleaning",
    bookings: "14 bookings",
    date: "May 2026"
  },
  {
    quote: "Our move-out clean got the full deposit back. Cabinets, fridge, baseboards — the landlord had nothing to point at.",
    name: "Marcus T.",
    city: "Bukit Timah",
    service: "Move-out cleaning",
    bookings: "2 bookings",
    date: "May 2026"
  },
  {
    quote: "Paying by PayNow after the clean instead of upfront made trying AE feel zero-risk. We've stayed on ever since.",
    name: "Nina K.",
    city: "Punggol",
    service: "Post-renovation clean",
    bookings: "4 bookings",
    date: "Apr 2026"
  }
] as const;

export function ReviewsSection() {
  const headerReveal = useReveal<HTMLDivElement>();
  const gridReveal = useReveal<HTMLDivElement>();
  const marqueeRef = useRef<HTMLDivElement | null>(null);
  const [marqueeActive, setMarqueeActive] = useState(true);

  useEffect(() => {
    const element = marqueeRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setMarqueeActive(entry.isIntersecting),
      { rootMargin: "120px 0px" }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <section className="scroll-mt-[88px] bg-paper py-20 lg:py-28" id="reviews" aria-labelledby="reviews-title">
      <Container className="grid gap-10">
        <div
          ref={headerReveal.ref}
          className={`mx-auto grid max-w-3xl justify-items-center gap-4 text-center transition duration-500 ${headerReveal.className}`}
        >
          <p className="m-0 text-sm font-semibold uppercase tracking-[0.08em] text-primary-ink">REVIEWS</p>
          <h2 id="reviews-title" className="m-0 font-display text-h2 font-semibold text-ink">
            Loved by homes <em className="italic text-primary-ink">across Singapore.</em>
          </h2>
          <p className="m-0 text-lg leading-8 text-ink/65">Real feedback from weekly cleans, move-in/out handovers, and post-renovation cleans across Singapore.</p>
        </div>
        <div ref={gridReveal.ref} className={`overflow-hidden transition duration-500 ${gridReveal.className}`}>
          <div
            ref={marqueeRef}
            className={`flex w-max gap-5 will-change-transform animate-[reviews-marquee_38s_linear_infinite] hover:[animation-play-state:paused] ${marqueeActive ? "" : "[animation-play-state:paused]"}`}
          >
            {[...reviewCards, ...reviewCards].map((review, index) => (
              <ReviewCard key={`${review.name}-${index}`} review={review} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function ReviewCard({ review }: { review: (typeof reviewCards)[number] }) {
  return (
    <article className="w-[min(82vw,360px)] shrink-0 rounded-[20px] border border-line bg-white p-6 shadow-[0_10px_24px_rgb(9_30_66_/_0.05)] sm:w-[390px]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={review.name} className="ring-2 ring-primary-soft" />
          <span>
            <strong className="block text-sm font-semibold text-ink">{review.name}</strong>
            <span className="block text-xs text-ink/55">{review.city} · {review.bookings}</span>
          </span>
        </div>
        <div className="flex gap-1 text-gold" aria-label="Five star rating">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} size={15} fill="currentColor" aria-hidden="true" />
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-ink/60">
        <span className="rounded-full bg-primary-soft px-3 py-1 text-ink">{review.service}</span>
        <span className="rounded-full border border-line bg-white px-3 py-1">{review.date}</span>
      </div>
      <p className="mb-0 mt-5 text-[17px] leading-relaxed text-ink/80">"{review.quote}"</p>
    </article>
  );
}
