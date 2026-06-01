package code_parser.models;

import code_parser.modules.AllowedModules;
import java.util.List;

public interface DefaultBase {
    String stereotype();
    String name();
    String accessSpecifier();
    boolean isStatic();
    List<AllowedModules> allowedModules();

    String toText();
}
