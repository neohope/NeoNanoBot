# Configuration

Config file: `~/.neonanobot/config.json`

> [!NOTE]
> If your config file is older than the current schema, you can refresh it without overwriting your existing values:
> run `neonanobot onboard`, then answer `N` when asked whether to overwrite the config.
> neonanobot will merge in missing default fields and keep your current settings.

## Environment Variables for Secrets

Instead of storing secrets directly in `config.json`, you can use `${VAR_NAME}` references that are resolved from environment variables at startup:

```json
{
  "channels": {
    "telegram": { "token": "${TELEGRAM_TOKEN}" },
    "email": {
      "imapPassword": "${IMAP_PASSWORD}",
      "smtpPassword": "${SMTP_PASSWORD}"
    }
  },
  "providers": {
    "groq": { "apiKey": "${GROQ_API_KEY}" }
  }
}
```

Any string value in `config.json` can use `${VAR_NAME}`. Resolution runs once at startup, in memory only — resolved values are never written back to disk, so editing config through `neonanobot onboard` or the WebUI preserves the placeholder.

If a referenced variable is unset, neonanobot fails fast at startup with `ValueError: Environment variable 'NAME' referenced in config is not set`.

### More examples

**MCP servers** — both stdio `env` and HTTP `headers`:

```json
{
  "tools": {
    "mcpServers": {
      "github": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
      },
      "remote": {
        "url": "https://example.com/mcp/",
        "headers": { "Authorization": "Bearer ${REMOTE_MCP_TOKEN}" }
      }
    }
  }
}
```

**Web search providers:**

```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "brave",
        "apiKey": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

### Loading variables at startup

Pick whatever fits your deployment — neonanobot only reads `os.environ` at startup, so any mechanism that populates the process environment works.

**systemd** — use `EnvironmentFile=` in the service unit to load variables from a file that only the deploying user can read:

```ini
# /etc/systemd/system/neonanobot.service (excerpt)
[Service]
EnvironmentFile=/home/youruser/nanobot_secrets.env
User=neonanobot
ExecStart=...
```

```bash
# /home/youruser/nanobot_secrets.env (mode 600, owned by youruser)
TELEGRAM_TOKEN=your-token-here
IMAP_PASSWORD=your-password-here
```

**Docker** — pass an env file to the locally built image (one `KEY=VALUE` per line), or use `-e KEY=value`:

```bash
docker run --rm --env-file=./neonanobot.env \
  -v ~/.neonanobot:/home/neonanobot/.neonanobot \
  neonanobot agent -m "Hello"
```

**direnv** — drop a `.envrc` in your working directory and run `direnv allow`:

```bash
# .envrc (auto-loaded by direnv)
export TELEGRAM_TOKEN=your-token-here
export ANTHROPIC_API_KEY=...
```

**Secret managers (1Password, Bitwarden, pass)** — wrap the process so secrets only exist as env vars for the lifetime of the run, never on disk:

```bash
# 1Password — references in .env.tpl look like `op://Vault/Item/field`
op run --env-file=.env.tpl -- neonanobot agent

# pass (passwordstore.org)
ANTHROPIC_API_KEY="$(pass show api/anthropic)" neonanobot agent

# Bitwarden
ANTHROPIC_API_KEY="$(bw get password api/anthropic)" neonanobot agent
```

## Providers

| Provider | Purpose | Get API Key |
|----------|---------|-------------|
| `custom` | Any OpenAI-compatible endpoint | — |
| `anthropic` | LLM (Claude direct) | [console.anthropic.com](https://console.anthropic.com) |
| `openai` | LLM + Voice transcription (Whisper) | [platform.openai.com](https://platform.openai.com) |
| `gemini` | LLM (Gemini direct) | [aistudio.google.com](https://aistudio.google.com) |
| `byteplus` | LLM (VolcEngine international, pay-per-use) | [Coding Plan](https://www.byteplus.com/en/activity/codingplan) · [byteplus.com](https://www.byteplus.com) |
| `volcengine` | LLM (VolcEngine, pay-per-use) | [Coding Plan](https://www.volcengine.com/activity/codingplan) · [volcengine.com](https://www.volcengine.com) |
| `deepseek` | LLM (DeepSeek direct) | [platform.deepseek.com](https://platform.deepseek.com) |
| `mimo` | LLM (MiMo) | [platform.xiaomimimo.com](https://platform.xiaomimimo.com) |
| `ollama` | LLM (local, Ollama) | — |

<details>
<summary><b>OpenAI</b></summary>

By default, OpenAI uses `apiType: "auto"`: neonanobot calls Chat Completions normally and routes GPT-5/o-series or explicit `reasoningEffort` requests through the Responses API when useful. You can force a specific API surface:

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "apiType": "chat_completions"
    }
  }
}
```

