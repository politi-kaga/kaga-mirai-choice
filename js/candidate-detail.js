// 候補者詳細ページ用JavaScript
// API設定
const API_URL = 'https://script.google.com/macros/s/AKfycbxYQFMMz-Xh2vIDrj6FznzbuunLbdK26_oWz32KM3YjOIgQ6cmDQNV1KzMIEElUp16K/exec';

// グローバル変数
let candidatesData = [];
let slugMapping = [];
let currentCandidateIndex = null;

// ページ読み込み時にAPIからデータを取得
document.addEventListener('DOMContentLoaded', function() {
    // URLからスラッグを取得
    const pathSegments = window.location.pathname.split('/');
    const candidateSlug = pathSegments[pathSegments.length - 2]; // /candidates/slug/ の slug部分
    
    Promise.all([
        loadCandidatesData(),
        loadSlugMapping()
    ]).then(() => {
        // スラッグから候補者インデックスを特定
        const mapping = slugMapping.find(m => m.slug === candidateSlug);
        if (mapping) {
            currentCandidateIndex = mapping.index;
            renderCandidateDetail(currentCandidateIndex);
        } else {
            // フォールバック: 数値スラッグの場合
            const numericIndex = parseInt(candidateSlug);
            if (!isNaN(numericIndex) && numericIndex >= 0 && numericIndex < candidatesData.length) {
                currentCandidateIndex = numericIndex;
                renderCandidateDetail(currentCandidateIndex);
            } else {
                showError('候補者が見つかりませんでした。');
            }
        }
    }).catch(error => {
        console.error('初期化エラー:', error);
        showError('データの読み込みに失敗しました。');
    });
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
        
        const totalTime = performance.now() - startTime;
        console.log(`✅ 全体完了時間: ${totalTime.toFixed(2)}ms`);
        
        return candidatesData;
        
    } catch (error) {
        console.error('API取得エラー:', error);
        hideLoadingState();
        showError('データの取得に失敗しました。しばらく後に再度お試しください。');
        throw error;
    }
}

// スラッグマッピングを読み込む関数
async function loadSlugMapping() {
    try {
        const response = await fetch('../js/slug-mapping.json');
        if (!response.ok) {
            throw new Error(`スラッグマッピング読み込みエラー: ${response.status}`);
        }
        slugMapping = await response.json();
        console.log('🔗 スラッグマッピングを読み込みました:', slugMapping);
        return slugMapping;
    } catch (error) {
        console.warn('⚠️ スラッグマッピングの読み込みに失敗、フォールバック使用:', error);
        // フォールバック: 従来の番号ベースのスラッグを生成
        slugMapping = candidatesData.map((_, index) => ({
            index: index,
            name: `候補者${index + 1}`,
            slug: `${index}`
        }));
        return slugMapping;
    }
}

// 候補者詳細を描画
function renderCandidateDetail(index) {
    if (index < 0 || index >= candidatesData.length) {
        showError('候補者が見つかりませんでした。');
        return;
    }
    
    hideLoadingState();
    
    const candidate = candidatesData[index];
    
    // 候補者基本情報を取得
    const name = getCandidateValue(candidate, [
        '【00_基本情報】氏名',
        '【00_基本情報】氏名（ふりがな）',
        '【基本情報】氏名',
        '【基本情報】氏名（ふりがな）',
        '氏名（ふりがな）',
        '氏名',
        '名前'
    ]) || `候補者${index + 1}`;
    
    const age = getCandidateValue(candidate, [
        '【00_基本情報】年齢',
        '【基本情報】年齢',
        '年齢'
    ]) || '不明';
    
    const party = getCandidateValue(candidate, [
        '【00_基本情報】所属政党',
        '【基本情報】所属政党',
        '所属政党',
        '政党'
    ]) || '無所属';
    
    const experience = getCandidateValue(candidate, [
        '【00_基本情報】当選回数',
        '【基本情報】当選回数',
        '当選回数',
        '当選歴'
    ]) || '不明';
    
    const imageUrl = getCandidateValue(candidate, [
        '【00_基本情報】あなたのプロフィール画像を添付してください。',
        '【基本情報】プロフィール画像',
        'プロフィール画像',
        '画像'
    ]) || '';
    
    // SNSリンクを取得
    const snsLinks = [];
    for (let i = 1; i <= 5; i++) {
        const url = candidate[`【00_基本情報】ウェブサイトやSNSアカウントのURL${i === 1 ? '①' : i === 2 ? '②' : i === 3 ? '③' : i === 4 ? '④' : '⑤'}`];
        if (url && url.trim()) {
            snsLinks.push(url.trim());
        }
    }
    
    // 政策データを取得
    const policies = getPolicyData(candidate);
    
    // ページタイトルを更新
    updatePageTitle(name, party);
    
    // 候補者詳細を描画
    renderCandidateHeader(name, age, party, experience, imageUrl, snsLinks);
    renderCandidatePolicies(policies);
}

