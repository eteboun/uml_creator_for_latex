from enum import Enum

class AccessSpecifiers(Enum):
    PUBLIC = 'public'
    PRIVATE = 'private'
    PROTECTED = 'protected'
    PACKAGE_PRIVATE = ''

class Modifiers(Enum):
    FINAL = 'final'
    ABSTRACT = 'abstract'
    STATIC = 'static'
    SEALED = 'sealed'

