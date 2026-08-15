export async function copyToClipboard(value: string): Promise<void> {
  if (!value) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function downloadText(
  value: string,
  filename: string,
  type = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([value], { type });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
}

export function downloadBytes(
  value: BlobPart | Uint8Array<ArrayBufferLike>,
  filename: string,
  type = "application/octet-stream",
): void {
  const part =
    value instanceof Uint8Array ? Uint8Array.from(value).buffer : value;
  const blob = value instanceof Blob ? value : new Blob([part], { type });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 0);
}
