import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Video, Plus, Trash2, Calendar, FileText, Globe, Play, X, User } from 'lucide-react';
import { Post } from '../types';

interface NewsFeedProps {
  selectedPostId: string | null;
  setSelectedPostId: (id: string | null) => void;
}

export default function NewsFeed({ selectedPostId, setSelectedPostId }: NewsFeedProps) {
  const { posts, addPost, deletePost } = useTournament();

  const [activeCategory, setActiveCategory] = useState<'ALL' | 'News' | 'Video'>('ALL');
  const [isAdding, setIsAdding] = useState(false);

  // Form Inputs
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'News' | 'Video'>('News');
  const [image, setImage] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [author, setAuthor] = useState('Ban Biên Tập');

  const filteredPosts = posts.filter(p => {
    if (activeCategory === 'ALL') return true;
    return p.category === activeCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    // Standard default badminton action images
    const defaultImg = image.trim() || 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600&auto=format&fit=crop&q=80';

    addPost({
      title,
      content,
      category,
      image: defaultImg,
      videoUrl: videoUrl.trim() || undefined,
      author: author.trim() || 'Tuyển trọng tài'
    });

    setTitle('');
    setContent('');
    setImage('');
    setVideoUrl('');
    setIsAdding(false);
  };

  const activePostDetail = posts.find(p => p.id === selectedPostId);

  return (
    <div id="news-feed" className="space-y-6 py-2 text-left">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Video className="h-6.5 w-6.5 text-blue-600" />
            Tin Tức & Media Ngoài Lề
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            Cập nhật thường nhật bản tin nhanh, thông báo kỹ thuật và video phát lại những set đấu hấp dẫn hàng đầu.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start shadow-sm cursor-pointer ${
            isAdding 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-200'
          }`}
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAdding ? 'Hủy' : 'Đăng tin mới'}
        </button>
      </div>

      {/* Categories navbar */}
      <div className="flex border-b border-slate-200 gap-5 select-none">
        {['ALL', 'News', 'Video'].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as any)}
            className={`pb-3 text-xs md:text-sm font-semibold border-b-2 transition relative cursor-pointer ${
              activeCategory === cat 
                ? 'border-blue-600 text-blue-620' 
                : 'border-transparent text-slate-450 hover:text-slate-800'
            }`}
          >
            {cat === 'ALL' ? 'Tất cả bài đăng' : cat === 'News' ? 'Bản Tin Nhanh' : 'Video / Highlights'}
          </button>
        ))}
      </div>

      {/* Adding form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5 shadow-sm animate-in fade-in duration-200">
          <h2 className="font-bold text-blue-600 text-xs tracking-wider uppercase font-mono">VIẾT BÀI ĐĂNG HOẶC ĐĂNG VIDEO MỚI</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-655 text-xs font-semibold">Tiêu Đề Bài Viết / Video <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Ví dụ: Đại diện CLB Ba Đình tự tin bẻ khóa nhánh đấu vô địch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-55 text-slate-850 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-655 text-xs font-semibold">Phân loại danh mục</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-55 text-slate-855 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="News">Tin Tức Thường Nhật</option>
                <option value="Video">Video Điểm Nhấn Highlight</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-655 text-xs font-semibold">Tác giả biên soạn </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-slate-55 text-slate-850 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-655 text-xs font-semibold">Đường dẫn URL ảnh bìa (Chọn trống để lấy mặc định)</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/photo-..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full bg-slate-55 text-slate-850 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            {category === 'Video' && (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-slate-655 text-xs font-semibold">Đường dẫn Nhúng Video Youtube / Link Video (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="https://www.youtube.com/embed/..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-slate-55 text-slate-850 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
            )}

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-655 text-xs font-semibold">Nội dung chi tiết viết bài <span className="text-red-500">*</span></label>
              <textarea
                placeholder="Nội dung truyền hình trực tiếp, nhận định các pha cầu đập nảy lửa..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-32 bg-slate-55 text-slate-850 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm shadow-blue-200 cursor-pointer transition"
            >
              Phát hành tin tức
            </button>
          </div>
        </form>
      )}

      {/* Grid of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            onClick={() => setSelectedPostId(post.id)}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden shadow-sm cursor-pointer transition flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-40 overflow-hidden bg-slate-100 select-none">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" referrerPolicy="no-referrer" />
                {post.category === 'Video' && (
                  <div className="absolute inset-0 bg-slate-900/35 flex items-center justify-center">
                    <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg">
                      <Play className="h-4 w-4 fill-current ml-0.5" />
                    </div>
                  </div>
                )}
                <span className="absolute top-2.5 left-2.5 bg-slate-900/90 text-[9px] font-mono font-bold tracking-wider text-blue-400 px-2.5 py-0.5 rounded border border-slate-800 uppercase">
                  {post.category === 'Video' ? 'VIDEO CLIP' : 'TIN BÁO CHÍ'}
                </span>
              </div>

              <div className="p-4 space-y-1.5">
                <div className="flex gap-2 text-[10px] text-slate-405 font-mono font-semibold">
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.author}</span>
                </div>
                <h3 className="font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors text-xs md:text-sm line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3">
                  {post.content}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              <span className="text-[11px] text-blue-600 group-hover:underline font-bold flex items-center gap-0.5">
                Chi tiết →
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Bạn muốn gỡ bài đăng này khỏi luồng bản tin?')) {
                    deletePost(post.id);
                  }
                }}
                className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                title="Xóa bài đăng"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ARTICLE READ DETAIL MODAL */}
      {selectedPostId && activePostDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-205 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-5 md:p-7 space-y-5 relative animate-in zoom-in-95 duration-200 shadow-xl scrollbar-thin">
            
            <button
              onClick={() => setSelectedPostId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 bg-slate-100 p-1.5 rounded-full cursor-pointer transition select-none z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Title & Author info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider select-none">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <span>{activePostDetail.date}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3 text-slate-400" />
                  <span>Báo Cáo: {activePostDetail.author}</span>
                </div>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-850 tracking-tight leading-snug">
                {activePostDetail.title}
              </h1>
            </div>

            {/* Media wrapper: video player iframe or big header image */}
            {activePostDetail.category === 'Video' && activePostDetail.videoUrl ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black border border-slate-200/80 shadow-inner select-none">
                <iframe
                  width="100%"
                  height="100%"
                  src={activePostDetail.videoUrl}
                  title={activePostDetail.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="w-full h-56 md:h-72 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 shadow-inner select-none animate-pulse-once">
                <img src={activePostDetail.image} alt={activePostDetail.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}

            {/* Article detailed content */}
            <div className="space-y-3">
              <span className="bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-mono font-bold tracking-widest px-2.5 py-1 rounded inline-block uppercase select-none">
                {activePostDetail.category === 'Video' ? 'HIGHLIGHT VIDEO' : 'BẢN TIN CHÍNH THỨC'}
              </span>
              <p className="text-slate-650 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                {activePostDetail.content}
              </p>
            </div>

            {/* Close trigger button */}
            <div className="flex justify-end pt-4 border-t border-slate-100 select-none">
              <button
                onClick={() => setSelectedPostId(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition"
              >
                Đóng bài đọc
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
