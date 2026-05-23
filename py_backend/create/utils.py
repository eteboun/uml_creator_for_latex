def generate_latex_uml(uml):
    latex_pieces = []

    for s in uml.sections:
        from_ = s.position
        to_ = (s.position[0] + uml.config.width, s.position[1] + s.height)
        color = s.config.background_color

        latex_pieces.append(generate_latex_box(from_, to_, color))

        for r in s.rows:
            anchor = r.anchor
            color = s.config.text_color

            x = r.position[0] + uml.config.width / 2 if s.name == 'title' else r.position[0] + uml.config.x_margin
            y = r.position[1] + uml.config.y_margin

            for c in reversed(r.content):
                latex_pieces.append(generate_latex_node((x,y), anchor, uml.config.font_size, color, c))
                y += uml.config.baseline_skip

    return '\n'.join(latex_pieces)

def generate_latex_box(from_, to_, color):
    return f"\\draw[fill={color}] {from_} rectangle {to_};"

def generate_latex_node(at_, anchor, font_size, color, text):
    text = escape_latex(text)
    return (
        f"\\node["
        f"text={color}, "
        f"anchor={anchor}, "
        f"font=\\fontsize{{{font_size}cm}}{{{font_size * 1.2}cm}}\\selectfont"
        f"] at {at_} {{{text}}};"
    )

def generate_latex_line(from_, to_):
    return f"\\draw {from_} -- {to_};"

def escape_latex(text):
    return (
        text.replace("\\", r"\textbackslash{}")
            .replace("_", r"\_")
            .replace("{", r"\{")
            .replace("}", r"\}")
            .replace("&", r"\&")
            .replace("%", r"\%")
            .replace("#", r"\#")
    )
