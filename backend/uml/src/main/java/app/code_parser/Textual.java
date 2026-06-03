package app.code_parser;

import app.code_parser.models.*;
import app.code_parser.modules.DefaultModule;
import app.code_parser.modules.FieldInfo;
import app.code_parser.modules.MethodInfo;

import java.util.ArrayList;
import java.util.List;

public class Textual {
    public static String accessSpecifierToText(String accessSpecifier) {
        return switch (accessSpecifier) {
            case "public" -> "+ ";
            case "protected" -> "# ";
            case "private" -> "- ";
            default -> "";
        };
    }

    public static String modsEnd(DefaultBase base) {
        List<String> mods = new ArrayList<>();

        switch (base) {
            case DefaultClass c -> {
                if (c.isStatic()) mods.add("static");
                if (c.isAbstract()) mods.add("abstract");
            }
            case DefaultInterface i -> {
                if (i.isStatic()) mods.add("static");
                if (i.isAbstract()) mods.add("abstract");
            }
            case DefaultRecord r -> {
                return r.isStatic() ? " {static}" : "";
            }
            case DefaultEnum e -> {
                return e.isStatic() ? " {static}" : "";
            }
            case null, default -> {
                return "";
            }
        }

        return mods.isEmpty() ? "" : " {" +
                String.format("%s", String.join(", ", mods)) + "}";
    }

    public static String modsEnd(DefaultModule module) {
        List<String> mods = new ArrayList<>();

        switch (module) {
            case MethodInfo m -> {
                if (m.isStatic()) mods.add("static");
                if (m.isAbstract()) mods.add("abstract");
            }
            case FieldInfo f -> {
                return f.isStatic() ? " {static}" : "";
            }
            case null, default -> {
                return "";
            }
        }

        return mods.isEmpty() ? "" : " {" +
                String.format("%s", String.join(", ", mods)) + "}";
    }
}
