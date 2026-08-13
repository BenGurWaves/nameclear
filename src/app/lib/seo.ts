import { useEffect } from "react";

export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://nameclear.pages.dev";
export const SITE_NAME = "NameClear";
export const SITE_TAGLINE =
  "Is your brand name available? NameClear checks domains, USPTO trademarks, and social handles in one shot.";

function setMeta(selector: string, attr: string, value: string | null) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (value === null || value === "") {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    const [attrName, attrVal] = selector.slice(1).split("=");
    el.setAttribute(attrName, attrVal === undefined ? "" : attrVal.replace(/["']/g, ""));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export function usePageMeta(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  schemas?: object[];
}) {
  useEffect(() => {
    const fullTitle = opts.title === SITE_NAME ? opts.title : `${opts.title} — ${SITE_NAME}`;
    document.title = fullTitle;

    const canonical = `${SITE_URL}${opts.path === "/" ? "" : opts.path}`;
    setMeta('meta[name="description"]', "content", opts.description);
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", opts.description);
    setMeta('meta[property="og:url"]', "content", canonical);
    setMeta('meta[property="og:type"]', "content", "website");
    setMeta('meta[property="og:site_name"]', "content", SITE_NAME);
    setMeta('meta[property="og:image"]', "content", `${SITE_URL}/og-nameclear.svg`);
    setMeta('meta[name="twitter:card"]', "content", "summary_large_image");
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", opts.description);
    setMeta('meta[name="twitter:image"]', "content", `${SITE_URL}/og-nameclear.svg`);

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);

    if (opts.noindex) {
      setMeta('meta[name="robots"]', "content", "noindex, nofollow");
    } else {
      setMeta('meta[name="robots"]', "content", null);
    }

    let script = document.head.querySelector<HTMLScriptElement>("script[data-seo-jsonld]");
    const schemas = opts.schemas ?? [];
    if (schemas.length > 0) {
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", "");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
    } else if (script) {
      script.remove();
    }
  }, [opts.title, opts.description, opts.path, opts.noindex, opts.schemas]);
}
