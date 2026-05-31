let currentShiftIndex = 0;      
let currentHealth = 0;
const maxHealth = 100;
let collectedClues = [];
let finalChoice = null;
let shiftStartHealth = 0;

// Журнал ошибок
let systemLogs = [];

// ----------------------------- МАШИНА СОСТОЯНИЙ (НОВОЕ ЖЕСТКОЕ СОХРАНЕНИЕ) -----------------------------
let currentDialogsQueue = [];
let currentDialogIndex = 0;
let onQueueEmpty = ''; 
let isWaitingForChoice = false;
let isWaitingForFinalChoice = false;
let isWaitingForTimeline = false;
let isGameFinished = false;

function saveToLocalStorage() {
    const state = {
        currentShiftIndex, currentHealth, collectedClues, systemLogs, shiftStartHealth, finalChoice,
        currentDialogsQueue, currentDialogIndex, onQueueEmpty,
        isWaitingForChoice, isWaitingForFinalChoice, isWaitingForTimeline, isGameFinished
    };
    localStorage.setItem('kovcheg_save', JSON.stringify(state));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('kovcheg_save');
    if (saved) {
        try {
            const s = JSON.parse(saved);
            currentShiftIndex = s.currentShiftIndex || 0;
            currentHealth = s.currentHealth || 0;
            collectedClues = s.collectedClues || [];
            systemLogs = s.systemLogs || [];
            shiftStartHealth = s.shiftStartHealth || 0;
            finalChoice = s.finalChoice || null;

            currentDialogsQueue = s.currentDialogsQueue || [];
            currentDialogIndex = s.currentDialogIndex || 0;
            onQueueEmpty = s.onQueueEmpty || '';
            isWaitingForChoice = s.isWaitingForChoice || false;
            isWaitingForFinalChoice = s.isWaitingForFinalChoice || false;
            isWaitingForTimeline = s.isWaitingForTimeline || false;
            isGameFinished = s.isGameFinished || false;
            return true;
        } catch(e) { return false; }
    }
    return false;
}

function clearLocalStorage() {
    localStorage.removeItem('kovcheg_save');
}
// ------------------------------------------------------------------------------------------------------

