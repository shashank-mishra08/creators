import { Building2, Lock, MessagesSquare, ShieldCheck, User } from "lucide-react";

/**
 * The admin login side panel, drawn entirely in code.
 *
 * Replaces the 316 KB `admin-login.jpg`: the copy is now real text (selectable,
 * translatable, readable by screen readers) and the scene is vector, so it stays
 * crisp at any panel width instead of being cropped by object-fit.
 *
 * Layered back to front: background wash → orbit arcs → skyline → villa →
 * ground reflection → copy. Everything is decorative except the copy, so the
 * SVGs are aria-hidden.
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
  {
    icon: Lock,
    title: "Creators Arena Admin",
    body: "Authorised personnel only",
  },
] as const;

export function AdminLoginArtwork() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0B0718]">
      {/* ── Background wash ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 78% 34%, #3B1D8F 0%, #1B0B45 42%, #0B0718 78%)",
        }}
      />
      <div className="absolute -right-24 top-24 h-[26rem] w-[26rem] rounded-full bg-[#7166F0]/25 blur-[120px]" />
      <div className="absolute -left-24 bottom-10 h-[22rem] w-[22rem] rounded-full bg-[#4C3BCF]/20 blur-[120px]" />

      {/* Scene is confined to the right half and bottom-anchored, mirroring the
          original artwork's composition. */}
      <div className="absolute inset-y-0 right-0 w-[58%]">
        <Scene />
      </div>

      {/* Scrim so the copy always sits on darkness, whatever the panel width. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #0B0718 0%, rgba(11,7,24,0.97) 32%, rgba(11,7,24,0.72) 48%, rgba(11,7,24,0) 68%)",
        }}
      />

      {/* ── Copy ──
          Top padding reserves the band the logo is absolutely positioned in;
          without it the centred copy rides up into the logo on short viewports. */}
      <div className="relative z-10 flex h-full flex-col justify-center px-12 pb-14 pt-28 xl:px-14">
        <div className="max-w-[26rem]">
          <h2 className="font-display text-[2.75rem] font-extrabold leading-[1.04] tracking-tight text-white xl:text-5xl">
            Manage your
            <br />
            <span className="text-[#8B7CFF]">properties,</span>
            <br />
            smarter.
          </h2>

          <p className="mt-5 text-[15px] text-white/55">The Creators admin panel</p>

          <div className="mt-6 h-[3px] w-14 rounded-full bg-[#7166F0]" />

          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li
                key={f.title}
                className="flex items-start gap-3.5 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 backdrop-blur-sm"
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

          <div className="mt-10 flex items-center gap-3">
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

/**
 * Skyline + villa, anchored bottom-right so the composition survives any panel
 * aspect ratio (the copy occupies the left, which stays clear).
 */
