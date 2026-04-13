1. **토큰화**
2. **파싱**
3. **AST 생성**
4. **의미 분석(semantic analysis)**
5. **중간표현/코드생성**

파싱의 핵심은  
**토큰 배열을 “문법 구조”로 바꾸는 것**이야.

예를 들어 토큰이 이런 식이면

```text
IDENT(add) LPAREN INT(1) COMMA INT(2) RPAREN STAR INT(3)
```

파서는 이걸 그냥 나열된 토큰으로 보지 않고

```text
(add(1, 2)) * 3
```

처럼 **트리 구조**로 만든다.

---

## 1. 먼저 문법을 정해야 함

보통 이런 식으로 생각하면 된다.

```ebnf
expr  
  = equality  
  
equality  
  = comparison (("==" | "!=") comparison)*  
  
comparison  
  = term ((">" | ">=" | "<" | "<=") term)*  
  
term  
  = factor (("+" | "-") factor)*  
  
factor  
  = unary (("*" | "/") unary)*  
  
unary  
  = ("-" | "!") unary  
  | primary  
  
primary  
  = INT  
  | IDENT  
  | "(" expr ")"
```

이건 **연산자 우선순위**를 반영한 문법이야.

예를 들어 다음 식을 파싱하면

```text
1 + 2 * 3
```

`1 + (2 * 3)` 으로 묶이게 된다.

## 2. 파서는 보통 AST를 만든다

예를 들어 AST 노드를 이런 느낌으로 둔다.

```text
Expr  
  - IntLiteral(value)  
  - Name(name)  
  - Unary(op, expr)  
  - Binary(op, left, right)  
  - Call(callee, args)
```

그러면

```text
1 + 2 * 3
```

은 대충 이렇게 된다.

```text
Binary(+,
  IntLiteral(1),
  Binary(*,
    IntLiteral(2),
    IntLiteral(3)))
```

즉 파싱은 결국  
**토큰 -> AST 노드 생성** 과정이다.

## 3. 구현 방식은 보통 3가지가 많음

### 1) 재귀 하강 파서

가장 직관적이다.  
직접 함수로 문법을 구현한다.

예시 구조:

```text
parseExpr()
parseEquality()
parseComparison()
parseTerm()
parseFactor()
parseUnary()
parsePrimary()
```

이 방식이 네가 직접 언어 만들 때 제일 다루기 쉽다.

### 2) Pratt Parser

표현식 파싱에 특히 좋다.  
연산자 우선순위, prefix/infix 처리하기 편하다.

언어에서 식이 복잡하면 이쪽도 많이 쓴다.

### 3) LR/LALR 계열

자동 생성 파서 도구에서 많이 쓴다.  
직접 구현은 어렵고 디버깅도 불편하다.  
개인 언어 프로젝트면 보통 재귀 하강이나 Pratt가 더 낫다.


## 4. 실제로는 “식 파싱”과 “문장 파싱”을 나눔

예를 들어 코드가

```text
let x = 1 + 2;
if (x > 0) {
    print(x);
}
```

이라면 파서는 두 레벨을 처리해야 한다.

### 문장(statement)

- 변수 선언
- if
- while
- return
- block
- expression statement

### 식(expression)

- 리터럴
- 이름
- 이항 연산
- 단항 연산
- 함수 호출
- 인덱싱
- 멤버 접근

보통 구조는 이렇게 간다.

```text
parseStmt()
parseDecl()
parseExpr()
```


## 5. 파서의 기본 유틸 함수

보통 이런 함수가 필요하다.

```text
current()
peek(n)
advance()
match(kind)
expect(kind)
atEnd()
```

의미는 대충 이렇다.

- `current()` : 현재 토큰 보기
- `advance()` : 다음 토큰으로 이동
- `match(kind)` : 현재 토큰이 kind면 먹고 true
- `expect(kind)` : 아니면 에러
- `peek(n)` : 앞을 미리 보기


