import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

export default function BuoyancyLabPage() {
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
          // 动态导入浮力实验室模块
          const { init } = await import('../../packages/sim-modules/buoyancy/dist/index.js');
          
          // 初始化模拟器
          simInstance = await init({
            container: containerRef.current,
            gradeBand: '3-6',
            devicePerf: 'mid'
          });
          
          // 设置初始参数
          simInstance.setParams({
            liquid_density: 1.0,
            temperature: 20,
            level: 1
          });
          
          // 开始模拟
          simInstance.start();
          
          setSimulator(simInstance);
        } catch (error) {
          console.error('初始化浮力实验室失败:', error);
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
        <title>浮力实验室 - vogame.com</title>
        <meta name="description" content="在不同液体中投放物体，调节液体密度/温度与物体体积/质量，观察漂浮/悬浮/下沉及浮力大小变化，完成指定挑战。" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="buoyancy-lab-container">
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
              <h1 className="game-title">浮力实验室</h1>
              <p className="game-description">在不同液体中投放物体，调节液体密度/温度与物体体积/质量，观察漂浮/悬浮/下沉及浮力大小变化，完成指定挑战。</p>
            </div>
            
            <div className="simulation-container" ref={containerRef}>
              {isLoading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <p>正在加载浮力实验室...</p>
                </div>
              )}
            </div>
            
            <div className="game-controls">
              <div className="control-group">
                <h3>液体控制</h3>
                <div className="slider-container">
                  <label htmlFor="liquid-density">液体密度: <span id="density-value">1.00</span> g/cm³</label>
                  <input type="range" id="liquid-density" className="slider" min="0.5" max="2.0" step="0.01" defaultValue="1.0" />
                </div>
                <div className="slider-container">
                  <label htmlFor="temperature">温度: <span id="temp-value">20.0</span> °C</label>
                  <input type="range" id="temperature" className="slider" min="0" max="100" step="0.1" defaultValue="20" />
                </div>
              </div>
              
              <div className="control-group">
                <h3>关卡选择</h3>
                <div className="btn-group">
                  <button className="btn btn-primary" id="level-1">L1: 浮沉分类</button>
                  <button className="btn btn-outline" id="level-2">L2: 悬浮挑战</button>
                  <button className="btn btn-outline" id="level-3">L3: 纸船载重</button>
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
                <li><strong>L1（浮沉分类）</strong>：把给定的3个物体拖入水中并正确分类漂/沉/悬浮。</li>
                <li><strong>L2（悬浮挑战）</strong>：通过调液体密度或改变物体体积，使其悬浮≥3秒。</li>
                <li><strong>L3（纸船载重）</strong>：设计纸船并逐步加载砝码，达到最大载重记录。</li>
                <li>使用滑块调节液体密度和温度，观察物体的浮沉状态。</li>
                <li>观察彩色力矢量（浮力、重力）和密度仪读数，比较浮力与重力。</li>
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
        .buoyancy-lab-container {
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
        
        .slider-container {
          margin: 15px 0;
        }
        
        .slider-container label {
          display: block;
          margin-bottom: 8px;
          color: var(--light);
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