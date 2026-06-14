import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export interface SSHConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

export class SSHTerminal {
  private terminal: Terminal;
  private fitAddon: FitAddon;
  private ws: WebSocket | null = null;
  private container: HTMLElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;

    this.terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      theme: {
        background: '#0a0a0a',
        foreground: '#4af626',
        cursor: '#14d1ff',
        cursorAccent: '#0a0a0a',
        selectionBackground: '#273747',
        black: '#01060e',
        red: '#ea6c73',
        green: '#91b362',
        yellow: '#f9af4f',
        blue: '#53bdfa',
        magenta: '#fae994',
        cyan: '#90e1c6',
        white: '#c7c7c7',
        brightBlack: '#686868',
        brightRed: '#f07178',
        brightGreen: '#c2d94c',
        brightYellow: '#ffb454',
        brightBlue: '#59c2ff',
        brightMagenta: '#ffee99',
        brightCyan: '#95e6cb',
        brightWhite: '#ffffff',
      },
      allowProposedApi: true,
      scrollback: 10000,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.loadAddon(new WebLinksAddon());

    window.addEventListener('resize', () => this.fit());
  }

  mount(): void {
    this.terminal.open(this.container);
    this.fit();

    this.terminal.writeln('\x1b[1;33m╔══════════════════════════════════╗\x1b[0m');
    this.terminal.writeln('\x1b[1;33m║     CloudSSH Web Terminal        ║\x1b[0m');
    this.terminal.writeln('\x1b[1;33m║     Powered by Cloudflare        ║\x1b[0m');
    this.terminal.writeln('\x1b[1;33m╚══════════════════════════════════╝\x1b[0m');
    this.terminal.writeln('');
  }

  async connect(config: SSHConnectionConfig): Promise<void> {
    this.terminal.writeln(
      `\x1b[1;33m[*] Connecting to ${config.username}@${config.host}:${config.port}...\x1b[0m`
    );

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/api/ssh`;

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.terminal.writeln('\x1b[32m[+] WebSocket connected, sending credentials...\x1b[0m');
        this.ws?.send(
          JSON.stringify({
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
          })
        );
        resolve();
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data === 'string') {
          try {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
              case 'status':
                this.terminal.writeln(`\x1b[32m[*] ${msg.message}\x1b[0m`);
                break;
              case 'error':
                this.terminal.writeln(`\x1b[31m[!] ${msg.message}\x1b[0m`);
                break;
            }
          } catch {
            this.terminal.write(event.data);
          }
        } else {
          const reader = new FileReader();
          reader.onload = () => {
            this.terminal.write(new Uint8Array(reader.result as ArrayBuffer));
          };
          reader.readAsArrayBuffer(event.data);
        }
      };

      this.ws.onclose = (event) => {
        this.terminal.writeln(
          `\x1b[33m[*] Connection closed (code=${event.code})\x1b[0m`
        );
        document.getElementById('term-status')!.innerHTML = '<div class="w-2 h-2 bg-red-500"></div> Disconnected';
      };

      this.ws.onerror = () => {
        this.terminal.writeln('\x1b[31m[!] Connection error\x1b[0m');
        reject(new Error('WebSocket connection failed'));
      };

      this.terminal.onData((data) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(data);
        }
      });

      this.terminal.onResize(({ cols, rows }) => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'resize',
            cols,
            rows,
          }));
        }
      });
    });
  }

  fit(): void {
    this.fitAddon.fit();
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }

  dispose(): void {
    this.disconnect();
    this.terminal.dispose();
  }
}