## 6. 재귀 하강 파서 예시 흐름

예를 들어 다음 식을 파싱한다고 하면:

```text
1 + 2 * 3
```

### `parseExpr()`

→ `parseEquality()`

### `parseEquality()`

→ `parseComparison()`

### `parseComparison()`

→ `parseTerm()`

### `parseTerm()`

- 왼쪽으로 `parseFactor()` 호출 → `1`
- 다음 토큰이 `+` 이므로 연산자 저장
- 오른쪽 `parseFactor()` 호출

### 오른쪽 `parseFactor()`

- 왼쪽 `parseUnary()` → `2`
- 다음 토큰이 `*`
- 오른쪽 `parseUnary()` → `3`
- `Binary(*, 2, 3)` 생성

### 다시 `parseTerm()`

- `Binary(+, 1, (2*3))` 생성

이런 식이다.


## 7. 간단한 의사코드

```pseudo
fn parseTerm() Expr {
    var left = parseFactor()

    while match(PLUS) or match(MINUS) {
        op = previous()
        right = parseFactor()
        left = Binary(op, left, right)
    }

    return left
}

fn parseFactor() Expr {
    var left = parseUnary()

    while match(STAR) or match(SLASH) {
        op = previous()
        right = parseUnary()
        left = Binary(op, left, right)
    }

    return left
}

fn parsePrimary() Expr {
    if match(INT) {
        return IntLiteral(previous().int_value)
    }

    if match(IDENT) {
        return Name(previous().text)
    }

    if match(LPAREN) {
        expr = parseExpr()
        expect(RPAREN)
        return expr
    }

    error("expected expression")
}
```

이게 재귀 하강의 기본 뼈대다.


## 8. 문장 파싱은 보통 이렇게 시작

예를 들어:

```pseudo
fn parseStmt() Stmt {
    if match(IF) return parseIfStmt()
    if match(WHILE) return parseWhileStmt()
    if match(RETURN) return parseReturnStmt()
    if match(LBRACE) return parseBlockStmt()

    return parseExprStmt()
}
```

그리고 선언이 따로 있으면:

```pseudo
fn parseDecl() Decl {
    if match(FN) return parseFnDecl()
    if match(LET) return parseVarDecl()

    return parseStmt()
}
```


## 9. 파싱 다음 단계는 semantic analysis

파싱이 끝났다고 바로 코드 생성하는 건 아니고  
보통 그 다음에 의미 분석을 한다.

예:

- 선언 안 된 변수 사용 확인
- 타입 검사
- 함수 인자 개수 검사
- `break` 가 loop 안인지 확인
- `return` 이 함수 반환형과 맞는지 확인
- 캐스팅 가능 여부 판단

즉

- **파싱**: 문법적으로 맞는가?
- **시멘틱**: 의미적으로 맞는가?


## 10. 에러 처리도 중요함

파서는 에러 하나 나오면 끝내기보다  
가능하면 다음 문장까지 복구해서  
에러를 여러 개 보여주는 게 좋다.

예를 들어 `expect(SEMICOLON)` 실패 시  
아무 데서나 멈추지 말고 다음 같은 토큰까지 스킵:

- `;`
- `}`
- `fn`
- `let`
- `if`

이걸 **synchronization** 이라고 한다.


## 11. 처음 구현할 때 추천 순서

처음부터 전체 언어 다 하지 말고 이렇게 가면 편하다.

### 1단계

식만 파싱

- 정수 리터럴
- 괄호
- `+ - * /`

### 2단계

변수

- identifier
- 대입
- `let`

### 3단계

문장

- expression statement
- block
- if
- while
- return

### 4단계

함수

- 함수 선언
- 함수 호출
- 인자 목록

### 5단계

타입/시멘틱

- 타입 검사
- 심볼 테이블


## 12. 네가 지금 당장 해야 할 것

