package uml_parser.basics;

import java.util.List;

public record MethodInfo(String name,
                        String type_,
                        String accessSpecifier,
                        List<String> modifiers,
                         List<ParameterInfo> parameters) {}