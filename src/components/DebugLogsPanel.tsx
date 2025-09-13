import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { debugLogger, LogLevel } from '@/lib/debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  data?: any;
}

export function DebugLogsPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isEnabled, setIsEnabled] = useState(debugLogger.isEnabled);
  const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');

  const refreshLogs = () => {
    const storedLogs = debugLogger.getLogs();
    setLogs(storedLogs);
  };

  const clearLogs = () => {
    debugLogger.clearLogs();
    setLogs([]);
  };

  const toggleLogging = () => {
    const newEnabled = !isEnabled;
    debugLogger.setEnabled(newEnabled);
    setIsEnabled(newEnabled);
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 1000); // Refresh every second
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    filter === 'ALL' || log.level === filter
  );

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR: return 'destructive';
      case LogLevel.WARN: return 'secondary';
      case LogLevel.INFO: return 'default';
      case LogLevel.DEBUG: return 'outline';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatContext = (context: any) => {
    if (!context) return null;
    return Object.entries(context)
      .filter(([key]) => key !== 'component' && key !== 'operation')
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Debug Logs</span>
          <div className="flex gap-2">
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              onClick={toggleLogging}
            >
              {isEnabled ? "Disable" : "Enable"} Logging
            </Button>
            <Button variant="outline" size="sm" onClick={refreshLogs}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logs" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="logs">Logs ({filteredLogs.length})</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="logs" className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filter === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('ALL')}
              >
                All ({logs.length})
              </Button>
              <Button
                variant={filter === LogLevel.ERROR ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(LogLevel.ERROR)}
              >
                Errors ({logs.filter(l => l.level === LogLevel.ERROR).length})
              </Button>
              <Button
                variant={filter === LogLevel.WARN ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(LogLevel.WARN)}
              >
                Warnings ({logs.filter(l => l.level === LogLevel.WARN).length})
              </Button>
              <Button
                variant={filter === LogLevel.INFO ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(LogLevel.INFO)}
              >
                Info ({logs.filter(l => l.level === LogLevel.INFO).length})
              </Button>
              <Button
                variant={filter === LogLevel.DEBUG ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(LogLevel.DEBUG)}
              >
                Debug ({logs.filter(l => l.level === LogLevel.DEBUG).length})
              </Button>
            </div>

            <ScrollArea className="h-96 w-full border rounded-md">
              <div className="p-4 space-y-2">
                {filteredLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No logs found. {!isEnabled && "Enable logging to see debug information."}
                  </p>
                ) : (
                  filteredLogs.map((log, index) => (
                    <div key={index} className="border-l-2 border-l-gray-200 pl-3 py-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLevelColor(log.level)} className="text-xs">
                          {log.level}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        {log.context?.component && (
                          <Badge variant="outline" className="text-xs">
                            {log.context.component}
                          </Badge>
                        )}
                        {log.context?.operation && (
                          <Badge variant="outline" className="text-xs">
                            {log.context.operation}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-mono">{log.message}</p>
                      {formatContext(log.context) && (
                        <p className="text-xs text-muted-foreground">
                          {formatContext(log.context)}
                        </p>
                      )}
                      {log.data && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer">
                            Data
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{logs.length}</div>
                  <p className="text-xs text-muted-foreground">Total Logs</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {logs.filter(l => l.level === LogLevel.ERROR).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {logs.filter(l => l.level === LogLevel.WARN).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {logs.filter(l => l.level === LogLevel.INFO).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Info</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Component Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(
                    logs.reduce((acc, log) => {
                      const component = log.context?.component || 'Unknown';
                      acc[component] = (acc[component] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([component, count]) => (
                    <div key={component} className="flex justify-between text-sm">
                      <span>{component}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
