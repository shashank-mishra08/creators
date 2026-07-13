import type {
  BestForTag,
  ComparisonResult,
  Property,
  PropertyScore,
  ScoreBreakdown,
  ScoreFactorKey,
} from "@/lib/types";
import { clamp } from "@/lib/utils";

/**
 * Rule-based recommendation engine (no AI — deterministic, explainable).
 *
 * Each factor is normalised to 0–100 *relative to the compared set*, then
 * combined using the platform weights. This keeps the comparison honest: scores
 * describe how each option stacks up against the others on screen, not against
 * some hidden absolute.
 */
export const WEIGHTS: Record<ScoreFactorKey, number> = {
  price: 0.3,
  amenities: 0.25,
  location: 0.25,
  builder: 0.1,
  investment: 0.1,
};

export const FACTOR_LABELS: Record<ScoreFactorKey, string> = {
  price: "Price",
  amenities: "Amenities",
  location: "Location",
  builder: "Builder",
  investment: "Investment",
};

/**
 * Floor applied to relative normalisation. Pure min-max would zero out the
 * weakest option on every axis, producing alarmingly low (and unrealistic)
 * overall scores for otherwise-good properties. Mapping onto [FLOOR, 100]
 * keeps clear differentiation while staying credible.
 */
const SCORE_FLOOR = 45;

/** Normalise `value` to [FLOOR,100] within [min,max]; higher is better. */
function normHigh(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return clamp(SCORE_FLOOR + ((value - min) / (max - min)) * (100 - SCORE_FLOOR));
}

/** Normalise where a *lower* raw value is better (e.g. price, distance). */
function normLow(value: number, min: number, max: number): number {
  if (max === min) return 100;
  return clamp(SCORE_FLOOR + ((max - value) / (max - min)) * (100 - SCORE_FLOOR));
}

const TOTAL_AMENITIES = 8;

function amenityScore(p: Property): number {
  const count = Object.values(p.amenities).filter(Boolean).length;
  return (count / TOTAL_AMENITIES) * 100;
}

/** Composite location convenience: connectivity index + proximity blend. */
function locationRaw(p: Property): number {
  const { connectivityIndex, metroKm, hospitalKm, schoolKm, airportKm } =
    p.location;
  // Proximity sub-score: closer landmarks → higher. Cap each contribution.
  const metro = clamp(100 - metroKm * 14);
  const hospital = clamp(100 - hospitalKm * 16);
  const school = clamp(100 - schoolKm * 20);
  const airport = clamp(100 - airportKm * 1.8);
  const proximity = (metro + hospital + school + airport) / 4;
  return connectivityIndex * 0.55 + proximity * 0.45;
}

function builderScore(p: Property): number {
  // Rating (0–5) is the main signal, nudged by delivery track record.
  const ratingPart = (p.builder.rating / 5) * 100;
  const trackPart = clamp((p.builder.deliveredProjects / 120) * 100);
  return ratingPart * 0.8 + trackPart * 0.2;
}

function investmentRaw(p: Property): number {
  // Blend appreciation, yield and demand into one 0–100-ish raw figure.
  return (
    p.investment.appreciationPct * 5 +
    p.investment.rentalYieldPct * 6 +
    p.investment.demandIndex * 0.4
  );
}

function deriveBestFor(
  p: Property,
  scores: Record<ScoreFactorKey, number>,
  investmentScore: number,
): BestForTag[] {
  const tags: BestForTag[] = [];
  const familySignal =
    (p.amenities.kidsArea ? 1 : 0) +
    (p.amenities.security ? 1 : 0) +
    (p.location.schoolKm <= 1.2 ? 1 : 0) +
    (p.amenities.sports ? 1 : 0);
  if (familySignal >= 3 && scores.location >= 55) tags.push("Families");
  if (investmentScore >= 60) tags.push("Investors");
  if (p.priceLakh >= 250 && scores.amenities >= 75 && p.builder.rating >= 4.4)
    tags.push("Luxury Buyers");
  if (p.investment.rentalYieldPct >= 3.2 && p.location.connectivityIndex >= 70)
    tags.push("Rental Income");
  return tags.length ? tags : ["Families"];
}

/**
 * Score and rank a selected set of properties.
 * Pass 2–4 properties (the platform compare limit).
 */
