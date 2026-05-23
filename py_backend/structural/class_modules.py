from . import modifiers as m
from . import default_types as dt
from dataclasses import dataclass, field

@dataclass
class Field:
    name: str
    type_: dt.DefType
    accessSpecifier: m.AccessSpecifiers

    isFinal: bool = False
    isStatic: bool = False

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
    parameters: list[Parameter] = field(default_factory=list)

    isFinal: bool = False
    isStatic: bool = False
    isAbstract: bool = False