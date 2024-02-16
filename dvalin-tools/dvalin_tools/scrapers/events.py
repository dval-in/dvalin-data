"""
From https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids=2&last_id=0&page_size=4&type=3
https://bbs-api-os.hoyolab.com/community/post/wapi/getNewsList?gids={GAMEID}&last_id={OFFSET}&page_size={SIZE}&type={MSG_TYPE}
Events are returned as JSON.
"""

import asyncio
import json
from argparse import Action, ArgumentParser, Namespace
from asyncio import TaskGroup
from datetime import datetime
from enum import Flag, auto
from html import escape
from itertools import count
from pathlib import Path, PurePath
from typing import Any, Iterable, Sequence

import httpx
import tqdm
from aiofiles import open as async_open
from bs4 import BeautifulSoup
from httpx import URL
from tenacity import retry, retry_if_result, stop_after_attempt, wait_fixed
from tqdm.asyncio import tqdm_asyncio
from typing_extensions import override

from dvalin_tools.lib.common import batched
from dvalin_tools.lib.constants import DATA_DIR, ROOT_DIR_DVALIN_DATA
from dvalin_tools.lib.languages import LANGUAGE_CODE_TO_DIR, LanguageCode
from dvalin_tools.lib.s3 import S3Client
from dvalin_tools.lib.settings import DvalinSettings
from dvalin_tools.lib.typescript import EnumMode, to_typescript
from dvalin_tools.models.common import Game
from dvalin_tools.models.events import EventFile, EventI18N, EventLocalized, MessageType
from dvalin_tools.models.network import Link, LinkType, RedirectLinkChain
from dvalin_tools.models.tags import Tag, get_tags_from_subject


class UpdateMode(Flag):
    DETAILS_DL = auto()
    LINKS = auto()
    IMAGES_SAVE_TO_S3 = auto()
    RESOLVE_URLS = auto()
    ALL = DETAILS_DL | LINKS | IMAGES_SAVE_TO_S3


class UpdateModeArgParseAction(Action):
    @override
    def __call__(
        self,
        parser: ArgumentParser,
        namespace: Namespace,
        values: str | Sequence[Any] | None,
        option_string: str | None = None,
    ) -> None:
        if not values:
            raise ValueError(f"At least one value of {self.dest} is required.")
        for value in values:
            if not issubclass(UpdateMode, type(value)):
                value = UpdateMode[value.upper()]
            if getattr(namespace, self.dest) is None:
                setattr(namespace, self.dest, value)
            else:
                setattr(namespace, self.dest, getattr(namespace, self.dest) | value)


async def get_events(
    game_id: Game,
    message_type: MessageType,
    *,
    offset: int = 0,
    size: int = 15,
    stop_at_post_id: int = 0,
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
        if stop_at_post_id and int(event["post"]["post_id"]) == stop_at_post_id:
            return True, last_id, events
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
    game_id: Game,
    message_type: MessageType,
    *,
    batch_size: int = 15,
    limit: int = 25,
    stop_at_post_id: int = 0,
) -> list[EventI18N]:
    """Get all events from the API, with a limit of ``limit`` events."""
    events = []
    last_id = 0
    async with httpx.AsyncClient() as client:
        while True:
            this_batch_size = min(batch_size, limit - len(events))
            print(f"Getting events from {last_id} to {last_id + this_batch_size}")
            is_last, last_id, new_events = await get_events(
                game_id=game_id,
                message_type=message_type,
                offset=last_id,
                size=this_batch_size,
                stop_at_post_id=stop_at_post_id,
                client=client,
            )
            events += new_events
            if is_last or len(events) >= limit:
                break
    return events


def write_events(events: list[EventI18N], data_dir: Path) -> list[Path]:
    """Write events."""
    modified_event_files: list[Path] = []
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

            existing_events.dump_json_to_file(target_file)
            modified_event_files.append(target_file)

    return modified_event_files


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
            # for event in existing_events:
            #     # update_event_links_index(event)
            #     event.fix_malformed_links()
            existing_events.dump_json_to_file(event_file)


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
    event.content_original = resp_json["data"]["post"]["post"]["content"]


async def update_event_links(event: EventLocalized, *, resolve_urls: bool) -> None:
    """Update the links of an event."""
    soup = BeautifulSoup(event.content_original, "html.parser")
    links = {
        link
        for node in soup.find_all("a")
        if not (link := node.get("href")).startswith("mailto:")
    }
    image_links = {node.get("src") for node in soup.select("img[src^=http]")}
    new_links = {link: Link(url_original=link) for link in links} | {
        link: Link(url_original=link, link_type=LinkType.IMAGE) for link in image_links
    }

    # There are properties that we want to carry over, if they were already present.
    for old_link in event.links:
        if old_link.url_original in new_links:
            new_links[old_link.url_original].url_s3 = old_link.url_s3

    event.links = set(new_links.values())

    update_event_links_index(event)
    event.fix_malformed_links()

    if resolve_urls:
        async with asyncio.TaskGroup() as g:
            for link in event.links:
                g.create_task(link.resolve())


