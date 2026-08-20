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
