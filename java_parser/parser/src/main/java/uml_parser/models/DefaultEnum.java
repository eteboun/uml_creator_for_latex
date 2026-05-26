package uml_parser.models;
import uml_parser.modules.ConstantInfo;
import uml_parser.modules.ConstructorInfo;
import uml_parser.modules.FieldInfo;
import uml_parser.modules.MethodInfo;

import java.util.List;
public record DefaultEnum(String name,
                           String accessSpecifier,
                           ClassTypes type_,
                           boolean isStatic,
                           List<FieldInfo> fields,
                           List<ConstructorInfo> constructors,
                           List<MethodInfo> methods,
                           List<ConstantInfo> constants,
                           List<String> implements_
) implements DefaultBase{}
