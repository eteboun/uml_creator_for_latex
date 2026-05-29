from py_backend.structural.modifiers import AccessSpecifiers as As
from py_backend.structural.class_modules import *

def as_to_text(accessSpecifier):
    if accessSpecifier == As.PUBLIC:
        return '+ '
    elif accessSpecifier == As.PRIVATE:
        return '- '
    elif accessSpecifier == As.PROTECTED:
        return '# '
    else:
        return ''

def field_to_text(field):
    mods = []
    for prop, name in field.allowed_modifiers.items():
        if prop == "isFinal":
            continue
        if getattr(field, prop, False):
            mods.append(name)

    end = f" {{{', '.join(mods)}}}" if mods else ''
    return (f'{as_to_text(field.accessSpecifier)}{field.name}:'
            f' {field.type_.flatten()}{end}')

def constructor_to_text(constructor):
    return (f'{as_to_text(constructor.accessSpecifier)}{constructor.name}'
            f'({', '.join([parameter_to_text(p) for p in constructor.parameters])})')

def method_to_text(method):
    mods = []
    for prop, name in method.allowed_modifiers.items():
        if prop == "isFinal":
            continue
        if getattr(method, prop, False):
            mods.append(name)

    end = f" {{{', '.join(mods)}}}" if mods else ''

    parameters = ', '.join(
        parameter_to_text(p)
        for p in method.parameters
    )

    return (f'{as_to_text(method.accessSpecifier)}{method.name}'
            f'({parameters}):'
            f' {method.type_.flatten()}{end}')

def parameter_to_text(parameter):
    return (f'{parameter.name}:'
            f' {parameter.type_.flatten()}')

def constant_to_text(constant):
    return f'{constant.name}{tuple(constant.args) if constant.args else ''}'

def create_title_text(cmodel):
    mods = []
    for prop, name in cmodel.allowed_modifiers.items():
        if prop == "isFinal":
            continue
        if getattr(cmodel, prop, False):
            mods.append(name)

    end = f" {{{', '.join(mods)}}}" if mods else ''
    return f'{cmodel.name}{end}'

def create_module_text(module):
    mapping = {
        Field: field_to_text,
        Constructor: constructor_to_text,
        Method: method_to_text,
        Parameter: parameter_to_text,
        Constant: constant_to_text,
    }

    for module_type, func in mapping.items():
        if isinstance(module, module_type):
            return func(module)

    raise TypeError('Unknown module type')
