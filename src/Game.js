import React, { useState, useEffect, useCallback } from 'react';

const Game = () => {
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [playerPosition, setPlayerPosition] = useState(50);
  const [gameOver, setGameOver] = useState(false);
  const [bombs, setBombs] = useState([]);
  
  // 處理觸控移動
  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    const newPosition = (touch.clientX / screenWidth) * 100;
    setPlayerPosition(Math.max(0, Math.min(100, newPosition)));
  }, []);

  // 遊戲主循環
  useEffect(() => {
    if (gameOver) return;
    
    // 時間更新，每1000ms（1秒）更新一次
    const timeInterval = setInterval(() => {
      setTime(prev => {
        if (prev <= 0) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 遊戲邏輯更新（炸彈等），可以保持較快的更新頻率
    const gameLoop = setInterval(() => {
      // 生成新炸彈
      if (Math.random() < 0.05) {
        setBombs(prev => [...prev, {
          x: Math.random() * 100,
          y: 0,
          id: Date.now()
        }]);
      }

      // 更新炸彈位置
      setBombs(prev => prev.map(bomb => ({
        ...bomb,
        y: bomb.y + 0.5  // 改為較小的增量
      })).filter(bomb => {
        if (bomb.y >= 90 && Math.abs(bomb.x - playerPosition) < 10) {
          setScore(s => s + 1);
          return false;
        }
        if (bomb.y > 100) {
          setHealth(h => Math.max(0, h - 10));
          return false;
        }
        return true;
      }));
    }, 16);  // 改為 16ms (約60FPS)

    return () => {
      clearInterval(timeInterval);
      clearInterval(gameLoop);
    };
  }, [gameOver, playerPosition]);

  // 檢查遊戲結束條件
  useEffect(() => {
    if (health <= 0) {
      setGameOver(true);
    }
  }, [health]);

  return (
    <div className="h-screen w-full bg-gray-900 relative overflow-hidden touch-none">
      {/* 狀態欄 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between text-white bg-black bg-opacity-50">
        <div className="text-xl">生命值: {health}</div>
        <div className="text-xl">得分: {score}</div>
        <div className="text-xl">時間: {time}秒</div>
      </div>

      {/* 炸彈 */}
      {bombs.map(bomb => (
        <div
          key={bomb.id}
          className="absolute w-8 h-8 bg-red-500 rounded-full shadow-lg"
          style={{
            left: `${bomb.x}%`,
            top: `${bomb.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* 玩家 */}
      {/* 玩家 */}
      <div
        className="absolute bottom-32 w-16 h-16 bg-blue-500 rounded-lg shadow-xl"
        style={{ 
          left: `${playerPosition}%`, 
          transform: 'translateX(-50%)'
        }}
      />

{/* 觸控事件區域 - 也需要調整 */}
<div
  className="absolute bottom-0 left-0 right-0 h-48 bg-transparent"
  onTouchMove={handleTouchMove}
/>

      {/* 遊戲結束畫面 */}
      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-white text-center p-8 bg-gray-800 rounded-xl">
            <h2 className="text-3xl mb-4">遊戲結束!</h2>
            <p className="text-xl mb-2">最終得分: {score}</p>
            <button
              className="mt-4 px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => window.location.reload()}
            >
              重新開始
            </button>
          </div>
        </div>
      )}
      
      {/* 觸控事件區域 */}
      <div
         className="absolute bottom-0 left-0 right-0 h-40 bg-transparent"
          onTouchMove={handleTouchMove}
      />
    </div>
  );
};

export default Game;