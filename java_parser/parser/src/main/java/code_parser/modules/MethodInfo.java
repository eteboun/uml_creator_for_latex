package code_parser.modules;

import code_parser.NotationTextable;
import code_parser.Textual;

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
        return String.format("%s%s: %s%s", Textual.accessSpecifierToText(accessSpecifier()), name(), type_(), Textual.modsEnd(this));
    }
}