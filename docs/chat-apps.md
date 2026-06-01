# Chat Apps

Connect neonanobot to your favorite chat platform. Want to build your own? See the [Channel Plugin Guide](./channel-plugin-guide.md).

| Channel | What you need |
|---------|---------------|
| **Feishu** | App ID + App Secret |

<details>
<summary><b>Feishu</b></summary>

Uses **WebSocket** long connection — no public IP required.

**1. Create a Feishu bot**
- Visit [Feishu Open Platform](https://open.feishu.cn/app)
- Create a new app → Enable **Bot** capability
- **Permissions**:
  - `im:message` (send messages) and `im:message.p2p_msg:readonly` (receive messages)
  - **Streaming replies** (default in neonanobot): add **`cardkit:card:write`** (often labeled **Create and update cards** in the Feishu developer console). Required for CardKit entities and streamed assistant text. Older apps may not have it yet — open **Permission management**, enable the scope, then **publish** a new app version if the console requires it.
  - If you **cannot** add `cardkit:card:write`, set `"streaming": false` under `channels.feishu` (see below). The bot still works; replies use normal interactive cards without token-by-token streaming.
- **Events**: Add `im.message.receive_v1` (receive messages)
  - Select **Long Connection** mode (requires running neonanobot first to establish connection)
- Get **App ID** and **App Secret** from "Credentials & Basic Info"
- Publish the app

**2. Configure**

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_xxx",
      "appSecret": "xxx",
      "encryptKey": "",
      "verificationToken": "",
      "allowFrom": ["ou_YOUR_OPEN_ID"],
      "groupPolicy": "mention",
      "reactEmoji": "OnIt",
      "doneEmoji": "DONE",
      "toolHintPrefix": "🔧",
      "streaming": true,
      "domain": "feishu"
    }
  }
}
```

> `streaming` defaults to `true`. Use `false` if your app does not have **`cardkit:card:write`** (see permissions above).
> `encryptKey` and `verificationToken` are optional for Long Connection mode.
> `allowFrom`: Add your open_id (find it in neonanobot logs when you message the bot). Use `["*"]` to allow all users.
> `groupPolicy`: `"mention"` (default — respond only when @mentioned), `"open"` (respond to all group messages). Private chats always respond.
> `reactEmoji`: Emoji for "processing" status (default: `OnIt`). See [available emojis](https://open.larkoffice.com/document/server-docs/im-v1/message-reaction/emojis-introduce).
> `doneEmoji`: Optional emoji for "completed" status (e.g., `DONE`, `OK`, `HEART`). When set, bot adds this reaction after removing `reactEmoji`.
> `toolHintPrefix`: Prefix for inline tool hints in streaming cards (default: `🔧`).
> `domain`: `"feishu"` (default) for China (open.feishu.cn), `"lark"` for international Lark (open.larksuite.com).

**3. Run**

```bash
neonanobot gateway
```

> [!TIP]
> Feishu uses WebSocket to receive messages — no webhook or public IP needed!

</details>
