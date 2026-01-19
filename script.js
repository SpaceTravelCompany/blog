// ========================================
// 메인 페이지 전용 스크립트 (index.html)
// ========================================

// 검색 기능 (제목만 검색)
function searchPosts(term) {
    searchTerm = term.trim().toLowerCase();
    
    if (!searchTerm) {
        // 검색어가 없으면 전체 포스트 표시
        filteredPosts = [];
        selectedCategory = null;
        displayPosts(1);
        loadCategories();
        return;
    }
    
    // 제목에서만 검색 (posts.json에서 이미 로드된 정보 사용)
    filteredPosts = allPosts.filter(post => {
        const titleMatch = (post.title || '').toLowerCase().includes(searchTerm);
        return titleMatch;
    });
    
    // 검색 결과 표시
    selectedCategory = null; // 카테고리 필터 해제
    displayPosts(1);
    loadCategories();
}

// 검색 폼 제출
const searchForm = document.querySelector('.search-form');
if (searchForm) {
    const searchInput = searchForm.querySelector('.search-input');
    
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const term = searchInput.value.trim();
        searchPosts(term);
    });
    
    // 검색어 지우기 기능 (Escape 키)
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            searchPosts('');
        }
    });
}

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

// 전역 변수
let allPosts = [];  // 기본 정보만 (id, category)
let loadedPosts = {};  // 로드된 포스트 캐시 (id -> 상세 정보)
let filteredPosts = [];
let currentPage = 1;
const postsPerPage = 5;
let totalPages = 0;
let selectedCategory = null;
let searchTerm = '';
const cacheBuster = `?v=${Date.now()}`;
// 포스트 기본 데이터 로드 (posts.json에서 id, 카테고리, 제목, 날짜 정보)
async function loadPostsData() {
    try {
        const response = await fetch(`posts/posts.json${cacheBuster}`);
        if (!response.ok) {
            throw new Error('포스트를 불러올 수 없습니다.');
        }
        const data = await response.json();
        
        // category_posts에서 포스트 정보 추출
        const categoryPosts = data.find(item => item.category_posts)?.category_posts || [];
        const postIds = [];
        
        categoryPosts.forEach(cat => {
            cat.posts.forEach(post => {
                postIds.push({ 
                    id: post.id, 
                    category: cat.category, 
                    title: post.title || '',
                    date: post.date || ''
                });
            });
        });
        
        // date 기준 정렬 (최신순 = 날짜 내림차순)
        postIds.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        allPosts = postIds;
        totalPages = Math.ceil(allPosts.length / postsPerPage);
        return allPosts;
    } catch (error) {
        console.error('포스트 데이터 로드 오류:', error);
        return [];
    }
}

// 특정 포스트의 상세 정보 로드 (lazy loading)
async function loadPostDetail(postId) {
    // 이미 로드된 경우 캐시에서 반환
    if (loadedPosts[postId]) {
        return loadedPosts[postId];
    }
    
    // allPosts에서 기본 정보 가져오기
    const postInfo = allPosts.find(p => p.id === postId);
    
    try {
        const mdResponse = await fetch(`posts/${postId}.md${cacheBuster}`);
        if (!mdResponse.ok) return null;
        
        const content = await mdResponse.text();
        const { metadata, body } = parseFrontmatter(content);
        
        const post = {
            id: postId,
            title: metadata.title || '제목 없음',
            date: postInfo?.date || '',
            category: postInfo?.category || '기타',
            excerpt: extractExcerpt(body)
        };
        
        // 캐시에 저장
        loadedPosts[postId] = post;
        return post;
    } catch (error) {
        console.error(`포스트 ${postId} 로드 실패:`, error);
        return null;
    }
}

// 여러 포스트 동시 로드
async function loadPostDetails(postIds) {
    const promises = postIds.map(id => loadPostDetail(id));
    return await Promise.all(promises);
}

// 포스트 표시 함수
async function displayPosts(page) {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;

    currentPage = page;
    
    // 필터링된 포스트 또는 전체 포스트 사용
    let postsToDisplay = allPosts;
    if (searchTerm) {
        postsToDisplay = filteredPosts;
    } else if (selectedCategory) {
        postsToDisplay = filteredPosts;
    }
    const startIndex = (page - 1) * postsPerPage;
    const endIndex = startIndex + postsPerPage;
    const postsToShow = postsToDisplay.slice(startIndex, endIndex);

    // 검색 결과 개수 표시 업데이트
    updateSectionTitle(postsToDisplay.length, searchTerm);

    postsContainer.innerHTML = '';

    // 검색 결과가 없을 때 메시지 표시
    if (postsToDisplay.length === 0) {
        if (searchTerm) {
            // XSS 방지를 위해 텍스트 노드로 삽입
            const noPostsDiv = document.createElement('div');
            noPostsDiv.className = 'no-posts';
            
            const p1 = document.createElement('p');
            p1.textContent = '검색 결과가 없습니다.';
            
            const p2 = document.createElement('p');
            p2.style.cssText = 'margin-top: 0.5rem; color: var(--text-light); font-size: 0.9rem;';
            p2.innerHTML = '"<strong></strong>"에 대한 검색 결과를 찾을 수 없습니다.';
            p2.querySelector('strong').textContent = searchTerm;
            
            noPostsDiv.appendChild(p1);
            noPostsDiv.appendChild(p2);
            postsContainer.innerHTML = '';
            postsContainer.appendChild(noPostsDiv);
        } else {
            postsContainer.innerHTML = '<div class="no-posts">포스트가 없습니다.</div>';
        }
        updatePagination();
        return;
    }

    // 로딩 표시
    postsContainer.innerHTML = '<div class="loading-message">포스트를 불러오는 중...</div>';

    // 현재 페이지에 표시할 포스트만 로드 (lazy loading)
    const postIds = postsToShow.map(p => p.id);
    const loadedPostDetails = await loadPostDetails(postIds);
    
    // 이전에 관찰 중인 요소들 해제
    observer.disconnect();
    
    postsContainer.innerHTML = '';

    // 각 포스트에 대해 카드 생성
    for (const post of loadedPostDetails) {
        if (!post) continue;
        
        const article = document.createElement('article');
        article.className = 'post-card';
        article.innerHTML = `
            <div class="post-content">
                <div class="post-meta">
                    <span class="post-date">${post.date}</span>
                    <span class="post-category">${post.category}</span>
                </div>
                <h3 class="post-title">
                    <a href="post_template.html?id=${post.id}">${post.title}</a>
                </h3>
                <p class="post-excerpt">${post.excerpt}</p>
                <a href="post_template.html?id=${post.id}" class="read-more">더 읽기 →</a>
            </div>
        `;

        // 애니메이션 적용
        article.style.opacity = '0';
        article.style.transform = 'translateY(20px)';
        observer.observe(article);

        postsContainer.appendChild(article);
    }

    // 페이지네이션 업데이트
    updatePagination();
}

