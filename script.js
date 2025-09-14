// Biến toàn cục
let coins = 1000;
let selectedHorse = null;
let betAmount = 100;
let isRacing = false;
let raceInterval;
let isDarkMode = false;
let horses = [
    { id: 1, name: "Thunder Bolt", position: 0, speed: 0, element: null },
    { id: 2, name: "Wild Spirit", position: 0, speed: 0, element: null },
    { id: 3, name: "Shadow Runner", position: 0, speed: 0, element: null },
    { id: 4, name: "Golden Hoof", position: 0, speed: 0, element: null },
    { id: 5, name: "Silver Streak", position: 0, speed: 0, element: null },
    { id: 6, name: "Midnight Star", position: 0, speed: 0, element: null }
];

// Biến cho nhiệm vụ
let missions = {
    login: { completed: false, claimed: false, reward: 100 },
    bet: { count: 0, target: 3, completed: false, claimed: false, reward: 200 },
    win: { count: 0, target: 1, completed: false, claimed: false, reward: 300 }
};

// Lưu trữ dữ liệu người chơi
function saveGameData() {
    const gameData = {
        coins,
        missions,
        lastLogin: new Date().toDateString(),
        isDarkMode
    };
    localStorage.setItem('horseRaceGame', JSON.stringify(gameData));
}

// Tải dữ liệu người chơi
function loadGameData() {
    const savedData = localStorage.getItem('horseRaceGame');
    if (savedData) {
        const gameData = JSON.parse(savedData);
        coins = gameData.coins;
        missions = gameData.missions;
        
        // Kiểm tra đăng nhập hàng ngày
        const today = new Date().toDateString();
        if (gameData.lastLogin !== today) {
            // Reset nhiệm vụ hàng ngày
            missions.login.completed = true;
            missions.login.claimed = false;
            missions.bet.count = 0;
            missions.bet.completed = false;
            missions.bet.claimed = false;
            missions.win.count = 0;
            missions.win.completed = false;
            missions.win.claimed = false;
            
            // Cập nhật ngày đăng nhập
            saveGameData();
        }
        
        // Tải chế độ sáng tối
        if (gameData.isDarkMode !== undefined) {
            isDarkMode = gameData.isDarkMode;
            updateThemeDisplay();
        }
    }
    updateCoinsDisplay();
    updateMissionsDisplay();
}

// Cập nhật hiển thị coin
function updateCoinsDisplay() {
    document.getElementById('coin-amount').textContent = coins;
}

// Cập nhật hiển thị nhiệm vụ
function updateMissionsDisplay() {
    // Nhiệm vụ đăng nhập
    const loginButton = document.querySelector('[data-mission="login"]');
    loginButton.disabled = missions.login.claimed || !missions.login.completed;
    
    // Nhiệm vụ đặt cược
    const betMission = document.getElementById('mission-bet');
    betMission.querySelector('.mission-progress').textContent = `${missions.bet.count}/${missions.bet.target}`;
    const betButton = document.querySelector('[data-mission="bet"]');
    betButton.disabled = missions.bet.claimed || !missions.bet.completed;
    
    // Nhiệm vụ thắng
    const winMission = document.getElementById('mission-win');
    winMission.querySelector('.mission-progress').textContent = `${missions.win.count}/${missions.win.target}`;
    const winButton = document.querySelector('[data-mission="win"]');
    winButton.disabled = missions.win.claimed || !missions.win.completed;
    
    // Cập nhật trạng thái hoàn thành
    if (missions.bet.count >= missions.bet.target) {
        missions.bet.completed = true;
        betButton.disabled = missions.bet.claimed;
    }
    
    if (missions.win.count >= missions.win.target) {
        missions.win.completed = true;
        winButton.disabled = missions.win.claimed;
    }
}

// Hiển thị thông báo
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    if (isError) {
        notification.classList.add('error');
    } else {
        notification.classList.remove('error');
    }
    
    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Khởi tạo các phần tử
