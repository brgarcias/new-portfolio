// REACT
import { ReactNode } from 'react';

// The little formatting the content's texts use: **highlight** takes the
// brand's color (or the class given), *emphasis* becomes <em>, and
// [text](address) a link. Links to other sites open in a new tab.
const pattern = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)/g;

export function markup(text: string, highlightClass = 'text-accent') {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const [whole, highlight, emphasis, label, href] = match;
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (highlight) {
      nodes.push(
        <span key={match.index} className={highlightClass}>
          {highlight}
        </span>,
      );
    } else if (emphasis) {
      nodes.push(<em key={match.index}>{emphasis}</em>);
    } else {
      const external = /^https?:/.test(href);
      nodes.push(
        <a
          key={match.index}
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        >
          {label}
        </a>,
      );
    }
    last = match.index + whole.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
