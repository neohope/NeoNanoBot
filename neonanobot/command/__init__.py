"""Slash command routing and built-in handlers."""

from neonanobot.command.builtin import register_builtin_commands
from neonanobot.command.router import CommandContext, CommandRouter

__all__ = ["CommandContext", "CommandRouter", "register_builtin_commands"]