토큰화가 끝났으면 바로 이 순서로 가면 된다.

### A. 토큰 구조 준비

```text
kind
lexeme
location(line, column)
literal value(optional)
```

### B. AST 타입 정의

- Expr
- Stmt
- Decl

### C. Parser 상태 정의

```text
tokens
current_index
errors
```

### D. 최소 표현식 파서 구현

- `parsePrimary`
- `parseUnary`
- `parseFactor`
- `parseTerm`

### E. 그 다음 문장/선언 확장

- `parseStmt`
- `parseDecl`

---

## 13. 아주 간단한 전체 구조

```text
tokens = tokenize(source)
ast = parse(tokens)
check(ast)
generate(ast)
```

파서 내부는 대충:

```text
parse()
  while !atEnd():
      decls.push(parseDecl())
```

---

# Expr / Stmt / Decl 의미

이 3개는 **언어 파서 설계의 핵심 분류**야.  

- **Expr (Expression)** → _값을 만들어냄_
- **Stmt (Statement)** → _동작을 수행함_
- **Decl (Declaration)** → _이름/구조를 정의함_

이걸 확실히 구분해야 컴파일러 구조가 깔끔해진다.

# 1. Expr (Expression)

👉 **값을 반환하는 것**

즉, 계산 결과가 있음.

### 예시

```text
1 + 2
x
foo(10)
a * b + c
(x > 0)
```

이건 전부 "값"이 나온다.

- `1 + 2` → 3
- `x` → 변수 값
- `foo(10)` → 함수 결과

### 특징

- 항상 **값을 생성**
- 다른 식 안에 들어갈 수 있음

```text
a = (1 + 2) * 3
```

여기서 `(1 + 2)` 는 Expr

### AST 예시

```text
Expr
  - IntLiteral
  - Name
  - Binary
  - Unary
  - Call
```


# 2. Stmt (Statement)

👉 **동작을 수행하지만 값은 중요하지 않음**

프로그램을 실행시키는 단위

### 예시

```text
x = 10;
print(x);
if (x > 0) { ... }
while (true) { ... }
return x;
```


### 특징

- 보통 **세미콜론(;)로 끝남**
- 실행 흐름을 바꿈
- 값이 있어도 "버려짐"

```text
1 + 2;
```

이건 계산은 하지만 결과 3은 버림 → Stmt


### AST 예시

```text
Stmt
  - ExprStmt
  - IfStmt
  - WhileStmt
  - ReturnStmt
  - BlockStmt
```


# 3. Decl (Declaration)

👉 **이름을 만들거나 구조를 정의**

변수, 함수, 타입 같은 "정의" 단계


### 예시

```text
let x = 10;
fn add(a, b) { return a + b; }
struct Vec3 { x, y, z }
```


### 특징

- **심볼 테이블에 등록됨**
- 스코프에 영향 줌
- 컴파일 타임 의미가 큼

### AST 예시

```text
Decl
  - VarDecl
  - FnDecl
  - StructDecl
```


# 4. 차이 핵심 비교

|구분|역할|값 반환|예시|
|---|---|---|---|
|Expr|계산|있음|`1+2`, `x`, `foo()`|
|Stmt|실행|없음(무시됨)|`if`, `while`, `return`|
|Decl|정의|없음|`let`, `fn`, `struct`|


# 5. 관계 구조 (중요)

이 3개는 계층이 이렇게 된다:

```text
Decl
  └── Stmt
        └── Expr
```

### 의미:

- Decl 안에 Stmt 있음
- Stmt 안에 Expr 있음


### 예시 코드

```text
let x = 1 + 2;
```

구조:

```text
Decl (VarDecl)
  name: x
  value: Expr (Binary +)
```


```text
if (x > 0) {
    print(x);
}
```

```text
Stmt (IfStmt)
  condition: Expr (x > 0)
  body:
    Stmt (ExprStmt → print(x))
```