def update_event_links_index(event: EventLocalized) -> None:
    """Update the index of the links of an event.

    This keeps the order of the links in the content.
    """
    c = count(0)
    links_with_their_position = []
    for link in event.links:
        if link.url_original_resolved.is_empty():
            links_with_their_position.append(
                (event.content_original.find(escape(link.url_original)), link)
            )
        else:
            links_with_their_position.append(
                (
                    event.content_original.find(
                        escape(link.url_original_resolved.initial)
                    ),
                    link,
                )
            )
            link.url_original = link.url_original_resolved.initial

    links_with_their_position.sort(key=lambda x: x[0])
    for _, link in links_with_their_position:
        link.index = next(c)


async def download_event_images(
    event: EventLocalized,
    *,
    force: bool = False,
    client: httpx.AsyncClient,
    s3_client: S3Client | None = None,
) -> None:
    """Download the images of an event."""
    all_tasks = []
    modified_links = []
    async with asyncio.TaskGroup() as g:
        for link in event.links:
            if link.link_type is LinkType.IMAGE:
                # Skip if we already have the S3 link, unless we force it.
                if link.url_s3 and not force:
                    continue
                modified_links.append(link)
                try:
                    parsed_url = URL(link.url)
                    filename = PurePath(parsed_url.path).name
                except ValueError:
                    raise ValueError(f"Invalid URL: {link.url}")
                s3_full_path = f"event/{event.language.value}/{event.created_at:%Y}/{event.created_at:%m}/{filename}"
                all_tasks.append(
                    g.create_task(
                        async_upload_from_remote(
                            parsed_url, s3_full_path, client=client, s3_client=s3_client
                        )
                    )
                )

    for task, link in zip(all_tasks, modified_links):
        url: URL = task.result()
        if url is not None:
            link.url_s3 = str(url)

    event.content = event.get_modified_content()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_fixed(2),
    retry=retry_if_result(lambda x: x is None),
    retry_error_callback=lambda x: print(
        f"Failed to download {x.args[0]} after {x.attempt_number} attempts."
    ),
)
async def async_upload_from_remote(
    remote_url: URL,
    s3_full_path: str,
    *,
    client: httpx.AsyncClient,
    s3_client: S3Client,
) -> URL | None:
    try:
        url = await s3_client.async_upload_from_remote(
            remote_url, s3_full_path, client=client
        )
        print(f"Saved {remote_url} to {url}")
    except Exception as error:
        print(f"Error saving {remote_url}: {error}")
        return None

    return url


async def update_event_file(
    event_file: EventFile,
    *,
    force: bool = False,
    mode: UpdateMode = UpdateMode.ALL,
    s3_client: S3Client,
) -> None:
    """Update an event file with details."""
    async with httpx.AsyncClient() as client:
        if mode & UpdateMode.DETAILS_DL:
            async with TaskGroup() as g:
                for event in event_file:
                    if event.content_original and not force:
                        continue
                    g.create_task(update_event_details(event, client=client))

        if mode & UpdateMode.LINKS:
            for event in event_file:
                all_links_resolved = all(link.is_resolved for link in event.links)
                if not all_links_resolved or force:
                    await update_event_links(
                        event, resolve_urls=bool(mode & UpdateMode.RESOLVE_URLS)
                    )

        if mode & UpdateMode.IMAGES_SAVE_TO_S3:
            async with TaskGroup() as g:
                for event in event_file:
                    any_image_missing_s3 = any(
                        link.link_type is LinkType.IMAGE and not link.url_s3
                        for link in event.links
                    )
                    if any_image_missing_s3 or force:
                        g.create_task(
                            download_event_images(
                                event, force=force, client=client, s3_client=s3_client
                            )
                        )


async def update_json_file(
    json_file: Path,
    *,
    force: bool = False,
    mode: UpdateMode = UpdateMode.ALL,
    s3_client: S3Client,
) -> None:
    """Update a JSON file with details."""
    async with async_open(json_file, encoding="utf-8") as f:
        event_file = EventFile.model_validate_json(await f.read())
        await update_event_file(event_file, force=force, mode=mode, s3_client=s3_client)

    event_file.dump_json_to_file(json_file)
    print(f"{json_file} done.")


async def update_all_event_files(
    data_dir: Path, *, force: bool = False, mode: UpdateMode = UpdateMode.ALL
) -> None:
    """Update all event files."""
    await update_event_files(
        data_dir.glob("**/Event/**/*.json"), force=force, mode=mode
    )


