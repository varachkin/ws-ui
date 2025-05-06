import React, { useEffect, useState } from 'react';
import { connect, StringCodec } from 'nats.ws';

const BACKEND_URL = 'https://server-4t18pf67v-varachkins-projects.vercel.app/'; // ← замени на свой адрес

function App() {
    const [message, setMessage] = useState('');
    const [received, setReceived] = useState([]);

    useEffect(() => {
        (async () => {
            const sc = StringCodec();
            const nc = await connect({ servers: 'wss://connect.ngs.global' });
            const sub = nc.subscribe('chat.messages');

            for await (const m of sub) {
                setReceived(prev => [...prev, sc.decode(m.data)]);
            }
        })();
    }, []);

    const sendMessage = async () => {
        if (!message) return;
        await fetch(`${BACKEND_URL}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        setMessage('');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>NATS Chat</h2>
            <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write a message"
            />
            <button onClick={sendMessage}>Send</button>

            <ul>
                {received.map((msg, idx) => (
                    <li key={idx}>{msg}</li>
                ))}
            </ul>
        </div>
    );
}

export default App;