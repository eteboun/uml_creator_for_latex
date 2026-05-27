from . import modifiers as m
from dataclasses import dataclass, field
from typing import ClassVar

@dataclass
class Base:
    name: str
    accessSpecifier: m.AccessSpecifiers = field(default=m.AccessSpecifiers.PACKAGE_PRIVATE)

    fields: list = field(default_factory=list)
    methods: list = field(default_factory=list)

    isStatic: bool = False

    allowed_section_types: ClassVar[tuple[str, ...]] = ("title",
                                                   "fields",
                                                   "methods")

    allowed_modifiers: ClassVar[dict[str, str]] = {"isStatic": "static",}

    stereotype: ClassVar[str | None] = None

@dataclass
class ClassObj(Base):
    extends_: list = field(default_factory=list)
    implements_: list = field(default_factory=list)
    permits_: list = field(default_factory=list)
    constructors: list = field(default_factory=list)

    isFinal: bool = False
    isAbstract: bool = False

    allowed_section_types: ClassVar[tuple[str,...]] = ("title",
                                          "fields",
                                          "constructors",
                                          "methods")

    allowed_modifiers: ClassVar[dict[str,str]] = {"isStatic": "static",
                                                  "isFinal": "final",
                                                  "isAbstract": "abstract",}

    stereotype: ClassVar[str | None] = None

@dataclass
class InterfaceObj(Base):
    extends_: list = field(default_factory=list)
    permits_: list = field(default_factory=list)
    isFinal: bool = False
    isAbstract: bool = False

    allowed_section_types: ClassVar[tuple[str,...]] = ("title",
                                          "fields",
                                          "methods")

    allowed_modifiers: ClassVar[dict[str,str]] = {"isStatic": "static",
                                                  "isFinal": "final",
                                                  "isAbstract": "abstract",}

    stereotype: ClassVar[str | None] = "<< Interface >>"


@dataclass
class RecordObj(Base):
    implements_: list = field(default_factory=list)
    parameters: list = field(default_factory=list)
    constructors: list = field(default_factory=list)
    isFinal: bool = False

    allowed_section_types: ClassVar[tuple[str,...]] = ("title",
                                          "parameters",
                                          "fields",
                                          "constructors",
                                          "methods")

    allowed_modifiers: ClassVar[dict[str,str]] = {"isStatic": "static",
                                                  "isFinal": "final",}

    stereotype: ClassVar[str | None] = "<< Record >>"


@dataclass
class EnumObj(Base):
    implements_: list = field(default_factory=list)
    constants: list = field(default_factory=list)
    constructors: list = field(default_factory=list)

    allowed_section_types: ClassVar[tuple[str,...]] = ("title",
                                          "constants",
                                          "fields",
                                          "constructors",
                                          "methods")

    allowed_modifiers: ClassVar[dict[str,str]] = {"isStatic": "static",}

    stereotype: ClassVar[str | None] = "<< Enum >>"
