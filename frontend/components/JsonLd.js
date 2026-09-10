const SITE_URL =
  process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const OG_IMAGE =
  process.env.OG_IMAGE_URL ||
  "https://images.unsplash.com/photo-1683719312734-e31de63957ab?auto=format&fit=crop&w=1200&q=80";

export function localBusinessSchema(contact = {}, hours = []) {
  const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: contact.businessName || "Noir by Kriszta — Lash Stylist",
    image: OG_IMAGE,
    url: SITE_URL,
    telephone: contact.phone || "+36 30 123 4567",
    email: contact.email,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.addressLine || "Kossuth Lajos utca 12.",
      addressLocality: contact.city || "Pécel",
      postalCode: contact.postalCode || "2119",
      addressCountry: "HU",
    },
    areaServed: ["Pécel", "Budapest", "Isaszeg", "Gödöllő", "Maglód"],
    sameAs: [contact.instagram, contact.facebook].filter(Boolean),
    openingHoursSpecification: hours
      .filter((h) => !h.isClosed)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: dayMap[h.weekday],
        opens: h.openTime,
        closes: h.closeTime,
      })),
  };
}

export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
