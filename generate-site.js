#!/usr/bin/env node
// Cache-busting deployment to fix 404 errors

const fs = require('fs-extra');
const path = require('path');
// Kuroshiroのインポートを修正
let Kuroshiro, KuromojiAnalyzer;
try {
  Kuroshiro = require('kuroshiro').default || require('kuroshiro');
  KuromojiAnalyzer = require('kuroshiro-analyzer-kuromoji').default || require('kuroshiro-analyzer-kuromoji');
} catch (error) {
  console.warn('⚠️ Kuroshiro modules not available:', error.message);
}

// kuroshiroのグローバルインスタンス
let kuroshiro = null;

// 設定
const config = {
  srcDir: '.',
  distDir: 'dist',
  dataDir: 'data',
  assetsDir: 'assets',
  cssDir: 'css',
  jsDir: 'js',
  
  // Google Analytics測定ID
  googleAnalyticsId: 'G-4LW41SN6NF',
  
  // Google Search Console認証コード（後で置き換え可能）
  googleSiteVerification: 'YOUR_VERIFICATION_CODE_HERE'
};

// ベースHTMLテンプレート関数
function generateBaseHTML(title, description, canonicalUrl, content, isHomePage = false, pageSpecificCSS = '', pageSpecificJS = '', depth = 1) {
  const googleAnalyticsScript = `
<!-- Google Analytics (GA4) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', '${config.googleAnalyticsId}');
</script>`;

  const googleSiteVerificationMeta = isHomePage ? 
    `<meta name="google-site-verification" content="${config.googleSiteVerification}" />` : '';

  // depth に基づいて相対パスを動的に生成
  const basePath = '../'.repeat(depth);
  const faviconPath = depth === 0 ? 'favicon.ico' : `${basePath}favicon.ico`;
  const cssPath = depth === 0 ? 'css/main.css' : `${basePath}css/main.css`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="加賀市,議会議員,選挙,2025年,候補者,政策,投票">
    <link rel="icon" href="${faviconPath}" type="image/x-icon">
    <link rel="stylesheet" href="${cssPath}">
    ${pageSpecificCSS}
    
    <!-- OGP設定 -->
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${canonicalUrl}">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    
    <!-- 構造化データ -->
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "加賀みらいチョイス",
        "description": "2025年加賀市議会議員選挙の候補者情報と政策比較サイト",
        "url": "https://politi-kaga.github.io/kaga-mirai-choice/"
    }
    </script>
    
    ${googleSiteVerificationMeta}
    ${googleAnalyticsScript}
</head>
<body>
    <header class="header">
        <nav class="nav">
            <a href="${basePath}index.html" class="logo">
                <div class="logo-icon">🗳️</div>
                加賀みらいチョイス
            </a>
            <div class="nav-links">
                <a href="${basePath}index.html">ホーム</a>
                <a href="${basePath}candidates/index.html">候補者一覧</a>
                <a href="${basePath}policy/index.html">政策比較</a>
            </div>
        </nav>
    </header>

    <main class="container">
        ${content}
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
    
    ${pageSpecificJS}
