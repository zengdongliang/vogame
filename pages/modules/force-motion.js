import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

export default function ForceMotionPlaygroundPage() {
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
          // 动态导入力与运动游乐场模块
          const { init } = await import('../../packages/sim-modules/force-motion/dist/index.js');
          
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
          console.error('初始化力与运动游乐场游戏失败:', error);
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
        <title>力与运动游乐场 - vogame.com</title>
        <meta name="description" content="对小车施加多个力，调质量与摩擦，观察合力、加速度、速度与位移的变化并完成挑战。" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="force-motion-playground-container">
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
              <h1 className="game-title">力与运动游乐场</h1>
              <p className="game-description">对小车施加多个力，调质量与摩擦，观察合力、加速度、速度与位移的变化并完成挑战。</p>
            </div>
            
            <div className="simulation-container" ref={containerRef}>
              {isLoading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <p>正在加载力与运动游乐场...</p>
                </div>
              )}
            </div>
            
            <div className="game-controls">
              <div className="control-group">
                <h3>力与质量控制</h3>
                <div className="control-row">
                  <div className="slider-container">
                    <label htmlFor="mass-slider">质量: <span id="mass-value">1.0</span> kg</label>
                    <input type="range" id="mass-slider" className="slider" min="0.1" max="5" step="0.1" defaultValue="1.0" />
                  </div>
                  <div className="slider-container">
                    <label htmlFor="friction-slider">摩擦系数: <span id="friction-value">0.1</span></label>
                    <input type="range" id="friction-slider" className="slider" min="0" max="1" step="0.01" defaultValue="0.1" />
                  </div>
                </div>
              </div>
              
              <div className="control-group">
                <h3>关卡选择</h3>
                <div className="btn-group">
                  <button className="btn btn-primary" id="level-1">L1: a=2 m/s²</button>
                  <button className="btn btn-outline" id="level-2">L2: 静止平衡</button>
                  <button className="btn btn-outline" id="level-3">L3: 到达目标</button>
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
                <li><strong>L1：使 a=2 m/s²</strong>：添加力矢量使加速度达到目标值（误差≤10%）。</li>
                <li><strong>L2：保持物体静止</strong>：施加平衡力使物体静止≥5秒。</li>
                <li><strong>L3：限时到达指定位置</strong>：综合运用力与运动知识完成任务。</li>
                <li>点击并拖拽力矢量来调整力的大小和方向。</li>
                <li>观察 a-t、v-t、x-t 图像理解运动规律。</li>
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
        .force-motion-playground-container {
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