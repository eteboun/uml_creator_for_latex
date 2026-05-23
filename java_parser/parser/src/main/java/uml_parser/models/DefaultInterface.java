package uml_parser.models;
import uml_parser.modules.FieldInfo;
import uml_parser.modules.MethodInfo;

import java.util.List;

public record DefaultInterface(String name,
                           String accessSpecifier,
                           ClassTypes type_,
                           List<FieldInfo> fields,
                           List<MethodInfo> methods,
                           List<String> extends_,
                           List<String> permits_
) implements  DefaultBase{}
