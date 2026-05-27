import React, { useRef, useState, useEffect } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  List, ListOrdered, Link2, Image as ImageIcon, 
  Video, Table, Code, Eye, Smile, Heading1, Heading2, 
  Heading3, Eraser, Minus, Check, X, Sparkles, ExternalLink
} from 'lucide-react';
import { getYouTubeEmbedUrl } from '../utils/youtube';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Viết bài hoặc soạn thảo nội dung tại đây...', className = '' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isVisual, setIsVisual] = useState(true);
  const [htmlValue, setHtmlValue] = useState(value);
  
  // Custom Inline popover states (to avoid iframe browser popups)
  const [activeDialog, setActiveDialog] = useState<'link' | 'image' | 'video' | 'emoji' | null>(null);
  
  // Link form stats
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  
  // Image form stats
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('Hình ảnh tin tức');
  const [imageWidth, setImageWidth] = useState('100'); // % width
  const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right'>('center');

  // Video form stats
  const [videoLink, setVideoLink] = useState('');
  
  // Presets of beautiful badminton stock images
  const badmintonImagePresets = [
    { title: 'Vợt & Cầu Đẹp', url: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=800&auto=format&fit=crop&q=80' },
    { title: 'Trận Đấu Kịch Tính', url: 'https://images.unsplash.com/photo-1626224484214-40d54f440284?w=800&auto=format&fit=crop&q=80' },
    { title: 'Sân Thi Đấu Trống', url: 'https://images.unsplash.com/photo-1621259182978-f09e5e2b07ae?w=800&auto=format&fit=crop&q=80' },
    { title: 'Cầu Bay Gấp Ráp', url: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ee?w=800&auto=format&fit=crop&q=80' }
  ];

  // Sync internal state with external value representation
  useEffect(() => {
    if (isVisual) {
      if (editorRef.current && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    } else {
      setHtmlValue(value);
    }
  }, [value, isVisual]);

  // Handle standard document formats
  const execCommand = (command: string, arg: string = '') => {
    if (!isVisual) return;
    document.execCommand(command, false, arg);
    // Keep focus
    if (editorRef.current) {
      editorRef.current.focus();
    }
    triggerChange();
  };

  const triggerChange = () => {
    if (isVisual && editorRef.current) {
      const currentHTML = editorRef.current.innerHTML;
      setHtmlValue(currentHTML);
      onChange(currentHTML);
    } else {
      onChange(htmlValue);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setHtmlValue(newVal);
    onChange(newVal);
  };

  // Safe insertion functions
  const handleInsertLink = (e?: { preventDefault: () => void }) => {
    if (e) e.preventDefault();
    if (!linkUrl.trim()) return;

    // Format the URL
    let formattedUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    const textToInsert = linkText.trim() || formattedUrl;
    
    if (isVisual) {
      // Re-establish selection or just insert HTML
      if (editorRef.current) {
        editorRef.current.focus();
        
        // Let's form the proper HTML anchor
        const anchorHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-500 font-semibold underline inline-flex items-center gap-0.5">${textToInsert}</a>`;
        document.execCommand('insertHTML', false, anchorHtml);
      }
    } else {
      const anchorHtml = `<a href="${formattedUrl}" target="_blank" rel="noopener noreferrer">${textToInsert}</a>`;
      setHtmlValue(prev => prev + anchorHtml);
      onChange(htmlValue + anchorHtml);
    }

    setLinkUrl('');
    setLinkText('');
    setActiveDialog(null);
  };

  const handleInsertImage = (e?: { preventDefault: () => void }) => {
    if (e) e.preventDefault();
    if (!imageUrl.trim()) return;

    const alignClass = imageAlign === 'center' ? 'mx-auto block' : imageAlign === 'right' ? 'ml-auto mr-0 block' : 'mr-auto ml-0 block';
    const finalStyle = `width: ${imageWidth}%; max-width: 100%; height: auto; border-radius: 0.75rem; border: 1px solid #e2e8f0; margin-top: 0.5rem; margin-bottom: 0.5rem; transition: transform 0.2s;`;
    
    // Create custom responsive image element tag
    const imgHtml = `<img src="${imageUrl.trim()}" alt="${imageAlt}" style="${finalStyle}" class="${alignClass} shadow-sm cursor-pointer hover:shadow-md" referrerPolicy="no-referrer" />`;

    if (isVisual) {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, imgHtml);
      }
    } else {
      setHtmlValue(prev => prev + imgHtml);
      onChange(htmlValue + imgHtml);
    }

    setImageUrl('');
    setImageAlt('Hình ảnh tin tức');
    setImageWidth('100');
    setActiveDialog(null);
  };

  const handleInsertVideo = (e?: { preventDefault: () => void }) => {
    if (e) e.preventDefault();
    if (!videoLink.trim()) return;

    const embedUrl = getYouTubeEmbedUrl(videoLink);

    const videoHtml = `
      <div class="aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-md border border-slate-200 bg-black my-4 select-none">
        <iframe 
          width="100%" 
          height="100%" 
          src="${embedUrl}" 
          title="Video Embed" 
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowfullscreen
        ></iframe>
      </div>
    `;

    if (isVisual) {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, videoHtml);
      }
    } else {
      setHtmlValue(prev => prev + videoHtml);
      onChange(htmlValue + videoHtml);
    }

    setVideoLink('');
    setActiveDialog(null);
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <div class="overflow-x-auto my-4">
        <table class="w-full text-left text-xs border-collapse border border-slate-200 rounded-lg overflow-hidden">
          <thead>
            <tr class="bg-slate-50 text-slate-700">
              <th class="border border-slate-200 p-2.5 font-bold">Hạng mục</th>
              <th class="border border-slate-200 p-2.5 font-bold">Thông số</th>
              <th class="border border-slate-200 p-2.5 font-bold">Ghi chú</th>
            </tr>
          </thead>
          <tbody class="text-slate-600">
            <tr>
              <td class="border border-slate-200 p-2.5 bg-white">VD: Sân bãi</td>
              <td class="border border-slate-200 p-2.5 bg-white">Sân Trung Tâm</td>
              <td class="border border-slate-200 p-2.5 bg-white">Giải đấu chính</td>
            </tr>
            <tr>
              <td class="border border-slate-200 p-2.5 bg-slate-50/50">VD: Trọng tài</td>
              <td class="border border-slate-200 p-2.5 bg-slate-50/50">Trần Quốc Nam</td>
              <td class="border border-slate-200 p-2.5 bg-slate-50/50">Bán chuyên</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    if (isVisual) {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, tableHtml);
      }
    } else {
      setHtmlValue(prev => prev + tableHtml);
      onChange(htmlValue + tableHtml);
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    if (isVisual) {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertText', false, emoji);
      }
    } else {
      setHtmlValue(prev => prev + emoji);
      onChange(htmlValue + emoji);
    }
    setActiveDialog(null);
  };

  const handleClearFormat = () => {
    execCommand('removeFormat');
    execCommand('unlink');
  };

  const handleInsertHr = () => {
    const hrHtml = '<hr class="border-t border-slate-200 my-4" />';
    if (isVisual) {
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, hrHtml);
      }
    } else {
      setHtmlValue(prev => prev + hrHtml);
      onChange(htmlValue + hrHtml);
    }
  };

  return (
    <div id="visual-news-editor" className={`border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all ${className}`}>
      
      {/* TOOLBAR CONTROLS */}
      <div className="bg-slate-50 p-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-1 select-none text-slate-700">
        
        {/* Style actions */}
        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 rounded-lg transition cursor-pointer"
            title="Chữ đậm"
          >
            <Bold className="h-3.5 w-3.5 font-bold" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 rounded-lg transition cursor-pointer"
            title="Chữ nghiêng"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 rounded-lg transition cursor-pointer"
            title="Chữ gạch chân"
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 rounded-lg transition cursor-pointer"
            title="Gạch ngang"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>

          <span className="w-px h-5 bg-slate-200 mx-1"></span>

          {/* Heading Blocks */}
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h1>')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-0.5 disabled:opacity-40 cursor-pointer"
            title="Tiêu đề H1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h2>')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-0.5 disabled:opacity-40 cursor-pointer"
            title="Tiêu đề H2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<h3>')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-0.5 disabled:opacity-40 cursor-pointer"
            title="Tiêu đề H3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', '<p>')}
            disabled={!isVisual}
            className="p-1 px-1.5 hover:bg-slate-200 rounded-lg text-[10px] font-mono font-medium transition disabled:opacity-40 cursor-pointer"
            title="Phong cách văn bản thường"
          >
            P
          </button>

          <span className="w-px h-5 bg-slate-200 mx-1"></span>

          {/* Align acts */}
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg transition disabled:opacity-40 cursor-pointer"
            title="Căn lề trái"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg transition disabled:opacity-40 cursor-pointer"
            title="Căn lề giữa"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg transition disabled:opacity-40 cursor-pointer"
            title="Căn lề phải"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyFull')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg transition disabled:opacity-40 cursor-pointer"
            title="Căn đều hai bên"
          >
            <AlignJustify className="h-3.5 w-3.5" />
          </button>

          <span className="w-px h-5 bg-slate-200 mx-1"></span>

          {/* Lists and Tables */}
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg transition disabled:opacity-40 cursor-pointer"
            title="Danh sách gạch đầu dòng"
          >
            <List className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg transition disabled:opacity-40 cursor-pointer"
            title="Danh sách số"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertTable}
            className="p-2 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            title="Chèn bảng thông số"
          >
            <Table className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleInsertHr}
            className="p-2 hover:bg-slate-200 rounded-lg transition cursor-pointer"
            title="Đường phân tách ngang"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <span className="w-px h-5 bg-slate-200 mx-1"></span>

          {/* Media / Complex inserts */}
          <button
            type="button"
            onClick={() => setActiveDialog(activeDialog === 'link' ? null : 'link')}
            className={`p-2 rounded-lg transition cursor-pointer ${activeDialog === 'link' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200'}`}
            title="Chèn liên kết web"
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveDialog(activeDialog === 'image' ? null : 'image')}
            className={`p-2 rounded-lg transition cursor-pointer ${activeDialog === 'image' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200'}`}
            title="Chèn ảnh / Thư viện ảnh"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveDialog(activeDialog === 'video' ? null : 'video')}
            className={`p-2 rounded-lg transition cursor-pointer ${activeDialog === 'video' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200'}`}
            title="Chèn video Youtube"
          >
            <Video className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setActiveDialog(activeDialog === 'emoji' ? null : 'emoji')}
            className={`p-2 rounded-lg transition cursor-pointer ${activeDialog === 'emoji' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-200'}`}
            title="Biểu tượng cảm xúc & nhãn"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>

          <span className="w-px h-5 bg-slate-200 mx-1"></span>

          {/* Formatting eraser */}
          <button
            type="button"
            onClick={handleClearFormat}
            disabled={!isVisual}
            className="p-2 hover:bg-slate-200 rounded-lg transition text-slate-500 hover:text-rose-500 disabled:opacity-40 cursor-pointer"
            title="Tẩy định dạng"
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* MODE SWITCHER (Visual vs Source Code Viewer) */}
        <div className="flex items-center gap-1 mt-1 sm:mt-0 font-mono">
          <button
            type="button"
            onClick={() => {
              if (isVisual) {
                // Sourcing HTML representation from visual shell
                if (editorRef.current) {
                  setHtmlValue(editorRef.current.innerHTML);
                }
              }
              setIsVisual(!isVisual);
              setActiveDialog(null);
            }}
            className="px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 bg-slate-200/80 hover:bg-slate-200 transition text-slate-700 cursor-pointer self-stretch"
            title={isVisual ? 'Chuyển sang sửa mã HTML' : 'Sửa trực quan WYSIWYG'}
          >
            {isVisual ? (
              <>
                <Code className="h-3 w-3" />
                Mã HTML
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                Trực quan
              </>
            )}
          </button>
        </div>
      </div>

      {/* FLOATING SUB-DIALOGS FOR CONTROLS IN THE CONTAINER */}
      {activeDialog === 'link' && (
        <div className="bg-slate-50 p-3 border-b border-slate-200 text-xs text-left grid grid-cols-1 sm:grid-cols-12 gap-2.5 animate-in slide-in-from-top-3 duration-200">
          <div className="sm:col-span-5 flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Đường dẫn trang web (URL) *</span>
            <input 
              type="text" 
              placeholder="https://example.com" 
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInsertLink();
                }
              }}
              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs w-full"
              autoFocus
              required
            />
          </div>
          <div className="sm:col-span-5 flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Văn bản hiển thị</span>
            <input 
              type="text" 
              placeholder="VD: Nhấn xem tại đây" 
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInsertLink();
                }
              }}
              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs w-full"
            />
          </div>
          <div className="sm:col-span-2 flex items-end gap-1 px-1.5 py-0.5">
            <button 
              type="button" 
              onClick={() => handleInsertLink()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-1.5 rounded transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Check className="h-3.5 w-3.5" /> Chèn
            </button>
            <button type="button" onClick={() => setActiveDialog(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-705 font-bold p-1.5 rounded transition cursor-pointer flex items-center justify-center">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {activeDialog === 'image' && (
        <div className="bg-slate-50 p-4.5 border-b border-slate-200 text-xs text-left space-y-3.5 animate-in slide-in-from-top-3 duration-200 max-h-96 overflow-y-auto">
          {/* Badminton presets image picker */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Chọn nhanh ảnh minh họa chất lượng cao (Badminton Thể Thao):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {badmintonImagePresets.map((preset) => (
                <div 
                  key={preset.title}
                  onClick={() => setImageUrl(preset.url)}
                  className="group relative cursor-pointer border border-slate-200 rounded-lg overflow-hidden h-14 bg-slate-250 hover:border-blue-400 hover:shadow-xs transition select-none"
                >
                  <img src={preset.url} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-slate-900/40 p-1 flex items-end justify-center">
                    <span className="text-[9px] font-bold text-white text-center tracking-tight leading-none bg-slate-950/60 px-1 py-0.5 rounded truncate w-full">
                      {preset.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-200">
            <div className="sm:col-span-12 md:col-span-5 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Đường dẫn URL ảnh tùy chỉnh *</span>
              <input 
                type="text" 
                placeholder="https://images.unsplash.com/photo-..." 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInsertImage();
                  }
                }}
                className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs w-full"
                required
              />
            </div>
            <div className="sm:col-span-6 md:col-span-3 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Alt text (Mô tả ảnh)</span>
              <input 
                type="text" 
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleInsertImage();
                  }
                }}
                className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs w-full"
              />
            </div>
            <div className="sm:col-span-3 md:col-span-2 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Độ rộng ảnh</span>
              <select
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 text-xs w-full"
              >
                <option value="100">Cực đại (100%)</option>
                <option value="75">Lớn (75%)</option>
                <option value="50">Trung bình (50%)</option>
                <option value="30">Nhỏ (30%)</option>
              </select>
            </div>
            <div className="sm:col-span-3 md:col-span-2 flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Căn lề ảnh</span>
              <select
                value={imageAlign}
                onChange={(e) => setImageAlign(e.target.value as any)}
                className="bg-white border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500 text-xs w-full"
              >
                <option value="center">Ở giữa (Center)</option>
                <option value="left">Trái (Left)</option>
                <option value="right">Phải (Right)</option>
              </select>
            </div>
            <div className="sm:col-span-12 flex justify-end gap-1.5 mt-1">
              <button 
                type="button" 
                onClick={() => handleInsertImage()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 text-xs"
              >
                <Check className="h-4 w-4" /> Chèn ảnh này
              </button>
              <button type="button" onClick={() => setActiveDialog(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-705 px-3 py-2 rounded-lg transition cursor-pointer flex items-center justify-center text-xs">
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {activeDialog === 'video' && (
        <div className="bg-slate-50 p-3 border-b border-slate-200 text-xs text-left grid grid-cols-1 sm:grid-cols-12 gap-2.5 animate-in slide-in-from-top-3 duration-200">
          <div className="sm:col-span-10 flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nhập mã Nhúng hoặc link video Youtube *</span>
            <input 
              type="text" 
              placeholder="VD: https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleInsertVideo();
                }
              }}
              className="bg-white border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs w-full"
              autoFocus
              required
            />
          </div>
          <div className="sm:col-span-2 flex items-end gap-1 px-1.5 py-0.5">
            <button 
              type="button" 
              onClick={() => handleInsertVideo()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-1.5 rounded transition cursor-pointer flex items-center justify-center gap-1"
            >
              <Check className="h-3.5 w-3.5" /> Chèn
            </button>
            <button type="button" onClick={() => setActiveDialog(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold p-1.5 rounded transition cursor-pointer flex items-center justify-center">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {activeDialog === 'emoji' && (
        <div className="bg-slate-50 p-3 border-b border-slate-200 text-left animate-in slide-in-from-top-3 duration-200">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Nhấp chọn emoji nhanh:</span>
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
            {['🏸', '🏆', '🥇', '🥈', '🥉', '🔥', '💪', '👏', '🎯', '📢', '📌', '🤝', '🙌', '🌟', '⚡', '📅', '📰', '🎥', '✨', '🤩', '🏸', '🤸', '🏅', '🏸'].map((emoji, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="p-1 px-2.5 text-base bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 active:bg-blue-105 rounded-lg transition cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TEXT AREA DISPLAY & WRITING CONTENT SHELL */}
      <div className="relative">
        {isVisual ? (
          <div
            ref={editorRef}
            contentEditable
            onInput={triggerChange}
            onBlur={triggerChange}
            className="w-full min-h-[16rem] max-h-[30rem] overflow-y-auto p-4 md:p-5 text-slate-800 text-xs md:text-sm text-left focus:outline-none focus:ring-0 leading-relaxed font-sans prose prose-blue prose-sm max-w-none prose-img:rounded-xl prose-headings:font-bold select-text text-wrap"
            placeholder={placeholder}
            style={{ minHeight: '16rem' }}
          />
        ) : (
          <textarea
            value={htmlValue}
            onChange={handleTextareaChange}
            className="w-full min-h-[16rem] max-h-[30rem] scrollbar-thin overflow-y-auto p-4 md:p-5 text-slate-700 font-mono text-xs text-left bg-slate-900 border-0 focus:outline-none focus:ring-0 resize-none select-text text-emerald-400"
            placeholder="Viết mã HTML tại đây..."
            style={{ minHeight: '16rem' }}
          />
        )}

        {/* Placeholder rendering mechanism for contentEditable */}
        {isVisual && (!value || value === '<br>' || value === '<p><br></p>') && (
          <div className="absolute top-4 md:top-5 left-4 md:left-5 text-slate-400 text-xs md:text-sm select-none pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Editor Status Indicator */}
      <div className="bg-slate-50 border-t border-slate-100 text-slate-400 text-[9px] font-mono px-3 py-1 text-right flex justify-between items-center select-none">
        <span className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isVisual ? 'bg-indigo-500' : 'bg-emerald-500 animate-pulse'}`}></span>
          {isVisual ? 'Chế độ Trực quan (Rich WYSIWYG)' : 'Chế độ Mã HTML Code'}
        </span>
        <span>
          {value ? value.replace(/<[^>]*>/g, '').length : 0} ký tự (không chứa thẻ HTML)
        </span>
      </div>
    </div>
  );
}