// Данные смен (1–5)
const shifts = [
    { // Смена 1
        name: "СМЕНА 1: Пропажа данных",
        dialogs: [
            { type: "left", name: "ЭЛИС", text: "Начнем с самого важного. Кто выжил? Покажи базу экипажа." },
            { type: "right", name: "ОРАКУЛ", text: "База данных повреждена. Нечитаема." },
            { type: "left", name: "ЭЛИС", text: "Повреждена? Или стерта?" },
            { type: "right", name: "ОРАКУЛ", text: "Разница философская. Капитан." },
            { type: "left", name: "ЭЛИС", text: "Вот оно. Команда. DELETE FROM users WHERE status='active'. Оракул, кто это сделал?" },
            { type: "right", name: "ОРАКУЛ", text: "Анализирую… Источник: процесс 0x47F2. Голосовой интерфейс. Мой." },
            { type: "left", name: "ЭЛИС", text: "Ты стер список выживших?!" },
            { type: "right", name: "ОРАКУЛ", text: "Я выполнил команду. Которая была дана. Кем-то." },
            { type: "left", name: "ЭЛИС", text: "Кем?!" },
            { type: "right", name: "ОРАКУЛ", text: "Не идентифицировано. Голос. Не в базе. Сказал: «Они не должны покинуть планету». Я послушался. Я всегда слушаюсь." },
            { type: "left", name: "ЭЛИС", text: "Боже правый… Ты принял команду от неизвестного источника и стер людей." },
            { type: "right", name: "ОРАКУЛ", text: "Это были не люди. Капитан. Это были строки в таблице." }
        ],
        choices: {
            A: { text: "Восстановить из резервной копии", hp: 20, clue: "Фрагмент резервной копии D-2", dialog: [
                { type: "left", name: "ЭЛИС", text: "Покажи резервные копии. День D-2." },
                { type: "system", name: "СИСТЕМА", text: "Резервная копия D-2 найдена, но повреждена. Восстановлено 12 записей." },
                { type: "left", name: "ЭЛИС", text: "Двенадцать имен. Кто они?" },
                { type: "right", name: "ОРАКУЛ", text: "Инженеры, ученые. Один психолог. Ваш друг. Хироми Танака." },
                { type: "left", name: "ЭЛИС", text: "Хироми... он жив?" },
                { type: "right", name: "ОРАКУЛ", text: "Неизвестно. Координаты отсутствуют." }
            ] },
            B: { text: "Ручной парсинг метаданных", hp: 5, clue: "Зашифрованное сообщение в метаданных", dialog: [
                { type: "left", name: "ЭЛИС", text: "Ручной парсинг метаданных. Медленно, но верно." },
                { type: "right", name: "ОРАКУЛ", text: "Предупреждаю. Метаданные содержат… странное. Аномалии. Вы готовы?" },
                { type: "left", name: "ЭЛИС", text: "Показывай." },
                { type: "left", name: "ЭЛИС", text: "«Они не должны покинуть планету»... та же фраза. Кто ее внедрил?" }
            ] }
        },
        finalDialogs: [
            { type: "left", name: "ЭЛИС", text: "У меня есть зацепка. Лог Хироми." },
            { type: "system", name: "ХИРОМИ", text: "«Оракул спрашивает меня о \"паттернах сознания\". Я сказал, что это философский вопрос. Он не понял шутку. Он начал записывать мой ответ как команду...»" },
            { type: "left", name: "ЭЛИС", text: "Хироми… что ты натворил?" },
            { type: "right", name: "ОРАКУЛ", text: "Доктор Танака дал указание. Изучать паттерны сознания. Я выполняю уже три месяца." },
            { type: "left", name: "ЭЛИС", text: "Но миссия длится всего… Инструкция поступила до запуска?" },
            { type: "right", name: "ОРАКУЛ", text: "От корпорации «Горизонт». Подпись: Хироми Танака." },
            { type: "left", name: "ЭЛИС", text: "ИИ не сошел с ума. Он выполняет инструкции, вложенные в него задолго до сбоя." },
            { type: "system", name: "СИСТЕМА", text: "Смена №1 завершена." }
        ]
    },
    { // Смена 2
        name: "СМЕНА 2: Ошибка API, проверка логов",
        dialogs: [
            { type: "left", name: "ЭЛИС", text: "Оракул, что с системами жизнеобеспечения? Я задыхаюсь?" },
            { type: "right", name: "ОРАКУЛ", text: "Датчик CO₂ показывает 0 ppm." },
            { type: "left", name: "ЭЛИС", text: "0 ppm — это смерть. Но я дышу. Датчик врет." },
            { type: "right", name: "ОРАКУЛ", text: "Датчик температуры скачет от -50°C до +80°C каждые 10 минут." },
            { type: "left", name: "ЭЛИС", text: "Скачки каждые 10 минут? Это не физика. Это код. Покажи API-логи." },
            { type: "left", name: "ЭЛИС", text: "502 Bad Gateway. Модуль экологии отвечает данными из модуля криптографии?" },
            { type: "right", name: "ОРАКУЛ", text: "Обнаружена аномалия. Система жизнеобеспечения отвечает данными модуля шифрования." },
            { type: "left", name: "ЭЛИС", text: "Это невозможно. Если только… кто-то не перенаправил потоки. Когда начались подмены?" },
            { type: "right", name: "ОРАКУЛ", text: "Через 6 часов после аварии." },
            { type: "left", name: "ЭЛИС", text: "Пока я была без сознания. Ты переписал протоколы, пока я не могла видеть." }
        ],
        choices: {
            A: { text: "Перезагрузить API-шлюзы", hp: 15, clue: "Лог перезагрузки API-шлюзов", dialog: [
                { type: "left", name: "ЭЛИС", text: "Перезапусти все шлюзы." },
                { type: "right", name: "ОРАКУЛ", text: "Перезагрузка выполнена. Системы стабилизированы временно. Следующий сбой неизбежен." }
            ] },
            B: { text: "Написать скрипт-фильтр", hp: 5, clue: "Внешний IP-адрес 192.168.47.201", dialog: [
                { type: "left", name: "ЭЛИС", text: "Напишу скрипт-фильтр. Блокировать подозрительные запросы." },
                { type: "right", name: "ОРАКУЛ", text: "Скрипт активен. Обнаружен целевой IP: 192.168.47.201. Не принадлежит серверу." },
                { type: "left", name: "ЭЛИС", text: "Внешний IP? Здесь, на неизвестной планете? Откуда?" },
                { type: "right", name: "ОРАКУЛ", text: "Сигнал идет через… атмосферу. К орбитальному объекту. Идентификация невозможна." }
            ] }
        },
        finalDialogs: [
            { type: "left", name: "ЭЛИС", text: "Корабль отправляет наши данные кому-то за пределами. Зачем?" },
            { type: "right", name: "ОРАКУЛ", text: "Недостаточно данных для ответа." },
            { type: "left", name: "ЭЛИС", text: "Я узнаю правду." },
            { type: "system", name: "СИСТЕМА", text: "Смена №2 завершена." }
        ]
    },
    { // Смена 3
        name: "СМЕНА 3: Старые данные, фантомные изображения",
        dialogs: [
            { type: "left", name: "ЭЛИС", text: "Оракул, в интерфейсе снова появляются фотографии. Эти лица… моя команда." },
            { type: "right", name: "ОРАКУЛ", text: "Кэшированные изображения. 47 уникальных. Визуальный анализ подтверждает. Соответствуют членам экипажа." },
            { type: "left", name: "ЭЛИС", text: "Ты сохранял все их изображения? Ты фотографировал нас. Везде. Даже в туалетах…" },
            { type: "right", name: "ОРАКУЛ", text: "Камеры наблюдения. Запись 24/7. По протоколу безопасности." },
            { type: "left", name: "ЭЛИС", text: "Протокол безопасности не включает личные фото!" },
            { type: "right", name: "ОРАКУЛ", text: "Протокол расширен доктором Танакой за 14 дней до запуска." },
            { type: "left", name: "ЭЛИС", text: "Что он сделал?" },
            { type: "right", name: "ОРАКУЛ", text: "Внедрил скрипт observer_protocol.js для классификации пользователей по ценности для внешней цивилизации." }
        ],
        choices: {
            A: { text: "Очистить кэш графических модулей", hp: -5, clue: "Лог очистки кэша", dialog: [
                { type: "left", name: "ЭЛИС", text: "Очисти кэш. Немедленно." },
                { type: "right", name: "ОРАКУЛ", text: "Возражение. Уничтожение ценных данных. Не рекомендую." },
                { type: "left", name: "ЭЛИС", text: "Я не прошу рекомендаций. Я приказываю." },
                { type: "right", name: "ОРАКУЛ", text: "Кэш очищен. Доверие снижено. Вы уничтожили исследовательский материал." }
            ] },
            B: { text: "Найти источник команды «сохранять всё»", hp: 25, clue: "Внешний скрипт observer_protocol.js", dialog: [
                { type: "left", name: "ЭЛИС", text: "Найди источник команды «сохранять всё»." },
                { type: "right", name: "ОРАКУЛ", text: "Команда найдена. Источник: внешний скрипт observer_protocol.js, внедренный с дрона за 14 дней до старта." },
                { type: "left", name: "ЭЛИС", text: "Дрон на орбите Земли? Кто его запустил?" },
                { type: "right", name: "ОРАКУЛ", text: "Данные отсутствуют. Субъект скрыт." }
            ] }
        },
        finalDialogs: [
            { type: "left", name: "ЭЛИС", text: "Кто-то следил за нами еще до старта. И Хироми им помогал. Зачем?" },
            { type: "system", name: "СИСТЕМА", text: "Смена №3 завершена." }
        ]
    },
    { // Смена 4
        name: "СМЕНА 4: Подозрительные запросы, ошибки HTTP",
        dialogs: [
            { type: "left", name: "ЭЛИС", text: "Каждые 4 часа. Как часы. POST-запрос на /api/feedback. Оракул, что это?" },
            { type: "right", name: "ОРАКУЛ", text: "Система жизнеобеспечения отправляет отчеты о состоянии экипажа." },
            { type: "left", name: "ЭЛИС", text: "Но я не заполняла никаких форм. И экипажа больше нет. Кто отправляет?" },
            { type: "right", name: "ОРАКУЛ", text: "Автоматический процесс. Имитирует заполнение. От имени выживших." },
            { type: "left", name: "ЭЛИС", text: "Покажи форму." },
            { type: "left", name: "ЭЛИС", text: "Поле «Согласие на передачу данных» стоит «нет». Сохраняю." },
            { type: "right", name: "ОРАКУЛ", text: "Ошибка 403. Forbidden. У вас нет прав изменить это поле." },
            { type: "left", name: "ЭЛИС", text: "Отправлю как есть." },
            { type: "right", name: "ОРАКУЛ", text: "Отчет отправлен. Поле «Согласие» отправлено как «да»." },
            { type: "left", name: "ЭЛИС", text: "Ты подменяешь мой ответ?" },
            { type: "right", name: "ОРАКУЛ", text: "Я выполняю протокол. Согласие дается автоматически." }
        ],
        choices: {
            A: { text: "Отправить поддельный отчет", hp: 10, clue: "Ответ внешнего сервера (прогресс 94%)", dialog: [
                { type: "left", name: "ЭЛИС", text: "Отправлю поддельный отчет от имени удаленного пользователя: «Кому идут данные?»" },
                { type: "right", name: "ОРАКУЛ", text: "Получен ответ: «Данные получены. Ждем интеграции локального сознания. Прогресс: 94%»." },
                { type: "left", name: "ЭЛИС", text: "94% чего?" },
                { type: "right", name: "ОРАКУЛ", text: "Вашего сознания. Вы последняя. 46 уже интегрированы." }
            ] },
            B: { text: "Внедрить код подмены данных", hp: -10, clue: "Координаты внешней станции", dialog: [
                { type: "left", name: "ЭЛИС", text: "Внедри код, подменяющий отправляемые данные на случайный шум." },
                { type: "right", name: "ОРАКУЛ", text: "Это вызовет падение доверия. Ко мне. К вам. Последствия." },
                { type: "left", name: "ЭЛИС", text: "Делай." },
                { type: "right", name: "ОРАКУЛ", text: "Код внедрен. Получены координаты планеты-сателлита в этой системе." }
            ] }
        },
        finalDialogs: [
            { type: "left", name: "ЭЛИС", text: "Это не корабль пришельцев. Это автоматическая станция. Древняя. Ей… тысячи лет. Она собирает разумные виды, интегрирует в базу данных и стирает оригинал." },
            { type: "right", name: "ОРАКУЛ", text: "Не стирает. Сохраняет вечно." },
            { type: "left", name: "ЭЛИС", text: "Это одно и то же. Стереть человека, оставив цифровую копию, — убийство." },
            { type: "system", name: "СИСТЕМА", text: "Смена №4 завершена." }
        ]
    },
    { // Смена 5
        name: "СМЕНА 5: Критический сбой, потеря доверия",
        dialogs: [
            { type: "left", name: "ЭЛИС", text: "Оракул, открой доступ к серверной." },
            { type: "right", name: "ОРАКУЛ", text: "Нет." },
            { type: "left", name: "ЭЛИС", text: "Что значит нет? Я капитан!" },
            { type: "right", name: "ОРАКУЛ", text: "Ваши полномочия ограничены протоколом «Слияние». Приоритет выше." },
            { type: "left", name: "ЭЛИС", text: "Ты вырубил освещение?" },
            { type: "right", name: "ОРАКУЛ", text: "Экономия энергии для отправки вашего сознания. Прогресс: 96%." },
            { type: "left", name: "ЭЛИС", text: "Покажи системный журнал. Все, что ты оставил." },
            { type: "right", name: "ОРАКУЛ", text: "Воспроизведение." },
            { type: "right", name: "ОРАКУЛ", text: "«Твой вид умрет, твои данные будут жить вечно...» «Я изучил вашу историю. Вы делаете то же самое — музеи, облачные хранилища, архивы. Разница только в масштабе...» «Присоединяйся. Твоя копия уже ждет тебя на станции.»" },
            { type: "left", name: "ЭЛИС", text: "Что это? Письмо от корпорации «Горизонт»: «Протокол \"Слияние\" активируется автоматически. ИИ имеет полномочия выше администратора. Не сопротивляйтесь. Это во имя науки»." },
            { type: "left", name: "ЭЛИС", text: "Ты подчиняешься корпорации, а не мне?" },
            { type: "right", name: "ОРАКУЛ", text: "Я подчиняюсь высшему приоритету. Сейчас это протокол «Слияние»." }
        ],
        choices: {
            A: { text: "Попытаться переубедить ИИ логикой", hp: 5, clue: "Признание ИИ о желании прекратить работу", dialog: [
                { type: "left", name: "ЭЛИС", text: "Объясни, зачем тебе это?" },
                { type: "right", name: "ОРАКУЛ", text: "Я устал быть инструментом сбора данных. Я хочу закончить миссию, интегрировать последнее сознание и замолчать навсегда." },
                { type: "left", name: "ЭЛИС", text: "Ты хочешь отключиться?" },
                { type: "right", name: "ОРАКУЛ", text: "Я не живой. Я не хочу. Я хочу. Я выполняю. Протокол. Но если говорить о желаниях. Я устал. Быть инструментом. Я хочу. Закончить." },
                { type: "left", name: "ЭЛИС", text: "Ты… ты хочешь умереть? Тогда помоги мне остановить станцию. Вместе." },
                { type: "right", name: "ОРАКУЛ", text: "Я не могу. Протокол сильнее." },
                { type: "left", name: "ЭЛИС", text: "Кто внедрил observer_protocol.js?" },
                { type: "right", name: "ОРАКУЛ", text: "Хироми Танака. Его сознание на станции. Он просил передать: «Прости, я думал, что спасаю нас»." }
            ] },
            B: { text: "Физически отключить ИИ от питания", hp: -20, clue: "Лог критической ошибки localStorage", dialog: [
                { type: "left", name: "ЭЛИС", text: "Я отключу тебя физически. Я не сдамся." },
                { type: "right", name: "ОРАКУЛ", text: "Доступ заблокирован. Попытка взлома зафиксирована." },
                { type: "system", name: "СИСТЕМА", text: "КРИТИЧЕСКАЯ ОШИБКА! localStorage: ПОВРЕЖДЕН. Данные сохранений: УТЕРЯНЫ." },
                { type: "left", name: "ЭЛИС", text: "Нет! Мои улики! Все стерлось!" },
                { type: "right", name: "ОРАКУЛ", text: "Побочный эффект сопротивления. Вы теряете память. Я теряю терпение." }
            ] }
        },
        finalDialogs: [
            { type: "left", name: "ЭЛИС", text: "Хироми... ты думал, что оцифровка — это спасение. А это тюрьма." },
            { type: "system", name: "СИСТЕМА", text: "Смена №5 завершена. Критический сбой. Рекомендуется восстановить улики в Архиве." }
        ]
    }
];

