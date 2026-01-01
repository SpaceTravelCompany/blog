// 다크 모드 토글
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

// 저장된 테마 불러오기
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

// 테마 토글 이벤트
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// 모바일 메뉴 토글
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

mobileMenuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    mobileMenuToggle.classList.toggle('active');
});

// 스크롤 시 헤더 스타일 변경
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// 검색 폼 제출
const searchForm = document.querySelector('.search-form');
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchInput = searchForm.querySelector('.search-input');
        const searchTerm = searchInput.value.trim();
        
        if (searchTerm) {
            console.log(`검색어: "${searchTerm}"`);
            // 실제 검색 기능 구현 시 여기에 로직 추가
        }
    });
}

// 부드러운 스크롤
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 포스트 카드 애니메이션 (Intersection Observer)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// 포스트 카드에 애니메이션 적용
document.querySelectorAll('.post-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// 페이지 로드 시 애니메이션
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// 카테고리 및 태그 클릭 이벤트 (예시)
document.querySelectorAll('.category-list a, .tag').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const text = item.textContent.trim();
        console.log(`${text} 클릭됨 - 필터링 기능 구현 예정`);
        // 실제 필터링 기능 구현 시 여기에 로직 추가
    });
});

// 최근 포스트 클릭 이벤트
document.querySelectorAll('.recent-posts a').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('포스트 상세 페이지로 이동 - 구현 예정');
        // 실제 포스트 상세 페이지 이동 로직 추가
    });
});

// 전역 변수
let allPosts = [];
let filteredPosts = [];
let currentPage = 1;
const postsPerPage = 5;
let totalPages = 0;
let selectedCategory = null;

// 포스트 데이터 로드
async function loadPostsData() {
    try {
        const response = await fetch('posts/posts.json');
        if (!response.ok) {
            throw new Error('포스트를 불러올 수 없습니다.');
        }
        allPosts = await response.json();
        totalPages = Math.ceil(allPosts.length / postsPerPage);
        return allPosts;
    } catch (error) {
        console.error('포스트 데이터 로드 오류:', error);
        return [];
    }
}

// 포스트 표시 함수
async function displayPosts(page) {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;

    currentPage = page;
    
    // 필터링된 포스트 또는 전체 포스트 사용
    const postsToDisplay = selectedCategory ? filteredPosts : allPosts;
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = postsToDisplay.slice(startIndex, endIndex);

    postsContainer.innerHTML = '';

    // 각 포스트에 대해 HTML 파일 로드
    for (const post of postsToShow) {
        try {
            const postResponse = await fetch(post.file);
            if (!postResponse.ok) continue;

            const postHtml = await postResponse.text();
            
            // 포스트 카드 생성
            const article = document.createElement('article');
            article.className = 'post-card';
            article.innerHTML = postHtml;

            // 애니메이션 적용
            article.style.opacity = '0';
            article.style.transform = 'translateY(20px)';
            observer.observe(article);

            postsContainer.appendChild(article);
        } catch (error) {
            console.error(`포스트 ${post.file} 로드 실패:`, error);
        }
    }

    // 페이지네이션 업데이트
    updatePagination();
}

