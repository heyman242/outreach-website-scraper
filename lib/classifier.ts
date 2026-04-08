export type SectionLabel =
  | "Home"
  | "About"
  | "Case Studies"
  | "Testimonials"
  | "Results"
  | "FAQs"
  | "Contact"
  | "Services"
  | "Blog"
  | "Other";

export const SECTION_ORDER: SectionLabel[] = [
  "Home",
  "About",
  "Services",
  "Case Studies",
  "Results",
  "Testimonials",
  "FAQs",
  "Contact",
  "Blog",
  "Other",
];

export function classifyPage(url: string, title: string): SectionLabel {
  const combined = `${url} ${title}`.toLowerCase();

  // Parse the path only
  let path = "";
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    path = url.toLowerCase();
  }

  const isRoot = path === "/" || path === "";

  if (isRoot) return "Home";

  if (/testimonial|review|client-stor|what.*client|said.*about/.test(combined)) return "Testimonials";
  if (/result|outcome|success|roi|return|impact|transform/.test(combined)) return "Results";
  if (/case.stud|portfolio|project|our.work|work.we/.test(combined)) return "Case Studies";
  if (/faq|frequentl|question|help.center|support/.test(combined)) return "FAQs";
  if (/about|team|story|who.we|our.mission|our.vision|founder/.test(combined)) return "About";
  if (/contact|reach|connect|get.in.touch|book.a|schedule.a|talk.to/.test(combined)) return "Contact";
  if (/service|solution|offering|what.we.do|how.we.help|package|pricing|plan/.test(combined)) return "Services";
  if (/blog|article|post|news|insight|resource|guide|learn/.test(combined)) return "Blog";

  return "Other";
}
