import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

export default function FrictionRampPage() {
  const containerRef = useRef(null);
  const [simulator, setSimulator] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 初始化模拟器
  useEffect(() => {
    let simInstance = null;
    
    const initializeSimulator = async () => {
      if (typeof window !== 'undefined' && containerRef.current) {
        setIsLoading(true);
        
        try {
          // 动态导入摩擦与斜面模块
          const { init } = await import('../../packages/sim-modules/friction-ramp/dist/index.js');
          
          // 初始化模拟器
          simInstance = await init({
            container: containerRef.current,
            gradeBand: '4-8',
            devicePerf: 'mid'
          });
          
          // 设置初始参数
          simInstance.setParams({
            level: 1
          });
          
          // 开始模拟
          simInstance.start();
          
          setSimulator(simInstance);
        } catch (error) {
          console.error('初始化摩擦与斜面游戏失败:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    initializeSimulator();
    
    // 清理函数
    return () => {
      if (simInstance) {
        simInstance.destroy();
      }
    };
  }, []);
  
  return (
    <>
      <Head>
        <title>摩擦与斜面 - vogame.com</title>
        <meta name="description" content="更换材料、调斜率，观察静/动摩擦差异与临界角现象，完成定量测量与竞速挑战。" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="friction-ramp-container">
        {/* 顶部导航栏 */}
        <header className="navbar">
          <div className="container">
            <div className="logo">
              <h2>vogame<span className="highlight">.com</span></h2>
            </div>
            <nav className="nav-links">
              <a href="/">首页</a>
              <a href="/#features">功能特性</a>
              <a href="/#modules">科学模块</a>
              <a href="/#pricing">定价</a>
            </nav>
            <div className="nav-buttons">
              <button className="btn btn-outline">登录</button>
              <button className="btn btn-primary">免费试用</button>
            </div>
          </div>
        </header>

        {/* 游戏内容区域 */}
        <div className="container">
          <div className="game-container">
            <div className="game-header">
              <h1 className="game-title">摩擦与斜面</h1>
              <p className="game-description">更换材料、调斜率，观察静/动摩擦差异与临界角现象，完成定量测量与竞速挑战。</p>
            </div>
            
            <div className="simulation-container" ref={containerRef}>
              {isLoading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <p>正在加载摩擦与斜面...</p>
                </div>
              )}
            </div>
            
            <div className="game-controls">
              <div className="control-group">
                <h3>材料与参数控制</h3>
                <div className="control-row">
                  <div className="slider-container">
                    <label htmlFor="material-select">材料选择:</label>
                    <select id="material-select" className="material-select">
                      <option value="wood">木头</option>
                      <option value="rubber">橡胶</option>
                      <option value="steel">钢铁</option>
                      <option value="ice">冰</option>
                      <option value="concrete">混凝土</option>
                    </select>
                  </div>
                  <div className="slider-container">
                    <label htmlFor="angle-slider">斜面角度: <span id="angle-value">0.0</span>°</label>
                    <input type="range" id="angle-slider" className="slider" min="0" max="45" step="0.1" defaultValue="0" />
                  </div>
                  <div className="slider-container">
                    <label htmlFor="mass-slider">质量: <span id="mass-value">1.0</span> kg</label>
                    <input type="range" id="mass-slider" className="slider" min="0.1" max="5" step="0.1" defaultValue="1.0" />
                  </div>
                </div>
              </div>
              
              <div className="control-group">
                <h3>关卡选择</h3>
                <div className="btn-group">
                  <button className="btn btn-primary" id="level-1">L1: 临界角测量</button>
                  <button className="btn btn-outline" id="level-2">L2: 竞速挑战</button>
                  <button className="btn btn-outline" id="level-3">L3: 静止保持</button>
                </div>
                <div className="btn-group">
                  <button className="btn btn-primary" id="start-btn">开始</button>
                  <button className="btn btn-outline" id="pause-btn">暂停</button>
                  <button className="btn btn-outline" id="reset-btn">重置</button>
                </div>
              </div>
            </div>
            
            <div className="instructions">
              <h2>游戏说明</h2>
              <ul>
                <li><strong>L1：测木-橡胶临界角</strong>：逐步增大角度，找到刚开始滑动的临界点（误差≤5%）。</li>
                <li><strong>L2：最短时间滑到底</strong>：选择合适材料和角度，以最快速度滑到斜面底部。</li>
                <li><strong>L3：在限定角度保持静止</strong>：在指定角度下保持物体静止≥5秒。</li>
                <li>观察受力分解箭头，理解静摩擦与动摩擦的差异。</li>
                <li>不同材质有不同的摩擦系数，影响物体的滑动行为。</li>
              </ul>
            </div>
          </div>
        </div>
        
        <footer className="footer">
          <div className="container">
            <p>&copy; 2025 vogame.com. 让抽象科学概念"可看、可玩、可证据化"</p>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        .friction-ramp-container {
          background: var(--darker);
          color: var(--light);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .game-container {
          margin: 30px 0;
        }
        
        .game-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .game-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 2.5rem;
          margin-bottom: 15px;
          background: linear-gradient(to right, var(--light), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .game-description {
          color: var(--gray);
          font-size: 1.1rem;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .simulation-container {
          width: 100%;
          height: 600px;
          background: rgba(15, 23, 42, 0.7);
          border-radius: var(--border-radius);
          border: 1px solid var(--card-border);
          position: relative;
          overflow: hidden;
          margin-bottom: 30px;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(11, 17, 32, 0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 10;
          color: var(--light);
          text-align: center;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .game-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .control-group {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius);
          padding: 20px;
        }
        
        .control-group h3 {
          margin-top: 0;
          color: var(--light);
          font-family: 'Orbitron', sans-serif;
        }
        
        .control-row {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .slider-container {
          margin: 15px 0;
        }
        
        .slider-container label {
          display: block;
          margin-bottom: 8px;
          color: var(--light);
        }
        
        .material-select {
          width: 100%;
          padding: 8px 12px;
          border-radius: 4px;
          background: var(--gray-dark);
          color: var(--light);
          border: 1px solid var(--gray);
        }
        
        .slider {
          width: 100%;
          height: 8px;
          border-radius: 4px;
          background: var(--gray-dark);
          outline: none;
          -webkit-appearance: none;
        }
        
        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--primary);
          cursor: pointer;
        }
        
        .btn-group {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: var(--border-radius);
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background: var(--gradient);
          color: white;
        }
        
        .btn-outline {
          background: transparent;
          color: var(--light);
          border: 1px solid var(--gray);
        }
        
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }
        
        .instructions {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: var(--border-radius);
          padding: 20px;
          margin-top: 30px;
        }
        
        .instructions h2 {
          font-family: 'Orbitron', sans-serif;
          color: var(--light);
          margin-top: 0;
        }
        
        .instructions ul {
          padding-left: 20px;
        }
        
        .instructions li {
          margin: 10px 0;
          color: var(--gray);
        }
      `}</style>
    </>
  );
}