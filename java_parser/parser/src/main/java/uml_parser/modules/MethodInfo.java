package uml_parser.modules;

import java.util.List;

public record MethodInfo(String name,
                        String type_,
                        String accessSpecifier,
                         List<ParameterInfo> parameters,
                         boolean isFinal,
                         boolean isStatic,
                         boolean isAbstract) {}