"""
From https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids=2&last_id=0&page_size=4&type=3
https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids={GAMEID}&last_id={OFFSET}&page_size={SIZE}&type={MSG_TYPE}
Events are returned as JSON.
"""

import asyncio
from asyncio import TaskGroup
from datetime import datetime
from pathlib import Path

import httpx
from aiofiles import open as async_open
from tqdm.asyncio import tqdm_asyncio

from dvalin_tools.lib.constants import DATA_DIR
from dvalin_tools.lib.languages import LANGUAGE_CODE_TO_DIR, LanguageCode
from dvalin_tools.lib.tags import get_tags_from_subject
from dvalin_tools.models.common import Game
from dvalin_tools.models.events import EventFile, EventI18N, EventLocalized, MessageType


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
                / f"{event.created_at:%Y}"
                / f"{event.created_at:%m}"
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


def reparse_event_files(data_dir: Path) -> None:
    """Reparse event files.

    This parses all event files, and writes them back to disk.
    This is useful if the schema has changed (migration, correction, etc.).
    """
    for event_file in data_dir.glob("**/Event/**/*.json"):
        print(event_file)
        contents = event_file.read_text(encoding="utf-8")
        if contents.strip():
            existing_events = EventFile.model_validate_json(contents)
            with event_file.open("w", encoding="utf-8") as f:
                f.write(existing_events.model_dump_json(indent=2))


async def update_event_details(
    event: EventLocalized, *, client: httpx.AsyncClient
) -> None:
    """Update the details of an event."""
    url = "https://bbs-api-os.hoyolab.com/community/post/wapi/getPostFull"
    resp = await client.get(
        url,
        params={"post_id": event.post_id},
        headers={"X-Rpc-Language": event.language.value},
    )
    resp_json = resp.json()
    event.content = resp_json["data"]["post"]["post"]["content"]


async def update_event_file_with_details(
    event_file: EventFile, *, force: bool = False
) -> None:
    """Update an event file with details."""
    async with httpx.AsyncClient() as client:
        async with TaskGroup() as g:
            for event in event_file:
                if event.content and not force:
                    continue
                await g.create_task(update_event_details(event, client=client))


async def update_json_file_with_details(
    json_file: Path, *, force: bool = False
) -> None:
    """Update a JSON file with details."""
    async with async_open(json_file, encoding="utf-8") as f:
        event_file = EventFile.model_validate_json(await f.read())
        await update_event_file_with_details(event_file, force=force)

    async with async_open(json_file, "w", encoding="utf-8") as f:
        await f.write(event_file.model_dump_json(indent=2))
    print(f"{json_file} done.")


async def update_all_event_files_with_details(
    data_dir: Path, *, force: bool = False
) -> None:
    """Update all event files with details."""
    tasks = []
    for json_file in data_dir.glob("**/Event/**/*.json"):
        tasks.append(update_json_file_with_details(json_file, force=force))

    await tqdm_asyncio.gather(*tasks)


async def main():
    # events = await get_all_events(Game.GENSHIN_IMPACT, MessageType.INFO, limit=99999)
    # write_events(events, DATA_DIR)

    # reparse_event_files(DATA_DIR)
    await update_all_event_files_with_details(DATA_DIR)


if __name__ == "__main__":
    asyncio.run(main())
