// ========================================
// 공통 기능 (다크모드, 모바일 메뉴, 헤더 등)
// ========================================

// 다크 모드 토글
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const themeIcon = themeToggle.querySelector('.theme-icon');

    // 저장된 테마 불러오기
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (themeIcon) {
        themeIcon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }

    // 테마 토글 이벤트
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        if (themeIcon) {
            themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        }
    });
}

// 모바일 메뉴 토글
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle && navMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        mobileMenuToggle.classList.toggle('active');
    });
}

// 스크롤 시 헤더 스타일 변경
const header = document.querySelector('.header');
if (header) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });
}

// 부드러운 스크롤 (유효한 앵커 링크만 처리)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // '#'만 있거나 빈 문자열인 경우 무시
        if (!href || href === '#') {
            return;
        }
        
        try {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        } catch (error) {
            // 유효하지 않은 셀렉터인 경우 무시
        }
    });
});

// 페이지 로드 시 페이드인 애니메이션
// 즉시 실행하여 초기 상태 설정 (깜빡임 방지)
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';

// 모든 리소스 로드 후 페이드인 (콘텐츠 로딩 완료 후)
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// ========================================
// 공통 유틸리티 함수
// ========================================

// Frontmatter 파싱 함수
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        return { metadata: {}, body: content };
    }

    const frontmatter = match[1];
    const body = match[2];
    const metadata = {};

    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            metadata[key] = value;
        }
    });

    return { metadata, body };
}

// 본문에서 excerpt 추출 (첫 120자 정도)
function extractExcerpt(body, maxLength = 120) {
    // 마크다운 문법 제거
    let text = body
        .replace(/^#+\s+.*$/gm, '') // 헤딩 제거
        .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
        .replace(/`[^`]+`/g, '') // 인라인 코드 제거
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 링크 텍스트만 유지
        .replace(/[*_~]+/g, '') // 강조 문법 제거
        .replace(/^\s*[-*]\s+/gm, '') // 리스트 마커 제거
        .replace(/^\s*\d+\.\s+/gm, '') // 숫자 리스트 마커 제거
        .replace(/\n+/g, ' ') // 줄바꿈을 공백으로
        .trim();
    
    if (text.length <= maxLength) {
        return text;
    }
    
    // 단어 단위로 자르기
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}
