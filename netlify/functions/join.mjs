import { getStore } from '@netlify/blobs';

export default async (req, context) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { username } = await req.json();

        if (!username || username.trim() === '') {
            return new Response(JSON.stringify({ error: 'Username is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const usersStore = getStore('users');

        let users = [];
        const usersData = await usersStore.get('user-list', { type: 'json' });
        if (usersData) {
            users = usersData;
        }

        const existingUser = users.find(u => u.username === username);
        if (!existingUser) {
            users.push({
                username: username.trim(),
                joinedAt: new Date().toISOString()
            });
            await usersStore.setJSON('user-list', users);
        } else {
            existingUser.joinedAt = new Date().toISOString();
            await usersStore.setJSON('user-list', users);
        }

        return new Response(JSON.stringify({
            success: true,
            username: username.trim()
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error in join function:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
