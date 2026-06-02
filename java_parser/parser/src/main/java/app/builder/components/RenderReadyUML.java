package app.builder.components;

import app.builder.config.RenderConfig;
import java.util.List;

public record RenderReadyUML(List<Section> sections, RenderConfig renderer) {
}
