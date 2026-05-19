package uml_parser.models;
import uml_parser.basics.FieldInfo;
import uml_parser.basics.MethodInfo;
import uml_parser.properties.*;

import java.util.List;

public record DefaultInterface(String name,
                           String accessSpecifier,
                           ClassTypes type_,
                           List<String> modifiers,
                           List<FieldInfo> fields,
                           List<MethodInfo> methods,
                           List<String> extends_,
                           List<String> permits_
) implements TypeInfo, HasFields, HasMethods, HasExtends, HasPermits {}