// 섹션 제목 업데이트 (검색 결과 개수 표시)
function updateSectionTitle(count, searchTerm) {
    const sectionTitle = document.querySelector('.section-title');
    if (!sectionTitle) return;
    
    if (searchTerm) {
        sectionTitle.textContent = `검색 결과 (${count}개)`;
        sectionTitle.style.display = 'block';
    } else if (selectedCategory) {
        sectionTitle.textContent = `${selectedCategory} 포스트 (${count}개)`;
        sectionTitle.style.display = 'block';
    } else {
        // 검색어나 카테고리가 없을 때는 제목 숨기기
        sectionTitle.style.display = 'none';
    }
}

// 페이지네이션 업데이트
function updatePagination() {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    // 필터링된 포스트 또는 전체 포스트 사용
    let postsToDisplay = allPosts;
    if (searchTerm) {
        postsToDisplay = filteredPosts;
    } else if (selectedCategory) {
        postsToDisplay = filteredPosts;
    }
    
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

    // 페이지 번호 버튼 생성
    const maxVisible = 5; // 최대 표시할 페이지 버튼 수
    let startPage, endPage;
    
    if (totalPages <= maxVisible) {
        // 전체 페이지가 maxVisible 이하면 모두 표시
        startPage = 1;
        endPage = totalPages;
    } else {
        // 현재 페이지를 중심으로 표시
        const half = 2//Math.floor(maxVisible / 2);
        
        if (currentPage <= half + 1) {
            // 앞쪽에 있을 때
            startPage = 1;
            endPage = maxVisible;
        } else if (currentPage >= totalPages - half) {
            // 뒤쪽에 있을 때
            startPage = totalPages - maxVisible + 1;
            endPage = totalPages;
        } else {
            // 중간에 있을 때
            startPage = currentPage - half;
            endPage = currentPage + half;
        }
    }
    
    // 첫 페이지와 ... 표시
    if (startPage > 1) {
        paginationHTML += `<a href="#" class="pagination-btn" data-page="1">1</a>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }
    
    // 페이지 번호 버튼
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<a href="#" class="pagination-btn active" data-page="${i}">${i}</a>`;
        } else {
            paginationHTML += `<a href="#" class="pagination-btn" data-page="${i}">${i}</a>`;
        }
    }
    
    // 마지막 페이지와 ... 표시
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<a href="#" class="pagination-btn" data-page="${totalPages}">${totalPages}</a>`;
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
async function loadRecentPosts() {
    const recentPostsContainer = document.getElementById('recentPostsContainer');
    if (!recentPostsContainer) return;

    // 최근 3개 포스트 가져오기
    const recentPostIds = allPosts.slice(0, 3).map(p => p.id);
    
    if (recentPostIds.length === 0) {
        recentPostsContainer.innerHTML = '<li>포스트가 없습니다.</li>';
        return;
    }

    // 최근 포스트 상세 정보 로드
    const recentPosts = await loadPostDetails(recentPostIds);
    recentPostsContainer.innerHTML = '';

    recentPosts.forEach(post => {
        if (!post) return;
        const li = document.createElement('li');
        // 날짜 형식 변환: "2024-01-15 09:30" -> "2024.01.15"
        const dateFormatted = post.date.split(' ')[0].replace(/-/g, '.');
        
        li.innerHTML = `
            <a href="post_template.html?id=${post.id}">
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

    // 카테고리별 포스트 개수 계산 (allPosts에 이미 category 정보 있음)
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
        selectedCategory = null;
        filteredPosts = [];
    } else if (selectedCategory === category) {
        selectedCategory = null;
        filteredPosts = [];
    } else {
        selectedCategory = category;
        filteredPosts = allPosts.filter(post => post.category === category);
    }

    searchTerm = '';
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    
    loadCategories();
    displayPosts(1);
}

// 페이지 로드 시 초기화
window.addEventListener('DOMContentLoaded', async () => {
    // 메인 페이지인 경우에만 실행
    if (document.getElementById('postsContainer')) {
        await loadPostsData();
        await displayPosts(1);
        loadRecentPosts();
        loadCategories();
    }
});