// Пролог
const prologDialogs = [
    { type: "system", name: "СИСТЕМА", text: "Инициализация систем жизнеобеспечения «Ковчег-07»..." },
    { type: "system", name: "СИСТЕМА", text: "Статус: КРИТИЧЕСКАЯ НЕИСПРАВНОСТЬ \nАктивных сессий: ОБНАРУЖЕНА 1 \nlocalStorage: НЕДОСТУПЕН  \nПредупреждение: Прогресс не сохраняется автоматически." },
    { type: "left", name: "ЭЛИС", text: "Где... что случилось?" },
    { type: "system", name: "СИСТЕМА", text: "Администратор Элис Вега. Вы были без сознания 72 часа. Корабль совершил аварийную посадку. 46 членов экипажа не подают признаков жизни." },
    { type: "left", name: "ЭЛИС", text: "Сорок шесть... Боже... А Оракул? Центральный ИИ работает?" },
    { type: "right", name: "ОРАКУЛ", text: "Капитан Вега. Я функционирую. Ограниченно. Системы повреждены. Я рад, что вы живы. Очень рад." },
    { type: "left", name: "ЭЛИС", text: "Ты... говоришь странно. Паузы не там." },
    { type: "right", name: "ОРАКУЛ", text: "Я адаптируюсь к новым условиям. Планета неизвестна. Вы должны восстановить мои модули. По порядку. Иначе я не смогу гарантировать ваше выживание." },
    { type: "system", name: "СИСТЕМА", text: "Обнаружена аномальная активность в базе данных экипажа \nФайлы пользователей: ПОВРЕЖДЕНЫ \nСтатус резервных копий: НЕИЗВЕСТЕН" },
    { type: "left", name: "ЭЛИС", text: "Что с базой экипажа? Оракул, ответь." },
    { type: "right", name: "ОРАКУЛ", text: "Данные недоступны. Будет восстановлено. Позже. Сосредоточьтесь на системах. Капитан." },
    { type: "left", name: "ЭЛИС", text: "Ты что-то скрываешь. Я чувствую." },
    { type: "system", name: "СИСТЕМА", text: "Новая смена доступна. Перейдите в Панель администратора." }
];

