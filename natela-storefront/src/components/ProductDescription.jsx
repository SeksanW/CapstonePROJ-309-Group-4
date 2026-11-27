/* Renders a product description written in the admin's plain text box,
   with a few simple markers so it can be laid out in sections:

     [Design]              a line in square brackets → bold section heading
     **Material**          a line wrapped in ** → bold label
     ・Do not tumble dry   a line starting with ・ or "- " → bullet point
     (blank line)          space before the next block
     anything else         normal text (line breaks are kept)

   Plain descriptions with none of these still show as normal text. */

const HEADING = /^\[(.+)\]$/;
const LABEL = /^\*\*(.+)\*\*$/;
const BULLET = /^(?:・|- )\s*(.*)$/;

/* Groups lines into blocks (split on blank lines); inside a block,
   consecutive plain lines stay together as one paragraph. */
function parse(text) {
  const blocks = [];
  for (const raw of String(text || "").replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    const nodes = [];
    for (const line of raw.split("\n").map((l) => l.trim())) {
      if (!line) continue;
      let m;
      if ((m = line.match(HEADING))) nodes.push({ type: "heading", text: `[${m[1].trim()}]` });
      else if ((m = line.match(LABEL))) nodes.push({ type: "label", text: m[1].trim() });
      else if ((m = line.match(BULLET))) {
        const last = nodes[nodes.length - 1];
        if (last?.type === "list") last.items.push(m[1]);
        else nodes.push({ type: "list", items: [m[1]] });
      } else {
        const last = nodes[nodes.length - 1];
        if (last?.type === "text") last.lines.push(line);
        else nodes.push({ type: "text", lines: [line] });
      }
    }
    if (nodes.length) blocks.push(nodes);
  }
  return blocks;
}

export default function ProductDescription({ text }) {
  const blocks = parse(text);
  if (!blocks.length) return null;

  return (
    <div className="pdp-desc">
      {blocks.map((nodes, b) => (
        <div key={b} className="pdp-desc__block">
          {nodes.map((n, i) => {
            if (n.type === "heading") return <h3 key={i} className="pdp-desc__heading">{n.text}</h3>;
            if (n.type === "label") return <h4 key={i} className="pdp-desc__label">{n.text}</h4>;
            if (n.type === "list")
              return (
                <ul key={i} className="pdp-desc__list">
                  {n.items.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              );
            return (
              <p key={i} className="pdp-desc__text">
                {n.lines.map((line, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {line}
                  </span>
                ))}
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
}
