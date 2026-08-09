import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { ProjectExhibitHero } from "@/components/dorvell/ProjectExhibitHero";
import { WorkArchive } from "@/components/dorvell/WorkArchive";
import { buildGalleryLanes, galleryLaneDefinitions } from "@/lib/gallery-lanes";
import { getPortfolioData, getProject } from "@/lib/portfolio-data";
import { portfolioImages } from "@/lib/photos/getPublicPhotos";
import "@/styles/lane-route.css";

// Legacy scrape artifacts that should never resolve as exhibits.
const hiddenProjectSlugs = new Set(["home-2", "work", "about"]);

function displayTitleFor(title: string) {
  return title.replace(/\s*\(coming soon\s*\)\s*/i, "").trim();
}

function laneForSlug(slug: string) {
  return galleryLaneDefinitions.find((lane) => lane.slug === slug);
}

export function generateStaticParams() {
  const projectParams = getPortfolioData()
    .projects.filter((project) => !hiddenProjectSlugs.has(project.slug))
    .map((project) => ({ slug: project.slug }));
  // Lane pages share this route: /work/portraits, /work/music-live, ...
  const laneParams = galleryLaneDefinitions.map((lane) => ({ slug: lane.slug }));
  return [...laneParams, ...projectParams];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (hiddenProjectSlugs.has(slug)) return { title: "Work Archive" };
  const lane = laneForSlug(slug);
  if (lane) {
    return {
      title: lane.label,
      description: `${lane.label} — ${lane.description} Every frame from Dorvell Ferguson Jr.'s ${lane.label.toLowerCase()} archive.`,
    };
  }
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

  // Lane pages first: one URL per category, every frame in that lane.
  const laneDefinition = laneForSlug(slug);
  if (laneDefinition) {
    const archive = portfolioImages(data.generated.images);
    const lane = buildGalleryLanes(archive).find((entry) => entry.key === laneDefinition.key);
    const laneImages = lane?.images ?? [];
    return (
      <DorvellShell>
        <div className="route-page project-route lane-route">
          <header className="lane-route__head" style={{ "--lane-accent": laneDefinition.accent } as CSSProperties}>
            <p className="eyebrow">{laneDefinition.eyebrow}</p>
            <h1>{laneDefinition.label}</h1>
            <p className="lane-route__desc">
              {laneDefinition.description} {laneImages.length} frames.
            </p>
          </header>
          <WorkArchive images={laneImages} scopeLabel={laneDefinition.label} variant="full" />
        </div>
      </DorvellShell>
    );
  }

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
