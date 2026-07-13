import { MapPin } from "lucide-react";
import type { Property } from "@/lib/types";

/**
 * Stylised connectivity map for a property (no external tiles / API key).
 * Shows the project pin at centre with landmark dots positioned by their real
 * distances — a lightweight, on-brand stand-in for an embedded map.
 */
export function LocationMap({ property }: { property: Property }) {
  const { metroKm, hospitalKm, schoolKm, airportKm } = property.location;
  // Map each distance to a radius from centre (closer = nearer the pin).
  const r = (km: number, max: number) => 16 + Math.min(km / max, 1) * 40;
  const dots = [
    { label: "M", title: "Metro", d: r(metroKm, 12), a: -35, color: "hsl(var(--accent))" },
    { label: "H", title: "Hospital", d: r(hospitalKm, 12), a: 55, color: "#ef4444" },
    { label: "S", title: "School", d: r(schoolKm, 12), a: 150, color: "#2563eb" },
    { label: "E", title: "Expressway", d: r(airportKm, 15), a: 230, color: "#16a34a" },
  ];
  const cx = 120;
  const cy = 70;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-border bg-muted/40">
      <svg viewBox="0 0 240 140" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        {/* street grid */}
        <g stroke="hsl(var(--border))" strokeWidth="1" opacity="0.7">
          {[20, 55, 90, 125].map((y) => (
            <line key={y} x1="0" y1={y} x2="240" y2={y} />
          ))}
          {[40, 90, 150, 200].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="140" />
          ))}
        </g>
        {/* a couple of blocks */}
        <g fill="hsl(var(--accent) / 0.08)">
          <rect x="44" y="24" width="42" height="28" rx="3" />
          <rect x="154" y="94" width="42" height="28" rx="3" />
        </g>
        {/* radius rings */}
        {[28, 44].map((rad) => (
          <circle key={rad} cx={cx} cy={cy} r={rad} fill="none" stroke="hsl(var(--accent) / 0.25)" strokeDasharray="3 3" />
        ))}
        {/* landmark dots */}
        {dots.map((dot) => {
          const x = cx + Math.cos((dot.a * Math.PI) / 180) * dot.d;
          const y = cy + Math.sin((dot.a * Math.PI) / 180) * dot.d;
          return (
            <g key={dot.title}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke={dot.color} strokeWidth="1" opacity="0.4" />
              <circle cx={x} cy={y} r="7" fill={dot.color} />
              <text x={x} y={y + 2.6} textAnchor="middle" fontSize="7" fontWeight="700" fill="#fff">
                {dot.label}
              </text>
            </g>
          );
        })}
        {/* central pin */}
        <circle cx={cx} cy={cy} r="10" fill="hsl(var(--accent))" />
        <circle cx={cx} cy={cy} r="3.5" fill="#fff" />
      </svg>
      <div className="absolute bottom-1.5 left-2 right-2 flex items-center gap-1 truncate rounded-md bg-card/80 px-2 py-1 text-[10px] font-semibold text-foreground backdrop-blur">
        <MapPin className="h-3 w-3 shrink-0 text-accent" />
        <span className="truncate">{property.locality}</span>
      </div>
    </div>
  );
}
