/**
 * Renders admin-written policy text. Blank lines separate paragraphs; a line
 * starting with "## " becomes a section heading.
 */
export default function PolicyText({ text }) {
    const sections = [];
    let current = { heading: null, paragraphs: [] };

    text.split(/\n{2,}/).forEach((chunk) => {
        const trimmed = chunk.trim();
        if (!trimmed) return;
        if (trimmed.startsWith("## ")) {
            const [first, ...rest] = trimmed.split("\n");
            if (current.heading || current.paragraphs.length) sections.push(current);
            current = { heading: first.slice(3).trim(), paragraphs: [] };
            if (rest.length) current.paragraphs.push(rest.join("\n"));
        } else {
            current.paragraphs.push(trimmed);
        }
    });
    if (current.heading || current.paragraphs.length) sections.push(current);

    return sections.map((section, i) => (
        <section className="info-page__section" key={i}>
            {section.heading && <h2>{section.heading}</h2>}
            {section.paragraphs.map((p, j) => (
                <p key={j} style={{ whiteSpace: "pre-line" }}>
                    {p}
                </p>
            ))}
        </section>
    ));
}
