export type StudioVideo = {
  slug: string;
  title: string;
  orientation: "portrait" | "landscape" | "square";
  /** desktop / HD (near-original) */
  mp4: string;
  /** mobile / compressed */
  mobile: string;
  poster: string;
};
