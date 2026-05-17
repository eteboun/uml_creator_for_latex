package org.uml_parser;

import java.util.List;

public record MethodInfo(String name,
                        String rType,
                        String accessSpecifier,
                        List<String> modifiers,
                         List<ParameterInfo> parameters) {}