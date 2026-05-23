package uml_parser.modules;

import java.util.List;

public record ConstructorInfo(String name,
                              String accessSpecifier,
                              List<ParameterInfo> parameters) {}