/**
 * Terminal integration type definitions
 */

/**
 * Terminal options
 */
export interface TerminalOptions {
  /** Working directory */
  cwd: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Columns (width) */
  cols?: number;
  /** Rows (height) */
  rows?: number;
  /** Shell to use */
  shell?: string;
}

/**
 * Terminal data event
 */
export interface TerminalDataEvent {
  /** Data received from terminal */
  data: string;
}

/**
 * Terminal exit event
 */
export interface TerminalExitEvent {
  /** Exit code */
  exitCode: number;
  /** Signal that caused exit, if any */
  signal?: number;
}

/**
 * Terminal interface
 */
export interface ITerminal {
  /** Write data to terminal */
  write(data: string): void;

  /** Resize terminal */
  resize(cols: number, rows: number): void;

  /** Kill terminal process */
  kill(signal?: string): void;

  /** Get process ID */
  getPid(): number;

  /** Subscribe to data events */
  onData(callback: (event: TerminalDataEvent) => void): () => void;

  /** Subscribe to exit events */
  onExit(callback: (event: TerminalExitEvent) => void): () => void;
}
