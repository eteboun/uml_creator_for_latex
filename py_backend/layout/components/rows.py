from dataclasses import dataclass

@dataclass
class Row:
    height: float
    anchor: str
    align: str
    content: str
    lines: int
    position: tuple[float, float] = (0.0, 0.0)

    def as_dict(self):
        return self.__dict__.copy()