# 6. 왜 이걸 나누냐

이거 안 나누면 나중에 **지옥됨**

### 문제 예시

- `if` 안에 `return` 가능한가?
- `return` 은 어디서만 허용?
- 변수 선언은 어디까지 스코프?
- 식 안에 `if` 넣을 수 있나?

이걸 깔끔하게 처리하려면  
Expr / Stmt / Decl 분리가 필수다.


# 7. 언어 설계에 따라 달라지는 부분

## 1) C 스타일

- Expr ≠ Stmt

```c
1 + 2;  // statement
```


## 2) Rust / functional 스타일

- 대부분이 Expr

```rust
let x = if a > 0 { 1 } else { 2 };
```

→ `if` 자체가 Expr


## 3) 너가 설계할 때 선택

### 선택 1 (간단, 추천)

- Expr / Stmt / Decl 분리

### 선택 2 (고급)

- 거의 모든 걸 Expr로 통합


# 8. 파서에서 실제 구조

보통 이렇게 시작한다:

```text
parseDecl()
  → parseStmt()
      → parseExpr()
```


# 9. 아주 직관적으로 이해하는 법

- Expr → "값"
- Stmt → "행동"
- Decl → "정의"

# 10. 한 줄 요약

```text
Expr = 값 만드는 것
Stmt = 실행하는 것
Decl = 이름/구조 정의하는 것
```

---

# AST 구조

보통 AST는 **문법 구조를 그대로 담는 트리 타입**으로 만든다.  
핵심은 3단계다.

1. **큰 분류 정하기**
2. **노드 종류 정의하기**
3. **각 노드가 가지는 필드 정하기**


# 1. 제일 먼저 큰 뼈대

보통 이렇게 나눈다.

```text
Ast
  - Decl
  - Stmt
  - Expr
```

그리고 프로그램 전체는 보통 Decl 목록이다.

```text
Program
  - decls: []Decl
```

예를 들어 소스가

```text
let x = 10;
fn add(a, b) {
    return a + b;
}
```

라면 대충 이런 구조다.

```text
Program
  decls = [
    VarDecl(name=x, init=Int(10)),
    FnDecl(name=add, params=[a, b], body=...)
  ]
```


# 2. AST 설계 원칙

AST는 **파싱하기 쉬운 구조**보다  
**나중에 시맨틱/코드생성하기 쉬운 구조**가 더 중요하다.

즉:

- 괄호 토큰 자체는 AST에 굳이 안 넣음
- 세미콜론도 보통 안 넣음
- `if`, `while`, `return` 같은 의미 단위만 남김

즉 AST는 **문법 쓰레기 제거한 구조**라고 보면 된다.

# 3. 기본 노드 종류 예시

## Expr

```text
Expr
  - IntLit
  - FloatLit
  - BoolLit
  - StringLit
  - Name
  - Unary
  - Binary
  - Call
  - Index
  - Member
  - Assign
```

## Stmt

```text
Stmt
  - ExprStmt
  - Block
  - If
  - While
  - For
  - Return
  - Break
  - Continue
```

## Decl

```text
Decl
  - Var
  - Fn
  - Struct
```


# 4. 각 노드 필드 예시

예를 들어 `Binary` 는 이런 식이다.

```text
Binary
  op
  left: *Expr
  right: *Expr
```

`If` 는:

```text
If
  cond: *Expr
  then_branch: *Stmt
  else_branch: ?*Stmt
```

`FnDecl` 은:

```text
FnDecl
  name
  params
  return_type
  body: *Stmt
```


# 5. 실제로는 tagged union 느낌으로 많이 만듦

언어 구현에서는 대개 이런 형태다.

```text
Expr = union(enum) {
    IntLit: IntLitExpr,
    Name: NameExpr,
    Binary: BinaryExpr,
    Call: CallExpr,
}
```

같은 방식.

