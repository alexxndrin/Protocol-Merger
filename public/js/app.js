// 3D Scroll

let zSpacing = -1000,
		lastPos = zSpacing / 5,
		$frames = document.getElementsByClassName('frame'),
		frames = Array.from($frames),
		zVals = frames.map((_, i) => (i * zSpacing) + zSpacing)

// Это увеличивает общую высоту прокрутки, позволяя последнему фрейму подойти ОЧЕНЬ близко.
const calcHeight = (frames.length * Math.abs(zSpacing)) / 5.0;
document.body.style.height = `${calcHeight}px`;

window.onscroll = function() {

	let top = document.documentElement.scrollTop,
			delta = lastPos - top

	lastPos = top

	frames.forEach(function(n, i) {
		zVals[i] += delta * -5.0
		
		let frame = frames[i],
				transform = `translateZ(${zVals[i]}px)`,
				opacity,
				pointerEvents,
				zIndex;
		
		// ИСКЛЮЧЕНИЕ ДЛЯ ПОСЛЕДНЕГО КАДРА С КНОПКОЙ
		if (i === frames.length - 1) {
			opacity = zVals[i] < 800 ? 1 : 0; 
			
			// Включаем клики, когда фрейм подошел на расстояние вытянутой руки
			if (zVals[i] > -300) {
				pointerEvents = 'auto';
				zIndex = '999';
			} else {
				pointerEvents = 'none';
				zIndex = '1';
			}
		} else {
			// Обычная логика для остальных слайдов
			opacity = zVals[i] < Math.abs(zSpacing) / 1.8 ? 1 : 0;
			pointerEvents = 'none'; 
			zIndex = '1';
		}
				
		frame.setAttribute('style', `transform: ${transform}; opacity: ${opacity}; pointer-events: ${pointerEvents}; z-index: ${zIndex};`)
	})

}

window.scrollTo(0, 1)

// Audio
let soundButton = document.querySelector('.soundbutton'),
		audio = document.querySelector('.audio')

if (soundButton && audio) {
	soundButton.addEventListener('click', e => {
		soundButton.classList.toggle('paused')
		audio.paused ? audio.play() : audio.pause()
	})

	window.onfocus = function() {
		soundButton.classList.contains('paused') ? audio.pause() : audio.play()
	}

	window.onblur = function() {
		audio.pause()
	}
}
// Обработка клика по кнопке Start
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('.btn-game-start');
    if (startButton) {
        startButton.addEventListener('click', () => {
            // Создаем аудио-эффект клика (звук переключения)
            const clickSound = new Audio('media/switch.mp3'); 
            clickSound.volume = 0.5;
            clickSound.play();

            document.body.style.transition = 'filter 0.5s ease, opacity 0.5s ease';
            document.body.style.filter = 'brightness(5)';
            document.body.style.opacity = '0';

            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        });
    }
});
