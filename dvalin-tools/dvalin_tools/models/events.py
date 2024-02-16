from enum import Enum
from html import escape
from pathlib import Path
from typing import Iterator, Self

from pydantic import (
    ConfigDict,
    Field,
    RootModel,
    computed_field,
    field_serializer,
    model_serializer,
    model_validator,
)

from dvalin_tools.lib.languages import LanguageCode
from dvalin_tools.models.common import (
    CamelBaseModel,
    CustomDateTime,
    EnumSerializeAndValidateAsStr,
    Game,
)
from dvalin_tools.models.network import (
    KNOWN_MALFORMED_URLS,
    Link,
    LinkType,
    RedirectLinkChain,
)
from dvalin_tools.models.tags import Tag


class MessageType(Enum):
    NOTICES = 1
    EVENT = 2  # Can be used, but MHY uses a different API for this one.
    INFO = 3


class _Event(CamelBaseModel):
    model_config = ConfigDict(
        plugin_settings={"typescript": {"model_annotations": ["@TJS-required"]}}
    )

    post_id: str
    game_id: EnumSerializeAndValidateAsStr[Game]
    message_type: EnumSerializeAndValidateAsStr[MessageType]
    created_at: CustomDateTime
    tags: set[EnumSerializeAndValidateAsStr[Tag]] = Field(default_factory=set)

    def __hash__(self) -> int:
        return hash(self.post_id)

    @computed_field(alias="articleUrl")
    @property
    def article_url(self) -> str:
        return f"https://www.hoyolab.com/article/{self.post_id}"

    @field_serializer("tags", when_used="json")
    def sort_tags(
        tags: set[EnumSerializeAndValidateAsStr[Tag]],
    ) -> list[EnumSerializeAndValidateAsStr[Tag]]:
        return sorted(tags, key=lambda x: x.value)


class EventLocalized(_Event):
    model_config = ConfigDict(title="Event")

    language: LanguageCode
    subject: str
    content: str = ""
    content_original: str = ""
    links: set[Link] = Field(default_factory=set)

    @field_serializer("links", when_used="json")
    def sort_links(links: set[Link]) -> list[Link]:
        return sorted(links, key=lambda x: x.index)

    @model_validator(mode="after")
    def pre_root(self) -> Self:
        # In an older version, content was set. If content_original is empty, we set it to content.
        if not self.content_original and self.content:
            self.content_original = self.content
            self.content = ""

        self.content = self.get_modified_content()

        return self

    def get_modified_content(self) -> str:
        """Return a modified version of the original content.

        This method replaces the original links with the s3 links if they exist.
        """
        content = self.content_original

        for link in self.links:
            # if we have an S3 link, we replace the original link with the S3 link
            if link.url_s3:
                content = content.replace(
                    escape(link.url_original), escape(link.url_s3)
                )
            # if we have a resolved link, we replace the original link with the resolved link
            elif link.url != link.url_original:
                content = content.replace(escape(link.url_original), escape(link.url))

        return content

    def fix_malformed_links(self) -> None:
        """Fix links that are known to be malformed."""

        malformed_links = [
            link for link in self.links if link.link_type is LinkType.MALFORMED
        ]

        if not malformed_links:
            return

        for link in malformed_links:
            link_copy: Link = link.copy(deep=True)
            new_url, new_link_type = KNOWN_MALFORMED_URLS.get(
                link.url_original, ("", "")
            )
            if not new_url:
                print(f"Found an unknown malformed link: {link.url_original}")
                continue
            link_copy.url = link_copy.url_original = new_url
            link_copy.link_type = new_link_type
            link_copy.url_original_resolved = RedirectLinkChain([new_url])
            link_copy.is_resolved = True
            new_content = self.content.replace(
                escape(link.url_original), escape(new_url)
            )
            if new_content == self.content:
                raise ValueError(
                    f"Could not replace {link.url_original} with {new_url}"
                )
            self.links.remove(link)
            self.links.add(link_copy)
            self.content = new_content


class EventI18N(_Event):
    subject_i18n: dict[LanguageCode, str] = Field(default_factory=dict)
    content_i18n: dict[LanguageCode, str] = Field(default_factory=dict)

    @property
    def subject(self) -> str:
        return self.subject_i18n[LanguageCode.ENGLISH]

    @property
    def content(self) -> str:
        return self.content_i18n[LanguageCode.ENGLISH]

    def localize(self, language: LanguageCode) -> EventLocalized:
        return EventLocalized(
            post_id=self.post_id,
            game_id=self.game_id,
            message_type=self.message_type,
            created_at=self.created_at,
            tags=self.tags,
            language=language,
            subject=self.subject_i18n[language],
            content=self.content_i18n.get(language, ""),
        )


class EventFile(RootModel):
    """A file containing events."""

    model_config = ConfigDict(title="Events")

    root: set[EventLocalized] = Field(default_factory=set)

    def __iter__(self) -> Iterator[EventLocalized]:
        return iter(sorted(self.root, key=lambda x: int(x.post_id)))

    @model_serializer
    def file_serialize(self) -> list[EventLocalized]:
        return list(self)

    def dump_json_to_file(self, path: Path) -> None:
        path.write_text(
            self.model_dump_json(indent=2, by_alias=True),
            encoding="utf-8",
            newline="\n",
        )