</body>
</html>`;
}

// ホームページ用HTMLテンプレート
function generateHomeHTML() {
  const content = `
        <section class="hero">
            <h1>加賀市議会議員選挙2025</h1>
            <p class="hero-subtitle">あなたの一票で、加賀市の未来を選択しよう</p>
        </section>

        <nav class="quick-nav">
            <a href="candidates/index.html" class="quick-nav-item">
                <h3>👥 候補者一覧</h3>
                <p>立候補者の詳細情報と政策をご覧いただけます</p>
            </a>
            <a href="policy/index.html" class="quick-nav-item">
                <h3>📊 政策比較</h3>
                <p>各候補者の政策を分野別に比較できます</p>
            </a>
        </nav>

        <section class="election-info">
            <h2>📅 選挙情報</h2>
            <div class="info-grid">
                <div class="info-item">
                    <strong>投票日</strong>
                    <span>2025年10月5日（日）</span>
                </div>
                <div class="info-item">
                    <strong>告示日</strong>
                    <span>2025年9月28日（土）</span>
                </div>
                <div class="info-item">
                    <strong>投票時間</strong>
                    <span>午前7時〜午後8時</span>
                </div>
                <div class="info-item">
                    <strong>定数</strong>
                    <span>18名</span>
                </div>
                <div class="info-item">
                    <strong>前回投票率</strong>
                    <span>58.76%</span>
                </div>
                <div class="info-item">
                    <strong>期日前投票</strong>
                    <span>9月29日〜10月4日</span>
                </div>
            </div>
        </section>`;

  return generateBaseHTML(
    '加賀みらいチョイス | 加賀市議会議員選挙2025',
    '2025年加賀市議会議員選挙の候補者情報と政策比較サイト。あなたの一票で加賀市の未来を選択しよう。',
    'https://politi-kaga.github.io/kaga-mirai-choice/',
    content,
    true,  // isHomePage = true
    '',    // pageSpecificCSS
    '',    // pageSpecificJS
    0      // depth = 0 (root level)
  );
}

// 候補者一覧ページ用HTMLテンプレート
function generateCandidatesListHTML() {
  const content = `
        <section class="hero">
            <h1>候補者一覧</h1>
            <p class="hero-subtitle">加賀市議会議員選挙2025の立候補者</p>
        </section>

        <div class="candidates-grid">
            <div class="loading">候補者情報を読み込み中...</div>
        </div>`;

  const pageSpecificJS = `<script src="../js/candidates.js"></script>`;

  return generateBaseHTML(
    '候補者一覧 | 加賀みらいチョイス - 加賀市議会議員選挙2025',
    '2025年加賀市議会議員選挙の立候補者一覧。各候補者の詳細情報と政策をご覧いただけます。',
    'https://politi-kaga.github.io/kaga-mirai-choice/candidates/',
    content,
    false,     // isHomePage
    '',        // pageSpecificCSS
    pageSpecificJS,
    1          // depth = 1 (candidates/ is 1 level deep)
  );
}

// 候補者個別ページ用HTMLテンプレート
function generateCandidateDetailHTML(candidate, index, slug) {
  // 候補者データから基本情報を取得
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
    const symbols = ['①', '②', '③', '④', '⑤'];
    const key = `【00_基本情報】ウェブサイトやSNSアカウントのURL${symbols[i-1]}`;
    const url = candidate[key];
    if (url && url.trim()) {
      snsLinks.push(url.trim());
    }
  }

  // 政策データを取得
  const policies = getPolicyData(candidate);
  
  // SNS HTML生成
  let snsHtml = '';
  if (snsLinks.length > 0) {
    const snsLinksHtml = snsLinks.map(url => {
      const displayText = getSNSDisplayName(url);
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      return `<a href="${fullUrl}" target="_blank" rel="noopener">${displayText}</a>`;
    }).join('');
    
    snsHtml = `
        <div class="sns-links">
            <h4>ウェブサイト・SNS</h4>
            ${snsLinksHtml}
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

  const content = `
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
            <a href="../index.html" class="back-button">← 候補者一覧に戻る</a>
        </div>`;

  return generateBaseHTML(
    `${name} | 候補者詳細 - 加賀みらいチョイス`,
    `${name}（${party}）の詳細情報と政策。2025年加賀市議会議員選挙立候補者。`,
    `https://politi-kaga.github.io/kaga-mirai-choice/candidates/${slug}/`,
    content,
    false,  // isHomePage
    '',     // pageSpecificCSS
    '',     // pageSpecificJS
    2       // depth = 2 (candidates/slug/ is 2 levels deep)
  );
}

