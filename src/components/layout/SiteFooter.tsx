import { Link } from "react-router-dom";
import { siteFooterLinks, useSiteChrome } from "../../hooks/useSiteChrome";

export function SiteFooter() {
  const { siteTitle, socials } = useSiteChrome();

  return (
    <footer className="relative z-10 px-4 pb-8 md:px-8">
      <div className="editorial-panel mx-auto max-w-[1240px] px-5 py-8 md:px-8">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {siteFooterLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-full bg-white px-4 py-2 text-sm text-slate-700 transition hover:text-brand-900"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            {socials.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#fff4ee] px-3 py-1.5 text-[#a44b21] transition hover:bg-white"
              >
                {item.platform}
              </a>
            ))}
          </div>

          <p className="text-sm text-slate-500">&copy; {siteTitle}</p>
        </div>
      </div>
    </footer>
  );
}
