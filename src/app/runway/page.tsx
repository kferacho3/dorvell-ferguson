import { redirect } from "next/navigation";

export const metadata = {
  title: "Modeling",
  robots: { index: false, follow: true },
};

/** The runway dossier became The Ferguson Room at /modeling (301 in next.config.mjs). */
export default function RunwayPage() {
  redirect("/modeling");
}
