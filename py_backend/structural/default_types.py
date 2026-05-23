from dataclasses import dataclass, field
from . import class_models as cmodels

STEREOTYPES = {
    cmodels.ClassObj: None,
    cmodels.EnumObj: '<< Enum >>',
    cmodels.RecordObj: '<< Record >>',
    cmodels.InterfaceObj: '<< Interface >>',
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



