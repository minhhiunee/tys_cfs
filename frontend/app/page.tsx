'use client';

import Link from 'next/link';
import { useState, type FormEvent, type ChangeEvent } from 'react';
import { apiFetch, type ApiError } from '../lib/api';

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;

export default function Home() {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading_media' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState('');

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    // Simple validation (can be more robust)
    const images = selectedFiles.filter(f => f.type.startsWith('image/'));
    const videos = selectedFiles.filter(f => f.type.startsWith('video/'));

    if (images.length > MAX_IMAGES) {
      alert(`You can only upload up to ${MAX_IMAGES} images.`);
      return;
    }
    if (videos.length > MAX_VIDEOS) {
      alert(`You can only upload up to ${MAX_VIDEOS} video.`);
      return;
    }
    if (images.length > 0 && videos.length > 0) {
      alert('Please upload either images OR a video, not both. (As per standard behavior, though you can adjust this rule)');
      return;
    }

    setFiles(selectedFiles);
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  async function uploadFileToR2(file: File): Promise<string> {
    // 1. Get presigned URL
    const presignedData = await apiFetch<{ presignedUrl: string; storageKey: string }>('/media/presigned-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      }),
    });

    // 2. Upload to R2 directly (using native fetch, NO credentials)
    const uploadRes = await fetch(presignedData.presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to upload ${file.name}`);
    }

    // 3. Confirm upload with backend
    const completeData = await apiFetch<{ mediaId: string }>('/media/complete', {
      method: 'POST',
      body: JSON.stringify({
        storageKey: presignedData.storageKey,
      }),
    });

    return completeData.mediaId;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (content.trim().length < 10) {
      setErrorMessage('Confession must be at least 10 characters.');
      setStatus('error');
      return;
    }

    setErrorMessage('');
    const mediaIds: string[] = [];

    try {
      // Upload media if any
      if (files.length > 0) {
        setStatus('uploading_media');
        for (let i = 0; i < files.length; i++) {
          setProgress(`Uploading file ${i + 1} of ${files.length}...`);
          const mediaId = await uploadFileToR2(files[i]);
          mediaIds.push(mediaId);
        }
      }

      // Submit confession
      setStatus('submitting');
      setProgress('Saving confession...');
      
      await apiFetch('/submissions', {
        method: 'POST',
        body: JSON.stringify({ content, mediaIds }),
      });
      
      setStatus('success');
      setContent('');
      setFiles([]);
    } catch (error) {
      const apiErr = error as ApiError;
      setErrorMessage(apiErr.message || (error as Error).message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  const isLoading = status === 'uploading_media' || status === 'submitting';

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">CFS</span>
          <Link
            href="/admin"
            className="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
          >
            Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-12">
        {status === 'success' ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-green-800">
              Submitted successfully!
            </h2>
            <p className="mt-2 text-sm text-green-700">
              Your confession (and media) has been sent and is awaiting moderation.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Submit another
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold leading-tight">
              Share anonymously
            </h1>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Submit your confession for moderation. You can attach up to 5 images or 1 video.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              {status === 'error' && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="relative">
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={6}
                  className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base placeholder-zinc-400 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  disabled={isLoading}
                />
                <div className="absolute bottom-3 right-3 text-xs text-zinc-400">
                  {content.length}/5000
                </div>
              </div>

              {/* Media Attachments */}
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-zinc-700">
                  Attach Media (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200"
                  disabled={isLoading}
                />
                
                {files.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-2">
                    {files.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm">
                        <span className="truncate text-zinc-600 max-w-[200px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-red-500 hover:text-red-700"
                          disabled={isLoading}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-zinc-900 px-4 py-3.5 text-base font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? progress : 'Submit Confession'}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
