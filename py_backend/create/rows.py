from dataclasses import dataclass, field


@dataclass
class Row:
    height: float
    align: str

    content: list = field(default_factory=list)
