import type { Metadata } from "next";

import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { ProjectsComingSoon } from "@/components/dorvell/ProjectsComingSoon";

export const metadata: Metadata = {
  title: "Projects - Dorvell Ferguson Jr.",
  description:
    "College and creative research projects from Dorvell Ferguson Jr. are in development — journalism coursework, creative tech, capstones, and experiments arrive here soon.",
  robots: { index: true },
  openGraph: {
    title: "Projects - Dorvell Ferguson Jr.",
    description:
      "College and creative research projects, currently in development. The photo archive stays open while this wing is under construction.",
    type: "website",
    url: "/projects",
  },
};

export default function ProjectsPage() {
  return (
    <DorvellShell>
      <div className="route-page projects-route">
        <ProjectsComingSoon />
      </div>
    </DorvellShell>
  );
}
