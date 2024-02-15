import asyncio
import re
from enum import Enum, auto
from pathlib import Path
from random import random
from typing import Annotated, Final, Literal, Self
from urllib.parse import urljoin

import httpx
from pydantic import (
    AnyUrl,
    ConfigDict,
    Field,
    RootModel,
    model_serializer,
    model_validator,
)

from dvalin_tools.lib.constants import ROOT_DIR_DVALIN_DATA
from dvalin_tools.lib.typescript import TsAnnotation
from dvalin_tools.models.common import CamelBaseModel, EnumSerializeAndValidateAsStr

RE_YOUTU_BE = re.compile(r"youtu\.be/(?P<id>[^?&/]+)")


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


KNOWN_MALFORMED_URLS: Final[dict[str, tuple[str, LinkType]]] = {
    "http://「HoYo Quiz」参加方法及びルール公開！": (
        "https://www.hoyolab.com/article/5773278",
        LinkType.HOYOLAB,
    ),
    "http://xn--hoyo%20quiz%21-bg3kza44m42ca91ar455c49e8xgcfr733b9w9aqyzr/": (
        "https://www.hoyolab.com/article/5773278",
        LinkType.HOYOLAB,
    ),
    ">https://www.youtube.com/c/GenshinImpact": (
        "https://www.youtube.com/c/GenshinImpact",
        LinkType.YOUTUBE,
    ),
}


class RedirectLinkChain(RootModel):
    root: list[str] = Field(default_factory=list)

    @property
    def final(self) -> str:
        return self.root[-1]

    @property
    def initial(self) -> str:
        return self.root[0]

    def add_redirect(self, redirect: str) -> None:
        self.root.append(redirect)

    def is_empty(self) -> bool:
        return not self.root

    def __iadd__(self, other: str) -> "RedirectLinkChain":
        self.add_redirect(other)
        return self

    def __len__(self) -> int:
        return len(self.root)


class RedirectLinksCache(CamelBaseModel):
    cache: dict[str, str] = Field(default_factory=dict)

    @model_serializer(when_used="json")
    def sort_model(self) -> dict[Literal["cache"], dict[str, str]]:
        return {"cache": dict(sorted(self.cache.items()))}


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
                self.file_path.read_text(encoding="utf-8")
            )
        else:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            self.save()

    def save(self) -> None:
        self.file_path.write_text(
            self.links_cache.model_dump_json(indent=2), encoding="utf-8"
        )

    def cache(self, url: str, redirect: str = "") -> None:
        # Try to see if url is serializable.
        try:
            RedirectLinksCache.model_validate(
                {"cache": {url: redirect}}
            ).model_dump_json(indent=2)
        except Exception as e:
            print(f"Warning: trying to cache a non-serializable URL: {url}")
            print(e)
            return
        self.links_cache.cache[url] = redirect
        self._uncached_size += 1
        if self._uncached_size >= self.buffer_size:
            self.save()
            self._uncached_size = 0

    def cache_chain(self, chain: RedirectLinkChain) -> None:
        for url1, url2 in zip(chain.root, chain.root[1:]):
            self.cache(url1, url2)

    def find(self, url: str) -> tuple[RedirectLinkChain, bool]:
        """Find a URL in the cache and return the chain of redirects.

        Params:
            url: The URL to find.

        Returns:
            The chain of redirects, or an empty list if the URL is not in the cache.
            If there is a chain, the last element could be an empty string, to indicate
            that the URL is the final destination.
            Also returns a boolean indicating if the URL was fully resolved.
        """
        chain_urls = RedirectLinkChain()

        if url not in self.links_cache.cache:
            return chain_urls, False

        chain_urls += url

        while chain_urls.final in self.links_cache.cache:
            target = self.links_cache.cache[chain_urls.final]
            if not target:
                return chain_urls, True
            chain_urls += target

        return chain_urls, False


_cache_file = (
    ROOT_DIR_DVALIN_DATA / "dvalin-tools" / "__scraper_cache__" / "redirect_links.json"
)
_redirect_link_cache = RedirectLinks(_cache_file)


