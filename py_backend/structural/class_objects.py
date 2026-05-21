from . import default_types as dt
from . import modifiers as m
from dataclasses import dataclass, field

@dataclass
class Base:
    name: str
    type_: dt.ClassType = field(default=None)
    accessSpecifier: m.AccessSpecifiers = field(default=m.AccessSpecifiers.PACKAGE_PRIVATE)
    modifiers: list = field(default_factory=list)

    fields: list = field(default_factory=list)
    methods: list = field(default_factory=list)

@dataclass
class ClassObj(Base):
    extends_: list = field(default_factory=list)
    implements_: list = field(default_factory=list)
    permits_: list = field(default_factory=list)
    constructors: list = field(default_factory=list)

@dataclass
class InterfaceObj(Base):
    extends_: list = field(default_factory=list)
    permits_: list = field(default_factory=list)

@dataclass
class RecordObj(Base):
    implements_: list = field(default_factory=list)
    parameters: list = field(default_factory=list)
    constructors: list = field(default_factory=list)

@dataclass
class EnumObj(Base):
    implements_: list = field(default_factory=list)
    constants: list = field(default_factory=list)
    constructors: list = field(default_factory=list)
