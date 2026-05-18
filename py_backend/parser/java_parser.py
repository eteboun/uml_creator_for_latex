import subprocess
import json

java_code = """
public class A {
    int x;
}
"""

result = subprocess.run(
    ["java", "-jar", "..\\..\\java_parser\\parser\\target\\parser-1.0-SNAPSHOT.jar"],
    input=java_code,
    text=True,
    capture_output=True
)

class_struct = json.loads(result.stdout)
print(class_struct[0])