Valid `apiType` values are exactly `auto`, `chat_completions`, and `responses`.

`extraBody` follows the selected OpenAI API surface. With Chat Completions, neonanobot passes it through as the SDK `extra_body` value. With Responses, configure it in Responses API body shape; neonanobot merges ordinary top-level fields into the Responses request body, appends `extraBody.tools` after generated function tools, and merges `extraBody.include` without duplicates:

```json
{
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "apiType": "responses",
      "extraBody": {
        "tools": [{ "type": "web_search" }],
        "include": ["web_search_call.action.sources"]
      }
    }
  }
}
```

</details>

<details>
<summary><b>Xiaomi MiMo</b></summary>

Xiaomi MiMo models are automatically detected by the `xiaomi_mimo` provider when
the model name contains `mimo`. The default API base is
`https://api.xiaomimimo.com/v1`.

> **Token Plan**: If you're using MiMo's token plan, override `apiBase` with the
> dedicated endpoint:
>
> ```json
> {
>   "providers": {
>     "xiaomi_mimo": {
>       "apiKey": "${XIAOMIMIMO_API_KEY}",
>       "apiBase": "https://token-plan-sgp.xiaomimimo.com/v1"
>     }
>   },
>   "agents": {
>     "defaults": {
>       "model": "xiaomi/mimo-v2.5-pro"
>     }
>   }
> }
> ```
>
> No need to set `provider` explicitly — the model name contains `mimo`, which
> auto-matches to the `xiaomi_mimo` provider spec. Use an API key from the MiMo
> token plan console and check the MiMo platform for the latest supported model
> names.

</details>

<details>
<summary><b>Custom Provider (Any OpenAI-compatible API)</b></summary>

Connects directly to any OpenAI-compatible endpoint — llama.cpp, Together AI, Fireworks, Azure OpenAI, or any self-hosted server. Model name is passed as-is.

```json
{
  "providers": {
    "custom": {
      "apiKey": "your-api-key",
      "apiBase": "https://api.your-provider.com/v1"
    }
  },
  "agents": {
    "defaults": {
      "model": "your-model-name"
    }
  }
}
```

> For local servers that don't require authentication, set `apiKey` to `null`.
>
> `custom` is the right choice for providers that expose an OpenAI-compatible **chat completions** API. It does **not** force third-party endpoints onto the OpenAI/Azure **Responses API**.
>
> If your proxy or gateway is specifically Responses-API-compatible, use the `azure_openai` provider shape instead and point `apiBase` at that endpoint:
>
> ```json
> {
>   "providers": {
>     "azure_openai": {
>       "apiKey": "your-api-key",
>       "apiBase": "https://api.your-provider.com",
>       "defaultModel": "your-model-name"
>     }
>   },
>   "agents": {
>     "defaults": {
>       "provider": "azure_openai",
>       "model": "your-model-name"
>     }
>   }
> }
> ```
>
> In short: **chat-completions-compatible endpoint → `custom`**; **Responses-compatible endpoint → `azure_openai`**.

Some OpenAI-compatible gateways expose request-body extensions such as vLLM guided decoding or local sampling controls. Put those under `extraBody`; neonanobot merges them into the chat-completions request body after its provider defaults:

```json
{
  "providers": {
    "custom": {
      "apiKey": "your-api-key",
      "apiBase": "https://api.your-provider.com/v1",
      "extraBody": {
        "repetition_penalty": 1.15,
        "chat_template_kwargs": {
          "enable_thinking": false
        }
      }
    }
  }
}
```

