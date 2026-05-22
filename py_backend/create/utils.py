from py_backend.structural.modifiers import AccessSpecifiers as As
from py_backend.structural.class_modules import *

def depth_until(text, pos):
    depth = 0
    for char in text[:pos]:
        if char == '<':
            depth += 1
        elif char == '>':
            depth = max(0, depth - 1)
    return depth

def text_wrapper(text, threshold=50):
    char_scores = {
        ' ': 30,
        ':': 25,
        ',': 20,
        '(': 10,
        '<': 8,
    }

    new_text = []

    start = 0
    while start < len(text):

        generic_depth = depth_until(text, start)

        best_score = float('-inf')
        best_idx = -1

        end = min(start + threshold, len(text))

        if end == len(text):
            new_text.append(text[start:].strip())
            break

        for i in range(start, end):

            char = text[i]
            if char in char_scores:
                score = (char_scores[char] -
                         (end - (i + 1)) * 2 -
                         generic_depth * 3)
                if score > best_score:
                    best_score = score
                    best_idx = i

            if char == '<':
                generic_depth += 1
            elif char == '>':
                generic_depth = max(0, generic_depth - 1)

        if best_idx == -1:
            best_idx = end - 1

        piece = text[start:best_idx + 1]
        new_text.append(piece.strip())

        start = best_idx + 1

        while start < len(text) and text[start] == ' ':
            start += 1

    return new_text

def as_to_text(accessSpecifier):
    if accessSpecifier == As.PUBLIC:
        return '+'
    elif accessSpecifier == As.PRIVATE:
        return '-'
    elif accessSpecifier == As.PROTECTED:
        return '#'
    else:
        return '~'

def field_to_text(field):
    return f'{as_to_text(field.accessSpecifier)} {field.name}: {field.type_.flatten()}'

def constructor_to_text(constructor):
    return f'{as_to_text(constructor.accessSpecifier)} {constructor.name}({', '.join([parameter_to_text(p) for p in constructor.parameters])})'

def method_to_text(method):
    return f'{as_to_text(method.accessSpecifier)} {method.name}({', '.join([parameter_to_text(p) for p in method.parameters])}): {method.type_.flatten()}'

def parameter_to_text(parameter):
    return f'{parameter.name}: {parameter.type_.flatten()}'

def constant_to_text(constant):
    return f'{constant.name}{tuple(constant.args) if constant.args else ''}'

def create_row_text(module):
    if isinstance(module, Field):
        return field_to_text(module)
    elif isinstance(module, Method):
        return method_to_text(module)
    elif isinstance(module, Constant):
        return constant_to_text(module)
    elif isinstance(module, Parameter):
        return parameter_to_text(module)
    elif isinstance(module, Constructor):
        return constructor_to_text(module)
    else:
        raise TypeError('Unknown module type')