Stmt, Decl도 마찬가지다.


# 6. Zig 스타일 예시

Zig 느낌으로 쓰면 대충 이런 식이다.

```zig
const Ast = struct {
    decls: []Decl,
};

const Decl = union(enum) {
    var_decl: VarDecl,
    fn_decl: FnDecl,
};

const Stmt = union(enum) {
    expr_stmt: ExprStmt,
    block: BlockStmt,
    if_stmt: IfStmt,
    while_stmt: WhileStmt,
    return_stmt: ReturnStmt,
};

const Expr = union(enum) {
    int_lit: IntLit,
    name: NameExpr,
    unary: UnaryExpr,
    binary: BinaryExpr,
    call: CallExpr,
};

// detail nodes

const VarDecl = struct {
    name: Token,
    init: ?*Expr,
};

const FnDecl = struct {
    name: Token,
    params: []Param,
    body: *Stmt,
};

const ExprStmt = struct {
    expr: *Expr,
};

const BlockStmt = struct {
    stmts: []*Stmt,
};

const IfStmt = struct {
    cond: *Expr,
    then_branch: *Stmt,
    else_branch: ?*Stmt,
};

const ReturnStmt = struct {
    value: ?*Expr,
};

const IntLit = struct {
    token: Token,
    value: i64,
};

const NameExpr = struct {
    token: Token,
};

const UnaryExpr = struct {
    op: Token,
    expr: *Expr,
};

const BinaryExpr = struct {
    op: Token,
    left: *Expr,
    right: *Expr,
};

const CallExpr = struct {
    callee: *Expr,
    args: []*Expr,
};
```


# 7. 포인터를 왜 쓰냐

AST는 트리라서  
노드 안에 또 노드가 들어간다.

예:

```text
1 + 2 * 3
```

이건

```text
Binary(+)
  left = Int(1)
  right = Binary(*)
            left = Int(2)
            right = Int(3)
```

처럼 중첩되므로 `Expr` 안에 `Expr`가 들어간다.  
그래서 보통 `*Expr`, `*Stmt` 같은 포인터를 둔다.


# 8. 메모리 할당은 보통 arena 사용

AST는 보통 파싱 후 한 번에 오래 쓰고,  
컴파일 끝나면 통째로 버린다.

그래서 개별 free보다 **arena allocator** 가 잘 맞는다.

즉:

- 노드 만들 때 arena에서 할당
- 컴파일 끝나면 arena 전체 해제

이게 제일 편하다.


# 9. Token을 AST에 어디까지 저장할까

보통 2가지 방식이 있다.

## 방식 1: 토큰 전체 저장

```text
name: Token
op: Token
```

장점:

- 에러 위치 추적 쉬움
- 원본 lexeme 접근 쉬움

단점:

- 메모리 조금 더 씀

## 방식 2: 필요한 값만 저장 + span 별도 저장

```text
name: []const u8
span: Span
```

장점:

- 더 가볍게 최적화 가능

처음엔 **토큰 저장 방식**이 편하다.


# 10. span/location 필드는 거의 넣는 게 좋음

에러 메시지용으로 중요하다.

```zig
const Span = struct {
    start: u32,
    end: u32,
    line: u32,
    column: u32,
};
```

각 노드에 직접 넣거나, 최소한 대표 토큰을 넣어두면 좋다.

예:

```zig
const BinaryExpr = struct {
    op: Token,
    left: *Expr,
    right: *Expr,
};
```

여기서 에러 위치는 `op.span` 으로 잡을 수 있다.


# 11. 처음엔 너무 많은 노드 만들지 말기

처음 구현은 작게 가는 게 좋다.

예를 들면 최소 버전:

```text
Expr
  - IntLit
  - Name
  - Unary
  - Binary

Stmt
  - ExprStmt
  - Block
  - If
  - Return

Decl
  - Var
  - Fn
```

이 정도만 있어도 언어 기본 골격은 된다.

