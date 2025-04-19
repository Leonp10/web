const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Banco de dados simples em memória (substitua por um banco real para produção)
let messages = [];

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Configuração do Socket.IO
io.on('connection', (socket) => {
    console.log('Novo usuário conectado');
    
    // Enviar mensagens anteriores ao novo usuário
    socket.emit('previousMessages', messages);
    
    // Receber nova mensagem
    socket.on('message', (data) => {
        // Adicionar ID único à mensagem
        data.id = uuidv4();
        messages.push(data);
        
        // Limitar o histórico de mensagens (opcional)
        if (messages.length > 100) {
            messages = messages.slice(-100);
        }
        
        // Enviar a mensagem para todos os usuários
        io.emit('message', data);
    });
    
    // Receber notificação de que alguém está digitando
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });
    
    // Receber notificação de que alguém parou de digitar
    socket.on('stopTyping', () => {
        socket.broadcast.emit('stopTyping');
    });
    
    // Desconectar
    socket.on('disconnect', () => {
        console.log('Usuário desconectado');
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});