from dataclasses import dataclass, field
from py_backend.create.layout.config import UMLConfig
from py_backend.structural import class_models as co, default_types as dt
from py_backend.create.layout import textual as t
from .rows import Row
from .sections import Section

@dataclass
class UML:

    config: UMLConfig
    c_model: co.Base

    wrapper_threshold: int = field(init=False)
    height: float = field(init=False)

    sections: list[Section] = field(default_factory=list, init=False)

    def __post_init__(self):

        if type(self.c_model) is co.Base:
            raise TypeError("c_model cannot be Base directly")

        if not isinstance(self.c_model, co.Base):
            raise TypeError("c_model must be a subclass instance of Base")

        char_width = 0.6 * self.config.font_size
        self.wrapper_threshold = int((self.config.width - 2 * self.config.x_margin) / char_width)

        self.class_to_rows()

    def get_row_lines(self, text):
        lines = t.text_wrapper(text=text, threshold=self.wrapper_threshold)
        return lines

    def get_row_height(self, lines):

        return (len(lines) * self.config.font_size +
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
                row_content = '\\\\\n'.join(row_lines)
                row_height = self.get_row_height(row_lines)

                new_row = Row(
                    height=row_height,
                    anchor="south west",
                    align="left",
                    content=row_content,
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
        t_content = '\\\\'.join(t_lines)

        title_row = Row(
            height=t_height,
            anchor="south",
            align="center",
            content=t_content,
            lines=len(t_lines),
        )

        title_section = Section(name="title", config=self.config.sections['title_section_config'])
        title_section.rows.append(title_row)

        self.sections.append(title_section)

    def create_sections(self):

        x = self.config.init_x
        y = self.config.init_y

        for s in self.sections:
            s.position = (x, y)

            for row in s.rows:
                row.position = (x + self.config.width / 2 - self.config.x_margin, y) if s.name == 'title' else (x, y)
                y += row.height

            s.height = y - s.position[1]

        self.height = y - self.config.init_y

    def class_to_rows(self):
        self.add_to_module_sections()

        stereotype = dt.STEREOTYPES[type(self.c_model)]
        self.add_to_title_section(stereotype)

        self.create_sections()
