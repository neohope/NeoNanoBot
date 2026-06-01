export interface ProviderBrand {
  logoUrl: string;
  logoUrls: string[];
  color: string;
  initials: string;
}

function officialFaviconUrl(domain: string): string {
  return `https://${domain}/favicon.ico`;
}

function duckDuckGoFaviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

function googleFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

export function faviconUrls(domain: string): string[] {
  const faviconDomain = faviconDomainFromValue(domain);
  return [
    officialFaviconUrl(faviconDomain),
    duckDuckGoFaviconUrl(faviconDomain),
    googleFaviconUrl(domain),
  ];
}

function brand(
  domain: string,
  color: string,
  initials: string,
  logoOverrides: string[] = [],
): ProviderBrand {
  const logoUrls = [...logoOverrides];
  faviconUrls(domain).forEach((url) => addUniqueLogoUrl(logoUrls, url));
  return {
    logoUrl: logoUrls[0],
    logoUrls,
    color,
    initials,
  };
}

function addUniqueLogoUrl(urls: string[], url: string | null | undefined): void {
  const value = url?.trim();
  if (value && !urls.includes(value)) urls.push(value);
}

function domainFromLogoUrl(url: string): string | null {
  if (url.startsWith("/")) return null;
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    const host = parsed.hostname.toLowerCase();
    if (host === "www.google.com" || host === "google.com") {
      return parsed.searchParams.get("domain");
    }
    if (host === "icons.duckduckgo.com") {
      const match = parsed.pathname.match(/^\/ip3\/(.+)\.ico$/);
      return match ? decodeURIComponent(match[1]) : null;
    }
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function faviconDomainFromValue(value: string): string {
  const host = value.split("/")[0]?.trim();
  return host || value;
}

export function logoFallbackUrls(logoUrl: string | null | undefined): string[] {
  const value = logoUrl?.trim();
  if (!value) return [];
  if (value.startsWith("/")) return [value];

  const urls: string[] = [];
  const domain = domainFromLogoUrl(value);
  const isFaviconProxy = /^(https?:\/\/)?(www\.google\.com|google\.com|icons\.duckduckgo\.com)\//i.test(value);
  if (domain && isFaviconProxy) {
    addUniqueLogoUrl(urls, value);
    faviconUrls(domain).forEach((url) => addUniqueLogoUrl(urls, url));
    return urls;
  }
  addUniqueLogoUrl(urls, value);
  if (domain) faviconUrls(domain).forEach((url) => addUniqueLogoUrl(urls, url));
  return urls;
}

export const PROVIDER_BRAND_ALIASES: Record<string, string> = {
  byteplus_coding_plan: "byteplus",
  mimo: "xiaomi_mimo",
  openai_codex: "openai",
  xiaomi: "xiaomi_mimo",
  volcengine_coding_plan: "volcengine",
};

export const PROVIDER_LABEL_ALIASES: Record<string, string> = {
  byteplus_coding_plan: "BytePlus",
  openai_codex: "OpenAI",
  volcengine_coding_plan: "Volcengine",
};

const PROVIDER_BRANDS: Record<string, ProviderBrand> = {
  anthropic: brand("anthropic.com", "#D97757", "A"),
  byteplus: brand("byteplus.com", "#325CFF", "BP"),
  deepseek: brand("deepseek.com", "#4D6BFE", "DS"),
  duckduckgo: brand("duckduckgo.com", "#DE5833", "DDG"),
  gemini: brand("gemini.google.com", "#4285F4", "G"),
  ollama: brand("ollama.com", "#111827", "O"),
  openai: brand("openai.com", "#111827", "AI"),
  tavily: brand("tavily.com", "#111827", "T"),
  volcengine: brand("volcengine.com", "#1664FF", "VE"),
  xiaomi_mimo: brand("mimo.xiaomi.com", "#FF6900", "MI", [
    "https://mimo.xiaomi.com/mimo-v2-pro/assets/logo.svg",
  ]),
};

export function providerBrand(provider: string | null | undefined): ProviderBrand | null {
  if (!provider) return null;
  const key = PROVIDER_BRAND_ALIASES[provider] ?? provider;
  return PROVIDER_BRANDS[key] ?? null;
}

export function providerDisplayLabel(
  providers: Array<{ name: string; label: string }>,
  value: string | null | undefined,
): string {
  if (!value) return "";
  return providers.find((provider) => provider.name === value)?.label
    ?? PROVIDER_LABEL_ALIASES[value]
    ?? value;
}

export function inferProviderFromModelName(modelName: string | null | undefined): string | null {
  const normalized = (modelName ?? "").trim().toLowerCase();
  if (!normalized) return null;
  const prefix = normalized.split(/[/:]/)[0];
  if (providerBrand(prefix)) return prefix;
  if (/claude|anthropic/.test(normalized)) return "anthropic";
  if (/gpt-|^o\d|chatgpt|openai/.test(normalized)) return "openai";
  if (/deepseek/.test(normalized)) return "deepseek";
  if (/gemini/.test(normalized)) return "gemini";
  return null;
}
