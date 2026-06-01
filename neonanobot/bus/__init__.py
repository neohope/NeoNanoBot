"""Message bus module for decoupled channel-agent communication."""

from neonanobot.bus.events import InboundMessage, OutboundMessage
from neonanobot.bus.queue import MessageBus

__all__ = ["MessageBus", "InboundMessage", "OutboundMessage"]
