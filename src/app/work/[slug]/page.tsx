import { notFound } from "next/navigation";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { ProjectExhibitHero } from "@/components/dorvell/ProjectExhibitHero";
import { WorkArchive } from "@/components/dorvell/WorkArchive";
import { galleryLaneDefinitions } from "@/lib/gallery-lanes";
import { getPortfolioData, getProject } from "@/lib/portfolio-data";

export function generateStaticParams() {
  return getPortfolioData().projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  return {
    title: project ? `${project.title} - Dorvell Ferguson Jr.` : "Work - Dorvell Ferguson Jr.",
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getPortfolioData();
  const project = data.projects.find((entry) => entry.slug === slug);
  if (!project) notFound();
  const projectLane = galleryLaneDefinitions.find((lane) => lane.projectSlugs.includes(project.slug));

  return (
    <DorvellShell>
      <main className="route-page project-route">
        <ProjectExhibitHero project={project} allImages={data.generated.images} />
        <WorkArchive images={project.images} scopeLabel={projectLane?.label ?? project.title} variant="full" />
      </main>
    </DorvellShell>
  );
}
