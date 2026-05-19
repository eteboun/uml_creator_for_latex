from structural import class_objects as co
from structural import default_types as dt
import subprocess
import json

java_code = """
public class A {
    inek a;
    int b;
    private ArrayList<Double> numis;
    
    void sayHello() {
        System.out.println("Hello");
    }
}
"""

result = subprocess.run(
    ["java", "-jar", "..\\..\\java_parser\\parser\\target\\parser-1.0-SNAPSHOT.jar"],
    input=java_code,
    text=True,
    capture_output=True
)

class_structs = json.loads(result.stdout)
c_objs = []
