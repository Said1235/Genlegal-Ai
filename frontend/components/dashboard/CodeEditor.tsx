"use client";

import { useMemo, useRef } from "react";

export function CodeEditor({
  value,
  onChange,
  placeholder,
  minHeight = 600,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const lineCount = useMemo(() => Math.max(1, value.split("\n").length), [value]);
  const lineNumbers = useMemo(() => Array.from({ length: lineCount }, (_, i) => i + 1), [lineCount]);
  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const syncScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div
      className="flex overflow-hidden rounded-xl border border-white/10 bg-[#0a0a12] font-mono text-[13px]"
      style={{ height: window && window.innerWidth < 640 ? Math.min(minHeight, 320) : minHeight }}
    >
      <div
        ref={gutterRef}
        className="select-none overflow-hidden border-r border-white/5 bg-white/[0.02] px-3 py-4 text-right text-white/25"
        style={{ lineHeight: "1.6rem" }}
      >
        {lineNumbers.map((n) => (
          <div key={n}>{n}</div>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="flex-1 resize-none overflow-auto bg-transparent px-4 py-4 text-white/85 placeholder:text-white/25 focus:outline-none"
        style={{ lineHeight: "1.6rem" }}
      />
    </div>
  );
}
