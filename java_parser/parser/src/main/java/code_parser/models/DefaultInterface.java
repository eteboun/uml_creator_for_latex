package code_parser.models;
import code_parser.Textual;
import code_parser.modules.AllowedModules;
import code_parser.modules.DefaultModule;
import code_parser.modules.FieldInfo;
import code_parser.modules.MethodInfo;

import java.util.List;
import java.util.Map;

public record DefaultInterface(String name,
                           String accessSpecifier,
                               boolean isFinal,
                               boolean isAbstract,
                               boolean isStatic,
                           List<FieldInfo> fields,
                           List<MethodInfo> methods,
                           List<String> extends_,
                           List<String> permits_
) implements  DefaultBase{
    @Override
    public String stereotype() {
        return "<< Interface >>";
    }

    @Override
    public List<AllowedModules> allowedModules() {
        return List.of(new AllowedModules("fields", fields()),
                        new AllowedModules("methods", methods()));
    }

    @Override
    public String toText() {
        return String.format("%s%s", name(), Textual.modsEnd(this));
    }
}
