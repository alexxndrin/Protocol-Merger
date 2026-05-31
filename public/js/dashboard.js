document.addEventListener('DOMContentLoaded', () => {
    // 1. Плавное проявление экрана при загрузке
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);

    // 2. Автоматическое продолжение музыки
    const audio = document.getElementById('bg-audio');
    
    const startAudio = () => {
        if (audio) {
            audio.volume = 0.4;
            audio.play().catch(err => {
                console.log("Ожидание взаимодействия для запуска музыки...");
            });
        }
    };

    startAudio();
    document.body.addEventListener('mousemove', startAudio, { once: true });

    // 3. Эффект появления строк логов по очереди
    const logLines = document.querySelectorAll('.log-line');
    logLines.forEach((line, index) => {
        line.style.opacity = '0';
        line.style.transform = 'translateX(-10px)';
        line.style.transition = 'all 0.5s ease';
        
        setTimeout(() => {
            line.style.opacity = '1';
            line.style.transform = 'translateX(0)';
        }, 600 * (index + 1));
    });

    const connectBtn = document.querySelector('.btn-connect');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => {
            // Звук подтверждения клика
            const confirmSound = new Audio('media/switch.mp3'); 
            confirmSound.volume = 0.5;
            confirmSound.play().catch(e => console.log("Звук клика заблокирован"));

            // Фоновое аудио тоже подстрахуем на случай остановки
            if (audio) audio.play().catch(() => {});

            // Скрываем основной контейнер терминала, чтобы показать экран загрузки
            const container = document.querySelector('.terminal-container');
            if (container) {
                container.style.transition = 'opacity 0.4s ease';
                container.style.opacity = '0';
            }

            // Запускаем процесс 5-секундной загрузки
            runTerminalLoader();
        });
    }
});

// Вынесено в отдельную чистую функцию управления загрузкой
function runTerminalLoader() {
    const loader = document.getElementById('loader-screen');
    const progressText = document.getElementById('loader-progress');
    
    if (!loader || !progressText) return;

    // Показываем оверлей загрузки
    loader.style.display = 'flex';
    loader.style.opacity = '1';

    let progress = 0;
    const totalDuration = 5000; 
    const tickRate = 50; // Каждые 50 мс обновляем проценты
    const totalSteps = totalDuration / tickRate;
    const stepIncrement = 100 / totalSteps;

    const interval = setInterval(() => {
        // Равномерный шаг для точности времени
        progress += stepIncrement;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            setTimeout(() => {
                window.location.href = 'shift1.html';
            }, 200);
        }
        
        progressText.innerText = `${Math.floor(progress)}%`;
    }, tickRate);
}
