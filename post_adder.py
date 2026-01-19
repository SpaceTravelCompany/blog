import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import json
import shutil
import re
from datetime import datetime
from pathlib import Path

class PostAdder:
    def __init__(self, root):
        self.root = root
        self.root.title("블로그 포스트 추가")
        self.root.geometry("500x500")
        self.root.resizable(False, False)
        
        self.selected_file = None
        self.extracted_title = None
        
        self.setup_ui()
        
    def setup_ui(self):
        # 파일 선택 영역
        file_frame = ttk.LabelFrame(self.root, text="마크다운 파일", padding=10)
        file_frame.pack(fill="x", padx=10, pady=10)
        
        self.file_label = ttk.Label(file_frame, text="파일을 선택하세요", wraplength=400)
        self.file_label.pack(fill="x", pady=5)
        
        ttk.Button(file_frame, text="파일 찾기", command=self.browse_file).pack(pady=5)
        
        # 제목 표시 영역
        title_frame = ttk.LabelFrame(self.root, text="추출된 제목", padding=10)
        title_frame.pack(fill="x", padx=10, pady=10)
        
        self.title_var = tk.StringVar()
        self.title_entry = ttk.Entry(title_frame, textvariable=self.title_var, width=60)
        self.title_entry.pack(fill="x", pady=5)
        
        # 카테고리 선택 영역
        category_frame = ttk.LabelFrame(self.root, text="카테고리", padding=10)
        category_frame.pack(fill="x", padx=10, pady=10)
        
        self.category_var = tk.StringVar()
        self.categories = ["기술", "디자인", "생활"]
        self.category_combo = ttk.Combobox(category_frame, textvariable=self.category_var, 
                                           values=self.categories, state="readonly", width=20)
        self.category_combo.set("기술")
        self.category_combo.pack(pady=5)
        
        # 정보 표시 영역
        info_frame = ttk.LabelFrame(self.root, text="자동 생성 정보", padding=10)
        info_frame.pack(fill="x", padx=10, pady=10)
        
        self.id_label = ttk.Label(info_frame, text="ID: (파일 선택 후 표시)")
        self.id_label.pack(anchor="w")
        
        self.date_label = ttk.Label(info_frame, text="날짜: (추가 시 자동 생성)")
        self.date_label.pack(anchor="w")
        
        # 추가 버튼
        ttk.Button(self.root, text="포스트 추가", command=self.add_post).pack(pady=20)
        
    def browse_file(self):
        file_path = filedialog.askopenfilename(
            title="마크다운 파일 선택",
            filetypes=[("Markdown files", "*.md"), ("All files", "*.*")]
        )
        
        if file_path:
            self.selected_file = file_path
            self.file_label.config(text=file_path)
            self.extract_title()
            self.update_id()
            
    def extract_title(self):
        """파일 이름에서 title 추출"""
        if not self.selected_file:
            return
            
        # 파일 이름에서 확장자 제거하여 제목으로 사용
        file_name = Path(self.selected_file).stem  # 확장자 제외한 파일명
        self.extracted_title = file_name
        self.title_var.set(self.extracted_title)
            
    def get_posts_json_path(self):
        return Path(__file__).parent / "posts" / "posts.json"
    
    def get_posts_folder(self):
        return Path(__file__).parent / "posts"
        
    def load_posts_json(self):
        with open(self.get_posts_json_path(), 'r', encoding='utf-8') as f:
            return json.load(f)
            
    def save_posts_json(self, data):
        with open(self.get_posts_json_path(), 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent='\t')
            
    def get_next_id(self):
        """현재 최대 ID + 1 반환"""
        data = self.load_posts_json()
        max_id = 0
        
        for item in data:
            if "category_posts" in item:
                for category in item["category_posts"]:
                    for post in category["posts"]:
                        post_id = int(post["id"])
                        if post_id > max_id:
                            max_id = post_id
        
        return max_id + 1
        
    def update_id(self):
        """다음 ID 표시"""
        next_id = self.get_next_id()
        self.id_label.config(text=f"ID: {next_id}")
        
    def add_post(self):
        if not self.selected_file:
            messagebox.showerror("오류", "파일을 선택해주세요.")
            return
            
        title = self.title_var.get().strip()
        if not title:
            messagebox.showerror("오류", "제목을 입력해주세요.")
            return
            
        category = self.category_var.get()
        if not category:
            messagebox.showerror("오류", "카테고리를 선택해주세요.")
            return
            
        try:
            # 새 포스트 정보
            new_id = str(self.get_next_id())
            new_date = datetime.now().strftime("%Y-%m-%d %H:%M")
            
            # posts.json 업데이트
            data = self.load_posts_json()
            
            # all_posts_count 증가
            data[0]["all_posts_count"] += 1
            
            # 해당 카테고리에 포스트 추가
            for item in data:
                if "category_posts" in item:
                    for cat in item["category_posts"]:
                        if cat["category"] == category:
                            cat["count"] += 1
                            # 맨 앞에 추가 (최신순)
                            cat["posts"].insert(0, {
                                "id": new_id,
                                "title": title,
                                "date": new_date
                            })
                            break
            
            # posts.json 저장
            self.save_posts_json(data)
            
            # 파일 복사 (title frontmatter 추가)
            dest_path = self.get_posts_folder() / f"{new_id}.md"
            with open(self.selected_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # title frontmatter 추가
            new_content = f"---\ntitle: {title}\n---\n\n{content}"
            
            with open(dest_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            messagebox.showinfo("성공", 
                f"포스트가 추가되었습니다!\n\n"
                f"ID: {new_id}\n"
                f"제목: {title}\n"
                f"카테고리: {category}\n"
                f"날짜: {new_date}\n"
                f"파일: {dest_path}")
            
            # 초기화
            self.selected_file = None
            self.file_label.config(text="파일을 선택하세요")
            self.title_var.set("")
            self.update_id()
            
        except Exception as e:
            messagebox.showerror("오류", f"포스트 추가 실패: {e}")

def main():
    root = tk.Tk()
    app = PostAdder(root)
    root.mainloop()

if __name__ == "__main__":
    main()
