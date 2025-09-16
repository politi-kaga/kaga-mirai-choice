// 政策比較ページ用JavaScript
// API設定
const API_URL = 'https://script.google.com/macros/s/AKfycbxYQFMMz-Xh2vIDrj6FznzbuunLbdK26_oWz32KM3YjOIgQ6cmDQNV1KzMIEElUp16K/exec';

// グローバル変数
let candidatesData = [];
let categoriesData = {};

// ページ読み込み時にAPIからデータを取得
document.addEventListener('DOMContentLoaded', function() {
    loadCandidatesData();
    updateScrollIndicator();
});

// APIからデータを取得
async function loadCandidatesData() {
    try {
        console.log('🚀 APIからデータを取得中...', new Date().toLocaleTimeString());
        
        showLoadingState();
        
        const startTime = performance.now();
        
        let response;
        try {
            response = await fetch(API_URL);
        } catch (corsError) {
            console.warn('⚠️ Standard fetch failed, trying with minimal headers');
            response = await fetch(API_URL, {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit'
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('データが空または無効な形式です');
        }
        
        candidatesData = data;
        console.log('取得したデータ:', candidatesData);
        
        // データを処理
        processCandidatesData();
        updateComparisonData();
        
        const totalTime = performance.now() - startTime;
        console.log(`✅ 全体完了時間: ${totalTime.toFixed(2)}ms`);
        
    } catch (error) {
        console.error('API取得エラー:', error);
        hideLoadingState();
        showError('データの取得に失敗しました。しばらく後に再度お試しください。');
    }
}

// データを処理してカテゴリ別に整理（基本情報は除外）
function processCandidatesData() {
    categoriesData = {};
    
    candidatesData.forEach(candidate => {
        Object.keys(candidate).forEach(key => {
            // カテゴリ情報を抽出（基本情報は除外）
            const categoryMatch = key.match(/【(\d+_[^】]+)】(.+)/);
            if (categoryMatch && !key.includes('00_基本情報')) {
                const categoryName = categoryMatch[1];
                const questionText = categoryMatch[2];
                const answer = candidate[key];
                
                if (!categoriesData[categoryName]) {
                    categoriesData[categoryName] = {};
                }
                
                if (!categoriesData[categoryName][questionText]) {
                    categoriesData[categoryName][questionText] = [];
                }
                
                const candidateName = getCandidateValue(candidate, [
                    '【00_基本情報】氏名',
                    '【00_基本情報】氏名（ふりがな）',
                    '【基本情報】氏名',
                    '【基本情報】氏名（ふりがな）',
                    '氏名（ふりがな）',
                    '氏名',
                    '名前'
                ]) || '不明';
                
                const candidateParty = getCandidateValue(candidate, [
                    '【00_基本情報】所属政党',
                    '【基本情報】所属政党',
                    '所属政党',
                    '政党'
                ]) || '無所属';
                
                categoriesData[categoryName][questionText].push({
                    name: candidateName,
                    party: candidateParty,
                    answer: answer || '回答なし'
                });
            }
        });
    });
    
    console.log('処理されたカテゴリデータ:', categoriesData);
}

// 候補者データから値を安全に取得する関数
function getCandidateValue(candidate, searchTerms) {
    for (const term of searchTerms) {
        const value = candidate[term];
        if (value && value.toString().trim()) {
            return value.toString().trim();
        }
    }
    
    // 部分一致での検索
    const keys = Object.keys(candidate);
    for (const term of searchTerms) {
        const matchKey = keys.find(key => key.includes(term.replace(/【.*?】/, '')));
        if (matchKey && candidate[matchKey] && candidate[matchKey].toString().trim()) {
            return candidate[matchKey].toString().trim();
        }
    }
    
    return null;
}

// ローディング状態を表示
function showLoadingState() {
    const loadingHtml = `
        <div class="loading" style="display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 2rem;">
            <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
            <div style="font-weight: 600; color: #3b82f6; margin-bottom: 0.5rem;">政策データを読み込み中...</div>
            <div style="font-size: 0.85rem; color: #6b7280;">しばらくお待ちください</div>
        </div>
        <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
    `;
    
    const categoryTabs = document.querySelector('.category-tabs');
    const categoryContent = document.getElementById('category-content');
    
    if (categoryTabs) categoryTabs.innerHTML = '<div class="loading">🏷️ カテゴリを準備中...</div>';
    if (categoryContent) categoryContent.innerHTML = '<div class="loading">📋 政策データを準備中...</div>';
}

// ローディング状態を解除
function hideLoadingState() {
    // 特別な処理は不要（updateComparisonData等で上書きされる）
}

// 公約比較データを更新
function updateComparisonData() {
    updateCategoryTabs();
}

// カテゴリタブを更新
function updateCategoryTabs() {
    const categoryTabs = document.querySelector('.category-tabs');
    if (!categoryTabs) return;
    
    const categories = Object.keys(categoriesData).sort();
    
    categoryTabs.innerHTML = '';
    categories.forEach((category, index) => {
        const displayName = category.replace(/^\d+_/, '');
        const button = document.createElement('button');
        button.className = `category-tab ${index === 0 ? 'active' : ''}`;
        button.textContent = displayName;
        button.setAttribute('data-category', displayName);
        button.onclick = () => showCategory(index, category);
        categoryTabs.appendChild(button);
    });
    
    // 最初のカテゴリを表示
    if (categories.length > 0) {
        updateCategoryContent(categories[0]);
    }
}

// カテゴリ表示を切り替え
function showCategory(categoryIndex, categoryKey = null) {
    // すべてのタブを非アクティブ
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // クリックされたタブをアクティブ
    document.querySelectorAll('.category-tab')[categoryIndex].classList.add('active');
    
    // カテゴリ別のコンテンツを表示
    if (categoryKey && categoriesData[categoryKey]) {
        updateCategoryContent(categoryKey);
    }
}

// カテゴリコンテンツを更新
function updateCategoryContent(categoryKey) {
    const categoryContent = document.getElementById('category-content');
    if (!categoryContent) return;
    
    const questions = categoriesData[categoryKey];
    let contentHtml = '';
    
    Object.keys(questions).forEach((questionText, index) => {
        const answers = questions[questionText];
        
        contentHtml += `
            <div class="question-card">
                <div class="question-header" onclick="toggleQuestion('${categoryKey}-${index}')">
                    <span class="question-title">${questionText}</span>
                    <span class="question-arrow">▼</span>
                </div>
                <div class="question-content" id="question-${categoryKey}-${index}">
        `;
        
        answers.forEach(answer => {
            if (answer.answer && answer.answer.trim()) {
                contentHtml += `
                    <div class="answer-item">
                        <div class="answer-candidate">${answer.name}（${answer.party}）</div>
                        <div class="answer-text">${answer.answer}</div>
                    </div>
                `;
            }
        });
        
        contentHtml += `
                </div>
            </div>
        `;
    });
    
    categoryContent.innerHTML = contentHtml;
}

// 質問の表示切り替え
function toggleQuestion(questionId) {
    const content = document.getElementById('question-' + questionId);
    if (!content) return;
    
    const header = content.previousElementSibling;
    const arrow = header.querySelector('.question-arrow');
    
    if (content.classList.contains('active')) {
        content.classList.remove('active');
        arrow.textContent = '▼';
    } else {
        content.classList.add('active');
        arrow.textContent = '▲';
    }
}

// カテゴリタブのスクロール機能
function updateScrollIndicator() {
    const tabsContainer = document.querySelector('.category-tabs');
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    if (!tabsContainer || !scrollIndicator) return;
    
    function checkScroll() {
        const isScrollable = tabsContainer.scrollWidth > tabsContainer.clientWidth;
        const isAtEnd = tabsContainer.scrollLeft >= (tabsContainer.scrollWidth - tabsContainer.clientWidth - 10);
        
        if (isScrollable && !isAtEnd) {
            scrollIndicator.style.opacity = '1';
        } else {
            scrollIndicator.style.opacity = '0';
        }
    }
    
    tabsContainer.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    setTimeout(checkScroll, 100);
}

// エラー表示
function showError(message) {
    const categoryTabs = document.querySelector('.category-tabs');
    const categoryContent = document.getElementById('category-content');
    
    if (categoryTabs) categoryTabs.innerHTML = `<div class="loading">${message}</div>`;
    if (categoryContent) categoryContent.innerHTML = `<div class="loading">${message}</div>`;
}