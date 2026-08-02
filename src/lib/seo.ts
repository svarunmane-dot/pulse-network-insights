// Shared SEO helper for tool pages. Emits unique title/description,
// canonical, Open Graph, Twitter and JSON-LD (SoftwareApplication +
// BreadcrumbList, optional FAQPage) in one call so each route stays
// consistent and duplicate-free.

export const SITE_URL = "https://pulse-speed.com";
export const SITE_NAME = "Pulse Speed";

export type FaqItem = { q: string; a: string };

export interface ToolSeoInput {
  path: string; // e.g. "/port-check"
  title: string; // 50-60 chars ideal
  description: string; // 140-160 chars ideal
  name: string; // short tool name for SoftwareApplication
  category?: string; // schema.org applicationCategory
  faqs?: FaqItem[];
  image?: string; // absolute URL
}

export function toolHead(input: ToolSeoInput) {
  const url = `${SITE_URL}${input.path}`;
  const image = input.image ?? `${SITE_URL}/favicon.png`;
  const category = input.category ?? "NetworkingApplication";

  const softwareLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    url,
    description: input.description,
    applicationCategory: category,
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: input.name, item: url },
    ],
  };

  const scripts: Array<{ type: string; children: string }> = [
    { type: "application/ld+json", children: JSON.stringify(softwareLd) },
    { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
  ];

  if (input.faqs && input.faqs.length > 0) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: input.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    });
  }

  return {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: input.title },
      { property: "og:description", content: input.description },
      { property: "og:url", content: url },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: input.title },
      { name: "twitter:description", content: input.description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts,
  };
}