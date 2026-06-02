package app.code_parser.models;
import app.code_parser.Textual;
import app.code_parser.modules.*;

import java.util.List;
public record DefaultEnum(String name,
                           String accessSpecifier,
                           boolean isStatic,
                           List<FieldInfo> fields,
                           List<ConstructorInfo> constructors,
                           List<MethodInfo> methods,
                           List<ConstantInfo> constants,
                           List<String> implements_
) implements DefaultBase {
    @Override
    public String stereotype() {
        return "<< Enum >>";
    }
    @Override
    public List<AllowedModules> allowedModules() {
        return List.of(new AllowedModules("constants", constants()),
                new AllowedModules("fields", fields()),
                new AllowedModules("constructors", constructors()),
                new AllowedModules("methods", methods()));
    }

    @Override
    public String toText() {
        return String.format("%s%s", name(), Textual.modsEnd(this));
    }
}
