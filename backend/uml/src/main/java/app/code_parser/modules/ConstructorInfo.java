package app.code_parser.modules;

import app.code_parser.Textual;

import java.util.List;

public record ConstructorInfo(String name,
                              String accessSpecifier,
                              List<ParameterInfo> parameters) implements DefaultModule {
    @Override
    public String toText() {
        String parameterText = String.join(", ", parameters().
                stream().
                map(ParameterInfo::toText).
                toList());
        String accessSpecifier = !accessSpecifier().isEmpty() ?
                Textual.accessSpecifierToText(accessSpecifier()) :
                "";
        return String.format("%s%s(%s)",  accessSpecifier, name(), parameterText);
    }
}