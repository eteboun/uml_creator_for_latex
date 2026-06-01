package code_parser.modules;

import code_parser.Textual;

public record FieldInfo(String name,
                        String type_,
                        String accessSpecifier,
                        boolean isFinal,
                        boolean isStatic) implements DefaultModule  {
    @Override
    public String toText() {
        return String.format("%s%s: %s%s", Textual.accessSpecifierToText(accessSpecifier()), name(), type_(), Textual.modsEnd(this));
    }

}