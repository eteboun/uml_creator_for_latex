package org.uml_parser;

import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.*;

import java.util.ArrayList;
import java.util.List;


public class Main {
    public static void main(String[] args) {

        // Setting config
        ParserConfiguration config = new ParserConfiguration();
        config.setLanguageLevel(
                ParserConfiguration.LanguageLevel.JAVA_21
        );
        StaticJavaParser.setConfiguration(config);

        // Compilation unit
        String code = """
                public class MyClass {
                List<Integer> a = new List<>();
                     final static void sayMoo() {
                        System.out.println("Moo");
                    }
                }""";
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

        ArrayList<ClassInfo> classInfos = new ArrayList<>();

        // Create class objects
        for (ClassOrInterfaceDeclaration cls : classes) {

            List<FieldInfo> fields = getFields(cls.getFields());
            List<MethodInfo> methods = getMethods(cls.getMethods());


            ClassInfo classInfo = new ClassInfo(
                    cls.getNameAsString(),
                    cls.getAccessSpecifier().asString(),
                    cls.getModifiers()
                            .stream()
                            .map(m -> m.getKeyword().asString())
                            .toList(),
                    fields,
                    methods,
                    cls.getExtendedTypes()
                            .stream()
                            .map(t -> t.getNameAsString())
                            .toList(),
                    cls.getImplementedTypes()
                            .stream()
                            .map(t -> t.getNameAsString())
                            .toList(),
                    cls.getPermittedTypes()
                            .stream()
                            .map(t -> t.getNameAsString())
                            .toList()
            );

            classInfos.add(classInfo);
        }

    }

    private static List<FieldInfo> getFields(List<FieldDeclaration> fields) {
        List<FieldInfo> fieldInfoList = new ArrayList<>();
        for (FieldDeclaration field : fields) {
            for (VariableDeclarator vd : field.getVariables()) {
                FieldInfo newFieldInfo = new FieldInfo(vd.getNameAsString(),
                        field.getElementType().asString(),
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
    private static List<MethodInfo> getMethods(List<MethodDeclaration> methods) {
        List<MethodInfo> methodInfoList = new ArrayList<>();
        for (MethodDeclaration method : methods) {
            MethodInfo newMethodInfo = new MethodInfo(method.getNameAsString(),
                    method.getTypeAsString(),
                    method.getAccessSpecifier().asString(),
                    method.getModifiers()
                            .stream()
                            .map(m -> m.getKeyword().asString())
                            .toList(),
                    getParameters(method.getParameters())
                    );

            methodInfoList.add(newMethodInfo);

        }
        return methodInfoList;
    }
    private static List<ParameterInfo> getParameters(NodeList<Parameter> params) {
        List<ParameterInfo> parameterInfoList = new ArrayList<>();
        for (Parameter p : params) {
            ParameterInfo parameterInfo = new ParameterInfo(p.getNameAsString(),
                    p.getTypeAsString());
            parameterInfoList.add(parameterInfo);
        }
        return parameterInfoList;
    }
}