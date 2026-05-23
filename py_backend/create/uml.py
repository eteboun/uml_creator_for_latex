from dataclasses import dataclass, field
from ..structural import class_objects as co, default_types as dt
from . import utils as ut
from . import rows as r

@dataclass
class UML:

    title_cell_background_color: str
    row_cell_background_color: str

    font_size: float
    baseline_skip: float

    width: float
    height: float = field(init=False)

    wrapper_threshold: int = field(init=False)

    text_color: str

    x_margin: float
    y_margin: float

    init_x: float
    init_y: float

    c_obj: co.Base
    title: str = field(init=False)

    title_row: r.Row = field(init=False)
    field_rows: list[r.Row] = field(default_factory=list, init=False)
    method_rows: list[r.Row] = field(default_factory=list, init=False)
    constant_rows: list[r.Row] = field(default_factory=list, init=False)
    constructor_rows: list[r.Row] = field(default_factory=list, init=False)
    parameter_rows: list[r.Row] = field(default_factory=list, init=False)

    def __post_init__(self):

        if type(self.c_obj) is co.Base:
            raise TypeError("c_obj cannot be Base directly")

        if not isinstance(self.c_obj, co.Base):
            raise TypeError("c_obj must be a subclass instance of Base")

        char_width = 0.6 * self.font_size
        self.wrapper_threshold = int((self.width - 2 * self.x_margin) / char_width)

        self.title = self.c_obj.name

    def get_row_content(self, text):
        lines = ut.text_wrapper(text=text, threshold=self.wrapper_threshold)
        return lines

    def get_row_height(self, content):
        return (len(content) *
         self.baseline_skip +
         2 * self.y_margin)

    def add_to_module_rows(self):
        mapping = {
            "fields": self.field_rows,
            "methods": self.method_rows,
            "constants": self.constant_rows,
            "constructors": self.constructor_rows,
            "parameters": self.parameter_rows,
        }

        for attr_name, target_rows in mapping.items():
            if not hasattr(self.c_obj, attr_name):
                continue

            for item in getattr(self.c_obj, attr_name):
                row_text = ut.create_row_text(module=item)

                row_content = self.get_row_content(row_text)
                row_height = self.get_row_height(row_content)

                new_row = r.Row(
                    height=row_height,
                    anchor="west",
                    content=row_content
                )
                target_rows.append(new_row)

        raise TypeError("Unknown module type")

    def add_to_title_row(self, stereotype):
        t_content = self.get_row_content(self.title)

        if stereotype is not None:
            s_content = self.get_row_content(stereotype)
            t_content = t_content + s_content

        t_height = self.get_row_height(t_content)

        self.title_row = r.Row(
            height=t_height,
            anchor="center",
            content=t_content
        )

    def class_to_rows(self):

        stereotype = dt.STEREOTYPES[type(self.c_obj)]
        self.add_to_module_rows()
        self.add_to_title_row(stereotype)


