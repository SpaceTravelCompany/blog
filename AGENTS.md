# Blog agent notes

Astro static blog. Post bodies live in `posts/<id>.md` (Markdown + frontmatter). HTML is produced by `src/lib/markdown.js` (`marked` with custom code-block renderers).

When editing posts, prefer the diagram fences below instead of ASCII box art (`┌─┐`, `├──`, etc.).

---

## `cmdstack` — vertical flow / command stacks

Use for **top-to-bottom** sequences: API calls, pipeline stages, folder trees, stack states, Vulkan command order.

### Fence

````markdown
```cmdstack
...
```
````

`diagram` is an alias for `cmdstack`.

### Syntax

| Pattern | Meaning |
|--------|---------|
| `---` on its own line | Section divider (dashed line between groups) |
| `command ← note` | Left: main text; right: badge (also `→`, `──`) |
| `left │ right` | Two-column box row (splits on `\|`) |
| `├──` / `└──` | Tree row; indent from leading `│` |
| `── hint → detail` | Leading `──` stripped; `→` splits cmd / note |

Box-drawing-only lines (`┌`, `├`, `│`, …) are ignored if pasted by mistake.

### Examples

**Vulkan command flow**

````markdown
```cmdstack
vkCmdDraw(A) ← COLOR_OUTPUT
---
vkCmdPipelineBarrier(
  src=COLOR_ATTACHMENT_OUTPUT,
  dst=COMPUTE_SHADER)
---
vkCmdDispatch(B) ← COMPUTE_SHADER
```
````

**Folder tree**

````markdown
```cmdstack
geometry/
├── geometry.odin ← 메인 엔트리
├── shaders/
│   ├── shape.vert ← UV 전달
│   └── shape.frag ← SDF 평가
└── svg/ ← 파서
```
````

**Lua stack (`lua_pcall`)**

````markdown
```cmdstack
호출 전 ← [함수, arg1, …, argN] · nargs개 인자
---
성공 시 ← [ret1, …, retM] · nresults개 반환값
실패 시 ← [error_message] · 에러 메시지 1개
```
````

### When not to use

- Side-by-side **relationships** (CPU ↔ GPU, two heaps) → use `relflow`
- Simple property matrices → Markdown **table**
- Real source code → ` ```c ` / ` ```odin ` with Prism

Implementation: `src/lib/cmdstack.js` · styles: `.cmdstack` in `src/styles/global.css`

---

## `relflow` — left / right relationship diagram

Use when the point is **two domains linked horizontally** (e.g. staging buffer → device-local resource), with optional footnotes under one side (map, memcpy, sync).

### Fence

````markdown
```relflow
...
```
````

### Syntax (three phases, separated by `---`)

**Phase 1 — headers**

```
cpu: CPU (HOST_VISIBLE)
gpu: GPU (DEVICE_LOCAL)
arrow: →          # optional; default →
```

Aliases: `left:` / `right:` instead of `cpu:` / `gpu:`.

**Phase 2 — panel rows** (one row per line, split on `|`)

```
Staging Buffer | Vertex Buffer
(non-cached) | Texture 등
HOST_COHERENT | (GPU 전용)
```

First line in each box is emphasized; following lines are secondary.

**Phase 3 — footer** (under one column)

```
foot: left       # left | right | center
vkMapMemory
memcpy (CPU 입력/출력)
```

Leading `↕` on footer lines is stripped (icon is added in HTML).

### Example (staging buffer)

````markdown
```relflow
cpu: CPU (HOST_VISIBLE)
gpu: GPU (DEVICE_LOCAL)
---
Staging Buffer | Vertex Buffer
(non-cached) | Texture 등
HOST_COHERENT | (GPU 전용)
---
foot: left
vkMapMemory
memcpy (CPU 입력/출력)
```
````

On narrow viewports the layout stacks vertically and the arrow rotates to ↓.

### When not to use

- Pure vertical command ordering → `cmdstack`
- Single-column memory pool overview → `cmdstack` or a table

Implementation: `src/lib/relflow.js` · styles: `.relflow` in `src/styles/global.css`

---

## Adding or changing renderers

1. Implement `renderXxx(source) → HTML string` under `src/lib/`.
2. Register in `src/lib/markdown.js` inside `renderer.code` (call the default renderer for other languages — do not `return false`).
3. Add CSS in `src/styles/global.css`.
4. Document the fence and syntax in this file.
