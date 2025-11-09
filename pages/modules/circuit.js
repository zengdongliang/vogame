import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';

export default function CircuitDebuggerPage() {
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
          // 动态导入电路故障排除模块
          const { init } = await import('../../packages/sim-modules/circuit/dist/index.js');
          
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
          console.error('初始化电路故障排除游戏失败:', error);
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
        <title>电路故障排除 - vogame.com</title>
        <meta name="description" content="在面包板式界面中连接元件，定位并修复断路/短路等故障，达成目标电流/亮度。" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Orbitron:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="circuit-debugger-container">
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
              <h1 className="game-title">电路故障排除</h1>
              <p className="game-description">在面包板式界面中连接元件，定位并修复断路/短路等故障，达成目标电流/亮度。</p>
            </div>
            
            <div className="simulation-container" ref={containerRef}>
              {isLoading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <p>正在加载电路故障排除游戏...</p>
                </div>
              )}
            </div>
            
            <div className="game-controls">
              <div className="control-group">
                <h3>元件工具箱</h3>
                <div className="component-toolbar">
                  <button className="component-btn">
                    <div className="component-icon battery-icon"></div>
                    <span>电池</span>
                  </button>
                  <button className="component-btn">
                    <div className="component-icon bulb-icon"></div>
                    <span>灯泡</span>
                  </button>
                  <button className="component-btn">
                    <div className="component-icon resistor-icon"></div>
                    <span>电阻</span>
                  </button>
                  <button className="component-btn">
                    <div className="component-icon switch-icon"></div>
                    <span>开关</span>
                  </button>
                </div>
              </div>
              
              <div className="control-group">
                <h3>关卡选择</h3>
                <div className="btn-group">
                  <button className="btn btn-primary" id="level-1">L1: 修复断路</button>
                  <button className="btn btn-outline" id="level-2">L2: 防短路</button>
                  <button className="btn btn-outline" id="level-3">L3: 亮度匹配</button>
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
                <li><strong>L1（修复断路）</strong>：找到并修复两个断开点，使灯点亮。</li>
                <li><strong>L2（防短路）</strong>：在限制条件下添加限流电阻，避免短路告警。</li>
                <li><strong>L3（亮度匹配）</strong>：让两只灯同样亮（并联平衡）。</li>
                <li>拖拽元件到面包板上，点击元件进行连接。</li>
                <li>使用万用表测量电压、电流和电阻，定位故障。</li>
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
        .circuit-debugger-container {
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
        
        .component-toolbar {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        
        .component-btn {
          background: rgba(74, 108, 245, 0.2);
          border: 1px solid var(--primary);
          border-radius: 8px;
          padding: 10px;
          color: var(--light);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .component-btn:hover {
          background: rgba(74, 108, 245, 0.4);
          transform: translateY(-2px);
        }
        
        .component-icon {
          width: 40px;
          height: 40px;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        
        .battery-icon::before {
          content: "🔋";
        }
        
        .bulb-icon::before {
          content: "💡";
        }
        
        .resistor-icon::before {
          content: "📐";
        }
        
        .switch-icon::before {
          content: "🎚️";
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