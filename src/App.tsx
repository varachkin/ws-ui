import { useEffect, useState } from 'react';
import { connect, StringCodec } from 'nats.ws';

const BACKEND_URL: string = 'https://server-4t18pf67v-varachkins-projects.vercel.app/';

function App() {
    const [message, setMessage] = useState<string>('');
    const [received, setReceived] = useState<string[]>([]);
    const [nc, setNc] = useState<any | null>(null);
    const sc = StringCodec();

    useEffect(() => {
        const connectToNats = async (): Promise<void> => {
            try {
                const connection: any = await connect({
                    servers: BACKEND_URL.replace('https://', 'wss://'),
                });
                setNc(connection);
                console.log('Connected to NATS server');

                // Subscribe to 'test' subject
                const subTest: any = connection.subscribe('test');
                (async (): Promise<void> => {
                    for await (const m of subTest) {
                        setReceived(prev => [...prev, `Message: ${sc.decode(m.data)}`]);
                    }
                })();

                // Subscribe to 'time' subject
                const subTime: any = connection.subscribe('time');
                (async (): Promise<void> => {
                    for await (const m of subTime) {
                        setReceived(prev => [...prev, `Time update: ${sc.decode(m.data)}`]);
                    }
                })();

            } catch (error: unknown) {
                console.error('Error connecting to NATS:', error);
            }
        };

        connectToNats();

        return (): void => {
            if (nc) {
                nc.close().catch((error: Error) => {
                    console.error('Error closing connection:', error);
                });
            }
        };
    }, []);

    const sendMessage = async (): Promise<void> => {
        if (!message.trim()) return;

        try {
            const response: Response = await fetch(`${BACKEND_URL}/api/message`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
                credentials: 'omit',
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setMessage('');
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error sending message:', error.message);
            } else {
                console.error('Unknown error occurred while sending message');
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>NATS Chat</h2>
            <input
                value={message}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Write a message"
            />
            <button onClick={sendMessage}>Send</button>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                {received.map((msg: string, idx: number) => (
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