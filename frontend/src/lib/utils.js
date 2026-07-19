export function formatDate(date) {
  return date.toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Removes markdown formatting characters for clean plain-text card previews.
 */
export function stripMarkdown(text = "") {
  if (!text) return "";
  return text
    // Remove headers (#, ##, ###)
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italics (*, **, _, __)
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    // Remove strikethrough (~~)
    .replace(/~~(.*?)~~/g, "$1")
    // Remove inline code and code blocks (` or ```)
    .replace(/```[\s\S]*?```/g, "[código]")
    .replace(/`([^`]+)`/g, "$1")
    // Remove blockquotes (>)
    .replace(/^>\s+/gm, "")
    // Remove images (![alt](url)) and links ([text](url))
    .replace(/!\[.*?\]\(.*?\)/g, "[imagen]")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    // Remove task list checkboxes (- [ ] or - [x])
    .replace(/^[\s-]*\[[ xX]\]\s+/gm, "• ")
    // Remove list bullet (- or * or 1.)
    .replace(/^[\s-*]+\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, "• ")
    .trim();
}
