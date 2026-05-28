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

    y_margin: float = field(init=False)
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

        self.add_to_sections()
        self.calculate_y_margin()

    def calculate_y_margin(self):
        total_lines_height = sum([self.get_lines_height(row.lines)
                                  for section in self.sections
                                  for row in section.rows])

        if self.config.height < total_lines_height:
            raise ValueError("height cannot be less than total_lines_height")

        total_paddings = sum([len(section.rows) + 1 for section in self.sections])
        self.y_margin = (self.config.height - total_lines_height) / total_paddings
        self.set_positions()

    def get_lines_height(self, lines):
        return ((len(lines) - 1) *
                self.config.baseline_skip +
                self.config.font_size)

    def get_row_height(self, row):
        return ((len(row.lines) - 1) *
                self.config.baseline_skip +
                self.config.font_size +
                self.y_margin)

    def set_positions(self):

        sec_x = 0
        sec_y = 0
        for s in self.sections:
            s.position = (sec_x, sec_y)

            row_x = self.config.x_margin if s.name != 'title' else self.config.width / 2
            row_y = self.y_margin
            for row in s.rows:
                row.height = self.get_row_height(row)
                row.position = (row_x, row_y + (row.height - self.y_margin) / 2)

                sec_y += row.height
                row_y += row.height

            row_y += self.y_margin
            sec_y += self.y_margin
            s.height = sec_y - s.position[1]

    def add_to_sections(self):
        mapping = {
            "title": "title_section_config",
            "methods": "method_section_config",
            "constructors": "constructor_section_config",
            "fields": "field_section_config",
            "parameters": "parameter_section_config",
            "constants": "constant_section_config",
        }

        for section_type in reversed(self.c_model.allowed_section_types):

            cfg_name = mapping[section_type]
            section = Section(name=section_type, config=self.config.sections[cfg_name])

            if section_type == "title":

                text = t.create_title_text(self.c_model)
                content = [text]

                lines = t.text_wrapper(text, threshold=self.wrapper_threshold)
                if self.c_model.stereotype is not None:
                    content.insert(0, self.c_model.stereotype)

                    s_lines = t.text_wrapper(self.c_model.stereotype, threshold=self.wrapper_threshold)
                    lines = s_lines + lines

                row = Row(
                    anchor="center",
                    align="center",
                    content=content,
                    lines=lines,
                )

                section.rows.append(row)

            else:
                if not getattr(self.c_model, section_type):
                    continue

                items = reversed(getattr(self.c_model, section_type))
                for item in items:
                    text = t.create_module_text(module=item)

                    lines = t.text_wrapper(text, threshold=self.wrapper_threshold)

                    new_row = Row(
                        anchor="west",
                        align="left",
                        content=[text],
                        lines=lines,
                    )

                    section.rows.append(new_row)

            self.sections.append(section)

    def update_uml(self, x: float, y: float, scale: float):
        self.config.x = x
        self.config.y = y
        self.config.scale = scale

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
                'y_margin': self.y_margin,

                'font_size': self.config.font_size,
                'baseline_skip': self.config.baseline_skip,

            },

            'sections': [s.as_dict() for s in self.sections],
        }