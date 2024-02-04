from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Callable, Generic, TypeVar

from pydantic import (
    AliasChoices,
    AliasGenerator,
    BaseModel,
    ConfigDict,
    PlainSerializer,
    ValidationError,
    WithJsonSchema,
    WrapValidator,
)
from pydantic.alias_generators import to_camel, to_pascal
from pydantic_core.core_schema import ValidationInfo, ValidatorFunctionWrapHandler

_PascalCaseSerializer = PlainSerializer(lambda s: to_pascal(s), return_type=str)
_CamelCaseSerializer = PlainSerializer(lambda s: to_camel(s), return_type=str)
_EnumStrSerializer = PlainSerializer(
    lambda e: _PascalCaseSerializer.func(str(e.name)), return_type=str
)

T = TypeVar("T", bound=Enum)


def accept_enum_names(
    EnumClass: type[T],
) -> Callable[[Any, ValidatorFunctionWrapHandler, ValidationInfo], T]:
    def validator_function(
        v: Any, handler: ValidatorFunctionWrapHandler, info: ValidationInfo
    ) -> T:
        try:
            return handler(v)
        except ValidationError:
            pascal_case_members = {to_pascal(m.name): m for m in EnumClass}
            try:
                return handler(pascal_case_members[v])
            except ValidationError:
                pascal_v = to_pascal(v)
                return handler(pascal_case_members[pascal_v])

    return validator_function


class EnumSerializeAndValidateAsStr(Generic[T]):
    """A wrapper for enums that serializes and validates as a string.

    This makes JSON dumps and loads easier to read, and also allows for
    more flexibility in the input.

    Use like this:
    >>> from enum import Enum
    >>> from pydantic import BaseModel
    >>> class MyEnum(Enum):
    ...     A = 1
    ...     B = 2
    ...     def __str__(self):
    ...         return self.name
    >>> class MyModel(BaseModel):
    ...     e: EnumSerializeAndValidateAsStr[MyEnum]
    >>> m = MyModel(e=MyEnum.A)
    >>> print(m.model_dump_json())
    {"e": "A"}
    >>> m = MyModel(e="A")
    >>> print(m.model_dump_json())
    {"e": "A"}
    >>> m = MyModel(e=1)
    >>> print(m.model_dump_json())
    {"e": "A"}
    >>> MyModel.model_validate_json(MyModel(e=2).model_dump_json())
    MyModel(e=<MyEnum.B: 2>)
    """

    def __class_getitem__(
        cls, item: type[T]
    ) -> Annotated[T, PlainSerializer, WrapValidator, WithJsonSchema]:
        enum_schema = {
            "enum": [_EnumStrSerializer.func(m) for m in item.__members__.values()]
        }
        return Annotated[
            item,
            _EnumStrSerializer,
            WrapValidator(accept_enum_names(item)),
            WithJsonSchema(enum_schema),
        ]


class Game(Enum):
    HONKAI_IMPACT_3RD = 1
    GENSHIN_IMPACT = 2
    # No 3
    TEARS_OF_THEMIS = 4
    HOYOLAB = 5
    HONKAI_STAR_RAIL = 6
    # No 7
    ZENLESS_ZONE_ZERO = 8


CustomDateTime = Annotated[
    datetime,
    PlainSerializer(lambda dt: dt.isoformat(), return_type=str),
]


class CamelBaseModel(BaseModel):
    """A base model that uses camel case for serialization and validation."""

    model_config = ConfigDict(
        alias_generator=AliasGenerator(
            alias=str,
            validation_alias=lambda s: AliasChoices(s, to_camel(s), s.lower()),
            serialization_alias=to_camel,
        )
    )
