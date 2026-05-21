package uml_parser.basics;

import java.util.List;

public record ConstructorInfo(String name,
                              String accessSpecifier,
                              List<ParameterInfo> parameters) {}