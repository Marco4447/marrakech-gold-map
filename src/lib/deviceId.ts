/**
 * Shared device ID generator.
 * Returns a persistent UUID stored in localStorage.
 */
export function getDeviceId(): string {
  let id = localStorage.getItem("wk_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wk_device_id", id);
  }
  return id;
}
