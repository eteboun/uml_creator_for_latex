def draw_row_lines(cfg: dict, indent: int) -> str:
    rows = [
        f"\\draw (0, {(r+1) * cfg['body_height'] / cfg['num_rows']:.4f}) -- "
        f"({cfg['uml_width']}, {(r + 1) * cfg['body_height'] / cfg['num_rows']:.4f});"
        for r in range(cfg["num_rows"])
    ]


    return f'\n{indent * ' '}'.join(rows)

title = 'queue'
attributes = {
    '- list : ArrayList<T>': 'Holds queue array',
}
operations = {
    '+ Queue()': 'Creates queue object',
    '+ isEmpty() : boolean': 'Returns true if queue has no elements',
    '+ size() : int': 'Returns the size of the queue',
    '+ enqueue(item: T) : void': 'Adds an element to the queue',
    '+ dequeue() : T': 'Removes and returns the first element'
}

cfg = {
    'uml_width' : 10,
    'title_height' : 1,
    'body_height' : 5,

    'attributes': attributes,
    'operations': operations,
    'num_rows' : len(attributes) + len(operations),
}
uml_height = cfg['title_height'] + cfg['body_height']
row_height = cfg['body_height'] / cfg['num_rows']

sample_uml = f"""\\begin{{minipage}}{{0.45\\textwidth}}
    \\begin{{tikzpicture}}
        \\draw[line width=1pt] (0,0) rectangle ({cfg['uml_width']}, {uml_height});
        \\node[align=center,anchor=center] at ({cfg['uml_width'] / 2}, {cfg['body_height'] + cfg['title_height'] / 2}) {{{title}}};
        \\draw[line width=1pt] (0, {cfg['body_height']}) -- ({cfg['uml_width']}, {cfg['body_height']});
        
        {draw_row_lines(cfg, 8)}
        
        
    \\end{{tikzpicture}}
\\end{{minipage}}"""

with open('uml.txt', 'w') as f:
    f.write(sample_uml)