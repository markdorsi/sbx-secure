import { getStore } from '@netlify/blobs';

export default async (req, context) => {
    if (req.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const url = new URL(req.url);
        const sinceId = parseInt(url.searchParams.get('since')) || 0;

        const messagesStore = getStore('messages');
        const usersStore = getStore('users');

        let messages = [];
        const messagesData = await messagesStore.get('chat-messages', { type: 'json' });
        if (messagesData) {
            messages = messagesData;
        }

        let users = [];
        const usersData = await usersStore.get('user-list', { type: 'json' });
        if (usersData) {
            users = usersData;
        }

        const filteredMessages = messages.filter(msg => msg.id > sinceId);

        return new Response(JSON.stringify({
            messages: filteredMessages,
            userCount: users.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in get-messages function:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
