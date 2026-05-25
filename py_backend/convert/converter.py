from py_backend.structural import class_models as cmodels
from py_backend.convert import parsers as p
import subprocess
import json

class Converter:

    @staticmethod
    def run(java_code):

        result = subprocess.run(
            ["java", "-jar", f"..\\java_parser\\parser\\target\\parser-1.0-SNAPSHOT.jar"],
            input=java_code,
            text=True,
            capture_output=True
        )
        class_structs = json.loads(result.stdout)
        c_models = []

        for cs in class_structs:
            t = cs.pop('type_', None)
            cs['fields'] = p.parse_fields(cs['fields'])
            cs['methods'] = p.parse_methods(cs['methods'])

            if t == 'CLASS':
                cs['constructors'] = p.parse_constructors(cs['constructors'])
                c_model = cmodels.ClassObj(**cs)

            elif t == 'RECORD':
                cs['parameters'] = p.parse_parameters(cs['parameters'])
                cs['constructors'] = p.parse_constructors(cs['constructors'])
                c_model = cmodels.RecordObj(**cs)

            elif t == 'INTERFACE':
                c_model = cmodels.InterfaceObj(**cs)

            elif t == 'ENUM':
                cs['constants'] = p.parse_constants(cs['constants'])
                cs['constructors'] = p.parse_constructors(cs['constructors'])
                c_model = cmodels.EnumObj(**cs)
            else:
                raise TypeError('Invalid class type')
            c_models.append(c_model)

        return c_models