import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";

function upsertMeta(name: string, content: string, byProperty = false) {
  const selector = byProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    if (byProperty) {
      tag.setAttribute("property", name);
    } else {
      tag.setAttribute("name", name);
    }
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(url: string) {
  let tag = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = "canonical";
    document.head.appendChild(tag);
  }
  tag.href = url;
}

export function SeoSync() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;

    const run = async () => {
      const path = location.pathname === "" ? "/" : location.pathname;
      const candidatePaths = [path];
      if (path.startsWith("/blog/")) {
        candidatePaths.push("/blog");
      }
      if (path === "/") {
        candidatePaths.push("/");
      }

      const { data } = await supabase
        .from("seo_settings")
        .select("*")
        .in("route_path", candidatePaths)
        .order("route_path", { ascending: false });

      const current = (data ?? []).find((item) => item.route_path === path) || data?.[0];
      if (!current) return;

      document.title = current.meta_title || document.title;
      if (current.meta_description) {
        upsertMeta("description", current.meta_description);
      }
      if (current.canonical_url) {
        setCanonical(current.canonical_url);
      } else {
        setCanonical(`${window.location.origin}${path}`);
      }
      if (current.og_image) {
        upsertMeta("og:image", current.og_image, true);
      }
      upsertMeta("og:title", current.meta_title || document.title, true);
      upsertMeta("og:description", current.meta_description || "", true);
    };

    void run();
  }, [location.pathname]);

  return null;
}
