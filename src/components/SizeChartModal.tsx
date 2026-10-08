import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SizeRow {
  size: string;
  chest: string;
  length: string;
  shoulder: string;
  sleeve: string;
}

const SIZE_DATA: SizeRow[] = [
  { size: 'XS', chest: '36', length: '26', shoulder: '16', sleeve: '7.5' },
  { size: 'S',  chest: '38', length: '27', shoulder: '17', sleeve: '8' },
  { size: 'M',  chest: '40', length: '28', shoulder: '18', sleeve: '8.5' },
  { size: 'L',  chest: '42', length: '29', shoulder: '19', sleeve: '9' },
  { size: 'XL', chest: '44', length: '30', shoulder: '20', sleeve: '9.5' },
  { size: 'XXL', chest: '46', length: '31', shoulder: '21', sleeve: '10' },
];

export const SizeChartModal = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent underline underline-offset-4 font-medium"
        >
          <Ruler size={13} className="mr-1" />
          Size Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl md:text-2xl flex items-center gap-2">
            <Ruler size={20} className="text-primary" />
            Size Chart
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            All measurements are in inches. For best fit, measure a similar garment you already own.
          </p>
        </DialogHeader>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Size</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Chest</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Length</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Shoulder</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Sleeve</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_DATA.map((row, i) => (
                <tr
                  key={row.size}
                  className={i % 2 === 0 ? 'bg-background' : 'bg-secondary/20'}
                >
                  <td className="px-4 py-3 font-bold text-primary">{row.size}</td>
                  <td className="px-4 py-3 text-center text-foreground">{row.chest}"</td>
                  <td className="px-4 py-3 text-center text-foreground">{row.length}"</td>
                  <td className="px-4 py-3 text-center text-foreground">{row.shoulder}"</td>
                  <td className="px-4 py-3 text-center text-foreground">{row.sleeve}"</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 p-3 bg-accent/10 rounded-lg border border-accent/20">
          <p className="text-xs text-foreground/80 leading-relaxed">
            <strong className="text-accent">How to measure:</strong>{' '}
            Lay garment flat. <strong>Chest</strong>: measure pit-to-pit and double.{' '}
            <strong>Length</strong>: from shoulder seam to bottom hem.{' '}
            <strong>Shoulder</strong>: seam-to-seam across the back.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
