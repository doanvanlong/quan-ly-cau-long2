import React, { useState, useRef } from 'react';
import { useTournament } from '../context/TournamentContext';
import { BannerSlide } from '../types';
import { 
  Plus, Trash2, Edit2, Check, X, Sparkles, Image, 
  ArrowUp, ArrowDown, Eye, EyeOff, Layout, Link, 
  FileText, UploadCloud, CornerDownRight, CheckCircle2 
} from 'lucide-react';

const PRESET_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200', label: 'Cây vợt & Quả cầu lông' },
  { url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200', label: 'Sân đấu thể thao xanh' },
  { url: 'https://images.unsplash.com/photo-1521537634199-673689440044?q=80&w=1200', label: 'Vận động viên thi đấu' },
  { url: 'https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?q=80&w=1200', label: 'Sân đấu trong nhà đỏ rực' },
  { url: 'https://images.unsplash.com/photo-1613531551958-3d5fcd73b53a?q=80&w=1200', label: 'Quả cầu rơi bãi cỏ' }
];

const TARGET_PAGES = [
  { value: 'home', label: 'Trang Chủ' },
  { value: 'tournament-create', label: 'Tạo Giải Đấu' },
  { value: 'tournament-manage', label: 'Quản Lý Giải Đấu' },
  { value: 'teams', label: 'Đội & Thành Viên' },
  { value: 'athletes', label: 'Vận Động Viên (VĐV)' },
  { value: 'draw', label: 'Chia Bảng / Sơ Đồ' },
  { value: 'schedule', label: 'Lịch Thi Đấu & Điểm' },
  { value: 'leaderboard', label: 'Bảng Xếp Hạng' },
  { value: 'news', label: 'Tin Tức & Media' },
  { value: 'sponsors', label: 'Trang Đối Tác Nhà Tài Trợ' }
];