</details>

<a id="local-providers"></a>
<a id="ollama-local"></a>
<details>
<summary><b>Ollama (local)</b></summary>

Run a local model with Ollama, then add to config:

**1. Start Ollama** (example):
```bash
ollama run llama3.2
```

**2. Add to config** (partial — merge into `~/.neonanobot/config.json`):
```json
{
  "providers": {
    "ollama": {
      "apiBase": "http://localhost:11434"
    }
  },
  "agents": {
    "defaults": {
      "provider": "ollama",
      "model": "llama3.2"
    }
  }
}
```

> `provider: "auto"` also works when `providers.ollama.apiBase` is configured, but setting `"provider": "ollama"` is the clearest option.

</details>

<details>
<summary><b>Adding a New Provider (Developer Guide)</b></summary>

neonanobot uses a **Provider Registry** (`neonanobot/providers/registry.py`) as the single source of truth.
Adding a new provider only takes **2 steps** — no if-elif chains to touch.

**Step 1.** Add a `ProviderSpec` entry to `PROVIDERS` in `neonanobot/providers/registry.py`:

```python
ProviderSpec(
    name="myprovider",                   # config field name
    keywords=("myprovider", "mymodel"),  # model-name keywords for auto-matching
    env_key="MYPROVIDER_API_KEY",        # env var name
    display_name="My Provider",          # shown in `neonanobot status`
    default_api_base="https://api.myprovider.com/v1",  # OpenAI-compatible endpoint
)
```

**Step 2.** Add a field to `ProvidersConfig` in `neonanobot/config/schema.py`:

```python
class ProvidersConfig(BaseModel):
    ...
    myprovider: ProviderConfig = ProviderConfig()
```

That's it! Environment variables, model routing, config matching, and `neonanobot status` display will all work automatically.

**Common `ProviderSpec` options:**

| Field | Description | Example |
|-------|-------------|---------|
| `default_api_base` | OpenAI-compatible base URL | `"https://api.deepseek.com"` |
| `env_extras` | Additional env vars to set | `(("ZHIPUAI_API_KEY", "{api_key}"),)` |
| `model_overrides` | Per-model parameter overrides | `(("kimi-k2.5", {"temperature": 1.0}), ("kimi-k2.6", {"temperature": 1.0}),)` |
| `is_gateway` | Can route any model (like OpenRouter) | `True` |
| `detect_by_key_prefix` | Detect gateway by API key prefix | `"sk-or-"` |
| `detect_by_base_keyword` | Detect gateway by API base URL | `"openrouter"` |
| `strip_model_prefix` | Strip provider prefix before sending to gateway | `True` (for AiHubMix) |
| `supports_max_completion_tokens` | Use `max_completion_tokens` instead of `max_tokens`; required for providers that reject both being set simultaneously (e.g. VolcEngine) | `True` |

</details>

## Model Presets

Model presets let you name a complete model configuration and switch it at runtime with `/model <preset>`.

