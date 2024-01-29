"""
From https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids=2&last_id=0&page_size=4&type=3
https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids={GAMEID}&last_id={OFFSET}&page_size={SIZE}&type={MSG_TYPE}
Events are returned as JSON.
"""

import asyncio
import re
from datetime import datetime
from enum import Enum

import httpx
from pydantic import BaseModel, Field

from dvalin_tools.lib.tags import Tags, get_tags_from_subject

REPLACE_SPACES = re.compile(r"\s+")


class Game(Enum):
    HONKAI_IMPACT_3RD = 1
    GENSHIN_IMPACT = 2
    # No 3
    TEARS_OF_THEMIS = 4
    HOYOLAB = 5
    HONKAI_STAR_RAIL = 6
    # No 7
    ZENLESS_ZONE_ZERO = 8


class MessageType(Enum):
    NOTICES = 1
    EVENT = 2  # Can be used, but MHY uses a different API for this one.
    INFO = 3


class Event(BaseModel):
    post_id: str
    game_id: Game
    message_type: MessageType
    subject: str
    lang_subject: dict[str, str]
    created_at: datetime
    tags: set[Tags] = Field(default_factory=set)

    @property
    def article_url(self) -> str:
        return f"https://www.hoyolab.com/article/{self.post_id}"


async def get_events(
    game_id: Game,
    message_type: MessageType,
    *,
    offset: int = 0,
    size: int = 15,
    client: httpx.AsyncClient,
) -> tuple[bool, int, list[Event]]:
    """Get a list of events from the API."""
    resp = await client.get(
        "https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList",
        params={
            "gids": game_id.value,
            "last_id": offset,
            "page_size": size,
            "type": message_type.value,
        },
    )
    resp.raise_for_status()
    data = resp.json()
    events = []
    is_last = data["data"]["is_last"]
    last_id = data["data"]["last_id"]
    for event in data["data"]["list"]:
        events.append(
            Event(
                post_id=event["post"]["post_id"],
                game_id=Game(event["post"]["game_id"]),
                message_type=MessageType(message_type),
                subject=event["post"]["subject"],
                lang_subject=event["post"]["multi_language_info"]["lang_subject"],
                created_at=datetime.fromtimestamp(event["post"]["created_at"]),
                tags=get_tags_from_subject(event["post"]["subject"]),
            )
        )
    return is_last, last_id, events


async def get_all_events(
    game_id: Game, message_type: MessageType, *, batch_size: int = 15, limit: int = 25
) -> list[Event]:
    """Get all events from the API, with a limit of ``limit`` events."""
    async with httpx.AsyncClient() as client:
        events = []
        last_id = 0
        while True:
            this_batch_size = min(batch_size, limit - len(events))
            is_last, last_id, new_events = await get_events(
                game_id=game_id,
                message_type=message_type,
                offset=last_id,
                size=this_batch_size,
                client=client,
            )
            events += new_events
            if is_last or len(events) >= limit:
                break
    return events


async def main():
    events = await get_all_events(Game.GENSHIN_IMPACT, MessageType.INFO, limit=80)
    print(f"Found {len(events)} events.")
    untagged = [event for event in events if not event.tags]
    for i, event in enumerate(events):
        print(f"{i}.{event.tags} - {event.subject} ({event.article_url})")

    print(f"Found {len(untagged)} untagged events.")
    for i, event in enumerate(untagged):
        print(f"{i}. {event.subject} ({event.article_url})")


if __name__ == "__main__":
    asyncio.run(main())
