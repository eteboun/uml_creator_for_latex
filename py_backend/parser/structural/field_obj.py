import default_types as dt
import modifiers as m
from dataclasses import dataclass, field

@dataclass
class Attribute:
    name: str
    type_: dt.DefType
    accessSpecifier: m.AccessSpecifiers
    modifier: list[m.Modifiers] = field(default_factory=list)