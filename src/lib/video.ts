/**
 * Where a property's video came from, and how to show it.
 *
 * Two things can land in the video field: a link someone pasted (YouTube, in
 * practice) or a file they uploaded, which goes to Cloudinary and comes back as
 * an ordinary https URL ending in a video extension. Those are shown by
 * different elements — an iframe and a <video> tag — and neither is safe to
 * guess at, so the URL is parsed once here and the page renders what it is told.
 *
 * Anything unrecognised returns null, and the caller shows no video at all.
 * That is deliberate: a half-understood URL renders as a broken player or, with
 * an iframe, as a blank grey box that looks like a bug.
 */

export type VideoSource =
  | {
      kind: "youtube";
      /** Player URL for the expanded view. Autoplays, since a click opened it. */
      embedUrl: string;
      /** YouTube's own still. Free, and already the first frame of the video. */
      posterUrl: string;
    }
  | {
      kind: "file";
      /** Played directly by a <video> element. */
      url: string;
      /** A file has no separate poster — the element shows its own first frame. */
      posterUrl: null;
    };

/** 11-character YouTube ids, as they appear in every URL shape. */
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

const FILE_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i;

/** youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/ — all of them. */
function youtubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    const id = u.pathname.slice(1).split("/")[0];
    return YT_ID.test(id) ? id : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v && YT_ID.test(v)) return v;

    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2 && ["shorts", "embed", "live", "v"].includes(parts[0])) {
      return YT_ID.test(parts[1]) ? parts[1] : null;
    }
  }

  return null;
}

/**
 * Read a stored video URL. Returns null for empty, malformed or unrecognised
 * values — including http:// links, which would be blocked as mixed content on
 * an https page and show nothing anyway.
 */
export function parseVideoSource(raw: string | null | undefined): VideoSource | null {
  const value = (raw ?? "").trim();
  if (!value) return null;

  let u: URL;
  try {
    // "youtube.com/watch?v=…" pasted without a scheme is the ordinary way to
    // get a link out of a browser bar, so it is met halfway rather than
    // rejected. Anything still unparseable, or not https, is refused below.
    u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;

  const yt = youtubeId(u);
  if (yt) {
    return {
      kind: "youtube",
      // nocookie so an unopened video sets nothing on the visitor.
      embedUrl: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1`,
      posterUrl: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
    };
  }

  // An uploaded file: Cloudinary's video delivery path, or any URL that plainly
  // names a video file.
  const isCloudinaryVideo =
    u.hostname === "res.cloudinary.com" && u.pathname.includes("/video/upload/");
  if (isCloudinaryVideo || FILE_EXT.test(u.pathname)) {
    return { kind: "file", url: value, posterUrl: null };
  }

  return null;
}
