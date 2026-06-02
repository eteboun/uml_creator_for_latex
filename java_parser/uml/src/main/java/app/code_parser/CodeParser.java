package app.code_parser;

import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.Expression;
import com.github.javaparser.ast.nodeTypes.NodeWithSimpleName;
import app.code_parser.modules.*;
import app.code_parser.models.*;
import java.util.ArrayList;
import java.util.Locale;
import java.util.List;
import java.util.stream.Collectors;

public class CodeParser {
     public static List<DefaultBase> run(String javaCode) {

        Locale.setDefault(Locale.ROOT);

        // Setting app.builder.config
        ParserConfiguration config = new ParserConfiguration();
        config.setLanguageLevel(
                ParserConfiguration.LanguageLevel.JAVA_21
        );
        StaticJavaParser.setConfiguration(config);

        // Compilation unit
        CompilationUnit cu = StaticJavaParser.parse(javaCode);

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

        List<DefaultBase> createdClasses = new ArrayList<>();

        // Create class objects
        for (ClassOrInterfaceDeclaration cls : classes) createdClasses.add(createClass(cls));
        for (ClassOrInterfaceDeclaration cls : interfaces) createdClasses.add(createClass(cls));
        for (RecordDeclaration cls : records) createdClasses.add(createClass(cls));
        for (EnumDeclaration cls : enums) createdClasses.add(createClass(cls));

        return createdClasses;
    }

    private static List<FieldInfo> parseFields(List<FieldDeclaration> fields) {
        List<FieldInfo> fieldInfoList = new ArrayList<>();
        for (FieldDeclaration field : fields) {
            for (VariableDeclarator vd : field.getVariables()) {
                FieldInfo newFieldInfo = new FieldInfo(vd.getNameAsString(),
                        vd.getTypeAsString(),
                        field.getAccessSpecifier().asString(),
                        field.isFinal(),
                        field.isStatic());
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
                    parseParameters(method.getParameters()),
                    method.isFinal(),
                    method.isStatic(),
                    method.isAbstract()
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
    private static DefaultBase createClass(TypeDeclaration<?> cls) {
        String name = cls.getNameAsString();
        String accessSpecifier =  cls.getAccessSpecifier().asString();
        boolean isStatic = cls.isStatic();

        List<FieldInfo> fields = parseFields(cls.getFields());

        switch (cls) {
            case ClassOrInterfaceDeclaration c -> {
                boolean isFinal = c.isFinal();
                boolean isAbstract = c.isAbstract();

                if (!c.getTypeParameters().isEmpty()) {
                    name += "<" +
                            c.getTypeParameters()
                                    .stream()
                                    .map(Node::toString)
                                    .collect(Collectors.joining(", "))
                            + ">";
                }

                List<MethodInfo> methods = parseMethods(c.getMethods());
                List<String> extends_ = c.getExtendedTypes()
                        .stream()
                        .map(NodeWithSimpleName::getNameAsString)
                        .toList();

                List<String> permits_ = c.getPermittedTypes()
                        .stream()
                        .map(NodeWithSimpleName::getNameAsString)
                        .toList();
                if (c.isInterface()) {
                    return new DefaultInterface(
                            name,
                            accessSpecifier,
                            isFinal,
                            isAbstract,
                            isStatic,
                            fields,
                            methods,
                            extends_,
                            permits_
                    );
                } else {
                    List<ConstructorInfo> constructors = parseConstructors(c.getConstructors());
                    List<String> implements_ = c.getImplementedTypes()
                            .stream()
                            .map(NodeWithSimpleName::getNameAsString)
                            .toList();

                    return new DefaultClass(
                            name,
                            accessSpecifier,
                            isFinal,
                            isAbstract,
                            isStatic,
                            fields,
                            constructors,
                            methods,
                            extends_,
                            implements_,
                            permits_
                    );
                }
            }
            case RecordDeclaration c -> {

                boolean isFinal = c.isFinal();

                List<ConstructorInfo> constructors = parseConstructors(c.getConstructors());
                List<ParameterInfo> parameters = parseParameters(c.getParameters());
                List<MethodInfo> methods = parseMethods(c.getMethods());
                List<String> implements_ = c.getImplementedTypes()
                        .stream()
                        .map(NodeWithSimpleName::getNameAsString)
                        .toList();

                return new DefaultRecord(
                        name,
                        accessSpecifier,
                        isFinal,
                        isStatic,
                        parameters,
                        fields,
                        constructors,
                        methods,
                        implements_
                );
            }
            case EnumDeclaration c -> {

                List<ConstructorInfo> constructors = parseConstructors(c.getConstructors());
                List<ConstantInfo> constants = parseConstants(c.getEntries());
                List<MethodInfo> methods = parseMethods(c.getMethods());
                List<String> implements_ = c.getImplementedTypes()
                        .stream()
                        .map(NodeWithSimpleName::getNameAsString)
                        .toList();

                return new DefaultEnum(
                        name,
                        accessSpecifier,
                        isStatic,
                        fields,
                        constructors,
                        methods,
                        constants,
                        implements_
                );
            }
            default -> {
            }
        }

        return null;
    }
}