Existing configs do not need to change. If you do not set `modelPresets` or `agents.defaults.modelPreset`, neonanobot keeps using `agents.defaults.*` exactly as before.

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-4.1",
      "provider": "openai",
      "maxTokens": 8192,
      "contextWindowTokens": 128000,
      "temperature": 0.1,
      "modelPreset": "fast",
      "fallbackModels": ["deep"]
    }
  },
  "modelPresets": {
    "fast": {
      "model": "openai/gpt-4.1-mini",
      "provider": "openai",
      "maxTokens": 4096,
      "contextWindowTokens": 128000,
      "temperature": 0.2,
      "reasoningEffort": "low"
    },
    "deep": {
      "model": "anthropic/claude-opus-4-5",
      "provider": "anthropic",
      "maxTokens": 8192,
      "contextWindowTokens": 200000,
      "reasoningEffort": "high"
    }
  }
}
```

`modelPresets` is a top-level object. The keys under it (`fast`, `deep`, `coding`, etc.) are user-defined preset names. Each preset supports:

| Field | Description |
|-------|-------------|
| `model` | Model name to use for this preset. |
| `provider` | Provider name, or `"auto"` to use provider auto-detection. |
| `maxTokens` | Maximum completion/output tokens. |
| `contextWindowTokens` | Context window size used by prompt building and consolidation decisions. |
| `temperature` | Sampling temperature. |
| `reasoningEffort` | Optional reasoning/thinking setting. Provider support varies. |

`default` is reserved and always means the implicit preset built from `agents.defaults.*`; do not define `modelPresets.default`. Use `/model default` to switch back to `agents.defaults.*`.

### Model Fallbacks

`agents.defaults.fallbackModels` defines an ordered failover chain for the active model configuration. The primary model is still selected by `agents.defaults.modelPreset` (or the implicit default config when no preset is active).

Each fallback candidate can be either:

- A preset name from `modelPresets`, such as `"deep"`. The preset's full model, provider, generation, and context-window config is used.
- An inline fallback object with at least `provider` and `model`. Optional `maxTokens`, `contextWindowTokens`, and `temperature` fields inherit from the active primary config when omitted. `reasoningEffort` does not inherit; omit it to leave reasoning off for that fallback, or set it explicitly for models that support reasoning.

```json
{
  "agents": {
    "defaults": {
      "modelPreset": "fast",
      "fallbackModels": [
        "deep",
        {
          "provider": "deepseek",
          "model": "deepseek-v4-pro",
          "maxTokens": 4096,
          "contextWindowTokens": 262144
        }
      ]
    }
  }
}
```

String entries are preset names, not raw model names. If you want to use a model that is not already a preset, use the inline object form.

Failover only runs when the primary provider returns a retryable model/provider error before any answer text has been streamed. Typical fallback cases include timeouts, connection errors, 5xx server errors, 429 rate limits, overloads, and quota/balance exhaustion. It does not run for malformed requests, authentication/permission errors, content filtering/refusals, or context-length/message-format errors.

If fallback candidates use smaller `contextWindowTokens` values, neonanobot builds context using the smallest window in the active chain so every candidate can receive the same prompt.

Set `agents.defaults.modelPreset` to start with a named preset:

```json
{
  "agents": {
    "defaults": {
      "modelPreset": "fast"
    }
  }
}
```

When `modelPreset` is `null` or omitted, startup uses the implicit `default` preset from `agents.defaults.*`. Runtime changes made with `/model <preset>` are not written back to `config.json`; they affect future turns until the process restarts or another model/config change replaces them.

## Channel Settings

Global settings that apply to all channels. Configure under the `channels` section in `~/.neonanobot/config.json`:

```json
{
  "channels": {
    "sendProgress": true,
    "sendToolHints": false,
    "extractDocumentText": true,
    "sendMaxRetries": 3,
    "transcriptionProvider": "groq",
    "transcriptionLanguage": null,
    "telegram": { ... }
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `sendProgress` | `true` | Stream agent's text progress to the channel |
| `sendToolHints` | `false` | Stream tool-call hints (e.g. `read_file("…")`) |
| `showReasoning` | `true` | Allow channels to surface model reasoning/thinking content (DeepSeek-R1 `reasoning_content`, Anthropic `thinking_blocks`, inline `<think>` tags). Reasoning flows as a dedicated stream with `_reasoning_delta` / `_reasoning_end` markers — channels override `send_reasoning_delta` / `send_reasoning_end` to render in-place updates. Even with `true`, channels without those overrides stay no-op silently. Currently surfaced on CLI and WebSocket/WebUI (italic shimmer header, auto-collapses after the stream ends); Feishu / WebUI keep the base no-op until their bubble UI is adapted. Independent of `sendProgress`. |
| `extractDocumentText` | `true` | Extract supported document/text attachments into the model prompt. Set to `false` to keep document content out of the prompt and include attachment path references instead. |
| `sendMaxRetries` | `3` | Max delivery attempts per outbound message, including the initial send (0-10 configured, minimum 1 actual attempt) |
| `transcriptionProvider` | `"groq"` | Voice transcription backend: `"groq"` (free tier, default) or `"openai"`. API key and optional `apiBase` are auto-resolved from the matching provider config. Chat-style bases such as `https://api.groq.com/openai/v1` are normalized to the audio transcription endpoint. |
| `transcriptionLanguage` | `null` | Optional ISO-639-1 language hint for audio transcription, e.g. `"en"`, `"ko"`, `"ja"`. |

`sendProgress` and `sendToolHints` can also be overridden per channel. The
global values stay as defaults for channels that do not set their own value:

```json
{
  "channels": {
    "sendProgress": true,
    "sendToolHints": false,
    "telegram": {
      "enabled": true,
      "sendProgress": false
    },
    "websocket": {
      "enabled": true,
      "sendToolHints": true
    }
  }
}
```

### Retry Behavior

Retry is intentionally simple.

When a channel `send()` raises, neonanobot retries at the channel-manager layer. By default, `channels.sendMaxRetries` is `3`, and that count includes the initial send.

- **Attempt 1**: Send immediately
- **Attempt 2**: Retry after `1s`
- **Attempt 3**: Retry after `2s`
- **Higher retry budgets**: Backoff continues as `1s`, `2s`, `4s`, then stays capped at `4s`
- **Transient failures**: Network hiccups and temporary API limits often recover on the next attempt
- **Permanent failures**: Invalid tokens, revoked access, or banned channels will exhaust the retry budget and fail cleanly

> [!NOTE]
> This design is deliberate: channel implementations should raise on delivery failure, and the channel manager owns the shared retry policy.
>
> Some channels may still apply small API-specific retries internally. For example, Telegram separately retries timeout and flood-control errors before surfacing a final failure to the manager.
>
> If a channel is completely unreachable, neonanobot cannot notify the user through that same channel. Watch logs for `Failed to send to {channel} after N attempts` to spot persistent delivery failures.

## Web Tools

neonanobot incorporates basic tools for accessing the web. These include searching via APIs, and fetching arbitrary web pages in Markdown format. They are enabled by default, and can be configured in `~/.neonanobot/config.json` under `tools.web`.

If you want to disable them, which removes both `web_search` and `web_fetch` from the tool list sent to the LLM, set `tools.web.enable` to `false`:

```json
{
  "tools": {
    "web": {
      "enable": false
    }
  }
}
```

If you need to allow trusted private ranges such as Tailscale / CGNAT addresses, you can explicitly exempt them from SSRF blocking with `tools.ssrfWhitelist`:

```json
{
  "tools": {
    "ssrfWhitelist": ["100.64.0.0/10"]
  }
}
```

> [!TIP]
> Use `proxy` in `tools.web` to route all web requests (search + fetch) through a proxy:
> ```json
> { "tools": { "web": { "proxy": "http://127.0.0.1:7890" } } }
> ```

### `tools.web`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enable` | boolean | `true` | Enable or disable all built-in web tools (`web_search` + `web_fetch`) |
| `proxy` | string or null | `null` | Proxy for all web requests, for example `http://127.0.0.1:7890` |
| `userAgent` | string or null | `null` | User-Agent header for all web requests. If null, a browser one will be used |

### Web Search

neonanobot supports multiple web search providers. Configure in `~/.neonanobot/config.json` under `tools.web.search`.

By default, web search uses `duckduckgo`, and it works out of the box without an API key.

| Provider | Config fields | Env var fallback | Free |
|----------|--------------|------------------|------|
| `tavily` | `apiKey` | `TAVILY_API_KEY` | No |
| `duckduckgo` (default) | — | — | Yes |

**Tavily:**
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "tavily",
        "apiKey": "${TAVILY_API_KEY}"
      }
    }
  }
}
```

**DuckDuckGo** (zero config):
```json
{
  "tools": {
    "web": {
      "search": {
        "provider": "duckduckgo"
      }
    }
  }
}
```

#### `tools.web.search`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `provider` | string | `"duckduckgo"` | Search backend: `brave`, `tavily`, `jina`, `searxng`, `duckduckgo` |
| `apiKey` | string | `""` | API key for Brave or Tavily |
| `baseUrl` | string | `""` | Base URL for SearXNG |
| `maxResults` | integer | `5` | Results per search (1–10) |

### Web Fetch

> [!TIP]
> If you are having issues with JS proof-of-work or Cloudflare captchas, set a random user agent and disable Jina Reader:
> ```json
> { "tools": { "web": { "userAgent": "Not-A-Browser", "fetch": { "useJinaReader": false } } } }
> ```

neonanobot by default uses [Jina Reader](https://jina.ai/reader/), a third-party API, to convert arbitrary pages into Markdown format for easy digestion by the LLM, with a local fallback based on [readability-lxml](https://github.com/buriy/python-readability) if the former fails.

If you want to always use the local conversion, you can force it using:

```json
{
  "tools": {
    "web": {
      "fetch": {
        "useJinaReader": false
      }
    }
  }
}
```

#### `tools.web.fetch`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `useJinaReader` | boolean | `true` | If true, Jina Reader will be preferred over the local conversion |

## Image Generation

Image generation is configured under `tools.imageGeneration` and uses credentials from the selected provider's `providers.<name>` block.

See [Image Generation](./image-generation.md) for WebUI usage, provider examples, artifact storage, and troubleshooting.

## MCP (Model Context Protocol)

> [!TIP]
> The config format is compatible with Claude Desktop / Cursor. You can copy MCP server configs directly from any MCP server's README.

neonanobot supports [MCP](https://modelcontextprotocol.io/) — connect external tool servers and use them as native agent tools.

Add MCP servers to your `config.json`:

```json
{
  "tools": {
    "mcpServers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
      },
      "my-remote-mcp": {
        "url": "https://example.com/mcp/",
        "headers": {
          "Authorization": "Bearer xxxxx"
        }
      }
    }
  }
}
```

Two transport modes are supported:

| Mode | Config | Example |
|------|--------|---------|
| **Stdio** | `command` + `args` | Local process via `npx` / `uvx` |
| **HTTP** | `url` + `headers` (optional) | Remote endpoint (`https://mcp.example.com/sse`) |

