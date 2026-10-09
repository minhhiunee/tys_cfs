'use client';

import Link from 'next/link';
import Image from 'next/image';
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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  }

  function processFiles(selectedFiles: File[]) {
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
    <div className="relative flex min-h-full flex-col bg-page text-text-primary overflow-hidden">
      {/* Decorative Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Soft radial gradient layer */}
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-light-blue via-[#e0f4ff]/40 to-transparent opacity-70 blur-[100px]"></div>
        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-bl from-lavender/60 via-lavender/20 to-transparent opacity-60 blur-[100px]"></div>
        {/* Abstract shape (bubble) */}
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[350px] rounded-[120px_60px_120px_100px] bg-primary/5 opacity-50 blur-[60px] rotate-12"></div>
      </div>

      <header className="sticky top-0 z-20 border-b border-border/60 bg-white/80 backdrop-blur-md px-6 py-4 shadow-[0_2px_10px_rgb(20,86,160,0.03)] transition-all">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <Image src="/logotys-01.png" alt="TYS Logo" width={40} height={40} className="object-contain" priority />
            <span className="text-xl font-bold tracking-tight text-navy">TYS <span className="font-normal text-text-secondary">/ Confession</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-text-secondary">
            <Link href="/" className="text-primary font-semibold">Trang chủ</Link>
            <Link href="#" className="hover:text-primary transition-colors">Cách gửi lời nhắn</Link>
            <Link href="#" className="hover:text-primary transition-colors">Nội quy</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="hidden md:inline-flex border-primary/20 hover:border-primary/40" onClick={() => window.location.href = '/admin'}>Quản trị viên</Button>
            <Button className="h-10 px-4 text-[14px]" onClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })}>Gửi lời nhắn</Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-12 md:flex-row">
        {/* Left Column: Form & Intro */}
        <div className="flex-1 space-y-12">
          {/* Hero Intro */}
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Một góc nhỏ để chia sẻ cùng TYS</p>
            <h1 className="text-[42px] font-bold leading-[50px] tracking-tight text-navy">
              Có điều muốn nói? Kể TYS nghe nhé.
            </h1>
            <p className="text-lg text-text-secondary">
              Một lời cảm ơn, một câu chuyện nho nhỏ hay điều bạn vẫn giữ trong lòng — bạn có thể chia sẻ tại đây. TYS sẽ lắng nghe.
            </p>
            <div className="flex items-center gap-4 pt-4">
              <Button onClick={() => document.getElementById('form-section')?.scrollIntoView({ behavior: 'smooth' })}>Gửi lời nhắn</Button>
              <Button variant="ghost">Cách gửi lời nhắn</Button>
            </div>
          </div>

          {/* Submission Form Section */}
          <div id="form-section">
            {status === 'success' ? (
              <Card className="border-success/20 bg-success/5 shadow-none transition-all duration-300">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 rounded-full bg-success/10 p-3 text-success">
                    <CheckCircle2 size={32} />
                  </div>
                  <CardTitle className="mb-2 text-2xl text-success">Đã gửi thành công</CardTitle>
                  <p className="text-text-secondary mb-8">
                    Cảm ơn bạn đã chia sẻ. TYS đã tiếp nhận lời nhắn của bạn.
                  </p>
                  <Button onClick={() => setStatus('idle')} variant="outline" className="border-success/30 text-success hover:bg-success/10 hover:border-success/50">Gửi lời nhắn khác</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-t-[3px] border-t-primary border-x-border border-b-border bg-white shadow-[0_8px_30px_rgb(20,86,160,0.06)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(20,86,160,0.1)] overflow-hidden rounded-xl">
                <CardHeader className="bg-white/50 pb-4">
                  <CardTitle className="text-navy text-[22px] font-bold">Hôm nay, bạn muốn kể điều gì?</CardTitle>
                  <p className="text-[14px] text-text-secondary mt-1">Cứ viết theo cách của bạn nhé. Một vài dòng cũng đủ để bắt đầu.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    {status === 'error' && (
                      <div className="flex items-center gap-3 rounded-[8px] border border-error/20 bg-error/5 p-4 text-[14px] text-error transition-all duration-300">
                        <AlertCircle size={20} />
                        <p>{errorMessage}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-[14px] font-semibold text-navy">Nội dung lời nhắn <span className="text-error">*</span></label>
                        <span className="text-[12px] text-text-secondary">{content.length} / {MAX_CHARS} ký tự</span>
                      </div>
                      <Textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Có điều gì bạn muốn gửi đến TYS hoặc mọi người? Viết ở đây nhé…"
                        rows={6}
                        disabled={isLoading}
                        error={content.length > MAX_CHARS || (status === 'error' && content.trim().length < 20)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[14px] font-semibold text-navy">Muốn gửi kèm một tấm ảnh?</label>
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`group flex flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed p-8 transition-all duration-200 ${
                          isDragging 
                            ? 'border-primary bg-light-blue shadow-[0_0_20px_rgba(22,119,210,0.15)] scale-[1.01]' 
                            : files.length > 0 
                              ? 'border-border/50 bg-light-blue/40 hover:bg-light-blue/60' 
                              : 'border-border bg-page/40 hover:bg-light-blue/30 hover:border-primary/40'
                        }`}
                      >
                        <UploadCloud className={`${isDragging ? 'text-primary scale-125' : 'text-primary/60'} transition-transform duration-200 group-hover:scale-110 group-hover:text-primary`} size={32} />
                        <p className={`text-[14px] font-medium transition-colors ${isDragging ? 'text-primary' : 'text-navy'}`}>Kéo thả tệp vào đây hoặc chọn từ thiết bị</p>
                        <p className="text-[12px] text-text-secondary text-center">Nếu có hình ảnh hay video muốn chia sẻ, bạn có thể đính kèm bên dưới. Không bắt buộc đâu nhé.<br/>Hỗ trợ JPEG, PNG, WebP hoặc MP4.</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="mt-2 h-10 px-4 text-[14px] border-primary/20 text-primary hover:bg-light-blue"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading}
                        >
                          Chọn ảnh hoặc video
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
                            <div key={idx} className="flex items-center justify-between rounded-[8px] border border-border bg-white p-3 shadow-sm transition-all hover:border-primary/30">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] bg-light-blue text-primary">
                                  {file.type.startsWith('image/') ? <Upload size={20} /> : <FileText size={20} />}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="truncate text-[14px] font-medium text-navy">{file.name}</span>
                                  <span className="text-[12px] text-text-secondary">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-full transition-colors"
                                disabled={isLoading}
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full text-lg shadow-sm"
                        disabled={isLoading}
                        isLoading={isLoading}
                      >
                        {isLoading ? 'Đang gửi...' : 'Gửi lời nhắn'}
                      </Button>
                      <p className="mt-4 text-center text-[12px] text-text-secondary">
                        Trước khi gửi, bạn nhớ xem qua <Link href="#" className="text-primary hover:underline">nội quy cộng đồng</Link> nhé.
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
          <Card className="bg-light-blue/60 border-primary/10 shadow-[0_4px_20px_rgb(20,86,160,0.04)] backdrop-blur-sm">
            <CardHeader className="pb-3 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[10px] bg-white text-primary shadow-sm border border-primary/10 relative z-10">
                <Shield size={22} className="opacity-90" />
              </div>
              <CardTitle className="text-[18px] text-navy font-bold relative z-10">Cùng nhau giữ một góc nhỏ tử tế</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-[14px] text-text-secondary leading-relaxed">
              <p>Đừng chia sẻ thông tin riêng tư của mình hay của người khác. Mỗi lời nhắn sẽ ý nghĩa hơn khi được viết bằng sự chân thành và tôn trọng.</p>
              <p><strong className="text-navy font-semibold">Không công kích, đe dọa</strong> hay lan truyền thông tin chưa được kiểm chứng.</p>
              <Link href="#" className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary-hover transition-colors mt-2 group">
                Xem nội quy cộng đồng 
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border/60 bg-white/50 backdrop-blur-md py-8 text-center text-[14px] text-text-secondary">
        <p>TYS — Nơi những câu chuyện được sẻ chia.</p>
      </footer>
    </div>
  );
}