// 政策比較ページ用HTMLテンプレート
function generateComparisonHTML() {
  const content = `
        <section class="hero">
            <h1>政策比較</h1>
            <p class="hero-subtitle">分野別に候補者の政策を比較できます</p>
        </section>

        <div class="policy-section">
            <div class="category-scroll-container">
                <div class="category-tabs">
                    <div class="loading">カテゴリを読み込み中...</div>
                </div>
                <div class="scroll-indicator">→</div>
            </div>

            <div id="category-content">
                <div class="loading">公約データを読み込み中...</div>
            </div>
        </div>`;

  const pageSpecificJS = `<script src="../js/policy.js"></script>`;

  return generateBaseHTML(
    '政策比較 | 加賀みらいチョイス - 加賀市議会議員選挙2025',
    '2025年加賀市議会議員選挙候補者の政策を分野別に比較。各候補者の考えや政策を詳しく比較検討できます。',
    'https://politi-kaga.github.io/kaga-mirai-choice/policy/',
    content,
    false,     // isHomePage
    '',        // pageSpecificCSS
    pageSpecificJS,
    1          // depth = 1 (policy/ is 1 level deep)
  );
}

// ヘルパー関数群
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

function getPartyClass(party) {
  if (party.includes('自民') || party.includes('自由民主')) return 'party-ldp';
  if (party.includes('立憲') || party.includes('立憲民主')) return 'party-constitutional';
  if (party.includes('公明')) return 'party-komeito';
  if (party.includes('維新') || party.includes('日本維新')) return 'party-ishin';
  if (party.includes('共産') || party.includes('日本共産')) return 'party-communist';
  if (party.includes('国民') || party.includes('国民民主')) return 'party-kokumin';
  return 'party-independent';
}

// kuroshiroを初期化する関数
async function initializeKuroshiro() {
  if (kuroshiro) return kuroshiro;
  
  try {
    if (!Kuroshiro || !KuromojiAnalyzer) {
      console.warn('⚠️ Kuroshiro classes not available, using fallback slug generation');
      return null;
    }
    
    kuroshiro = new Kuroshiro();
    const analyzer = new KuromojiAnalyzer();
    await kuroshiro.init(analyzer);
    console.log('📝 Kuroshiro initialized successfully');
    return kuroshiro;
  } catch (error) {
    console.warn('⚠️ Kuroshiro initialization failed:', error.message);
    return null;
  }
}

// 日本語名をURLスラッグに変換する関数
async function generateSlug(name, fallbackIndex = 0) {
  if (!name || typeof name !== 'string') {
    return `candidate-${fallbackIndex}`;
  }

  let slug = '';
  
  // kuroshiroが利用可能な場合はローマ字変換を試行
  try {
    if (kuroshiro) {
      const romanji = await kuroshiro.convert(name, {
        to: 'romaji',
        mode: 'spaced'
      });
      slug = romanji
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // 英数字、スペース、ハイフン以外を削除
        .replace(/\s+/g, '-')     // スペースをハイフンに置換
        .replace(/-+/g, '-')      // 連続するハイフンを一つに
        .trim()
        .replace(/^-+|-+$/g, ''); // 先頭・末尾のハイフンを削除
    }
  } catch (error) {
    console.warn(`⚠️ Romanization failed for "${name}":`, error.message);
  }

  // ローマ字変換に失敗した場合のフォールバック処理
  if (!slug || slug.length < 2) {
    // 手動でよくある日本語名をローマ字に変換
    slug = convertNameToRomaji(name);
  }

  // それでもうまくいかない場合の最終フォールバック
  if (!slug || slug.length < 2) {
    slug = `candidate-${fallbackIndex}`;
  } else {
    // 重複を避けるため、インデックスも含める
    slug = `${slug}-${fallbackIndex}`;
  }

  return slug;
}

