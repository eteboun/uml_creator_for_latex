package code_parser.models;

import code_parser.modules.*;
import code_parser.Textual;

import java.util.List;

public record DefaultClass(String name,
                           String accessSpecifier,
                           boolean isFinal,
                           boolean isAbstract,
                           boolean isStatic,
                           List<FieldInfo> fields,
                           List<ConstructorInfo> constructors,
                           List<MethodInfo> methods,
                           List<String> extends_,
                           List<String> implements_,
                           List<String> permits_
) implements DefaultBase{
    @Override
    public String stereotype() {
        return "";
    }

    @Override
    public List<AllowedModules> allowedModules() {
        return List.of(new AllowedModules("fields", fields()),
                        new AllowedModules("constructors", constructors()),
                         new AllowedModules("methods", methods()));
    }

    @Override
    public String toText() {
        return String.format("%s%s", name(), Textual.modsEnd(this));
    }
}
