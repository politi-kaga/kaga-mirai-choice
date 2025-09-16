// 候補者詳細ページ生成スクリプト
// このスクリプトはビルド時に実行されて、各候補者の詳細ページを生成します

const API_URL = 'https://script.google.com/macros/s/AKfycbxYQFMMz-Xh2vIDrj6FznzbuunLbdK26_oWz32KM3YjOIgQ6cmDQNV1KzMIEElUp16K/exec';

// Node.js環境での実行用
if (typeof fetch === 'undefined') {
    // Node.jsの場合は何もしない（ブラウザでのみ実行）
    console.log('このスクリプトはブラウザでの実行専用です');
} else {
    // ブラウザで実行される場合の処理
    generateCandidatePages();
}

async function generateCandidatePages() {
    try {
        console.log('🚀 候補者ページ生成開始...');
        
        // APIからデータを取得
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const candidatesData = await response.json();
        console.log('候補者データ取得完了:', candidatesData.length, '名');
        
        // 各候補者のページを生成
        for (let i = 0; i < candidatesData.length; i++) {
            const candidate = candidatesData[i];
            const candidateHtml = generateCandidateDetailHTML(candidate, i);
            const filename = `candidate-${i + 1}.html`;
            
            console.log(`📄 ${filename} を生成中...`);
            
            // ブラウザ環境では直接ファイルを作成できないため、
            // 代わりにHTMLコンテンツをコンソールに出力
            console.log(`=== ${filename} の内容 ===`);
            console.log(candidateHtml);
            console.log(`=== ${filename} の内容終了 ===\n`);
        }
        
        console.log('✅ 候補者ページ生成完了');
        
    } catch (error) {
        console.error('❌ 候補者ページ生成エラー:', error);
    }
}

// 候補者詳細ページのHTMLを生成
function generateCandidateDetailHTML(candidate, index) {
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
    
    // 政策 HTML生成
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
    
    const partyClass = getPartyClass(party);
    
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} | 候補者詳細 - 加賀みらいチョイス</title>
    <meta name="description" content="${name}（${party}）の詳細情報と政策。2025年加賀市議会議員選挙立候補者。">
    <meta name="keywords" content="加賀市,議会議員,選挙,2025年,${name},${party},政策,候補者">
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="../css/main.css">
    
    <!-- OGP設定 -->
    <meta property="og:title" content="${name} | 候補者詳細 - 加賀みらいチョイス">
    <meta property="og:description" content="${name}（${party}）の詳細情報と政策。2025年加賀市議会議員選挙立候補者。">
    <meta property="og:type" content="profile">
    <meta property="og:url" content="https://politi-kaga.github.io/kaga-mirai-choice/candidates/candidate-${index + 1}.html">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${name} | 候補者詳細">
    <meta name="twitter:description" content="${name}（${party}）の詳細情報と政策">
    
    <!-- 構造化データ -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "${name}",
        "description": "${name}（${party}）- 2025年加賀市議会議員選挙立候補者",
        "url": "https://politi-kaga.github.io/kaga-mirai-choice/candidates/candidate-${index + 1}.html",
        "memberOf": {
            "@type": "PoliticalParty",
            "name": "${party}"
        }
    }
    </script>
</head>
<body>
    <header class="header">
        <nav class="nav">
            <a href="../index.html" class="logo">
                <div class="logo-icon">🗳️</div>
                加賀みらいチョイス
            </a>
            <div class="nav-links">
                <a href="../index.html">ホーム</a>
                <a href="index.html">候補者一覧</a>
                <a href="../comparison/index.html">政策比較</a>
            </div>
        </nav>
    </header>

    <main class="container">
        <section class="hero">
            <h1>候補者詳細</h1>
        </section>

        <div class="candidate-detail">
            <div class="candidate-header">
                <div class="candidate-photo-large">
                    ${imageUrl ? 
                        `<img src="${toDriveImageUrl(imageUrl, 600)}" alt="${name}の写真" 
                              onerror="this.style.display='none'; this.parentElement.innerHTML='<span style=&quot;font-size: 1rem; color: #6b7280; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;&quot;>写真<br>準備中</span>';" 
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

            <div class="policy-section">
                <h3>政策</h3>
                ${policiesHtml}
            </div>
        </div>

        <div style="text-align: center; margin: 2rem 0;">
            <a href="index.html" class="back-button">← 候補者一覧に戻る</a>
        </div>
    </main>

    <footer class="footer">
        <div class="footer-container">
            <div class="footer-content">
                <div class="footer-about">
                    <a href="https://surf-hedge-480.notion.site/26b6a817b5fe80c994e9ce34982feb69" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="footer-link">
                        加賀みらいチョイスについて
                    </a>
                </div>
                <div class="footer-info">
                    <p class="footer-org">運営：加賀みらいチョイス運営委員会</p>
                    <p class="footer-contact">
                        連絡先：
                        <a href="mailto:kaga.democracy@gmail.com" class="footer-email">
                            kaga.democracy@gmail.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    </footer>
</body>
</html>`;
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