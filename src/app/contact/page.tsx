import { ContactActionStrip } from "@/components/dorvell/contact/ContactActionStrip";
import { ContactForm } from "@/components/dorvell/contact/ContactForm";
import { ContactHero } from "@/components/dorvell/contact/ContactHero";
import { ContactProofStrip } from "@/components/dorvell/contact/ContactProofStrip";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { getPortfolioData } from "@/lib/portfolio-data";
import { getSocialLinks } from "@/lib/social-links";

export const metadata = {
  title: "Contact",
  description:
    "Book Dorvell Ferguson Jr. for photography, journalism, events, portraits, fashion, modeling, and creative collaborations.",
  openGraph: {
    title: "Contact — Dorvell Ferguson Jr.",
    description: "Let’s build the shot — send the brief for shoots, editorial, events, and collaborations.",
  },
};

export default function ContactPage() {
  const { manual, generated } = getPortfolioData();
  const socials = getSocialLinks();

  return (
    <DorvellShell>
      <div className="route-page contact-route">
        <ContactHero profile={manual.profile} images={generated.images} socials={socials} />
        <ContactForm email={manual.profile.email} />
        <ContactActionStrip email={manual.profile.email} portfolio={manual.profile.portfolio} socials={socials} />
        <ContactProofStrip />
      </div>
    </DorvellShell>
  );
}
