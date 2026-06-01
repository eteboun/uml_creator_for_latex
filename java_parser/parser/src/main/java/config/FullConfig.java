package config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

public class FullConfig {

    static Map<String, String> sectionConfigNamesMapping = Map.of(
            "fields", "field_section_config",
            "title", "title_section_config",
            "methods", "method_section_config",
            "constructors", "constructor_section_config",
            "constants", "constant_section_config",
            "parameters", "parameter_section_config"
    );

    private final RenderConfig renderConfig;
    private final Map<String, SectionConfig> sectionConfigs = new HashMap<>();

    public FullConfig(String address) throws IOException {
        ObjectMapper mapper = new ObjectMapper();

        JsonNode root = mapper.readTree(Path.of(address).toFile());
        this.renderConfig = mapper.treeToValue(root.get("renderer"), RenderConfig.class);

        root = root.get("sections");
        for (var entry : sectionConfigNamesMapping.entrySet()) {
            JsonNode sectionNode = root.get(entry.getValue());

            if (sectionNode == null) {
                continue;
            }

            SectionConfig sectionConfig =
                    mapper.treeToValue(sectionNode, SectionConfig.class);

            sectionConfigs.put(entry.getKey(), sectionConfig);
        }
    }

    public RenderConfig getRenderConfig() {
        return renderConfig;
    }

    public Map<String, SectionConfig> getSectionConfigs() {
        return sectionConfigs;
    }
}
