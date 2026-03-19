import { useEffect } from "react";

interface PageMeta {
  title: string;
  description?: string;
  image?: string;
  url?: string;
}

export function usePageMeta({ title, description, image, url }: PageMeta) {
  useEffect(() => {
    const fullTitle = `${title} | Weshkech`;
    document.title = fullTitle;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(property.startsWith("og:") ? "property" : "name", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("og:title", fullTitle);
    if (description) {
      setMeta("description", description);
      setMeta("og:description", description);
    }
    if (image) setMeta("og:image", image);
    if (url) {
      setMeta("og:url", url);
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }

    return () => { document.title = "Weshkech — Marrakech Live Vibes"; };
  }, [title, description, image, url]);
}
