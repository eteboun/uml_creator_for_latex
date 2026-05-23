from ..convert.converter import Converter
from .layout import uml, config
from . import utils as ut

base_line = r"""
\documentclass[a4paper]{article}

\usepackage{tikz}
\usepackage{tikzpagenodes}
\begin{document}

\begin{tikzpicture}[
    remember picture,
    overlay,
    shift={(current page.south west)}]

        
        
        
    \end{tikzpicture}
\end{document}
"""

c_model = Converter.run()[0]
cfg = config.create_uml_config('.\\py_backend\\config.json')

new_uml = uml.UML(config=cfg, c_model=c_model)
print(ut.generate_latex_uml(new_uml))