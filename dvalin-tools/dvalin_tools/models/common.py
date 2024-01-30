from datetime import datetime
from enum import Enum
from typing import Annotated, Any, Callable, Generic, TypeVar

from pydantic import PlainSerializer, ValidationError, WrapValidator
from pydantic_core.core_schema import ValidationInfo, ValidatorFunctionWrapHandler

_EnumStrSerializer = PlainSerializer(lambda e: str(e.name), return_type=str)
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
            return handler(EnumClass.__members__[v])

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
    ) -> Annotated[T, PlainSerializer, WrapValidator]:
        return Annotated[
            item, _EnumStrSerializer, WrapValidator(accept_enum_names(item))
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
