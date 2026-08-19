import Script from "next/script";
import { safeGa4Id, safeMetaPixelId } from "@/lib/seo";

/**
 * Injects GA4 / Meta Pixel only when Settings already hold a well-formed ID.
 * Reads happen in the root layout; this component never writes to the database.
 */
export function Analytics({
  ga4Id,
  metaPixelId,
}: {
  ga4Id?: string | null;
  metaPixelId?: string | null;
}) {
  const ga = safeGa4Id(ga4Id);
  const pixel = safeMetaPixelId(metaPixelId);
  if (!ga && !pixel) return null;

  return (
    <>
      {ga && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${ga}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {pixel && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}