function initElements() {
    // Lấy tham chiếu đến các phần tử ngựa
    horses.forEach(horse => {
        horse.element = document.getElementById(`horse-${horse.id}`);
        // Đặt ảnh avatar cho ngựa khi khởi tạo
        if (horse.element) {
            horse.element.style.backgroundImage = "url('https://github.com/Hungvip69/Horse-race-web/blob/main/frame_3_delay-0.1s.gif')";
        }
    });
    
    // Thiết lập sự kiện cho các nút đặt cược
    const betButtons = document.querySelectorAll('.bet-button');
    betButtons.forEach(button => {
        button.addEventListener('click', () => {
            const horseId = parseInt(button.getAttribute('data-horse'));
            selectHorse(horseId);
        });
    });
    
    // Thiết lập sự kiện cho các tùy chọn ngựa
    const horseOptions = document.querySelectorAll('.horse-option');
    horseOptions.forEach(option => {
        option.addEventListener('click', () => {
            const horseId = parseInt(option.getAttribute('data-horse'));
            selectHorse(horseId);
        });
    });
    
    // Thiết lập sự kiện cho input số tiền cược
    const betAmountInput = document.getElementById('bet-amount');
    betAmountInput.addEventListener('change', () => {
        betAmount = parseInt(betAmountInput.value);
        if (betAmount < 10) {
            betAmount = 10;
            betAmountInput.value = 10;
        } else if (betAmount > coins) {
            betAmount = coins;
            betAmountInput.value = coins;
        }
    });
    
    // Thiết lập sự kiện cho nút bắt đầu đua
    const startRaceButton = document.getElementById('start-race');
    startRaceButton.addEventListener('click', startRace);
    
    // Thiết lập sự kiện cho nút chơi lại
    const playAgainButton = document.getElementById('play-again');
    playAgainButton.addEventListener('click', resetRace);
    
    // Thiết lập sự kiện cho các nút nhận thưởng nhiệm vụ
    const claimButtons = document.querySelectorAll('.claim-button');
    claimButtons.forEach(button => {
        button.addEventListener('click', () => {
            const missionType = button.getAttribute('data-mission');
            claimMissionReward(missionType);
        });
    });
}

// Chọn ngựa để đặt cược
function selectHorse(horseId) {
    // Bỏ chọn tất cả các ngựa
    const horseOptions = document.querySelectorAll('.horse-option');
    horseOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Chọn ngựa mới
    const selectedOption = document.querySelector(`.horse-option[data-horse="${horseId}"]`);
    selectedOption.classList.add('selected');
    
    // Cập nhật ngựa đã chọn
    selectedHorse = horses.find(horse => horse.id === horseId);
    document.getElementById('selected-horse-name').textContent = selectedHorse.name;
}

// Bắt đầu cuộc đua
function startRace() {
    if (isRacing) return;
    
    // Kiểm tra xem đã chọn ngựa chưa
    if (!selectedHorse) {
        showNotification('Vui lòng chọn một chú ngựa để đặt cược!', true);
        return;
    }
    
    // Kiểm tra số tiền cược
    if (betAmount <= 0 || betAmount > coins) {
        showNotification('Số coin cược không hợp lệ!', true);
        return;
    }
    
    // Trừ tiền cược
    coins -= betAmount;
    updateCoinsDisplay();
    
    // Cập nhật nhiệm vụ đặt cược
    missions.bet.count++;
    updateMissionsDisplay();
    saveGameData();
    
    // Ẩn nút bắt đầu, hiển thị kết quả
    document.getElementById('start-race').classList.add('hidden');
    document.getElementById('race-result').classList.add('hidden');
    
    // Reset vị trí các ngựa và thay đổi ảnh sang ảnh chạy
horses.forEach(horse => {
    horse.position = 0;
    horse.speed = 0;
    if (horse.element) {
        horse.element.style.left = '0px';
        horse.element.classList.add('racing');
        // Thay đổi ảnh sang ảnh chạy
        horse.element.style.backgroundImage = "url('https://github.com/Hungvip69/Horse-race-web/blob/main/ezgif-222680507098f8.gif')";
    }
});
    
    // Bắt đầu đua
    isRacing = true;
    raceInterval = setInterval(updateRace, 50);
}

// Cập nhật vị trí các ngựa trong cuộc đua
function updateRace() {
    const trackWidth = document.querySelector('.race-track').offsetWidth;
    const finishLine = trackWidth - 100; // Vị trí vạch đích (trừ đi chiều rộng của ngựa)
    let someoneFinished = false;
    
    // Di chuyển từng con ngựa
    horses.forEach(horse => {
        if (horse.position < finishLine) {
            // Tạo tốc độ ngẫu nhiên cho mỗi ngựa - tăng tốc độ
            horse.speed = Math.random() * 8 + 2; // Tăng từ 5+1 lên 8+2
            horse.position += horse.speed;
            
            // Cập nhật vị trí trên giao diện
            if (horse.element) {
                horse.element.style.left = `${horse.position}px`;
            }
        } else if (!someoneFinished) {
            // Ngựa đầu tiên về đích
            someoneFinished = true;
            endRace(horse);
        }
    });
}

