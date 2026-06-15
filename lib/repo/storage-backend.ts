export function useJsonStore(): boolean {
  return process.env.STORAGE_BACKEND === 'json';
}
