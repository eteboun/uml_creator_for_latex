from ..convert.converter import Converter

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

c_objs = Converter.run()
print(c_objs)
