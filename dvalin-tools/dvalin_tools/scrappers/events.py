"""
From https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids=2&last_id=0&page_size=4&type=3
https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids={GAMEID}&last_id={OFFSET}&page_size={SIZE}&type={MSG_TYPE}
Events are returned as JSON.
"""

import asyncio
from datetime import datetime
from pathlib import Path

import httpx

from dvalin_tools.lib.constants import DATA_DIR
from dvalin_tools.lib.languages import LANGUAGE_CODE_TO_DIR, LanguageCode
from dvalin_tools.lib.tags import get_tags_from_subject
from dvalin_tools.models.common import Game
from dvalin_tools.models.events import EventFile, EventI18N, MessageType


async def get_events(
    game_id: Game,
    message_type: MessageType,
    *,
    offset: int = 0,
    size: int = 15,
    client: httpx.AsyncClient,
) -> tuple[bool, int, list[EventI18N]]:
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
        try:
            subject_i18n = event["post"]["multi_language_info"]["lang_subject"]
        except (TypeError, KeyError):
            subject_i18n = {
                LanguageCode.ENGLISH: event["post"]["subject"],
            }
        events.append(
            EventI18N(
                post_id=event["post"]["post_id"],
                game_id=Game(event["post"]["game_id"]),
                message_type=MessageType(message_type),
                subject_i18n={
                    LanguageCode(code): text for code, text in subject_i18n.items()
                },
                created_at=datetime.fromtimestamp(event["post"]["created_at"]),
                tags=get_tags_from_subject(event["post"]["subject"]),
            )
        )
    return is_last, last_id, events


async def get_all_events(
    game_id: Game, message_type: MessageType, *, batch_size: int = 15, limit: int = 25
) -> list[EventI18N]:
    """Get all events from the API, with a limit of ``limit`` events."""
    async with httpx.AsyncClient() as client:
        events = []
        last_id = 0
        while True:
            this_batch_size = min(batch_size, limit - len(events))
            print(f"Getting events from {last_id} to {last_id + this_batch_size}")
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


def write_events(events: list[EventI18N], data_dir: Path) -> None:
    """Write events."""
    for event in events:
        for lang in event.subject_i18n.keys():
            target_file = (
                data_dir
                / LANGUAGE_CODE_TO_DIR[lang]
                / "Event"
                / f"{event.created_at:%Y-%m}.json"
            )
            target_file.parent.mkdir(parents=True, exist_ok=True)

            existing_events = EventFile([])
            if target_file.exists():
                contents = target_file.read_text(encoding="utf-8")
                if contents.strip():
                    existing_events = EventFile.model_validate_json(contents)

            # If it's already in there, we want to update it (the schema could have changed).
            localized_event = event.localize(lang)
            if localized_event in existing_events.root:
                existing_events.root.remove(localized_event)
                existing_events.root.add(localized_event)

            with target_file.open("w", encoding="utf-8") as f:
                f.write(existing_events.model_dump_json(indent=2))


async def main():
    events = await get_all_events(Game.GENSHIN_IMPACT, MessageType.INFO, limit=80)

    write_events(events, DATA_DIR)
    print(f"Found {len(events)} events.")
    untagged = [event for event in events if not event.tags]
    for i, event in enumerate(events):
        print(f"{i}.{event.tags} - {event.subject} ({event.article_url})")

    print(f"Found {len(untagged)} untagged events.")
    for i, event in enumerate(untagged):
        print(f"{i}. {event.subject} ({event.article_url})")

    print(events[0])
    print(events[0].model_dump_json(indent=2))
    print(events[0].localize(LanguageCode.ENGLISH).model_dump_json(indent=2))
    print(events[0].localize(LanguageCode.KOREAN).model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())
