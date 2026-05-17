import default_types as dt
import modifiers as m
from dataclasses import dataclass, field

@dataclass
class Base:
    name: str

    ctype: dt.ClassType = field(default=None, init=False)
    access: m.Access = field(default=m.Access.PACKAGE_PRIVATE)
    nonaccess: list = field(default_factory=list)

    extends: str | None = None
    implements: list = field(default_factory=list)
    permits: list = field(default_factory=list)
    attributes: list = field(default_factory=list)
    methods: list = field(default_factory=list)

@dataclass
class Class(Base):
    ctype: dt.ClassType = field(
        default=dt.ClassType.CLASS,
        init=False
    )
@dataclass
class Record(Base):
    ctype: dt.ClassType = field(
        default=dt.ClassType.RECORD,
        init=False
    )
@dataclass
class Interface(Base):
    ctype: dt.ClassType = field(
        default=dt.ClassType.INTERFACE,
        init=False
    )
@dataclass
class Enum(Base):
    ctype: dt.ClassType = field(
        default=dt.ClassType.ENUM,
        init=False
    )
