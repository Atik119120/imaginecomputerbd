import { Plus, Trash2, ArrowUp, ArrowDown, ListPlus } from 'lucide-react';
import { SpecGroup } from '@/lib/specifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  groups: SpecGroup[];
  onChange: (groups: SpecGroup[]) => void;
}

const emptyItem = { label: '', value: '' };

export const SpecificationBuilder = ({ groups, onChange }: Props) => {
  const ensureGroups = (): SpecGroup[] =>
    groups.length ? groups : [{ title: null, items: [] }];

  const update = (next: SpecGroup[]) => onChange(next);

  const addItem = (gi: number) => {
    const next = ensureGroups().map((g, i) =>
      i === gi ? { ...g, items: [...g.items, { ...emptyItem }] } : g
    );
    update(next);
  };

  const setItem = (gi: number, ii: number, field: 'label' | 'value', val: string) => {
    const next = ensureGroups().map((g, i) =>
      i === gi
        ? { ...g, items: g.items.map((it, j) => (j === ii ? { ...it, [field]: val } : it)) }
        : g
    );
    update(next);
  };

  const removeItem = (gi: number, ii: number) => {
    const next = ensureGroups().map((g, i) =>
      i === gi ? { ...g, items: g.items.filter((_, j) => j !== ii) } : g
    );
    update(next);
  };

  const moveItem = (gi: number, ii: number, dir: -1 | 1) => {
    const target = ii + dir;
    const next = ensureGroups().map((g, i) => {
      if (i !== gi) return g;
      if (target < 0 || target >= g.items.length) return g;
      const items = [...g.items];
      [items[ii], items[target]] = [items[target], items[ii]];
      return { ...g, items };
    });
    update(next);
  };

  const addGroup = () => update([...ensureGroups(), { title: '', items: [{ ...emptyItem }] }]);

  const setGroupTitle = (gi: number, title: string) =>
    update(ensureGroups().map((g, i) => (i === gi ? { ...g, title } : g)));

  const removeGroup = (gi: number) => update(ensureGroups().filter((_, i) => i !== gi));

  const moveGroup = (gi: number, dir: -1 | 1) => {
    const list = [...ensureGroups()];
    const target = gi + dir;
    if (target < 0 || target >= list.length) return;
    [list[gi], list[target]] = [list[target], list[gi]];
    update(list);
  };

  const visible = ensureGroups();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Product Specifications
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Add any specification you want — e.g. Brand, Processor, RAM, Battery, Connectivity, Warranty.
          Groups are optional; leave the group title empty for a simple list.
        </p>
      </div>

      {visible.map((group, gi) => (
        <div key={gi} className="rounded-xl border border-border/60 bg-secondary/25 p-3.5 space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs">Group Title <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={group.title ?? ''}
                onChange={(e) => setGroupTitle(gi, e.target.value)}
                placeholder="e.g. General Information"
                className="bg-background"
              />
            </div>
            {visible.length > 1 && (
              <div className="flex gap-1 pb-0.5">
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => moveGroup(gi, -1)}>
                  <ArrowUp size={14} />
                </Button>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => moveGroup(gi, 1)}>
                  <ArrowDown size={14} />
                </Button>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeGroup(gi)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </div>

          {group.items.length > 0 && (
            <div className="hidden sm:grid grid-cols-[1fr_1.4fr_auto] gap-2 px-1">
              <span className="text-xs font-medium text-muted-foreground">Specification Name</span>
              <span className="text-xs font-medium text-muted-foreground">Specification Value</span>
              <span className="w-[104px]" />
            </div>
          )}

          <div className="space-y-2">
            {group.items.map((item, ii) => (
              <div key={ii} className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2">
                <Input
                  value={item.label}
                  onChange={(e) => setItem(gi, ii, 'label', e.target.value)}
                  placeholder="Brand"
                  className="bg-background"
                />
                <Input
                  value={item.value}
                  onChange={(e) => setItem(gi, ii, 'value', e.target.value)}
                  placeholder="Samsung"
                  className="bg-background"
                />
                <div className="flex gap-1">
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => moveItem(gi, ii, -1)} disabled={ii === 0}>
                    <ArrowUp size={14} />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => moveItem(gi, ii, 1)} disabled={ii === group.items.length - 1}>
                    <ArrowDown size={14} />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 text-destructive" onClick={() => removeItem(gi, ii)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => addItem(gi)}>
            <Plus size={14} />
            Add Specification
          </Button>
        </div>
      ))}

      <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={addGroup}>
        <ListPlus size={14} />
        Add Specification Group
      </Button>
    </div>
  );
};