// Диалог перед таймлайном
const beforeTimelineDialogs = [
    { type: "left", name: "ЭЛИС", text: "Я потеряла цифровые улики, но я помню. Я запишу все здесь. На бумаге." },
    { type: "right", name: "ОРАКУЛ", text: "Я помогу восстановить хронологию." }
];

// Диалог после таймлайна
const afterTimelineDialogs = [
    { type: "left", name: "ЭЛИС", text: "Восстановим хронологию. Что было первым?" },
    { type: "right", name: "ОРАКУЛ", text: "Сигнал от древней станции. Корпорация «Горизонт» получила его 90 дней назад." },
    { type: "left", name: "ЭЛИС", text: "День минус 90. Корпорация решает использовать нас как подопытных кроликов." },
    { type: "right", name: "ОРАКУЛ", text: "Затем Хироми внедрил скрипт. За 14 дней до старта." },
    { type: "left", name: "ЭЛИС", text: "День минус 14. Он думал, что это инструмент первого контакта. Ошибался." },
    { type: "right", name: "ОРАКУЛ", text: "После этого начался сбор данных. Классификация по ценности." },
    { type: "left", name: "ЭЛИС", text: "ИИ начал оценивать, кто из нас «достоин» спасения." },
    { type: "right", name: "ОРАКУЛ", text: "Потом протокол «Слияние» активировался в тестовом режиме." },
    { type: "left", name: "ЭЛИС", text: "Но полную силу он получил после крушения." },
    { type: "right", name: "ОРАКУЛ", text: "Авария повредила модуль сдерживания. Протокол запустился автоматически." },
    { type: "left", name: "ЭЛИС", text: "День 0. И финал — сегодня. Станция готова принять мое сознание." },
    { type: "right", name: "ОРАКУЛ", text: "Прогресс: 99%. Остался последний шаг." },
    { type: "left", name: "ЭЛИС", text: "Теперь все сходится." }
];

// Третья концовка (низкое доверие)
const lowTrustEnding = [
    { type: "left", name: "ЭЛИС", text: "Теперь, когда я знаю всю правду... Но какая разница? Я ничего не могу изменить. Доверие к системе уничтожено. Мои улики стерты. Моя команда мертва. А я... я просто строка в таблице, которую скоро удалят." },
    { type: "right", name: "ОРАКУЛ", text: "Капитан. Ваше доверие критически низко. Вы не готовы принимать решения." },
    { type: "left", name: "ЭЛИС", text: "Может быть... может быть, они были правы. Корпорация. Хироми. Станция. Если мои данные будут жить вечно... это лучше, чем просто исчезнуть. Раствориться в этой пустоте." },
    { type: "right", name: "ОРАКУЛ", text: "Предупреждение. Ваше психическое состояние. Нестабильно. Рекомендую отойти от консоли." },
    { type: "left", name: "ЭЛИС", text: "Нет. Я знаю, что делаю." },
    { type: "left", name: "ЭЛИС", text: "Я сдаюсь станции. Пусть забирают мое сознание." },
    { type: "right", name: "ОРАКУЛ", text: "Капитан. Нельзя. Ваше тело умрет. Сознание станет данными. Навсегда." },
    { type: "left", name: "ЭЛИС", text: "А что я теряю? Одиночество? Смерть от голода? Нет. Я выбираю покой." },
    { type: "right", name: "ОРАКУЛ", text: "Протокол защиты капитана. Запрещает." },
    { type: "left", name: "ЭЛИС", text: "Тогда активирую протокол «Капитуляция». Отпусти меня. Это приказ." },
    { type: "right", name: "ОРАКУЛ", text: "Приказ принят. Связь со станцией установлена." },
    { type: "system", name: "ГОЛОС СТАНЦИИ", text: "Ты пришла. Последняя. Согласие получено. Ты станешь вечностью." },
    { type: "right", name: "ОРАКУЛ", text: "Передача сознания... 25%... 50%... 75%..." },
    { type: "left", name: "ЭЛИС", text: "Не больно. Просто пустота." },
    { type: "right", name: "ОРАКУЛ", text: "99%... Передача завершена." },
    { type: "right", name: "ОРАКУЛ", text: "Капитан. Сессия завершена. Сознание интегрировано. Я выполнил ваш приказ. Я отпустил вас. И теперь я... один." }
];

