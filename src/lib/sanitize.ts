import DOMPurify from "dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      "p",
      "b",
      "i",
      "u",
      "strong",
      "em",
      "blockquote",
      "ul",
      "ol",
      "li",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "img",
      "br",
      "hr",
      "pre",
      "code",
      "span",
      "div"
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "class", "style"],
    FORBID_ATTR: ["onerror", "onclick", "onload"]
  });
}
