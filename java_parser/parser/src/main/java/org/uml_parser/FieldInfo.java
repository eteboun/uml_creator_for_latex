package org.uml_parser;

import java.util.List;

public record FieldInfo(String name,
                        String type,
                        String accessSpecifier,
                        List<String> modifiers) {}