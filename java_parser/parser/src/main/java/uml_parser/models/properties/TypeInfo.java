package uml_parser.models.properties;
import uml_parser.models.ClassTypes;

import java.util.List;

public interface TypeInfo {
    String name();
    String accessSpecifier();
    ClassTypes type_();
    List<String> modifiers();
}
