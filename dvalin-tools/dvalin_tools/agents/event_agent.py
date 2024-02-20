import asyncio
from pathlib import Path

from celery import Celery, chain
from celery.schedules import crontab

from dvalin_tools.lib.fs_lock import fs_lock
from dvalin_tools.lib.languages import LANGUAGE_CODE_TO_DIR, LanguageCode
from dvalin_tools.lib.repository import loop_end_with_changes, loop_start, prog_init
from dvalin_tools.lib.settings import DvalinSettings
from dvalin_tools.models.common import Game
from dvalin_tools.models.events import EventFile, MessageType
from dvalin_tools.scrapers.events import (
    get_all_events,
    update_event_files,
    write_events,
)

settings = DvalinSettings()

app = Celery(
    "event_agent",
    broker=settings.celery.broker_url,
    backend=settings.celery.result_backend,
)
app.conf.broker_connection_retry_on_startup = True


@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs) -> None:
    prog_init(settings.repo_root_dir)
    sender.add_periodic_task(crontab(minute="*/1"), event_flow.s())


def get_latest_event_file(data_dir: Path) -> Path:
    event_dir_en = data_dir / LANGUAGE_CODE_TO_DIR[LanguageCode.ENGLISH] / "Event"
    # This dir contains YYYY/MM/YYYY-MM.json files
    # We want the latest one (so, we sort)
    return sorted(event_dir_en.glob("*/*/*.json"))[-1]


def get_last_event_post_id(data_dir: Path) -> int:
    latest_event_file = get_latest_event_file(data_dir)
    contents = latest_event_file.read_text(encoding="utf-8")

    if not contents.strip():
        raise ValueError(f"File {latest_event_file} is empty")

    existing_events = EventFile.model_validate_json(contents)
    latest_event = next(existing_events.iter_chronologically(reverse=True))

    return int(latest_event.post_id)


@app.task
def event_flow() -> None:
    chain(check_new_events.s(), process_new_events.s()).delay()


@app.task
def check_new_events() -> bool:
    with fs_lock("check_new_events") as lock_acquired:
        if not lock_acquired:
            print("Another task already has the lock")
            return False
        print("Checking for new events")
        return True


@app.task
def process_new_events(there_are_new_events: bool) -> None:
    with fs_lock("process_new_events") as lock_acquired:
        if not lock_acquired:
            print("Another task already has the lock")
            return

        if there_are_new_events:
            print("Processing new events")
            asyncio.run(process_new_events_async())


async def process_new_events_async() -> None:
    print("Processing new events async")
    loop_start(settings.repo_root_dir)
    data_dir = settings.data_path
    latest_post_id = get_last_event_post_id(data_dir)
    events = await get_all_events(
        Game.GENSHIN_IMPACT, MessageType.INFO, limit=25, stop_at_post_id=latest_post_id
    )
    print(f"Retrieved {len(events)} new events")
    modified_event_files = write_events(events, data_dir)
    await update_event_files(modified_event_files)
    print("New events processed")
    if modified_event_files:
        loop_end_with_changes(settings.repo_root_dir, modified_event_files)


if __name__ == "__main__":
    app.start()
