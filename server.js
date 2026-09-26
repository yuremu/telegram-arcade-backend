require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

// 🔒 FUNCIÓN DE SEGURIDAD: Validar initData de Telegram
function verifyTelegramData(initData) {
  if (!initData) return false;

  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');

  // Ordenar alfabéticamente los parámetros
  const dataCheckString = Array.from(urlParams.entries())
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  // Generar HMAC de la clave secreta usando el token del bot
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  // Generar hash de comprobación
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return calculatedHash === hash;
}

// 📌 RUTA 1: Autenticar o Registrar Usuario
app.post('/api/user/sync', (req, res) => {
  const { initData, user } = req.body;

  // En producción, descomentar para mayor seguridad:
  // if (!verifyTelegramData(initData)) {
  //   return res.status(403).json({ error: 'Datos no válidos de Telegram' });
  // }

  if (!user || !user.id) {
    return res.status(400).json({ error: 'Faltan datos del usuario' });
  }

  const { id, first_name, username } = user;

  // Buscar si el usuario ya existe
  db.get('SELECT * FROM users WHERE telegram_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      // Usuario existente: devolver sus datos guardados
      res.json({ success: true, user: row });
    } else {
      // Usuario nuevo: registrarlo con 0 monedas
      const stmt = db.prepare(`
        INSERT INTO users (telegram_id, first_name, username, coins, streak)
        VALUES (?, ?, ?, 0, 0)
      `);
      stmt.run(id, first_name, username, function (insertErr) {
        if (insertErr) return res.status(500).json({ error: insertErr.message });
        res.json({
          success: true,
          user: { telegram_id: id, first_name, username, coins: 0, streak: 0 }
        });
      });
      stmt.finalize();
    }
  });
});

// 📌 RUTA 2: Sumar Monedas (Servidor controla los límites)
app.post('/api/user/add-coins', (req, res) => {
  const { telegram_id, amount } = req.body;

  if (!telegram_id || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Petición inválida' });
  }

  db.run(
    'UPDATE users SET coins = coins + ? WHERE telegram_id = ?',
    [amount, telegram_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Obtener saldo actualizado
      db.get('SELECT coins FROM users WHERE telegram_id = ?', [telegram_id], (err, row) => {
        res.json({ success: true, coins: row ? row.coins : 0 });
      });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});