package app.code_parser.modules;

import app.code_parser.Textual;

import java.util.List;

public record MethodInfo(String name,
                        String type_,
                        String accessSpecifier,
                         List<ParameterInfo> parameters,
                         boolean isFinal,
                         boolean isStatic,
                         boolean isAbstract) implements DefaultModule {
    @Override
    public String toText() {
        String parameterText = String.join(", ", parameters().
                stream().
                map(ParameterInfo::toText).
                toList());
        return String.format("%s%s(%s): %s%s", Textual.accessSpecifierToText(accessSpecifier()), name(), parameterText, type_(), Textual.modsEnd(this));
    }
}