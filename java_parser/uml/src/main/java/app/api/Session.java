package app.api;

import app.builder.components.RenderReadyUML;
import app.builder.Builder;
import app.builder.config.FullConfig;

import app.code_parser.CodeParser;

import app.code_parser.models.DefaultBase;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/uml")
public class Session {
    @PostMapping("/create")
    public List<RenderReadyUML> createNewUMLs(@RequestBody String javaCode) throws IOException {
        List<DefaultBase> createdClasses = CodeParser.run(javaCode);
        FullConfig config = new FullConfig("config.json");

        return Builder.createRenderReadyUMLs(createdClasses, config);
    }
}
