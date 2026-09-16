import { useState } from 'react';
import { useServer } from '../contexts/ServerContext';
import { RefreshCw, Server, CheckCircle2, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

interface ServerStatusBadgeProps {
  showDetails?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const ServerStatusBadge = ({
  showDetails = false,
  className = '',
  size = 'md',
}: ServerStatusBadgeProps) => {
  const { status, latencyMs, serverInfo, lastPingAt, errorMessage, checkConnection } = useServer();
  const [isPinging, setIsPinging] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handlePing = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsPinging(true);
    await checkConnection();
    setTimeout(() => setIsPinging(false), 300);
  };

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Badge button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 rounded-full font-medium transition-all select-none border focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        } ${
          isConnected
            ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100/90'
            : isConnecting
            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100 animate-pulse'
        }`}
        title="Click to view server connection diagnostics"
        aria-label="Server status indicator"
      >
        {/* Pulsing indicator dot */}
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isConnected ? 'bg-emerald-500' : isConnecting ? 'bg-amber-500' : 'bg-red-500'
            }`}
          />
        </span>

        <span className="font-semibold">
          {isConnected ? 'Server Connected' : isConnecting ? 'Connecting...' : 'Server Offline'}
        </span>

        {isConnected && latencyMs !== null && (
          <span className="text-[10px] opacity-75 font-mono bg-emerald-100/60 px-1.5 py-0.5 rounded">
            {latencyMs}ms
          </span>
        )}

        {showDetails && (
          <Server className="w-3 h-3 opacity-60 ml-0.5" />
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 sm:w-80 p-4 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-800 z-50 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Server Connection</h4>
                  <p className="text-[11px] text-slate-500">Live backend telemetry</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePing}
                disabled={isPinging}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                title="Test connection now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-slate-400" /> Status
                </span>
                <span className="font-semibold flex items-center gap-1 text-slate-800">
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Online & Active</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>Disconnected</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Latency (Round-trip)</span>
                <span className="font-mono font-medium text-slate-800">
                  {latencyMs !== null ? `${latencyMs} ms` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Database Layer</span>
                <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Connected
                </span>
              </div>

              {serverInfo?.uptimeSeconds !== undefined && (
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Server Uptime</span>
                  <span className="font-mono text-slate-700">
                    {Math.floor(serverInfo.uptimeSeconds / 60)}m {serverInfo.uptimeSeconds % 60}s
                  </span>
                </div>
              )}

              {lastPingAt && (
                <div className="flex items-center justify-between py-1 text-[11px] text-slate-400">
                  <span>Last Checked</span>
                  <span>{lastPingAt.toLocaleTimeString()}</span>
                </div>
              )}

              {errorMessage && !isConnected && (
                <div className="p-2 bg-red-50 text-red-700 rounded-md text-[11px] font-medium">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handlePing}
                disabled={isPinging}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                {isPinging ? 'Checking Server...' : 'Test Connection Ping'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const ServerConnectionAlert = () => {
  const { status, errorMessage, checkConnection } = useServer();
  const [reconnecting, setReconnecting] = useState(false);

  if (status !== 'disconnected') return null;

  const handleReconnect = async () => {
    setReconnecting(true);
    await checkConnection();
    setTimeout(() => setReconnecting(false), 400);
  };

  return (
    <div className="w-full bg-red-600 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          Server connection lost. {errorMessage ? `(${errorMessage})` : 'Attempting to reconnect.'}
        </span>
      </div>
      <button
        type="button"
        onClick={handleReconnect}
        disabled={reconnecting}
        className="px-3 py-1 bg-white text-red-700 hover:bg-red-50 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
      >
        <RefreshCw className={`w-3 h-3 ${reconnecting ? 'animate-spin' : ''}`} />
        {reconnecting ? 'Connecting...' : 'Reconnect Now'}
      </button>
    </div>
  );
};
