require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

// Ruta de prueba para verificar que el servidor está activo
app.get('/', (req, res) => {
  res.send('🟢 Servidor de Telegram Arcade activo y respondiendo correctamente.');
});