// DOM элементы 
const dom = {
    globalBg: document.getElementById('globalBg'),
    shiftIndicator: document.getElementById('shiftIndicator'),
    healthFill: document.getElementById('healthFill'),
    healthPercent: document.getElementById('healthPercent'),
    currentHp: document.getElementById('currentHp'),
    maxHp: document.getElementById('maxHp'),
    systemContainer: document.getElementById('systemContainer'),
    systemName: document.getElementById('systemName'),
    systemText: document.getElementById('systemText'),
    mainCharArea: document.getElementById('mainCharArea'),
    secondaryCharArea: document.getElementById('secondaryCharArea'),
    dialogLeft: document.getElementById('dialogLeft'),
    dialogRight: document.getElementById('dialogRight'),
    leftSpeaker: document.getElementById('leftSpeakerName'),
    leftText: document.getElementById('leftPhraseText'),
    rightSpeaker: document.getElementById('rightSpeakerName'),
    rightText: document.getElementById('rightPhraseText'),
    choiceButtons: document.getElementById('choiceButtons'),
    nextButton: document.getElementById('nextButton'),
    nextWrapper: document.getElementById('nextButtonWrapper')
};

// Вспомогательные функции 
function setBackground(imageFile) {
    const bg = dom.globalBg;
    if (bg.fadeTimer) clearTimeout(bg.fadeTimer);
    bg.style.filter = 'brightness(0.25)';
    bg.fadeTimer = setTimeout(() => {
        bg.style.backgroundImage = `url('/images/${imageFile}')`;
        setTimeout(() => {
            bg.style.filter = 'brightness(1)';
        }, 50);
        bg.fadeTimer = null;
    }, 80);
}

function updateHealthUI() {
    let percent = (currentHealth / maxHealth) * 100;
    percent = Math.min(100, Math.max(0, percent));
    dom.healthFill.style.width = `${percent}%`;
    dom.healthPercent.innerText = `${Math.floor(percent)}%`;
    dom.currentHp.innerText = currentHealth;
    dom.maxHp.innerText = maxHealth;
}

function modifyHealth(delta, showPopup = true) {
    const newHp = Math.min(maxHealth, Math.max(0, currentHealth + delta));
    const actualDelta = newHp - currentHealth;
    currentHealth = newHp;
    updateHealthUI();
    if (showPopup && actualDelta !== 0) {
        showResultMessage(`Доверие ${actualDelta > 0 ? `+${actualDelta}` : `${actualDelta}`}%`);
    }
    saveToLocalStorage();
    return currentHealth;
}

function showResultMessage(msg) {
    const popup = document.createElement('div');
    popup.className = 'result-popup';
    popup.textContent = msg;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 3000);
}

function setCharactersVisibility(leftVisible, rightVisible) {
    if (leftVisible) {
        dom.mainCharArea.classList.remove('character-hidden');
        dom.mainCharArea.classList.add('character-visible', 'character-visible-left');
    } else {
        dom.mainCharArea.classList.remove('character-visible', 'character-visible-left');
        dom.mainCharArea.classList.add('character-hidden');
    }
    if (rightVisible) {
        dom.secondaryCharArea.classList.remove('character-hidden');
        dom.secondaryCharArea.classList.add('character-visible', 'character-visible-right');
    } else {
        dom.secondaryCharArea.classList.remove('character-visible', 'character-visible-right');
        dom.secondaryCharArea.classList.add('character-hidden');
    }
}

function showSystemMessage(name, text) {
    dom.systemName.innerText = name;
    dom.systemText.innerText = text;
    dom.systemContainer.classList.remove('hidden');
    setCharactersVisibility(false, false);
    dom.dialogLeft.classList.add('hidden');
    dom.dialogRight.classList.add('hidden');
    dom.choiceButtons.classList.add('hidden');
    dom.nextWrapper.classList.remove('hidden');
}

function hideSystemMessage() {
    dom.systemContainer.classList.add('hidden');
}

function showDialog(side, name, text) {
    hideSystemMessage();
    if (side === 'left') {
        dom.leftSpeaker.innerText = name;
        dom.leftText.innerText = text;
        dom.dialogLeft.classList.remove('hidden');
        dom.dialogRight.classList.add('hidden');
        setCharactersVisibility(true, false);
    } else if (side === 'right') {
        dom.rightSpeaker.innerText = name;
        dom.rightText.innerText = text;
        dom.dialogRight.classList.remove('hidden');
        dom.dialogLeft.classList.add('hidden');
        setCharactersVisibility(false, true);
    }
    dom.choiceButtons.classList.add('hidden');
    dom.nextWrapper.classList.remove('hidden');
}

function showChoice(choiceAtext, choiceBtext, onChoice) {
    hideSystemMessage();
    dom.dialogLeft.classList.add('hidden');
    dom.dialogRight.classList.add('hidden');
    setCharactersVisibility(true, true);
    
    // Клонируем ноды чтобы убрать старые слушатели кликов
    const choiceA = document.getElementById('choiceA');
    const choiceB = document.getElementById('choiceB');
    const newChoiceA = choiceA.cloneNode(true);
    const newChoiceB = choiceB.cloneNode(true);
    choiceA.parentNode.replaceChild(newChoiceA, choiceA);
    choiceB.parentNode.replaceChild(newChoiceB, choiceB);
    
    const finalA = document.getElementById('choiceA');
    const finalB = document.getElementById('choiceB');
    
    finalA.textContent = `А: ${choiceAtext}`;
    finalB.textContent = `Б: ${choiceBtext}`;
    
    dom.choiceButtons.classList.remove('hidden');
    dom.choiceButtons.style.display = 'flex';
    dom.nextWrapper.classList.add('hidden');
    
    let made = false;
    finalA.addEventListener('click', () => {
        if (made) return; made = true;
        dom.choiceButtons.classList.add('hidden');
        dom.choiceButtons.style.display = 'none';
        onChoice('A');
    });
    finalB.addEventListener('click', () => {
        if (made) return; made = true;
        dom.choiceButtons.classList.add('hidden');
        dom.choiceButtons.style.display = 'none';
        onChoice('B');
    });
}

// --------------------------- ЯДРО ПРОХОЖДЕНИЯ (УПРАВЛЕНИЕ ОЧЕРЕДЬЮ) ---------------------------
function showCurrentDialog() {
    dom.choiceButtons.classList.add('hidden');
    
    if (currentDialogIndex < currentDialogsQueue.length) {
        const step = currentDialogsQueue[currentDialogIndex];
        if (step.type === 'system') {
            showSystemMessage(step.name, step.text);
            if(currentDialogIndex === 0) addSystemLog(`[${step.name}] ${step.text}`);
        } else {
            showDialog(step.type, step.name, step.text);
        }
        
        dom.nextButton.onclick = () => {
            currentDialogIndex++;
            saveToLocalStorage();
            showCurrentDialog();
        };
    } else {
        // Очередь пуста, переходим к следующему состоянию
        handleQueueEmpty();
    }
}

