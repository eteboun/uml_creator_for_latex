package org.uml_parser;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.javaparser.ParserConfiguration;
import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.NodeList;
import com.github.javaparser.ast.body.*;

import java.util.ArrayList;
import java.util.Scanner;
import java.util.List;
import java.util.Map;

public class Main {
    public static void main(String[] args) throws JsonProcessingException {

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

        ArrayList<Map<String, ClassInfo>> classMaps = new ArrayList<>();

        // Create class objects
        for (ClassOrInterfaceDeclaration cls : classes) {
            Map<String, ClassInfo> classMap = createClassMap(cls);
            classMaps.add(classMap);
        }

        for (RecordDeclaration cls : records) {
            Map<String, ClassInfo> classMap = createClassMap(cls);
            classMaps.add(classMap);
        }

        for (EnumDeclaration cls : enums) {
            Map<String, ClassInfo> classMap = createClassMap(cls);
            classMaps.add(classMap);
        }

        // JSON output
        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(classMaps);
        System.out.println(json);
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
    private static Map<String, ClassInfo> createClassMap(TypeDeclaration<?> cls) {
        List<FieldInfo> fields = getFields(cls.getFields());
        List<MethodInfo> methods = getMethods(cls.getMethods());

        List<String> extends_ = new ArrayList<>();
        List<String> permits_ = new ArrayList<>();
        List<String> implements_ = new ArrayList<>();
        ClassTypes type;

        if (cls instanceof ClassOrInterfaceDeclaration c) {
            if (c.isInterface()) {
                type = ClassTypes.INTERFACE;

                extends_ = c.getExtendedTypes()
                        .stream()
                        .map(t -> t.getNameAsString())
                        .toList();

                implements_ = c.getImplementedTypes()
                                .stream()
                                .map(t -> t.getNameAsString())
                                .toList();
                permits_ = c.getPermittedTypes()
                                .stream()
                                .map(t -> t.getNameAsString())
                                .toList();
            }
            else type = ClassTypes.CLASS;
        } else if (cls instanceof RecordDeclaration c) {
            type = ClassTypes.RECORD;

            implements_ = c.getImplementedTypes()
                    .stream()
                    .map(t -> t.getNameAsString())
                    .toList();

        } else {
            type = ClassTypes.ENUM;
            EnumDeclaration c =  (EnumDeclaration) cls;

            implements_ = c.getImplementedTypes()
                    .stream()
                    .map(t -> t.getNameAsString())
                    .toList();
        }

        ClassInfo classInfo = new ClassInfo(
                cls.getNameAsString(),
                cls.getAccessSpecifier().asString(),
                type,
                cls.getModifiers()
                        .stream()
                        .map(m -> m.getKeyword().asString())
                        .toList(),
                fields,
                methods,
                extends_,
                implements_,
                permits_
        );
        return Map.of(classInfo.name(),  classInfo);
    }
    private static String getCode() {
        Scanner sc = new Scanner(System.in);
        StringBuilder sb = new StringBuilder();

        while (sc.hasNextLine()) {
            sb.append(sc.nextLine());
            sb.append("\n");
        }

        String code = sb.toString();
        return code;
    }
}