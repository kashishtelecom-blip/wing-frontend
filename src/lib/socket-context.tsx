'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { getToken } from './auth';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  onlineUsers: Set<string>;
  isOnline: (userId: string) => boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  onlineUsers: new Set(),
  isOnline: () => false,
});

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = getToken();
    if (!user || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
        setOnlineUsers(new Set());
      }
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      // 👇 THIS IS THE FIX: Start with polling, then upgrade to websocket
      transports: ['polling', 'websocket'], 
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
      setConnected(true);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setConnected(false);
    });
    
    newSocket.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
    });

    newSocket.on('online-users', (ids: string[]) => {
      setOnlineUsers(new Set(ids));
    });
    
    newSocket.on('user-online', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });
    
    newSocket.on('user-offline', ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      setSocket(null);
      setConnected(false);
      setOnlineUsers(new Set());
    };
  }, [user]);

  const isOnline = (userId: string) => onlineUsers.has(userId);

  return (
    <SocketContext.Provider
      value={{ socket, connected, onlineUsers, isOnline }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}