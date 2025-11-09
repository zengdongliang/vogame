import Head from 'next/head';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

export default function ProjectileSandboxPage() {
  const containerRef = useRef(null);
  const gameInstanceRef = useRef(null);
  const [launchAngle, setLaunchAngle] = useState(45);
  const [initialSpeed, setInitialSpeed] = useState(30);
  const [gravity, setGravity] = useState(9.8);
  const [airResistance, setAirResistance] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);

  useEffect(() => {
    // 动态导入模块
    const loadGame = async () => {
      try {
        // 确保容器已挂载
        if (containerRef.current) {
          // 清空容器
          containerRef.current.innerHTML = '';
          
          // 加载抛体沙盒模块
          const module = await import('../../packages/sim-modules/projectile-sandbox/dist/index.js');
          
          // 初始化游戏
          gameInstanceRef.current = await module.init({
            container: containerRef.current,
            locale: 'zh-CN',
            gradeBand: '6-10'
          });
          
          // 启动游戏
          gameInstanceRef.current.start();
        }
      } catch (error) {
        console.error('Failed to load projectile sandbox game:', error);
      }
    };

    loadGame();

    // 清理函数
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy();
        gameInstanceRef.current = null;
      }
    };
  }, []);

  const handleReset = () => {
    if (gameInstanceRef.current) {
      gameInstanceRef.current.reset();
    }
  };

  const handleLevelChange = (level) => {
    setCurrentLevel(level);
    if (gameInstanceRef.current) {
      gameInstanceRef.current.setParams({ level });
    }
  };

  const handleLaunch = () => {
    if (gameInstanceRef.current) {
      // 更新游戏参数
      gameInstanceRef.current.setParams({ 
        launchAngle,
        initialSpeed,
        gravity,
        airResistance 
      });
      
      // 调用发射函数（如果存在）
      if (gameInstanceRef.current.launchProjectile) {
        gameInstanceRef.current.launchProjectile();
      }
    }
  };

  const handleEnvironmentChange = (env) => {
    switch(env) {
      case 'earth':
        setGravity(9.8);
        break;
      case 'moon':
        setGravity(1.62);
        break;
      case 'mars':
        setGravity(3.71);
        break;
      default:
        setGravity(9.8);
    }
  };

  return (
    <>
      <Head>
        <title>抛体运动沙盒 - vogame</title>
        <meta name="description" content="通过互动模拟学习抛体运动的物理原理，理解分量分解与环境差异" />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        {/* 顶部导航栏 */}
        <header className="navbar">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="logo">
              <h2 className="text-2xl font-bold">
                <a href="/">vogame<span className="text-blue-400">.com</span></a>
              </h2>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="/" className="hover:text-blue-400 transition-colors">首页</a>
              <a href="/#features" className="hover:text-blue-400 transition-colors">功能</a>
              <a href="/#modules" className="hover:text-blue-400 transition-colors">模块</a>
            </nav>
            <div className="flex space-x-3">
              <button className="px-4 py-2 border border-blue-500 rounded-lg hover:bg-blue-500 transition-colors">登录</button>
              <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">免费试用</button>
            </div>
          </div>
        </header>

        {/* 游戏主区域 */}
        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">抛体运动沙盒</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              设置发射角/初速/重力与空气阻力，命中目标或追求最远射程，理解分量分解与环境差异
            </p>
          </div>

          {/* 控制面板 */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">发射角度 (°)</label>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={launchAngle}
                  onChange={(e) => setLaunchAngle(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center mt-1">{launchAngle}°</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">初速度 (m/s)</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={initialSpeed}
                  onChange={(e) => setInitialSpeed(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center mt-1">{initialSpeed} m/s</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">重力 (m/s²)</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={gravity}
                  onChange={(e) => setGravity(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-center mt-1">{gravity} m/s²</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">空气阻力</label>
                <div className="flex items-center justify-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={airResistance}
                      onChange={(e) => setAirResistance(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ms-3 text-sm font-medium">
                      {airResistance ? '开启' : '关闭'}
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-between items-center gap-4 mt-6">
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  重置
                </button>
                
                <button 
                  onClick={handleLaunch}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  发射
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleLevelChange(1)}
                    className={`px-4 py-2 rounded-lg transition-colors ${currentLevel === 1 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    关卡 1
                  </button>
                  <button 
                    onClick={() => handleLevelChange(2)}
                    className={`px-4 py-2 rounded-lg transition-colors ${currentLevel === 2 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    关卡 2
                  </button>
                  <button 
                    onClick={() => handleLevelChange(3)}
                    className={`px-4 py-2 rounded-lg transition-colors ${currentLevel === 3 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                  >
                    关卡 3
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleEnvironmentChange('earth')}
                  className="px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg transition-colors"
                >
                  地球
                </button>
                <button 
                  onClick={() => handleEnvironmentChange('moon')}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  月球
                </button>
                <button 
                  onClick={() => handleEnvironmentChange('mars')}
                  className="px-3 py-2 bg-red-700 hover:bg-red-600 rounded-lg transition-colors"
                >
                  火星
                </button>
              </div>
            </div>
          </div>

          {/* 游戏容器 */}
          <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
            <div 
              ref={containerRef} 
              className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden"
              style={{ minHeight: '600px' }}
            >
              {/* 游戏将在这里加载 */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                  <p className="text-gray-400">加载抛体运动沙盒...</p>
                </div>
              </div>
            </div>
          </div>

          {/* 学习目标 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-blue-400 text-3xl mb-3">🎯</div>
              <h3 className="text-xl font-bold mb-2">预测落点</h3>
              <p className="text-gray-400">
                根据角度和初速预测落点（无阻力近似）
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-purple-400 text-3xl mb-3">📊</div>
              <h3 className="text-xl font-bold mb-2">环境差异</h3>
              <p className="text-gray-400">
                解释45°近似最远与有阻力时的偏差
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-green-400 text-3xl mb-3">📈</div>
              <h3 className="text-xl font-bold mb-2">图表分析</h3>
              <p className="text-gray-400">
                读懂位置-时间与速度-时间图
              </p>
            </div>
          </div>
        </main>

        {/* 页脚 */}
        <footer className="bg-gray-900 border-t border-gray-800 py-12 mt-12">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <p className="text-gray-500">
                &copy; 2025 vogame.com. 让抽象科学概念"可看、可玩、可证据化"
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}