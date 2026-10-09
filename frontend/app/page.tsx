'use client';

import Link from 'next/link';
import { useState, type FormEvent, type ChangeEvent, useRef } from 'react';
import { apiFetch, type ApiError } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { UploadCloud, CheckCircle2, AlertCircle, X, Shield, FileText, Upload } from 'lucide-react';

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;
const MAX_CHARS = 3000;

export default function Home() {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'uploading_media' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    const newFiles = [...files, ...selectedFiles];
    const images = newFiles.filter(f => f.type.startsWith('image/'));
    const videos = newFiles.filter(f => f.type.startsWith('video/'));

    if (images.length > MAX_IMAGES) {
      alert(`Bạn chỉ có thể tải lên tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }
    if (videos.length > MAX_VIDEOS) {
      alert(`Bạn chỉ có thể tải lên tối đa ${MAX_VIDEOS} video.`);
      return;
    }
    if (images.length > 0 && videos.length > 0) {
      alert('Vui lòng tải lên ảnh HOẶC video, không tải cả hai.');
      return;
    }

    setFiles(newFiles);
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  async function uploadFileToR2(file: File): Promise<string> {
    const presignedData = await apiFetch<{ presignedUrl: string; storageKey: string }>('/media/presigned-url', {
      method: 'POST',
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
      }),
    });

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
    if (content.trim().length < 20) {
      setErrorMessage('Nội dung confession quá ngắn. Tối thiểu 20 ký tự.');
      setStatus('error');
      return;
    }
    if (content.trim().length > MAX_CHARS) {
      setErrorMessage(`Nội dung confession quá dài. Tối đa ${MAX_CHARS} ký tự.`);
      setStatus('error');
      return;
    }

    setErrorMessage('');
    const mediaIds: string[] = [];

    try {
      if (files.length > 0) {
        setStatus('uploading_media');
        for (let i = 0; i < files.length; i++) {
          setProgress(`Đang tải lên tệp ${i + 1} / ${files.length}...`);
          const mediaId = await uploadFileToR2(files[i]);
          mediaIds.push(mediaId);
        }
      }

      setStatus('submitting');
      setProgress('Đang gửi confession...');
      
      await apiFetch('/submissions', {
        method: 'POST',
        body: JSON.stringify({ content, mediaIds }),
      });
      
      setStatus('success');
      setContent('');
      setFiles([]);
    } catch (error) {
      const apiErr = error as ApiError;
      setErrorMessage(apiErr.message || (error as Error).message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      setStatus('error');
    }
  }

  const isLoading = status === 'uploading_media' || status === 'submitting';

  return (
    <div className="flex min-h-full flex-col bg-page text-text-primary">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">TYS <span className="font-normal text-text-secondary">/ Confession</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-text-secondary">
            <Link href="/" className="text-primary font-semibold">Trang chủ</Link>
            <Link href="#" className="hover:text-primary transition-colors">Cách hoạt động</Link>
            <Link href="#" className="hover:text-primary transition-colors">Nội quy</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden md:inline-flex" onClick={() => window.location.href = '/admin'}>Quản trị viên</Button>
            <Button className="h-10 px-4 text-[14px]" onClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })}>Gửi confession</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-12 md:flex-row">
        {/* Left Column: Form & Intro */}
        <div className="flex-1 space-y-12">
          {/* Hero Intro */}
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Chia sẻ ẩn danh · Không cần tài khoản</p>
            <h1 className="text-[42px] font-bold leading-[50px] tracking-tight">
              Điều bạn muốn chia sẻ, TYS luôn lắng nghe.
            </h1>
            <p className="text-lg text-text-secondary">
              Gửi câu chuyện, tâm sự hoặc lời nhắn của bạn đến TYS. Bạn không cần tạo tài khoản để gửi confession.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Button onClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })}>Gửi confession</Button>
              <Button variant="ghost">Tìm hiểu cách hoạt động</Button>
            </div>
          </div>

          {/* Submission Form Section */}
          <div id="form-section">
            {status === 'success' ? (
              <Card className="border-success/20 bg-success/5 shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 rounded-full bg-success/10 p-3 text-success">
                    <CheckCircle2 size={32} />
                  </div>
                  <CardTitle className="mb-2 text-2xl text-success">Gửi confession thành công!</CardTitle>
                  <p className="text-text-secondary mb-8">
                    Cảm ơn bạn đã chia sẻ cùng TYS. Nội dung của bạn đang chờ quản trị viên kiểm duyệt trước khi được đăng tải.
                  </p>
                  <Button onClick={() => setStatus('idle')} variant="outline">Gửi confession khác</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Bạn muốn chia sẻ điều gì?</CardTitle>
                  <p className="text-[14px] text-text-secondary">Một lời nhắn nhỏ, một câu chuyện thật. TYS lắng nghe bạn.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {status === 'error' && (
                      <div className="flex items-center gap-3 rounded-[8px] border border-error/20 bg-error/5 p-4 text-[14px] text-error">
                        <AlertCircle size={20} />
                        <p>{errorMessage}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[14px] font-semibold">Nội dung confession <span className="text-error">*</span></label>
                        <span className="text-[12px] text-text-secondary">{content.length} / {MAX_CHARS} ký tự</span>
                      </div>
                      <Textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Viết những điều bạn muốn gửi đến TYS..."
                        rows={6}
                        disabled={isLoading}
                        error={content.length > MAX_CHARS || (status === 'error' && content.trim().length < 20)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[14px] font-semibold">Ảnh hoặc video đính kèm (không bắt buộc)</label>
                      <div 
                        className={`flex flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed ${files.length > 0 ? 'border-border/50 bg-page/50' : 'border-border bg-page/30'} p-8 transition-colors hover:bg-page`}
                      >
                        <UploadCloud className="text-primary opacity-50" size={32} />
                        <p className="text-[14px] font-medium">Kéo thả ảnh hoặc video vào đây</p>
                        <p className="text-[12px] text-text-secondary text-center">JPEG, PNG, WebP - MP4, MOV nếu được hỗ trợ<br/>Tập đính kèm là tùy chọn, không chỉnh sửa media.</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="mt-2 h-10 px-4 text-[14px]"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading}
                        >
                          Thêm ảnh hoặc video
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                          onChange={handleFileChange}
                          className="hidden"
                          disabled={isLoading}
                        />
                      </div>

                      {files.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2">
                          {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-[8px] border border-border bg-white p-3 shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-page text-primary">
                                  {file.type.startsWith('image/') ? <Upload size={20} /> : <FileText size={20} />}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="truncate text-[14px] font-medium">{file.name}</span>
                                  <span className="text-[12px] text-text-secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="p-2 text-text-secondary hover:text-error transition-colors"
                                disabled={isLoading}
                              >
                                <X size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                        isLoading={isLoading}
                      >
                        {isLoading ? progress : 'Gửi confession'}
                      </Button>
                      <p className="mt-4 text-center text-[12px] text-text-secondary">
                        Bằng việc gửi, bạn đồng ý với các <a href="#" className="text-primary hover:underline">nội quy cộng đồng</a> của TYS.
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Right Column: Info Boxes */}
        <div className="w-full md:w-[320px] lg:w-[380px] shrink-0 space-y-6">
          <Card className="bg-light-blue/30 border-none shadow-none">
            <CardHeader className="pb-3">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                <Shield size={20} />
              </div>
              <CardTitle className="text-[18px]">Gửi bằng sự tôn trọng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[14px] text-text-secondary">
              <p><strong className="text-text-primary">Không chia sẻ thông tin cá nhân</strong> của mình hoặc người khác.</p>
              <p><strong className="text-text-primary">Không quấy rối, đe dọa</strong> hay đưa ra cáo buộc ác ý.</p>
              <p>Quản trị viên có thể từ chối nội dung không phù hợp.</p>
              <Link href="#" className="inline-flex font-semibold text-primary hover:underline">Đọc đầy đủ nội quy →</Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-white py-8 text-center text-[14px] text-text-secondary">
        <p>TYS — Chung một mái nhà.</p>
      </footer>
    </div>
  );
}
