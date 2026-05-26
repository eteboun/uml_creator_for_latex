package uml_parser.models;
import uml_parser.modules.ConstructorInfo;
import uml_parser.modules.FieldInfo;
import uml_parser.modules.MethodInfo;
import uml_parser.modules.ParameterInfo;

import java.util.List;

public record DefaultRecord(String name,
                           String accessSpecifier,
                           ClassTypes type_,
                            boolean isFinal,
                            boolean isStatic,
                           List<ParameterInfo> parameters,
                           List<FieldInfo> fields,
                           List<ConstructorInfo> constructors,
                           List<MethodInfo> methods,
                           List<String> implements_
) implements DefaultBase{}
