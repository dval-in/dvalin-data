from itertools import islice
from pathlib import PurePath

from httpx import URL, Headers


def batched(iterable, n):
    "Batch data into tuples of length n. The last batch may be shorter."
    # batched('ABCDEFG', 3) --> ABC DEF G
    if n < 1:
        raise ValueError("n must be at least one")
    it = iter(iterable)
    while batch := tuple(islice(it, n)):
        yield batch


ENRICH_CONTENT_TYPE = {
    "gif": "image/gif",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "svg": "image/svg+xml",
    "tif": "image/tiff",
    "tiff": "image/tiff",
    "webp": "image/webp",
    "bmp": "image/bmp",
    "ico": "image/x-icon",
    "cur": "image/x-icon",
    "pdf": "application/pdf",
    "json": "application/json",
    "xml": "application/xml",
    "zip": "application/zip",
    "tar": "application/x-tar",
    "gz": "application/gzip",
    "bz2": "application/x-bzip2",
    "xz": "application/x-xz",
    "7z": "application/x-7z-compressed",
    "mp4": "video/mp4",
    "webm": "video/webm",
    "ogg": "video/ogg",
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "flac": "audio/flac",
    "aac": "audio/aac",
    "opus": "audio/opus",
    "csv": "text/csv",
    "html": "text/html",
    "txt": "text/plain",
    "md": "text/markdown",
    "rst": "text/x-rst",
    "yaml": "application/x-yaml",
    "yml": "application/x-yaml",
    "toml": "application/toml",
    "ini": "text/plain",
    "cfg": "text/plain",
    "conf": "text/plain",
}


def determine_content_type(headers: Headers, url: URL) -> str:
    """Determine the content-type of a response.

    If the content type is not found in the headers, the file extension of the URL is used.
    """
    content_type = headers.get("content-type")
    if content_type:
        return ENRICH_CONTENT_TYPE.get(
            content_type.split(";")[0].split("/")[-1], content_type
        )
    return ENRICH_CONTENT_TYPE.get(
        PurePath(url.path).suffix[1:], "application/octet-stream"
    )
