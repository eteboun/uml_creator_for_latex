from dataclasses import dataclass, field
from py_backend.layout.config import SectionConfig
from .rows import Row

@dataclass
class Section:
    name: str
    config: SectionConfig

    rows: list[Row] = field(default_factory=list, init=False)

    def as_dict(self):
        return {
            "name": self.name,
            "config": self.config.as_dict(),
            "rows": [r.as_dict() for r in self.rows],
        }