// ページタイトルを更新
function updatePageTitle(name, party) {
    document.title = `${name} | 候補者詳細 - 加賀みらいチョイス`;
    
    // OGPメタタグも更新
    updateMetaTags(name, party);
}

// メタタグを更新
function updateMetaTags(name, party) {
    const description = `${name}（${party}）の詳細情報と政策。2025年加賀市議会議員選挙立候補者。`;
    
    // Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;
    
    // OG tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
    }
    ogTitle.content = `${name} | 候補者詳細 - 加賀みらいチョイス`;
    
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
    }
    ogDesc.content = description;
}

// 候補者ヘッダー部分を描画
function renderCandidateHeader(name, age, party, experience, imageUrl, snsLinks) {
    const candidateDetail = document.querySelector('.candidate-detail');
    if (!candidateDetail) return;
    
    const partyClass = getPartyClass(party);
    
    // SNS HTML生成
    let snsHtml = '';
    if (snsLinks.length > 0) {
        snsHtml = `
            <div class="sns-links">
                <h4>ウェブサイト・SNS</h4>
                ${snsLinks.map(url => {
                    const displayText = getSNSDisplayName(url);
                    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                    return `<a href="${fullUrl}" target="_blank" rel="noopener">${displayText}</a>`;
                }).join('')}
            </div>
        `;
    }
    
    const headerHtml = `
        <div class="candidate-header">
            <div class="candidate-photo-large">
                ${imageUrl ? 
                    `<img src="${toDriveImageUrl(imageUrl, 600)}" alt="${name}の写真" 
                          onerror="handleImageError(this, '${name}');" 
                          loading="lazy" 
                          referrerpolicy="no-referrer">` : 
                    '<span style="font-size: 1rem; color: #6b7280; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">写真<br>準備中</span>'
                }
            </div>
            <div class="candidate-basic-info">
                <h2>${name}</h2>
                <div class="info-row">
                    <span>年齢:</span>
                    <span>${age}歳</span>
                </div>
                <div class="info-row">
                    <span>当選歴:</span>
                    <span>${experience}</span>
                </div>
                <div class="info-row">
                    <span>政党:</span>
                    <span class="party-badge ${partyClass}">${party}</span>
                </div>
                ${snsHtml}
            </div>
        </div>
    `;
    
    candidateDetail.innerHTML = headerHtml;
}

// 候補者政策部分を描画
function renderCandidatePolicies(policies) {
    const candidateDetail = document.querySelector('.candidate-detail');
    if (!candidateDetail) return;
    
    let policiesHtml = '';
    if (policies.length > 0) {
        policies.forEach(categoryData => {
            policiesHtml += `
                <div style="margin-top: 2rem; margin-bottom: 1rem; padding: 0.75rem; background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; border-radius: 8px; font-weight: 600;">
                    📋 ${categoryData.category}
                </div>
            `;
            
            categoryData.questions.forEach(question => {
                const answerClass = (question.answer && question.answer.toString().trim()) ? '' : ' style="color: #9ca3af; font-style: italic;"';
                const displayAnswer = (question.answer && question.answer.toString().trim()) ? question.answer.toString().trim() : '回答なし';
                
                policiesHtml += `
                    <div class="policy-item">
                        <div><strong>Q:</strong> ${question.text}</div>
                        <div${answerClass}><strong>A:</strong> ${displayAnswer}</div>
                    </div>
                `;
            });
        });
    }
    
    const policySection = `
        <div class="policy-section">
            <h3>政策</h3>
            ${policiesHtml}
        </div>
    `;
    
    candidateDetail.innerHTML += policySection;
}

// 政策データを構造化して取得
function getPolicyData(candidate) {
    const policies = [];
    const questionsByCategory = {};
    
    Object.keys(candidate).forEach(key => {
        const categoryMatch = key.match(/【(\d+_[^】]+)】(.+)/);
        if (categoryMatch && !key.includes('00_基本情報')) {
            const fullCategoryName = categoryMatch[1];
            const categoryName = fullCategoryName.replace(/^\d+_/, '');
            const questionText = categoryMatch[2];
            const answer = candidate[key];
            
            if (!questionsByCategory[fullCategoryName]) {
                questionsByCategory[fullCategoryName] = {
                    category: categoryName,
                    questions: []
                };
            }
            
            questionsByCategory[fullCategoryName].questions.push({
                text: questionText,
                answer: answer
            });
        }
    });
    
    // カテゴリを順序でソート
    const sortedCategories = Object.keys(questionsByCategory).sort((a, b) => {
        const aNum = parseInt(a.match(/^(\d+)/)?.[1] || '999');
        const bNum = parseInt(b.match(/^(\d+)/)?.[1] || '999');
        
        if (aNum !== bNum) {
            return aNum - bNum;
        }
        
        return a.localeCompare(b);
    });
    
    sortedCategories.forEach(categoryKey => {
        policies.push(questionsByCategory[categoryKey]);
    });
    
    return policies;
}

