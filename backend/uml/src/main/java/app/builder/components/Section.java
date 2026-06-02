package app.builder.components;

import app.builder.config.SectionConfig;
import java.util.List;

public record Section(String name,
                      List<Row> rows,
                      SectionConfig config) {

}
