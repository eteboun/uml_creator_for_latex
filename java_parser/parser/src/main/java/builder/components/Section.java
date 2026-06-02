package builder.components;

import builder.config.SectionConfig;
import java.util.List;

public record Section(String name,
                      List<Row> rows,
                      SectionConfig config) {

}
