package code_parser.modules;

import java.util.List;

public record AllowedModules(String name, List<? extends DefaultModule> modules) { }
