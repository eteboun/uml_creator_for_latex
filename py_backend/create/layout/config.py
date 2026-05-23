from dataclasses import dataclass

@dataclass
class SectionConfig:
    background_color: str
    text_color: str

@dataclass
class UMLConfig:
    font_size: float
    baseline_skip: float

    width: float

    x_margin: float
    y_margin: float

    init_x: float
    init_y: float

    title_section_config: SectionConfig
    field_section_config: SectionConfig
    method_section_config: SectionConfig
    constant_section_config: SectionConfig
    parameter_section_config: SectionConfig
    constructor_section_config: SectionConfig