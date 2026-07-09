export type StudioVideo = {
  slug: string;
  title: string;
  orientation: "portrait" | "landscape" | "square";
  mp4: string;
  webm: string | null;
  poster: string;
};
