import { SSHTerminal } from './terminal';

export class ConnectionForm {
  private terminal: SSHTerminal;

  constructor(terminal: SSHTerminal) {
    this.terminal = terminal;
    this.render();
  }

  private render(): void {
    const container = document.getElementById('connection-form-container')!;

    container.innerHTML = `
      <form class="space-y-6" id="connection-form">
        <div class="grid grid-cols-4 gap-4">
          <div class="col-span-3">
            <label class="block text-xs font-bold tracking-[0.1em] text-[#bbccb0] mb-2">HOST_ADDRESS</label>
            <div class="flex items-center">
              <span class="text-[#bbccb0] mr-2">&gt;</span>
              <input id="host" class="terminal-input text-[13px]" placeholder="192.168.1.1" type="text" required>
            </div>
          </div>
          <div class="col-span-1">
            <label class="block text-xs font-bold tracking-[0.1em] text-[#bbccb0] mb-2">PORT</label>
            <div class="flex items-center">
              <span class="text-[#bbccb0] mr-2">:</span>
              <input id="port" class="terminal-input text-[13px]" placeholder="22" type="text" value="22">
            </div>
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold tracking-[0.1em] text-[#bbccb0] mb-2">AUTH_USER</label>
          <div class="flex items-center">
            <span class="material-symbols-outlined text-[#bbccb0] mr-2" style="font-size: 16px;">person</span>
            <input id="username" class="terminal-input text-[13px]" placeholder="admin" type="text" required>
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold tracking-[0.1em] text-[#bbccb0] mb-2">AUTH_KEY</label>
          <div class="flex items-center">
            <span class="material-symbols-outlined text-[#bbccb0] mr-2" style="font-size: 16px;">key</span>
            <input id="password" class="terminal-input text-[13px]" placeholder="••••••••" type="password" required>
          </div>
        </div>
        <div class="pt-6">
          <button id="connect-btn" class="cyber-button w-full py-3 px-4 text-xs font-bold tracking-[0.1em] uppercase flex items-center justify-center gap-2 bg-[#4af626] text-[#022100]" type="button">
            <span class="material-symbols-outlined" style="font-size: 18px;">power_settings_new</span>
            Execute_Connection
          </button>
        </div>
        <div class="flex justify-between items-center mt-4">
          <span id="status-text" class="text-[13px] text-[#bbccb0] flex items-center gap-1">
            <span class="w-2 h-2 bg-[#353534] inline-block"></span> STATUS: OFFLINE
          </span>
        </div>
      </form>
    `;

    document.getElementById('connect-btn')!.addEventListener('click', () => {
      this.handleConnect();
    });

    document.getElementById('connection-form')!.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.handleConnect();
    });
  }

  private async handleConnect(): Promise<void> {
    const host = (document.getElementById('host') as HTMLInputElement).value;
    const port = parseInt(
      (document.getElementById('port') as HTMLInputElement).value || '22'
    );
    const username = (document.getElementById('username') as HTMLInputElement).value;
    const password = (document.getElementById('password') as HTMLInputElement).value;

    if (!host || !username || !password) {
      alert('请填写所有必填字段');
      return;
    }

    const authSection = document.getElementById('auth-section')!;
    const termSection = document.getElementById('terminal-section')!;

    authSection.classList.add('hidden');
    termSection.classList.remove('hidden');
    termSection.classList.add('flex');

    document.getElementById('term-host')!.textContent = 'Host: ' + host;
    document.getElementById('term-user')!.textContent = 'User: ' + username;
    document.getElementById('term-port')!.textContent = 'Port: ' + port;

    this.terminal.mount();

    try {
      await this.terminal.connect({ host, port, username, password });
    } catch (error) {
      termSection.classList.add('hidden');
      termSection.classList.remove('flex');
      authSection.classList.remove('hidden');
      document.getElementById('status-text')!.innerHTML = '<span class="w-2 h-2 bg-[#353534] inline-block"></span> STATUS: OFFLINE';
    }
  }
}
