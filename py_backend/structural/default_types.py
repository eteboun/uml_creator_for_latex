from enum import Enum
from dataclasses import dataclass, field

@dataclass
class DefType:
    name: str
    dim: int
    generics: list = field(default_factory=list)

class ClassType(Enum):
    CLASS = 'class'
    RECORD = 'record'
    INTERFACE = 'interface'
    ENUM = 'enum'