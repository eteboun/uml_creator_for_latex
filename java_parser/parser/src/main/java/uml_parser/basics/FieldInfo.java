package uml_parser.basics;

import java.util.List;

public record FieldInfo(String name,
                        String type_,
                        String accessSpecifier,
                        List<String> modifiers) {}