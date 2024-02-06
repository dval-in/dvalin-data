from enum import Enum
from pathlib import Path
from typing import Iterator

from pydantic import (
    Field,
    RootModel,
    computed_field,
    field_serializer,
    model_serializer,
)

from dvalin_tools.lib.languages import LanguageCode
from dvalin_tools.models.tags import Tags
from dvalin_tools.models.common import (
    CamelBaseModel,
    CustomDateTime,
    EnumSerializeAndValidateAsStr,
    Game,
)
from dvalin_tools.models.network import Link


class MessageType(Enum):
    NOTICES = 1
    EVENT = 2  # Can be used, but MHY uses a different API for this one.
    INFO = 3


class _Event(CamelBaseModel):
    post_id: str
    game_id: EnumSerializeAndValidateAsStr[Game]
    message_type: EnumSerializeAndValidateAsStr[MessageType]
    created_at: CustomDateTime
    tags: set[EnumSerializeAndValidateAsStr[Tags]] = Field(default_factory=set)

    def __hash__(self) -> int:
        return hash(self.post_id)

    @computed_field
    @property
    def article_url(self) -> str:
        return f"https://www.hoyolab.com/article/{self.post_id}"

    @field_serializer("tags", when_used="json")
    def sort_tags(
        tags: set[EnumSerializeAndValidateAsStr[Tags]],
    ) -> list[EnumSerializeAndValidateAsStr[Tags]]:
        return sorted(tags, key=lambda x: x.value)


class EventLocalized(_Event):
    language: LanguageCode
    subject: str
    content: str = ""
    links: set[Link] = Field(default_factory=set)

    @field_serializer("links", when_used="json")
    def sort_links(links: set[Link]) -> list[Link]:
        return sorted(links, key=lambda x: x.index)


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

    root: set[EventLocalized] = Field(default_factory=set)

    def __iter__(self) -> Iterator[EventLocalized]:
        return iter(sorted(self.root, key=lambda x: int(x.post_id)))

    @model_serializer
    def file_serialize(self) -> list[EventLocalized]:
        return list(self)

    def dump_json_to_file(self, path: Path) -> None:
        path.write_text(self.model_dump_json(indent=2, by_alias=True), encoding="utf-8")
