/**
 * Cloudinary delivery URLs, rewritten to ask for a different variant.
 *
 * Uploads land on Cloudinary, and its delivery URL carries the transformation
 * in the path: the segment between `/image/upload/` and the version is a
 * comma-separated instruction list. Putting one there asks the CDN for a
 * variant of a file that was uploaded once — no re-upload, no second field, and
 * it applies to everything already in the catalogue.
 *
 * Anything that is not a Cloudinary upload URL (legacy files served from
 * `public/`, a pasted third-party address) is handed back untouched, so the
 * caller can always use the result.
 */
const UPLOAD = "/image/upload/";

export function cloudinaryTransform(url: string, transform: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes(UPLOAD)) return url;
  const [prefix, rest] = url.split(UPLOAD);
  // Already carrying a transformation: leave it alone rather than guess where
  // in the chain ours belongs — order changes the result.
  if (/^[a-z]_[^/]*\//.test(rest)) return url;
  return `${prefix}${UPLOAD}${transform}/${rest}`;
}

/**
 * A photo cut to the shape of the box it will be shown in.
 *
 * The catalogue's cover photos run from 0.61 to 2.43 in aspect ratio, while
 * every card that shows one is a fixed shape — so `object-cover` was throwing
 * away whatever did not fit, and for the portrait ones that was over half the
 * picture. Asking the CDN to cut them to the box's own ratio means the crop is
 * made once, on the whole image, with `g_auto` choosing what to keep, instead
 * of the browser blindly trimming equal slices off the top and bottom.
 *
 * `w` caps the delivered width — `images.unoptimized` is set project-wide, so
 * without it a 1600px original is sent for a 340px card. `f_auto,q_auto` let
 * Cloudinary pick the format and quality.
 *
 * This is safe here in a way it would not be for a promotional banner: these
 * are photographs, and a photograph survives being cropped. A designed creative
 * with text at its edges does not.
 */
export function cloudinaryCover(
  url: string,
  { ratio, width }: { ratio: string; width: number },
): string {
  return cloudinaryTransform(
    url,
    `c_fill,ar_${ratio},g_auto,w_${width},f_auto,q_auto`,
  );
}

/**
 * The same picture, capped to a width. Nothing is cropped and nothing is
 * upscaled — `c_limit` only ever shrinks, and only when the original is
 * bigger.
 *
 * This is the variant for anything that is not a photograph. A floor plan is a
 * drawing: `cloudinaryCover`'s `c_fill` would cut rooms off its edges, and
 * `g_auto` has no face or horizon to reason about. Here the frame is left
 * exactly as it was drawn and only the pixel count comes down, with
 * `f_auto,q_auto` choosing the format and quality.
 */
export function cloudinaryLimit(url: string, width: number): string {
  return cloudinaryTransform(url, `c_limit,w_${width},f_auto,q_auto`);
}

/** Is this a Cloudinary delivery URL we can still ask for a variant of? */
export function isCloudinaryUpload(url: string): boolean {
  if (!url.includes("res.cloudinary.com") || !url.includes(UPLOAD)) return false;
  // Already carrying a transformation — `cloudinaryTransform` would hand it
  // back untouched, so a loader built on it could only ever return one width.
  return !/^[a-z]_[^/]*\//.test(url.split(UPLOAD)[1]);
}

/**
 * The `srcset` for one picture: the same file at each width a browser might
 * reasonably ask for, so a phone stops downloading the desktop copy.
 *
 * The widths are the ones `next/image` would have used, minus anything above
 * what the box can show. `fit.width` is the ceiling: `c_limit` answers a
 * request for 3840px with the untouched original, which is the very thing this
 * is meant to avoid. Widths at or above the ceiling collapse to one entry, so
 * the set never advertises a size the CDN will not actually deliver.
 */
const SRCSET_WIDTHS = [256, 384, 640, 750, 828, 1080, 1200, 1600, 1920];

export function cloudinarySrcSet(
  url: string,
  fit?: { ratio?: string; width: number },
): string {
  const ceiling = fit?.width ?? Infinity;
  const widths = SRCSET_WIDTHS.filter((w) => w < ceiling);
  if (Number.isFinite(ceiling)) widths.push(ceiling);

  return widths
    .map((w) => {
      const variant = fit?.ratio
        ? cloudinaryCover(url, { ratio: fit.ratio, width: w })
        : cloudinaryLimit(url, w);
      return `${variant} ${w}w`;
    })
    .join(", ");
}
