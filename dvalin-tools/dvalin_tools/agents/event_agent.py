import asyncio
from pathlib import Path

from celery import Celery
from celery.schedules import crontab

from dvalin_tools.lib.fs_lock import fs_lock
from dvalin_tools.lib.languages import LANGUAGE_CODE_TO_DIR, LanguageCode
from dvalin_tools.lib.repository import (
    initialize_git_repo,
    persist_on_remote,
    prepare_local_auto_branch,
)
from dvalin_tools.lib.settings import DvalinSettings
from dvalin_tools.models.common import Game
from dvalin_tools.models.events import EventFile, EventI18N, MessageType
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
    initialize_git_repo(settings.repo_root_dir)
    sender.add_periodic_task(crontab(minute="*/1"), process_new_events.s())


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
def process_new_events() -> None:
    with fs_lock("process_new_events") as lock_acquired:
        if not lock_acquired:
            print("Another task already has the lock")
            return

        asyncio.run(process_new_events_async())


async def process_new_events_async() -> None:
    print("Checking for new events...")
    prepare_local_auto_branch(settings.repo_root_dir)
    data_dir = settings.data_path
    latest_post_id = get_last_event_post_id(data_dir)
    events = await get_all_events(
        Game.GENSHIN_IMPACT, MessageType.INFO, limit=25, stop_at_post_id=latest_post_id
    )
    if not events:
        print("No new events")
        return

    print(f"Retrieved {len(events)} new events")
    modified_event_files = write_events(events, data_dir)
    await update_event_files(modified_event_files)
    print("New events processed")
    if modified_event_files:
        persist_on_remote(
            settings.repo_root_dir,
            modified_event_files,
            get_commit_message_body(events),
        )


def get_commit_message_body(events: list[EventI18N]) -> str:
    lines = ["Contains the following events:"]
    for event in events:
        lines.append(
            f"* [{event.created_at:%Y-%m-%d %H:%M}] "
            f"{event.subject} "
            f"([{event.post_id}]({event.article_url}))"
        )
    lines.append("")

    return "\n".join(lines)


if __name__ == "__main__":
    app.start()
