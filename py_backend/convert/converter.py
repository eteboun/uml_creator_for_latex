from .structural import class_objects as co
from .structural import default_types as dt
from . import utils as ut
import subprocess
import json

java_code = """
public class A {
    inek a;
    int b;
    private ArrayList<A<B>,C[], D<K>[]>[][] numis;
    
    void sayHello(int sayi) {
        System.out.println("Hello");
    }
}
"""

result = subprocess.run(
    ["java", "-jar", "..\\java_parser\\parser\\target\\parser-1.0-SNAPSHOT.jar"],
    input=java_code,
    text=True,
    capture_output=True
)
class_structs = json.loads(result.stdout)
c_objs = []

for cs in class_structs:
    cs['type_'] = t = dt.ClassType(cs['type_'])
    cs['fields'] = ut.parse_fields(cs['fields'])
    cs['methods'] = ut.parse_methods(cs['methods'])

    if t == dt.ClassType.CLASS:
        c_obj = co.ClassObj(**cs)

    elif t == dt.ClassType.RECORD:
        c_obj = co.RecordObj(**cs)

    elif t == dt.ClassType.INTERFACE:
        c_obj = co.InterfaceObj(**cs)

    else:
        c_obj = co.EnumObj(**cs)

    c_objs.append(c_obj)
