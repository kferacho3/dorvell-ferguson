import { redirect } from "next/navigation";

export const metadata = {
  title: "Photo Curation Studio",
  robots: { index: false, follow: false },
};

/** The private categorizer grew into the Photo Curation Studio at /studio. */
export default function LegacyCategorizerPage() {
  redirect("/studio");
}
