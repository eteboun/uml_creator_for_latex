package api;

import code_parser.CodeParser;
import code_parser.models.DefaultBase;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/uml")
public class Session {
    @PostMapping("/create")
    public List<DefaultBase> createNewUMLs(@RequestBody String javaCode) {
        return CodeParser.run(javaCode);
    }
}
