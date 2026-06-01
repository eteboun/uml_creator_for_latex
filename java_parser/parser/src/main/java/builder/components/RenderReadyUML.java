package builder.components;

import config.RenderConfig;
import java.util.List;

public record RenderReadyUML(List<Section> sections, RenderConfig config) {
}
