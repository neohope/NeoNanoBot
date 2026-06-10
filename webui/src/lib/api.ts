import type {
  ChatSummary,
  SidebarStatePayload,
  SlashCommand,
  WorkspacesPayload,
  WebuiThreadPersistedPayload,
  WorkspaceScopePayload,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function request<T>(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...(init ?? {}),
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    credentials: "same-origin",
  });
  if (!res.ok) {
    const text = typeof res.text === "function" ? (await res.text()).trim() : "";
    throw new ApiError(res.status, text || `HTTP ${res.status}`);
  }
  const contentType = res.headers?.get?.("content-type") ?? "";
  if (contentType && !contentType.toLowerCase().includes("application/json")) {
    const text = typeof res.text === "function" ? await res.text() : "";
    const isHtml = text.trimStart().toLowerCase().startsWith("<!doctype");
    throw new ApiError(
      res.status,
      isHtml
        ? "Gateway returned WebUI HTML instead of JSON. Restart neonanobot gateway and try again."
        : "Gateway returned a non-JSON response.",
    );
  }
  return (await res.json()) as T;
}

function splitKey(key: string): { channel: string; chatId: string } {
  const idx = key.indexOf(":");
  if (idx === -1) return { channel: "", chatId: key };
  return { channel: key.slice(0, idx), chatId: key.slice(idx + 1) };
}

export async function listSessions(token: string): Promise<ChatSummary[]> {
  type Row = {
    key: string;
    created_at: string | null;
    updated_at: string | null;
    title?: string;
    preview?: string;
    run_started_at?: number | null;
    workspace_scope?: WorkspaceScopePayload | null;
  };
  const body = await request<{ sessions: Row[] }>("/api/sessions", token);
  return body.sessions.map((s) => ({
    key: s.key,
    ...splitKey(s.key),
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    title: s.title ?? "",
    preview: s.preview ?? "",
    runStartedAt: s.run_started_at ?? null,
    workspaceScope: s.workspace_scope ?? null,
  }));
}

/** Disk-backed WebUI display thread snapshot (separate from agent session). */
export async function fetchWebuiThread(
  token: string,
  key: string,
): Promise<WebuiThreadPersistedPayload | null> {
  const url = `/api/sessions/${encodeURIComponent(key)}/webui-thread`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
  return (await res.json()) as WebuiThreadPersistedPayload;
}

export async function deleteSession(
  token: string,
  key: string,
): Promise<void> {
  await request<{ deleted: boolean }>(
    `/api/sessions/${encodeURIComponent(key)}/delete`,
    token,
  );
}

export async function fetchWorkspaces(token: string): Promise<WorkspacesPayload> {
  return request<WorkspacesPayload>("/api/workspaces", token);
}

export async function listSlashCommands(token: string): Promise<SlashCommand[]> {
  type Row = {
    command: string;
    title: string;
    description: string;
    icon: string;
    arg_hint?: string;
  };
  const body = await request<{ commands: Row[] }>("/api/commands", token);
  return body.commands
    .filter((command) => !["/stop", "/restart"].includes(command.command))
    .map((command) => ({
      command: command.command,
      title: command.title,
      description: command.description,
      icon: command.icon,
      argHint: command.arg_hint ?? "",
    }));
}

export async function fetchSidebarState(token: string): Promise<SidebarStatePayload> {
  return request<SidebarStatePayload>("/api/webui/sidebar-state", token);
}

export async function updateSidebarState(
  token: string,
  state: SidebarStatePayload,
): Promise<SidebarStatePayload> {
  const query = new URLSearchParams();
  query.set("state", JSON.stringify(state));
  return request<SidebarStatePayload>(
    `/api/webui/sidebar-state/update?${query}`,
    token,
  );
}