export default function SlideManager() {
  const { slides, addSlide, updateSlide, deleteSlide } = useTournament();

  // Selected slide for editing (null means we are showing the list + "Thêm mới" state)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('Khám phá ngay');
  const [buttonLink, setButtonLink] = useState('tournament-create');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState<number>(1);

  // Drag and drop / local upload states
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');

  // Trigger edit/fill state
  const startEditing = (slide: BannerSlide) => {
    setEditingId(slide.id);
    setIsAddingNew(false);
    setTitle(slide.title);
    setSubtitle(slide.subtitle || '');
    setDescription(slide.description || '');
    setImageUrl(slide.imageUrl);
    setButtonText(slide.buttonText || 'Khám phá ngay');
    setButtonLink(slide.buttonLink || 'home');
    setIsActive(slide.isActive);
    setOrder(slide.order);
    setUploadProgress('IDLE');
  };

  const startAdding = () => {
    setIsAddingNew(true);
    setEditingId(null);
    setTitle('');
    setSubtitle('THI ĐẤU ĐỈNH CAO');
    setDescription('');
    setImageUrl(PRESET_IMAGES[0].url);
    setButtonText('Xếp lịch thi đấu');
    setButtonLink('schedule');
    setIsActive(true);
    // Find highest order + 1
    const maxOrder = slides.length > 0 ? Math.max(...slides.map(s => s.order)) : 0;
    setOrder(maxOrder + 1);
    setUploadProgress('IDLE');
  };

  // Convert uploaded image file to lightweight Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một file định dạng ảnh!');
      return;
    }
    
    // Check size limit: keep base64 within responsive limits (less than 2.5MB)
    if (file.size > 2.5 * 1024 * 1024) {
      alert('⚠️ Kích thước ảnh quá lớn! Kích thước tối ưu nên dưới 2.5MB để hoạt động nhanh hơn.');
      return;
    }

    setUploadProgress('LOADING');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        setUploadProgress('SUCCESS');
      }
    };
    reader.onerror = () => {
      alert('Lỗi đọc ảnh từ máy tính của bạn.');
      setUploadProgress('IDLE');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng điền tiêu đề slide!');
      return;
    }
    if (!imageUrl.trim()) {
      alert('Vui lòng chọn hoặc tự upload một ảnh nền!');
      return;
    }

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim(),
      buttonText: buttonText.trim() || undefined,
      buttonLink: buttonLink || 'home',
      isActive,
      order: Number(order) || 1
    };

    if (isAddingNew) {
      addSlide(payload);
      setIsAddingNew(false);
    } else if (editingId) {
      updateSlide(editingId, payload);
      setEditingId(null);
    }
    
    setUploadProgress('IDLE');
  };

  // Move slide position up or down
  const changeOrder = (slide: BannerSlide, direction: 'UP' | 'DOWN') => {
    const currentIndex = slides.findIndex(s => s.id === slide.id);
    if (currentIndex === -1) return;

    if (direction === 'UP' && currentIndex > 0) {
      const prevSlide = slides[currentIndex - 1];
      const tempOrder = slide.order;
      updateSlide(slide.id, { order: prevSlide.order });
      updateSlide(prevSlide.id, { order: tempOrder });
    } else if (direction === 'DOWN' && currentIndex < slides.length - 1) {
      const nextSlide = slides[currentIndex + 1];
      const tempOrder = slide.order;
      updateSlide(slide.id, { order: nextSlide.order });
      updateSlide(nextSlide.id, { order: tempOrder });
    }
  };

  return (
    <div id="slide-manager-view" className="space-y-6 text-left">
      {/* Visual Section Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layout className="h-6 w-6 text-blue-600" />
            Cấu Hình Hệ Thống Slider Banner
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập danh sách tin tức nổi bật, hình ảnh sự kiện, và khẩu hiệu trượt tự động tại Trang chủ.
          </p>
        </div>
        {!isAddingNew && !editingId && (
          <button
            onClick={startAdding}
            className="mt-3 md:mt-0 bg-blue-600 hover:bg-blue-500 text-white font-sans font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-500/10 transition flex items-center gap-1.5 cursor-pointer self-start"
          >
            <Plus className="h-4 w-4" /> Thêm Slide Mới
          </button>
        )}
      </div>

      {/* Editor & List Content Container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Editor Form Panel (Appears when editing or adding) */}
        {(isAddingNew || editingId) && (
          <form onSubmit={handleSave} className="xl:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-800 text-sm tracking-tight flex items-center gap-1.5 uppercase font-mono">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                {isAddingNew ? 'Thêm mới slide' : 'Sửa slide hiện tại'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-700">
              {/* Badget/Subtitle Text */}
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  Tag Nhãn nhỏ (Badge text)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ví dụ: GIẢI ĐẤU THƯỜNG NIÊN, TIN NỔI BẬT..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans"
                />
              </div>

              {/* Title Text */}
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  Tiêu đề chính <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Nơi Bản Lĩnh Tỏa Sáng, Vinh Quang Đang Gọi"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans text-sm font-semibold"
                />
              </div>

              {/* Description Body Text */}
              <div className="space-y-1">
                <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  Nội dung chi tiết ngắn
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả hoạt động hoặc thông tin đi kèm..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans leading-relaxed"
                />
              </div>

              {/* Slide Buttons Setup */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    Tên Nút CTA (Ví dụ: Thử ngay)
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Để trống nếu không muốn hiện nút"
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    Nút chuyển hướng tới
                  </label>
                  <select
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans cursor-pointer"
                  >
                    {TARGET_PAGES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sorting & IsActive */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    Phân loại thứ tự xếp
                  </label>
                  <input
                    type="number"
                    value={order}
                    min={1}
                    onChange={(e) => setOrder(Number(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    Trạng thái hoạt động
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive ? 'bg-blue-600' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-slate-600 font-semibold select-none">
                      {isActive ? 'Đang hoạt động' : 'Tạm ẩn slide'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image upload area */}
              <div className="space-y-2">
                <label className="block text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  Cấu hình ảnh nền Slide <span className="text-red-500">*</span>
                </label>
                
                {/* Image Live Micro Preview */}
                {imageUrl && (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="bg-black/80 hover:bg-black text-white p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" /> Xóa ảnh để chọn lại
                      </button>
                    </div>
                  </div>
                )}

                {/* Drag and drop panel (only if image is not selected or if user wants to replace) */}
                {!imageUrl && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                      dragOver
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-300 hover:border-slate-400 text-slate-400 bg-slate-50'
                    }`}
                  >
                    <UploadCloud className="h-8 w-8 text-slate-400 mb-1" />
                    <p className="text-[10px] font-bold text-slate-600">Drag & Drop hoặc Nhấp để tải lên</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Hỗ trợ JPG, PNG, WEBP (vừa ví dưới 2.5MB)</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                )}

                {uploadProgress === 'LOADING' && (
                  <div className="text-[10px] text-blue-600 animate-pulse font-bold flex items-center gap-1">
                     Đang nén và giải mã hình ảnh thành base64...
                  </div>
                )}

                {/* Raw URL Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500">Hoặc dán trực tiếp link ảnh (URL)</label>
                  </div>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-[10px]"
                  />
                </div>

                {/* Presets Grid */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Ảnh mẫu chuẩn thể thao nghệ thuật có sẵn:
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_IMAGES.map((preset, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setImageUrl(preset.url);
                          setUploadProgress('SUCCESS');
                        }}
                        className={`h-9 rounded-md overflow-hidden border-2 transition ${
                          imageUrl === preset.url ? 'border-blue-600 scale-105' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action controls */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingId(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl shadow-md transition"
              >
                {isAddingNew ? 'Tạo Slide Ngay' : 'Lưu Slide'}
              </button>
            </div>
          </form>
        )}

        {/* Slides List & Preview Simulator List Panel */}
        <div className={`${(isAddingNew || editingId) ? 'xl:col-span-7' : 'xl:col-span-12'} space-y-4`}>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
            <h2 className="font-extrabold text-slate-800 tracking-tight text-sm uppercase font-mono pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
              <span>Hàng ngũ Slide hiện có ({slides.length})</span>
              <span className="text-[10px] text-slate-400 tracking-normal font-sans font-bold capitalize">Xếp thứ tự tăng dần</span>
            </h2>

            {slides.length === 0 ? (
              <div className="p-10 border border-dashed border-slate-200 rounded-xl text-center space-y-3">
                <Image className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-slate-500 text-xs font-semibold">Chưa có Slide Banner nào được thiết lập!</p>
                <button
                  type="button"
                  onClick={startAdding}
                  className="bg-blue-600 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg hover:bg-blue-500 cursor-pointer"
                >
                  Tạo slide mẫu đầu tiên
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {slides.map((slide, index) => {
                  const targetLabel = TARGET_PAGES.find(p => p.value === slide.buttonLink)?.label || 'Trang Chủ';
                  return (
                    <div
                      key={slide.id}
                      className={`relative flex flex-col md:flex-row bg-slate-50 hover:bg-slate-100/70 border rounded-xl p-3 md:p-4 gap-4 items-stretch md:items-center transition duration-150 ${
                        !slide.isActive 
                          ? 'border-slate-200 opacity-60' 
                          : 'border-slate-200 hover:border-blue-300 shadow-xs'
                      }`}
                    >
                      {/* Left: Indicator order */}
                      <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 px-1 border-r border-slate-200/60 pb-2 md:pb-0 shrink-0">
                        <div className="flex md:flex-col items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => changeOrder(slide, 'UP')}
                            className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                            title="Di chuyển lên đầu"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === slides.length - 1}
                            onClick={() => changeOrder(slide, 'DOWN')}
                            className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                            title="Di chuyển xuống dưới"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-slate-400 font-mono mt-1">#0{slide.order}</span>
                      </div>

                      {/* Middle: Micro Banner Preview */}
                      <div className="w-full md:w-32 h-20 bg-slate-300 rounded-lg overflow-hidden border border-slate-200 shrink-0 select-none">
                        <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                      </div>

                      {/* Content column */}
                      <div className="flex-1 space-y-1 md:space-y-1.5 text-left truncate min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {slide.subtitle && (
                            <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono">
                              {slide.subtitle}
                            </span>
                          )}
                          {!slide.isActive && (
                            <span className="bg-red-100 text-red-800 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono flex items-center gap-1">
                              <EyeOff className="h-2 w-2" /> Đang ẩn
                            </span>
                          )}
                          {slide.isActive && (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono flex items-center gap-1">
                              <Eye className="h-2 w-2" /> Đang hiện
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-800 text-sm truncate">{slide.title}</h3>
                        <p className="text-slate-500 text-[10px] truncate max-w-[420px]">
                          {slide.description || 'Không có mô tả chi tiết đi kèm.'}
                        </p>

                        {/* Event Link Indicator */}
                        {slide.buttonText && (
                          <div className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                            <CornerDownRight className="h-3 w-3 text-blue-500 shrink-0" />
                            <span>Action nút: "<strong>{slide.buttonText}</strong>" &rarr; bay tới tab {targetLabel}</span>
                          </div>
                        )}
                      </div>

                      {/* Right side: quick actions */}
                      <div className="flex items-center gap-1.5 shrink-0 justify-end pt-2 md:pt-0 border-t border-slate-200/50 md:border-none">
                        <button
                          type="button"
                          onClick={() => updateSlide(slide.id, { isActive: !slide.isActive })}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            slide.isActive 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200' 
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-150 border-slate-200'
                          }`}
                          title={slide.isActive ? 'Bấm để tạm ẩn' : 'Bấm để hiển thị'}
                        >
                          {slide.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditing(slide)}
                          className="p-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-lg border border-slate-200 transition cursor-pointer"
                          title="Chỉnh sửa chi tiết"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Bạn có thực sự muốn xóa slide banner này không? thao tác sẽ xóa vĩnh viễn khỏi Firebase.')) {
                              deleteSlide(slide.id);
                              if (editingId === slide.id) {
                                setEditingId(null);
                              }
                            }
                          }}
                          className="p-1.5 bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-700 rounded-lg border border-red-200 transition cursor-pointer"
                          title="Xóa slide"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
