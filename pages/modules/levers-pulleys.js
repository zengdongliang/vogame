import Head from 'next/head';
import Script from 'next/script';
import { useEffect, useRef } from 'react';

export default function LeversPulleysPage() {
  const containerRef = useRef(null);
  const gameInstanceRef = useRef(null);

  useEffect(() => {
    // 动态导入模块
    const loadGame = async () => {
      try {
        // 确保容器已挂载
        if (containerRef.current) {
          // 清空容器
          containerRef.current.innerHTML = '';
          
          // 加载杠杆与滑轮模块
          const module = await import('../../packages/sim-modules/levers-pulleys/dist/index.js');
          
          // 初始化游戏
          gameInstanceRef.current = await module.init({
            container: containerRef.current,
            locale: 'zh-CN',
            gradeBand: '4-9'
          });
          
          // 启动游戏
          gameInstanceRef.current.start();
        }
      } catch (error) {
        console.error('Failed to load levers and pulleys game:', error);
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
    if (gameInstanceRef.current) {
      gameInstanceRef.current.setParams({ level });
    }
  };

  return (
    <>
      <Head>
        <title>杠杆与滑轮构建器 - vogame</title>
        <meta name="description" content="通过互动模拟学习杠杆与滑轮的物理原理，理解力矩平衡与机械优势" />
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
            <h1 className="text-4xl font-bold mb-4">杠杆与滑轮构建器</h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              移动支点、添加砝码或滑轮，达成目标载荷与最小用力，理解力矩平衡与机械优势
            </p>
          </div>

          {/* 控制面板 */}
          <div className="bg-gray-800 rounded-xl p-6 mb-8 shadow-lg">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">控制台</h2>
                <p className="text-gray-400">选择关卡并控制模拟</p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  重置
                </button>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleLevelChange(1)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    关卡 1
                  </button>
                  <button 
                    onClick={() => handleLevelChange(2)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    关卡 2
                  </button>
                  <button 
                    onClick={() => handleLevelChange(3)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    关卡 3
                  </button>
                </div>
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
                  <p className="text-gray-400">加载杠杆与滑轮模拟器...</p>
                </div>
              </div>
            </div>
          </div>

          {/* 学习目标 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-blue-400 text-3xl mb-3">⚖️</div>
              <h3 className="text-xl font-bold mb-2">力矩平衡</h3>
              <p className="text-gray-400">
                通过臂长设计实现力矩平衡，理解杠杆原理
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-purple-400 text-3xl mb-3">⚙️</div>
              <h3 className="text-xl font-bold mb-2">机械优势</h3>
              <p className="text-gray-400">
                估算滑轮组机械优势与拉力，掌握简单机械
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="text-green-400 text-3xl mb-3">💪</div>
              <h3 className="text-xl font-bold mb-2">最小用力</h3>
              <p className="text-gray-400">
                在限制条件下最小化输入力，优化解决方案
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