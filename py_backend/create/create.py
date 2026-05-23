from ..convert.converter import Converter
from .layout import config
from .layout.components import uml
from . import tikz as t

c_model = Converter.run()[0]
cfg = config.create_uml_config('.\\py_backend\\config.json')

new_uml = uml.UML(config=cfg, c_model=c_model)
print(t.generate_latex_uml(new_uml))