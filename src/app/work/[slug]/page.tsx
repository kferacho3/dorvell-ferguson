import { notFound } from "next/navigation";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { ProjectExhibitHero } from "@/components/dorvell/ProjectExhibitHero";
import { WorkArchive } from "@/components/dorvell/WorkArchive";
import { galleryLaneDefinitions } from "@/lib/gallery-lanes";
import { getPortfolioData, getProject } from "@/lib/portfolio-data";

// Legacy scrape artifacts that should never resolve as exhibits.
const hiddenProjectSlugs = new Set(["home-2", "work", "about"]);

function displayTitleFor(title: string) {
  return title.replace(/\s*\(coming soon\s*\)\s*/i, "").trim();
}

export function generateStaticParams() {
  return getPortfolioData()
    .projects.filter((project) => !hiddenProjectSlugs.has(project.slug))
    .map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (hiddenProjectSlugs.has(slug)) return { title: "Work Archive" };
  const project = getProject(slug);
  if (!project) return { title: "Work Archive" };
  const title = displayTitleFor(project.title);
  const frameLabel = project.images.length === 1 ? "frame" : "frames";
  return {
    title,
    description: `${title} — ${project.images.length} ${frameLabel} from the working archive of Dorvell Ferguson Jr., Tampa-based photographer and visual storyteller.`,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (hiddenProjectSlugs.has(slug)) notFound();
  const data = getPortfolioData();
  const project = data.projects.find((entry) => entry.slug === slug);
  if (!project) notFound();
  const projectLane = galleryLaneDefinitions.find((lane) => lane.projectSlugs.includes(project.slug));

  return (
    <DorvellShell>
      <div className="route-page project-route">
        <ProjectExhibitHero project={project} allImages={data.generated.images} />
        <WorkArchive images={project.images} scopeLabel={projectLane?.label ?? project.title} variant="full" />
      </div>
    </DorvellShell>
  );
}
