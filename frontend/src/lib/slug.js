/** "Tote Bags" -> "tote-bags". Used for category URLs everywhere. */
export default function slugify(text = "") {
    return String(text)
        .trim()
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
