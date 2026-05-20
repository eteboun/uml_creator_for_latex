from .structural import default_types as dt
from .structural import class_modules as cm
from dataclasses import dataclass, field
import re

def text_wrapper(text, threshold = 50):
    nodes = (',', '(', ' ')
    new_text = []

    while text:
        if len(text) <= threshold:
            new_text.append(text)
            break

        piece = text[:threshold]
        isPieced = False
        for n in nodes:
            idx = piece.rfind(n)
            if idx != -1:
                new_text.append(piece[:idx + 1].strip())
                text = text[idx + 1:].strip()
                isPieced = True
                break

        if not isPieced:
            new_text.append(piece.strip())
            text = text[threshold:].strip()

    return '\\\\'.join(new_text), len(new_text)

@dataclass
class ParserTracker:
    text: str
    pos: int = field(default=-1, init=False)
    tokens: list = field(default_factory=list, init=False)

    def __post_init__(self):
        tokens = re.split(r'((?:\[\])+|[<>,])', self.text)
        tokens = [t.strip() for t in tokens if t]
        self.tokens = tokens

    def lookahead(self):
        if self.pos + 1 < len(self.tokens):
            return self.tokens[self.pos + 1]
        else:
            return None

    def consume(self):
        if self.pos + 1 < len(self.tokens):
            self.pos += 1
            return self.tokens[self.pos]
        else:
            return None

def parse_type(t):
    name = ''
    dim = 0
    generics = []

    while t.lookahead() is not None and t.lookahead() != ',' and t.lookahead() != '>':
        token = t.consume()
        if token == '<':
            generics = parse_type_list(t)
            t.consume()
        elif token.startswith('['):
            dim = token.count('[')
        else:
            name = token

    return dt.DefType(name=name, dim=dim, generics=generics)

def parse_type_list(t):
    if t.lookahead() == '>':
        return []

    type_ = parse_type(t)
    generics_list = [type_]

    while t.lookahead() == ',':
        t.consume()
        type_ = parse_type(t)
        generics_list.append(type_)
    return generics_list

def parse_fields(fields):
    field_list = []

    for f in fields:
        f['type_'] = parse_type(ParserTracker(text=f['type_']))
        field_list.append(cm.Field(**f))

    return field_list

def parse_methods(methods):
    method_list = []

    for m in methods:
        m['type_'] = parse_type(ParserTracker(text=m['type_']))
        m['parameters'] = parse_parameters(m['parameters'])
        method_list.append(cm.Method(**m))

    return method_list

def parse_parameters(parameters):
    parameter_list = []

    for p in parameters:
        p['type_'] = parse_type(ParserTracker(text=p['type_']))
        parameter_list.append(cm.Parameter(**p))

    return parameter_list