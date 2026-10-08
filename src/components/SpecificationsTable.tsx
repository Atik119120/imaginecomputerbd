import { SpecGroup } from '@/lib/specifications';

interface Props {
  groups: SpecGroup[];
}

export const SpecificationsTable = ({ groups }: Props) => {
  if (!groups.length) return null;

  return (
    <div className="space-y-6">
      {groups.map((group, gi) => (
        <div key={gi} className="rounded-xl border border-border overflow-hidden bg-background">
          {group.title && (
            <div className="px-4 py-2.5 bg-secondary/60 border-b border-border">
              <h3 className="font-heading text-sm font-semibold text-foreground">{group.title}</h3>
            </div>
          )}
          <dl className="divide-y divide-border/70">
            {group.items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[minmax(0,40%)_minmax(0,60%)] sm:grid-cols-[minmax(0,32%)_minmax(0,68%)]"
              >
                <dt className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm text-muted-foreground bg-secondary/25 border-r border-border/70 break-words">
                  {item.label}
                </dt>
                <dd className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-foreground break-words whitespace-pre-wrap">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
};
