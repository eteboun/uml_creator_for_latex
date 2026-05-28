from dataclasses import dataclass, field

@dataclass
class Row:

    anchor: str
    align: str
    content: list = field(default_factory=list)
    lines: list = field(default_factory=list)

    def as_dict(self):
        return {
            'anchor': self.anchor,
            'align': self.align,
            'content': self.content.copy(),
            'lines': self.lines.copy(),
        }