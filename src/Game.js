import React, { useState, useEffect, useRef, useCallback } from 'react';

const Game = () => {
  // 遊戲狀態
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'end'
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(30);
  const [bombs, setBombs] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(50);
  
  // 參考值
  const gameAreaRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastBombTimeRef = useRef(0);
  
  // 調整遊戲參數以優化體驗
  const BOMB_GENERATION_INTERVAL = 500; // 從 800 降低到 500，更頻繁生成炸彈
  const BOMB_FALLING_SPEED = 0.35; // 微調下落速度
  const BASKET_BOTTOM = 32;
  const BASKET_TOP_OFFSET = 1;
  const BASKET_WIDTH = 15;
  
  // 碰撞檢測參數 - 調整為更接近視覺效果
  
  // 音樂設置
  const [bgMusic] = useState(() => {
    const audio = new Audio('/炸彈音樂.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    audio.preload = 'auto';
    return audio;
  });

  // 音效設置
  const [catchSound] = useState(() => {
    const audio = new Audio('/8-bit-pickup.mp3');
    audio.volume = 0.5; // 設置音效音量
    return audio;
  });
  const [missSound] = useState(() => new Audio('/漏掉炸彈.mp3'));
  
  // 遊戲開始時自動播放音樂
  useEffect(() => {
    if (gameState === 'playing') {
      bgMusic.play().catch(error => console.log("音樂播放失敗:", error));
    } else {
      bgMusic.pause();
    }
    
    return () => {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    };
  }, [gameState, bgMusic]);

  // 開始遊戲
  const startGame = () => {
    setGameState('playing');
    setLives(3);
    setScore(0);
    setTime(30);
    setBombs([]);
    setPlayerPosition(50);
  };

  // 結束遊戲
  const endGame = () => {
    setGameState('end');
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // 重新開始遊戲
  const restartGame = () => {
    startGame();
  };

  // 遊戲計時器
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const timer = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState]);

  // 觸控控制處理
  const handleTouchMove = useCallback((e) => {
    if (gameState !== 'playing') return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    // 限制在遊戲區域內
    const newPosition = Math.max(0, Math.min(100, percentage));
    setPlayerPosition(newPosition);
  }, [gameState]);

  // 遊戲主循環 - 使用 requestAnimationFrame
  const gameLoop = useCallback((timestamp) => {
    // 生成炸彈
    if (timestamp - lastBombTimeRef.current > BOMB_GENERATION_INTERVAL) {
      if (Math.random() < 0.6) { // 從 0.4 提高到 0.6，增加生成機率
        setBombs(prev => [...prev, {
          x: Math.random() * 100,
          y: 0,
          id: Date.now(),
          speed: BOMB_FALLING_SPEED * (0.8 + Math.random() * 0.4)
        }]);
      }
      lastBombTimeRef.current = timestamp;
    }

    // 更新炸彈位置和碰撞檢測
    setBombs(prev => {
      const updatedBombs = prev.map(bomb => ({
        ...bomb,
        y: bomb.y + (bomb.speed || BOMB_FALLING_SPEED)
      }));

      const remainingBombs = [];
      let scoreIncrement = 0;
      let healthDecrement = 0;

      updatedBombs.forEach(bomb => {
        const BASKET_TOP = 100 - BASKET_BOTTOM;
        const basketLeft = playerPosition - BASKET_WIDTH;
        const basketRight = playerPosition + BASKET_WIDTH;
        const basketTop = BASKET_TOP - BASKET_TOP_OFFSET;
        
        // 改進的碰撞檢測
        const inBasketHorizontally = bomb.x >= basketLeft && bomb.x <= basketRight;
        const inBasketVertically = bomb.y >= basketTop && bomb.y <= BASKET_TOP;
        const bombPastBasket = bomb.y > (BASKET_TOP );

        if (inBasketHorizontally && inBasketVertically) {
          scoreIncrement += 1;
          try {
            catchSound.currentTime = 0;
            catchSound.play().catch(error => {
              console.log("音效播放失敗:", error);
            });
          } catch (error) {
            console.log("音效播放失敗:", error);
          }
        } else if (bombPastBasket) {
          healthDecrement += 1;
          try {
            missSound.currentTime = 0;
            missSound.play().catch(console.error);
          } catch (error) {
            console.log("播放音效失敗:", error);
          }
        } else {
          remainingBombs.push(bomb);
        }
      });

      // 更新分數
      if (scoreIncrement > 0) {
        setScore(s => s + scoreIncrement);
      }

      // 更新生命值
      if (healthDecrement > 0) {
        setLives(lives => {
          const newLives = Math.max(0, lives - healthDecrement);
          if (newLives <= 0) {
            endGame();
          }
          return newLives;
        });
      }

      return remainingBombs;
    });

    // 持續遊戲循環
    if (gameState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [playerPosition, gameState, catchSound, missSound]);

  // 開始遊戲循環
  useEffect(() => {
    if (gameState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop, gameState]);

  // 監控生命值變化
  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      endGame();
    }
  }, [lives, gameState]);

  

  return (
    <div 
      ref={gameAreaRef}
      className="h-screen w-full relative overflow-hidden touch-none"
      style={{
        backgroundImage: 'url(/背景街道.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      {/* 遊戲信息顯示 */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between text-white bg-black bg-opacity-50 z-10">
        <div className="text-xl">生命值: {Array(lives).fill('❤️').join(' ')}</div>
        <div className="text-xl">得分: {score}</div>
        <div className="text-xl">時間: {time}秒</div>
      </div>

      {/* 炸彈 */}
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
            willChange: 'transform, top',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          }}
        />
      ))}

      {/* 籃子 */}
      <div
        className="absolute bottom-32 w-40 h-40 z-20"
        style={{ 
          left: `${playerPosition}%`, 
          transform: 'translateX(-50%)',
          backgroundImage: 'url(/籃子.png)',
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          willChange: 'transform, left',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
      />
      
      {/* 調試信息 - 取消註釋可以顯示碰撞區域 */}
      {/* {renderDebugInfo()} */}

      {/* 觸控區域 */}
      <div
        className="absolute bottom-0 left-0 right-0 h-full bg-transparent z-30"
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchMove}
      />

      {/* 開始畫面 */}
      {gameState === 'start' && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
          <div className="text-white text-center p-8 bg-gray-800 rounded-xl">
            <h2 className="text-3xl mb-4">接炸彈遊戲</h2>
            <p className="text-xl mb-4">左右滑動接住掉落的炸彈</p>
            <button
              className="mt-4 px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              onClick={startGame}
            >
              開始遊戲
            </button>
          </div>
        </div>
      )}

      {/* 結束畫面 */}
      {gameState === 'end' && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40">
          <div className="text-white text-center p-8 bg-gray-800 rounded-xl">
            <h2 className="text-3xl mb-4">遊戲結束!</h2>
            <p className="text-xl mb-2">最終得分: {score}</p>
            <button
              className="mt-4 px-6 py-3 bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors mr-4"
              onClick={restartGame}
            >
              再玩一次
            </button>
            <button
              className="mt-4 px-6 py-3 bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
              onClick={() => window.location.reload()}
            >
              重新整理
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;