async def update_event_files(
    event_files: Iterable[Path],
    *,
    force: bool = False,
    mode: UpdateMode = UpdateMode.ALL,
) -> None:
    """Update the given event files."""
    batch_size = 5
    s3_client = S3Client(settings=DvalinSettings())
    for batch in tqdm.tqdm(batched(event_files, n=batch_size), desc="Batches"):
        tasks = []
        for json_file in batch:
            tasks.append(
                update_json_file(json_file, force=force, mode=mode, s3_client=s3_client)
            )

        await tqdm_asyncio.gather(*tasks)


def generate_json_schema(output: Path) -> None:
    """Generate JSON schema for events."""
    schema = EventFile.model_json_schema(by_alias=True, mode="serialization")
    output.write_text(json.dumps(schema, indent=2) + "\n", encoding="utf-8")


def generate_typescript_type(output: Path) -> None:
    """Generate TypeScript type for events."""
    with output.open("w", encoding="utf-8", newline="\n") as f:
        f.write("\n")
        f.write(
            to_typescript(Game, enum_mode=EnumMode.PRESERVE_VALUE, name="_ExtAPIGame")
        )
        f.write("\n\n")
        f.write(to_typescript(Game, public=True, enum_mode=EnumMode.SET_VALUE_FROM_KEY))
        f.write("\n\n")
        f.write(
            to_typescript(
                MessageType,
                enum_mode=EnumMode.PRESERVE_VALUE,
                name="_ExtAPIMessageType",
            )
        )
        f.write("\n\n")
        f.write(
            to_typescript(
                MessageType, public=True, enum_mode=EnumMode.SET_VALUE_FROM_KEY
            )
        )
        f.write("\n\n")
        f.write(to_typescript(Tag, public=True, enum_mode=EnumMode.SET_VALUE_FROM_KEY))
        f.write("\n\n")
        f.write(to_typescript(LanguageCode, public=True))
        f.write("\n\n")
        f.write(to_typescript(RedirectLinkChain))
        f.write("\n\n")
        f.write(
            to_typescript(LinkType, public=True, enum_mode=EnumMode.SET_VALUE_FROM_KEY)
        )
        f.write("\n\n")
        f.write(to_typescript(Link, public=True))
        f.write("\n\n")
        f.write(to_typescript(EventLocalized, public=True))
        f.write("\n\n")
        f.write(to_typescript(EventFile, public=True))
        f.write("\n")


def get_arg_parser() -> ArgumentParser:
    parser = ArgumentParser(description="Run scraper for Genhin Impact events.")
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    get_parser = subparsers.add_parser("get", help="Get events.")

    get_parser.add_argument(
        "-l",
        "--limit",
        type=int,
        default=25,
        help="Limit of events to get.",
    )

    subparsers.add_parser("reparse", help="Reparse event files.")

    update_parser = subparsers.add_parser(
        "update",
        help="Update event files.",
        usage="\r\n".join(
            [
                "The different modes do the following:",
                "- DETAILS_DL: Download the details of the events.",
                "- LINKS: Update the links of the events. It will attempt to resolve all the URLs mentioned in the content.",
                "- RESOLVE_URLS: Resolve the URLs of the links of the events.",
                "- IMAGES_SAVE_TO_S3: Download the images of the events and save them to S3.",
            ]
        ),
    )

    update_parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Force update, even if the data is already present.",
    )
    update_parser.add_argument(
        "-m",
        "--mode",
        type=lambda x: UpdateMode[x.upper()],
        action=UpdateModeArgParseAction,
        nargs="+",
        required=True,
        help=f"Update mode. Possible values: {', '.join(UpdateMode.__members__)}.",
    )

    schema_parser = subparsers.add_parser(
        "schema", help="Generate JSON schema for events."
    )

    schema_parser.add_argument(
        "-s",
        "--output-schema",
        type=Path,
        default=ROOT_DIR_DVALIN_DATA / "schemas" / "Events.json",
        help="Output schema file.",
    )

    schema_parser.add_argument(
        "-t",
        "--output-typescript",
        type=Path,
        default=ROOT_DIR_DVALIN_DATA / "types" / "Events.ts",
        help="Output TypeScript file.",
    )

    return parser


async def async_main(namespace: Namespace):
    if namespace.subcommand == "get":
        events = await get_all_events(
            Game.GENSHIN_IMPACT, MessageType.INFO, limit=namespace.limit
        )
        write_events(events, DATA_DIR)
    elif namespace.subcommand == "reparse":
        reparse_event_files(DATA_DIR)
    elif namespace.subcommand == "update":
        await update_all_event_files(
            DATA_DIR, force=namespace.force, mode=namespace.mode
        )
    elif namespace.subcommand == "schema":
        # generate_json_schema(namespace.output_schema)
        generate_typescript_type(namespace.output_typescript)


def main():
    parser = get_arg_parser()
    args = parser.parse_args()
    asyncio.run(async_main(args))


if __name__ == "__main__":
    main()
