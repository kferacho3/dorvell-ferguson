import { notFound } from "next/navigation";
import Link from "next/link";
import { DorvellShell } from "@/components/dorvell/DorvellShell";
import { ProjectExhibitHero } from "@/components/dorvell/ProjectExhibitHero";
import { WorkArchive } from "@/components/dorvell/WorkArchive";
import { PhotoGallery } from "@/components/dorvell/portfolio/PhotoGallery";
import { PhotographyCollections } from "@/components/dorvell/portfolio/PhotographyCollections";
import { toPhotoGalleryImage } from "@/components/dorvell/portfolio/photoGalleryImage";
import { galleryLaneDefinitions, laneKeyForImage } from "@/lib/gallery-lanes";
import { getPortfolioData, getProject } from "@/lib/portfolio-data";
import { portfolioImages } from "@/lib/photos/getPublicPhotos";

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
  const laneParams = galleryLaneDefinitions.map((lane) => ({
    slug: lane.slug,
  }));
  return [...laneParams, ...projectParams];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (hiddenProjectSlugs.has(slug)) notFound();
  const data = getPortfolioData();

  // Lane pages first: one URL per category, every frame in that lane.
  const laneDefinition = laneForSlug(slug);
  if (laneDefinition) {
    const images = portfolioImages(data.generated.images)
      .filter((image) => laneKeyForImage(image) === laneDefinition.key)
      .map(toPhotoGalleryImage);
    return (
      <DorvellShell>
        <div className="bg-[var(--df-bg)]">
          <div className="mx-auto max-w-[84rem] px-4 pb-16 pt-7 sm:px-8 sm:pt-10 lg:px-12">
            <header className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 sm:mb-7">
              <h1 className="text-[clamp(2.75rem,7vw,5.75rem)] font-bold leading-[0.96] tracking-tight [font-family:var(--font-display)]">
                {laneDefinition.label}
              </h1>
              <Link
                href="/work"
                className="inline-flex min-h-11 items-center text-sm font-medium text-[var(--df-text-soft)] underline decoration-[var(--df-line-strong)] underline-offset-4 hover:text-[var(--df-text)]"
                prefetch={false}
              >
                All photography
              </Link>
            </header>
            <div id="archive">
              <PhotoGallery
                images={images}
                label={`${laneDefinition.label} gallery`}
              />
            </div>
            <PhotographyCollections current={laneDefinition.key} />
          </div>
        </div>
      </DorvellShell>
    );
  }

  const project = data.projects.find((entry) => entry.slug === slug);
  if (!project) notFound();
  const projectLane = galleryLaneDefinitions.find((lane) =>
    lane.projectSlugs.includes(project.slug),
  );

  return (
    <DorvellShell>
      <div className="route-page project-route">
        <ProjectExhibitHero
          project={project}
          allImages={data.generated.images}
        />
        <WorkArchive
          images={project.images}
          scopeLabel={projectLane?.label ?? project.title}
          variant="full"
        />
      </div>
    </DorvellShell>
  );
}
