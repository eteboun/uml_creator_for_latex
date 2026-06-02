package builder.components;

import java.util.List;

public record Row(String anchor,
                  String align,
                  List<String> content) {
}
