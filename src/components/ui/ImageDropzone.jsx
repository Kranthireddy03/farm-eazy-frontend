import { useCallback, useState } from 'react';

/**
 * Drag-and-drop image upload with preview grid.
 * Uses apiClient-compatible FormData — pass onUpload(files) handler.
 */
export default function ImageDropzone({
  onFiles,
  accept = 'image/*',
  maxFiles = 8,
  label = 'Drag images here or click to browse',
  hint = 'PNG, JPG up to 5MB each',
  className = '',
}) {
  const [dragging, setDragging] = useState(false);
  const [previews, setPreviews] = useState([]);

  const processFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/')).slice(0, maxFiles);
    if (!files.length) return;

    const next = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPreviews(next);
    onFiles?.(files);
  }, [maxFiles, onFiles]);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className={className}>
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition ${
          dragging
            ? 'border-primary bg-primary/50/10'
            : 'border-border dark:border-border hover:border-primary hover:bg-primary/50/5'
        }`}
      >
        <span className="text-3xl">📂</span>
        <span className="text-sm font-semibold text-foreground dark:text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
        <input
          type="file"
          accept={accept}
          multiple={maxFiles > 1}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
      </label>

      {previews.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {previews.map((p) => (
            <div key={p.url} className="relative aspect-square rounded-xl overflow-hidden border border-border dark:border-border bg-muted dark:bg-muted">
              <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
