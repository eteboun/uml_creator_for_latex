from dataclasses import dataclass, field
from ..structural import class_objects as co

@dataclass
class UML:
    title: str
    title_color: str
    title_cell_background_color: str

    row_text_color: str
    row_cell_background_color: str

    font_size: int
    baseline_skip: int

    height: int
    width: int

    x_margin: int
    y_margin: int = field(init=False)

    c_obj: co.Base

    def calculate_y_margin(self):
        pass

    def calculate_wrapper_threshold(self):
        char_width = 0.6 * self.font_size
        self.wrapper_threshold = (self.width - 2 * self.x_margin) // char_width
