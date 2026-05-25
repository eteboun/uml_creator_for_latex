from dataclasses import dataclass, field
from py_backend.layout.config import SectionConfig
from .rows import Row

@dataclass
class Section:
    name: str
    config: SectionConfig

    height: float = field(init=False)
    position: tuple[float, float] = (0.0, 0.0)
    rows: list[Row] = field(default_factory=list, init=False)

    def as_dict(self):
        d = self.__dict__.copy()
        d['config'] = self.config.as_dict()
        d['rows'] = [r.as_dict() for r in self.rows]
        return d
