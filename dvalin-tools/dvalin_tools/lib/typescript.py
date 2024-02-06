from datetime import datetime
from enum import Enum
from types import NoneType, UnionType
from typing import Annotated, get_args, get_origin

from pydantic import BaseModel, RootModel
from pydantic.alias_generators import to_pascal
from pydantic.fields import FieldInfo

TYPES_PY_TO_TS = {
    int: "number",
    float: "number",
    str: "string",
    bool: "boolean",
    # list: "Array",
    # set: "Set",
    # dict: "Record",
    datetime: "Date",
    None: "undefined",
    NoneType: "undefined",
}

TS_HEADER = """\
\t/**
\t * @TJS-required
\t */\
"""


def py_type_to_ts(type_ann: type) -> str:
    origin = get_origin(type_ann)
    args = get_args(type_ann)
    if origin is None or origin is NoneType:
        return TYPES_PY_TO_TS.get(type_ann, type_ann.__name__)
    if issubclass(origin, (list, set, frozenset)):
        return f"Array<{py_type_to_ts(args[0])}>"
    if issubclass(origin, dict):
        return f"Record<{py_type_to_ts(args[0])}, {py_type_to_ts(args[1])}>"
    if issubclass(origin, UnionType):
        return " | ".join(py_type_to_ts(arg) for arg in args)
    if origin is Annotated:
        return py_type_to_ts(args[0])
    return type_ann.__name__


def get_field_info_ts_type(field: FieldInfo) -> str:
    return py_type_to_ts(field.annotation)


def to_typescript_enum(
    enum: type[Enum],
    *,
    public: bool = False,
    name: str | None = None,
    drop_values: bool = False,
) -> str:
    """Generate a typescript enum from a python enum."""
    lines = []
    model_name = name if name else enum.__name__
    if public:
        lines.append(f"export enum {model_name} {{")
    else:
        lines.append(f"enum {model_name} {{")

    lines.append(TS_HEADER)

    for member in enum:
        if drop_values:
            lines.append(f"\t{to_pascal(member.name)},")
        else:
            lines.append(f"\t{to_pascal(member.name)} = {member.value!r},")

    lines[-1] = lines[-1].removesuffix(",")

    lines.append("}")

    return "\n".join(lines)


def to_typescript_basemodel(
    model: type[BaseModel], *, public: bool = False, name: str | None = None
) -> str:
    """Generate a typescript interface from a pydantic model."""
    types = []
    for field in model.model_fields.values():
        field_name = field.serialization_alias
        field_type = py_type_to_ts(field.annotation)
        types.append((field_name, field_type))

    for computed_field in model.model_computed_fields.values():
        field_name = computed_field.alias
        field_type = py_type_to_ts(computed_field.return_type)
        types.append((field_name, field_type))

    lines = []
    model_name = name if name else model.model_config.get("title", model.__name__)
    if public:
        lines.append(f"export type {model_name} = {{")
    else:
        lines.append(f"type {model_name} = {{")

    lines.append(TS_HEADER)

    for name, field_type in types:
        lines.append(f"\t{name}: {field_type};")

    lines.append("};")

    return "\n".join(lines)


def to_typescript_rootmodel(
    model: type[BaseModel], *, public: bool = False, name: str | None = None
) -> str:
    """Generate a typescript type alias from a pydantic root model."""
    lines = []
    model_name = name if name else model.model_config.get("title", model.__name__)
    root_field = model.model_fields["root"]
    if public:
        lines.append(
            f"export type {model_name} = {py_type_to_ts(root_field.annotation)};"
        )
    else:
        lines.append(f"type {model_name} = {py_type_to_ts(root_field.annotation)};")

    return "\n".join(lines)


def to_typescript(
    model: type[BaseModel | Enum],
    *,
    public: bool = False,
    name: str | None = None,
    drop_enum_values: bool = False,
) -> str:
    if issubclass(model, Enum):
        return to_typescript_enum(
            model, public=public, name=name, drop_values=drop_enum_values
        )
    if issubclass(model, RootModel):
        return to_typescript_rootmodel(model, public=public, name=name)
    return to_typescript_basemodel(model, public=public, name=name)
