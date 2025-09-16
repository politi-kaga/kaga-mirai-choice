// 候補者一覧ページ用JavaScript
// API設定
const API_URL = 'https://script.google.com/macros/s/AKfycbxYQFMMz-Xh2vIDrj6FznzbuunLbdK26_oWz32KM3YjOIgQ6cmDQNV1KzMIEElUp16K/exec';

// グローバル変数
let candidatesData = [];
let slugMapping = [];

// ページ読み込み時にAPIからデータを取得
document.addEventListener('DOMContentLoaded', function() {
    Promise.all([
        loadCandidatesData(),
        loadSlugMapping()
    ]).then(() => {
        updateCandidatesList();
        updatePartyLists(); // 政党別リストも更新
    }).catch(error => {
        console.error('初期化エラー:', error);
        showError('データの読み込みに失敗しました。');
    });
});

// APIからデータを取得（高速化版）
async function loadCandidatesData() {
    try {
        console.log('🚀 APIからデータを取得中...', new Date().toLocaleTimeString());
        
        // ローディング表示を改善
        showLoadingState();
        
        // パフォーマンス測定開始
        const startTime = performance.now();
        
        // CORSエラーを回避するシンプルなfetchを試行
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
        
        const fetchTime = performance.now() - startTime;
        console.log(`📡 Fetch完了: ${fetchTime.toFixed(2)}ms`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const parseStartTime = performance.now();
        const data = await response.json();
        const parseTime = performance.now() - parseStartTime;
        console.log(`🔄 JSON解析完了: ${parseTime.toFixed(2)}ms`);
        
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

// ローディング状態を表示
function showLoadingState() {
    const loadingHtml = `
        <div class="loading" style="display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 2rem;">
            <div style="width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1rem;"></div>
            <div style="font-weight: 600; color: #3b82f6; margin-bottom: 0.5rem;">候補者データを読み込み中...</div>
            <div style="font-size: 0.85rem; color: #6b7280;">しばらくお待ちください</div>
        </div>
        <style>
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        </style>
    `;
    
    const candidatesGrid = document.querySelector('.candidates-grid');
    if (candidatesGrid) candidatesGrid.innerHTML = loadingHtml;
}

// ローディング状態を解除
function hideLoadingState() {
    // 特別な処理は不要（updateCandidatesList等で上書きされる）
}

// 候補者一覧を更新
function updateCandidatesList() {
    const candidatesGrid = document.querySelector('.candidates-grid');
    if (!candidatesGrid || candidatesData.length === 0) return;
    
    candidatesGrid.innerHTML = '';
    
    candidatesData.forEach((candidate, index) => {
        // より柔軟な候補者データ取得
        const name = getCandidateValue(candidate, [
            '【00_基本情報】氏名',
            '【00_基本情報】氏名（ふりがな）',
            '【基本情報】氏名',
            '【基本情報】氏名（ふりがな）',
            '氏名（ふりがな）',
            '氏名',
            '名前',
            'name'
        ]) || `候補者${index + 1}`;
        
        const age = getCandidateValue(candidate, [
            '【00_基本情報】年齢',
            '【基本情報】年齢', 
            '年齢',
            'age'
        ]) || '不明';
        
        const party = getCandidateValue(candidate, [
            '【00_基本情報】所属政党',
            '【基本情報】所属政党',
            '所属政党',
            '政党',
            'party'
        ]) || '無所属';
        
        const experience = getCandidateValue(candidate, [
            '【00_基本情報】当選回数',
            '【基本情報】当選回数',
            '当選回数',
            '当選歴',
            'election_history'
        ]) || '不明';
        
        const imageUrl = getCandidateValue(candidate, [
            '【00_基本情報】あなたのプロフィール画像を添付してください。',
            '【基本情報】プロフィール画像',
            'プロフィール画像',
            '画像',
            'photo_url',
            'image'
        ]) || '';
        
        console.log(`候補者${index + 1}: 名前="${name}", 年齢="${age}", 政党="${party}"`);
        
        // 政党に応じたクラス
        const partyClass = getPartyClass(party);
        
        // スラッグマッピングから対応するスラッグを取得
        const mapping = slugMapping.find(m => m.index === index);
        const slug = mapping ? mapping.slug : `${index}`;
        
        // 候補者詳細ページのURLを生成（スラッグベース）
        const candidateDetailUrl = `${slug}/`;
        
        const candidateCard = document.createElement('a');
        candidateCard.className = 'candidate-card';
        candidateCard.href = candidateDetailUrl;
        candidateCard.setAttribute('data-candidate-index', index);
        
        candidateCard.innerHTML = `
            <div class="candidate-photo">
                ${imageUrl ? 
                    `<img src="${toDriveImageUrl(imageUrl)}" alt="${name}の写真" 
                          onerror="handleImageError(this, '${name}');" 
                          loading="lazy" 
                          decoding="async"
                          referrerpolicy="no-referrer"
                          style="transition: opacity 0.3s ease;">` : 
                    '<span style="font-size: 0.8rem; color: #6b7280; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">写真<br>準備中</span>'
                }
            </div>
            <div class="candidate-name">${name}</div>
            <div class="candidate-info">
                年齢: ${age}歳<br>
                当選歴: ${experience}
            </div>
            <div class="party-badge ${partyClass}">${party}</div>
        `;
        
        candidatesGrid.appendChild(candidateCard);
    });
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

// Google DriveのURLを画像表示用に変換
function toDriveImageUrl(url, size = 400) {
    if (!url || typeof url !== 'string') {
        console.warn('⚠️ Invalid image URL provided:', url);
        return '';
    }
    
    console.log('📷 Processing image URL:', url);
    
    // 複数のパターンに対応してファイルIDを抽出
    let fileId = null;
    
    const patterns = [
        /\/file\/d\/([a-zA-Z0-9_-]+)\/view/,  // /file/d/ID/view
        /\/file\/d\/([a-zA-Z0-9_-]+)/,       // /file/d/ID
        /\/d\/([a-zA-Z0-9_-]+)/,             // /d/ID
        /id=([a-zA-Z0-9_-]+)/,               // id=ID
        /open\?id=([a-zA-Z0-9_-]+)/,         // open?id=ID
        /^([a-zA-Z0-9_-]{25,})$/             // IDのみ
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            fileId = match[1];
            break;
        }
    }
    
    if (!fileId) {
        console.warn('⚠️ Could not extract file ID from URL:', url);
        return url; // 変換できない場合は元URLを返す
    }
    
    console.log('📷 Extracted file ID:', fileId);
    
    // ORBエラーを回避するため、thumbnailエンドポイントを使用
    const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}=w${size}-h${size}-c`;
    console.log('📷 Generated image URL:', imageUrl);
    
    return imageUrl;
}

// 画像読み込みエラー時の処理
function handleImageError(img, candidateName = '候補者') {
    console.warn('⚠️ Image load failed for:', candidateName, 'src:', img.src);
    
    // 代替URLを試行（Google Driveの別エンドポイント）
    const currentSrc = img.src;
    if (currentSrc.includes('lh3.googleusercontent.com')) {
        // GoogleドライブのUCエンドポイントを試行
        const fileIdMatch = currentSrc.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch) {
            const altUrl = `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
            console.log('🔄 Trying alternative URL:', altUrl);
            img.src = altUrl;
            
            // 代替URLでも失敗した場合のエラーハンドラーを設定
            img.onerror = function() {
                console.warn('❌ Alternative URL also failed for:', candidateName);
                img.style.display = 'none';
                img.parentElement.innerHTML = `<span style="font-size: 0.8rem; color: #6b7280; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">写真<br>準備中</span>`;
            };
            return; // 代替URLを試行中
        }
    }
    
    // 最終的なフォールバック表示
    img.style.display = 'none';
    img.parentElement.innerHTML = `<span style="font-size: 0.8rem; color: #6b7280; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">写真<br>準備中</span>`;
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

// 候補者名からURLセーフなスラッグを作成
function createCandidateSlug(name, index) {
    // 日本語文字をローマ字に変換するか、indexベースのスラッグを使用
    return `candidate-${index + 1}`;
}

// エラー表示
function showError(message) {
    const candidatesGrid = document.querySelector('.candidates-grid');
    if (candidatesGrid) candidatesGrid.innerHTML = `<div class="loading">${message}</div>`;
}

// 政党別候補者リストを更新
function updatePartyLists() {
    const partyListsContainer = document.querySelector('.party-lists-container');
    if (!partyListsContainer || candidatesData.length === 0) return;
    
    // 政党別に候補者をグループ化
    const partiesMap = new Map();
    
    candidatesData.forEach((candidate, index) => {
        const name = getCandidateValue(candidate, [
            '【００_基本情報】氏名',
            '【００_基本情報】氏名（ふりがな）',
            '【基本情報】氏名',
            '【基本情報】氏名（ふりがな）',
            '氏名（ふりがな）',
            '氏名',
            '名前',
            'name'
        ]) || `候補者${index + 1}`;
        
        const party = getCandidateValue(candidate, [
            '【００_基本情報】所属政党',
            '【基本情報】所属政党',
            '所属政党',
            '政党',
            'party'
        ]) || '無所属';
        
        const age = getCandidateValue(candidate, [
            '【００_基本情報】年齢',
            '【基本情報】年齢',
            '年齢',
            'age'
        ]) || '不明';
        
        // スラッグマッピングから対応するスラッグを取得
        const mapping = slugMapping.find(m => m.index === index);
        const slug = mapping ? mapping.slug : `${index}`;
        const candidateDetailUrl = `${slug}/`;
        
        if (!partiesMap.has(party)) {
            partiesMap.set(party, []);
        }
        
        partiesMap.get(party).push({
            name: name,
            age: age,
            url: candidateDetailUrl,
            index: index
        });
    });
    
    // 政党をソート（無所属を最後に）
    const sortedParties = Array.from(partiesMap.entries()).sort((a, b) => {
        if (a[0] === '無所属') return 1;
        if (b[0] === '無所属') return -1;
        return a[0].localeCompare(b[0]);
    });
    
    // HTML生成
    let partyListsHtml = '';
    
    sortedParties.forEach(([partyName, members]) => {
        const partyClass = getPartyClass(partyName);
        
        // メンバーを名前でソート
        members.sort((a, b) => a.name.localeCompare(b.name));
        
        const membersListHtml = members.map(member => `
            <li>
                <span class="party-member-name">
                    <a href="${member.url}" style="color: inherit; text-decoration: none;">
                        ${member.name}
                    </a>
                </span>
                <span class="party-member-info">${member.age}歳</span>
            </li>
        `).join('');
        
        partyListsHtml += `
            <div class="party-group ${partyClass}">
                <h3>
                    ${partyName}
                    <span class="party-member-count">${members.length}名</span>
                </h3>
                <ul class="party-members-list">
                    ${membersListHtml}
                </ul>
            </div>
        `;
    });
    
    partyListsContainer.innerHTML = partyListsHtml;
    
    console.log(`🏤 政党別リストを生成完了: ${sortedParties.length}政党`);
}

// 候補者詳細ページ生成（MPAでは不要だが、データ準備のために残す）
function generateCandidatePages() {
    // この関数は別途実装される候補者詳細ページ生成に使用
    return candidatesData;
}