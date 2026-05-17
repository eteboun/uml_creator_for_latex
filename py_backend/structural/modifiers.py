from enum import Enum

class Access(Enum):
    PUBLIC = 'public'
    PRIVATE = 'private'
    PROTECTED = 'protected'
    PACKAGE = 'package'
    PACKAGE_PRIVATE = 'package-private'

class NonAccess(Enum):
    FINAL = 'final'
    ABSTRACT = 'abstract'
    STATIC = 'static'
    SEALED = 'sealed'

