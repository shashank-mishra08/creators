import Image from "next/image";
import { Building2, MessagesSquare, ShieldCheck, User } from "lucide-react";

/**
 * The admin login side panel: a rendered scene with the copy drawn over it.
 *
 * The scene used to be vector shapes built in code. They were crisp but never
 * read as the artwork they were imitating, so the photograph is back — as a
 * background layer only. The copy stays real text, so it is selectable,
 * translatable, readable by screen readers, and reflows instead of being baked
 * into the picture at one size.
 */

const FEATURES = [
  {
    icon: Building2,
    title: "Add & manage every project",
    body: "Create, edit and organize listings easily.",
  },
  {
    icon: MessagesSquare,
    title: "Manage client queries",
    body: "Respond faster and build stronger relationships.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access for your team",
    body: "Secure, flexible and built for scale.",
  },
  // No fourth "Creators Arena Admin / Authorised personnel only" card: those
  // exact words already sit in the footer below, and a notice is not a feature.
  // Carrying both also pushed the copy 83px past a 1366×768 panel, which cut
  // the footer off.
] as const;

export function AdminLoginArtwork() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0718]">
      {/* ── Background photograph ──
          A rendered scene rather than the vector one that used to be drawn here:
          the flat shapes never read as the reference artwork. `object-cover`
          with a right-hand anchor keeps the villa in frame as the panel narrows,
          because the composition's subject is on that side and the left is
          deliberately empty. `priority` — it is the only thing above the fold. */}
      <Image
        src="/brand/admin-login-bg.jpg"
        alt=""
        aria-hidden
        fill
        priority
        sizes="52vw"
        className="object-cover object-right"
      />

      {/* Scrim so the copy always sits on darkness, whatever the panel width.
          The photograph already fades left; this guarantees the contrast rather
          than trusting the image to hold it at every aspect ratio. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #0B0718 0%, rgba(11,7,24,0.92) 26%, rgba(11,7,24,0.62) 46%, rgba(11,7,24,0) 70%)",
        }}
      />

      {/* ── Logo + copy ──
          The logo sits in the flow rather than absolutely positioned. Reserving
          space for it with top padding worked until the panel got short: the
          copy is taller than a 1366×768 panel, so centring pushed it up under
          the logo by 43px. In the flow the two can never collide, whatever the
          height. `my-auto` centres the copy in whatever room is left. */}
      {/* Padding opens up only once there is height to spend it on: at 1024×640
          the copy is 57px taller than the panel, and trimming the frame is what
          buys that back rather than shrinking the type. */}
      <div className="relative z-10 flex h-full flex-col overflow-hidden px-10 py-4 xl:px-14 xl:py-10 [@media(min-height:720px)]:py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/creators-logo.png"
          alt="Creators"
          className="w-[120px] shrink-0 object-contain opacity-90 brightness-0 invert"
        />
        <div className="my-auto max-w-[26rem] py-0 [@media(min-height:720px)]:py-2">
          <h2 className="font-display text-[2.75rem] font-extrabold leading-[1.04] tracking-tight text-white xl:text-5xl">
            Manage your
            <br />
            <span className="text-[#8B7CFF]">properties,</span>
            <br />
            smarter.
          </h2>

          <p className="mt-4 text-[15px] text-white/55">The Creators admin panel</p>

          <div className="mt-5 h-[3px] w-14 rounded-full bg-[#7166F0]" />

          <ul className="mt-6 space-y-2.5">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                className="flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3.5 backdrop-blur-sm"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#7166F0]/20 ring-1 ring-[#7166F0]/30">
                  <f.icon className="h-5 w-5 text-[#A99BFF]" strokeWidth={1.8} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold leading-snug text-white">
                    {f.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-white/50">
                    {f.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {/* Dropped on very short panels. It is a restatement, not information
              — the feature list above already says what this panel is for — and
              on a 1024×640 window it is the 25px that would otherwise clip. */}
          <div className="mt-7 hidden items-center gap-3 [@media(min-height:680px)]:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
              <User className="h-4 w-4 text-[#A99BFF]" strokeWidth={1.8} />
            </span>
            <span className="text-[13px] leading-tight text-white/55">
              Creators Arena Admin
              <br />
              Authorised personnel only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
