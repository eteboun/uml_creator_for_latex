from dataclasses import dataclass, field
from .config import UMLConfig
from py_backend.structural import class_models as co, default_types as dt
from . import utils as ut
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

    def get_row_content(self, text):
        lines = ut.text_wrapper(text=text, threshold=self.wrapper_threshold)
        return lines

    def get_row_height(self, content):
        return (len(content) *
         self.config.baseline_skip +
         2 * self.config.y_margin)

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

            target_section = Section(name=attr_name, config=getattr(self.config, target_config))
            items = reversed(getattr(self.c_model, attr_name))
            for item in items:
                row_text = ut.create_row_text(module=item)

                row_content = self.get_row_content(row_text)
                row_height = self.get_row_height(row_content)

                new_row = Row(
                    height=row_height,
                    anchor="west",
                    content=row_content
                )
                target_section.rows.append(new_row)
            self.sections.append(target_section)

    def add_to_title_section(self, stereotype):
        title_text = ut.title_to_text(self.c_model)
        t_content = self.get_row_content(title_text)

        if stereotype is not None:
            s_content = self.get_row_content(stereotype)
            t_content = s_content + t_content

        t_height = self.get_row_height(t_content)

        title_row = Row(
            height=t_height,
            anchor="center",
            content=t_content
        )

        title_section = Section(name="title", config=self.config.title_section_config)
        title_section.rows.append(title_row)

        self.sections.append(title_section)

    def set_coordinates(self):

        current_y = self.config.init_y
        for s in self.sections:
            s.position = (self.config.init_x, current_y)

            for row in s.rows:
                row.position = (self.config.init_x, current_y)
                current_y += row.height

            s.height = current_y - s.position[1]

        self.height = current_y - self.config.init_y

    def class_to_rows(self):
        self.add_to_module_sections()

        stereotype = dt.STEREOTYPES[type(self.c_model)]
        self.add_to_title_section(stereotype)

        self.set_coordinates()
