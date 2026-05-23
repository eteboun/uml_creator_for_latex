from dataclasses import dataclass, field
from py_backend.create.layout.config import SectionConfig
from .rows import Row

@dataclass
class Section:
    name: str
    config: SectionConfig

    height: float = field(init=False)
    position: tuple[float, float] = (0.0, 0.0)
    rows: list[Row] = field(default_factory=list, init=False)