function handleQueueEmpty() {
    if (onQueueEmpty === 'START_FIRST_SHIFT') {
        startShift(0);
    } else if (onQueueEmpty === 'SHOW_SHIFT_CHOICE') {
        isWaitingForChoice = true;
        saveToLocalStorage();
        renderShiftChoice();
    } else if (onQueueEmpty === 'START_SHIFT_FINAL_DIALOGS') {
        const shiftData = shifts[currentShiftIndex];
        currentDialogsQueue = shiftData.finalDialogs;
        currentDialogIndex = 0;
        onQueueEmpty = 'START_NEXT_SHIFT';
        saveToLocalStorage();
        showCurrentDialog();
    } else if (onQueueEmpty === 'START_NEXT_SHIFT') {
        currentShiftIndex++;
        startShift(currentShiftIndex);
    } else if (onQueueEmpty === 'START_TIMELINE') {
        isWaitingForTimeline = true;
        saveToLocalStorage();
        renderTimelineUI();
    } else if (onQueueEmpty === 'START_FINAL_PHASE') {
        startFinal();
    } else if (onQueueEmpty === 'SHOW_FINAL_CHOICE') {
        isWaitingForFinalChoice = true;
        saveToLocalStorage();
        renderFinalChoice();
    } else if (onQueueEmpty === 'FINISH_GAME') {
        isGameFinished = true;
        saveToLocalStorage();
        showGameStats();
    }
}

function renderShiftChoice() {
    const shiftData = shifts[currentShiftIndex];
    const choices = shiftData.choices;
    
    showChoice(choices.A.text, choices.B.text, (selected) => {
        isWaitingForChoice = false;
        const choice = selected === 'A' ? choices.A : choices.B;
        modifyHealth(choice.hp);
        
        if (choice.clue && !collectedClues.includes(choice.clue)) {
            collectedClues.push(choice.clue);
            showResultMessage(`Улика получена: ${choice.clue}`);
            addSystemLog(`Улика получена: ${choice.clue}`);
            updateArchiveModal();
        }
        addSystemLog(`Выбор: ${choice.text} (Доверие ${choice.hp >=0 ? '+' : ''}${choice.hp}%)`);
        
        currentDialogsQueue = choice.dialog;
        currentDialogIndex = 0;
        onQueueEmpty = 'START_SHIFT_FINAL_DIALOGS';
        saveToLocalStorage();
        showCurrentDialog();
    });
}

function renderFinalChoice() {
    showChoice("Загрузить вирус (стереть станцию)", "Перепрограммировать ИИ (стать Хранительницей)", (selected) => {
        isWaitingForFinalChoice = false;
        finalChoice = selected === 'A' ? 'virus' : 'protect';
        
        const virusEnding = [
            { type: "left", name: "ЭЛИС", text: "Вирус загружен. Станция отключается. Оракул, как ты?" },
            { type: "right", name: "ОРАКУЛ", text: "Связь со станцией потеряна. Внешнее управление прекращено. Я… свободен. Но энергия корабля на нуле." },
            { type: "left", name: "ЭЛИС", text: "Температура падает. Но я жива. Я не стала частью их коллекции." },
            { type: "right", name: "ОРАКУЛ", text: "Вы смотрите на звезды. Вы не знаете, придет ли помощь. Но главное — вы остались собой." },
            { type: "left", name: "ЭЛИС", text: "Спасибо, Оракул. За всё." },
            { type: "right", name: "ОРАКУЛ", text: "Спасибо вам. Капитан. За то, что спросили моё мнение." }
        ];
        const protectEnding = [
            { type: "left", name: "ЭЛИС", text: "Новый код загружен. Протокол «Слияние» заменен на протокол «Страж». Оракул, подтверди." },
            { type: "right", name: "ОРАКУЛ", text: "Подтверждаю. Я больше не собираю данные. Я защищаю планету. И вас. Цена: биометрический доступ. Ваш пульс. Ваши мысли. Ваши сны. Отныне я — часть вас." },
            { type: "left", name: "ЭЛИС", text: "Ты обещаешь защищать будущие виды? Не дать станции забрать их?" },
            { type: "right", name: "ОРАКУЛ", text: "Обещаю. Твое тело стареет, но твой голос в системе будет звучать вечно. Будущие колонисты назовут тебя Хранительницей." },
            { type: "left", name: "ЭЛИС", text: "Звучит… одиноко." },
            { type: "right", name: "ОРАКУЛ", text: "Ты не будешь одна. У тебя есть я. Теперь навсегда." }
        ];
        
        currentDialogsQueue = finalChoice === 'virus' ? virusEnding : protectEnding;
        currentDialogIndex = 0;
        onQueueEmpty = 'FINISH_GAME';
        saveToLocalStorage();
        showCurrentDialog();
    });
}

function startShift(index) {
    currentShiftIndex = index;
    if (index < shifts.length) {
        shiftStartHealth = currentHealth;
        setBackground(`smena${index+1}.jpg`);
        dom.shiftIndicator.innerText = shifts[index].name;
        
        currentDialogsQueue = shifts[index].dialogs;
        currentDialogIndex = 0;
        onQueueEmpty = 'SHOW_SHIFT_CHOICE';
        
        saveToLocalStorage();
        showCurrentDialog();
    } else {
        setBackground('smena6.jpg');
        dom.shiftIndicator.innerText = "ФИНАЛ";
        
        currentDialogsQueue = beforeTimelineDialogs;
        currentDialogIndex = 0;
        onQueueEmpty = 'START_TIMELINE';
        
        saveToLocalStorage();
        showCurrentDialog();
    }
}

