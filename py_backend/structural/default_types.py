from dataclasses import dataclass, field
from . import class_objects as co

STEREOTYPES = {
    co.ClassObj: None,
    co.EnumObj: '<< Enum >>',
    co.RecordObj: '<< Record >>',
    co.InterfaceObj: '<< Interface >>',
}

@dataclass
class DefType:
    name: str
    dim: int
    generics: list = field(default_factory=list)

    def flatten(self):
        type_ = self.name
        if self.generics:
            gen_types = []
            for g in self.generics:
                gen_types.append(g.flatten())
            gen_str = '<' + ','.join(gen_types) + '>'
            type_ = type_ + gen_str
        type_ += '[]' * self.dim
        return type_



