import default_types as dt
import modifiers as m
from dataclasses import dataclass, field

@dataclass
class Parameter:
    name: str
    type_: dt.DefType

@dataclass
class Method:
    name: str
    access: m.AccessSpecifiers
    type_: dt.DefType
    modifier: list[m.Modifiers] = field(default_factory=list)
    args: list[Parameter] = field(default_factory=list)