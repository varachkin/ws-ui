import { useEffect, useState } from 'react';
import { connect, StringCodec } from 'nats.ws';

const BACKEND_URL = 'https://server-smoky-eight.vercel.app';

function App() {
    const [message, setMessage] = useState('');
    const [received, setReceived] = useState([]);
    const [nc, setNc] = useState(null);
    const sc = StringCodec();

    useEffect(() => {
        const connectToNats = async () => {
            try {
                const connection = await connect({
                    servers: BACKEND_URL.replace('https://', 'wss://'),
                });
                setNc(connection);
                console.log('Connected to NATS server');

                // Subscribe to 'test' subject
                const subTest = connection.subscribe('test');
                (async () => {
                    for await (const m of subTest) {
                        setReceived(prev => [...prev, `Message: ${sc.decode(m.data)}`]);
                    }
                })();

                // Subscribe to 'time' subject
                const subTime = connection.subscribe('time');
                (async () => {
                    for await (const m of subTime) {
                        setReceived(prev => [...prev, `Time update: ${sc.decode(m.data)}`]);
                    }
                })();

            } catch (error) {
                console.error('Error connecting to NATS:', error);
            }
        };

        connectToNats();

        return () => {
            if (nc) {
                nc.close();
            }
        };
    }, []);

    const sendMessage = async () => {
        if (!message.trim()) return;

        try {
            const response = await fetch(`${BACKEND_URL}/api/message`, {
                method: 'POST',
                mode: 'cors', // Ensure CORS mode is set
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
                credentials: 'omit', // Important for CORS
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>NATS Chat</h2>
            <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write a message"
            />
            <button onClick={sendMessage}>Send</button>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                {received.map((msg, idx) => (
                    <li key={idx} style={{
                        padding: '0.5rem',
                        margin: '0.5rem 0',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '4px'
                    }}>
                        {msg}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default App;