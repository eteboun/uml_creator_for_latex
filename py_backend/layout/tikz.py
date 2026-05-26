base_code = r"""
\begin{tikzpicture}[
    transform shape,
    remember picture,
    overlay,
    shift={(current page.south west)}
]

%%UMLS%%

\end{tikzpicture}
"""

def generate_tikz(UMLs):
    latex = [generate_tikz_uml(uml) for uml in UMLs]
    return base_code.replace(
        "%%UMLS%%",
        "\n\n".join(latex)
    )

def generate_tikz_uml(uml):
    latex_pieces = []

    for s in uml.sections:

        for r in s.rows:
            anchor = r.anchor
            color = s.config.text_color

            x = r.position[0]
            y = r.position[1]

            text = '\\\\\n'.join(r.content)
            latex_pieces.append(generate_tikz_node(at_=(x, y),
                                                    anchor=anchor,
                                                    align=r.align,
                                                    font_size=uml.config.font_size,
                                                    baseline_skip=uml.config.baseline_skip,
                                                    color=color,
                                                    text=text))

        from_ = s.position
        to_ = (s.position[0] + uml.config.width, s.position[1] + s.height)
        color = s.config.background_color

        latex_pieces.append(generate_tikz_box(from_=from_,
                                               to_=to_,
                                               color=color))

    latex_pieces.reverse()

    latex = rf"""
    \begin{{scope}}[shift={{({uml.config.x},{uml.config.y})}}]
        \begin{{scope}}[scale={uml.config.scale}]
        {'\n\n'.join(latex_pieces)}
        \end{{scope}}
    \end{{scope}}
    """
    return latex


def generate_tikz_box(from_, to_, color):
    return rf"\draw[fill={color}] {from_} rectangle {to_};"

def generate_tikz_node(at_, anchor, align, font_size, baseline_skip, color, text):
    text = escape_latex(text)
    return (
        rf"\node["
        rf"text={color},"
        rf"anchor={anchor},"
        rf"align={align},"
        rf"font=\ttfamily\fontsize{{{font_size}cm}}{{{baseline_skip}cm}}\selectfont"
        rf"] at {at_} {{{text}}};"
    )

def escape_latex(text):
    return (
        text.replace("_", r"\_")
            .replace("{", r"\{")
            .replace("}", r"\}")
            .replace("&", r"\&")
            .replace("%", r"\%")
            .replace("#", r"\#")
    )