async def resolve_url(
    url: str, *, max_redirects: int = 10
) -> tuple[RedirectLinkChain, bool]:
    """Resolve a shortened URL or a URL with a redirect to its final destination."""
    url_list = RedirectLinkChain([url])
    found, is_fully_resolved = _redirect_link_cache.find(url)

    if found:
        if is_fully_resolved:
            return found, True

        # Let's start from the last element, which is the first redirect.
        url_list = found

    try:
        AnyUrl(url)
    except Exception:
        return RedirectLinkChain(), False

    # Global redirect (because we know the whole domain changed).
    # This is actually better for 2 reasons:
    # 1. We save the time of a request.
    # 2. Mihoyo failed to do their language redirects properly. All old links go to the English version.
    if "/genshin.mihoyo.com" in url_list.final:
        mhy_redirect = url_list.final.replace(
            "/genshin.mihoyo.com", "/genshin.hoyoverse.com"
        )
        url_list += mhy_redirect
        _redirect_link_cache.cache(url, url_list.final)

    try:
        async with httpx.AsyncClient(follow_redirects=False) as client:
            for _ in range(max_redirects):
                await asyncio.sleep(
                    random() * 0.5
                )  # Sleep a bit to avoid rate limiting (if it's a redirect loop, it's not worth it anyway).
                print(f" * GET {url_list.final}")
                async with client.stream("GET", url_list.final) as response:
                    if (
                        response.status_code in {301, 302, 303, 304, 307, 308}
                        and "Location" in response.headers
                    ):
                        new_location = urljoin(
                            url_list.final, response.headers["Location"]
                        )
                        url_list += new_location
                    else:
                        is_fully_resolved = True
                        break
            else:
                raise RuntimeError(f"Too many redirects for {url}")
            _redirect_link_cache.cache_chain(url_list)
            return url_list, is_fully_resolved
    except httpx.HTTPError as e:
        print(f"HTTP error occurred: {e.request.url} - {e.request.headers}")
    except Exception as e:
        print(f"An error occurred: {e}")

    return RedirectLinkChain(), False


class Link(CamelBaseModel):
    model_config = ConfigDict(
        plugin_settings={"typescript": {"model_annotations": ["@TJS-required"]}}
    )
    index: int
    url: str = ""
    url_original: str
    url_original_resolved: RedirectLinkChain = Field(default_factory=RedirectLinkChain)
    url_s3: Annotated[str | None, TsAnnotation("@nullable")] = None
    link_type: EnumSerializeAndValidateAsStr[LinkType] = LinkType.UNKNOWN
    is_resolved: bool = False

    def __hash__(self) -> int:
        return hash((self.url, self.url_original))

    async def resolve(self) -> None:
        """Resolve the original URL."""
        if self.link_type is LinkType.MALFORMED:
            self.url_original_resolved = RedirectLinkChain()
            return

        # The second condition is to fix already-processed YT links.
        # No network is involved anyway, with this resolution.
        if (
            self.link_type is LinkType.YOUTUBE
            or self.get_link_type(self.url_original) is LinkType.YOUTUBE
        ):
            self.resolve_youtube()
            return

        if self.url_original_resolved.is_empty() or not self.is_resolved:
            self.url_original_resolved = await resolve_url(self.url_original)

            # If the url is still the original, change it if there is a redirect.
            if (
                not self.url_original_resolved.is_empty()
                and self.url == self.url_original != self.url_original_resolved.final
            ):
                self.url = self.url_original_resolved.final

    def resolve_youtube(self) -> None:
        """Resolve YouTube URLs.

        Attempting at resolving it through network will fail, because of some cookies.
        For now, we just do nothing.
        """
        if self.link_type is not LinkType.YOUTUBE:
            return

        if match := RE_YOUTU_BE.search(self.url_original):
            self.url = f"https://www.youtube.com/watch?v={match['id']}"
            self.url_original_resolved = RedirectLinkChain(
                [self.url_original, self.url]
            )
        elif "http://" in self.url_original:
            self.url = self.url_original.replace("http://", "https://")
            self.url_original_resolved = RedirectLinkChain(
                [self.url_original, self.url]
            )
        else:
            self.url_original_resolved = RedirectLinkChain([self.url_original])

        self.is_resolved = True
        _redirect_link_cache.cache_chain(self.url_original_resolved)

    @model_validator(mode="after")
    def pre_root(self) -> Self:
        if self.url_original and not self.url:
            self.url = self.url_original

        if self.link_type is not LinkType.UNKNOWN:
            return self

        self.link_type = self.get_link_type(self.url)

        return self

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
        elif url.host in ["youtube.com", "youtu.be"] or url.host.endswith(
            (".youtube.com", ".youtu.be")
        ):
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
