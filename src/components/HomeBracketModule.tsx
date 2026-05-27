import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { 
  Trophy, 
  Swords, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Sparkles, 
  AlertCircle,
  Zap,
  Play,
  CheckCircle,
  Search
} from 'lucide-react';
import { Athlete, Match, Tournament } from '../types';

const isSetCompleted = (
  setScore: { team1Score: number; team2Score: number }, 
  setIdx: number, 
  tourney: any, 
  isFinalOr3rd: boolean
): boolean => {
  const t1 = setScore.team1Score;
  const t2 = setScore.team2Score;
  if (t1 === 0 && t2 === 0) return false;
  
  let limit = tourney?.pointsPerSet || 21;
  if (isFinalOr3rd && tourney?.specialFinalsRuleEnabled) {
    if (setIdx === 3) {
      limit = tourney.specialFinalsDecidingPoints || 15;
    } else {
      limit = tourney.specialFinalsPoints || 21;
    }
  } else {
    if (setIdx === 3) {
      limit = tourney?.decidingSetPoints || 15;
    } else {
      limit = tourney?.pointsPerSet || 21;
    }
  }
  
  if (t1 === limit && t2 <= limit - 2) return true;
  if (t2 === limit && t1 <= limit - 2) return true;
  
  if (t1 > limit || t2 > limit) {
    const maxLimit = limit <= 15 ? 21 : 30;
    const diff = Math.abs(t1 - t2);
    if (t1 === maxLimit && t2 === maxLimit - 1) return true;
    if (t2 === maxLimit && t1 === maxLimit - 1) return true;
    if (diff === 2) return true;
  }
  return false;
};

