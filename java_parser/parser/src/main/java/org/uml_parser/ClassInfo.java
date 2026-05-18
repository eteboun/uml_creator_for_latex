package org.uml_parser;

import java.util.List;

public record ClassInfo(String name,
                        String accessSpecifier,
                        ClassTypes type,
                        List<String> modifiers,
                        List<FieldInfo> fields,
                        List<MethodInfo> methods,
                        List<String> extends_,
                        List<String> implements_,
                        List<String> permits_
                        ) {
}