그 다음 필요할 때 추가:

- Call
- Assign
- Struct
- Member
- Index
- For
- Match


# 12. 예제로 보면 더 쉬움

코드:

```text
let x = 1 + 2 * 3;
```

AST:

```text
VarDecl
  name = "x"
  init =
    Binary(+)
      left = IntLit(1)
      right =
        Binary(*)
          left = IntLit(2)
          right = IntLit(3)
```

코드:

```text
if (x > 0) return x;
else return 0;
```

AST:

```text
IfStmt
  cond =
    Binary(>)
      left = Name("x")
      right = IntLit(0)
  then_branch =
    ReturnStmt(Name("x"))
  else_branch =
    ReturnStmt(IntLit(0))
```


# 13. Program / Decl / Stmt / Expr를 분리하는 전형 구조

이런 구조가 가장 무난하다.

```zig
const Ast = struct {
    decls: []Decl,
};

const Decl = union(enum) {
    var_decl: VarDecl,
    fn_decl: FnDecl,
};

const Stmt = union(enum) {
    block: BlockStmt,
    expr_stmt: ExprStmt,
    if_stmt: IfStmt,
    return_stmt: ReturnStmt,
};

const Expr = union(enum) {
    int_lit: IntLit,
    name: NameExpr,
    unary: UnaryExpr,
    binary: BinaryExpr,
};
```

# 14. 파서와 연결되는 방식

예를 들어 함수들이 이렇게 대응된다.

```text
parseDecl() -> *Decl
parseStmt() -> *Stmt
parseExpr() -> *Expr
```

그리고 내부에서 arena로 노드 생성:

```text
parseBinary()
  left = parseUnary()
  if plus:
      right = parseUnary()
      make BinaryExpr
      return *Expr
```


# 15. 개인적으로 추천하는 설계

처음엔 이렇게 가는 게 제일 편하다.

- `Program` 는 최상위 `[]*Decl`
- `Decl`, `Stmt`, `Expr` 는 각각 tagged union
- 세부 노드는 struct
- 하위 노드는 포인터로 연결
- arena allocator 사용
- 에러 위치용 token/span 저장

즉 느낌상:

```text
Program
  -> Decl union
      -> concrete struct
          -> child pointers
```


# 16. 아주 최소 예시

정말 최소한으로 잡으면:

```zig
const Expr = union(enum) {
    int_lit: i64,
    name: Token,
    binary: struct {
        op: Token,
        left: *Expr,
        right: *Expr,
    },
};

const Stmt = union(enum) {
    expr_stmt: *Expr,
    return_stmt: ?*Expr,
};

const Decl = union(enum) {
    var_decl: struct {
        name: Token,
        init: ?*Expr,
    },
};
```

이렇게부터 시작해도 된다.


# 17. 흔한 실수

## 1) CST처럼 너무 자세히 만들기

괄호, 세미콜론, 쉼표까지 전부 AST에 넣으면 지저분해진다.

## 2) Expr/Stmt/Decl 경계 흐리기

처음엔 합쳐도 될 것 같지만 금방 복잡해진다.

## 3) 노드에 부모 포인터까지 넣기

초반에는 필요 없는 경우가 많다.

## 4) 파싱용 정보와 시맨틱용 정보를 한 구조에 다 밀어넣기

처음에는 괜찮지만 점점 지저분해진다.


# 18. 실전에서는 나중에 보통 분리한다

초기:

- AST 노드만 있음

중기 이후:

- AST
- Symbol
- Type
- Semantic info

즉 AST는 문법 구조만 갖고,  
타입 정보나 심볼 참조는 별도 테이블로 두거나 나중에 붙인다.

예를 들면 `NameExpr` 가 처음엔 그냥 이름 문자열만 갖고 있다가,  
시맨틱 후에는 어떤 변수 선언을 가리키는지 연결 정보가 붙는다.