// Kết thúc cuộc đua
function endRace(winnerHorse) {
    clearInterval(raceInterval);
    isRacing = false;
    
    // Dừng hiệu ứng chạy và đổi lại ảnh avatar
    horses.forEach(horse => {
        if (horse.element) {
            horse.element.classList.remove('racing');
            // Đổi lại ảnh avatar
            horse.element.style.backgroundImage = "url('https://s3.ezgif.com/tmp/ezgif-35b9a4df106763-gif-im/frame_2_delay-0.1s.gif')";
        }
    });
    
    // Thêm hiệu ứng chiến thắng cho ngựa thắng cuộc
    winnerHorse.element.classList.add('winner');
    
    // Hiển thị kết quả
    const raceResult = document.getElementById('race-result');
    const winnerAnnouncement = document.getElementById('winner-announcement');
    const betResult = document.getElementById('bet-result');
    
    winnerAnnouncement.textContent = `${winnerHorse.name} đã chiến thắng!`;
    
    // Kiểm tra kết quả cược
    if (selectedHorse && selectedHorse.id === winnerHorse.id) {
        // Người chơi thắng
        const winAmount = betAmount * 2;
        coins += winAmount;
        betResult.textContent = `Bạn đã thắng ${winAmount} coin!`;
        showNotification(`Chúc mừng! Bạn đã thắng ${winAmount} coin!`);
        
        // Cập nhật nhiệm vụ thắng cuộc
        missions.win.count++;
    } else {
        // Người chơi thua
        betResult.textContent = `Bạn đã thua ${betAmount} coin!`;
        showNotification(`Tiếc quá! Bạn đã thua ${betAmount} coin!`, true);
    }
    
    // Cập nhật hiển thị
    updateCoinsDisplay();
    updateMissionsDisplay();
    saveGameData();
    
    // Hiển thị kết quả và nút chơi lại
    raceResult.classList.remove('hidden');
    document.getElementById('play-again').classList.remove('hidden');
}

// Reset cuộc đua để chơi lại
function resetRace() {
    // Ẩn kết quả, hiển thị nút bắt đầu
    document.getElementById('race-result').classList.add('hidden');
    document.getElementById('play-again').classList.add('hidden');
    document.getElementById('start-race').classList.remove('hidden');
    
    // Reset vị trí các ngựa
    horses.forEach(horse => {
        horse.position = 0;
        if (horse.element) {
            horse.element.style.left = '0px';
            horse.element.classList.remove('winner');
            // Đảm bảo ngựa sử dụng ảnh avatar khi chưa chạy
            horse.element.style.backgroundImage = "url('https://github.com/Hungvip69/Horse-race-web/blob/main/frame_3_delay-0.1s.gif')";
        }
    });
    
    // Reset biến trạng thái
    isRacing = false;
}

// Nhận thưởng nhiệm vụ
function claimMissionReward(missionType) {
    const mission = missions[missionType];
    
    if (!mission || mission.claimed || !mission.completed) {
        return;
    }
    
    // Cộng coin thưởng
    coins += mission.reward;
    mission.claimed = true;
    
    // Cập nhật hiển thị
    updateCoinsDisplay();
    updateMissionsDisplay();
    saveGameData();
    
    // Hiển thị thông báo
    showNotification(`Đã nhận ${mission.reward} coin từ nhiệm vụ!`);
}

// Chuyển đổi chế độ sáng tối
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    updateThemeDisplay();
    saveGameData();
}

// Cập nhật hiển thị chế độ sáng tối
function updateThemeDisplay() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-toggle-icon i');
    const themeText = themeToggle.querySelector('.theme-toggle-text');
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-moon';
        themeText.textContent = 'Chế độ tối';
    } else {
        body.classList.remove('dark-mode');
        themeIcon.className = 'fas fa-sun';
        themeText.textContent = 'Chế độ sáng';
    }
}

// Khởi tạo trò chơi
function initGame() {
    loadGameData();
    initElements();
    // Thêm sự kiện cho nút chuyển đổi chế độ sáng tối
    document.getElementById('theme-toggle').addEventListener('click', toggleDarkMode);
}

// Khởi chạy khi trang đã tải xong
document.addEventListener('DOMContentLoaded', initGame);
