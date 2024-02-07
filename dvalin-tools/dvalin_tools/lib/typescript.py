from datetime import datetime
from enum import Enum, auto
from types import NoneType, UnionType
from typing import Annotated, get_args, get_origin

from pydantic import BaseModel, RootModel
from pydantic.alias_generators import to_pascal
from pydantic.fields import ComputedFieldInfo, FieldInfo


class EnumMode(Enum):
    """Enum mode for the enum serializer."""

    PRESERVE_VALUE = auto()
    KEY_ONLY = auto()
    SET_VALUE_FROM_KEY = auto()


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


class TsAnnotation(str):
    """Typescript annotation for pydantic models.

    This can be used to add annotations to the generated typescript code.
    Useful for complying with https://github.com/YousefED/typescript-json-schema/blob/master/api.md
    It can be added to fields and computed fields.

    For fields:

        ```python
        class MyModel(BaseModel):
            my_field: Annotated[str, TsAnnotation("@nullable"), TsAnnotation("@TJS-pattern ^[a-zA-Z0-9]{4}-abc_123$")]
        ```

    It will look like so:

        ```typescript
        /**
         * @nullable
         * @TJS-pattern ^[a-zA-Z0-9]{4}-abc_123$
         */
        myField: string;
        ```

    And for computed fields:

        ```python
        class MyModel(BaseModel):
            @computed_field(
                alias="myComputedField",
                return_type=Annotated[str, TsAnnotation("@TJS-pattern ^[a-zA-Z0-9]{4}-abc_123$")]
            )
            def my_computed_field(self) -> str:
                return "my computed field"
        ```

    It will look like so:

        ```typescript
        /** @TJS-pattern ^[a-zA-Z0-9]{4}-abc_123$ */
        myComputedField: string;
        ```
    """

    pass


def get_ts_annotation_from_computed_field(
    computed_field: ComputedFieldInfo, *, indent: str = "\t"
) -> str:
    return_type = computed_field.return_type
    origin, args = get_origin(return_type), get_args(return_type)

    if origin is not Annotated:
        return ""

    annotations = [meta for meta in args[1:] if isinstance(meta, TsAnnotation)]
    return get_ts_annotation(annotations, indent=indent)


def get_ts_annotation_from_field(field: FieldInfo, *, indent: str = "\t") -> str:
    annotations = [meta for meta in field.metadata if isinstance(meta, TsAnnotation)]
    return get_ts_annotation(annotations, indent=indent)


def get_ts_annotation_from_model(model: type[BaseModel], *, indent: str = "") -> str:
    annotations = (
        model.model_config.get("plugin_settings", {})
        .get("typescript", {})
        .get("model_annotations", [])
    )
    return get_ts_annotation(annotations, indent=indent)


def get_ts_annotation(annotations: list[str], *, indent: str = "\t") -> str:
    if not annotations:
        return ""

    if len(annotations) == 1:
        return f"\n{indent}/** {annotations[0]} */"

    return (
        f"\n{indent}/**\n"
        + "\n".join(f"{indent} * {ann}" for ann in annotations)
        + f"\n{indent} */"
    )


def get_type_name(type_ann: type) -> str:
    if issubclass(type_ann, BaseModel):
        return type_ann.model_config.get("title", type_ann.__name__)
    return type_ann.__name__


def py_type_to_ts(type_ann: type) -> str:
    origin = get_origin(type_ann)
    args = get_args(type_ann)
    if origin is None or origin is NoneType:
        return TYPES_PY_TO_TS.get(type_ann, get_type_name(type_ann))
    if issubclass(origin, (list, set, frozenset)):
        return f"Array<{py_type_to_ts(args[0])}>"
    if issubclass(origin, dict):
        return f"Record<{py_type_to_ts(args[0])}, {py_type_to_ts(args[1])}>"
    if issubclass(origin, UnionType):
        return " | ".join(py_type_to_ts(arg) for arg in args)
    if origin is Annotated:
        return py_type_to_ts(args[0])
    return get_type_name(type_ann)


def get_field_info_ts_type(field: FieldInfo) -> str:
    return py_type_to_ts(field.annotation)


def to_typescript_enum(
    enum: type[Enum],
    *,
    public: bool = False,
    name: str | None = None,
    mode: EnumMode = EnumMode.PRESERVE_VALUE,
) -> str:
    """Generate a typescript enum from a python enum."""
    lines = []
    model_name = name if name else enum.__name__
    lines.append(get_ts_annotation(["@TJS-required"], indent=""))

    if public:
        lines.append(f"export enum {model_name} {{")
    else:
        lines.append(f"enum {model_name} {{")

    for member in enum:
        if mode is EnumMode.PRESERVE_VALUE:
            lines.append(f"\t{to_pascal(member.name)} = {member.value!r},")
        elif mode is EnumMode.KEY_ONLY:
            lines.append(f"\t{to_pascal(member.name)},")
        elif mode is EnumMode.SET_VALUE_FROM_KEY:
            lines.append(f"\t{to_pascal(member.name)} = {to_pascal(member.name)!r},")

    lines[-1] = lines[-1].removesuffix(",")

    lines.append("}")

    return "\n".join(lines)


def to_typescript_basemodel(
    model: type[BaseModel], *, public: bool = False, name: str | None = None
) -> str:
    """Generate a typescript interface from a pydantic model."""
    lines = []
    model_name = name if name else get_type_name(model)

    if ts_annotation := get_ts_annotation_from_model(model):
        lines.append(ts_annotation)
    # else:
    #     lines.append(get_ts_annotation(["@TJS-required"], indent=""))

    if public:
        lines.append(f"export type {model_name} = {{")
    else:
        lines.append(f"type {model_name} = {{")

    for field in model.model_fields.values():
        field_name = field.serialization_alias
        field_type = py_type_to_ts(field.annotation)
        if ts_annotation := get_ts_annotation_from_field(field):
            lines.append(ts_annotation)
        lines.append(f"\t{field_name}: {field_type};")

    for computed_field in model.model_computed_fields.values():
        field_name = computed_field.alias
        field_type = py_type_to_ts(computed_field.return_type)
        if ts_annotation := get_ts_annotation_from_computed_field(computed_field):
            lines.append(ts_annotation)
        lines.append(f"\t{field_name}: {field_type};")

    lines.append("};")

    return "\n".join(lines)


def to_typescript_rootmodel(
    model: type[BaseModel], *, public: bool = False, name: str | None = None
) -> str:
    """Generate a typescript type alias from a pydantic root model."""
    lines = []
    model_name = name if name else get_type_name(model)
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
    enum_mode: EnumMode = EnumMode.PRESERVE_VALUE,
) -> str:
    if issubclass(model, Enum):
        return to_typescript_enum(model, public=public, name=name, mode=enum_mode)
    if issubclass(model, RootModel):
        return to_typescript_rootmodel(model, public=public, name=name)
    return to_typescript_basemodel(model, public=public, name=name)
