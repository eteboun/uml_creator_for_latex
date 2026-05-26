from dataclasses import dataclass, field
from py_backend.layout.config import UMLConfig
from py_backend.structural import class_models as cm, default_types as dt
from .. import textual as t
from .rows import Row
from .sections import Section
from uuid import uuid4

@dataclass
class UML:

    config: UMLConfig
    c_model: cm.Base

    height: float = field(init=False)
    id: str = field(init=False)

    wrapper_threshold: int = field(init=False)
    sections: list[Section] = field(default_factory=list, init=False)

    def __post_init__(self):

        if type(self.c_model) is cm.Base:
            raise TypeError("c_model cannot be Base directly")

        if not isinstance(self.c_model, cm.Base):
            raise TypeError("c_model must be a subclass instance of Base")

        char_width = 0.6 * self.config.font_size
        self.wrapper_threshold = int((self.config.width - 2 * self.config.x_margin) / char_width)

        self.id = f"uml_{uuid4().hex[:8]}"

        self.class_to_rows()

    def get_row_lines(self, text):
        lines = t.text_wrapper(text=text, threshold=self.wrapper_threshold)
        return lines

    def get_row_height(self, lines):
        return ((len(lines) - 1) *
                self.config.baseline_skip +
                2 * self.config.y_margin + self.config.font_size)

    def add_to_module_sections(self):
        mapping = {
            "methods": "method_section_config",
            "constructors": "constructor_section_config",
            "fields": "field_section_config",
            "parameters": "parameter_section_config",
            "constants": "constant_section_config",
        }

        for attr_name, target_config in mapping.items():

            if not hasattr(self.c_model, attr_name):
                continue

            target_section = Section(name=attr_name, config=self.config.sections[target_config])
            items = reversed(getattr(self.c_model, attr_name))
            for item in items:
                row_text = t.create_row_text(module=item)

                row_lines = self.get_row_lines(row_text)
                row_height = self.get_row_height(row_lines)

                new_row = Row(
                    height=row_height,
                    anchor="west",
                    align="left",
                    content=row_lines,
                    lines=len(row_lines),
                )
                target_section.rows.append(new_row)
            self.sections.append(target_section)

    def add_to_title_section(self, stereotype):
        title_text = t.title_to_text(self.c_model)
        t_lines = self.get_row_lines(title_text)

        if stereotype is not None:
            s_lines = self.get_row_lines(stereotype)
            t_lines = s_lines + t_lines

        t_height = self.get_row_height(t_lines)

        title_row = Row(
            height=t_height,
            anchor="center",
            align="center",
            content=t_lines,
            lines=len(t_lines),
        )

        title_section = Section(name="title", config=self.config.sections['title_section_config'])
        title_section.rows.append(title_row)

        self.sections.append(title_section)

    def create_sections(self):

        sec_x = 0
        sec_y = 0

        for s in self.sections:
            s.position = (sec_x, sec_y)

            for row in s.rows:
                row_x = sec_x + self.config.x_margin if s.name != 'title' else sec_x + self.config.width / 2
                row_y = sec_y + row.height / 2

                row.position = (row_x, row_y)
                sec_y += row.height

            s.height = sec_y - s.position[1]

        self.height = sec_y

    def class_to_rows(self):
        self.add_to_module_sections()

        stereotype = dt.STEREOTYPES[type(self.c_model)]
        self.add_to_title_section(stereotype)

        self.create_sections()

    def update_uml(self, x: float, y: float, scale: float):
        self.config.x = x
        self.config.y = y
        self.config.scale = scale

    def as_dict(self):
        return {
            'name': self.c_model.name,
            'id': self.id,

            'x': self.config.x,
            'y': self.config.y,

            'font_size': self.config.font_size,
            'baseline_skip': self.config.baseline_skip,

            'scale': self.config.scale,

            'sections': [s.as_dict() for s in self.sections],
        }
