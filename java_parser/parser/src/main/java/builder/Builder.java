package builder;


import builder.components.RenderReadyUML;
import builder.components.Row;
import builder.components.Section;

import code_parser.models.*;
import code_parser.modules.*;
import config.FullConfig;
import config.RenderConfig;
import config.SectionConfig;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Builder {

    public static Row createBodyRow(DefaultModule module) {
        String anchor = "west";
        String align = "left";
        List<String> content = List.of(module.toText());
        return new Row(anchor, align, content);
    }

    public static Row createTitleRow(DefaultBase base) {
        String anchor = "center";
        String align = "center";
        List<String> content = !base.stereotype().isEmpty() ?
                List.of(base.stereotype(), base.toText()) :
                List.of(base.toText());
        return new Row(anchor, align, content);
    }

    public static List<Section> createSections(DefaultBase base, Map<String, SectionConfig> configs) {
        List<Section> sections = new ArrayList<>();
        sections.add(new Section("title", List.of(createTitleRow(base)), configs.get("title")));
        for (AllowedModules allowedModule : base.allowedModules()) {
            List<Row> rows = new ArrayList<>();
            List<? extends DefaultModule> modules = allowedModule.modules();
            for (DefaultModule module : modules) {
                Row row = createBodyRow(module);
                rows.add(row);
            }
            if (!rows.isEmpty()) {
                String name = allowedModule.name();
                sections.add(new Section(name, rows, configs.get(name)));
            }
        }
        return sections;
    }

    public static RenderReadyUML createRenderReadyUML(DefaultBase base, FullConfig config) {
        return new RenderReadyUML(createSections(base, config.getSectionConfigs()), config.getRenderConfig());
    }
}










