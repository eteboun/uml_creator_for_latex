from py_backend.structural import class_models as cmodels
from . import utils as ut
import subprocess
import json

java_code = """
import java.util.ArrayList;

public class Queue<T> {
    final private ArrayList<T> list = new ArrayList<>();

    Queue() {}

    public boolean isEmpty() {
        return list.isEmpty();
    }
    public int size() {
        return list.size();
    }
    public void enqueue(T item) {
        list.add(item);
    }
    public T dequeue() {
        T item = list.getFirst();
        list.removeFirst();
        return item;
    }
}

"""

class Converter:

    @staticmethod
    def run():

        result = subprocess.run(
            ["java", "-jar", f"java_parser\\parser\\target\\parser-1.0-SNAPSHOT.jar"],
            input=java_code,
            text=True,
            capture_output=True
        )
        class_structs = json.loads(result.stdout)
        c_models = []

        for cs in class_structs:
            t = cs.pop('type_', None)
            cs['fields'] = ut.parse_fields(cs['fields'])
            cs['methods'] = ut.parse_methods(cs['methods'])

            if t == 'CLASS':
                cs['constructors'] = ut.parse_constructors(cs['constructors'])
                c_model = cmodels.ClassObj(**cs)

            elif t == 'RECORD':
                cs['parameters'] = ut.parse_parameters(cs['parameters'])
                cs['constructors'] = ut.parse_constructors(cs['constructors'])
                c_model = cmodels.RecordObj(**cs)

            elif t == 'INTERFACE':
                c_model = cmodels.InterfaceObj(**cs)

            elif t == 'ENUM':
                cs['constants'] = ut.parse_constants(cs['constants'])
                cs['constructors'] = ut.parse_constructors(cs['constructors'])
                c_model = cmodels.EnumObj(**cs)
            else:
                raise TypeError('Invalid class type')
            c_models.append(c_model)

        return c_models