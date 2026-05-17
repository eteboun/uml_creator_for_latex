import default_types as dt
import modifiers as m
from dataclasses import dataclass, field

@dataclass
class Attribute:
    name: str
    type_: dt.DefType
    access: m.Access
    nonaccess: list[m.NonAccess] = field(default_factory=list)