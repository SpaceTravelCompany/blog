// ========================================
// 공통 기능 (동적 로드, 테마, 메뉴 등)
// ========================================

document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.5s ease';
window.addEventListener('load', function () {
    document.body.style.opacity = '1';
});

// Smooth scroll for in-page anchors (main document, e.g. post body)
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        var href = this.getAttribute('href');
        if (!href || href === '#') return;
        try {
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (err) {}
    });
});

// runInit 함수: 테마 변경, 모바일 메뉴 토글, 헤더 스크롤 효과 등 UI 초기화 기능 담당
// header/footer 완료시 실행
function runInit() {
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        var themeIcon = themeToggle.querySelector('.theme-icon');
        var currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (themeIcon) {
            themeIcon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
        }
        themeToggle.addEventListener('click', function () {
            var current = document.documentElement.getAttribute('data-theme');
            var newTheme = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            if (themeIcon) {
                themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
            }
        });
    }

    var mobileMenuToggle = document.getElementById('mobileMenuToggle');
    var navMenu = document.getElementById('navMenu');
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function () {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }

    var header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', function () {
            var currentScroll = window.pageYOffset;
            if (currentScroll > 100) {
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
            } else {
                header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            }
        });
    }
}

(function () {
    var headerPlaceholder = document.getElementById('header-placeholder');
    var footerPlaceholder = document.getElementById('footer-placeholder');

    if (!headerPlaceholder && !footerPlaceholder) return;

    Promise.all([
        headerPlaceholder ? fetch('partials/header.html').then(function (r) { return r.text(); }) : Promise.resolve(''),
        footerPlaceholder ? fetch('partials/footer.html').then(function (r) { return r.text(); }) : Promise.resolve('')
    ]).then(function (results) {
        var headerHtml = results[0];
        var footerHtml = results[1];
        if (headerPlaceholder && headerHtml) {
            headerPlaceholder.outerHTML = headerHtml;
        }
        if (footerPlaceholder && footerHtml) {
            footerPlaceholder.outerHTML = footerHtml;
        }
        runInit();
    }).catch(function (err) {
        console.error('Layout load failed:', err);
        runInit();
    });
})();

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
