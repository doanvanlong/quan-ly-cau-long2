import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Settings, Database, RefreshCw, Download, Upload, AlertCircle, CheckCircle, FileText, FolderTree, Sparkles } from 'lucide-react';

export default function AdminDashboard() {
  const {
    tournaments,
    teams,
    matches,
    sponsors,
    posts,
    firebaseStatus,
    resetData,
    uploadAllToFirebase,
  } = useTournament();

  const [importText, setImportText] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const stats = {
    tournaments: tournaments.length,
    teams: teams.length,
    matches: matches.length,
    completedMatches: matches.filter(m => m.status === 'COMPLETED').length,
    liveMatches: matches.filter(m => m.status === 'LIVE').length,
    sponsors: sponsors.length,
    posts: posts.length
  };

  const handleReset = () => {
    if (confirm('Hệ thống sẽ ghi đè toàn bộ dữ liệu hiện tại bằng dữ liệu mẫu ban đầu (bao gồm kết quả các trận đấu bảng đấu và sơ đồ). Bạn chắc chắn chứ?')) {
      resetData();
      setAlert({ type: 'success', msg: 'Khôi phục dữ liệu mẫu thành công!' });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handleExport = () => {
    const dataToExport = {
      tournaments,
      teams,
      matches,
      sponsors,
      posts
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', 'v-badminton-tournament-backup.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!importText.trim()) return;
      const parsed = JSON.parse(importText);
      
      if (parsed.tournaments && parsed.teams && parsed.matches && parsed.sponsors && parsed.posts) {
        localStorage.setItem('badminton_tournaments', JSON.stringify(parsed.tournaments));
        localStorage.setItem('badminton_teams', JSON.stringify(parsed.teams));
        localStorage.setItem('badminton_matches', JSON.stringify(parsed.matches));
        localStorage.setItem('badminton_sponsors', JSON.stringify(parsed.sponsors));
        localStorage.setItem('badminton_posts', JSON.stringify(parsed.posts));
        
        setAlert({ type: 'success', msg: 'Nhập tệp sao lưu thành công! Vui lòng tải lại trang.' });
        setTimeout(() => {
          setAlert(null);
          window.location.reload();
        }, 1500);
      } else {
        setAlert({ type: 'error', msg: 'Cấu trúc tệp sao lưu JSON không đúng chuẩn quy hoạch giải!' });
      }
    } catch (err) {
      setAlert({ type: 'error', msg: 'Lỗi giải mã chuỗi JSON sao lưu!' });
    }
  };

  return (
    <div id="admin-dashboard" className="space-y-6 py-2 text-left">
      
      {/* Title */}
      <div className="space-y-1 border-b border-slate-205 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="h-6.5 w-6.5 text-blue-600" />
          Quản Trị Hệ Thống & Kiểm Tra Cấu Trúc
        </h1>
        <p className="text-slate-500 text-xs md:text-sm">
          Bảng điều khiển trung ương quản lý dữ liệu sao lưu, mô phỏng Firebase Cloud, kiểm tra schemas và sơ đồ mã nguồn dự án.
        </p>
      </div>

      {alert && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs md:text-sm font-semibold border ${
          alert.type === 'success' 
            ? 'bg-blue-50 text-blue-700 border-blue-100' 
            : 'bg-rose-50 text-rose-605 border-rose-100'
        }`}>
          {alert.type === 'success' ? <CheckCircle className="h-4.5 w-4.5 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 shrink-0" />}
          {alert.msg}
        </div>
      )}

      {/* 1. Quick Stats segment */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
        {[
          { label: 'GIẢI ĐẤU KHỞI CHẠY', val: stats.tournaments },
          { label: 'ĐỘI ĐỒNG HÀNH', val: stats.teams },
          { label: 'TỔNG SỐ TRẬN', val: stats.matches },
          { label: 'TRẬN HOÀN THÀNH', val: `${stats.completedMatches}/${stats.matches}` }
        ].map((item, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-[9px] text-slate-400 font-mono font-bold tracking-wider block uppercase">{item.label}</span>
            <span className="text-lg md:text-xl font-mono font-extrabold text-slate-800 block mt-1">{item.val}</span>
          </div>
        ))}
      </div>

      {/* 2. Hybrid Database engine controls (LocalStorage MVP & Firebase Cloud) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Local Storage details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide font-mono">
              <Database className="h-4.5 w-4.5 text-blue-600" />
              LocalStorage Active MVP Mode
            </h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Website đang mặc định nạp và cập nhật dữ liệu trực tiếp tại trình duyệt (<strong className="text-slate-800">HTML5 LocalStorage Indexed DB</strong>). Cơ chế thông minh này bảo đảm hiển thị và nạp tải cực nhanh không giới hạn quota.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2 select-none">
            <button
              onClick={handleExport}
              className="bg-slate-100 hover:bg-slate-200 border-none text-slate-705 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="h-4 w-4 text-slate-600" /> Xuất tệp sao lưu (.json)
            </button>
            <button
              onClick={handleReset}
              className="bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-100 px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Gieo lại bộ dữ liệu mẫu gốc
            </button>
          </div>
        </div>

        {/* Database import form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide font-mono">
              <Upload className="h-4.5 w-4.5 text-blue-600" />
              Khôi phục từ tệp JSON bên ngoài
            </h3>
            <p className="text-slate-505 text-xs leading-relaxed">
              Bạn có thể khôi phục nhanh hệ thống bằng cách dán tệp dữ liệu đã sao lưu (.json) từ thiết bị của bạn.
            </p>
          </div>
          <form onSubmit={handleImport} className="space-y-3">
            <textarea
              placeholder="Dán chuỗi dữ liệu JSON giải đấu tại đây..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-20 bg-slate-50 text-slate-800 rounded-lg p-2 text-[10px] font-mono border border-slate-200 focus:outline-none focus:bg-white focus:border-blue-500 transition"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            >
              Đồng bộ khôi phục (Restore System)
            </button>
          </form>
        </div>

        {/* Firebase Cloud Connection indicator */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-center select-none">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide font-mono">
                <Sparkles className="h-4.5 w-4.5 text-blue-600" />
                Firebase Real-time Sync
              </h3>
              <span className={`h-2.5 w-2.5 rounded-full ${firebaseStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed">
              {firebaseStatus === 'CONNECTED' 
                ? 'Đã kết nối thành công và phát hiện Firebase! Hệ thống đang tự động đồng bộ hoá đa người dùng thời gian thực sang Firestore Cloud.' 
                : 'Công cụ Firebase đã sẵn sàng để tích hợp đồng bộ dữ liệu thời gian thực (Real-time Cloud Sync) khi cấu hình tệp Firebase.'}
            </p>
          </div>

          <div className="space-y-2 select-none">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[10px] font-mono text-slate-500 space-y-0.5 shadow-inner">
              <span className="text-slate-400 uppercase block font-bold text-[8px] tracking-wider mb-1">PROVISION SCHEMAS:</span>
              <p>Trạng thái: {firebaseStatus === 'CONNECTED' ? 'Live Cloud Sync Active' : 'Off-cloud local MVP fallback'}</p>
              <p>Engine: Firestore DB Core v11</p>
              <p>Auth: Google Social OAuth client</p>
            </div>

            {uploadAllToFirebase && (
              <button
                type="button"
                onClick={uploadAllToFirebase}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 mt-2"
              >
                <Database className="h-4 w-4" />
                Đồng bộ dữ liệu lên Firebase Cloud
              </button>
            )}

            <div className="text-[10px] text-slate-400 font-semibold italic text-center">
              *Để liên kết live: Hãy thiết lập Firestore DB ở AI Studio panel.
            </div>
          </div>
        </div>

      </div>

      {/* 3. Render database schema blueprint & Client structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-205 select-none">
        
        {/* Left: Document database structure schema */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-bold">
            <FileText className="h-4 w-4 text-blue-600" />
            Cấu Trúc Hệ Thống Cơ Sở Dữ Liệu (Firestore Schema)
          </h3>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 overflow-x-auto text-[10px] font-mono whitespace-pre text-slate-600 max-h-72 overflow-y-auto scrollbar-thin shadow-inner leading-relaxed">
{`// FIRESTORE BLUEPRINT SCHEMA (firebase-blueprint.json)

✦ path: /tournaments/{tournamentId}
   ├── schema: Tournament
   └── fields: { id, name, format, numberOfTeams, pointsPerVictory, status }

✦ path: /tournaments/{tournamentId}/teams/{teamId}
   ├── schema: Team
   └── fields: { id, name, logo, group }

✦ path: /tournaments/{tournamentId}/teams/{teamId}/players/{playerId}
   ├── schema: Player
   └── fields: { id, name, role }

✦ path: /tournaments/{tournamentId}/matches/{matchId}
   ├── schema: Match
   └── fields: { id, tournamentId, stage, scoreSets: [], status, winnerId }

✦ path: /sponsors/{sponsorId}
   ├── schema: Sponsor
   └── fields: { id, name, logo, tier, website, amount }

✦ path: /posts/{postId}
   ├── schema: Post
   └── fields: { id, title, content, category, date, author }`}
          </div>
        </div>

        {/* Right: Client file directory structural folder blueprints */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-bold font-mono">
            <FolderTree className="h-4 w-4 text-blue-600" />
            Bản đồ cấu trúc thư mục dự án (Folder Structure)
          </h3>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 overflow-x-auto text-[10px] font-mono text-slate-605 max-h-72 overflow-y-auto scrollbar-thin shadow-inner leading-relaxed">
{`v-badminton-pro-tournament/
├── metadata.json                 # Cấu hình platform & permissions
├── firebase-blueprint.json       # Định nghĩa thực thể của DB
├── package.json                  # Quản lý dependencies & build scripts
├── vite.config.ts                # Khởi động máy chủ phát triển
├── index.html                    # Điểm nạp đầu tiên của Webapp
└── src/
    ├── main.tsx                  # Điểm khởi chạy của React app
    ├── index.css                 # Import Tailwind CSS v4 setup
    ├── App.tsx                   # Central router & tabs coordinator
    ├── types.ts                  # Khai báo các mô hình dữ liệu chính thức
    ├── data/
    │   └── mockData.ts           # Gieo giống các dữ liệu mẫu hoàn hảo
    ├── context/
    │   └── TournamentContext.tsx # Toàn bộ logic giải đấu & bốc thăm
    └── components/
        ├── Navbar.tsx            # Desktop sidebar/Mobile top header bar
        ├── HomeView.tsx          # Trang chủ mến khách banner cực đẹp
        ├── TournamentCreation.tsx# Biểu mẫu tạo giải đấu tối ưu
        ├── TeamsRoster.tsx       # Gom thành viên, tuyển thủ đội bóng
        ├── DivisionDraw.tsx      # Bốc thăm chia bảng & Vẽ sơ đồ bracket
        ├── ScheduleManager.tsx   # Quán xuyến lịch, cập nhật điểm hiệp deuce
        ├── Leaderboard.tsx       # Bảng tích lũy vòng tròn tự động xếp hạng
        ├── NewsFeed.tsx          # Tin tức báo chí & Iframe clips
        └── AdminDashboard.tsx    # Cố máy sao lưu, schema và backup JSON`}
          </div>
        </div>

      </div>

    </div>
  );
}
