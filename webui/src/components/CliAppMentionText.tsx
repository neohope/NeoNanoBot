import { useEffect, useMemo, useState } from "react";

import { logoFallbackUrls } from "@/lib/provider-brand";
import type { McpPresetInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

export type CliAppMentionSegment =
  | { kind: "text"; text: string }

export type CapabilityMentionSegment =
  | CliAppMentionSegment
  | { kind: "mcp"; text: string; preset: McpPresetInfo };

export function mcpPresetInitials(preset: Pick<McpPresetInfo, "name" | "display_name">): string {
  const value = preset.display_name || preset.name;
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || preset.name.slice(0, 2).toUpperCase()
  );
}

export function splitCapabilityMentionSegments(
  value: string,
  mcpPresets: McpPresetInfo[] = [],
): CapabilityMentionSegment[] {
  if (!value || (mcpPresets.length === 0)) {
    return value ? [{ kind: "text", text: value }] : [];
  }
  const mcpPresetsByName = new Map(
    mcpPresets
      .filter((preset) => preset.installed && preset.configured)
      .map((preset) => [preset.name.toLowerCase(), preset]),
  );
  if (mcpPresetsByName.size === 0) {
    return [{ kind: "text", text: value }];
  }

  const segments: CapabilityMentionSegment[] = [];
  const mentionRe = /(^|[\s([{])@([a-z0-9_-]+)\b/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = mentionRe.exec(value)) !== null) {
    const prefix = match[1] ?? "";
    const name = match[2] ?? "";
    const key = name.toLowerCase();
    const app = mcpPresetsByName.get(key);
    const preset = app;
    if (!app && !preset) continue;

    const mentionStart = match.index + prefix.length;
    const mentionEnd = mentionStart + name.length + 1;
    if (mentionStart > cursor) {
      segments.push({ kind: "text", text: value.slice(cursor, mentionStart) });
    }
    
    cursor = mentionEnd;
  }
  if (cursor < value.length) {
    segments.push({ kind: "text", text: value.slice(cursor) });
  }
  return segments.length ? segments : [{ kind: "text", text: value }];
}

export function CliAppMentionText({
  text,
  mcpPresets = [],
}: {
  text: string;
  mcpPresets?: McpPresetInfo[];
}) {
  const segments = splitCapabilityMentionSegments(text, mcpPresets);
  if (!segments.some((segment) => segment.kind === "mcp")) return <>{text}</>;
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <span key={`text-${index}`}>{segment.text}</span>;
        }
        return (
          <McpPresetMentionToken
            key={`mcp-${segment.preset.name}-${index}`}
            preset={segment.preset}
            label={segment.text}
            variant="message"
          />
        );
      })}
    </>
  );
}

export function McpPresetMentionToken({
  preset,
  label,
  variant,
  isHero = false,
}: {
  preset: McpPresetInfo;
  label: string;
  variant: "composer" | "message";
  isHero?: boolean;
}) {
  const [logoIndex, setLogoIndex] = useState(0);
  const color = preset.brand_color || "hsl(var(--primary))";
  const mentionName = label.startsWith("@") ? label.slice(1) : label;
  const logoUrls = useMemo(() => logoFallbackUrls(preset.logo_url), [preset.logo_url]);
  const logoUrl = logoUrls[logoIndex];
  const showLogo = Boolean(logoUrl);
  const testIdPrefix = variant === "composer" ? "composer" : "message";

  useEffect(() => setLogoIndex(0), [preset.logo_url]);

  return (
    <span
      data-testid={`${testIdPrefix}-mcp-mention-${preset.name}`}
      title={`MCP server: ${preset.display_name || preset.name}`}
      className="relative inline transition-[color,text-shadow] duration-150"
      style={{
        color,
        textShadow: `0 0 10px ${alphaColor(color, 24)}`,
      }}
    >
      <span
        className={cn("relative inline-block", showLogo && "text-transparent")}
        style={{ lineHeight: "inherit" }}
      >
        @
        {showLogo ? (
          <span
            data-testid={`${testIdPrefix}-mcp-mention-logo-${preset.name}`}
            className={cn(
              "absolute left-1/2 top-1/2 grid place-items-center overflow-hidden rounded-[3px]",
              "-translate-x-1/2 -translate-y-1/2",
              isHero ? "h-[0.74em] w-[0.74em]" : "h-[0.72em] w-[0.72em]",
            )}
          >
            <img
              src={logoUrl ?? ""}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setLogoIndex((index) => index + 1)}
            />
          </span>
        ) : null}
      </span>
      {mentionName}
    </span>
  );
}

function alphaColor(color: string, percent: number): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    const alpha = Math.round((percent / 100) * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${alpha}`;
  }
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}
