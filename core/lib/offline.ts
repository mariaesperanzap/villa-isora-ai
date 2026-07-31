export class OfflineModeError extends Error {
  constructor(operation: string) {
    super(`External operation blocked while OFFLINE_MODE is enabled: ${operation}`);
    this.name = 'OfflineModeError';
  }
}

export function isOfflineMode(): boolean {
  return process.env.OFFLINE_MODE !== 'off';
}

export function assertExternalAccessAllowed(operation: string): void {
  if (isOfflineMode()) throw new OfflineModeError(operation);
}