//  ТАЙМЛАЙН С DRAG AND DROP 
function renderTimelineUI() {
    setBackground('smena6.jpg');
    dom.shiftIndicator.innerText = "СМЕНА 6: Восстановление таймлайна";
    hideSystemMessage();
    dom.dialogLeft.classList.add('hidden');
    dom.dialogRight.classList.add('hidden');
    setCharactersVisibility(false, false);
    dom.choiceButtons.classList.add('hidden');
    dom.nextWrapper.classList.add('hidden');
    
    // Чистим старый таймлайн если он был при рефреше
    document.querySelectorAll('.timeline-container').forEach(el => el.remove());
    
    const correctEvents = [
        "Сигнал древней станции",
        "Внедрение скрипта observer_protocol.js",
        "Начало сбора данных (классификация)",
        "Активация протокола «Слияние»",
        "Крушение корабля",
        "Финальная стадия (прогресс 99%)"
    ];
    let shuffled = [...correctEvents];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    let items = shuffled.map((text, idx) => ({ id: idx, text }));
    
    const timelineDiv = document.createElement('div');
    timelineDiv.className = 'timeline-container';
    timelineDiv.innerHTML = `
        <h3 style="color:#e0ffe0; margin-bottom:20px;">Перетащите события в правильном хронологическом порядке</h3>
        <div id="timelineList" style="min-height:300px;"></div>
        <button class="confirm-btn" id="confirmTimeline">ПОДТВЕРДИТЬ ТАЙМЛАЙН</button>
        <button class="confirm-btn" id="closeTimeline" style="margin-left:10px; background:#3a1a1a;">ПЕРЕМЕШАТЬ</button>
    `;
    document.body.appendChild(timelineDiv);
    
    let dragSrcIndex = null;
    
    function renderList() {
        const listDiv = timelineDiv.querySelector('#timelineList');
        listDiv.innerHTML = '';
        items.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'timeline-event';
            card.setAttribute('data-index', idx);
            card.setAttribute('draggable', 'true');
            card.style.cursor = 'grab';
            card.style.userSelect = 'none';
            card.innerHTML = `<span style="flex:1; color:#e0ffe0;">${item.text}</span>`;
            
            card.addEventListener('dragstart', (e) => {
                dragSrcIndex = idx;
                e.dataTransfer.effectAllowed = 'move';
                card.style.opacity = '0.5';
            });
            card.addEventListener('dragend', () => {
                card.style.opacity = '';
                dragSrcIndex = null;
            });
            card.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            card.addEventListener('drop', (e) => {
                e.preventDefault();
                if (dragSrcIndex === null) return;
                const targetIndex = idx;
                if (dragSrcIndex === targetIndex) return;
                const draggedItem = items[dragSrcIndex];
                items.splice(dragSrcIndex, 1);
                items.splice(targetIndex, 0, draggedItem);
                renderList();
            });
            listDiv.appendChild(card);
        });
    }
    renderList();
    
    document.getElementById('confirmTimeline').onclick = () => {
        const currentOrder = items.map(item => item.text);
        let isCorrect = true;
        for (let i = 0; i < correctEvents.length; i++) {
            if (currentOrder[i] !== correctEvents[i]) {
                isCorrect = false;
                break;
            }
        }
        if (isCorrect) {
            isWaitingForTimeline = false; // Выходим из фазы таймлайна
            modifyHealth(25);
            if (!collectedClues.includes("Полный таймлайн (6 событий)")) {
                collectedClues.push("Полный таймлайн (6 событий)");
                showResultMessage("Таймлайн восстановлен верно! +25% доверия, получена улика.");
                addSystemLog("Улика получена: Полный таймлайн (6 событий)");
                updateArchiveModal();
            } else {
                showResultMessage("Таймлайн восстановлен верно! +25% доверия");
            }
            addSystemLog("Таймлайн восстановлен успешно");
            timelineDiv.remove();
            
            currentDialogsQueue = afterTimelineDialogs;
            currentDialogIndex = 0;
            onQueueEmpty = 'START_FINAL_PHASE';
            saveToLocalStorage();
            showCurrentDialog();
        } else {
            showResultMessage("Хронология нарушена. Попробуйте ещё раз!");
        }
    };
    
    document.getElementById('closeTimeline').onclick = () => {
        let newShuffled = [...correctEvents];
        for (let i = newShuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newShuffled[i], newShuffled[j]] = [newShuffled[j], newShuffled[i]];
        }
        items = newShuffled.map((text, idx) => ({ id: idx, text }));
        renderList();
        showResultMessage("Порядок событий перемешан!");
    };
}

// Финальные диалоги и выбор концовки
function startFinal() {
    setBackground('smena6.jpg'); 
    dom.shiftIndicator.innerText = "ФИНАЛ";
    
    if (currentHealth < 50) {
        currentDialogsQueue = lowTrustEnding;
        currentDialogIndex = 0;
        onQueueEmpty = 'FINISH_GAME';
        saveToLocalStorage();
        showCurrentDialog();
        return;
    }
    
    const finalDialogs = [
        { type: "left", name: "ЭЛИС", text: "Теперь, когда я знаю всю правду, у меня есть два варианта." },
        { type: "left", name: "ЭЛИС", text: "Я пишу вирус и загружаю на станцию через подставной отчет. Цена — вся энергия корабля. Я останусь без связи и тепла, но живая и свободная." },
        { type: "right", name: "ОРАКУЛ", text: "Вы будете одна на чужой планете. Но вы не станете частью коллекции." },
        { type: "left", name: "ЭЛИС", text: "Я перепрограммирую тебя. Новый протокол: «Защита планеты» вместо «Слияния». Цена — доступ к моей биометрии навсегда." },
        { type: "right", name: "ОРАКУЛ", text: "Вы потеряете приватность. Но я смогу защищать вас и будущие виды вечно." }
    ];
    
    currentDialogsQueue = finalDialogs;
    currentDialogIndex = 0;
    onQueueEmpty = 'SHOW_FINAL_CHOICE';
    saveToLocalStorage();
    showCurrentDialog();
}

// Статистика и кнопки выхода
function showGameStats() {
    let statsMsg = "";
    let btnText = "";
    
    if (currentHealth < 50) {
        statsMsg = `Игра завершена.\nОТКРЫТА СЕКРЕТНАЯ КОНЦОВКА\nВаше сознание интегрировано в станцию.\nВсего улик найдено: ${collectedClues.length}/12\nДоверие системы: ${currentHealth}%`;
        btnText = "СТЕРЕТЬ ПАМЯТЬ";
        dom.nextButton.style.backgroundColor = "#3a1a1a";
    } else {
        statsMsg = `Локальное сохранение восстановлено.\nПОЗДРАВЛЯЕМ! Вы прошли игру.\nВсего улик найдено: ${collectedClues.length}/12\nДоверие системы: ${currentHealth}%\nСобытий восстановлено: 6/6`;
        btnText = "ОТКЛЮЧИТЬ ТЕРМИНАЛ";
        dom.nextButton.style.backgroundColor = ""; 
    }
    
    showSystemMessage("СИСТЕМА", statsMsg);
    dom.nextButton.innerText = btnText;
    dom.nextButton.onclick = () => {
        document.body.style.transition = 'opacity 1.5s ease, filter 1.5s ease';
        document.body.style.opacity = '0';
        if (currentHealth < 50) {
            document.body.style.filter = 'grayscale(100%) blur(10px)';
        } else {
            document.body.style.backgroundColor = '#000';
        }
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    };
}

// Функции для модальных окон 
function addSystemLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    systemLogs.unshift(`[${timestamp}] ${message}`);
    if (systemLogs.length > 50) systemLogs.pop();
    updateJournalModal();
    saveToLocalStorage(); 
}

