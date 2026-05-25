def generate_tikz_uml(uml):
    latex_pieces = []

    for s in uml.sections:

        for r in s.rows:
            anchor = r.anchor
            color = s.config.text_color

            x = r.position[0]
            y = r.position[1]

            latex_pieces.append(generate_tikz_node(at_=(x, y),
                                                    anchor=anchor,
                                                    align=r.align,
                                                    font_size=uml.config.font_size,
                                                    baseline_skip=uml.config.baseline_skip,
                                                    color=color,
                                                    text=r.content))

        from_ = s.position
        to_ = (s.position[0] + uml.config.width, s.position[1] + s.height)
        color = s.config.background_color

        latex_pieces.append(generate_tikz_box(from_=from_,
                                               to_=to_,
                                               color=color))

    latex_pieces.reverse()
    return '\n'.join(latex_pieces)


def generate_tikz_box(from_, to_, color):
    return f"\\draw[fill={color}] {from_} rectangle {to_};"

def generate_tikz_node(at_, anchor, align, font_size, baseline_skip, color, text):
    text = escape_latex(text)
    return (
        f"\\node["
        f"text={color},"
        f"anchor={anchor},"
        f"align={align},"
        f"font=\\fontsize{{{font_size}cm}}{{{baseline_skip}cm}}\\selectfont"
        f"] at {at_} {{{text}}};"
    )

def generate_tikz_line(from_, to_):
    return f"\\draw {from_} -- {to_};"

def escape_latex(text):
    return (
        text.replace("_", r"\_")
            .replace("{", r"\{")
            .replace("}", r"\}")
            .replace("&", r"\&")
            .replace("%", r"\%")
            .replace("#", r"\#")
    )
