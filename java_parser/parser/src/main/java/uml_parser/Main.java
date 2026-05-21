package uml_parser;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.Expression;
import uml_parser.basics.*;
import uml_parser.models.*;
import uml_parser.properties.TypeInfo;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Scanner;
import java.util.List;

public class Main {
    public static void main(String[] args) throws JsonProcessingException {

        Locale.setDefault(Locale.ROOT);

        // Setting config
        ParserConfiguration config = new ParserConfiguration();
        config.setLanguageLevel(
                ParserConfiguration.LanguageLevel.JAVA_21
        );
        StaticJavaParser.setConfiguration(config);

        // Compilation unit
        String code = getCode();
        CompilationUnit cu = StaticJavaParser.parse(code);

        // Parse class types
        List<ClassOrInterfaceDeclaration> classes = cu.findAll(ClassOrInterfaceDeclaration.class)
                .stream()
                .filter(c -> !c.isInterface())
                .toList();
        List<ClassOrInterfaceDeclaration> interfaces = cu.findAll(ClassOrInterfaceDeclaration.class)
                .stream()
                .filter(ClassOrInterfaceDeclaration::isInterface)
                .toList();
        List<RecordDeclaration> records = cu.findAll(RecordDeclaration.class);
        List<EnumDeclaration> enums = cu.findAll(EnumDeclaration.class);

        List<TypeInfo> createdClasses = new ArrayList<>();

        // Create class objects
        for (ClassOrInterfaceDeclaration cls : classes) createdClasses.add(createClass(cls));
        for (ClassOrInterfaceDeclaration cls : interfaces) createdClasses.add(createClass(cls));
        for (RecordDeclaration cls : records) createdClasses.add(createClass(cls));
        for (EnumDeclaration cls : enums) createdClasses.add(createClass(cls));

        // JSON output
        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(createdClasses);
        System.out.println(json);
    }

