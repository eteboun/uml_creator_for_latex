package code_parser.modules;

import java.util.List;

public record ConstantInfo(String name, List<String> args) implements DefaultModule {
    @Override
    public String toText() {
        String name = name();
        String args = args().isEmpty() ?
                "" : "(" + String.join(", ", args()) + ")";
        return String.format("%s%s", name, args);
    }
}
