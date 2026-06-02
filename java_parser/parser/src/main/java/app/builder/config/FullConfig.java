package app.builder.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
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

    public FullConfig(String cfgName) throws IOException {
        ObjectMapper mapper = new ObjectMapper();

        try (InputStream input =
                     FullConfig.class.getResourceAsStream("/" + cfgName)){
            InputStream cfg = FullConfig.class.getResourceAsStream("/" + cfgName);

            if (cfg == null) {
                throw new FileNotFoundException(cfgName + " not found in resources");
            }

            JsonNode root = mapper.readTree(input);
            this.renderConfig = mapper.treeToValue(root.get("renderer"), RenderConfig.class);

            root = root.get("section_configs");
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
    }

    public RenderConfig getRenderConfig() {
        return renderConfig;
    }

    public Map<String, SectionConfig> getSectionConfigs() {
        return sectionConfigs;
    }
}
