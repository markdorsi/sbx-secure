let currentUser = null;
let lastMessageId = 0;
let pollingInterval = null;

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const currentUserSpan = document.getElementById('current-user');
const userCountSpan = document.getElementById('user-count');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');

joinBtn.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

async function joinChat() {
    const username = usernameInput.value.trim();

    if (!username) {
        alert('Please enter a username!');
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'Failed to join chat');
            return;
        }

        currentUser = username;
        currentUserSpan.textContent = `Logged in as: ${username}`;

        loginScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');

        await loadMessages();

        pollingInterval = setInterval(pollMessages, 2000);

        messageInput.focus();
    } catch (error) {
        console.error('Error joining chat:', error);
        alert('Failed to join chat. Please try again.');
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message || !currentUser) return;

    try {
        const response = await fetch('/.netlify/functions/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentUser,
                message
            })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        messageInput.value = '';

        await pollMessages();
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    }
}

async function loadMessages() {
    try {
        const response = await fetch('/.netlify/functions/get-messages');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load messages');
        }

        messagesContainer.innerHTML = '';

        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                appendMessage(msg);
            });
            lastMessageId = data.messages[data.messages.length - 1].id;
        } else {
            messagesContainer.innerHTML = '<div class="welcome-message">Welcome to RetroChat 90s! Start chatting below.</div>';
        }

        if (data.userCount !== undefined) {
            userCountSpan.textContent = data.userCount;
        }

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function pollMessages() {
    try {
        const response = await fetch(`/.netlify/functions/get-messages?since=${lastMessageId}`);
        const data = await response.json();

        if (!response.ok) {
            return;
        }

        if (data.messages && data.messages.length > 0) {
            const welcomeMsg = messagesContainer.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.remove();
            }

            data.messages.forEach(msg => {
                if (msg.id > lastMessageId) {
                    appendMessage(msg);
                    lastMessageId = msg.id;
                }
            });

            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        if (data.userCount !== undefined) {
            userCountSpan.textContent = data.userCount;
        }
    } catch (error) {
        console.error('Error polling messages:', error);
    }
}

function appendMessage(msg) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const timestamp = new Date(msg.timestamp);
    const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const messageUser = document.createElement('span');
    messageUser.className = 'message-user';
    messageUser.textContent = msg.username;

    const messageTime = document.createElement('span');
    messageTime.className = 'message-time';
    messageTime.textContent = timeString;

    messageHeader.appendChild(messageUser);
    messageHeader.appendChild(messageTime);

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = msg.message;

    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageText);

    messagesContainer.appendChild(messageDiv);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});
