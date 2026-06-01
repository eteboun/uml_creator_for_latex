package code_parser.models;
import code_parser.Textual;
import code_parser.modules.*;

import java.util.List;

public record DefaultRecord(String name,
                           String accessSpecifier,
                            boolean isFinal,
                            boolean isStatic,
                           List<ParameterInfo> parameters,
                           List<FieldInfo> fields,
                           List<ConstructorInfo> constructors,
                           List<MethodInfo> methods,
                           List<String> implements_
) implements DefaultBase{
    @Override
    public String stereotype() {
        return "<< Record >>";
    }

    @Override
    public List<AllowedModules> allowedModules() {
        return List.of(new AllowedModules("parameters", parameters()),
                        new AllowedModules("fields", fields()),
                         new AllowedModules("constructors", constructors()),
                          new AllowedModules("methods", methods()));
    }

    @Override
    public String toText() {
        return String.format("%s%s", name(), Textual.modsEnd(this));
    }
}
