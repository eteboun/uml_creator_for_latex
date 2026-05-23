from dataclasses import dataclass, field

@dataclass
class Row:
    height: float
    anchor: str
    position: tuple[float, float] = (0.0, 0.0)
    content: list = field(default_factory=list)