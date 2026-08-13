"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { DocumentMaterial } from "@/app/lib/data";

type FilePreviewModalProps = {
  document: DocumentMaterial | null;
  onClose: () => void;
};

export function FilePreviewModal({ document, onClose }: FilePreviewModalProps) {
  if (!document) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative h-full w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex-1">
            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{document.fileType}</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{document.title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{document.description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close preview"
          >
            <FontAwesomeIcon icon={faXmark} className="text-slate-600 dark:text-slate-300" size="lg" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-800">
          {/* @ts-ignore */}
          <iframe src={document.fileUrl} title={document.title} className="w-full h-full border-none" allowFullScreen={true} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500 dark:text-slate-400">File: {document.fileName}</p>
          <a
            href={document.fileUrl}
            download={document.fileName}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            Unduh File
          </a>
        </div>
      </div>
    </div>
  );
}
