import { ContactPanel } from "@/components/dorvell/ContactPanel";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { ServicesBooking } from "@/components/dorvell/ServicesBooking";
import { getPortfolioData } from "@/lib/portfolio-data";

export const metadata = {
  title: "Contact - Dorvell Ferguson Jr.",
  description: "Book Dorvell Ferguson Jr. for photography, modeling, creative direction, events, and collaborations.",
};

export default function ContactPage() {
  const { manual, generated } = getPortfolioData();

  return (
    <DorvellShell>
      <main className="route-page">
        <ContactPanel profile={manual.profile} images={generated.images} />
        <ServicesBooking services={manual.services} email={manual.profile.email} images={generated.images} compact />
      </main>
    </DorvellShell>
  );
}
