package code_parser.modules;

public record ParameterInfo(String name, String type_) implements DefaultModule {
    @Override
    public String toText() {
        return String.format("%s: %s", name(), type_());
    }
}
