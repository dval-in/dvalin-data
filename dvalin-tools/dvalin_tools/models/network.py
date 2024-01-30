from enum import Enum, auto
from typing import Any
from urllib.parse import urljoin

import httpx
from pydantic import AnyUrl, BaseModel, Field, model_validator

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
    UNKNOWN = auto()


async def resolve_url(url: AnyUrl | str, *, max_redirects: int = 10) -> list[AnyUrl]:
    """Resolve a shortened URL or a URL with a redirect to its final destination."""
    url_list = [url]

    # Global redirect (because we know the whole domain changed).
    # This is actually better for 2 reasons:
    # 1. We save the time of a request.
    # 2. Mihoyo failed to do their language redirects properly. All old links go to the English version.
    if "/genshin.mihoyo.com" in str(url):
        url_list.insert(
            0, AnyUrl(str(url).replace("/genshin.mihoyo.com", "/genshin.hoyoverse.com"))
        )

    try:
        async with httpx.AsyncClient() as client:
            for _ in range(max_redirects):
                async with client.stream("GET", str(url_list[0])) as response:
                    if response.status_code in {301, 302, 303, 304, 307, 308}:
                        url_list.insert(
                            0,
                            AnyUrl(
                                urljoin(str(url_list[0]), response.headers["Location"])
                            ),
                        )
                    else:
                        break
            else:
                raise RuntimeError(f"Too many redirects for {url}")
            return url_list
    except httpx.HTTPError as e:
        print(f"HTTP error occurred: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")


class Link(BaseModel):
    url: AnyUrl
    url_original: AnyUrl
    url_original_resolved: list[AnyUrl] = Field(default_factory=list)
    link_type: EnumSerializeAndValidateAsStr[LinkType] = LinkType.UNKNOWN

    def __hash__(self) -> int:
        return hash((self.url, self.url_original))

    async def resolve(self) -> None:
        """Resolve the original URL."""
        if not self.url_original_resolved:
            self.url_original_resolved = await resolve_url(self.url_original)

            # If the url is still the original, change it if there is a redirect.
            if self.url == self.url_original != self.url_original_resolved[0]:
                self.url = self.url_original_resolved[0]

    @model_validator(mode="before")
    def pre_root(cls, values: dict[str, Any]) -> dict[str, Any]:
        if not values.get("url") and not values.get("url_original"):
            raise ValueError("At least one of url or url_original must be set.")
        if values.get("url") and not values.get("url_original"):
            values["url_original"] = values["url"]
        elif values.get("url_original") and not values.get("url"):
            values["url"] = values["url_original"]
        url = AnyUrl(values.get("url"))

        if "link_type" in values:
            return values

        link_type = LinkType.UNKNOWN
        if url:
            if url.host == "hoyo.link":
                link_type = LinkType.HOYO_LINK
            elif url.host.endswith("hoyolab.com"):
                link_type = LinkType.HOYOLAB
            elif url.host in ["mihoyo.com", "mhy.link"] or url.host.endswith(
                (".mihoyo.com", ".mhy.link")
            ):
                link_type = LinkType.MIHOYO_HOYOVERSE
            elif url.host in ["twitter.com", "x.com"]:
                link_type = LinkType.TWITTER
            elif url.host == "facebook.com" or url.host.endswith(".facebook.com"):
                link_type = LinkType.FACEBOOK
            elif url.host == "youtube.com" or url.host.endswith(".youtube.com"):
                link_type = LinkType.YOUTUBE
            elif url.host == "twitch.tv" or url.host.endswith(".twitch.tv"):
                link_type = LinkType.TWITCH
            elif url.host == "vk.com" or url.host.endswith(".vk.com"):
                link_type = LinkType.VK
            elif url.host in ["telegram.org", "t.me"] or url.host.endswith(
                (".telegram.org", ".t.me")
            ):
                link_type = LinkType.TELEGRAM

        values["link_type"] = link_type

        return values
