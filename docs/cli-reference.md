# CLI Reference

| Command | Description |
|---------|-------------|
| `neonanobot onboard` | Initialize config & workspace at `~/.neonanobot/` |
| `neonanobot onboard --wizard` | Launch the interactive onboarding wizard |
| `neonanobot onboard -c <config> -w <workspace>` | Initialize or refresh a specific instance config and workspace |
| `neonanobot agent -m "..."` | Chat with the agent |
| `neonanobot agent -w <workspace>` | Chat against a specific workspace |
| `neonanobot agent -w <workspace> -c <config>` | Chat against a specific workspace/config |
| `neonanobot agent` | Interactive chat mode |
| `neonanobot agent --no-markdown` | Show plain-text replies |
| `neonanobot agent --logs` | Show runtime logs during chat |
| `neonanobot gateway` | Start the gateway |
| `neonanobot status` | Show status |
| `neonanobot channels login <channel>` | Authenticate a channel interactively |
| `neonanobot channels status` | Show channel status |

Interactive mode exits: `exit`, `quit`, `/exit`, `/quit`, `:q`, or `Ctrl+D`.
