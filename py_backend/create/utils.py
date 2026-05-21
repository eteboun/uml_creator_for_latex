from py_backend.structural.modifiers import AccessSpecifiers as As
from py_backend.structural.class_modules import *

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