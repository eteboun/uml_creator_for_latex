from dataclasses import dataclass
from typing import ClassVar
import json

@dataclass
class SectionConfig:
    background_color: str
    text_color: str

    proper_types: ClassVar[dict] = {
        'background_color': str,
        'text_color': str,
    }

    @classmethod
    def validate_dict(cls, d):
        if len(cls.proper_types) > len(d):
            raise TypeError("Too many keys")

        for key in cls.proper_types:
            if not key in d:
                raise TypeError(f"SectionConfig requires key {key}")

            if not isinstance(d[key], cls.proper_types[key]):
                raise TypeError(f"Incorrect type for key {key}")

    @classmethod
    def from_dict(cls, d):
        return cls(**d)

    def as_dict(self):
        return {
            "background_color": self.background_color,
            "text_color": self.text_color,
        }

@dataclass
class UMLConfig:
    font_size: float
    baseline_skip: float

    width: float
    height: float

    x_margin: float

    x: float
    y: float


    sections: dict[str, SectionConfig]

    proper_types: ClassVar[dict] = {
        "font_size": float | int,
        "baseline_skip": float | int,

        "width": float | int,
        "height": float | int,

        "x_margin": float | int,

        "x": float | int,
        "y": float | int,

        "sections": dict,
    }

    section_names: ClassVar[list] = [
        "title_section_config",
        "field_section_config",
        "method_section_config",
        "constant_section_config",
        "parameter_section_config",
        "constructor_section_config"
    ]

    @classmethod
    def validate_dict(cls, d):
        if len(cls.proper_types) < len(d):
            raise TypeError("Too many keys")

        for key in cls.proper_types:
            if key not in d:
                raise TypeError(f"SectionConfig requires key {key}")

            if not isinstance(d[key], cls.proper_types[key]):
                raise TypeError(f"Incorrect type for key {key}")

        if len(cls.section_names) < len(d['sections']):
            raise TypeError("Incorrect number of required sections")

        for section_name in cls.section_names:
            if section_name not in d['sections'].keys():
                raise TypeError(f"SectionConfig requires section {section_name}")

            SectionConfig.validate_dict(d['sections'][section_name])

    @classmethod
    def from_dict(cls, d):
        cls.validate_dict(d)
        for section_name in cls.section_names:
            d["sections"][section_name] = SectionConfig.from_dict(d['sections'][section_name])

        return UMLConfig(**d)

def create_uml_config(addr):
    with open(addr, "r") as f:
        cfg = json.load(f)

    return UMLConfig.from_dict(cfg)