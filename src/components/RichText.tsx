import { ReactNode } from 'react';

/**
 * Lightweight renderer for admin-written long-form text.
 * Supports: ## / ### headings, **bold**, - or • bullet lists, blank-line paragraphs.
 */
const inline = (text: string): ReactNode[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
};

export const RichText = ({ text, className = '' }: { text: string; className?: string }) => {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1.5 my-3">
        {list.map((li, i) => (
          <li key={i}>{inline(li)}</li>
        ))}
      </ul>
    );
    list = [];
  };

  const flushPara = () => {
    if (!para.length) return;
    blocks.push(
      <p key={`p-${blocks.length}`} className="my-3 leading-relaxed">
        {para.map((l, i) => (
          <span key={i}>
            {inline(l)}
            {i < para.length - 1 && <br />}
          </span>
        ))}
      </p>
    );
    para = [];
  };

  lines.forEach((raw) => {
    const line = raw.trim();
    if (!line) {
      flushList();
      flushPara();
      return;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushList();
      flushPara();
      const level = heading[1].length;
      blocks.push(
        <h3
          key={`h-${blocks.length}`}
          className={`font-heading font-semibold text-foreground mt-5 mb-2 ${level <= 2 ? 'text-base md:text-lg' : 'text-sm md:text-base'}`}
        >
          {inline(heading[2])}
        </h3>
      );
      return;
    }
    const bullet = line.match(/^([-*•])\s+(.*)$/);
    if (bullet) {
      flushPara();
      list.push(bullet[2]);
      return;
    }
    flushList();
    para.push(line);
  });
  flushList();
  flushPara();

  return <div className={className}>{blocks}</div>;
};