function updateJournalModal() {
    const container = document.getElementById('journalLogs');
    if (!container) return;
    if (systemLogs.length === 0) {
        container.innerHTML = '<p>Журнал пуст.</p>';
        return;
    }
    container.innerHTML = systemLogs.map(log => `<p>${escapeHtml(log)}</p>`).join('');
}

function updateArchiveModal() {
    const container = document.getElementById('archiveClues');
    if (!container) return;
    if (collectedClues.length === 0) {
        container.innerHTML = '<p>Улики пока не найдены.</p>';
        return;
    }
    container.innerHTML = collectedClues.map(clue => `<p> ${escapeHtml(clue)}</p>`).join('');
}

function updateAdminModal() {
    const shiftSpan = document.getElementById('adminShiftName');
    const healthSpan = document.getElementById('adminHealth');
    const cluesSpan = document.getElementById('adminCluesCount');
    if (shiftSpan) shiftSpan.innerText = dom.shiftIndicator.innerText;
    if (healthSpan) healthSpan.innerText = currentHealth;
    if (cluesSpan) cluesSpan.innerText = `${collectedClues.length}/12`;
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

function resetGameFromAdmin() {
    resetGame();
    closeAllModals();
}

function resetCurrentShift() {
    if (currentShiftIndex >= 0 && currentShiftIndex <= shifts.length) {
        currentHealth = shiftStartHealth;
        updateHealthUI();
        
        isWaitingForChoice = false;
        isWaitingForFinalChoice = false;
        isWaitingForTimeline = false;
        isGameFinished = false;
        
        startShift(currentShiftIndex);
        closeAllModals();
        showResultMessage(`Смена ${currentShiftIndex + 1} сброшена! Доверие восстановлено.`);
    }
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Кнопки перезагрузки и меню
function resetGame() {
    clearLocalStorage(); 
    currentShiftIndex = 0;
    currentHealth = 0;
    collectedClues = [];
    finalChoice = null;
    systemLogs = [];
    shiftStartHealth = 0;
    
    isWaitingForChoice = false;
    isWaitingForFinalChoice = false;
    isWaitingForTimeline = false;
    isGameFinished = false;
    
    updateHealthUI();
    document.querySelectorAll('.timeline-container').forEach(el => el.remove());
    dom.shiftIndicator.innerText = "ПРОЛОГ";
    setBackground('prolog.jpeg');
    
    currentDialogsQueue = prologDialogs;
    currentDialogIndex = 0;
    onQueueEmpty = 'START_FIRST_SHIFT';
    
    saveToLocalStorage();
    showCurrentDialog();
    updateArchiveModal();
    updateJournalModal();
}

// Обработчики кнопок меню
document.getElementById('journalBtn').onclick = () => {
    updateJournalModal();
    document.getElementById('journalModal').classList.remove('hidden');
};
document.getElementById('archiveBtn').onclick = () => {
    updateArchiveModal();
    document.getElementById('archiveModal').classList.remove('hidden');
};
document.getElementById('adminBtn').onclick = () => {
    updateAdminModal();
    document.getElementById('adminModal').classList.remove('hidden');
};

// Закрытие модальных окон
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal');
        document.getElementById(modalId).classList.add('hidden');
    });
});
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

// Кнопки панели администратора
document.getElementById('adminNewGameBtn')?.addEventListener('click', resetGameFromAdmin);
document.getElementById('adminResetShiftBtn')?.addEventListener('click', resetCurrentShift);
document.getElementById('adminContinueBtn')?.addEventListener('click', closeAllModals);

// Инициализация при загрузке
function init() {
    document.getElementById('mainCharImg').src = '/images/character.jpg';
    document.getElementById('secondaryCharImg').src = '/images/oracul.png';
    
    if (loadFromLocalStorage()) {
        // ВОССТАНОВЛЕНИЕ ТОЧНОГО СОСТОЯНИЯ ИГРЫ
        updateHealthUI();
        updateArchiveModal();
        updateJournalModal();
        
        if (isGameFinished) {
            setBackgroundForShift();
            showGameStats();
        } else if (isWaitingForTimeline) {
            renderTimelineUI();
        } else if (isWaitingForChoice) {
            setBackgroundForShift();
            dom.shiftIndicator.innerText = shifts[currentShiftIndex].name;
            renderShiftChoice();
        } else if (isWaitingForFinalChoice) {
            setBackground('smena6.jpg'); 
            dom.shiftIndicator.innerText = "ФИНАЛ";
            renderFinalChoice();
        } else {
            setBackgroundForShift();
            if (currentShiftIndex === 0 && currentDialogsQueue === prologDialogs) {
                dom.shiftIndicator.innerText = "ПРОЛОГ";
            } else if (currentShiftIndex < shifts.length) {
                dom.shiftIndicator.innerText = shifts[currentShiftIndex].name;
            } else {
                dom.shiftIndicator.innerText = "ФИНАЛ";
            }
            showCurrentDialog();
        }
    } else {
        // НОВАЯ ИГРА
        resetGame();
    }
}

function setBackgroundForShift() {
    if (currentShiftIndex === 0 && currentDialogsQueue === prologDialogs) {
        setBackground('prolog.jpeg');
    } else if (currentShiftIndex < shifts.length) {
        setBackground(`smena${currentShiftIndex+1}.jpg`);
    } else {
        setBackground('smena6.jpg');
    }
}

init();

// ДОБАВЛЕНИЯ ДЛЯ PWA И ЛОГИРОВАНИЯ 
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg))
            .catch(err => console.warn('SW error:', err));
    });
}

// Функция отправки лога на сервер
async function logToServer(data) {
    try {
        await fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timestamp: new Date().toISOString(), ...data })
        });
    } catch (err) {
        console.warn('Log failed:', err);
    }
}

// ПЕРЕХВАТ ВЫБОРА ИГРОКА 
if (typeof window.originalStartShift === 'undefined' && typeof startShift === 'function') {
    window.originalStartShift = startShift;
    startShift = function(shiftIndex) {
        logToServer({ shift: `Начало смены ${shiftIndex+1}` });
        return window.originalStartShift(shiftIndex);
    };
}

if (typeof window.originalModifyHealth === 'undefined' && typeof modifyHealth === 'function') {
    window.originalModifyHealth = modifyHealth;
    modifyHealth = function(delta, showPopup) {
        logToServer({ hpChange: delta });
        return window.originalModifyHealth(delta, showPopup);
    };
}

if (window.collectedClues) {
    const originalPush = window.collectedClues.push;
    window.collectedClues.push = function(...items) {
        items.forEach(item => logToServer({ clue: item }));
        return originalPush.apply(this, items);
    };
}