// 日本語名を手動でローマ字に変換する関数（よくある名前のマッピング）
function convertNameToRomaji(name) {
  // よくある姓名のローマ字マッピング
  const nameMapping = {
    '田中': 'tanaka',
    '佐藤': 'sato',
    '鈴木': 'suzuki',
    '山田': 'yamada',
    '高橋': 'takahashi',
    '渡辺': 'watanabe',
    '中村': 'nakamura',
    '小林': 'kobayashi',
    '加藤': 'kato',
    '吉田': 'yoshida',
    '山本': 'yamamoto',
    '太郎': 'taro',
    '花子': 'hanako',
    '次郎': 'jiro',
    '一郎': 'ichiro',
    '三郎': 'saburo',
    '美智子': 'michiko',
    '洋子': 'yoko',
    '由美': 'yumi',
    '健一': 'kenichi',
    '浩': 'hiroshi',
    '誠': 'makoto',
    '学': 'manabu',
    '明': 'akira',
    '茂': 'shigeru',
    '実': 'minoru',
    '清': 'kiyoshi'
  };

  // 空白で分割して姓名を別々に処理
  const parts = name.trim().replace(/\s+/g, ' ').split(' ');
  const romajiParts = parts.map(part => {
    // 完全一致チェック
    if (nameMapping[part]) {
      return nameMapping[part];
    }
    
    // 部分一致チェック
    for (const [kanji, romaji] of Object.entries(nameMapping)) {
      if (part.includes(kanji)) {
        return romaji;
      }
    }
    
    // マッピングが見つからない場合は元の文字を返す
    return part;
  });

  return romajiParts
    .join('-')
    .toLowerCase()
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .trim();
}

// 候補者スラッグのマッピングを生成する関数
async function generateCandidateSlugMapping(candidatesData) {
  const slugMapping = [];
  const usedSlugs = new Set();

  for (let i = 0; i < candidatesData.length; i++) {
    const candidate = candidatesData[i];
    const name = getCandidateValue(candidate, [
      '【00_基本情報】氏名',
      '【00_基本情報】氏名（ふりがな）',
      '【基本情報】氏名',
      '【基本情報】氏名（ふりがな）',
      '氏名（ふりがな）',
      '氏名',
      '名前'
    ]) || `候補者${i + 1}`;

    let baseSlug = await generateSlug(name, i);
    let slug = baseSlug;
    let counter = 1;

    // 重複チェック
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    usedSlugs.add(slug);
    slugMapping.push({
      index: i,
      name: name,
      slug: slug,
      candidate: candidate
    });

    console.log(`🔗 候補者${i + 1}: "${name}" → slug: "${slug}"`);
  }

  return slugMapping;
}

// 候補者データの読み込み（GAS APIから）
async function loadCandidatesData() {
  const API_URL = 'https://script.google.com/macros/s/AKfycbxYQFMMz-Xh2vIDrj6FznzbuunLbdK26_oWz32KM3YjOIgQ6cmDQNV1KzMIEElUp16K/exec';
  
  try {
    console.log('🚀 GAS APIからデータを取得中...', new Date().toLocaleTimeString());
    
    // パフォーマンス測定開始
    const startTime = performance.now();
    
    // Node.js環境での fetch（v18以降はビルトイン）
    let response;
    try {
      response = await fetch(API_URL);
    } catch (corsError) {
      console.warn('⚠️ Standard fetch failed, trying with minimal headers');
      response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Static Site Generator)'
        }
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
    
    console.log(`✅ ${data.length}件の候補者データを取得しました`);
    
    const totalTime = performance.now() - startTime;
    console.log(`✅ 全体完了時間: ${totalTime.toFixed(2)}ms`);
    
    return data;
    
  } catch (error) {
    console.error('❌ GAS API取得エラー:', error);
    console.log('⚠️ フォールバック: モックデータを使用します');
    
    // フォールバック: 最小限のモックデータ
    return [
      {
        '【00_基本情報】氏名': 'API接続エラーのため表示できません',
        '【00_基本情報】年齢': '不明',
        '【00_基本情報】所属政党': '不明',
        '【00_基本情報】当選回数': '不明',
        '【01_経済政策】地域経済活性化について': 'APIからデータを取得できませんでした。',
        '【02_福祉政策】高齢者福祉について': 'APIからデータを取得できませんでした。'
      }
    ];
  }
}

