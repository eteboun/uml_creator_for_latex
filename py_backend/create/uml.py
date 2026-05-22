from dataclasses import dataclass, field
from ..structural import class_objects as co
from . import utils as ut
from . import rows as r

@dataclass
class UML:
    title: str
    title_color: str
    title_cell_background_color: str

    row_text_color: str
    row_cell_background_color: str

    font_size: float
    baseline_skip: float

    width: float
    height: float = field(init=False)

    wrapper_threshold: int = field(init=False)

    x_margin: float
    y_margin: float

    c_obj: co.Base

    title_row: r.Row = field(init=False)
    field_rows: list[r.Row] = field(default_factory=list)
    methods_rows: list[r.Row] = field(default_factory=list)
    constant_rows: list[r.Row] = field(default_factory=list)
    constructor_rows: list[r.Row] = field(default_factory=list)

    def __post_init__(self):
        char_width = 0.6 * self.font_size
        self.wrapper_threshold = int((self.width - 2 * self.x_margin) / char_width)

    def get_row_data(self, text):
        lines = ut.text_wrapper(text=text, threshold=self.wrapper_threshold)
        return (len(lines) *
                self.baseline_skip +
                2 * self.y_margin), lines

    def class_to_uml(self):
        row_height, content = self.get_row_data(self.title)


        for f in self.c_obj.fields:
            row_text = ut.create_row_text(f)
            total_height += self.calculate_row_height(row_text)

        for m in self.c_obj.methods:
            row_text = ut.create_row_text(m)
            total_height += self.calculate_row_height(row_text)

        match self.c_obj:
            case co.ClassObj():
                for c in self.c_obj.constructors:
                    row_text = ut.create_row_text(c)
                    total_height += self.calculate_row_height(row_text)

            case co.InterfaceObj():
                stereotype = '<< Interface >>'
                total_height += self.calculate_row_height(stereotype)

            case co.RecordObj():
                for c in self.c_obj.constructors:
                    row_text = ut.create_row_text(c)
                    total_height += self.calculate_row_height(row_text)

            case co.EnumObj():
                stereotype = '<< Enum >>'
                total_height += self.calculate_row_height(stereotype)
                for c in self.c_obj.constructors:
                    row_text = ut.create_row_text(c)
                    total_height += self.calculate_row_height(row_text)
            case _:
                raise NotImplementedError('Base class not allowed')

        self.height = total_height
