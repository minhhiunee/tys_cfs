'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type { AdminInfo, Submission, SubmissionStatus } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, type BadgeStatus } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { 
  LayoutDashboard, Clock, CheckCircle, XCircle, Share, List, LogOut, 
  Search, X, Menu, ExternalLink, Download, Copy, Trash2
} from 'lucide-react';

interface DashboardStats {
  PENDING: number;
  APPROVED: number;
  REJECTED: number;
  POSTED: number;
  HIDDEN: number;
  ALL: number;
}

interface SubmissionsResponse {
  items: Submission[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const TABS: { id: SubmissionStatus | 'ALL'; label: string; icon: any }[] = [
  { id: 'ALL', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'PENDING', label: 'Chờ duyệt', icon: Clock },
  { id: 'APPROVED', label: 'Đã duyệt', icon: CheckCircle },
  { id: 'REJECTED', label: 'Từ chối', icon: XCircle },
  { id: 'POSTED', label: 'Đã đăng', icon: Share },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<SubmissionStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingList, setLoadingList] = useState(false);
  
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [editedCaption, setEditedCaption] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [newPlatform, setNewPlatform] = useState('FACEBOOK');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    apiFetch<{ admin: AdminInfo }>('/auth/me')
      .then((data) => {
        setAdmin(data.admin);
        return fetchStats();
      })
      .catch(() => router.replace('/admin/login'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!admin) return;
    setLoadingList(true);
    const statusQuery = activeTab === 'ALL' ? '' : `&status=${activeTab}`;
    apiFetch<SubmissionsResponse>(`/admin/submissions?page=${page}&limit=10${statusQuery}`)
      .then((data) => {
        setSubmissions(data.items);
        setTotalPages(data.meta.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoadingList(false));
  }, [admin, activeTab, page]);

  async function fetchStats() {
    try {
      const data = await apiFetch<Omit<DashboardStats, 'ALL'>>('/admin/dashboard/stats');
      setStats({
        ...data,
        ALL: Object.values(data).reduce((a, b) => a + b, 0)
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleLogout() {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {}
    window.location.href = '/admin/login';
  }

  async function updateStatus(id: string, status: SubmissionStatus) {
    setIsUpdating(true);
    try {
      await apiFetch(`/admin/submissions/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      // Refresh list & stats
      setSubmissions(submissions.map(s => s.id === id ? { ...s, status } : s));
      if (selectedSubmission) {
        setSelectedSubmission({ ...selectedSubmission, status });
      }
      fetchStats();
    } catch (e) {
      alert('Lỗi cập nhật trạng thái');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleAddSocialPost() {
    if (!selectedSubmission) return;
    setIsUpdating(true);
    try {
      const updatedSub = await apiFetch<Submission>(`/admin/submissions/${selectedSubmission.id}/social-posts`, {
        method: 'POST',
        body: JSON.stringify({ platform: newPlatform, externalUrl: newUrl, caption: editedCaption })
      });
      
      setSubmissions(submissions.map(s => s.id === updatedSub.id ? updatedSub : s));
      setSelectedSubmission(updatedSub);
      setNewUrl('');
      alert('Đã thêm bài đăng MXH!');
    } catch (e) {
      alert('Lỗi khi thêm bài đăng MXH');
    } finally {
      setIsUpdating(false);
    }
  }

  async function hardDelete(id: string) {
    if (!confirm('Bạn có chắc chắn muốn xóa vĩnh viễn bài đăng này? Hành động này không thể hoàn tác.')) return;

    setIsUpdating(true);
    try {
      await apiFetch(`/admin/submissions/${id}/hard-delete`, {
        method: 'POST'
      });
      setSubmissions(submissions.filter(s => s.id !== id));
      setSelectedSubmission(null);
      fetchStats();
      alert('Đã xóa vĩnh viễn!');
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xóa bài');
    } finally {
      setIsUpdating(false);
    }
  }

  async function saveCaption() {
    if (!selectedSubmission) return;
    setIsUpdating(true);
    try {
      await apiFetch(`/admin/submissions/${selectedSubmission.id}/caption`, {
        method: 'PATCH',
        body: JSON.stringify({ socialCaption: editedCaption })
      });
      setSubmissions(submissions.map(s => s.id === selectedSubmission.id ? { ...s, socialCaption: editedCaption } : s));
      setSelectedSubmission({ ...selectedSubmission, socialCaption: editedCaption });
      alert('Đã lưu caption!');
    } catch (e) {
      alert('Lỗi khi lưu caption');
    } finally {
      setIsUpdating(false);
    }
  }

  function copyToClipboard() {
    if (navigator.clipboard && editedCaption) {
      navigator.clipboard.writeText(editedCaption);
      alert('Đã sao chép vào khay nhớ tạm!');
    }
  }

  function openDetail(sub: Submission) {
    setSelectedSubmission(sub);
    setEditedCaption(sub.socialCaption || sub.content);
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-page"><p className="text-text-secondary">Đang tải...</p></div>;
  }
  if (!admin) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-page text-text-primary">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[240px] border-r border-border bg-white transition-transform duration-300 md:static md:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center px-6 border-b border-border">
          <span className="text-lg font-bold text-primary tracking-tight">CFS Admin</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-4">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setPage(1); setIsSidebarOpen(false); }}
                  className={`flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-page hover:text-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    {tab.label}
                  </div>
                  {stats && (
                    <span className={`text-[12px] ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                      {stats[tab.id as keyof DashboardStats] || 0}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-4 px-2 text-[12px] text-text-secondary truncate">{admin.email}</div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-6 md:hidden">
          <span className="text-lg font-bold text-primary">CFS Admin</span>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 text-text-secondary">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-2xl font-bold mb-6 text-text-primary">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>

            {/* Submissions List */}
            {loadingList ? (
              <p className="text-text-secondary text-sm">Đang tải danh sách...</p>
            ) : submissions.length === 0 ? (
              <Card className="border-dashed bg-transparent shadow-none">
                <CardContent className="p-12 text-center text-text-secondary">
                  Không tìm thấy confession nào.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => (
                  <Card key={sub.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[12px] font-mono text-primary font-semibold">#{sub.id.split('-')[0]}</span>
                          <span className="text-[12px] text-text-secondary">{new Date(sub.createdAt).toLocaleString()}</span>
                          <Badge status={sub.status as BadgeStatus} />
                        </div>
                        <p className="text-[14px] text-text-primary line-clamp-2">{sub.content}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        {sub.media?.length > 0 && (
                          <div className="text-[12px] text-text-secondary flex items-center gap-1">
                            <span className="font-semibold">{sub.media.length}</span> tệp
                          </div>
                        )}
                        <Button variant="outline" className="h-9 text-[14px] px-4" onClick={() => openDetail(sub)}>
                          Xem chi tiết
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loadingList && totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  Trước
                </Button>
                <span className="flex items-center text-[14px] text-text-secondary px-4">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  Sau
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="flex flex-col max-h-full w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4 bg-page/50">
              <div className="flex items-center gap-3">
                <h3 className="font-bold">Chi tiết Confession</h3>
                <span className="text-[12px] font-mono text-primary">#{selectedSubmission.id.split('-')[0]}</span>
                <Badge status={selectedSubmission.status as BadgeStatus} />
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-text-secondary hover:text-text-primary p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[14px] font-semibold">Nội dung gốc (Bất biến)</label>
                <div className="rounded-[8px] bg-page p-4 text-[14px] whitespace-pre-wrap border border-border/50">
                  {selectedSubmission.content}
                </div>
              </div>

              {selectedSubmission.media && selectedSubmission.media.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold">Tệp đính kèm ({selectedSubmission.media.length})</label>
                  <div className="flex flex-wrap gap-4">
                    {selectedSubmission.media.map(m => (
                      <div key={m.id} className="relative h-24 w-24 rounded-[8px] border border-border overflow-hidden bg-page flex items-center justify-center group">
                        {m.type === 'IMAGE' ? (
                          <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/media/view?key=${m.storageKey}`} alt="Media" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-medium text-text-secondary">VIDEO</span>
                        )}
                        <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/media/view?key=${m.storageKey}`} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ExternalLink size={20} />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[14px] font-semibold">Caption chuẩn bị (Dùng để đăng)</label>
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-8 text-[12px] px-3 gap-1" onClick={copyToClipboard}>
                      <Copy size={14} /> Sao chép
                    </Button>
                    <Button variant="ghost" className="h-8 text-[12px] px-3 text-primary" onClick={saveCaption} disabled={isUpdating}>
                      Lưu caption
                    </Button>
                  </div>
                </div>
                <Textarea 
                  value={editedCaption}
                  onChange={e => setEditedCaption(e.target.value)}
                  className="min-h-[160px]"
                />
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <label className="text-[14px] font-semibold">Các bài đã đăng trên MXH</label>
                {selectedSubmission.socialPosts && selectedSubmission.socialPosts.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSubmission.socialPosts.map(post => (
                      <div key={post.id} className="flex flex-col gap-1 rounded-[8px] border border-border bg-page p-3 text-[14px]">
                        <div className="flex items-center gap-2 font-semibold">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-[4px] text-[10px]">{post.platform}</span>
                          <span className="text-text-secondary font-normal text-[12px]">{new Date(post.createdAt).toLocaleString()}</span>
                        </div>
                        {post.externalUrl && (
                          <a href={post.externalUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                            {post.externalUrl}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[14px] text-text-secondary italic">Chưa có bài đăng nào.</p>
                )}
                
                <div className="flex gap-2 pt-2">
                  <select 
                    value={newPlatform} 
                    onChange={e => setNewPlatform(e.target.value)}
                    className="h-10 rounded-md border border-border px-3 text-[14px] bg-white text-text-primary"
                  >
                    <option value="FACEBOOK">Facebook</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="TIKTOK">TikTok</option>
                    <option value="THREADS">Threads</option>
                    <option value="OTHER">Khác</option>
                  </select>
                  <input 
                    type="url" 
                    placeholder="Link bài đăng (tuỳ chọn)" 
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    className="h-10 flex-1 rounded-md border border-border px-3 text-[14px] bg-white text-text-primary"
                  />
                  <Button onClick={handleAddSocialPost} disabled={isUpdating}>Thêm</Button>
                </div>
              </div>
            </div>

            <div className="border-t border-border p-4 bg-page/50 flex flex-wrap justify-between gap-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedSubmission(null)}>Đóng</Button>
                {admin?.role === 'SUPER_ADMIN' && (
                  <Button variant="outline" className="text-error border-error/20 hover:bg-error/5" onClick={() => hardDelete(selectedSubmission.id)} disabled={isUpdating}>
                    <Trash2 size={16} className="mr-2" /> Xóa vĩnh viễn
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {selectedSubmission.status === 'PENDING' && (
                  <>
                    <Button variant="outline" className="text-error border-error/20 hover:bg-error/5" onClick={() => updateStatus(selectedSubmission.id, 'REJECTED')} disabled={isUpdating}>Từ chối</Button>
                    <Button className="bg-success hover:bg-success/90" onClick={() => updateStatus(selectedSubmission.id, 'APPROVED')} disabled={isUpdating}>Duyệt bài</Button>
                  </>
                )}
                {selectedSubmission.status === 'APPROVED' && (
                  <>
                    <Button variant="outline" onClick={() => updateStatus(selectedSubmission.id, 'HIDDEN')} disabled={isUpdating}>Ẩn bài</Button>
                    <Button className="bg-primary hover:bg-primary-hover" onClick={() => updateStatus(selectedSubmission.id, 'POSTED')} disabled={isUpdating}>Đánh dấu đã đăng</Button>
                  </>
                )}
                {selectedSubmission.status === 'HIDDEN' && (
                  <Button variant="outline" onClick={() => updateStatus(selectedSubmission.id, 'APPROVED')} disabled={isUpdating}>Bỏ ẩn</Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