Use `toolTimeout` to override the default 30s per-call timeout for slow servers:

```json
{
  "tools": {
    "mcpServers": {
      "my-slow-server": {
        "url": "https://example.com/mcp/",
        "toolTimeout": 120
      }
    }
  }
}
```

Use `enabledTools` to register only a subset of tools from an MCP server:

```json
{
  "tools": {
    "mcpServers": {
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"],
        "enabledTools": ["read_file", "mcp_filesystem_write_file"]
      }
    }
  }
}
```

`enabledTools` accepts either the raw MCP tool name (for example `read_file`) or the wrapped neonanobot tool name (for example `mcp_filesystem_write_file`).

- Omit `enabledTools`, or set it to `["*"]`, to register all tools.
- Set `enabledTools` to `[]` to register no tools from that server.
- Set `enabledTools` to a non-empty list of names to register only that subset.

MCP tools are automatically discovered and registered on startup. The LLM can use them alongside built-in tools — no extra configuration needed.




## Security

> [!TIP]
> For production deployments, set `"restrictToWorkspace": true` and `"tools.exec.sandbox": "bwrap"` in your config to sandbox the agent.

For API keys, tokens, and other secrets, see [Environment Variables for Secrets](#environment-variables-for-secrets) — avoid storing them directly in `config.json`.

| Option | Default | Description |
|--------|---------|-------------|
| `tools.restrictToWorkspace` | `false` | When `true`, restricts **all** agent tools (shell, file read/write/edit, list) to the workspace directory. Prevents path traversal and out-of-scope access. |
| `tools.exec.sandbox` | `""` | Sandbox backend for shell commands. Set to `"bwrap"` to wrap exec calls in a [bubblewrap](https://github.com/containers/bubblewrap) sandbox — the process can only see the workspace (read-write) and media directory (read-only); config files and API keys are hidden. Automatically enables `restrictToWorkspace` for file tools. **Linux only** — requires `bwrap` installed (`apt install bubblewrap`; pre-installed in the Docker image). Not available on macOS or Windows (bwrap depends on Linux kernel namespaces). |
| `tools.exec.enable` | `true` | When `false`, the shell `exec` tool is not registered at all. Use this to completely disable shell command execution. |
| `tools.exec.timeout` | `60` | Default hard timeout in seconds for shell commands. Config values may exceed the per-call tool cap; set `0` to disable the hard timeout for trusted long-running commands. |
| `tools.exec.pathAppend` | `""` | Extra directories to append to `PATH` when running shell commands (e.g. `/usr/sbin` for `ufw`). |
| `channels.*.allowFrom` | omitted | Access control per channel. Omit to use pairing-only mode; set `["*"]` to allow everyone; or list specific user IDs. See [Pairing](#pairing) for details. |

**Docker security**: The official Docker image runs as a non-root user (`neonanobot`, UID 1000) with bubblewrap pre-installed. When using `docker-compose.yml`, the container drops all Linux capabilities except `SYS_ADMIN` (required for bwrap's namespace isolation).


## Pairing

Pairing lets users get access to the bot through a simple code exchange — no config editing required. This works for both new users and existing users connecting from a new channel (e.g. someone already approved on WebUI now setting up Feishu).

### How it works

1. A user sends a DM to the bot on any channel (Feisu, etc.) where they aren't yet approved.
2. The bot replies with a pairing code (like `ABCD-EFGH`) and tells them to forward it to you.
3. You approve the code:

```text
/pairing approve ABCD-EFGH
```

4. The user can now chat with the bot normally.

Pairing only works in **DMs** — unapproved users in group chats are silently ignored.

### Pairing-only mode

By default, if you don't set `allowFrom`, anyone who isn't approved yet will get a pairing code when they DM the bot. This means you can skip `allowFrom` entirely and manage all access through pairing:

```json
{
  "channels": {
    "feishu": {
      "enabled": true
    }
  }
}
```

If you prefer to allow everyone without approval:

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "allowFrom": ["*"]
    }
  }
}
```

### Managing access

| Command | What it does |
|---------|-------------|
| `/pairing` | Show all pending pairing requests |
| `/pairing approve <code>` | Approve a request — the sender can now chat |
| `/pairing deny <code>` | Reject a pending request |
| `/pairing revoke <user_id>` | Remove a previously approved user from the current channel |
| `/pairing revoke <channel> <user_id>` | Remove a user from a specific channel |

You can find user IDs in the output of `/pairing list`.

From the terminal:

```bash
neonanobot agent -m "/pairing list"
neonanobot agent -m "/pairing approve ABCD-EFGH"
```


## Subagent Concurrency

By default, neonanobot only allows one spawned subagent at a time. When the limit is
reached, the `spawn` tool returns an error so the agent can decide to wait or
rearrange its work. This protects local LLM servers from loading multiple KV caches
at once. If your provider can handle more parallel work, raise the limit:

```json
{
  "agents": {
    "defaults": {
      "maxConcurrentSubagents": 2
    }
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `agents.defaults.maxConcurrentSubagents` | `1` | Maximum number of spawned subagents that may run at the same time. Attempts to spawn beyond this limit return an error. |


## Auto Compact

When a user is idle for longer than a configured threshold, neonanobot **proactively** compresses the older part of the session context into a summary while keeping a recent legal suffix of live messages. This reduces token cost and first-token latency when the user returns — instead of re-processing a long stale context with an expired KV cache, the model receives a compact summary, the most recent live context, and fresh input.

```json
{
  "agents": {
    "defaults": {
      "idleCompactAfterMinutes": 15
    }
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `agents.defaults.idleCompactAfterMinutes` | `0` (disabled) | Minutes of idle time before auto-compaction starts. Set to `0` to disable. Recommended: `15` — close to a typical LLM KV cache expiry window, so stale sessions get compacted before the user returns. |

`sessionTtlMinutes` remains accepted as a legacy alias for backward compatibility, but `idleCompactAfterMinutes` is the preferred config key going forward.

How it works:
1. **Idle detection**: On each idle tick (~1 s), checks all sessions for expiration.
2. **Background compaction**: Idle sessions summarize the older live prefix via LLM and keep the most recent legal suffix (currently 8 messages).
3. **Summary injection**: When the user returns, the summary is injected as runtime context (one-shot, not persisted) alongside the retained recent suffix.
4. **Restart-safe resume**: The summary is also mirrored into session metadata so it can still be recovered after a process restart.

> [!NOTE]
> Mental model: "summarize older context, keep the freshest live turns, **and overwrite the session file with the compact form.**" It is not a full `session.clear()`, but it is a write — not a soft cursor move.
>
> Concretely, auto compact rewrites `sessions/<key>.jsonl` in place: older messages (including their structured `tool_calls` / `tool_call_id` / `reasoning_content`) are replaced by just the retained recent suffix (currently 8 messages), while the archived prefix is preserved only as a plain-text summary appended to `memory/history.jsonl` (or a `[RAW] ...` flattened dump if LLM summarization fails). The original structured JSON of those turns is no longer recoverable from the session file.
>
> This differs from the **token-driven soft consolidation** that fires when a prompt exceeds the context budget: that path only advances an internal `last_consolidated` cursor and leaves the session file untouched, so the raw tool-call trail stays on disk and can still be replayed or audited. If you rely on that trail for debugging or auditing, leave `idleCompactAfterMinutes` at the default `0` and let only the token-driven path run.

## Timezone

Time is context. Context should be precise.

By default, neonanobot uses `UTC` for runtime time context. If you want the agent to think in your local time, set `agents.defaults.timezone` to a valid [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones):

```json
{
  "agents": {
    "defaults": {
      "timezone": "Asia/Shanghai"
    }
  }
}
```

This affects runtime time strings shown to the model, such as runtime context. It also becomes the default timezone for cron schedules when a cron expression omits `tz`, and for one-shot `at` times when the ISO datetime has no explicit offset.

Common examples: `UTC`, `America/New_York`, `America/Los_Angeles`, `Europe/London`, `Europe/Berlin`, `Asia/Tokyo`, `Asia/Shanghai`, `Asia/Singapore`, `Australia/Sydney`.

> Need another timezone? Browse the full [IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).

## Unified Session

By default, each channel × chat ID combination gets its own session. If you use neonanobot across multiple channels (e.g. Feishu + WebUI + CLI) and want them to share the same conversation, enable `unifiedSession`:

```json
{
  "agents": {
    "defaults": {
      "unifiedSession": true
    }
  }
}
```

When enabled, all incoming messages — regardless of which channel they arrive on — are routed into a single shared session. Switching from Feishu to WebUI (or any other channel) continues the same conversation seamlessly.

| Behavior | `false` (default) | `true` |
|----------|-------------------|--------|
| Session key | `channel:chat_id` | `unified:default` |
| Cross-channel continuity | No | Yes |
| `/new` clears | Current channel session | Shared session |
| `/stop` finds tasks | By channel session | By shared session |
| Existing `session_key_override` (e.g. Telegram thread) | Respected | Still respected — not overwritten |

> This is designed for single-user, multi-device setups. It is **off by default** — existing users see zero behavior change.

## Disabled Skills

neonanobot ships with built-in skills, and your workspace can also define custom skills under `skills/`. If you want to hide specific skills from the agent, set `agents.defaults.disabledSkills` to a list of skill directory names:

```json
{
  "agents": {
    "defaults": {
      "disabledSkills": ["github", "weather"]
    }
  }
}
```

Disabled skills are excluded from the main agent's skill summary, from always-on skill injection, and from subagent skill summaries. This is useful when some bundled skills are unnecessary for your deployment or should not be exposed to end users.

| Option | Default | Description |
|--------|---------|-------------|
| `agents.defaults.disabledSkills` | `[]` | List of skill directory names to exclude from loading. Applies to both built-in skills and workspace skills. |

## Tool Hint Max Length

Tool hints are the short progress messages shown when the agent calls tools (e.g. `$ cd …/project && npm test`). By default, these are truncated at 40 characters, which can make long commands hard to read.

Set `agents.defaults.toolHintMaxLength` to control the truncation threshold:

```json
{
  "agents": {
    "defaults": {
      "toolHintMaxLength": 120
    }
  }
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `agents.defaults.toolHintMaxLength` | `40` | Maximum characters for tool hint display. Range: 20–500. Higher values show more of the command or path; lower values keep hints compact. |
