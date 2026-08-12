import type { HTMLAttributes } from "react";
import { TONES, type Tone } from "@stolpi/shared";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

/** Status pill using the shared tone palette (ok/warn/bad/info/steel/neutral) — README.md "Status palette". */
export function Tag({ tone = "neutral", style, ...rest }: TagProps) {
  const t = TONES[tone];
  return (
    <span
      className="tag"
      style={{ background: t.bg, color: t.fg, whiteSpace: "nowrap", ...style }}
      {...rest}
    />
  );
}
