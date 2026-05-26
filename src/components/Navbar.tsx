import { Trophy, Home, Users, User, Video, Award, Settings, Calendar, AwardIcon, ShieldCheck, Sliders } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeTournamentName: string;
}

export default function Navbar({ currentTab, setCurrentTab, activeTournamentName }: NavbarProps) {
  const mainNavItems = [
    { id: 'home', label: 'Trang Chủ', icon: Home },
    { id: 'leaderboard', label: 'Bảng Xếp Hạng', icon: AwardIcon },
    { id: 'schedule', label: 'Lịch Thi Đấu & Điểm', icon: Calendar },
    { id: 'draw', label: 'Chia Bảng / Sơ Đồ', icon: Award },
    { id: 'tournament-create', label: 'Tạo Giải Đấu', icon: Trophy },
    { id: 'tournament-manage', label: 'Quản Lý Giải Đấu', icon: Sliders },
    { id: 'teams', label: 'Đội & Thành Viên', icon: Users },
    { id: 'athletes', label: 'Vận Động Viên (VĐV)', icon: User },
    { id: 'news', label: 'Tin Tức & Media', icon: Video },
  ];

  const adminNavItems = [
    { id: 'sponsors', label: 'Nhà Tài Trợ', icon: ShieldCheck },
    { id: 'admin', label: 'Cơ Sở Dữ Liệu', icon: Settings },
  ];

  const allNavItems = [...mainNavItems, ...adminNavItems];

  return (
    <>
      {/* DESKTOP SIDEBAR (Large Screens) */}
      <aside id="desktop-sidebar" className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 hidden lg:flex border-r border-slate-800 z-50">
        {/* Title / Logo Area */}
        <div className="p-6 flex items-center gap-3 cursor-pointer select-none border-b border-slate-800/60" onClick={() => setCurrentTab('home')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Trophy className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block">SmashManager</span>
            <span className="text-[9px] text-[#3b82f6] font-mono tracking-wider block uppercase font-bold -mt-0.5">V-Badminton Pro</span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-grow py-6 px-4 space-y-6 overflow-y-auto scrollbar-none">
          {/* Main sections */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 pb-2 select-none">
              GIẢI ĐẤU & THI ĐẤU
            </div>
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Admin Section */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 pb-2 select-none">
              HỆ THỐNG QUẢN TRỊ
            </div>
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Info footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs select-none uppercase shrink-0">
              AD
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">Hệ Thống Trọng Tài</p>
              <p className="text-[10px] text-slate-500 truncate">admin@smash.vn</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER & HORIZONTAL SCROLL RAIL (Small Screens) */}
      <header id="mobile-navigation" className="lg:hidden bg-slate-900 text-white border-b border-slate-800 w-full z-40 sticky top-0">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5" onClick={() => setCurrentTab('home')}>
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block">SmashManager</span>
              <span className="text-[8px] text-[#3b82f6] font-mono tracking-widest block uppercase font-bold -mt-0.5">V-Badminton</span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-850 px-2 py-1 rounded text-[10px] block truncate max-w-[155px]">
            <span className="text-blue-400 font-mono font-bold truncate block">{activeTournamentName || 'Chọn giải đấu'}</span>
          </div>
        </div>

        {/* Scrollable Horizontal Rail */}
        <div className="bg-slate-950 border-t border-slate-800/60 overflow-x-auto flex whitespace-nowrap scrollbar-none px-3 py-2 gap-2">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-item-mobile-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-150 shrink-0 select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow shadow-blue-900/10'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5 mr-1 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>
    </>
  );
}
