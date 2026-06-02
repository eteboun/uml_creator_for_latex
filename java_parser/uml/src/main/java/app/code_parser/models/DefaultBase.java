package app.code_parser.models;

import app.code_parser.NotationTextable;
import app.code_parser.modules.AllowedModules;
import java.util.List;

public interface DefaultBase extends NotationTextable {
    String stereotype();
    String name();
    String accessSpecifier();
    boolean isStatic();
    List<AllowedModules> allowedModules();
}
