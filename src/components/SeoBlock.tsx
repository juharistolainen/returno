import { useEffect } from "react";
import { canonicalUrl, jsonLdGraph, OG_IMAGE_PATH, SITE_ORIGIN, type SeoPage } from "../content/seo.ts";

export function SeoBlock({ page, noindex = false }: { page: SeoPage; noindex?: boolean }) {
  useEffect(() => {
    document.title = page.title;
    setMeta("description", page.description);
    setMeta("robots", noindex ? "noindex" : "index, follow");
    setMeta("og:title", page.title, "property");
    setMeta("og:description", page.description, "property");
    setMeta("og:url", canonicalUrl(page.path), "property");
    setMeta("og:type", "website", "property");
    setMeta("og:image", `${SITE_ORIGIN}${OG_IMAGE_PATH}`, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", page.title);
    setMeta("twitter:description", page.description);
    setMeta("twitter:image", `${SITE_ORIGIN}${OG_IMAGE_PATH}`);
    setLink("canonical", canonicalUrl(page.path));
  }, [noindex, page]);

  const json = JSON.stringify(jsonLdGraph(page)).replace(/</g, "\\u003c");

  return (
    <article className="mt-10 max-w-3xl border-t border-line pt-8">
      {page.sections.map((section) => (
        <section key={section.heading} className="mt-6">
          <h2 className="font-display text-2xl">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)} className="mt-2 text-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
      {page.faqs.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-display text-2xl">Questions</h2>
          {page.faqs.map((faq) => (
            <div key={faq.question} className="mt-4">
              <h3 className="text-base font-semibold">{faq.question}</h3>
              <p className="mt-1 text-muted">{faq.answer}</p>
            </div>
          ))}
        </section>
      ) : null}
      <script type="application/ld+json">{json}</script>
    </article>
  );
}

function setMeta(name: string, content: string, attribute: "name" | "property" = "name") {
  const selector = `meta[${attribute}="${name}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}
