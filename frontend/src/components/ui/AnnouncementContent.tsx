import type { ReactNode } from "react";

type AnnouncementContentProps = {
  content: string;
  className?: string;
};

type ContentBlock =
  | { type: "paragraph"; lines: string[] }
  | { type: "heading"; level: number; text: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

function parseBlocks(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", lines: paragraph });
      paragraph = [];
    }
  }

  for (const line of content.split(/\r?\n/)) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const unorderedItem = /^\s*[-*]\s+(.+)$/.exec(line);
    const orderedItem = /^\s*\d+[.)]\s+(.+)$/.exec(line);

    if (line.trim() === "") {
      flushParagraph();
    } else if (heading) {
      flushParagraph();
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
    } else if (unorderedItem || orderedItem) {
      flushParagraph();
      const type = unorderedItem ? "unordered-list" : "ordered-list";
      const lastBlock = blocks[blocks.length - 1];
      const item = (unorderedItem ?? orderedItem)?.[1] ?? "";
      if (lastBlock?.type === type) {
        lastBlock.items.push(item);
      } else {
        blocks.push({ type, items: [item] });
      }
    } else {
      paragraph.push(line);
    }
  }
  flushParagraph();
  return blocks;
}

function renderInline(text: string): ReactNode[] {
  const pattern = /(\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  const nodes: ReactNode[] = [];
  let start = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > start) nodes.push(text.slice(start, match.index));
    if (match[2] && match[3]) {
      if (/^(https?:\/\/|mailto:)/i.test(match[3])) {
        nodes.push(
          <a
            className="underline underline-offset-2"
            href={match[3]}
            key={`link-${match.index}`}
            rel="noreferrer"
            target="_blank"
          >
            {match[2]}
          </a>,
        );
      } else {
        nodes.push(match[0]);
      }
    } else if (match[4]) {
      nodes.push(<strong key={`bold-${match.index}`}>{match[4]}</strong>);
    } else if (match[5]) {
      nodes.push(<em key={`italic-${match.index}`}>{match[5]}</em>);
    } else if (match[6]) {
      nodes.push(<code className="rounded bg-slate-100 px-1" key={`code-${match.index}`}>{match[6]}</code>);
    }
    start = pattern.lastIndex;
  }
  if (start < text.length) nodes.push(text.slice(start));
  return nodes;
}

export function AnnouncementContent({ content, className }: AnnouncementContentProps) {
  const blocks = parseBlocks(content);

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const Heading = (`h${block.level + 2}`) as "h3" | "h4" | "h5";
          return (
            <Heading className="font-semibold text-inherit" key={index}>
              {renderInline(block.text)}
            </Heading>
          );
        }
        if (block.type === "unordered-list" || block.type === "ordered-list") {
          const List = block.type === "unordered-list" ? "ul" : "ol";
          return (
            <List
              className={`list-inside space-y-1 ${block.type === "unordered-list" ? "list-disc" : "list-decimal"}`}
              key={index}
            >
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item)}</li>)}
            </List>
          );
        }
        return (
          <p className="whitespace-pre-wrap" key={index}>
            {block.lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
