import asyncio
from enum import Enum, auto
from pathlib import Path
from random import random
from typing import Any
from urllib.parse import urljoin

import httpx
from pydantic import AnyUrl, BaseModel, Field, model_validator

from dvalin_tools.lib.constants import ROOT_DIR_DVALIN_DATA
from dvalin_tools.models.common import EnumSerializeAndValidateAsStr


class LinkType(Enum):
    IMAGE = auto()
    HOYO_LINK = auto()
    HOYOLAB = auto()
    MIHOYO_HOYOVERSE = auto()
    TWITTER = auto()
    FACEBOOK = auto()
    YOUTUBE = auto()
    TWITCH = auto()
    VK = auto()
    TELEGRAM = auto()
    RELATIVE = auto()
    UNKNOWN = auto()
    MALFORMED = auto()


class RedirectLinksCache(BaseModel):
    cache: dict[str, str] = Field(default_factory=dict)


class RedirectLinks:
    def __init__(self, file_path: Path, buffer_size: int = 50) -> None:
        self.file_path = file_path
        self.links_cache = RedirectLinksCache()
        self.buffer_size = buffer_size
        self._uncached_size: int = 0
        self.load()

    def load(self) -> None:
        if self.file_path.exists():
            self.links_cache = RedirectLinksCache.model_validate_json(
                self.file_path.read_text()
            )
        else:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            self.file_path.write_text(self.links_cache.model_dump_json(indent=2))

    def cache(self, url: str, redirect: str = "") -> None:
        self.links_cache.cache[url] = redirect
        self._uncached_size += 1
        if self._uncached_size >= self.buffer_size:
            self.file_path.write_text(self.links_cache.model_dump_json(indent=2))
            self._uncached_size = 0

    def find(self, url: str) -> list[str]:
        if url not in self.links_cache.cache:
            return []

        chain_urls = [url]

        while chain_urls[-1] and chain_urls[-1] in self.links_cache.cache:
            chain_urls.append(self.links_cache.cache[chain_urls[-1]])

        return chain_urls


_redirect_link_cache = RedirectLinks(
    ROOT_DIR_DVALIN_DATA / "dvalin_tools" / "__scraper_cache__" / "redirect_links.json"
)


async def resolve_url(url: AnyUrl | str, *, max_redirects: int = 10) -> list[AnyUrl]:
    """Resolve a shortened URL or a URL with a redirect to its final destination."""
    found = _redirect_link_cache.find(str(url))
    if found:
        return [AnyUrl(u) for u in found]

    try:
        url = AnyUrl(url)
    except Exception:
        return []

    url_list = [url]

    # Global redirect (because we know the whole domain changed).
    # This is actually better for 2 reasons:
    # 1. We save the time of a request.
    # 2. Mihoyo failed to do their language redirects properly. All old links go to the English version.
    if "/genshin.mihoyo.com" in str(url):
        url_list.insert(
            0, AnyUrl(str(url).replace("/genshin.mihoyo.com", "/genshin.hoyoverse.com"))
        )
        _redirect_link_cache.cache(str(url), str(url_list[0]))

    try:
        async with httpx.AsyncClient(follow_redirects=False) as client:
            for _ in range(max_redirects):
                await asyncio.sleep(
                    random() * 0.5
                )  # Sleep a bit to avoid rate limiting (if it's a redirect loop, it's not worth it anyway).
                print(f" * GET {url_list[0]}")
                async with client.stream("GET", str(url_list[0])) as response:
                    if response.status_code in {301, 302, 303, 304, 307, 308}:
                        url_list.insert(
                            0,
                            AnyUrl(
                                urljoin(str(url_list[0]), response.headers["Location"])
                            ),
                        )
                        _redirect_link_cache.cache(str(url_list[1]), str(url_list[0]))
                    else:
                        break
            else:
                raise RuntimeError(f"Too many redirects for {url}")
            return url_list
    except httpx.HTTPError as e:
        print(f"HTTP error occurred: {e.request.url} - {e.request.headers}")
    except Exception as e:
        print(f"An error occurred: {e}")

    return []


class Link(BaseModel):
    url: AnyUrl | str
    url_original: AnyUrl | str
    url_original_resolved: list[AnyUrl | str] = Field(default_factory=list)
    link_type: EnumSerializeAndValidateAsStr[LinkType] = LinkType.UNKNOWN

    def __hash__(self) -> int:
        return hash((self.url, self.url_original))

    async def resolve(self) -> None:
        """Resolve the original URL."""
        if self.link_type is LinkType.MALFORMED:
            self.url_original_resolved = []
            return

        if not self.url_original_resolved:
            self.url_original_resolved = await resolve_url(self.url_original)

            # If the url is still the original, change it if there is a redirect.
            if (
                self.url_original_resolved
                and self.url == self.url_original != self.url_original_resolved[0]
            ):
                self.url = self.url_original_resolved[0]

    @model_validator(mode="before")
    def pre_root(cls, values: dict[str, Any]) -> dict[str, Any]:
        if not values.get("url") and not values.get("url_original"):
            raise ValueError("At least one of url or url_original must be set.")
        if values.get("url") and not values.get("url_original"):
            values["url_original"] = values["url"]
        elif values.get("url_original") and not values.get("url"):
            values["url"] = values["url_original"]

        if "link_type" in values:
            return values

        values["link_type"] = cls.get_link_type(values["url"])

        return values

    @staticmethod
    def get_link_type(raw_url: str) -> LinkType:
        """Get the link type from a URL."""
        try:
            url = AnyUrl(raw_url)
        except Exception:
            return LinkType.MALFORMED

        if not url.host:
            return LinkType.RELATIVE

        if url.host == "hoyo.link":
            return LinkType.HOYO_LINK
        elif url.host.endswith("hoyolab.com"):
            return LinkType.HOYOLAB
        elif url.host in ["mihoyo.com", "mhy.link"] or url.host.endswith(
            (".mihoyo.com", ".mhy.link")
        ):
            return LinkType.MIHOYO_HOYOVERSE
        elif url.host in ["twitter.com", "x.com"]:
            return LinkType.TWITTER
        elif url.host == "facebook.com" or url.host.endswith(".facebook.com"):
            return LinkType.FACEBOOK
        elif url.host == "youtube.com" or url.host.endswith(".youtube.com"):
            return LinkType.YOUTUBE
        elif url.host == "twitch.tv" or url.host.endswith(".twitch.tv"):
            return LinkType.TWITCH
        elif url.host == "vk.com" or url.host.endswith(".vk.com"):
            return LinkType.VK
        elif url.host in ["telegram.org", "t.me"] or url.host.endswith(
            (".telegram.org", ".t.me")
        ):
            return LinkType.TELEGRAM

        return LinkType.UNKNOWN


async def main():
    link = Link(url="http://「HoYo Quiz」参加方法及びルール公開！")
    await link.resolve()
    print(link)
    print(repr(link.link_type))
    print(repr(link.url_original_resolved))
    print(repr(link.url_original))
    print(repr(link.url))

    link = Link(url="https://hoyolab.com/genshin/article/333333")
    await link.resolve()
    print(link)
    print(repr(link.link_type))
    print(repr(link.url_original_resolved))
    print(repr(link.url_original))
    print(repr(link.url))


if __name__ == "__main__":
    asyncio.run(main())
