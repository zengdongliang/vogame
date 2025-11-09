import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>vogame - K12科学概念可视化游戏平台</title>
        <meta name="description" content="通过互动模拟游戏让抽象科学概念变得可见、可玩、可验证的K12科学教育平台" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      {/* 顶部导航栏 */}
      <header className="navbar">
        <div className="container">
          <div className="logo">
            <h2>vogame<span className="highlight">.com</span></h2>
          </div>
          <nav className="nav-links">
            <a href="#features">功能特性</a>
            <a href="#modules">科学模块</a>
            <a href="#pricing">定价</a>
            <a href="#testimonials">用户评价</a>
          </nav>
          <div className="nav-buttons">
            <button className="btn btn-outline">登录</button>
            <button className="btn btn-primary">免费试用</button>
          </div>
        </div>
      </header>

      {/* 英雄区域 */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">让抽象科学概念<span className="highlight">可视化</span></h1>
            <p className="hero-subtitle">通过12个互动科学实验室，帮助K12学生理解复杂科学原理，激发学习兴趣</p>
            <div className="hero-buttons">
              <button className="btn btn-primary btn-large">立即开始免费试用</button>
              <button className="btn btn-outline btn-large">观看演示视频</button>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-placeholder">
              <div className="tech-grid"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 特色功能 */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-header">
            <h2>为什么选择vogame</h2>
            <p>我们为科学教育带来革命性的体验</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-bg"></div>
                <span>🔬</span>
              </div>
              <h3>互动模拟</h3>
              <p>12个精心设计的科学实验室，让学生亲手操作实验，直观理解科学原理</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-bg"></div>
                <span>📊</span>
              </div>
              <h3>学习追踪</h3>
              <p>详细的学习报告和进度追踪，帮助家长和教师了解学生掌握情况</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-bg"></div>
                <span>📱</span>
              </div>
              <h3>跨平台支持</h3>
              <p>支持桌面、平板和手机，随时随地进行科学探索</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-bg"></div>
                <span>🌍</span>
              </div>
              <h3>多语言支持</h3>
              <p>支持中英文双语，满足不同地区学生的学习需求</p>
            </div>
          </div>
        </div>
      </section>

      {/* 科学模块展示 */}
      <section className="modules" id="modules">
        <div className="container">
          <div className="section-header">
            <h2>12个核心科学模块</h2>
            <p>涵盖物理、化学、生物三大科学领域</p>
          </div>
          <div className="modules-grid">
            <a href="/modules/buoyancy" className="module-card-link">
              <div className="module-card">
                <div className="module-icon">💧</div>
                <h3>浮力实验室</h3>
                <p>探索密度和浮力概念</p>
              </div>
            </a>
            <div className="module-card">
              <div className="module-icon">⚡</div>
              <h3>电路故障排除</h3>
              <p>学习电路和故障排除</p>
            </div>
            <div className="module-card">
              <div className="module-icon">🏃</div>
              <h3>力与运动</h3>
              <p>理解牛顿运动定律</p>
            </div>
            <div className="module-card">
              <div className="module-icon">🏔️</div>
              <h3>摩擦与斜面</h3>
              <p>研究摩擦力和斜面</p>
            </div>
            <div className="module-card">
              <div className="module-icon">⚙️</div>
              <h3>杠杆与滑轮</h3>
              <p>实验简单机械</p>
            </div>
            <div className="module-card">
              <div className="module-icon">🏹</div>
              <h3>抛体沙盒</h3>
              <p>探索抛体运动</p>
            </div>
            <div className="module-card">
              <div className="module-icon">🌈</div>
              <h3>光学实验室</h3>
              <p>发现光的反射和折射</p>
            </div>
            <div className="module-card">
              <div className="module-icon">🎵</div>
              <h3>声波工作室</h3>
              <p>学习声波和属性</p>
            </div>
            <div className="module-card">
              <div className="module-icon">🔥</div>
              <h3>热传导实验</h3>
              <p>研究热能和热传导</p>
            </div>
            <div className="module-card">
              <div className="module-icon">🎢</div>
              <h3>能量滑板公园</h3>
              <p>探索能量守恒</p>
            </div>
            <div className="module-card">
              <div className="module-icon">🧲</div>
              <h3>磁与电磁</h3>
              <p>研究磁场</p>
            </div>
            <div className="module-card">
              <div className="module-icon">🎈</div>
              <h3>气体压强实验</h3>
              <p>理解气体定律</p>
            </div>
          </div>
        </div>
      </section>

      {/* 家长和教育者价值 */}
      <section className="value-prop">
        <div className="container">
          <div className="value-content">
            <div className="value-text">
              <h2>为家长和教育者提供价值</h2>
              <p>vogame不仅是一个游戏平台，更是科学教育的有力工具。我们提供详细的学习报告和进度追踪，帮助您了解孩子的学习情况。</p>
              <ul className="value-list">
                <li>详细的学习进度报告</li>
                <li>个性化学习建议</li>
                <li>与课程标准对齐的内容</li>
                <li>安全、无广告的学习环境</li>
              </ul>
              <button className="btn btn-primary">了解更多</button>
            </div>
            <div className="value-image">
              <div className="dashboard-placeholder"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 定价方案 */}
      <section className="pricing" id="pricing">
        <div className="container">
          <div className="section-header">
            <h2>简单透明的定价</h2>
            <p>选择适合您家庭的方案</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>免费试用</h3>
              <div className="price">¥0<span className="period">/月</span></div>
              <ul className="pricing-features">
                <li>访问3个科学模块</li>
                <li>基础交互功能</li>
                <li>有限的学习报告</li>
                <li className="disabled">家长报告</li>
                <li className="disabled">所有12个模块</li>
              </ul>
              <button className="btn btn-outline">开始试用</button>
            </div>
            <div className="pricing-card featured">
              <div className="featured-badge">推荐</div>
              <h3>家庭套餐</h3>
              <div className="price">¥99<span className="period">/月</span></div>
              <ul className="pricing-features">
                <li>访问全部12个科学模块</li>
                <li>完整交互功能</li>
                <li>详细学习报告</li>
                <li>家长报告仪表板</li>
                <li>离线下载功能</li>
              </ul>
              <button className="btn btn-primary">立即订阅</button>
            </div>
            <div className="pricing-card">
              <h3>学期包</h3>
              <div className="price">¥299<span className="period">/学期</span></div>
              <ul className="pricing-features">
                <li>访问全部12个科学模块</li>
                <li>完整交互功能</li>
                <li>详细学习报告</li>
                <li>家长报告仪表板</li>
                <li>离线下载功能</li>
              </ul>
              <button className="btn btn-outline">立即购买</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA区域 */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>开启科学探索之旅</h2>
            <p>立即注册，获得14天免费试用，体验全部功能</p>
            <div className="cta-buttons">
              <button className="btn btn-primary btn-large">免费试用</button>
              <button className="btn btn-outline btn-large">联系我们</button>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h3>vogame<span className="highlight">.com</span></h3>
              <p>让抽象科学概念"可看、可玩、可证据化"</p>
              <div className="social-links">
                <a href="#" aria-label="微信">-wechat-</a>
                <a href="#" aria-label="微博">-weibo-</a>
                <a href="#" aria-label="抖音">-douyin-</a>
              </div>
            </div>
            <div className="footer-col">
              <h4>产品</h4>
              <ul>
                <li><a href="#">科学模块</a></li>
                <li><a href="#">家长控制</a></li>
                <li><a href="#">定价方案</a></li>
                <li><a href="#">更新日志</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>资源</h4>
              <ul>
                <li><a href="#">帮助中心</a></li>
                <li><a href="#">教学指南</a></li>
                <li><a href="#">博客</a></li>
                <li><a href="#">社区</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>公司</h4>
              <ul>
                <li><a href="#">关于我们</a></li>
                <li><a href="#">联系我们</a></li>
                <li><a href="#">招聘信息</a></li>
                <li><a href="#">隐私政策</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 vogame.com. 保留所有权利。</p>
          </div>
        </div>
      </footer>

      <Script src="/script.js" strategy="afterInteractive" />
      
      <style jsx global>{`
        .module-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          transition: transform 0.3s ease;
        }
        
        .module-card-link:hover {
          transform: translateY(-8px);
        }
      `}</style>
    </>
  );
}