function Scene() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none h-full w-full"
      viewBox="0 0 620 900"
      preserveAspectRatio="xMidYMax meet"
    >
      <defs>
        <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B4BE0" />
          <stop offset="100%" stopColor="#1A1150" />
        </linearGradient>
        <linearGradient id="towerAlt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3E63D8" />
          <stop offset="100%" stopColor="#15103F" />
        </linearGradient>
        <linearGradient id="slab" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#E8E6F5" />
          <stop offset="55%" stopColor="#C9C4E4" />
          <stop offset="100%" stopColor="#8E88BC" />
        </linearGradient>
        {/* Warm interior light, dimmed at the top of each pane so the glazing
            reads as lit rooms rather than flat orange. */}
        <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5A3E2B" />
          <stop offset="20%" stopColor="#C98C52" />
          <stop offset="62%" stopColor="#DFA463" />
          <stop offset="100%" stopColor="#7A4C2A" />
        </linearGradient>
        {/* Ceiling / floor bands seen through the glazing. */}
        <pattern id="interior" width="1" height="34" patternUnits="userSpaceOnUse">
          <rect width="620" height="5" y="0" fill="#3A2517" opacity="0.5" />
          <rect width="620" height="2" y="7" fill="#FFE0B0" opacity="0.35" />
        </pattern>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1A1046" />
          <stop offset="100%" stopColor="#0B0718" />
        </linearGradient>
        <linearGradient id="sink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0B0718" stopOpacity="0" />
          <stop offset="100%" stopColor="#0B0718" stopOpacity="1" />
        </linearGradient>
        {/* Masks are luminance-based: white reveals, black hides. This has to be
            a white ramp, not a black one, or the reflections vanish entirely. */}
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF" stopOpacity="0.85" />
          <stop offset="70%" stopColor="#FFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFF" stopOpacity="0" />
        </linearGradient>
        {/* Reflections fade out as they fall away from the building. */}
        <mask id="reflectFade">
          <rect x="0" y="700" width="620" height="200" fill="url(#fade)" />
        </mask>
      </defs>

      {/* Orbit arcs sweeping behind the scene */}
      <g fill="none" stroke="#8B7CFF" strokeOpacity="0.28">
        <path d="M120 470 A 330 330 0 0 1 560 96" />
        <path d="M190 520 A 260 260 0 0 1 545 214" />
      </g>
      <circle cx="396" cy="112" r="7" fill="#8B7CFF" />
      <circle cx="396" cy="112" r="14" fill="#8B7CFF" fillOpacity="0.25" />
      <circle cx="318" cy="264" r="5" fill="#8B7CFF" fillOpacity="0.85" />

      <Skyline />
      <Villa />

      {/* Ground plane */}
      <rect x="0" y="700" width="620" height="200" fill="url(#ground)" />
      <g mask="url(#reflectFade)">
        {/* Mirrored building, foreshortened. A reflection on wet paving is
            compressed by the viewing angle — mirroring 1:1 reads as a second
            building hanging below rather than as a reflection.
            Mirroring about y=700 with factor k: translate(0, 700(1+k)) scale(1,-k). */}
        <g transform="translate(0,1015) scale(1,-0.45)" opacity="0.12">
          <Villa />
        </g>
        {/* Warm light smears bleeding down the paving */}
        <g fill="#F0A557" opacity="0.4">
          <rect x="318" y="704" width="9" height="74" rx="4.5" />
          <rect x="376" y="704" width="7" height="58" rx="3.5" />
          <rect x="436" y="704" width="11" height="88" rx="5.5" />
          <rect x="500" y="704" width="7" height="54" rx="3.5" />
          <rect x="556" y="704" width="9" height="68" rx="4.5" />
        </g>
      </g>
      {/* Kerb line grounding the villa */}
      <rect x="240" y="698" width="380" height="3" fill="#B9B3DD" opacity="0.35" />

      {/* Sink the paving into the panel background so the reflection has no
          hard bottom edge. */}
      <rect x="0" y="800" width="620" height="100" fill="url(#sink)" />
    </svg>
  );
}

/** Distant towers with lit windows, receding to the left. */
function Skyline() {
  const towers = [
    { x: 40, y: 470, w: 46, h: 230, g: "towerAlt" },
    { x: 92, y: 392, w: 38, h: 308, g: "tower" },
    { x: 136, y: 330, w: 52, h: 370, g: "tower" },
    { x: 194, y: 424, w: 34, h: 276, g: "towerAlt" },
    { x: 234, y: 286, w: 46, h: 414, g: "tower" },
    { x: 286, y: 372, w: 40, h: 328, g: "towerAlt" },
  ];

  return (
    <g>
      {towers.map((t) => (
        <g key={t.x}>
          <rect
            x={t.x}
            y={t.y}
            width={t.w}
            height={t.h}
            fill={`url(#${t.g})`}
            rx="2"
          />
          {/* Spire */}
          <rect x={t.x + t.w / 2 - 1.5} y={t.y - 26} width="3" height="26" fill="#6B5BE8" />
          {/* Window grid — deterministic so the render is stable */}
          {Array.from({ length: Math.floor(t.h / 22) }).map((_, row) =>
            Array.from({ length: Math.floor(t.w / 13) }).map((_, col) => {
              const lit = (row * 7 + col * 3 + t.x) % 5 < 2;
              if (!lit) return null;
              return (
                <rect
                  key={`${row}-${col}`}
                  x={t.x + 5 + col * 13}
                  y={t.y + 12 + row * 22}
                  width="5"
                  height="9"
                  fill="#C9B6FF"
                  opacity={0.75}
                />
              );
            }),
          )}
        </g>
      ))}
    </g>
  );
}

/**
 * Three cantilevered floors with warm glazing — the foreground villa.
 * Each lower floor reaches further left than the one above, which is what gives
 * the stack its cantilevered read; slabs overhang the glazing on both sides.
 */
