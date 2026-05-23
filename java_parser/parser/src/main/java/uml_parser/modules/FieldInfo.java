package uml_parser.modules;

public record FieldInfo(String name,
                        String type_,
                        String accessSpecifier,
                        boolean isFinal,
                        boolean isStatic) {}