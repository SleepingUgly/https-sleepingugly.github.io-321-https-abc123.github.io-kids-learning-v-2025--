const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const gameover = document.getElementById('gameover');
const finalEl = document.getElementById('final');
const restartBtn = document.getElementById('restart');
const muteBtn = document.getElementById('mute');
const top10List = document.getElementById('top10-list');

let score = 0;
let lives = 20;
let cat = { x: 150, y: canvas.height - 280, w: 120, h: 120, vy: 0, jumping: false };
let obstacles = [];
let candies = [];
let clouds = [];
let speed = 7;
let gameActive = true;
let muted = false;

// === 內嵌音效（base64）保證聽得到！===
// 把你原本的 sounds 區塊整個換成下面這段（其他程式碼不動！）
const sounds = {
    // 跳躍：清脆的「啾！」
    jump: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3'),
    
   // 吃東西：現在換成可愛的「動物吃草～嚼嚼嚼」（本地檔案，載入超快！）
    eat: new Audio('eat.mp3'),  // // 吃東西音效：動物吃草聲
// "Animals Eat At Grass" by crokomoko 
// https://freesound.org/s/833500/  Licensed under CC BY 4.0
    
    
    // 受傷：可愛的「嗚嗚～」
    hurt: new Audio('https://assets.mixkit.co/sfx/preview/mixkit-little-witch-fail-710.mp3'), // -.- odd
    
//Ocean_coast_02_092025_0659AM by YevgVerh 
// -- https://freesound.org/s/827528/ -- License: Creative Commons 0
bgm: new Audio('gameocean.mp3'),
   };

sounds.bgm.loop = true;
sounds.bgm.volume = 0.35;  // 音量剛好不會吵

// 解鎖播放（一定要加這段才會有聲音！）
const startBGM = () => {
    sounds.bgm.play();
    document.removeEventListener('click', startBGM);
    document.removeEventListener('keydown', startBGM);
};
document.addEventListener('click', startBGM, { once: true });
document.addEventListener('keydown', startBGM, { once: true });


// 靜音切換
muteBtn.onclick = () => {
    muted = !muted;
    muteBtn.textContent = muted ? '音量關閉' : '音量開啟';
    muteBtn.classList.toggle('muted');
    Object.values(sounds).forEach(s => s.muted = muted);
    if (!muted && gameActive) sounds.bgm.play();
};
function play(name) {
    if (!muted) {
        sounds[name].currentTime = 0;
        sounds[name].play();
    }
}

// 生命、排行榜
function updateLives() { livesEl.innerHTML = '❤️'.repeat(lives); }
updateLives();
function loadTop10() {
    const data = JSON.parse(localStorage.getItem('catTop10') || '[]');
    top10List.innerHTML = '';
    data.slice(0,10).forEach((s,i) => {
        const li = document.createElement('li');
        li.textContent = `${i+1}. ${s} 分`;
        li.style.color = i===0 ? '#f1c40f' : '#2c3e50';
        top10List.appendChild(li);
    });
}
loadTop10();

// 跳躍
function jump() {
    if (!cat.jumping && gameActive) {
        cat.vy = -23;
        cat.jumping = true;
        play('jump');
    }
}

// 雲朵（不再重疊）
function spawnCloud() {
    const newY = 80 + Math.random() * 150;
    const tooClose = clouds.some(c => Math.abs(c.y - newY) < 80);
    if (!tooClose) {
        clouds.push({ x: canvas.width, y: newY, size: 100 + Math.random()*80 });
    }
}

// 障礙物、糖果
function spawnObstacle() {
    if (!gameActive) return;
    const type = Math.random() < 0.5 ? 'rock' : 'cactus';
    obstacles.push({ x: canvas.width + 200, y: canvas.height - 300, w: type==='rock'?120:80, h:100, type });
}
function spawnCandy() {
    candies.push({
        x: canvas.width + 100,
        y: canvas.height - 400 - Math.random()*200,
        type: ['🐟','🍪','🍩','🍭','🍬','🧁','🍖','🍰'][Math.floor(Math.random()*8)]
    });
}

