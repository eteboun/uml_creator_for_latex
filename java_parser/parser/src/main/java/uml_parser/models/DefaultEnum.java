package uml_parser.models;
import uml_parser.basics.ConstantInfo;
import uml_parser.basics.ConstructorInfo;
import uml_parser.basics.FieldInfo;
import uml_parser.basics.MethodInfo;
import uml_parser.properties.*;

import java.util.List;
public record DefaultEnum(String name,
                           String accessSpecifier,
                           ClassTypes type_,
                           List<String> modifiers,
                           List<FieldInfo> fields,
                           List<ConstructorInfo> constructors,
                           List<MethodInfo> methods,
                           List<ConstantInfo> constants,
                           List<String> implements_
) implements TypeInfo, HasFields, HasMethods, HasImplements, HasConstants, HasConstructors {}