function Villa() {
  return (
    <g>
      {/* ── Top floor ── */}
      <rect x="374" y="302" width="218" height="13" fill="url(#slab)" rx="2" />
      <rect x="385" y="315" width="200" height="106" fill="#120A38" />
      <rect x="392" y="322" width="186" height="92" fill="url(#glass)" opacity="0.9" />
      <rect x="392" y="322" width="186" height="92" fill="url(#interior)" opacity="0.55" />
      <g stroke="#120A38" strokeWidth="4">
        <line x1="438" y1="322" x2="438" y2="414" />
        <line x1="484" y1="322" x2="484" y2="414" />
        <line x1="530" y1="322" x2="530" y2="414" />
      </g>
      <rect x="374" y="421" width="218" height="13" fill="url(#slab)" rx="2" />

      {/* ── Middle floor — reaches further left ── */}
      {/* Shadowed underside on the part that overhangs nothing — this is what
          makes the stack read as cantilevered rather than as stacked boxes. */}
      <rect x="324" y="434" width="61" height="9" fill="#080520" opacity="0.75" />
      <rect x="324" y="421" width="268" height="13" fill="url(#slab)" rx="2" />
      <rect x="335" y="434" width="250" height="112" fill="#120A38" />
      <rect x="342" y="441" width="236" height="98" fill="url(#glass)" opacity="0.93" />
      <rect x="342" y="441" width="236" height="98" fill="url(#interior)" opacity="0.55" />
      <g stroke="#120A38" strokeWidth="4">
        <line x1="390" y1="441" x2="390" y2="539" />
        <line x1="438" y1="441" x2="438" y2="539" />
        <line x1="486" y1="441" x2="486" y2="539" />
        <line x1="534" y1="441" x2="534" y2="539" />
      </g>
      {/* Balcony railing on the cantilever */}
      <g stroke="#CFCBE8" strokeOpacity="0.45" strokeWidth="1.6">
        <line x1="324" y1="410" x2="592" y2="410" />
        <line x1="324" y1="410" x2="324" y2="421" />
      </g>
      <rect x="324" y="546" width="268" height="13" fill="url(#slab)" rx="2" />

      {/* ── Ground floor — widest ── */}
      <rect x="290" y="559" width="45" height="9" fill="#080520" opacity="0.75" />
      <rect x="290" y="546" width="302" height="13" fill="url(#slab)" rx="2" />
      <rect x="301" y="559" width="284" height="141" fill="#120A38" />
      <rect x="308" y="566" width="270" height="134" fill="url(#glass)" opacity="0.88" />
      <rect x="308" y="566" width="270" height="134" fill="url(#interior)" opacity="0.55" />
      <g stroke="#120A38" strokeWidth="5">
        <line x1="362" y1="566" x2="362" y2="700" />
        <line x1="416" y1="566" x2="416" y2="700" />
        <line x1="470" y1="566" x2="470" y2="700" />
        <line x1="524" y1="566" x2="524" y2="700" />
      </g>
      <g stroke="#CFCBE8" strokeOpacity="0.45" strokeWidth="1.6">
        <line x1="290" y1="535" x2="592" y2="535" />
      </g>
      {/* Structural column carrying the cantilevers at the open corner */}
      <rect x="290" y="559" width="18" height="141" fill="url(#slab)" opacity="0.8" />

      {/* Warm spill from the façade onto the forecourt */}
      <ellipse cx="440" cy="700" rx="165" ry="16" fill="#F0A557" opacity="0.2" />

      {/* Entry steps */}
      <g fill="#CFCBE8" opacity="0.45">
        <rect x="352" y="690" width="180" height="4" />
        <rect x="344" y="694" width="196" height="4" />
      </g>

      {/* Landscaping — layered canopies, muted so they sit in the night scene */}
      <g>
        <rect x="252" y="640" width="4" height="60" fill="#241A12" />
        <circle cx="254" cy="626" r="30" fill="#1B3A2A" />
        <circle cx="276" cy="648" r="21" fill="#16302270" />
        <circle cx="234" cy="650" r="19" fill="#1B3A2A" />
        <circle cx="262" cy="612" r="17" fill="#245040" opacity="0.8" />
      </g>
      <g>
        <rect x="205" y="668" width="3" height="32" fill="#241A12" />
        <circle cx="206" cy="660" r="17" fill="#1B3A2A" />
        <circle cx="192" cy="674" r="12" fill="#163022" />
      </g>

      {/* Path lights */}
      <g fill="#FFD9A0">
        <circle cx="322" cy="688" r="2.5" />
        <circle cx="566" cy="688" r="2.5" />
      </g>
    </g>
  );
}