// 主繪製
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 雲朵（大又不重疊）
    clouds.forEach((c,i) => {
        c.x -= 0.8;
        ctx.globalAlpha = 0.75;
        ctx.font = '350px Arial';
        ctx.fillText('☁️', c.x, c.y);
        ctx.globalAlpha = 1;
        if (c.x < -250) clouds.splice(i,1);
    });

    // 地面
    ctx.fillStyle = '#bcb605ff';
    ctx.fillRect(0, canvas.height - 150, canvas.width, 150);

    // 貓咪
    ctx.font = '130px Arial';
    ctx.fillText('🐱', cat.x, cat.y + 100);

    // 重力
    if (cat.jumping) {
        cat.y += cat.vy;
        cat.vy += 0.9;
        if (cat.y >= canvas.height - 280) {
            cat.y = canvas.height - 280;
            cat.jumping = false;
            cat.vy = 0;
        }
    }

    // 障礙物
    obstacles = obstacles.filter(o => {
        o.x -= speed;
        ctx.font = o.type === 'rock' ? '120px Arial' : '140px Arial';
        ctx.fillText(o.type === 'rock' ? '🪨' : '🌵', o.x, canvas.height - 90);
        if (o.x < cat.x + 100 && o.x + o.w > cat.x + 30 && cat.y + 110 > canvas.height - 200) {
            lives--; play('hurt');
            updateLives();
            if (lives <= 0) gameOver();
            return false;
        }
        return o.x > -200;
    });

    // 糖果
    candies = candies.filter(c => {
        c.x -= speed;
        ctx.font = '80px Arial';
        ctx.fillText(c.type, c.x, c.y);
        if (cat.x + 100 > c.x && cat.x < c.x + 70 && cat.y + 120 > c.y && cat.y < c.y + 80) {
            score += 10; play('eat');
            scoreEl.textContent = score;
            return false;
        }
        return c.x > -100;
    });
}

// 遊戲結束
function gameOver() {
    gameActive = false;
    finalEl.textContent = score;
    gameover.style.display = 'block';
    const data = JSON.parse(localStorage.getItem('catTop10') || '[]');
    data.push(score);
    data.sort((a,b) => b-a);
    localStorage.setItem('catTop10', JSON.stringify(data.slice(0,10)));
    loadTop10();
}

// 重新開始
restartBtn.onclick = () => {
    lives = 20; score = 0; obstacles = []; candies = []; clouds = [];
    cat.y = canvas.height - 280; cat.jumping = false;
    updateLives(); scoreEl.textContent = '0';
    gameover.style.display = 'none'; gameActive = true;
    for(let i=0;i<6;i++) setTimeout(spawnCloud, i*800);
    if (!muted) sounds.bgm.play();
};

// 啟動
setInterval(() => { if(gameActive) spawnObstacle(); }, 2000);
setInterval(() => { if(gameActive) spawnCandy(); }, 2800);
setInterval(spawnCloud, 5000);
for(let i=0;i<6;i++) setTimeout(spawnCloud, i*800);

// 主迴圈
function loop() {
    if (gameActive) draw();
    requestAnimationFrame(loop);
}
loop();
if (!muted) sounds.bgm.play();

// 控制
// 把你原本 script.js 最下面的這段（從 // 控制 開始）全部換成下面這段

// === 關鍵修復：音效解鎖 + 永久有效播放 ===
let audioUnlocked = false;

// 解鎖音效（第一次點擊或按空白鍵才會觸發）
function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    sounds.bgm.play().catch(() => {});  // 解鎖後背景音樂開始播放
}

// 跳躍時自動解鎖音效
function jump() {
    if (!cat.jumping && gameActive) {
        cat.vy = -23;
        cat.jumping = true;
        unlockAudio();        // 第一次跳就解鎖所有音效
        play('jump');
    }
}

// 控制（點螢幕或按空白鍵都會解鎖音效）
document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', () => {
    unlockAudio();  // 點螢幕也會解鎖
    jump();
});

canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    unlockAudio();
    jump();
});

// 靜音按鈕（完全獨立，不影響跳躍）
muteBtn.onclick = (e) => {
    e.stopPropagation(); // 防止點到 canvas 觸發跳躍
    muted = !muted;
    muteBtn.textContent = muted ? '靜音' : '音量開啟';
    muteBtn.classList.toggle('muted');
    
    if (muted) {
        sounds.bgm.pause();
    } else if (audioUnlocked) {
        sounds.bgm.play().catch(() => {});
    }
};

// 視窗大小改變時重新定位貓咪
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cat.y = canvas.height - 280;
});