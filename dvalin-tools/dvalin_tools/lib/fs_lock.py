"""A simple FS-based lock for Celery tasks.

The goal is to prevent having the same tasks running concurrently, if one
task is already running, the next one should be skipped.
"""

from contextlib import contextmanager
from pathlib import Path
from tempfile import gettempdir


class FSLock:
    FS_LOCK_DIR = Path(gettempdir()) / "dvalin_tools"

    def __init__(self, lock_file_name: str) -> None:
        self.FS_LOCK_DIR.mkdir(exist_ok=True)
        self.lock_file = self.FS_LOCK_DIR / f"{lock_file_name}.lock"

    def acquire(self) -> bool:
        if self.lock_file.exists():
            return False
        self.lock_file.touch()
        return True

    def release(self) -> None:
        self.lock_file.unlink()


@contextmanager
def fs_lock(lock_file_name: str):
    lock = FSLock(lock_file_name)
    lock_acquired = lock.acquire()
    try:
        yield lock_acquired
    finally:
        if lock_acquired:
            lock.release()


if __name__ == "__main__":
    with fs_lock("my_lock") as lock_acquired:
        if lock_acquired:
            print("Lock acquired")
            with fs_lock("my_lock") as lock_acquired2:
                if lock_acquired2:
                    print("Should not be printed")
                else:
                    print("Lock already acquired")
    print("Lock released")