    private static List<FieldInfo> parseFields(List<FieldDeclaration> fields) {
        List<FieldInfo> fieldInfoList = new ArrayList<>();
        for (FieldDeclaration field : fields) {
            for (VariableDeclarator vd : field.getVariables()) {
                FieldInfo newFieldInfo = new FieldInfo(vd.getNameAsString(),
                        vd.getTypeAsString(),
                        field.getAccessSpecifier().asString(),
                        field.getModifiers()
                                .stream()
                                .map(m -> m.getKeyword().asString())
                                .toList());
                fieldInfoList.add(newFieldInfo);
            }
        }
        return fieldInfoList;
    }
    private static List<ConstructorInfo> parseConstructors(List<ConstructorDeclaration> constructors) {
        List<ConstructorInfo> constructorInfoList = new ArrayList<>();
        for (ConstructorDeclaration constructor : constructors) {
            ConstructorInfo newConstructorInfo = new ConstructorInfo(constructor.getNameAsString(),
                    constructor.getAccessSpecifier().asString(),
                    parseParameters(constructor.getParameters())
            );

            constructorInfoList.add(newConstructorInfo);
        }
        return constructorInfoList;
    }
    private static List<MethodInfo> parseMethods(List<MethodDeclaration> methods) {
        List<MethodInfo> methodInfoList = new ArrayList<>();
        for (MethodDeclaration method : methods) {
            MethodInfo newMethodInfo = new MethodInfo(method.getNameAsString(),
                    method.getTypeAsString(),
                    method.getAccessSpecifier().asString(),
                    method.getModifiers()
                            .stream()
                            .map(m -> m.getKeyword().asString())
                            .toList(),
                    parseParameters(method.getParameters())
                    );

            methodInfoList.add(newMethodInfo);

        }
        return methodInfoList;
    }
    private static List<ParameterInfo> parseParameters(NodeList<Parameter> params) {
        List<ParameterInfo> parameterInfoList = new ArrayList<>();
        for (Parameter p : params) {
            ParameterInfo parameterInfo = new ParameterInfo(p.getNameAsString(),
                    p.getTypeAsString());
            parameterInfoList.add(parameterInfo);
        }
        return parameterInfoList;
    }
    private static List<String> parseEnumArguments(NodeList<Expression> args) {
        List<String> argInfo = new ArrayList<>();
        for (Expression e : args) {
            argInfo.add(e.toString());
        }
        return argInfo;
    }
    private static List<ConstantInfo> parseConstants(NodeList<EnumConstantDeclaration> entries) {
        List<ConstantInfo> constantInfoList = new ArrayList<>();
        for (EnumConstantDeclaration e : entries) {
            ConstantInfo constantInfo = new ConstantInfo(e.getNameAsString(),
                    parseEnumArguments(e.getArguments()));
            constantInfoList.add(constantInfo);
        }
        return constantInfoList;
    }
    private static TypeInfo createClass(TypeDeclaration<?> cls) {
        String name = cls.getNameAsString();
        String accessSpecifier =  cls.getAccessSpecifier().asString();
        ClassTypes type_;
        List<String> modifiers = cls.getModifiers().stream().map(m -> m.getKeyword().asString()).toList();

        List<FieldInfo> fields = parseFields(cls.getFields());

        if (cls instanceof ClassOrInterfaceDeclaration c) {
            List<MethodInfo> methods = parseMethods(c.getMethods());
            List<String> extends_ = c.getExtendedTypes()
                    .stream()
                    .map(t -> t.getNameAsString())
                    .toList();

            List<String> permits_ = c.getPermittedTypes()
                    .stream()
                    .map(t -> t.getNameAsString())
                    .toList();
            if (c.isInterface()) {
                type_ = ClassTypes.INTERFACE;
                return new DefaultInterface(
                        name,
                        accessSpecifier,
                        type_,
                        modifiers,
                        fields,
                        methods,
                        extends_,
                        permits_
                );
            } else {
                type_ = ClassTypes.CLASS;
                List<ConstructorInfo> constructors = parseConstructors(c.getConstructors());
                List<String> implements_ = c.getImplementedTypes()
                        .stream()
                        .map(t -> t.getNameAsString())
                        .toList();

                return new DefaultClass(
                        name,
                        accessSpecifier,
                        type_,
                        modifiers,
                        fields,
                        constructors,
                        methods,
                        extends_,
                        implements_,
                        permits_
                );
            }
        } else if (cls instanceof RecordDeclaration c) {

            type_ = ClassTypes.RECORD;
            List<ConstructorInfo> constructors = parseConstructors(c.getConstructors());
            List<ParameterInfo> parameters = parseParameters(c.getParameters());
            List<MethodInfo> methods = parseMethods(c.getMethods());
            List<String> implements_ = c.getImplementedTypes()
                    .stream()
                    .map(t -> t.getNameAsString())
                    .toList();

            return new DefaultRecord(
                    name,
                    accessSpecifier,
                    type_,
                    modifiers,
                    parameters,
                    fields,
                    constructors,
                    methods,
                    implements_
            );
        } else if (cls instanceof EnumDeclaration c) {
            type_ = ClassTypes.ENUM;

            List<ConstructorInfo> constructors = parseConstructors(c.getConstructors());
            List<ConstantInfo> constants = parseConstants(c.getEntries());
            List<MethodInfo> methods = parseMethods(c.getMethods());
            List<String> implements_ = c.getImplementedTypes()
                    .stream()
                    .map(t -> t.getNameAsString())
                    .toList();

            return new DefaultEnum(
                    name,
                    accessSpecifier,
                    type_,
                    modifiers,
                    fields,
                    constructors,
                    methods,
                    constants,
                    implements_
            );
        }

        return null;
    }
    private static String getCode() {
        Scanner sc = new Scanner(System.in);
        StringBuilder sb = new StringBuilder();

        while (sc.hasNextLine()) {
            sb.append(sc.nextLine());
            sb.append("\n");
        }

        return sb.toString();
    }
}