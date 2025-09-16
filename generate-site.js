#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// 設定
const config = {
  srcDir: '.',
  distDir: 'dist',
  dataDir: 'data',
  assetsDir: 'assets',
  cssDir: 'css',
  jsDir: 'js',
  
  // Google Analytics測定ID（後で置き換え可能）
  googleAnalyticsId: 'G-XXXXXXXXXX',
  
  // Google Search Console認証コード（後で置き換え可能）
  googleSiteVerification: 'YOUR_VERIFICATION_CODE_HERE'
};

// ベースHTMLテンプレート関数
function generateBaseHTML(title, description, canonicalUrl, content, isHomePage = false, pageSpecificCSS = '', pageSpecificJS = '') {
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

  return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="keywords" content="加賀市,議会議員,選挙,2025年,候補者,政策,投票">
    <link rel="icon" href="../favicon.ico" type="image/x-icon">
    <link rel="stylesheet" href="../css/main.css">
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
            <a href="../index.html" class="logo">
                <div class="logo-icon">🗳️</div>
                加賀みらいチョイス
            </a>
            <div class="nav-links">
                <a href="../index.html">ホーム</a>
                <a href="../candidates/index.html">候補者一覧</a>
                <a href="../comparison/index.html">政策比較</a>
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
            <a href="comparison/index.html" class="quick-nav-item">
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
    true  // isHomePage = true
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
    false,
    '',
    pageSpecificJS
  );
}

// 候補者個別ページ用HTMLテンプレート
function generateCandidateDetailHTML(candidate, index) {
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
    `https://politi-kaga.github.io/kaga-mirai-choice/candidates/${index}/`,
    content
  );
}

// 政策比較ページ用HTMLテンプレート
function generateComparisonHTML() {
  const content = `
        <section class="hero">
            <h1>政策比較</h1>
            <p class="hero-subtitle">分野別に候補者の政策を比較できます</p>
        </section>

        <div class="comparison-section">
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

  const pageSpecificJS = `<script src="../js/comparison.js"></script>`;

  return generateBaseHTML(
    '政策比較 | 加賀みらいチョイス - 加賀市議会議員選挙2025',
    '2025年加賀市議会議員選挙候補者の政策を分野別に比較。各候補者の考えや政策を詳しく比較検討できます。',
    'https://politi-kaga.github.io/kaga-mirai-choice/comparison/',
    content,
    false,
    '',
    pageSpecificJS
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

// 候補者データの読み込み（モックデータまたはAPIから）
async function loadCandidatesData() {
  try {
    // モックデータを作成（実際のAPIデータがない場合）
    return [
      {
        '【00_基本情報】氏名': '田中太郎',
        '【00_基本情報】年齢': '45',
        '【00_基本情報】所属政党': '無所属',
        '【00_基本情報】当選回数': '新人',
        '【01_経済政策】地域経済活性化について': '地域の中小企業支援を強化し、若者の雇用創出に取り組みます。',
        '【02_福祉政策】高齢者福祉について': '高齢者が安心して暮らせる地域づくりを推進します。'
      },
      {
        '【00_基本情報】氏名': '佐藤花子',
        '【00_基本情報】年齢': '52',
        '【00_基本情報】所属政党': '自由民主党',
        '【00_基本情報】当選回数': '2回',
        '【01_経済政策】地域経済活性化について': '観光業の振興と農業の6次産業化を推進します。',
        '【02_福祉政策】高齢者福祉について': '介護施設の充実と在宅介護支援の拡充を図ります。'
      },
      {
        '【00_基本情報】氏名': '山田次郎',
        '【00_基本情報】年齢': '39',
        '【00_基本情報】所属政党': '立憲民主党',
        '【00_基本情報】当選回数': '1回',
        '【01_経済政策】地域経済活性化について': 'デジタル化推進による新産業創出を目指します。',
        '【02_福祉政策】高齢者福祉について': '地域包括ケアシステムの構築を推進します。'
      }
    ];
  } catch (error) {
    console.error('候補者データの読み込みに失敗:', error);
    return [];
  }
}

// メイン生成関数
async function generateSite() {
  console.log('🚀 静的サイト生成を開始...');
  
  try {
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
    
    // candidates ディレクトリと候補者一覧ページを生成
    await fs.ensureDir(path.join(config.distDir, 'candidates'));
    const candidatesListHtml = generateCandidatesListHTML();
    await fs.writeFile(path.join(config.distDir, 'candidates', 'index.html'), candidatesListHtml);
    console.log('👥 候補者一覧ページを生成しました');
    
    // 候補者データを読み込んで個別ページを生成
    const candidatesData = await loadCandidatesData();
    
    for (let i = 0; i < candidatesData.length; i++) {
      const candidate = candidatesData[i];
      
      // 候補者個別ディレクトリを作成
      const candidateDir = path.join(config.distDir, 'candidates', i.toString());
      await fs.ensureDir(candidateDir);
      
      // 候補者個別ページを生成
      const candidateHtml = generateCandidateDetailHTML(candidate, i);
      await fs.writeFile(path.join(candidateDir, 'index.html'), candidateHtml);
      
      console.log(`👤 候補者${i + 1}の詳細ページを生成しました (/candidates/${i}/)`);
    }
    
    // comparison ディレクトリと政策比較ページを生成
    await fs.ensureDir(path.join(config.distDir, 'comparison'));
    const comparisonHtml = generateComparisonHTML();
    await fs.writeFile(path.join(config.distDir, 'comparison', 'index.html'), comparisonHtml);
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