// 페이지네이션 업데이트
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    // 필터링된 포스트 또는 전체 포스트 사용
    const postsToDisplay = selectedCategory ? filteredPosts : allPosts;
    
    if (postsToDisplay.length === 0) {
        paginationContainer.innerHTML = '';
        return;
    }

    totalPages = Math.ceil(postsToDisplay.length / postsPerPage);
    let paginationHTML = '';

    // 이전 버튼
    if (currentPage > 1) {
        paginationHTML += `<a href="#" class="pagination-btn" data-page="${currentPage - 1}">이전</a>`;
    } else {
        paginationHTML += `<span class="pagination-btn disabled">이전</span>`;
    }

    // 페이지 번호 버튼 (최대 3페이지)
    for (let i = 1; i <= Math.min(totalPages, 3); i++) {
        if (i === currentPage) {
            paginationHTML += `<a href="#" class="pagination-btn active" data-page="${i}">${i}</a>`;
        } else {
            paginationHTML += `<a href="#" class="pagination-btn" data-page="${i}">${i}</a>`;
        }
    }

    // 다음 버튼
    if (currentPage < totalPages) {
        paginationHTML += `<a href="#" class="pagination-btn" data-page="${currentPage + 1}">다음</a>`;
    } else {
        paginationHTML += `<span class="pagination-btn disabled">다음</span>`;
    }

    paginationContainer.innerHTML = paginationHTML;

    // 페이지네이션 버튼 이벤트 리스너
    paginationContainer.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(btn.getAttribute('data-page'));
            displayPosts(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// 최근 포스트 로드
function loadRecentPosts() {
    const recentPostsContainer = document.getElementById('recentPostsContainer');
    if (!recentPostsContainer) return;

    // 최근 3개 포스트 가져오기
    const recentPosts = allPosts.slice(0, 3);
    recentPostsContainer.innerHTML = '';

    if (recentPosts.length === 0) {
        recentPostsContainer.innerHTML = '<li>포스트가 없습니다.</li>';
        return;
    }

    recentPosts.forEach(post => {
        const li = document.createElement('li');
        const dateFormatted = post.date.replace(/년 |월 |일/g, '.').replace(/\.$/, '');
        
        li.innerHTML = `
            <a href="${post.file}">
                <span class="recent-post-title">${post.title}</span>
                <span class="recent-post-date">${dateFormatted}</span>
            </a>
        `;
        recentPostsContainer.appendChild(li);
    });
}

// 카테고리 로드 및 표시
function loadCategories() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    // 카테고리별 포스트 개수 계산
    const categoryCount = {};
    allPosts.forEach(post => {
        const category = post.category || '기타';
        categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    // 카테고리 리스트 생성
    categoryList.innerHTML = '';
    
    // 전체 보기 옵션 추가
    const allLi = document.createElement('li');
    const allActive = selectedCategory === null ? 'active' : '';
    allLi.innerHTML = `
        <a href="#" class="category-link ${allActive}" data-category="all">
            전체 <span>(${allPosts.length})</span>
        </a>
    `;
    categoryList.appendChild(allLi);
    
    if (Object.keys(categoryCount).length === 0) {
        return;
    }

    // 카테고리를 정렬하여 표시
    const sortedCategories = Object.keys(categoryCount).sort();
    
    sortedCategories.forEach(category => {
        const li = document.createElement('li');
        const count = categoryCount[category];
        const isActive = selectedCategory === category ? 'active' : '';
        
        li.innerHTML = `
            <a href="#" class="category-link ${isActive}" data-category="${category}">
                ${category} <span>(${count})</span>
            </a>
        `;
        categoryList.appendChild(li);
    });

    // 카테고리 클릭 이벤트
    categoryList.querySelectorAll('.category-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            if (category === 'all') {
                // 전체 보기 클릭 시 필터 해제
                filterByCategory(null);
            } else {
                filterByCategory(category);
            }
        });
    });
}

// 카테고리로 필터링
function filterByCategory(category) {
    if (category === null) {
        // 전체 보기
        selectedCategory = null;
        filteredPosts = [];
    } else if (selectedCategory === category) {
        // 같은 카테고리를 다시 클릭하면 전체 보기로
        selectedCategory = null;
        filteredPosts = [];
    } else {
        selectedCategory = category;
        filteredPosts = allPosts.filter(post => post.category === category);
    }
    
    // 카테고리 리스트 업데이트 (활성 상태 변경)
    loadCategories();
    
    // 첫 페이지로 이동하여 필터링된 포스트 표시
    displayPosts(1);
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', async () => {
    await loadPostsData();
    await displayPosts(1);
    loadRecentPosts();
    loadCategories();
});

