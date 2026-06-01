## 简化版 nanobot
Based on project: https://github.com/HKUDS/nanobot 

🧑‍🌾 **neonanobot** is an open-source, ultra-lightweight agent runtime for people who want to own their AI agent stack. It gives you a small, readable core plus the practical pieces for real long-running agents: WebUI, chat channels, tools, memory, MCP, model routing, and deployment.


## 💡 Why neonanobot

- **Persistent workflows**: goals, memory, tools, and chat context survive long-running work.
- **Chat-native reach**: WebUI, API, Feishu.
- **Model freedom**: OpenAI-compatible APIs, local LLMs, image generation, search, and fallbacks.
- **Small core**: readable internals with MCP, memory, deployment, and automation built in.
- **Own your stack**: inspect, customize, self-host, and extend without a giant platform.

## 📦 Install

> [!IMPORTANT]
> If you want the newest features and experiments, install from source. 
> 
> If you want the most stable day-to-day experience, install from PyPI or with `uv`.

**Install from source**

```bash
git clone https://github.com/neohope/neonanobot.git
cd neonanobot
pip install -e .
```

**Install with `uv`**

```bash
uv tool install neonanobot-ai
```

**Install from PyPI**

```bash
pip install neonanobot-ai
```

## 🚀 Quick Start

**1. Initialize**

```bash
neonanobot onboard
```

**2. Configure** (`~/.neonanobot/config.json`)

Configure these **two parts** in your config (other options have defaults). Add or merge the following blocks into your existing config instead of replacing the whole file.

*Set your API key* (e.g. [OpenRouter](https://openrouter.ai/keys), recommended for global users):

```json
{
  "providers": {
    "openrouter": {
      "apiKey": "sk-or-v1-xxx"
    }
  }
}
```

*Set your model* (optionally pin a provider — defaults to auto-detection):

```json
{
  "agents": {
    "defaults": {
      "provider": "openrouter",
      "model": "anthropic/claude-opus-4-6"
    }
  }
}
```

**3. Chat**

```bash
neonanobot agent
```


- Want different LLM providers, web search, MCP, security settings, or more config options? See [Configuration](./docs/configuration.md)
- Want to run locally? Use [Atomic Chat](./docs/configuration.md#atomic-chat-local), [vLLM](./docs/configuration.md#vllm-local-openai-compatible), [Ollama](./docs/configuration.md#ollama-local), and [others](./docs/configuration.md#local-providers).
- Want to run neonanobot in chat apps like Feishu? See [Chat Apps](./docs/chat-apps.md)
- Want Docker or Linux service deployment? See [Deployment](./docs/deployment.md)

## 🌐 WebUI

The WebUI ships **inside the published wheel** — no extra build step. Just enable the WebSocket channel and open it in your browser.

<p align="center">
  <img src="images/nanobot_webui.png" alt="neonanobot webui preview" width="900">
</p>

**1. Enable the WebSocket channel in `~/.neonanobot/config.json`**

```json
{ "channels": { "websocket": { "enabled": true } } }
```

**2. Start the gateway**

```bash
neonanobot gateway
```

**3. Open the WebUI**

Visit [`http://127.0.0.1:4321`](http://127.0.0.1:4321) in your browser. To open it from another device on your LAN, see [WebUI docs → LAN access](./webui/README.md#access-from-another-device-lan).

> [!TIP]
> Working on the WebUI itself? Check out [`webui/README.md`](./webui/README.md) for the Vite dev server (HMR) workflow.

## 🏗️ Architecture

<p align="center">
  <img src="images/nanobot_arch.png" alt="neonanobot architecture" width="800">
</p>

🧑‍🌾 neonanobot stays lightweight by centering everything around a small agent loop: messages come in from chat apps, the LLM decides when tools are needed, and memory or skills are pulled in only as context instead of becoming a heavy orchestration layer. That keeps the core path readable and easy to extend, while still letting you add channels, tools, memory, and deployment options without turning the system into a monolith.

## 📚 Docs

Browse the [repo docs](./docs/README.md) for the latest features and GitHub development version, or visit [neonanobot.wiki](https://neonanobot.wiki/docs/latest/getting-started/neonanobot-overview) for the stable release documentation.

- Talk to your neonanobot with familiar chat apps: [Chat Apps](./docs/chat-apps.md)
- Configure providers, web search, MCP, and runtime behavior: [Configuration](./docs/configuration.md)
- Integrate neonanobot with local tools and automations: [OpenAI-Compatible API](./docs/openai-api.md) · [Python SDK](./docs/python-sdk.md)
- Run neonanobot with Docker or as a Linux service: [Deployment](./docs/deployment.md)

## 🤝 Contribute & Roadmap

PRs welcome! The codebase is intentionally small and readable. 🤗

### Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases — bug fixes and minor improvements |
| `nightly` | Experimental features — new features and breaking changes |

**Unsure which branch to target?** See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

**Roadmap** — Pick an item and [open a PR](https://github.com/neohope/neonanobot/pulls)!

- **Multi-modal** — See and hear (images, voice, video)
- **Long-term memory** — Never forget important context
- **Better reasoning** — Multi-step planning and reflection
- **More integrations** — Calendar and more
- **Self-improvement** — Learn from feedback and mistakes
