import { getStore } from '@netlify/blobs';

export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { username, message } = await req.json();

        if (!username || !message || username.trim() === '' || message.trim() === '') {
            return new Response(JSON.stringify({ error: 'Username and message are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const messagesStore = getStore('messages');

        let messages = [];
        const messagesData = await messagesStore.get('chat-messages', { type: 'json' });
        if (messagesData) {
            messages = messagesData;
        }

        const newMessage = {
            id: messages.length > 0 ? messages[messages.length - 1].id + 1 : 1,
            username: username.trim(),
            message: message.trim(),
            timestamp: new Date().toISOString()
        };

        messages.push(newMessage);

        const maxMessages = 1000;
        if (messages.length > maxMessages) {
            messages = messages.slice(-maxMessages);
        }

        await messagesStore.setJSON('chat-messages', messages);

        return new Response(JSON.stringify({
            success: true,
            message: newMessage
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in send-message function:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
