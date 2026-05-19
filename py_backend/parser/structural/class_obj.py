from . import default_types as dt
from . import modifiers as m
from dataclasses import dataclass, field

@dataclass
class Base:
    name: str

    type_: dt.ClassType = field(default=None)
    accessSpecifier: m.AccessSpecifiers = field(default=m.AccessSpecifiers.PACKAGE_PRIVATE)
    modifiers: list = field(default_factory=list)

    extends_: str | None = None
    implements_: list = field(default_factory=list)
    permits_: list = field(default_factory=list)
    fields: list = field(default_factory=list)
    methods: list = field(default_factory=list)

    def parseFields(self):
        pass

    def parseMethods(self):
        pass
