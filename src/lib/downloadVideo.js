import { toast } from 'sonner';

/**
 * Download a video file to the user's laptop.
 * 1. Tries showSaveFilePicker — shows a native "Save As" dialog (Chrome/Edge)
 * 2. Falls back to blob download → browser Downloads folder
 * 3. Last resort: open in new tab with right-click instructions
 */
export async function downloadVideo(url, title) {
  if (!url) return;
  const filename = `${(title || 'video').replace(/[^a-z0-9_\- ]/gi, '').trim() || 'video'}.mp4`;

  // ── Option 1: Native Save As dialog (Chrome 86+ / Edge) ─────────────────
  if ('showSaveFilePicker' in window) {
    let fileHandle;
    try {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'MP4 Video', accept: { 'video/mp4': ['.mp4'] } }],
      });
    } catch (err) {
      if (err.name === 'AbortError') return; // user cancelled the dialog
      // showSaveFilePicker failed for other reason — fall through
    }

    if (fileHandle) {
      const toastId = toast.loading('Saving video to your chosen location…');
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        toast.success('Video saved!', { id: toastId });
      } catch (err) {
        toast.error('Save failed: ' + err.message, { id: toastId });
      }
      return;
    }
  }

  // ── Option 2: Blob download → browser Downloads folder ──────────────────
  const toastId = toast.loading('Preparing download…');
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
    toast.success('Download started! Check your Downloads folder.', { id: toastId });
  } catch {
    toast.dismiss(toastId);
    // ── Option 3: Open in new tab, user right-clicks to save ──────────────
    window.open(url, '_blank');
    toast.info(
      'Video opened in a new tab — right-click the video → "Save video as…" to save it to your laptop.',
      { duration: 10000 }
    );
  }
}
