from dataclasses import dataclass, field
from py_backend.layout.config import UMLConfig
from py_backend.structural import class_models as cm
from .. import textual as t
from .rows import Row
from .sections import Section
from uuid import uuid4

@dataclass
class UML:

    config: UMLConfig
    c_model: cm.Base

    id: str = field(init=False)

    wrapper_threshold: int = field(init=False)
    sections: list[Section] = field(default_factory=list, init=False)

    def __post_init__(self):

        if type(self.c_model) is cm.Base:
            raise TypeError("c_model cannot be Base directly")

        if not isinstance(self.c_model, cm.Base):
            raise TypeError("c_model must be a subclass instance of Base")


        self.id = f"uml_{uuid4().hex[:8]}"
        self.add_to_sections()

    def add_to_sections(self):
        mapping = {
            "title": "title_section_config",
            "methods": "method_section_config",
            "constructors": "constructor_section_config",
            "fields": "field_section_config",
            "parameters": "parameter_section_config",
            "constants": "constant_section_config",
        }

        for section_type in self.c_model.allowed_section_types:

            cfg_name = mapping[section_type]
            section = Section(name=section_type, config=self.config.sections[cfg_name])

            if section_type == "title":

                text = t.create_title_text(self.c_model)
                content = [text]

                if self.c_model.stereotype is not None:
                    content.insert(0, self.c_model.stereotype)

                row = Row(
                    anchor="center",
                    align="center",
                    content=content,
                )

                section.rows.append(row)

            else:
                if not getattr(self.c_model, section_type):
                    continue

                items = reversed(getattr(self.c_model, section_type))
                for item in items:
                    text = t.create_module_text(module=item)


                    new_row = Row(
                        anchor="west",
                        align="left",
                        content=[text],
                    )

                    section.rows.append(new_row)

            self.sections.append(section)

    def as_dict(self):
        return {
            'name': self.c_model.name,
            'id': self.id,

            'config': {
                'width': self.config.width,
                'height': self.config.height,

                'x': self.config.x,
                'y': self.config.y,

                'x_margin': self.config.x_margin,

                'font_size': self.config.font_size,
                'baseline_skip': self.config.baseline_skip,

            },

            'sections': [s.as_dict() for s in self.sections],
        }