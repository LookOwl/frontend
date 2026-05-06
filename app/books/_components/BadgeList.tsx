type BadgeListProps = {
  items: string[];
  max?: number;
};

export function BadgeList({ items, max }: BadgeListProps) {
  const visible = max ? items.slice(0, max) : items;
  const remaining = max ? items.length - visible.length : 0;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {visible.map((item) => (
        <li
          key={item}
          className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {item}
        </li>
      ))}
      {remaining > 0 && (
        <li className="rounded-full bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          +{remaining}
        </li>
      )}
    </ul>
  );
}
