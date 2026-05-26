package uml_parser.models;
import uml_parser.modules.ConstructorInfo;
import uml_parser.modules.FieldInfo;
import uml_parser.modules.MethodInfo;

import java.util.List;

public record DefaultClass(String name,
                           String accessSpecifier,
                           ClassTypes type_,
                           boolean isFinal,
                           boolean isAbstract,
                           boolean isStatic,
                           List<FieldInfo> fields,
                           List<ConstructorInfo> constructors,
                           List<MethodInfo> methods,
                           List<String> extends_,
                           List<String> implements_,
                           List<String> permits_
) implements DefaultBase{}
