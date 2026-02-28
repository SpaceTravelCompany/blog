## 1. glslang이란

**glslang**은 Khronos의 공식 GLSL/HLSL 프론트엔드로, 셰이더 소스 코드를 **SPIR-V**로 컴파일한다. Vulkan은 SPIR-V 바이트코드를 사용하므로, 런타임에 GLSL 문자열을 SPIR-V로 변환하려면 glslang(또는 shaderc 등)이 필요하다.

---

## 2. Odin에서 glslang 사용

### 2.1 임포트

```odin
import "vendor:glslang"
```

### 2.2 프로세스 초기화/종료

glslang은 **프로세스 단위**로 초기화한다(스레드 아님). 한 번만 호출하고, 종료 시 `finalize_process`를 호출한다.

```odin
// 초기화 (프로그램 시작 시)
if glslang.initialize_process() == 0 {
    // 실패
}

// 종료 (프로그램 종료 시)
glslang.finalize_process()
```

멀티스레드 환경에서는 한 번만 초기화되도록 한다.

---

## 3. 컴파일 흐름

### 3.1 입력 구조체 (glslang.Input)

```odin
input := glslang.Input{
    language      = shader_lang == .HLSL ? glslang.Source.HLSL : glslang.Source.GLSL,
    stage         = stage,                    // VERTEX, FRAGMENT, GEOMETRY, COMPUTE 등
    client        = glslang.Client.VULKAN,
    client_version = glslang.Target_Client_Version.VULKAN_1_4,
    target_language = glslang.Target_Language.SPV,
    target_language_version = glslang.Target_Language_Version.SPV_1_6,
    code          = code_str,                 // C 문자열 (셰이더 소스)
    default_version = 100,
    default_profile = glslang.Profile.NO_PROFILE,
    force_default_version_and_profile = 0,
    forward_compatible = 0,
    messages      = glslang.Messages.DEFAULT_BIT,
    resource      = glslang.default_resource(),
    callbacks     = {},
    callbacks_ctx = nil,
}
```

### 3.2 Vulkan 버전에 따른 SPIR-V 버전

Vulkan 버전에 맞게 `target_language_version`과 `client_version`을 조정한다. 근데 버전을 올린다고 성능이 좋아지는건 아니라고 한다. 그냥 1.0, 1.0으로 호환성을 유지해도 되겠다.(glslc를 실행했을때 기본값이기도하고)


| Vulkan | client_version | target_language_version |
| ------ | -------------- | ----------------------- |
| 1.0    | VULKAN_1_0     | SPV_1_0                 |
| 1.1    | VULKAN_1_1     | SPV_1_3                 |
| 1.2    | VULKAN_1_2     | SPV_1_5                 |
| 1.3    | VULKAN_1_3     | SPV_1_6                 |
| 1.4+   | VULKAN_1_4     | SPV_1_6                 |


---

## 4. 컴파일 단계

### 4.1 셰이더 생성 및 전처리

```odin
shader := glslang.shader_create(&input)
defer glslang.shader_delete(shader)

glslang.shader_set_entry_point(shader, "main")

if glslang.shader_preprocess(shader, &input) == 0 {
    // 실패: info_log, debug_log 확인
    info_log := glslang.shader_get_info_log(shader)
    debug_log := glslang.shader_get_info_debug_log(shader)
    return nil, nil, false
}
```

### 4.2 파싱

```odin
if glslang.shader_parse(shader, &input) == 0 {
    // 실패: info_log, debug_log 확인
    return nil, nil, false
}
```

### 4.3 프로그램 생성 및 링크

```odin
program := glslang.program_create()
defer glslang.program_delete(program)

glslang.program_add_shader(program, shader)

link_messages := cast(c.int)(glslang.Messages.SPV_RULES_BIT) | cast(c.int)(glslang.Messages.VULKAN_RULES_BIT)
if glslang.program_link(program, link_messages) == 0 {
    // 링크 실패
    return nil, nil, false
}
```

### 4.4 SPIR-V 생성

```odin
spv_options := glslang.SPV_Options{
    generate_debug_info = false,
    strip_debug_info     = false,
    disable_optimizer    = false,
    optimize_size        = false,
    disassemble          = false,
    validate             = true,
    // ...
}

// 디버그 빌드에서는 디버그 정보 활성화
when ODIN_DEBUG {
    spv_options.generate_debug_info = true
    spv_options.disable_optimizer   = true
    spv_options.emit_nonsemantic_shader_debug_info  = true
    spv_options.emit_nonsemantic_shader_debug_source = true
}

glslang.program_SPIRV_generate_with_options(program, stage, &spv_options)

spirv_size := glslang.program_SPIRV_get_size(program)
spirv_data := mem.make_non_zeroed([]u8, size_of(u32) * spirv_size, context.temp_allocator)
glslang.program_SPIRV_get(program, cast(^c.uint)&spirv_data[0])
```

---

## 5. Vulkan ShaderModule 생성

glslang으로 얻은 SPIR-V 바이트코드를 Vulkan **ShaderModule**으로 등록한다.

### 5.1 vkCreateShaderModule

```c
VkShaderModuleCreateInfo createInfo = {
    .sType    = VK_STRUCTURE_TYPE_SHADER_MODULE_CREATE_INFO,
    .codeSize = spirv_byte_count,      // SPIR-V 바이트 수 (4의 배수)
    .pCode    = spirv_data,            // SPIR-V uint32 배열
};

VkShaderModule shaderModule;
vkCreateShaderModule(device, &createInfo, NULL, &shaderModule);
```

- `codeSize`: SPIR-V 바이트 길이. SPIR-V는 4바이트 단위이므로 `sizeof(uint32_t) * word_count`.
- `pCode`: SPIR-V 바이트를 `uint32_t*`로 전달. glslang의 `program_SPIRV_get` 결과를 그대로 사용 가능.

### 5.2 파이프라인에 사용

`VkPipelineShaderStageCreateInfo`에서 `module`에 이 ShaderModule을 지정하고, `pName`에 엔트리 포인트(예: `"main"`)를 넣는다.

```c
VkPipelineShaderStageCreateInfo stageInfo = {
    .sType  = VK_STRUCTURE_TYPE_PIPELINE_SHADER_STAGE_CREATE_INFO,
    .stage  = VK_SHADER_STAGE_VERTEX_BIT,  // 또는 FRAGMENT, COMPUTE 등
    .module = shaderModule,
    .pName  = "main",
};
```

### 5.3 정리

사용이 끝나면 `vkDestroyShaderModule(device, shaderModule, NULL)`로 해제한다.

---

## 6. 에러 처리

glslang 각 단계(전처리, 파싱, 링크) 실패 시:

```odin
info_log := glslang.shader_get_info_log(shader)   // 또는 program
debug_log := glslang.shader_get_info_debug_log(shader)
// 로그 출력 후 false 반환
```

SPIR-V 생성 후 메시지가 있으면:

```odin
spirv_messages := glslang.program_SPIRV_get_messages(program)
if spirv_messages != nil {
    log.error(spirv_messages, "\n")
}
```

---

