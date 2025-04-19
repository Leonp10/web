document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const loginModal = document.getElementById('login-modal');
    const usernameInput = document.getElementById('username-input');
    const loginBtn = document.getElementById('login-btn');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const typingIndicator = document.getElementById('typing-indicator');
    const typingText = document.getElementById('typing-text');
    const imageBtn = document.getElementById('image-btn');
    const videoBtn = document.getElementById('video-btn');
    const audioBtn = document.getElementById('audio-btn');
    const fileInput = document.getElementById('file-input');
    
    let username = '';
    let socket;
    let typingTimeout;
    const TYPING_TIMEOUT_LENGTH = 2000; // 2 segundos
    
    // Mostrar modal de login inicialmente
    loginModal.classList.remove('hidden');
    
    // Função para conectar ao servidor Socket.IO
    function connectToServer() {
        socket = io();
        
        // Receber mensagens do servidor
        socket.on('message', (data) => {
            addMessage(data, false);
        });
        
        // Receber mensagens antigas ao conectar
        socket.on('previousMessages', (messages) => {
            messages.forEach(msg => {
                addMessage(msg, msg.username === username);
            });
            scrollToBottom();
        });
        
        // Receber notificação de que alguém está digitando
        socket.on('typing', (data) => {
            if (data.username !== username) {
                typingText.textContent = `${data.username} está digitando...`;
                typingIndicator.classList.remove('hidden');
                
                // Esconder o indicador após 2 segundos
                clearTimeout(typingTimeout);
                typingTimeout = setTimeout(() => {
                    typingIndicator.classList.add('hidden');
                }, TYPING_TIMEOUT_LENGTH);
            }
        });
        
        // Receber notificação de que alguém parou de digitar
        socket.on('stopTyping', () => {
            typingIndicator.classList.add('hidden');
        });
    }
    
    // Função para adicionar mensagem ao chat
    function addMessage(data, isSent) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isSent ? 'sent' : 'received');
        
        let contentHTML = `<div>${data.text}</div>`;
        
        // Adicionar mídia se existir
        if (data.media) {
            if (data.media.type.startsWith('image')) {
                contentHTML += `<div class="media-content"><img src="${data.media.url}" alt="Imagem enviada"></div>`;
            } else if (data.media.type.startsWith('video')) {
                contentHTML += `<div class="media-content"><video controls><source src="${data.media.url}" type="${data.media.type}">Seu navegador não suporta vídeos.</video></div>`;
            } else if (data.media.type.startsWith('audio')) {
                contentHTML += `<div class="media-content"><audio controls class="audio-message"><source src="${data.media.url}" type="${data.media.type}">Seu navegador não suporta áudio.</audio></div>`;
            }
        }
        
        // Adicionar informações da mensagem
        contentHTML += `
            <div class="message-info">
                <span>${data.username}</span>
                <span>${new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
        `;
        
        messageDiv.innerHTML = contentHTML;
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Função para rolar para a última mensagem
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Função para enviar mensagem
    function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '') return;
        
        const message = {
            username,
            text,
            timestamp: new Date().toISOString()
        };
        
        socket.emit('message', message);
        addMessage(message, true);
        messageInput.value = '';
    }
    
    // Função para enviar mídia
    function sendMedia(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const message = {
                username,
                text: '',
                media: {
                    url: e.target.result,
                    type: file.type
                },
                timestamp: new Date().toISOString()
            };
            
            socket.emit('message', message);
            addMessage(message, true);
        };
        
        reader.readAsDataURL(file);
    }
    
    // Event Listeners
    loginBtn.addEventListener('click', function() {
        const name = usernameInput.value.trim();
        if (name === '') {
            alert('Por favor, digite um nome de usuário');
            return;
        }
        
        username = name;
        usernameDisplay.textContent = username;
        loginModal.classList.add('hidden');
        
        // Conectar ao servidor após login
        connectToServer();
    });
    
    sendBtn.addEventListener('click', sendMessage);
    
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Indicador de digitação
    messageInput.addEventListener('input', function() {
        if (messageInput.value.trim() !== '') {
            socket.emit('typing', { username });
        } else {
            socket.emit('stopTyping');
        }
    });
    
    logoutBtn.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja sair do chat?')) {
            if (socket) socket.disconnect();
            username = '';
            chatMessages.innerHTML = '';
            loginModal.classList.remove('hidden');
        }
    });
    
    // Botões de mídia
    imageBtn.addEventListener('click', function() {
        fileInput.accept = 'image/*';
        fileInput.click();
    });
    
    videoBtn.addEventListener('click', function() {
        fileInput.accept = 'video/*';
        fileInput.click();
    });
    
    audioBtn.addEventListener('click', function() {
        fileInput.accept = 'audio/*';
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
        if (fileInput.files.length > 0) {
            sendMedia(fileInput.files[0]);
            fileInput.value = '';
        }
    });
});