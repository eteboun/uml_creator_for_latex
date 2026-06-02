package code_parser.modules;

import code_parser.NotationTextable;
import code_parser.Textual;

import java.util.ArrayList;
import java.util.List;

public record ConstructorInfo(String name,
                              String accessSpecifier,
                              List<ParameterInfo> parameters) implements DefaultModule {
    @Override
    public String toText() {
        List<String> parameterList = new ArrayList<>();
        for (ParameterInfo parameter : parameters()) {
            parameterList.add(parameter.toText());
        }
        String parameterText = "(" + String.join(", ", parameterList) + ")";
        return String.format("%s%s%s",  Textual.accessSpecifierToText(accessSpecifier()), name(), parameterText);
    }
}