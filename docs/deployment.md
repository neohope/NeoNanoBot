# Deployment

## Linux Service

Run the gateway as a systemd user service so it starts automatically and restarts on failure.

**1. Find the neonanobot binary path:**

```bash
which neonanobot   # e.g. /home/user/.local/bin/neonanobot
```

**2. Create the service file** at `~/.config/systemd/user/neonanobot-gateway.service` (replace `ExecStart` path if needed):

```ini
[Unit]
Description=neonanobot Gateway
After=network.target

[Service]
Type=simple
ExecStart=%h/.local/bin/neonanobot gateway
Restart=always
RestartSec=10
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=%h

[Install]
WantedBy=default.target
```

**3. Enable and start:**

```bash
systemctl --user daemon-reload
systemctl --user enable --now neonanobot-gateway
```

**Common operations:**

```bash
systemctl --user status neonanobot-gateway        # check status
systemctl --user restart neonanobot-gateway       # restart after config changes
journalctl --user -u neonanobot-gateway -f        # follow logs
```

If you edit the `.service` file itself, run `systemctl --user daemon-reload` before restarting.

> **Note:** User services only run while you are logged in. To keep the gateway running after logout, enable lingering:
>
> ```bash
> loginctl enable-linger $USER
> ```

## macOS LaunchAgent

Use a LaunchAgent when you want `neonanobot gateway` to stay online after you log in, without keeping a terminal open.

**1. Get the absolute `neonanobot` path:**

```bash
which neonanobot   # e.g. /Users/youruser/.local/bin/neonanobot
```

Use that exact path in the plist. It keeps the Python environment from your install method.

**2. Create `~/Library/LaunchAgents/ai.neonanobot.gateway.plist`:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>ai.neonanobot.gateway</string>

  <key>ProgramArguments</key>
  <array>
    <string>/Users/youruser/.local/bin/neonanobot</string>
    <string>gateway</string>
    <string>--workspace</string>
    <string>/Users/youruser/.neonanobot/workspace</string>
  </array>

  <key>WorkingDirectory</key>
  <string>/Users/youruser/.neonanobot/workspace</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>

  <key>StandardOutPath</key>
  <string>/Users/youruser/.neonanobot/logs/gateway.log</string>

  <key>StandardErrorPath</key>
  <string>/Users/youruser/.neonanobot/logs/gateway.error.log</string>
</dict>
</plist>
```

**3. Load and start it:**

```bash
mkdir -p ~/Library/LaunchAgents ~/.neonanobot/logs
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.neonanobot.gateway.plist
launchctl enable gui/$(id -u)/ai.neonanobot.gateway
launchctl kickstart -k gui/$(id -u)/ai.neonanobot.gateway
```

**Common operations:**

```bash
launchctl list | grep ai.neonanobot.gateway
launchctl kickstart -k gui/$(id -u)/ai.neonanobot.gateway   # restart
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.neonanobot.gateway.plist
```

After editing the plist, run `launchctl bootout ...` and `launchctl bootstrap ...` again.

> **Note:** if startup fails with "address already in use", stop the manually started `neonanobot gateway` process first.