export default function HomeBracketModule() {
  const { tournaments, teams, matches, athletes, activeTournamentId } = useTournament();

  const activeTournaments = tournaments.filter(t => t.status !== 'DEACTIVE');
  
  // Set default tournament state
  const [selectedTourneyId, setSelectedTourneyId] = useState<string>('');

  useEffect(() => {
    if (activeTournamentId) {
      setSelectedTourneyId(activeTournamentId);
    } else if (activeTournaments.length > 0) {
      setSelectedTourneyId(activeTournaments[0].id);
    }
  }, [activeTournamentId, tournaments]);

  const tourney = activeTournaments.find(t => t.id === selectedTourneyId);

  if (!tourney) {
    return null;
  }

  // Filter matches for the selected tournament
  const tMatches = matches.filter(m => m.tournamentId === tourney.id);
  const groupMatches = tMatches.filter(m => m.stage === 'GROUP');
  const koMatches = tMatches.filter(m => m.stage === 'KNOCKOUT');

  const level1Finals = koMatches.filter(m => m.round === 1);
  const level2Semis = koMatches.filter(m => m.round === 2);
  const level3Quarters = koMatches.filter(m => m.round === 3);
  const level1ThirdPlace = koMatches.filter(m => m.isThirdPlace || m.round === 1.5);

  const getDynamicTeamName = (teamId: string | null, mObj?: any, position?: 'team1' | 'team2') => {
    if (!teamId) {
      if (mObj && mObj.stage === 'KNOCKOUT') {
        const isFinal = mObj.isFinal || mObj.id?.endsWith('final') || mObj.id?.endsWith('f1') || mObj.round === 1;
        const isThirdPlace = mObj.isThirdPlace || mObj.id?.includes('third') || mObj.id?.includes('3rd') || mObj.round === 1.5;
        const isSemi1 = mObj.id?.endsWith('semi1') || mObj.id?.endsWith('s1');
        const isSemi2 = mObj.id?.endsWith('semi2') || mObj.id?.endsWith('s2');

        const format = tourney.format;
        const hasSemis = tourney.hasSemis !== false;
        const pairing = tourney.semisPairingType || '1v4_2v3';

        if (format === 'ROUND_ROBIN') {
          if (hasSemis === false) {
            if (isFinal) {
              return position === 'team1' ? 'Nhất Vòng Tròn (Hạng 1)' : 'Nhì Vòng Tròn (Hạng 2)';
            }
            if (isThirdPlace) {
              return position === 'team1' ? 'Hạng 3 Vòng Tròn' : 'Hạng 4 Vòng Tròn';
            }
          } else {
            if (isSemi1) {
              if (pairing === '1v2_3v4') {
                return position === 'team1' ? 'Nhất Vòng Tròn (Hạng 1)' : 'Nhì Vòng Tròn (Hạng 2)';
              }
              return position === 'team1' ? 'Nhất Vòng Tròn (Hạng 1)' : 'Hạng 4 Vòng Tròn';
            }
            if (isSemi2) {
              if (pairing === '1v2_3v4') {
                return position === 'team1' ? 'Hạng 3 Vòng Tròn' : 'Hạng 4 Vòng Tròn';
              }
              return position === 'team1' ? 'Nhì Vòng Tròn (Hạng 2)' : 'Hạng 3 Vòng Tròn';
            }
            if (isFinal) {
              return position === 'team1' ? 'Thắng Bán Kết 1' : 'Thắng Bán Kết 2';
            }
            if (isThirdPlace) {
              return position === 'team1' ? 'Thua Bán Kết 1' : 'Thua Bán Kết 2';
            }
          }
        } else if (format === 'GROUP_KNOCKOUT') {
          if (hasSemis === false) {
            if (isFinal) {
              return position === 'team1' ? 'Nhất Bảng A (A1)' : 'Nhất Bảng B (B1)';
            }
            if (isThirdPlace) {
              return position === 'team1' ? 'Nhì Bảng A (A2)' : 'Nhì Bảng B (B2)';
            }
          } else {
            if (isSemi1) {
              if (pairing === '1v2_3v4') {
                return position === 'team1' ? 'Nhất Bảng A (A1)' : 'Nhất Bảng B (B1)';
              }
              return position === 'team1' ? 'Nhất Bảng A (A1)' : 'Nhì Bảng B (B2)';
            }
            if (isSemi2) {
              if (pairing === '1v2_3v4') {
                return position === 'team1' ? 'Nhì Bảng A (A2)' : 'Nhì Bảng B (B2)';
              }
              return position === 'team1' ? 'Nhất Bảng B (B1)' : 'Nhì Bảng A (A2)';
            }
            if (isFinal) {
              return position === 'team1' ? 'Thắng Bán Kết 1' : 'Thắng Bán Kết 2';
            }
            if (isThirdPlace) {
              return position === 'team1' ? 'Thua Bán Kết 1' : 'Thua Bán Kết 2';
            }
          }
        } else if (format === 'KNOCKOUT') {
          const activePairedTeams = tourney.pairedTeams || [];
          const count = activePairedTeams.length;
          if (count >= 8) {
            const isQuarter1 = mObj.id?.endsWith('q1');
            const isQuarter2 = mObj.id?.endsWith('q2');
            const isQuarter3 = mObj.id?.endsWith('q3');
            const isQuarter4 = mObj.id?.endsWith('q4');
            if (isQuarter1) return position === 'team1' ? 'Hạt Giống #1' : 'Hạng 8 Giải Đấu';
            if (isQuarter2) return position === 'team1' ? 'Hạng 5 Giải Đấu' : 'Hạt Giống #4';
            if (isQuarter3) return position === 'team1' ? 'Hạt Giống #3' : 'Hạng 6 Giải Đấu';
            if (isQuarter4) return position === 'team1' ? 'Hạng 7 Giải Đấu' : 'Hạt Giống #2';
            if (isSemi1) return position === 'team1' ? 'Thắng Tứ Kết 1' : 'Thắng Tứ Kết 2';
            if (isSemi2) return position === 'team1' ? 'Thắng Tứ Kết 3' : 'Thắng Tứ Kết 4';
          } else {
            if (isSemi1) return position === 'team1' ? 'Hạt Giống #1' : 'Hạt Giống #4';
            if (isSemi2) return position === 'team1' ? 'Hạt Giống #3' : 'Hạt Giống #2';
          }
          if (isFinal) {
            return position === 'team1' ? 'Thắng Bán Kết 1' : 'Thắng Bán Kết 2';
          }
          if (isThirdPlace) {
            return position === 'team1' ? 'Thua Bán Kết 1' : 'Thua Bán Kết 2';
          }
        }
      }
      return 'Chờ xác định';
    }
    
    const prefix = `team-draw-${tourney.id}-`;
    if (teamId.startsWith(prefix)) {
      const suffix = teamId.substring(prefix.length);
      const dashIdx = suffix.indexOf('-');
      const indexStr = dashIdx !== -1 ? suffix.substring(0, dashIdx) : suffix;
      const index = parseInt(indexStr, 10);
      
      const activePairedTeams = tourney.pairedTeams || [];
      const activeAthletesAssigned = tourney.athletesAssigned || [];
      
      if (!isNaN(index) && activePairedTeams && activePairedTeams[index]) {
        const pt = activePairedTeams[index];
        const teamAthletes = pt.athleteIds
          .map(id => (activeAthletesAssigned || []).find(a => a.id === id) || athletes.find(a => a.id === id))
          .filter(Boolean) as Athlete[];
        
        if (pt.isCustomName) {
          return pt.name;
        }

        if (pt.name && !pt.name.startsWith("Đội ") && !pt.name.includes('.')) {
          return pt.name;
        }
        
        if (teamAthletes.length > 0) {
          return `Đội ${teamAthletes.map(p => p.name).join(' . ')}`;
        }
        return pt.name;
      }
    }
    
    const foundTeam = teams.find(t => t.id === teamId);
    if (foundTeam) {
      const mappedPlayers = foundTeam.players.map(p => {
        const ath = athletes.find(a => a.id === p.id);
        return ath ? ath.name : p.name;
      });
      if (foundTeam.name.startsWith("Đội ") && mappedPlayers.length > 0) {
        return `Đội ${mappedPlayers.join(' . ')}`;
      }
      return foundTeam.name;
    }
    return 'Chưa xác định';
  };

  const renderBracketMatchNode = (match: Match, isGoldMatch = false) => {
    const getScoreStr = (teamIdx: 1 | 2) => {
      if (!match.scoreSets || match.scoreSets.length === 0) return '0';
      let setsWon = 0;
      const isFinalOr3rd = !!(match.isFinal || match.isThirdPlace);
      match.scoreSets.forEach((set, idx) => {
        if (isSetCompleted(set, idx + 1, tourney, isFinalOr3rd)) {
          if (teamIdx === 1 && set.team1Score > set.team2Score) setsWon++;
          if (teamIdx === 2 && set.team2Score > set.team1Score) setsWon++;
        }
      });
      return String(setsWon);
    };

    const formatScheduledTime = (timeStr: string | undefined | null) => {
      if (!timeStr) return '';
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return '';
      const datePart = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }).replace(/\//g, '-');
      const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${timePart} Ngày ${datePart}`;
    };

    const getExactScoresStr = () => {
      if (!match.scoreSets || match.scoreSets.length === 0) return '';
      return `${match.scoreSets.map(s => `${s.team1Score}-${s.team2Score}`).join(', ')}`;
    };

    const isT1Winner = match.winnerId && match.winnerId === match.team1Id;
    const isT2Winner = match.winnerId && match.winnerId === match.team2Id;
    const isLive = match.status === 'LIVE';

    const getRoundLabel = () => {
      if (match.groupName && match.groupName.startsWith('Bảng')) {
        return `Vòng ${match.round || 1}`;
      }
      if (match.groupName === 'Vòng Tròn') {
        return `Vòng ${match.round || 1}`;
      }
      if (match.isFinal || match.id?.endsWith('final') || match.id?.endsWith('f1') || match.round === 1) {
        return 'Chung Kết';
      }
      if (match.isThirdPlace || match.id?.includes('third') || match.id?.includes('3rd') || match.round === 1.5) {
        return 'Tranh Hạng 3';
      }
      return `Bán Kết`;
    };

    return (
      <div className={`text-xs space-y-2 ${isGoldMatch ? 'py-1' : ''}`}>
        
        {/* Header containing Round + Status */}
        <div className="flex justify-between items-center text-[10px] text-slate-550 font-mono font-black uppercase tracking-wider select-none border-b border-slate-100 pb-1.5 mb-1.5">
          <span>{getRoundLabel()}</span>
          <span className={isLive ? 'text-rose-600 font-extrabold animate-pulse' : match.status === 'COMPLETED' ? 'text-blue-600 font-bold' : 'text-slate-400'}>
            {isLive ? '● TRỰC TIẾP' : match.status === 'COMPLETED' ? 'Đã Kết Thúc' : 'Chờ Đấu'}
          </span>
        </div>

        {/* Schedule metadata */}
        <div className="flex flex-wrap items-center gap-1.5 select-none pt-0.5">
          {match.scheduledTime ? (
            <div className="flex items-center gap-1 text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded-md font-mono font-extrabold uppercase tracking-wide">
              <Clock className="h-2.5 w-2.5 text-indigo-500 shrink-0" />
              <span className="truncate">{formatScheduledTime(match.scheduledTime)}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[9px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md font-mono font-medium uppercase tracking-wide">
              <Clock className="h-2.5 w-2.5 text-slate-400 shrink-0" />
              <span>Chưa xếp lịch</span>
            </div>
          )}

          <div className="flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-md font-mono font-extrabold uppercase tracking-wide">
            <MapPin className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
            <span className="truncate">Sân: {match.court || 'Sắp xếp'}</span>
          </div>
        </div>

        {/* Contestants list */}
        <div className="space-y-1">
          {/* Team 1 */}
          <div className={`flex justify-between items-center px-2 py-1 bg-white rounded border border-slate-150 hover:bg-slate-50 transition ${
            isT1Winner ? 'text-blue-600 font-extrabold border-l-2 border-l-blue-600 shadow-3xs' : isLive ? 'border-l-2 border-l-rose-500 bg-rose-50/10' : 'text-slate-605'
          }`}>
            <div className="flex items-center gap-1 flex-1 min-w-0 pr-2">
              {isLive && match.servingTeam === 1 && (
                <span className="bg-amber-100 text-amber-850 text-[8px] font-extrabold px-1 py-0.5 rounded animate-pulse shrink-0 select-none"> GIAO</span>
              )}
              <span className="truncate font-semibold text-[11px]" title={getDynamicTeamName(match.team1Id, match, 'team1')}>{getDynamicTeamName(match.team1Id, match, 'team1')}</span>
            </div>
            <span className={`font-mono px-1 rounded text-[10px] shrink-0 ml-2 ${
              isT1Winner ? 'bg-blue-50 text-blue-600 font-extrabold' : isLive ? 'bg-rose-100 text-rose-750 font-extrabold' : 'bg-slate-100 text-slate-500'
            }`}>
              {getScoreStr(1)}
            </span>
          </div>

          {/* Team 2 */}
          <div className={`flex justify-between items-center px-2 py-1 bg-white rounded border border-slate-150 hover:bg-slate-50 transition ${
            isT2Winner ? 'text-blue-600 font-extrabold border-l-2 border-l-blue-600 shadow-3xs' : isLive ? 'border-l-2 border-l-rose-500 bg-rose-50/10' : 'text-slate-605'
          }`}>
            <div className="flex items-center gap-1 flex-1 min-w-0 pr-2">
              {isLive && match.servingTeam === 2 && (
                <span className="bg-amber-100 text-amber-850 text-[8px] font-extrabold px-1 py-0.5 rounded animate-pulse shrink-0 select-none"> GIAO</span>
              )}
              <span className="truncate font-semibold text-[11px]" title={getDynamicTeamName(match.team2Id, match, 'team2')}>{getDynamicTeamName(match.team2Id, match, 'team2')}</span>
            </div>
            <span className={`font-mono px-1 rounded text-[10px] shrink-0 ml-2 ${
              isT2Winner ? 'bg-blue-50 text-blue-600 font-extrabold' : isLive ? 'bg-rose-100 text-rose-755 font-extrabold' : 'bg-slate-100 text-slate-500'
            }`}>
              {getScoreStr(2)}
            </span>
          </div>
        </div>

        {match.scoreSets && match.scoreSets.length > 0 && (
          <div className={`text-[10px] font-mono font-bold tracking-wider text-right pt-0.5 select-none ${isLive ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
            {isLive ? 'Đang đấu: ' : ''}({getExactScoresStr()})
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 text-left">
      
      {/* Header with tournament selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 select-none text-rose-500 font-mono text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" /> SỐ LIỆU ĐỒNG BỘ REAL-TIME
          </div>
          <h2 className="text-base md:text-lg font-bold text-slate-805 tracking-tight flex items-center gap-2">
            <Swords className="h-5 w-5 text-blue-600 shrink-0" />
            Sơ Đồ & Nhánh Đấu Toàn Giải
          </h2>
          <p className="text-slate-450 text-[11px] font-medium leading-normal">
            Nhánh đấu tự động cập nhật tỉ số, đội thắng đi tiếp trực quan và tương tác tức thời.
          </p>
        </div>

        {/* Dropdown tournament selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 font-sans hidden sm:inline">Giải đấu:</span>
          <select
            value={selectedTourneyId}
            onChange={(e) => setSelectedTourneyId(e.target.value)}
            className="bg-slate-50 border border-slate-205 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 shadow-3xs hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-100 transition cursor-pointer max-w-[260px]"
          >
            {activeTournaments.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.status === 'PLANNING' ? 'Chuẩn Bị' : t.status === 'FINISHED' ? 'Kết Thúc' : 'Live'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Bracket Showcase Visual */}
      {tourney.status === 'PLANNING' || (groupMatches.length === 0 && koMatches.length === 0) ? (
        <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-10 text-center max-w-lg mx-auto my-3 space-y-3">
          <AlertCircle className="h-9 w-9 text-amber-500 mx-auto animate-bounce" />
          <h4 className="font-extrabold text-slate-705 text-xs uppercase tracking-wider">Chưa Lập Sơ Đồ Nhánh Thi Đấu</h4>
          <p className="text-slate-450 text-[11px] leading-relaxed font-semibold">
            Giải đấu <strong>"{tourney.name}"</strong> hiện đang nằm trong giai đoạn thiết lập kế hoạch danh sách hoặc chưa qua bốc thăm phân bảng. 
            <br />
            Hệ thống sơ đồ nhánh sẽ tự xuất bản khi BTC tiến hành bốc thăm chia sân đấu.
          </p>
        </div>
      ) : (
        <div className="relative overflow-hidden w-full bg-slate-50/30 border border-slate-150 rounded-2xl p-4">
          <div className="overflow-x-auto scrollbar-thin">
            <div className="flex items-stretch min-w-[950px] justify-start py-2 gap-6 select-none text-left">
              
              {/* Column 0: Group Stage / Round Robin Matches - Parallelized by Boards */}
              {groupMatches.length > 0 && (
                <>
                  {(() => {
                    const groupNames = Array.from(new Set(groupMatches.map(m => m.groupName || 'Vòng Bảng'))).sort();
                    return (
                      <div className="flex gap-4 items-stretch">
                        {groupNames.map((gName) => {
                          const filteredGroupMatches = groupMatches.filter(m => (m.groupName || 'Vòng Bảng') === gName);
                          return (
                            <div key={gName} className="flex flex-col justify-start min-h-[380px] text-left w-[300px] border border-slate-200 bg-white shadow-3xs rounded-xl p-3 shrink-0">
                              <div className="text-[10px] font-mono text-slate-500 font-extrabold uppercase tracking-widest text-center border-b border-indigo-150 bg-indigo-50/50 py-1.5 rounded-md mb-3">
                                {gName}
                              </div>
                              <div className="flex-1 space-y-2.5">
                                {filteredGroupMatches.map((m) => (
                                  <div key={m.id} className="bg-slate-50/[0.3] border border-slate-200 p-2.5 rounded-xl space-y-1.5 shadow-3xs transition hover:border-blue-300">
                                    {renderBracketMatchNode(m, false)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                  <ChevronRight className="h-4 w-4 text-slate-300 self-center shrink-0" />
                </>
              )}

              {/* Column 1: Quarterfinals */}
              {level3Quarters.length > 0 && (
                <div className="w-[185px] shrink-0 flex flex-col justify-start self-stretch">
                  <div className="text-[9px] font-mono text-slate-450 font-black uppercase tracking-widest text-center border-b border-slate-100 pb-1 mr-2 mb-4">
                    Vòng Tứ Kết
                  </div>
                  <div className="flex-1 flex flex-col justify-center space-y-4 pr-2">
                    {level3Quarters.map((m) => (
                      <div key={m.id} className="bg-white border border-slate-205 p-2.5 rounded-xl space-y-2 shadow-3xs transition hover:border-blue-300">
                        {renderBracketMatchNode(m, false)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {level3Quarters.length > 0 && <ChevronRight className="h-4 w-4 text-slate-300 self-center shrink-0" />}

              {/* Column 2: Semifinals */}
              {((tourney.format !== 'ROUND_ROBIN' && tourney.format !== 'GROUP_KNOCKOUT') || tourney.hasSemis !== false) ? (
                <>
                  <div className="w-[185px] shrink-0 flex flex-col justify-start self-stretch">
                    <div className="text-[9px] font-mono text-slate-450 font-black uppercase tracking-widest text-center border-b border-slate-100 pb-1 mr-2 mb-4">
                      Vòng Bán Kết
                    </div>
                    <div className="flex-1 flex flex-col justify-center space-y-6 pr-2">
                      {level2Semis.length === 0 ? (
                        <>
                          <div className="bg-white border border-dashed border-slate-200 p-2.5 rounded-xl space-y-2 shadow-xs opacity-75">
                            {renderBracketMatchNode({
                              id: `match-ko-${tourney.id}-semi1`,
                              tournamentId: tourney.id,
                              round: 2,
                              stage: 'KNOCKOUT',
                              team1Id: null,
                              team2Id: null,
                              scoreSets: [],
                              status: 'PENDING',
                              winnerId: null,
                              court: 'Sân Trung Tâm',
                              scheduledTime: undefined
                            }, false)}
                          </div>
                          <div className="bg-white border border-dashed border-slate-200 p-2.5 rounded-xl space-y-2 shadow-xs opacity-75">
                            {renderBracketMatchNode({
                              id: `match-ko-${tourney.id}-semi2`,
                              tournamentId: tourney.id,
                              round: 2,
                              stage: 'KNOCKOUT',
                              team1Id: null,
                              team2Id: null,
                              scoreSets: [],
                              status: 'PENDING',
                              winnerId: null,
                              court: 'Sân Trung Tâm',
                              scheduledTime: undefined
                            }, false)}
                          </div>
                        </>
                      ) : (
                        level2Semis.map((m) => (
                          <div key={m.id} className="bg-white border border-slate-205 p-2.5 rounded-xl space-y-2 shadow-3xs transition hover:border-blue-300">
                            {renderBracketMatchNode(m, false)}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-300 self-center shrink-0" />
                </>
              ) : null}

              {/* Column 3: Finals */}
              <div className="w-[185px] shrink-0 flex flex-col justify-start self-stretch">
                <div className="text-[9px] font-mono text-slate-450 font-black uppercase tracking-widest text-center border-b border-slate-100 pb-1 mb-4">
                  VÒNG CHUNG KẾT
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-6">
                  <div className="space-y-4">
                    {level1Finals.length === 0 ? (
                       <div className="bg-slate-50 border border-dashed border-blue-200 p-3 rounded-xl space-y-2 shadow-xs relative opacity-75">
                         <span className="absolute -top-2.5 right-3 bg-slate-400 text-white text-[8px] font-mono font-extrabold px-2 py-0.5 rounded uppercase shadow-3xs">
                           Tranh Cúp Vàng
                         </span>
                         {renderBracketMatchNode({
                           id: `match-ko-${tourney.id}-final`,
                           tournamentId: tourney.id,
                           round: 1,
                           stage: 'KNOCKOUT',
                           team1Id: null,
                           team2Id: null,
                           isFinal: true,
                           scoreSets: [],
                           status: 'PENDING',
                           winnerId: null,
                           court: 'Sân Trung Tâm',
                           scheduledTime: undefined
                         }, true)}
                       </div>
                     ) : (
                      level1Finals.map((m) => (
                        <div key={m.id} className="bg-gradient-to-b from-blue-50/10 to-blue-50/60 border border-blue-300 p-3 rounded-xl space-y-2 shadow-sm relative">
                          <span className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[8px] font-mono font-extrabold px-2 py-0.5 rounded uppercase shadow-xs">
                            Tranh Cúp Vàng
                          </span>
                          {renderBracketMatchNode(m, true)}
                        </div>
                      ))
                    )}
                  </div>

                  {level1ThirdPlace.length === 0 ? (
                    <div className="space-y-4 pt-4 border-t border-slate-150 border-dashed">
                      <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center border-b border-slate-100 pb-1">
                        TRANH HẠNG BA
                      </div>
                      <div className="bg-white border border-dashed border-slate-200 p-2.5 rounded-xl space-y-2 shadow-xs opacity-75">
                        <span className="text-[8px] bg-slate-400 text-white px-1.5 py-0.5 rounded font-mono font-extrabold uppercase shrink-0 mb-1 inline-block">
                          Hạng 3
                        </span>
                        {renderBracketMatchNode({
                          id: `match-ko-${tourney.id}-third`,
                          tournamentId: tourney.id,
                          stage: 'KNOCKOUT',
                          team1Id: null,
                          team2Id: null,
                          isThirdPlace: true,
                          round: 1.5,
                          scoreSets: [],
                          status: 'PENDING',
                          winnerId: null,
                          court: 'Sân Số 2',
                          scheduledTime: undefined
                        }, false)}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4 border-t border-slate-150 border-dashed">
                      <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center border-b border-slate-100 pb-1">
                        TRANH HẠNG BA
                      </div>
                      {level1ThirdPlace.map((m) => (
                        <div key={m.id} className="bg-white border border-slate-205 p-2.5 rounded-xl space-y-2 shadow-3xs transition hover:border-blue-300">
                          <span className="text-[8px] bg-slate-500 text-white px-1.5 py-0.2 rounded font-mono font-extrabold uppercase shrink-0 mb-1 inline-block font-bold">
                            Hạng 3
                          </span>
                          {renderBracketMatchNode(m, false)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
