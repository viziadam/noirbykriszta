import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import JsonLd, { localBusinessSchema } from "@/components/JsonLd";
import { serverGet } from "@/lib/api";

// Mindig szerver-oldali renderelés friss adatokkal (nincs statikus cache).
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }) {
  const content = (await serverGet("/content", {})) || {};
  const hoursData = (await serverGet("/business-hours", { hours: [] })) || { hours: [] };
  const contact = content.contact || {};
  const branding = content.branding || {};
  const hours = hoursData.hours || [];

  return (
    <>
      <JsonLd data={localBusinessSchema(contact, hours)} />
      <Header logoUrl={branding.logoUrl} />
      <main>{children}</main>
      <Footer contact={contact} hours={hours} branding={branding} />
      <CookieBanner />
    </>
  );
}
