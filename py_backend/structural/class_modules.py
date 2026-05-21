from . import modifiers as m
from . import default_types as dt
from dataclasses import dataclass, field

@dataclass
class Field:
    name: str
    type_: dt.DefType
    accessSpecifier: m.AccessSpecifiers
    modifiers: list[m.Modifiers] = field(default_factory=list)

@dataclass
class Parameter:
    name: str
    type_: dt.DefType

@dataclass
class Constant:
    name: str
    args: list = field(default_factory=list)

@dataclass
class Constructor:
    name: str
    accessSpecifier: m.AccessSpecifiers
    parameters: list[Parameter] = field(default_factory=list)

@dataclass
class Method:
    name: str
    accessSpecifier: m.AccessSpecifiers
    type_: dt.DefType
    modifiers: list[m.Modifiers] = field(default_factory=list)
    parameters: list[Parameter] = field(default_factory=list)