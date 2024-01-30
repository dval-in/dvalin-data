from enum import Enum
from typing import Iterator

from pydantic import BaseModel, Field, RootModel, computed_field, model_serializer

from dvalin_tools.lib.languages import LanguageCode
from dvalin_tools.lib.tags import Tags
from dvalin_tools.models.common import (
    CustomDateTime,
    EnumSerializeAndValidateAsStr,
    Game,
)


class MessageType(Enum):
    NOTICES = 1
    EVENT = 2  # Can be used, but MHY uses a different API for this one.
    INFO = 3


class _Event(BaseModel):
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


class EventLocalized(_Event):
    language: LanguageCode
    subject: str


class EventI18N(_Event):
    subject_i18n: dict[LanguageCode, str] = Field(default_factory=dict)

    @property
    def subject(self) -> str:
        return self.subject_i18n[LanguageCode.ENGLISH]

    def localize(self, language: LanguageCode) -> EventLocalized:
        return EventLocalized(
            post_id=self.post_id,
            game_id=self.game_id,
            message_type=self.message_type,
            created_at=self.created_at,
            tags=self.tags,
            language=language,
            subject=self.subject_i18n[language],
        )


class EventFile(RootModel):
    """A file containing events."""

    root: set[EventLocalized] = Field(default_factory=set)

    def __iter__(self) -> Iterator[EventLocalized]:
        return iter(sorted(self.root, key=lambda x: x.created_at))

    @model_serializer
    def file_serialize(self) -> list[EventLocalized]:
        return list(self)
