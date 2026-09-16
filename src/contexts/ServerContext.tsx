import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import api from '../api/axios';

export interface ServerInfo {
  status: string;
  connected: boolean;
  message?: string;
  time?: string;
  uptimeSeconds?: number;
  environment?: string;
  service?: string;
  database?: string;
}

export type ServerConnectionStatus = 'connected' | 'connecting' | 'disconnected';

interface ServerContextType {
  status: ServerConnectionStatus;
  latencyMs: number | null;
  serverInfo: ServerInfo | null;
  lastPingAt: Date | null;
  errorMessage: string | null;
  checkConnection: () => Promise<boolean>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const ServerProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<ServerConnectionStatus>('connecting');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [lastPingAt, setLastPingAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const startTime = performance.now();
    try {
      // Use cache-busting timestamp to measure real-time response latency
      const response = await api.get<ServerInfo>(`/health?_t=${Date.now()}`, {
        timeout: 8000,
      });

      const elapsed = Math.round(performance.now() - startTime);

      if (response.data && (response.data.status === 'ok' || response.data.connected)) {
        setStatus('connected');
        setLatencyMs(elapsed);
        setServerInfo(response.data);
        setLastPingAt(new Date());
        setErrorMessage(null);
        return true;
      } else {
        setStatus('disconnected');
        setErrorMessage('Server returned unexpected status');
        return false;
      }
    } catch (err: any) {
      // Fallback check on /api/health
      try {
        const fallbackRes = await api.get<ServerInfo>(`/health?_t=${Date.now()}`, {
          baseURL: '/api',
          timeout: 8000,
        });
        const elapsed = Math.round(performance.now() - startTime);
        if (fallbackRes.data) {
          setStatus('connected');
          setLatencyMs(elapsed);
          setServerInfo(fallbackRes.data);
          setLastPingAt(new Date());
          setErrorMessage(null);
          return true;
        }
      } catch (fallbackErr) {
        // continue to disconnected handler
      }

      setStatus('disconnected');
      setLatencyMs(null);
      setErrorMessage(
        err.code === 'ECONNABORTED'
          ? 'Connection timed out'
          : err.response?.data?.message || 'Unable to connect to server'
      );
      return false;
    }
  }, []);

  // Initial ping on mount & periodic polling
  useEffect(() => {
    checkConnection();

    const interval = setInterval(() => {
      checkConnection();
    }, 25000);

    const handleOnline = () => {
      checkConnection();
    };

    const handleOffline = () => {
      setStatus('disconnected');
      setErrorMessage('Browser is offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  return (
    <ServerContext.Provider
      value={{
        status,
        latencyMs,
        serverInfo,
        lastPingAt,
        errorMessage,
        checkConnection,
      }}
    >
      {children}
    </ServerContext.Provider>
  );
};

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};
