import React, { useState, useEffect, useCallback } from 'react';

const Game = () => {
  const [health, setHealth] = useState(100);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [playerPosition, setPlayerPosition] = useState(50);
  const [gameOver, setGameOver] = useState(false);
  const [bombs, setBombs] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  
  // 音樂設置
  const [bgMusic] = useState(() => {
    const audio = new Audio('/炸彈音樂.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = 'auto';
    return audio;
  });

  // 遊戲開始時自動播放音樂
  useEffect(() => {
    if (gameStarted) {
      bgMusic.play().catch(error => console.log("音樂播放失敗:", error));
    }
    return () => {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    };
  }, [gameStarted, bgMusic]);

  // 移動控制
  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setPlayerPosition(Math.max(0, Math.min(100, percentage)));
  }, []);

  // 遊戲主循環
  useEffect(() => {
    if (gameOver || !gameStarted) return;
    
    const timeInterval = setInterval(() => {
      setTime(prev => {
        if (prev <= 0) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const gameLoop = setInterval(() => {
      if (Math.random() < 0.05) {
        setBombs(prev => [...prev, {
          x: Math.random() * 100,
          y: 0,
          id: Date.now()
        }]);
      }

      setBombs(prev => prev.map(bomb => ({
        ...bomb,
        y: bomb.y + 0.5
      })).filter(bomb => {
        const BASKET_BOTTOM = 32;
        const BASKET_HEIGHT = 40;
        const BASKET_WIDTH = 40;
        const BASKET_TOP = 100 - BASKET_BOTTOM - BASKET_HEIGHT;
        
        const basketLeft = playerPosition - (BASKET_WIDTH / 4);
        const basketRight = playerPosition + (BASKET_WIDTH / 4);
        const basketTop = BASKET_TOP + (BASKET_HEIGHT / 4);
        const basketBottom = BASKET_TOP + (BASKET_HEIGHT * 3/4);

        const inBasketHorizontally = bomb.x >= basketLeft && bomb.x <= basketRight;
        const inBasketVertically = bomb.y >= basketTop && bomb.y <= basketBottom;

        if (inBasketHorizontally && inBasketVertically) {
          setScore(s => s + 1);
          return false;
        }
        
        if (bomb.y > 100) {
          setHealth(h => Math.max(0, h - 10));
          return false;
        }
        
        return true;
      }));
    }, 16);

    return () => {
      clearInterval(timeInterval);
      clearInterval(gameLoop);
    };
  }, [gameOver, playerPosition, gameStarted]);

  useEffect(() => {
    if (health <= 0) {
      setGameOver(true);
    }
  }, [health]);

  return (
    <div 
      className="h-screen w-full relative overflow-hidden touch-none"
      style={{
        backgroundImage: 'url(/背景街道.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between text-white bg-black bg-opacity-50 z-10">
        <div className="text-xl">生命值: {health}</div>
        <div className="text-xl">得分: {score}</div>
        <div className="text-xl">時間: {time}秒</div>
      </div>

      {bombs.map(bomb => (
        <div
          key={bomb.id}
          className="absolute w-16 h-16 z-20"
          style={{
            left: `${bomb.x}%`,
            top: `${bomb.y}%`,
            transform: 'translate(-50%, -50%)',
            backgroundImage: 'url(/炸彈去背.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            willChange: 'transform',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          }}
        />
      ))}

      <div
        className="absolute bottom-32 w-40 h-40 z-20"
        style={{ 
          left: `${playerPosition}%`, 
          transform: 'translateX(-50%)',
          backgroundImage: 'url(/籃子.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          willChange: 'transform',
          transition: 'transform 0.05s linear',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-full bg-transparent z-30"
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchMove}
      />

      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
          <div className="text-white text-center p-8 bg-gray-800 rounded-xl">
            <h2 className="text-3xl mb-4">接炸彈遊戲</h2>
            <p className="text-xl mb-4">左右滑動接住掉落的炸彈</p>
            <button
              className="mt-4 px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={() => setGameStarted(true)}
            >
              開始遊戲
            </button>
          </div>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
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
    </div>
  );
};

export default Game;