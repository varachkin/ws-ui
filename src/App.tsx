import { useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    Container,
    CssBaseline,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ThemeProvider,
    createTheme,
    Chip
} from '@mui/material';

const WEB_SOCKET_URL = 'ws://localhost:3000';
const HTTP_SERVER_URL = 'http://localhost:3000';

// Create dark theme
const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#f3f81c',
        },
        secondary: {
            main: '#f48fb1',
        },
        info: {
            main: '#4c6de3',
        },
        background: {
            default: '#121212',
            paper: '#1e1e1e',
        },
    },
});

interface Message {
    side: string;
    message: string;
}

function App() {
    const [side, setSide] = useState<string>('both');
    const [inputMessage, setInputMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    const handleSideChange = (event: any) => {
        setSide(event.target.value as string);
    };

    useEffect(() => {
        const socket = new WebSocket(WEB_SOCKET_URL);
        setWs(socket);

        socket.onopen = () => {
            setIsConnected('Connected')
            console.log('WebSocket connected');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setMessages(prev => [...prev, data]);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket disconnected');
        };

        return () => {
            socket.close();
            setIsConnected(null)
        };
    }, []);

    useEffect(() => {
        // Only scroll if user hasn't manually scrolled up
        if (shouldScrollToBottom()) {
            smoothScrollToBottom();
        }
    }, [messages]);

    const shouldScrollToBottom = () => {
        if (!listContainerRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = listContainerRef.current;
        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
        return distanceFromBottom < 100; // Threshold in pixels
    };

    const smoothScrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'start'
            });
        }
    };

    const sendMessage = async (): Promise<void> => {
        if (!inputMessage.trim()) return;

        try {
            const response = await fetch(`${HTTP_SERVER_URL}/api/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ side, message: inputMessage }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setInputMessage('');
            // Force scroll to bottom after sending a message
            setTimeout(smoothScrollToBottom, 100);
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Error sending message:', error.message);
            } else {
                console.error('Unknown error occurred while sending message');
            }
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    };

    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <Container maxWidth="xl" sx={{ py: 4, width: '80vw' }}>
                <Paper elevation={3} sx={{ p: 3 }}>
                    <Typography variant="h4" component="h3" gutterBottom textAlign={'center'}>
                        WebSocket Chat
                    </Typography>
                    <Typography variant="h6" component="h6" gutterBottom textAlign={'center'} color={'success'}>
                        {isConnected}
                    </Typography>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="side-select-label">Side</InputLabel>
                        <Select
                            labelId="side-select-label"
                            id="side-select"
                            value={side}
                            label="Side"
                            onChange={handleSideChange}
                        >
                            <MenuItem value={'left'}>Left</MenuItem>
                            <MenuItem value={'right'}>Right</MenuItem>
                            <MenuItem value={'both'}>Both</MenuItem>
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            value={inputMessage}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Write a message"
                        />
                        <Button
                            disabled={!isConnected}
                            variant="contained"
                            onClick={sendMessage}
                            sx={{ minWidth: 120, fontWeight: 600 }}
                        >
                            Send
                        </Button>
                    </Box>

                    <Paper
                        variant="outlined"
                        sx={{ height: '60vh', overflow: 'auto' }}
                        ref={listContainerRef}
                    >
                        <List sx={{ paddingBottom: 0 }}>
                            {messages.map((msg, idx) => (
                                <ListItem
                                    key={idx}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: "space-between",
                                        alignItems: 'center',
                                        bgcolor: idx % 2 === 0 ? 'background.paper': 'rgba(255, 255, 255, 0.05)',
                                        // mb: 1,
                                        paddingBottom: 3,
                                        borderRadius: 1,
                                        width: '100%'
                                    }}
                                >
                                    <ListItemText
                                        primary={msg.message}
                                        secondary={
                                            <Chip
                                                component={'span'}
                                                label={msg.side}
                                                size="small"
                                                color={msg.side === 'left' ? 'primary' : msg.side === 'right' ? 'info' : 'secondary'}
                                                sx={{
                                                    mt: 1,
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    fontSize: '2vh',
                                                    padding: 2,
                                                    width: '100%'
                                                }}
                                            />
                                        }
                                        sx={{
                                            display: 'flex',
                                            justifyContent: "space-between",
                                            alignItems: 'flex-end',
                                            color: 'text.primary',
                                            fontSize: '3vh',
                                            width: '100%'
                                        }}
                                    />
                                </ListItem>
                            ))}
                            <p ref={messagesEndRef} />
                        </List>
                    </Paper>
                </Paper>
            </Container>
        </ThemeProvider>
    );
}

export default App;