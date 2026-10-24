interface TechRibbonProps {
  items: string[];
}

// Two rows of technologies sliding in opposite directions. Each row holds its
// list twice, so moving it by half its width loops without a seam. It is only
// decoration: every technology is also listed on its experience.
export default function TechRibbon({ items }: Readonly<TechRibbonProps>) {
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];

  return (
    <div className="tech-ribbon" aria-hidden="true" data-loop>
      {rows.map((row) => (
        <div key={row[0]} className="tech-ribbon__row">
          {[0, 1].map((copy) => (
            <ul key={copy} className="tech-ribbon__list">
              {row.map((name) => (
                <li key={name} className="tech-ribbon__item">
                  {name}
                </li>
              ))}
            </ul>
          ))}
        </div>
      ))}
    </div>
  );
}
