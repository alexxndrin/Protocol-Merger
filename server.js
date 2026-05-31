const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = path.join(__dirname, 'logs.txt');

app.use(bodyParser.json());

// 1. Раздаем всю статику из папки public
app.use(express.static(path.join(__dirname, 'public')));

// 2. Явные роуты
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/shift1.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'shift1.html')));
app.get('/sw.js', (req, res) => res.sendFile(path.join(__dirname, 'public', 'sw.js')));
app.get('/manifest.webmanifest', (req, res) => res.sendFile(path.join(__dirname, 'public', 'manifest.webmanifest')));

// 3. API для сохранения логов
app.post('/api/log', (req, res) => {
    const { timestamp, shift, choice, hpChange, clue, error } = req.body;
    let logLine = `[${timestamp}] `;
    
    if (shift) logLine += `${shift} | `;
    if (choice) logLine += `Choice ${choice} | `;
    if (hpChange !== undefined) logLine += `HP ${hpChange >= 0 ? '+' : ''}${hpChange} | `;
    if (clue) logLine += `Clue: ${clue} | `;
    if (error) logLine += `ERROR: ${error}`;
    
    fs.appendFile(LOG_FILE, logLine + '\n', err => {
        if (err) console.error('Ошибка записи лога:', err);
    });
    
    res.json({ status: 'ok' });
});

// 4. API для чтения логов (если понадобится вывести админу)
app.get('/api/logs', (req, res) => {
    fs.readFile(LOG_FILE, 'utf8', (err, data) => {
        if (err && err.code === 'ENOENT') return res.json([]);
        if (err) return res.status(500).json({ error: 'Cannot read logs' });
        res.json(data.split('\n').filter(l => l.trim()));
    });
});

// Инициализация сервера и файла логов
app.listen(PORT, () => {
    console.log(`[SYSTEM] Сервер Ковчега запущен: http://localhost:${PORT}`);
    if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, '');
});