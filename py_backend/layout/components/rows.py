from dataclasses import dataclass, field

@dataclass
class Row:
    height: float
    anchor: str
    align: str
    lines: int
    content: list = field(default_factory=list)
    position: tuple[float, float] = (0.0, 0.0)

    def as_dict(self):
        d = self.__dict__.copy()
        d['content'] = self.content.copy()
        return d