// 候補者データから値を安全に取得する関数
function getCandidateValue(candidate, searchTerms) {
    for (const term of searchTerms) {
        const value = candidate[term];
        if (value && value.toString().trim()) {
            return value.toString().trim();
        }
    }
    
    const keys = Object.keys(candidate);
    for (const term of searchTerms) {
        const matchKey = keys.find(key => key.includes(term.replace(/【.*?】/, '')));
        if (matchKey && candidate[matchKey] && candidate[matchKey].toString().trim()) {
            return candidate[matchKey].toString().trim();
        }
    }
    
    return null;
}

// Google DriveのURLを画像表示用に変換
function toDriveImageUrl(url, size = 400) {
    if (!url || typeof url !== 'string') {
        return '';
    }
    
    let fileId = null;
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)\/view/,
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/,
        /id=([a-zA-Z0-9_-]+)/,
        /open\?id=([a-zA-Z0-9_-]+)/,
        /^([a-zA-Z0-9_-]{25,})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            fileId = match[1];
            break;
        }
    }
    
    if (!fileId) {
        return url;
    }
    
    return `https://lh3.googleusercontent.com/d/${fileId}=w${size}-h${size}-c`;
}

// 画像読み込みエラー時の処理
function handleImageError(img, candidateName = '候補者') {
    console.warn('⚠️ Image load failed for:', candidateName, 'src:', img.src);
    
    const currentSrc = img.src;
    if (currentSrc.includes('lh3.googleusercontent.com')) {
        const fileIdMatch = currentSrc.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            const altUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
            console.log('🔄 Trying alternative URL:', altUrl);
            img.src = altUrl;
            
            img.onerror = function() {
                console.warn('❌ Alternative URL also failed for:', candidateName);
                img.style.display = 'none';
                img.parentElement.innerHTML = `<span style="font-size: 1rem; color: #6b7280; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">写真<br>準備中</span>`;
            };
            return;
        }
    }
    
    img.style.display = 'none';
    img.parentElement.innerHTML = `<span style="font-size: 1rem; color: #6b7280; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">写真<br>準備中</span>`;
}

// SNSのURLから表示名を取得
function getSNSDisplayName(url) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('twitter') || lowerUrl.includes('x.com')) return 'X (Twitter)';
    if (lowerUrl.includes('facebook')) return 'Facebook';
    if (lowerUrl.includes('instagram')) return 'Instagram';
    if (lowerUrl.includes('youtube')) return 'YouTube';
    if (lowerUrl.includes('tiktok')) return 'TikTok';
    if (lowerUrl.includes('line')) return 'LINE';
    if (lowerUrl.includes('mixi')) return 'mixi';
    if (lowerUrl.includes('ameba')) return 'Ameba';
    return 'ウェブサイト';
}

// 政党に応じたCSSクラスを取得
function getPartyClass(party) {
    if (party.includes('自民') || party.includes('自由民主')) return 'party-ldp';
    if (party.includes('立憲') || party.includes('立憲民主')) return 'party-constitutional';
    if (party.includes('公明')) return 'party-komeito';
    if (party.includes('維新') || party.includes('日本維新')) return 'party-ishin';
    if (party.includes('共産') || party.includes('日本共産')) return 'party-communist';
    if (party.includes('国民') || party.includes('国民民主')) return 'party-kokumin';
    return 'party-independent';
}

// ローディング状態を表示
function showLoadingState() {
    const loadingHtml = `
        <div class="loading" style="display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 3rem;">
            <div style="width: 50px; height: 50px; border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1.5rem;"></div>
            <div style="font-weight: 600; color: #3b82f6; margin-bottom: 0.5rem; font-size: 1.1rem;">候補者詳細を読み込み中...</div>
            <div style="font-size: 0.9rem; color: #6b7280;">しばらくお待ちください</div>
        </div>
        <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
    `;
    
    const candidateDetail = document.querySelector('.candidate-detail');
    if (candidateDetail) candidateDetail.innerHTML = loadingHtml;
    
    const mainContainer = document.querySelector('main .container');
    if (mainContainer && !candidateDetail) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'candidate-detail';
        loadingDiv.innerHTML = loadingHtml;
        mainContainer.appendChild(loadingDiv);
    }
}

// ローディング状態を解除
function hideLoadingState() {
    // renderCandidateDetail等で上書きされるため特別な処理は不要
}

// エラー表示
function showError(message) {
    const errorHtml = `
        <div style="text-align: center; padding: 3rem; color: #ef4444;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">エラーが発生しました</div>
            <div style="color: #6b7280;">${message}</div>
            <div style="margin-top: 2rem;">
                <a href="index.html" class="back-button">← 候補者一覧に戻る</a>
            </div>
        </div>
    `;
    
    const candidateDetail = document.querySelector('.candidate-detail');
    if (candidateDetail) candidateDetail.innerHTML = errorHtml;
    
    const mainContainer = document.querySelector('main .container');
    if (mainContainer && !candidateDetail) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'candidate-detail';
        errorDiv.innerHTML = errorHtml;
        mainContainer.appendChild(errorDiv);
    }
}