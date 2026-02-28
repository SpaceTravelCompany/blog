자세한 정보는 [Git-Book](https://git-scm.com/book/ko/v2)  
필요시 내용 추가 하겠습니다.

## 기본 설정

### 사용자 정보 설정

```bash
git config --global user.name "이름"
git config --global user.email "이메일@example.com"
```

### 설정 확인

```bash
git config --list
```

---

## 저장소 생성 및 클론

### 새 저장소 초기화

```bash
git init
```

### 원격 저장소 클론

```bash
git clone <URL>
git clone <URL> <폴더명>  # 특정 폴더명으로 클론
```

### 특정 브랜치만 클론

```bash
git clone -b <브랜치명> <URL>
```

---

## 기본 워크플로우

### 상태 확인

```bash
git status
git status -s  # 간단하게 보기
```

### 변경사항 확인

```bash
git diff                    # 워킹 디렉토리 변경사항
git diff --staged           # 스테이징된 변경사항
git diff <브랜치1> <브랜치2>  # 브랜치 간 차이
```

### 파일 스테이징

```bash
git add <파일명>
git add .                   # 모든 변경사항 추가
git add -A                  # 삭제된 파일 포함 모든 변경사항
git add -p                  # 대화형으로 부분 추가
```

### 커밋

```bash
git commit -m "커밋 메시지"
git commit -am "메시지"     # add + commit (추적 중인 파일만)
git commit --amend          # 마지막 커밋 수정
git commit --amend -m "새 메시지"  # 커밋 메시지만 수정
```

### 마지막 커밋에 변경 사항 추가 (amend, 메시지 유지)

```bash
# 추가할 파일 스테이징
git add .

# 마지막 커밋에 합치고, 메시지는 수정하지 않음
git commit --amend --no-edit
```

- `--amend`: 마지막 커밋을 “고치는” 커밋으로 만듦
- `--no-edit`: 기존 커밋 메시지 그대로 사용 (에디터 안 뜸)

메시지를 바꾸고 싶으면 `--no-edit`만 빼고 `git commit --amend` → 에디터에서 수정.

**이미 푸시한 커밋을 amend 했다면** 원격에 덮어쓰려면:

```bash
git push --force-with-lease
```

---

## 파일/폴더 복구

### 마지막 커밋으로 특정 파일/폴더 복구

```bash
git checkout HEAD -- <파일경로>
git checkout HEAD -- <폴더경로>/
```

### 특정 커밋에서 파일/폴더 복구

```bash
git checkout <커밋해시> -- <파일경로>
git checkout <커밋해시> -- <폴더경로>/
```

### 원격 저장소(origin)에서 복구

```bash
git fetch origin
git checkout origin/master -- <파일경로>
git checkout origin/main -- <폴더경로>/
```

### 원본 저장소(upstream)에서 복구 (Fork한 경우)

```bash
# upstream 원격 저장소 추가 (최초 1회)
git remote add upstream <원본저장소URL>

# upstream에서 가져와서 복구
git fetch upstream
git checkout upstream/master -- <파일경로>
git checkout upstream/master -- <폴더경로>/
```

### 스테이징 취소 (파일은 유지)

```bash
git reset HEAD <파일명>
git restore --staged <파일명>  # Git 2.23+
```

### 워킹 디렉토리 변경사항 취소

```bash
git checkout -- <파일명>
git restore <파일명>          # Git 2.23+
```

### 모든 변경사항 버리고 완전 초기화

```bash
git reset --hard HEAD
git clean -fd                # 추적되지 않는 파일/폴더 삭제
```

### 특정 커밋으로 되돌리기

```bash
git reset --soft <커밋해시>   # 커밋만 취소, 변경사항 스테이징 유지
git reset --mixed <커밋해시>  # 커밋+스테이징 취소, 파일 유지
git reset --hard <커밋해시>   # 모든 것 취소 (주의!)
```

### 커밋 되돌리기 (새 커밋 생성)

```bash
git revert <커밋해시>
git revert HEAD              # 마지막 커밋 되돌리기
```

---

## 브랜치 관리

### 브랜치 목록 확인

```bash
git branch                  # 로컬 브랜치
git branch -r               # 원격 브랜치
git branch -a               # 모든 브랜치
git branch -v               # 마지막 커밋 정보 포함
```

### 브랜치 생성 및 전환

```bash
git branch <브랜치명>        # 브랜치 생성
git checkout <브랜치명>      # 브랜치 전환
git checkout -b <브랜치명>   # 생성 + 전환
git switch <브랜치명>        # 브랜치 전환 (Git 2.23+)
git switch -c <브랜치명>     # 생성 + 전환 (Git 2.23+)
```

### 브랜치 삭제

```bash
git branch -d <브랜치명>     # 병합된 브랜치 삭제
git branch -D <브랜치명>     # 강제 삭제
git push origin --delete <브랜치명>  # 원격 브랜치 삭제
```

### 브랜치 병합

```bash
git merge <브랜치명>
git merge --no-ff <브랜치명>  # Fast-forward 없이 병합 커밋 생성
git merge --squash <브랜치명> # 커밋들을 하나로 합쳐서 병합
```

### 리베이스

```bash
git rebase <브랜치명>
git rebase -i HEAD~3         # 대화형 리베이스 (최근 3개 커밋)
git rebase --abort           # 리베이스 중단
git rebase --continue        # 충돌 해결 후 계속
```

---

## 원격 저장소

### 원격 저장소 확인

```bash
git remote -v
```

### 원격 저장소 추가/삭제

```bash
git remote add <이름> <URL>
git remote remove <이름>
git remote rename <기존이름> <새이름>
```

### 원격 저장소에서 가져오기

```bash
git fetch                   # 변경사항만 가져오기
git fetch --all             # 모든 원격 저장소에서 가져오기
git pull                    # fetch + merge
git pull --rebase           # fetch + rebase
```

### 원격 저장소로 푸시

```bash
git push
git push origin <브랜치명>
git push -u origin <브랜치명>  # upstream 설정 + 푸시
git push --force             # 강제 푸시 (주의!)
git push --force-with-lease  # 안전한 강제 푸시 (상세는 아래 'Checkout · Fetch · Upstream · Force-with-lease' 참고)
```

---

## Checkout · Fetch · Upstream · Force-with-lease

### Checkout

**"이 버전으로 작업 트리를 맞춘다"**는 뜻이다.

#### 1) 브랜치 체크아웃

```bash
git checkout main
git checkout feature-branch
```

- **HEAD**가 해당 브랜치를 가리키게 되고, 작업 디렉터리 파일들이 그 브랜치의 최신 커밋 상태로 바뀐다.

#### 2) 특정 파일/경로만 이전 버전으로 복구

```bash
git checkout <커밋또는브랜치> -- <파일경로>
# 예: git checkout HEAD~1 -- src/main.c   # 한 커밋 전 버전으로 main.c만 되돌림
```

- 브랜치는 그대로 두고, **지정한 경로의 파일만** 해당 ref 버전으로 덮어쓴다.
- 실수로 수정한 파일을 되돌릴 때 자주 쓴다.
- 최신 Git에서는 `git restore <path>` 또는 `git restore --source=<ref> <path>`로 같은 동작을 할 수 있다.

#### 3) Detached HEAD

```bash
git checkout abc1234   # 커밋 해시로 체크아웃
```

- 브랜치가 아니라 **특정 커밋**을 가리키는 상태. HEAD가 브랜치를 가리키지 않아 "떠 있는" 상태라 detached HEAD라고 한다.
- 과거 커밋을 살펴보거나 테스트할 때 사용. 새 커밋을 만들면 나중에 찾기 어려우니, 확인만 하고 `git checkout main` 등으로 돌아오는 게 좋다.

---

### Fetch

**"원격 저장소의 최신 정보를 가져오기만 하고, 내 작업 트리는 변경하지 않는다."**

#### Fetch vs Pull


| 명령          | 동작                                                                       |
| ----------- | ------------------------------------------------------------------------ |
| `git fetch` | 원격의 커밋·브랜치 정보만 가져옴. `origin/main` 같은 **원격 추적 브랜치**만 갱신. 작업 디렉터리 파일은 그대로. |
| `git pull`  | fetch + merge. 원격 정보를 가져온 뒤 **현재 브랜치에 바로 merge**해서 작업 트리 변경.             |


#### Fetch를 쓰는 이유

1. **원격 상태 먼저 확인**
  `git fetch` 후 `git log origin/main` 또는 `git diff main origin/main`으로 차이를 보고, merge/rebase를 할지 결정할 수 있다.
2. **충돌 방지**
  `pull`은 바로 merge라서 충돌이 나면 당장 해결해야 한다. `fetch`는 정보만 가져오므로, 나중에 `git merge origin/main` 또는 `git rebase origin/main`으로 직접 적용할 수 있다.
3. **다른 사람의 작업 확인**
  `git fetch` 후 `git checkout origin/feature-x`로 원격 브랜치를 체크아웃해 보면서, merge 전에 코드를 확인할 수 있다.

#### 정리

- **Fetch** = "원격 정보만 다운로드" (작업 트리 변경 없음)
- **Pull** = "원격 정보 다운로드 + 현재 브랜치에 합치기" (작업 트리 변경됨)

---

### 기타 용어


| 용어            | 설명                                                |
| ------------- | ------------------------------------------------- |
| **origin**    | 보통 내가 push/pull 하는 저장소                            |
| **upstream**  | 참조용 원본 저장소. `git remote add upstream <url>` 로 추가. |
| **원격 추적 브랜치** | `origin/main` 같은 ref. fetch 시 갱신됨.                |


---

### Force push


| 옵션                   | 동작                                   |
| -------------------- | ------------------------------------ |
| `--force`            | 원격을 무조건 로컬로 덮어씀. 동료 커밋 덮어쓸 위험 있음.    |
| `--force-with-lease` | 원격 추적 브랜치와 원격이 같을 때만 허용. 다르면 거부(안전). |


---

## Submodule

다른 Git 저장소를 **특정 경로**에 넣고, 부모는 그 **특정 커밋**만 가리킨다. 공통 코드를 여러 프로젝트에서 쓰되, 각 저장소 커밋은 독립 관리.

### 핵심 개념

- 부모는 서브모듈 **경로**와 **커밋 해시**만 저장 (파일 내용은 서브모듈 저장소에만 있음).
- `.gitmodules`에 경로·URL 매핑이 기록됨.
- 서브모듈 디렉터리는 `mode 160000`(일반 파일 아님).

### 기본 명령


| 명령                                          | 설명                                                      |
| ------------------------------------------- | ------------------------------------------------------- |
| `git submodule add <url> [path]`            | 서브모듈 추가. path 생략 시 URL의 디렉터리명 사용                        |
| `git clone --recurse-submodules <url>`      | 클론 시 서브모듈까지 한 번에 받기                                     |
| `git submodule update --init [--recursive]` | 이미 클론한 뒤 서브모듈만 채우기                                      |
| `git submodule update --remote [path]`      | 서브모듈을 원격 최신으로 갱신. `--recursive`로 중첩 서브모듈 포함             |
| `git submodule foreach <cmd>`               | 모든 서브모듈에 동일 명령 실행 (예: `git submodule foreach git pull`) |


### update vs update --remote


| 명령                              | 동작                                       |
| ------------------------------- | ---------------------------------------- |
| `git submodule update`          | 부모가 가리키는 **커밋**으로 checkout (부모 커밋 시점 버전) |
| `git submodule update --remote` | 원격 저장소 **최신**으로 fetch 후 checkout         |


### 기존 폴더를 서브모듈로 교체

```bash
git rm -r <기존경로>                    # 기존 폴더 제거
git submodule add <url> <경로>         # 같은 경로에 서브모듈 추가
git add .gitmodules <경로>
git commit -m "Replace <경로> with submodule"
```

### 서브모듈 수정 후 부모에 반영

1. 서브모듈 디렉터리에서 수정 → `git add` → `git commit` → `git push`
2. 부모 저장소에서 `git add <서브모듈경로>` → `git commit` (부모가 가리키는 커밋 갱신)

### 브랜치 지정 (update --remote 시)

기본은 `master`. 다른 브랜치 쓰려면:

```bash
git config -f .gitmodules submodule.<이름>.branch main
```

---

## 태그

### 태그 목록

```bash
git tag
git tag -l "v1.*"           # 패턴으로 검색
```

### 태그 생성

```bash
git tag <태그명>                    # Lightweight 태그
git tag -a <태그명> -m "메시지"      # Annotated 태그
git tag -a <태그명> <커밋해시>       # 특정 커밋에 태그
git tag -f <태그명>                 # 기존 로컬 태그가 있으면 덮어쓰기
```

`-f` (--force): 같은 이름의 로컬 태그가 이미 있으면 새 커밋을 가리키도록 덮어씀. 이후 `git push origin <태그명> --force`로 원격에도 반영.

### 태그 푸시

```bash
git push origin <태그명>
git push origin --tags      # 모든 태그 푸시
```

### 태그 강제 푸시

이미 원격에 있는 태그를 다른 커밋을 가리키도록 **덮어쓸** 때 사용. 잘못된 커밋에 태그를 달았을 때 수정용.

```bash
git push origin <태그명> --force
# 또는 refspec에 + 사용
git push origin +<태그명>
```

주의: 원격 태그를 덮어쓰면, 그 태그를 이미 pull한 동료의 로컬과 불일치할 수 있음. 공유된 태그는 되도록 수정하지 말고, 새 태그를 만드는 편이 안전함.

### 태그 삭제

```bash
git tag -d <태그명>                 # 로컬 태그 삭제
git push origin --delete <태그명>   # 원격 태그 삭제
```