// メイン生成関数
async function generateSite() {
  console.log('🚀 静的サイト生成を開始...');
  
  try {
    // kuroshiroを初期化
    await initializeKuroshiro();
    
    // distディレクトリをクリーンアップ
    await fs.remove(config.distDir);
    await fs.ensureDir(config.distDir);
    
    // アセットファイルをコピー
    const assetsToCopy = ['css', 'js', 'assets', 'favicon.ico'];
    
    for (const asset of assetsToCopy) {
      const srcPath = path.join(config.srcDir, asset);
      const destPath = path.join(config.distDir, asset);
      
      if (await fs.pathExists(srcPath)) {
        await fs.copy(srcPath, destPath);
        console.log(`📁 ${asset} をコピーしました`);
      }
    }
    
    // ホームページを生成
    const homeHtml = generateHomeHTML();
    await fs.writeFile(path.join(config.distDir, 'index.html'), homeHtml);
    console.log('🏠 ホームページを生成しました');
    
    // .nojekyll ファイルを作成（GitHub Pages用）
    await fs.writeFile(path.join(config.distDir, '.nojekyll'), '');
    console.log('🔧 .nojekyll ファイルを作成しました（GitHub Pages用）');
    
    // candidates ディレクトリと候補者一覧ページを生成
    await fs.ensureDir(path.join(config.distDir, 'candidates'));
    
    // 候補者データを読み込み、スラッグマッピングを生成
    const candidatesData = await loadCandidatesData();
    const slugMapping = await generateCandidateSlugMapping(candidatesData);
    
    // スラッグマッピングをJSONとして保存（フロントエンド用）
    const slugMappingForJS = slugMapping.map(item => ({
      index: item.index,
      name: item.name,
      slug: item.slug
    }));
    await fs.writeFile(
      path.join(config.distDir, 'js', 'slug-mapping.json'),
      JSON.stringify(slugMappingForJS, null, 2)
    );
    console.log('🔗 スラッグマッピングファイルを生成しました');
    
    // 候補者一覧ページを生成（スラッグマッピング後）
    const candidatesListHtml = generateCandidatesListHTML();
    await fs.writeFile(path.join(config.distDir, 'candidates', 'index.html'), candidatesListHtml);
    console.log('👥 候補者一覧ページを生成しました');
    
    // 候補者個別ページを生成（スラッグベース）- 強化されたエラーハンドリング付き
    let successfullyGenerated = 0;
    for (const mapping of slugMapping) {
      try {
        // 候補者個別ディレクトリを作成（スラッグベース）
        const candidateDir = path.join(config.distDir, 'candidates', mapping.slug);
        await fs.ensureDir(candidateDir);
        
        // 候補者個別ページを生成
        const candidateHtml = generateCandidateDetailHTML(mapping.candidate, mapping.index, mapping.slug);
        
        // HTMLファイルの書き込み
        const filePath = path.join(candidateDir, 'index.html');
        await fs.writeFile(filePath, candidateHtml);
        
        // ファイル存在確認
        const exists = await fs.pathExists(filePath);
        if (!exists) {
          throw new Error(`生成されたファイルが存在しません: ${filePath}`);
        }
        
        const stats = await fs.stat(filePath);
        console.log(`👤 候補者${mapping.index + 1}の詳細ページを生成しました (/candidates/${mapping.slug}/) - ファイルサイズ: ${stats.size}バイト`);
        successfullyGenerated++;
        
      } catch (error) {
        console.error(`❌ 候補者${mapping.index + 1} (${mapping.name}) の詳細ページ生成に失敗:`, error);
        throw error; // 失敗時は処理を停止
      }
    }
    
    console.log(`✅ 合計${slugMapping.length}個の候補者詳細ページを生成完了`);
    
    // policy ディレクトリと政策比較ページを生成
    await fs.ensureDir(path.join(config.distDir, 'policy'));
    const policyHtml = generateComparisonHTML();
    await fs.writeFile(path.join(config.distDir, 'policy', 'index.html'), policyHtml);
    console.log('📊 政策比較ページを生成しました');
    
    console.log('✅ 静的サイト生成が完了しました！');
    console.log(`📂 生成先: ${path.resolve(config.distDir)}`);
    
  } catch (error) {
    console.error('❌ サイト生成中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// メイン実行
if (require.main === module) {
  generateSite();
}

module.exports = {
  generateSite,
  config
};