export function compareProperties(selected: Property[]): ComparisonResult {
  const set = selected;

  // Pre-compute raw factor values across the set for normalisation bounds.
  const priceRaw = set.map((p) => p.priceLakh);
  const amenRaw = set.map(amenityScore);
  const locRaw = set.map(locationRaw);
  const buildRaw = set.map(builderScore);
  const invRaw = set.map(investmentRaw);

  const bounds = (arr: number[]) => ({ min: Math.min(...arr), max: Math.max(...arr) });
  // Price bounds ignore unknown prices (0) so a missing price never drags the
  // normalisation range to zero (which would inflate every other property).
  const validPrices = priceRaw.filter((v) => v > 0);
  const priceBounds = validPrices.length
    ? { min: Math.min(...validPrices), max: Math.max(...validPrices) }
    : { min: 0, max: 0 };
  const b = {
    price: priceBounds,
    amen: bounds(amenRaw),
    loc: bounds(locRaw),
    build: bounds(buildRaw),
    inv: bounds(invRaw),
  };

  const scores: Record<string, PropertyScore> = {};

  set.forEach((p, i) => {
    const factor: Record<ScoreFactorKey, number> = {
      // Lower price normalises higher (better value) — but amenities/location
      // weighting keeps premium projects competitive overall. An unknown price
      // (0) scores neutral-low rather than "cheapest", so it can't win on price.
      price:
        priceRaw[i] > 0
          ? normLow(priceRaw[i], b.price.min, b.price.max)
          : SCORE_FLOOR,
      amenities: normHigh(amenRaw[i], b.amen.min, b.amen.max),
      location: normHigh(locRaw[i], b.loc.min, b.loc.max),
      builder: normHigh(buildRaw[i], b.build.min, b.build.max),
      investment: normHigh(invRaw[i], b.inv.min, b.inv.max),
    };

    const breakdown: ScoreBreakdown[] = (
      Object.keys(WEIGHTS) as ScoreFactorKey[]
    ).map((key) => ({
      key,
      label: FACTOR_LABELS[key],
      weight: WEIGHTS[key],
      value: Math.round(factor[key]),
      contribution: factor[key] * WEIGHTS[key],
    }));

    const overall = Math.round(
      breakdown.reduce((sum, s) => sum + s.contribution, 0),
    );

    // Investment-only score blends the normalised investment factor with the
    // property's raw appreciation/yield strength.
    const investmentScore = Math.round(
      factor.investment * 0.6 +
        clamp(p.investment.appreciationPct * 6) * 0.25 +
        clamp(p.investment.rentalYieldPct * 18) * 0.15,
    );

    scores[p.id] = {
      propertyId: p.id,
      overall,
      investmentScore,
      breakdown,
      bestFor: deriveBestFor(p, factor, investmentScore),
    };
  });

  const ranking = [...set]
    .sort((a, c) => scores[c.id].overall - scores[a.id].overall)
    .map((p) => p.id);

  // Best Value: strongest overall score per crore spent. Properties with an
  // unknown price (0) are excluded — value-for-money is undefined without a
  // price, and dividing by 0 would otherwise make them win automatically.
  const priced = set.filter((p) => p.priceLakh > 0);
  const bestValueId = priced.length
    ? [...priced].sort(
        (a, c) =>
          scores[c.id].overall / c.priceLakh -
          scores[a.id].overall / a.priceLakh,
      )[0].id
    : ranking[0];

  // Best Luxury: premium price + amenities + builder prestige.
  const luxuryScore = (p: Property) =>
    p.priceLakh * 0.5 +
    amenityScore(p) * 2 +
    p.builder.rating * 30 +
    (p.kind === "Villa" ? 80 : 0);
  const bestLuxuryId = [...set].sort(
    (a, c) => luxuryScore(c) - luxuryScore(a),
  )[0].id;

  // Best Family: schools/kids/safety/connectivity emphasis.
  const familyScore = (p: Property) =>
    (p.amenities.kidsArea ? 25 : 0) +
    (p.amenities.security ? 25 : 0) +
    (p.amenities.sports ? 15 : 0) +
    clamp(100 - p.location.schoolKm * 20) * 0.4 +
    p.location.connectivityIndex * 0.25;
  const bestFamilyId = [...set].sort(
    (a, c) => familyScore(c) - familyScore(a),
  )[0].id;

  const bestInvestmentId = [...set].sort(
    (a, c) => scores[c.id].investmentScore - scores[a.id].investmentScore,
  )[0].id;

  return {
    properties: set,
    scores,
    ranking,
    bestValueId,
    bestLuxuryId,
    bestFamilyId,
    bestInvestmentId,
  };
}

export function scoreTier(score: number): {
  label: string;
  color: string;
} {
  if (score >= 85) return { label: "Excellent", color: "hsl(var(--success))" };
  if (score >= 70) return { label: "Very Good", color: "#6366f1" };
  if (score >= 55) return { label: "Good", color: "hsl(var(--accent))" };
  return { label: "Fair", color: "hsl(var(--warning))" };
}
