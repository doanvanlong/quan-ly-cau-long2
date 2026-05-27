import { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Calendar, Play, Trophy, Users, Star, ArrowUpRight, Award, Zap, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import HomeBracketModule from './HomeBracketModule';
import { Match } from '../types';

interface HomeViewProps {
  setCurrentTab: (tab: string) => void;
  onPostClick: (postId: string) => void;
}

export default function HomeView({ setCurrentTab, onPostClick }: HomeViewProps) {
  const { tournaments, teams, matches, sponsors, posts, athletes, activeTournamentId, slides } = useTournament();

  const activeTournaments = tournaments.filter(t => t.status !== 'DEACTIVE');
  const activeTourney = activeTournaments.find(t => t.id === activeTournamentId) || activeTournaments[0];

  // Aggregate matches across active tournaments for a comprehensive homepage feel
  const activeTourneyIds = activeTournaments.map(t => t.id);
  const liveMatches = matches.filter(m => m.status === 'LIVE' && activeTourneyIds.includes(m.tournamentId));
  const upcomingMatches = matches
    .filter(m => m.status === 'PENDING' && activeTourneyIds.includes(m.tournamentId))
    .sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    })
    .slice(0, 4);

  const recentNews = posts.slice(0, 3);

  // Slides Carousel integration for HomeView
  const activeSlides = (slides || []).filter(s => s.isActive);
  const displaySlides = activeSlides.length > 0 ? activeSlides : [
    {
      id: 'default-1',
      imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200',
      title: 'Nơi Bản Lĩnh Tỏa Sáng, Vinh Quang Chờ Đón Bạn',
      subtitle: 'Hệ Thống Giải Cầu Lông Chuyên Nghiệp v1.4',
      description: 'Hỗ trợ toàn diện việc bốc thăm chia bảng tự động, tính toán phân chia hạt giống, tự động hóa bảng xếp hạng vòng tròn, xây dựng sơ đồ thi đấu Knockout trực quan cùng quản lý nhà tài trợ và tin tức giải đấu.',
      buttonText: 'Tạo giải đấu mới',
      buttonLink: 'tournament-create'
    },
    {
      id: 'default-2',
      imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200',
      title: 'Tự Động Hóa Xếp Lịch & Tính Điểm Số',
      subtitle: 'Công Cụ Trọng Tài Sáng Tạo',
      description: 'Tự động phân chia bảng đấu, cập nhật tiến trình thi đấu, tính toán hiệu số điểm và xếp loại vận động viên theo chuẩn thi đấu quốc tế.',
      buttonText: 'Xem lịch thi đấu',
      buttonLink: 'schedule'
    }
  ];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (displaySlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % displaySlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [displaySlides.length]);

  // Group sponsors by tier
  const diamonSponsors = sponsors.filter(s => s.tier === 'KIM_CUONG');
  const goldSponsors = sponsors.filter(s => s.tier === 'VANG');
  const otherSponsors = sponsors.filter(s => s.tier === 'BAC' || s.tier === 'DONG');

  // Unified team names resolution (supporting simple registrations, custom draws & knockout placeholders)
  const getDynamicTeamName = (teamId: string | null, matchObj?: any, position?: 'team1' | 'team2') => {
    if (!teamId) {
      if (matchObj && matchObj.stage === 'KNOCKOUT') {
        const foundTourney = tournaments.find(t => t.id === matchObj.tournamentId);
        const format = foundTourney?.format;
        const hasSemis = foundTourney?.hasSemis !== false;
        const pairing = foundTourney?.semisPairingType || '1v4_2v3';
        const isFinal = matchObj.isFinal || matchObj.id?.endsWith('final') || matchObj.id?.endsWith('f1') || matchObj.round === 1;
        const isThirdPlace = matchObj.isThirdPlace || matchObj.id?.includes('third') || matchObj.id?.includes('3rd') || matchObj.round === 1.5;
        const isSemi1 = matchObj.id?.endsWith('semi1') || matchObj.id?.endsWith('s1');
        const isSemi2 = matchObj.id?.endsWith('semi2') || matchObj.id?.endsWith('s2');

        if (format === 'ROUND_ROBIN') {
          if (!hasSemis) {
            if (isFinal) return position === 'team1' ? 'Nhất Vòng Tròn' : 'Nhì Vòng Tròn';
            if (isThirdPlace) return position === 'team1' ? 'Hạng 3 Vòng Tròn' : 'Hạng 4 Vòng Tròn';
          } else {
            if (isSemi1) {
              if (pairing === '1v2_3v4') return position === 'team1' ? 'Nhất Vòng Tròn (A1)' : 'Nhì Vòng Tròn (A2)';
              return position === 'team1' ? 'Nhất Vòng Tròn' : 'Hạng 4 Vòng Tròn';
            }
            if (isSemi2) {
              if (pairing === '1v2_3v4') return position === 'team1' ? 'Hạng 3 Vòng Tròn' : 'Hạng 4 Vòng Tròn';
              return position === 'team1' ? 'Nhì Vòng Tròn' : 'Hạng 3 Vòng Tròn';
            }
            if (isFinal) return position === 'team1' ? 'Thắng Bán Kết 1' : 'Thắng Bán Kết 2';
            if (isThirdPlace) return position === 'team1' ? 'Thua Bán Kết 1' : 'Thua Bán Kết 2';
          }
        } else if (format === 'GROUP_KNOCKOUT') {
          if (!hasSemis) {
            if (isFinal) return position === 'team1' ? 'Nhất Bảng A' : 'Nhất Bảng B';
            if (isThirdPlace) return position === 'team1' ? 'Nhì Bảng A' : 'Nhì Bảng B';
          } else {
            if (isSemi1) {
              if (pairing === '1v2_3v4') return position === 'team1' ? 'Nhất Bảng A (A1)' : 'Nhất Bảng B (B1)';
              return position === 'team1' ? 'Nhất Bảng A (A1)' : 'Nhì Bảng B (B2)';
            }
            if (isSemi2) {
              if (pairing === '1v2_3v4') return position === 'team1' ? 'Nhì Bảng A (A2)' : 'Nhì Bảng B (B2)';
              return position === 'team1' ? 'Nhất Bảng B (B1)' : 'Nhì Bảng A (A2)';
            }
            if (isFinal) return position === 'team1' ? 'Thắng Bán Kết 1' : 'Thắng Bán Kết 2';
            if (isThirdPlace) return position === 'team1' ? 'Thua Bán Kết 1' : 'Thua Bán Kết 2';
          }
        } else if (format === 'KNOCKOUT') {
          const activePairedTeams = foundTourney?.pairedTeams || [];
          if (activePairedTeams.length >= 8) {
            if (matchObj.id?.endsWith('q1')) return position === 'team1' ? 'Hạt Giống #1' : 'Hạng 8';
            if (matchObj.id?.endsWith('q2')) return position === 'team1' ? 'Hạng 5' : 'Hạt Giống #4';
            if (matchObj.id?.endsWith('q3')) return position === 'team1' ? 'Hạt Giống #3' : 'Hạng 6';
            if (matchObj.id?.endsWith('q4')) return position === 'team1' ? 'Hạng 7' : 'Hạt Giống #2';
            if (isSemi1) return position === 'team1' ? 'Thắng Tứ Kết 1' : 'Thắng Tứ Kết 2';
            if (isSemi2) return position === 'team1' ? 'Thắng Tứ Kết 3' : 'Thắng Tứ Kết 4';
          } else {
            if (isSemi1) return position === 'team1' ? 'Hạt Giống #1' : 'Hạt Giống #4';
            if (isSemi2) return position === 'team1' ? 'Hạt Giống #3' : 'Hạt Giống #2';
          }
          if (isFinal) return position === 'team1' ? 'Thắng Bán Kết 1' : 'Thắng Bán Kết 2';
          if (isThirdPlace) return position === 'team1' ? 'Thua Bán Kết 1' : 'Thua Bán Kết 2';
        }
      }
      return 'Chờ xác định';
    }

    const foundTourney = tournaments.find(t => t.id === matchObj?.tournamentId);
    const prefix = `team-draw-${foundTourney?.id}-`;
    if (teamId.startsWith(prefix)) {
      const suffix = teamId.substring(prefix.length);
      const dashIdx = suffix.indexOf('-');
      const indexStr = dashIdx !== -1 ? suffix.substring(0, dashIdx) : suffix;
      const index = parseInt(indexStr, 10);
      
      const activePairedTeams = foundTourney?.pairedTeams || [];
      const activeAthletesAssigned = foundTourney?.athletesAssigned || [];
      
      if (!isNaN(index) && activePairedTeams && activePairedTeams[index]) {
        const pt = activePairedTeams[index];
        if (pt.isCustomName) return pt.name;
        
        const teamAthletes = pt.athleteIds
          .map(id => (activeAthletesAssigned || []).find(a => a.id === id) || (athletes || []).find(a => a.id === id))
          .filter(Boolean);
        
        if (teamAthletes.length > 0) {
          return `Đội ${teamAthletes.map(p => p?.name).join(' . ')}`;
        }
        return pt.name;
      }
    }

    const foundTeam = teams.find(t => t.id === teamId);
    if (foundTeam) {
      if (foundTeam.name.startsWith("Đội ") && foundTeam.players.length > 0) {
        return `Đội ${foundTeam.players.map(p => p.name).join(' . ')}`;
      }
      return foundTeam.name;
    }
    return teamId || 'Chưa xác định';
  };

  // Helper theme background
  const getTeamLogoColor = (logo: string) => {
    switch (logo) {
      case 'emerald': return 'bg-emerald-500 text-slate-950';
      case 'blue': return 'bg-blue-500 text-white';
      case 'amber': return 'bg-amber-400 text-slate-950';
      case 'rose': return 'bg-rose-500 text-white';
      case 'indigo': return 'bg-indigo-500 text-white';
      case 'purple': return 'bg-purple-500 text-white';
      case 'cyan': return 'bg-cyan-500 text-slate-950';
      case 'orange': return 'bg-orange-500 text-white';
      default: return 'bg-slate-400 text-slate-950';
    }
  };

  // Professional date representation containing day of week name + custom format
  const formatMatchDateTime = (timeStr: string | undefined | null) => {
    if (!timeStr) return { dateStr: 'Chờ xếp ngày', timeStr: 'Chưa xếp giờ' };
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return { dateStr: 'Chờ xếp ngày', timeStr: 'Chưa xếp giờ' };
    
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    const dateFormatted = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
    const timeFormatted = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    return {
      dateStr: `${dayName}, ${dateFormatted}`,
      timeStr: timeFormatted
    };
  };

  // Unified stage and round indicator formatting
  const getMatchStageLabel = (match: Match) => {
    if (match.stage === 'GROUP') {
      return match.groupName ? `${match.groupName} • Vòng ${match.round}` : `Vòng Bảng • Vòng ${match.round}`;
    }
    if (match.isFinal || match.id?.endsWith('final') || match.round === 1) return 'Chung Kết';
    if (match.isThirdPlace || match.id?.includes('third') || match.round === 1.5) return 'Tranh Hạng 3';
    return `Bán Kết`;
  };

  // Helper to fallback slide backgrounds safely
  const imageUrlFallback = (url: string) => {
    return url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=1200';
  };

  return (
    <div id="home-view" className="space-y-8 py-2">
      {/* 1. Hero Sliding Showcase Banner */}
      <div className="relative h-[280px] md:h-[350px] w-full bg-slate-950 rounded-2xl border border-slate-850 shadow-2xl overflow-hidden select-none">
        {displaySlides.map((slide, index) => {
          const isCurrent = index === currentSlideIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isCurrent 
                  ? 'opacity-100 pointer-events-auto z-10' 
                  : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              {/* Complex high-fidelity image rendering with crossfade gradients */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/15 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-transparent z-10" />
              
              <img
                src={imageUrlFallback(slide.imageUrl)}
                alt={slide.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Decorative radial lighting */}
              <div className="absolute right-0 bottom-0 top-0 w-1/2 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none rounded-full blur-3xl z-10 animate-pulse"></div>

              {/* Text / Action overlay using framer motion to cascade slide content */}
              <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 py-10 z-20 text-left max-w-3xl space-y-4">
                {isCurrent && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="space-y-4"
                  >
                    {slide.subtitle && (
                      <div className="inline-flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 px-3 py-1 rounded-full text-blue-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                        <Zap className="h-3.5 w-3.5 animate-bounce" />
                        {slide.subtitle}
                      </div>
                    )}

                    <h1 className="text-2xl md:text-3.5xl lg:text-4xl font-sans font-black text-white tracking-tight leading-tight uppercase">
                      {slide.title}
                    </h1>

                    {slide.description && (
                      <p className="text-slate-300/90 text-xs md:text-sm font-light leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-3">
                        {slide.description}
                      </p>
                    )}

                    {slide.buttonText && (
                      <div className="flex flex-wrap gap-2.5 pt-1.5">
                        <button
                          onClick={() => {
                            const linkVal = slide.buttonLink || 'tournament-create';
                            setCurrentTab(linkVal);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 text-white font-sans font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition duration-150 flex items-center gap-2 cursor-pointer border border-transparent"
                        >
                          <Trophy className="h-4 w-4" />
                          {slide.buttonText}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Nav Bullets */}
        {displaySlides.length > 1 && (
          <div className="absolute bottom-5 left-6 md:left-12 z-30 flex gap-2.5 items-center bg-slate-900/40 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-white/5">
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev - 1 + displaySlides.length) % displaySlides.length)}
              className="text-white/60 hover:text-white hover:scale-110 transition shrink-0 p-0.5"
              title="Slide trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1.5">
              {displaySlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlideIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === currentSlideIndex 
                      ? 'w-5 bg-blue-500' 
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Trang ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentSlideIndex(prev => (prev + 1) % displaySlides.length)}
              className="text-white/60 hover:text-white hover:scale-110 transition shrink-0 p-0.5"
              title="Slide tiếp"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Live & Upcoming Highlight Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Matches Section */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 text-left">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div className="space-y-0.5">
                <h2 className="font-extrabold text-slate-800 tracking-tight text-sm uppercase font-mono mt-0.5">Bảng Điểm Trực Tiếp</h2>
                <p className="text-slate-400 text-[10px] font-semibold uppercase font-mono">Bản tin trực tiếp từ các sân đấu</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentTab('schedule')}
              className="text-blue-600 hover:text-blue-500 text-xs font-bold flex items-center gap-1 cursor-pointer transition select-none"
            >
              Chi tiết lịch <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          {liveMatches.length > 0 ? (
            <div className="space-y-6">
              {liveMatches.map((match) => {
                const tourneyInfo = tournaments.find(t => t.id === match.tournamentId);
                const isT1Serving = match.status === 'LIVE' && match.servingTeam === 1;
                const isT2Serving = match.status === 'LIVE' && match.servingTeam === 2;
                const lastSetIndex = match.scoreSets.length > 0 ? match.scoreSets.length - 1 : 0;
                
                return (
                  <div key={match.id} className="bg-white border border-slate-205 hover:border-blue-500/40 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                    
                    {/* Top Broadcast Header: Tournament, Court, Status */}
                    <div className="bg-slate-50/70 px-4 py-3 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-mono font-black py-0.5 px-2 rounded-md tracking-wider uppercase animate-pulse flex items-center gap-1 select-none">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 inline-block animate-ping" />
                          LIVE
                        </span>
                        <span className="text-slate-700 text-xs font-black uppercase tracking-tight truncate max-w-[200px] md:max-w-xs" title={tourneyInfo?.name}>
                          {tourneyInfo?.name || 'Giải đấu hệ thống'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                          {match.court || 'Sân 1'}
                        </span>
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                          {getMatchStageLabel(match)}
                        </span>
                      </div>
                    </div>

                    {/* Main official stadium match score block */}
                    <div className="p-4 md:p-5 flex flex-col gap-4">
                      
                      {/* Grid Scoreboard Container */}
                      <div className="border border-slate-200/95 rounded-xl overflow-hidden shadow-2xs divide-y divide-slate-100 bg-slate-50/50">
                        
                        {/* Player-Team 1 Row */}
                        <div className={`flex items-center justify-between px-3 md:px-5 py-3 transition ${isT1Serving ? 'bg-amber-500/[0.04]' : ''}`}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Avatar */}
                            {(() => {
                              const t = teams.find(team => team.id === match.team1Id);
                              if (t?.avatar) {
                                return (
                                  <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 select-none">
                                    <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                );
                              }
                              return (
                                <div className={`h-9 w-9 rounded-full ${getTeamLogoColor(t?.logo || 'blue')} flex items-center justify-center font-black text-white text-sm shadow-xs shrink-0 select-none`}>
                                  {getDynamicTeamName(match.team1Id, match, 'team1').charAt(0)}
                                </div>
                              );
                            })()}
                            
                            {/* Contestant detail */}
                            <div className="min-w-0 space-y-0.5">
                              <h4 className="text-xs md:text-sm font-black text-slate-800 leading-normal truncate" title={getDynamicTeamName(match.team1Id, match, 'team1')}>
                                {getDynamicTeamName(match.team1Id, match, 'team1')}
                              </h4>
                              {isT1Serving ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md animate-pulse">
                                  🏸 ĐANG GIAO CẦU
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">Nhận cầu</span>
                              )}
                            </div>
                          </div>

                          {/* Set scores column for Team 1 */}
                          <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0 pl-3 select-none">
                            {[0, 1, 2].map((setIdx) => {
                              const set = match.scoreSets[setIdx];
                              const isActive = setIdx === lastSetIndex;
                              const hasScore = !!set;
                              const scoreVal = hasScore ? set.team1Score : null;

                              return (
                                <div 
                                  key={setIdx} 
                                  className={`w-11 md:w-13 h-10 rounded-lg flex flex-col items-center justify-center border font-mono transition-all duration-200 ${
                                    isActive 
                                      ? 'bg-slate-900 border-amber-400 text-amber-400 font-extrabold shadow-sm scale-102 ring-1 ring-amber-400/25' 
                                      : hasScore 
                                        ? 'bg-white border-slate-200 text-slate-650 font-black' 
                                        : 'bg-transparent border-dashed border-slate-200 text-slate-300'
                                  }`}
                                >
                                  <span className="text-xs md:text-sm leading-none">{scoreVal !== null ? scoreVal : '-'}</span>
                                  <span className={`text-[8px] font-black uppercase mt-0.5 ${isActive ? 'text-amber-400/80' : 'text-slate-400'}`}>
                                    {isActive ? 'LIVE' : `S${setIdx + 1}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Player-Team 2 Row */}
                        <div className={`flex items-center justify-between px-3 md:px-5 py-3 transition ${isT2Serving ? 'bg-amber-500/[0.04]' : ''}`}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Avatar */}
                            {(() => {
                              const t = teams.find(team => team.id === match.team2Id);
                              if (t?.avatar) {
                                return (
                                  <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-white shadow-xs shrink-0 select-none">
                                    <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                );
                              }
                              return (
                                <div className={`h-9 w-9 rounded-full ${getTeamLogoColor(t?.logo || 'rose')} flex items-center justify-center font-black text-white text-sm shadow-xs shrink-0 select-none`}>
                                  {getDynamicTeamName(match.team2Id, match, 'team2').charAt(0)}
                                </div>
                              );
                            })()}
                            
                            {/* Contestant detail */}
                            <div className="min-w-0 space-y-0.5">
                              <h4 className="text-xs md:text-sm font-black text-slate-800 leading-normal truncate" title={getDynamicTeamName(match.team2Id, match, 'team2')}>
                                {getDynamicTeamName(match.team2Id, match, 'team2')}
                              </h4>
                              {isT2Serving ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-md animate-pulse">
                                  🏸 ĐANG GIAO CẦU
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">Nhận cầu</span>
                              )}
                            </div>
                          </div>

                          {/* Set scores column for Team 2 */}
                          <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0 pl-3 select-none">
                            {[0, 1, 2].map((setIdx) => {
                              const set = match.scoreSets[setIdx];
                              const isActive = setIdx === lastSetIndex;
                              const hasScore = !!set;
                              const scoreVal = hasScore ? set.team2Score : null;

                              return (
                                <div 
                                  key={setIdx} 
                                  className={`w-11 md:w-13 h-10 rounded-lg flex flex-col items-center justify-center border font-mono transition-all duration-200 ${
                                    isActive 
                                      ? 'bg-slate-900 border-amber-400 text-amber-400 font-extrabold shadow-sm scale-102 ring-1 ring-amber-400/25' 
                                      : hasScore 
                                        ? 'bg-white border-slate-200 text-slate-650 font-black' 
                                        : 'bg-transparent border-dashed border-slate-200 text-slate-300'
                                  }`}
                                >
                                  <span className="text-xs md:text-sm leading-none">{scoreVal !== null ? scoreVal : '-'}</span>
                                  <span className={`text-[8px] font-black uppercase mt-0.5 ${isActive ? 'text-amber-400/80' : 'text-slate-400'}`}>
                                    {isActive ? 'LIVE' : `S${setIdx + 1}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-2xl p-10 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3.5">
              <Calendar className="h-9 w-9 text-slate-400 animate-bounce" />
              <div className="space-y-1">
                <p className="text-slate-705 font-extrabold text-xs uppercase tracking-wider">Chưa phát sóng trận live nào</p>
                <p className="text-slate-450 text-[11px] max-w-sm mx-auto leading-relaxed">
                  Hiện không có trận đấu nào đang phát trực tiếp. Các trận đấu sẽ tự động đồng bộ lên bảng điểm trực tiếp khi BTC bắt đầu cập nhật tỷ số sân đấu.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('schedule')}
                className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl shadow-md transition duration-150 cursor-pointer"
              >
                Cập nhật điểm live từ Lịch thi đấu
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Snapshot Stats Card - Upcoming Schedule with Date */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 text-left flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-855 tracking-tight text-sm uppercase font-mono flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-blue-600 shrink-0" />
                Lịch Thi Đấu Tiếp Theo
              </h2>
              <span className="text-slate-400 text-[10px] font-mono">AGENDA</span>
            </div>

            {upcomingMatches.length > 0 ? (
              <div className="space-y-3.5">
                {upcomingMatches.map((match) => {
                  const matchTimeInfo = formatMatchDateTime(match.scheduledTime);
                  const isKnockout = match.stage === 'KNOCKOUT';
                  const tourneyInfo = tournaments.find(t => t.id === match.tournamentId);

                  return (
                    <div key={match.id} className="group bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch justify-between gap-3.5 transition-all duration-300 hover:shadow-2xs hover:border-blue-500/35">
                      
                      {/* Left: Beautifully formatted Date-Time Agenda Badge */}
                      <div className="flex sm:flex-col items-center justify-center gap-1 bg-gradient-to-b from-blue-50 to-blue-100/30 border border-blue-100 rounded-xl px-3 py-2.5 shrink-0 text-center min-w-[110px] select-none">
                        <span className="text-slate-800 font-mono text-sm font-black tracking-tight flex items-center gap-1.5 justify-center">
                          <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          {matchTimeInfo.timeStr}
                        </span>
                        <div className="space-y-0.5">
                          <span className="block text-[9px] text-blue-700 font-extrabold uppercase tracking-wide leading-none">
                            {matchTimeInfo.dateStr.split(',')[0]} {/* Day of week name (Thứ) */}
                          </span>
                          <span className="block text-[9px] text-slate-500 font-bold font-mono leading-none mt-0.5">
                            {matchTimeInfo.dateStr.split(',')[1]?.trim() || ''} {/* Formatted Date */}
                          </span>
                        </div>
                      </div>

                      {/* Right: Team pairings with Court & Tournament metadata */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2.5">
                        <div className="space-y-1.5">
                          {/* Tournament stage and category tags */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${isKnockout ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' : 'bg-amber-50 text-amber-700 border border-slate-150'}`}>
                              {getMatchStageLabel(match).split('•')[0]}
                            </span>
                            <span className="text-slate-450 font-mono text-[9px] font-bold truncate max-w-[120px]" title={tourneyInfo?.name}>
                              {tourneyInfo?.name ? `| ${tourneyInfo.name}` : ''}
                            </span>
                          </div>
                          
                          {/* Competitors matched */}
                          <div className="flex items-center gap-1.5 xl:gap-2 flex-wrap text-left">
                            <span className="text-xs font-extrabold text-slate-800 truncate max-w-[105px]" title={getDynamicTeamName(match.team1Id, match, 'team1')}>
                              {getDynamicTeamName(match.team1Id, match, 'team1')}
                            </span>
                            <span className="text-[10px] text-rose-500 font-black font-mono bg-rose-50 border border-rose-100 rounded px-1 py-0.2 select-none">VS</span>
                            <span className="text-xs font-extrabold text-slate-800 truncate max-w-[105px]" title={getDynamicTeamName(match.team2Id, match, 'team2')}>
                              {getDynamicTeamName(match.team2Id, match, 'team2')}
                            </span>
                          </div>
                        </div>

                        {/* Court mapping & play status */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-150 rounded px-1.5 py-0.5 font-mono font-extrabold uppercase">
                            <MapPin className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                            {match.court || 'Sân 1'}
                          </span>
                          <span className="inline-flex items-center text-[9px] text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 font-mono font-bold uppercase select-none">
                            Chờ Đấu
                          </span>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 font-mono select-none space-y-1.5 py-10">
                <Calendar className="h-6 w-6 text-slate-300 mx-auto" />
                <p className="font-bold">Đã diễn ra tất cả</p>
                <p className="text-[9px] text-slate-400 leading-normal max-w-[190px] mx-auto">Không tìm thấy lịch thi đấu đang chờ rảnh rỗi nào phía trước.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setCurrentTab('schedule')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-755 font-bold text-xs py-2.5 rounded-xl border border-slate-205 transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-slate-500" />
              Xem Toàn Bộ Lịch Trình
            </button>
          </div>
        </div>
      </div>

      {/* Sơ đồ nhánh đấu Real-time */}
      <HomeBracketModule />

      {/* 3. News Feed Container Grid (Tin tức / Bài viết / Video cầu lông) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-850 tracking-tight flex items-center gap-1.5 uppercase font-mono">
            <Star className="h-4.5 w-4.5 text-blue-600" />
            Tin Tức & Điểm Nhấn Giải Đấu
          </h2>
          <button
            onClick={() => setCurrentTab('news')}
            className="text-blue-620 hover:text-blue-500 text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            Xem tất cả tin media →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentNews.map((post) => (
            <div
              key={post.id}
              onClick={() => onPostClick(post.id)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl overflow-hidden cursor-pointer shadow-sm transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-40 overflow-hidden bg-slate-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  {post.category === 'Video' && (
                    <div className="absolute inset-0 bg-slate-900/35 flex items-center justify-center">
                      <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg">
                        <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 bg-slate-900/90 backdrop-blur-md text-blue-400 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider uppercase font-extrabold border border-slate-800">
                    {post.category === 'Video' ? 'VIDEO CLIP' : 'TIN TỨC'}
                  </span>
                </div>

                <div className="p-4 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-mono block font-medium">
                    {post.date} • {post.author}
                  </span>
                  <h3 className="font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors text-xs md:text-sm line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end">
                <span className="text-[11px] text-blue-600 font-bold group-hover:underline flex items-center gap-0.5">
                  Đọc tiếp <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Sponsors Grid Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
        <div className="text-center max-w-lg mx-auto space-y-1.5">
          <span className="text-blue-600 text-xs font-mono font-bold tracking-widest uppercase block">Official Partners</span>
          <h2 className="text-xl font-bold text-slate-805 tracking-tight">Cộng Đồng Nhà Tài Trợ Đồng Hành</h2>
          <p className="text-slate-450 text-[11px] md:text-xs">
            Sự hỗ trợ quý báu từ các doanh nghiệp, thương hiệu là nền tảng cốt lõi đưa chất lượng tổ chức giải ngày một vươn xa tầm châu lục.
          </p>
        </div>

        <div className="space-y-6 pt-2 select-none">
          {/* Diamond Level */}
          {diamonSponsors.length > 0 && (
            <div className="space-y-3">
              <span className="text-[9px] text-[#cca01a] font-mono font-bold uppercase tracking-widest text-center block">
                ✦ ✦ ✦ NHÀ TÀI TRỢ KIM CƯƠNG ✦ ✦ ✦
              </span>
              <div className="flex flex-wrap justify-center gap-5">
                {diamonSponsors.map(sp => (
                  <a
                    key={sp.id}
                    href={sp.website || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-50 border border-slate-200 hover:border-blue-300 p-3.5 rounded-xl flex items-center gap-3 transition min-w-[190px] justify-center shadow-inner"
                  >
                    <div className="h-9 w-9 shrink-0 rounded-lg overflow-hidden bg-white border border-slate-200/80 p-0.5">
                      <img src={sp.logo} alt={sp.name} className="h-full w-full object-cover rounded" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <span className="text-slate-800 text-xs font-bold block leading-snug">{sp.name}</span>
                      <span className="text-[9px] text-amber-600 font-mono font-bold block uppercase -mt-0.5">Diamond Sponsor</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Gold Level */}
          {goldSponsors.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-[9px] text-amber-600 font-mono font-bold uppercase tracking-widest text-center block">
                ✦ NHÀ TÀI TRỢ VÀNG ✦
              </span>
              <div className="flex flex-wrap justify-center gap-4">
                {goldSponsors.map(sp => (
                  <a
                    key={sp.id}
                    href={sp.website || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-slate-50 border border-slate-150 hover:border-blue-200 p-3 rounded-xl flex items-center gap-2.5 transition min-w-[160px]"
                  >
                    <div className="h-8 w-8 shrink-0 rounded bg-white overflow-hidden border border-slate-200/80 p-0.5">
                      <img src={sp.logo} alt={sp.name} className="h-full w-full object-cover rounded" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <span className="text-slate-800 text-xs font-semibold block leading-tight">{sp.name}</span>
                      <span className="text-[9px] text-amber-600 font-mono block">Gold Sponsor</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Other Categories */}
          {otherSponsors.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2.5 pt-3 border-t border-slate-100">
              {otherSponsors.map(sp => (
                <span
                  key={sp.id}
                  className="bg-slate-50 text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-150 transition"
                >
                  {sp.name} ({sp.tier === 'BAC' ? 'Tài trợ Bạc' : 'Đồng hành/Truyền thông'})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
