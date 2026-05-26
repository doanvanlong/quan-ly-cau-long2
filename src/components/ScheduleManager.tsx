import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Calendar, Edit, X, AlertCircle, Zap, Clock, MapPin, AlertTriangle, Lock } from 'lucide-react';
import { Match, MatchSet } from '../types';

export default function ScheduleManager() {
  const { tournaments, teams, matches, activeTournamentId, updateMatchScore, updateMatchDetail } = useTournament();

  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  const [editingCourtMatchId, setEditingCourtMatchId] = useState<string | null>(null);
  const [editingCourtValue, setEditingCourtValue] = useState<string>('');
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [editingTimeValue, setEditingTimeValue] = useState<string>('');

  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleOpenCourtEdit = (matchId: string, currentCourt: string) => {
    setEditingCourtMatchId(matchId);
    setEditingCourtValue(currentCourt || 'Sắp xếp');

    const selectedM = matches.find(m => m.id === matchId);
    if (selectedM && selectedM.scheduledTime) {
      const d = new Date(selectedM.scheduledTime);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setEditingDateValue(`${yyyy}-${mm}-${dd}`);
        setEditingTimeValue(`${hh}:${min}`);
        return;
      }
    }

    // Fallback: use tournament defaults
    const tourney = selectedM ? tournaments.find(t => t.id === selectedM.tournamentId) : null;
    if (tourney && tourney.startDate) {
      setEditingDateValue(tourney.startDate);
      setEditingTimeValue(tourney.playingHoursStart || '08:00');
    } else {
      setEditingDateValue(getTodayString());
      setEditingTimeValue('08:00');
    }
  };

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  
  // Set Score inputs state inside modal
  const [s1Team1, setS1Team1] = useState(0);
  const [s1Team2, setS1Team2] = useState(0);
  const [s2Team1, setS2Team1] = useState(0);
  const [s2Team2, setS2Team2] = useState(0);
  const [s3Team1, setS3Team1] = useState(0);
  const [s3Team2, setS3Team2] = useState(0);
  
  const [matchStatus, setMatchStatus] = useState<Match['status']>('PENDING');
  const [servingTeam, setServingTeam] = useState<1 | 2 | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [stageFilter, setStageFilter] = useState<'ALL' | 'GROUP' | 'KNOCKOUT'>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');

  const [selectedTourneyId, setSelectedTourneyId] = useState<string>('');

  const activeTournaments = tournaments.filter(t => t.status !== 'DEACTIVE');

  // Sync with activeTournamentId initially or on change
  React.useEffect(() => {
    if (activeTournamentId) {
      const aTourney = tournaments.find(t => t.id === activeTournamentId);
      if (aTourney && aTourney.status !== 'DEACTIVE') {
        setSelectedTourneyId(activeTournamentId);
        return;
      }
    }
    if (activeTournaments.length > 0) {
      setSelectedTourneyId(activeTournaments[0].id);
    } else {
      setSelectedTourneyId('');
    }
  }, [activeTournamentId, tournaments]);

  const selectedTourney = activeTournaments.find(t => t.id === selectedTourneyId) || activeTournaments[0];

  // Active tournament matches
  const tMatches = selectedTourney 
    ? matches.filter(m => m.tournamentId === selectedTourney.id) 
    : [];

  // Filter matches matching choices
  const filteredMatches = tMatches.filter(m => {
    if (stageFilter !== 'ALL' && m.stage !== stageFilter) return false;
    if (groupFilter !== 'ALL' && m.groupName !== groupFilter) return false;
    return true;
  });

  const getTeamName = (id: string | null) => {
    if (!id) return 'Chờ xác định';
    const found = teams.find(t => t.id === id || (id.startsWith('team-draw-') && t.id.startsWith(id + '-')));
    return found ? found.name : 'Chưa xác định';
  };

  const getTeamLogoColor = (logo: string) => {
    switch (logo) {
      case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'blue': return 'bg-blue-55 text-blue-600 border-blue-200';
      case 'amber': return 'bg-amber-50 text-amber-850 border-amber-200';
      case 'rose': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'indigo': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
      case 'purple': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'cyan': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'orange': return 'bg-orange-50 text-orange-600 border-orange-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const openScoreModal = (match: Match) => {
    // Prevent entering scores if teams are not yet determined in bracket
    if (!match.team1Id || !match.team2Id) {
      window.alert('Chưa thể ghi kết quả khi chưa xác định đủ cả 2 đội tuyển ở nhánh đấu!');
      return;
    }

    if (match.scheduledTime) {
      const matchStartTime = new Date(match.scheduledTime);
      if (matchStartTime > currentTime) {
        window.alert(`⚠️ Không thể ghi điểm: Trận đấu chưa bắt đầu!\n\nLịch thi đấu của trận này là:\n📅 Ngày: ${matchStartTime.toLocaleDateString('vi-VN')}\n⏰ Giờ: ${matchStartTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}\n\nTrọng tài chỉ có thể ghi điểm khi trận đấu đã đến giờ hoặc vượt quá giờ bắt đầu.`);
        return;
      }
    }

    setSelectedMatch(match);
    setMatchStatus(match.status);
    setServingTeam(match.servingTeam || null);
    setErrorMessage(null);

    // Initialize set scores if already populated
    if (match.scoreSets.length > 0) {
      setS1Team1(match.scoreSets[0]?.team1Score || 0);
      setS1Team2(match.scoreSets[0]?.team2Score || 0);
      setS2Team1(match.scoreSets[1]?.team1Score || 0);
      setS2Team2(match.scoreSets[1]?.team2Score || 0);
      setS3Team1(match.scoreSets[2]?.team1Score || 0);
      setS3Team2(match.scoreSets[2]?.team2Score || 0);
    } else {
      setS1Team1(0); setS1Team2(0);
      setS2Team1(0); setS2Team2(0);
      setS3Team1(0); setS3Team2(0);
    }
  };

  // Helper to determine target point limit for a specific set in the loaded match configurations
  const getTargetLimit = (setIdx: number): number => {
    if (!selectedTourney) return 21;
    let limit = selectedTourney.pointsPerSet || 21;
    const isSpecialFinalsMatch = selectedMatch && (selectedMatch.isFinal || selectedMatch.isThirdPlace);

    if (isSpecialFinalsMatch && selectedTourney.specialFinalsRuleEnabled) {
      if (setIdx === 3) {
        return selectedTourney.specialFinalsDecidingPoints || 15;
      } else {
        return selectedTourney.specialFinalsPoints || 21;
      }
    } else {
      if (setIdx === 3) {
        return selectedTourney.decidingSetPoints || 15;
      } else {
        return selectedTourney.pointsPerSet || 21;
      }
    }
  };

  const isSetCompleted = (setScore: { team1Score: number; team2Score: number }, setIdx: number, tourney: any, isFinalOr3rd: boolean | undefined): boolean => {
    const t1 = setScore.team1Score;
    const t2 = setScore.team2Score;
    if (t1 === 0 && t2 === 0) return false;
    
    // Get limit for this specific set
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
    
    // Normal win
    if (t1 === limit && t2 <= limit - 2) return true;
    if (t2 === limit && t1 <= limit - 2) return true;
    
    // Deuce scenario
    if (t1 > limit || t2 > limit) {
      const maxLimit = limit <= 15 ? 21 : 30;
      const diff = Math.abs(t1 - t2);
      if (t1 === maxLimit && t2 === maxLimit - 1) return true;
      if (t2 === maxLimit && t1 === maxLimit - 1) return true;
      if (diff === 2) return true;
    }
    return false;
  };

  const getCompletedSetsWonAndLost = (scores: { team1Score: number; team2Score: number }[], tourney: any, isFinalOr3rd: boolean | undefined) => {
    let t1Sets = 0;
    let t2Sets = 0;
    scores.forEach((s, idx) => {
      if (isSetCompleted(s, idx + 1, tourney, isFinalOr3rd)) {
        if (s.team1Score > s.team2Score) t1Sets++;
        else if (s.team2Score > s.team1Score) t2Sets++;
      }
    });
    return { t1Sets, t2Sets };
  };

  // Validation of badminton scores
  const validateSetScore = (t1: number, t2: number, setIdx: number): { valid: boolean; winner: 1 | 2 | null; msg?: string } => {
    if (t1 === 0 && t2 === 0) return { valid: true, winner: null };
    
    const limit = getTargetLimit(setIdx);
    const maxLimit = limit <= 15 ? 21 : 30;
    
    if (t1 > maxLimit || t2 > maxLimit) {
      return { valid: false, winner: null, msg: `Điểm số một set tối đa chỉ giới hạn ${maxLimit} điểm!` };
    }

    const setObj = { team1Score: t1, team2Score: t2 };
    const completed = isSetCompleted(setObj, setIdx, selectedTourney, selectedMatch?.isFinal || selectedMatch?.isThirdPlace);
    
    if (completed) {
      return { valid: true, winner: t1 > t2 ? 1 : 2 };
    }

    // If not completed, but one team has exceeded the logic boundaries (e.g. difference is greater than 2 points after limit)
    const diff = Math.abs(t1 - t2);
    if ((t1 > limit || t2 > limit) && diff > 2) {
      return { valid: false, winner: null, msg: 'Cách biệt điểm số trong kịch bản Deuce tối đa là 2!' };
    }

    // In progress, valid score
    return { valid: true, winner: null };
  };

  const saveScoreboard = () => {
    if (!selectedMatch) return;

    // Check validation of sets
    const vSet1 = validateSetScore(s1Team1, s1Team2, 1);
    const vSet2 = validateSetScore(s2Team1, s2Team2, 2);
    const vSet3 = validateSetScore(s3Team1, s3Team2, 3);

    if (!vSet1.valid) { setErrorMessage(`Lỗi Hiệp 1: ${vSet1.msg}`); return; }
    if (!vSet2.valid) { setErrorMessage(`Lỗi Hiệp 2: ${vSet2.msg}`); return; }
    if (!vSet3.valid) { setErrorMessage(`Lỗi Hiệp 3: ${vSet3.msg}`); return; }

    // If status is completed: verify who actually won 2 sets
    const setsInput: MatchSet[] = [];
    let t1Wins = 0;
    let t2Wins = 0;

    if (s1Team1 > 0 || s1Team2 > 0) {
      setsInput.push({ team1Score: s1Team1, team2Score: s1Team2 });
      if (vSet1.winner === 1) t1Wins++;
      if (vSet1.winner === 2) t2Wins++;
    }

    if (s2Team1 > 0 || s2Team2 > 0) {
      setsInput.push({ team1Score: s2Team1, team2Score: s2Team2 });
      if (vSet2.winner === 1) t1Wins++;
      if (vSet2.winner === 2) t2Wins++;
    }

    if (s3Team1 > 0 || s3Team2 > 0) {
      setsInput.push({ team1Score: s3Team1, team2Score: s3Team2 });
      if (vSet3.winner === 1) t1Wins++;
      if (vSet3.winner === 2) t2Wins++;
    }

    let winnerId: string | null = null;
    if (matchStatus === 'COMPLETED') {
      if (t1Wins === 0 && t2Wins === 0) {
        setErrorMessage('Tỷ số set chưa thực tế hoàn thành để ghi nhận Đã Kết Thúc!');
        return;
      }
      if (t1Wins === t2Wins) {
        setErrorMessage('Tỷ số set đấu đang hòa nhau (1-1 hoặc chưa phân định). Cần set 3 phân định thắng thua!');
        return;
      }
      winnerId = t1Wins > t2Wins ? selectedMatch.team1Id : selectedMatch.team2Id;
    }

    // Trigger update
    updateMatchScore(selectedMatch.id, setsInput, matchStatus, winnerId, servingTeam);
    setSelectedMatch(null);
  };

  const limitSet1 = getTargetLimit(1);
  const limitSet2 = getTargetLimit(2);
  const limitSet3 = getTargetLimit(3);

  const getMaxScoreForTeam = (current: number, opponent: number, limit: number): number => {
    const maxLimit = limit <= 15 ? 21 : 30;
    
    // Check if opponent already won standard setup or reaches max limit
    const opponentHasWonNormal = opponent >= limit && opponent - current >= 2;
    const opponentHasWonMax = opponent === maxLimit;
    if (opponentHasWonNormal || opponentHasWonMax) {
      return current;
    }
    
    // Check if current has won
    const currentHasWonNormal = current >= limit && current - opponent >= 2;
    const currentHasWonMax = current === maxLimit;
    if (currentHasWonNormal || currentHasWonMax) {
      return current;
    }

    if (opponent < limit - 1) {
      return limit;
    }

    return Math.min(opponent + 2, maxLimit);
  };

  // Determine which sets inputs are activated dynamically based on best of 3 rules
  const isS1Finished = isSetCompleted({ team1Score: s1Team1, team2Score: s1Team2 }, 1, selectedTourney, selectedMatch?.isFinal || selectedMatch?.isThirdPlace);
  const isS2Finished = isSetCompleted({ team1Score: s2Team1, team2Score: s2Team2 }, 2, selectedTourney, selectedMatch?.isFinal || selectedMatch?.isThirdPlace);

  const s1Winner = s1Team1 > s1Team2 ? 1 : s1Team2 > s1Team1 ? 2 : null;
  const s2Winner = s2Team1 > s2Team2 ? 1 : s2Team2 > s2Team1 ? 2 : null;

  const s2Active = isS1Finished;
  const s3Active = isS1Finished && isS2Finished && s1Winner !== null && s2Winner !== null && s1Winner !== s2Winner;

  const activeSetIdx = !isS1Finished ? 1 : (!isS2Finished ? 2 : (s3Active ? 3 : 2));

  return (
    <div id="schedule-manager" className="space-y-6 py-2 text-left">
      
      {/* Platform Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-205 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="h-6.5 w-6.5 text-blue-600" />
            Lịch Thi Đấu & Kết Quả
          </h1>
          <p className="text-slate-505 text-xs md:text-sm">
            Bảng thống kê toàn diện lịch thi đấu vòng bảng và vòng knock-out. Admin có thể can thiệp nhập kết quả điểm tỷ số của từng set tại đây.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label className="text-slate-500 text-xs shrink-0 font-bold select-none">Giải đấu:</label>
            <select
              value={selectedTourneyId}
              onChange={(e) => setSelectedTourneyId(e.target.value)}
              className="bg-slate-55 border border-slate-200 text-slate-700 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer font-bold transition"
            >
              {activeTournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-0.5 select-none">
            <button
              onClick={() => setStageFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${stageFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => { setStageFilter('GROUP'); setGroupFilter('ALL'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${stageFilter === 'GROUP' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
            >
              Vòng Bảng
            </button>
            <button
              onClick={() => { setStageFilter('KNOCKOUT'); setGroupFilter('ALL'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${stageFilter === 'KNOCKOUT' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
            >
              Knockout
            </button>
          </div>

          {stageFilter === 'GROUP' && (
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-slate-55 border border-slate-200 text-slate-650 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition font-semibold"
            >
              <option value="ALL">Tất cả bảng đấu</option>
              <option value="Bảng A">Bảng A</option>
              <option value="Bảng B">Bảng B</option>
              <option value="Vòng Tròn">Vòng Tròn</option>
            </select>
          )}
        </div>
      </div>

      {!selectedTourney ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-xs font-semibold">Chưa chọn giải đấu hoạt động hoặc chưa phân nhánh phân bảng.</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Tournament Schedule Stats Bar */}
          {selectedTourney.startDate && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-slate-600 select-none leading-relaxed">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Thời gian diễn ra</span>
                <p className="text-xs font-bold text-slate-800">{selectedTourney.startDate} &rarr; {selectedTourney.endDate || 'Đang cập nhật'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Các ngày thi đấu</span>
                <p className="text-xs font-bold text-slate-800">
                  {selectedTourney.playingDays && selectedTourney.playingDays.length > 0 ? (
                    selectedTourney.playingDays.map(d => {
                      const translations: Record<string, string> = {
                        'Monday': 'Thứ Hai', 'Tuesday': 'Thứ Ba', 'Wednesday': 'Thứ Tư', 'Thursday': 'Thứ Năm', 'Friday': 'Thứ Sáu', 'Saturday': 'Thứ Bảy', 'Sunday': 'Chủ Nhật'
                      };
                      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
                        const parsedDate = new Date(d);
                        if (!isNaN(parsedDate.getTime())) {
                          const daysVn = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                          const vnDay = daysVn[parsedDate.getDay()];
                          const dayStr = String(parsedDate.getDate()).padStart(2, '0');
                          const monthStr = String(parsedDate.getMonth() + 1).padStart(2, '0');
                          return `${dayStr}/${monthStr} (${vnDay})`;
                        }
                      }
                      return translations[d] || d;
                    }).join(', ')
                  ) : (
                    'Tất cả các ngày'
                  )}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Khung giờ đánh hằng ngày</span>
                <p className="text-xs font-bold text-slate-800">{selectedTourney.playingHoursStart || '08:00'} - {selectedTourney.playingHoursEnd || '18:00'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Thời lượng trận dự tính</span>
                <p className="text-xs font-bold text-slate-800">{selectedTourney.matchDuration || 60} phút / trận</p>
              </div>
            </div>
          )}

          <div className="text-xs text-blue-750 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            Trọng tài ấn vào nút <strong className="text-blue-800 font-bold">"Cập nhật tỷ số"</strong> trên từng thẻ trận đấu để lưu điểm số và phân chia vé vào vòng trực tiếp.
          </div>

          {filteredMatches.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-2 select-none">
              <Calendar className="h-9 w-9 text-slate-400 mx-auto" />
              <p className="text-slate-600 text-sm font-bold">Chưa tìm thấy dữ liệu lượt thi đấu nào.</p>
              <p className="text-slate-450 text-xs">Hãy bốc thăm ghép đội tại tab <strong className="text-blue-600">"Sơ Đồ Thi Đấu"</strong> để tự động tạo trận!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMatches.map((m) => {
                const finished = m.status === 'COMPLETED';
                const live = m.status === 'LIVE';
                const mStartTime = m.scheduledTime ? new Date(m.scheduledTime) : null;
                const isFuture = mStartTime ? mStartTime > currentTime : false;

                return (
                  <div
                    key={m.id}
                    className={`bg-white border rounded-xl overflow-hidden shadow-xs transition flex flex-col justify-between ${
                      live ? 'border-blue-400 shadow-sm shadow-blue-500/5' : finished ? 'border-slate-150' : 'border-slate-200 hover:border-slate-350'
                    }`}
                  >
                    {/* Head info bar */}
                    <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs select-none">
                      <div className="flex items-center gap-2">
                        <span className="bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded text-[9px] font-mono font-extrabold tracking-wider uppercase">
                          {m.groupName || 'Vòng Nhánh'}
                        </span>
                        {m.round && (
                          <span className="text-[9px] text-slate-400 font-bold font-mono uppercase">Vòng {m.round}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${finished ? 'bg-slate-400' : live ? 'bg-blue-600 animate-pulse' : isFuture ? 'bg-amber-400' : 'bg-green-500 animate-pulse'}`}></span>
                        <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${finished ? 'text-slate-400' : live ? 'text-blue-600' : isFuture ? 'text-amber-600' : 'text-green-600'}`}>
                          {finished ? 'Kết thúc' : live ? 'Trực Tiếp' : isFuture ? 'Chưa bắt đầu' : 'Sẵn sàng đấu'}
                        </span>
                      </div>
                    </div>

                    {/* Team display segment */}
                    <div className="p-4 flex items-center justify-between gap-4">
                      {/* Team 1 */}
                      <div className="flex items-center gap-2.5 w-5/12 text-right justify-end">
                        {m.status === 'LIVE' && m.servingTeam === 1 && (
                          <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md animate-pulse shrink-0">
                            🏸 Giao
                          </span>
                        )}
                        <span className="text-slate-800 text-xs md:text-sm font-bold truncate text-right">
                          {getTeamName(m.team1Id)}
                        </span>
                        {(() => {
                          const t = teams.find(team => team.id === m.team1Id);
                          if (t?.avatar) {
                            return (
                              <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-255 shrink-0 select-none shadow-sm">
                                <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            );
                          }
                          return (
                            <div className={`h-8 w-8 rounded-full border ${getTeamLogoColor(t?.logo || 'indigo')} flex items-center justify-center font-extrabold text-[11px] shrink-0 select-none`}>
                              {getTeamName(m.team1Id).charAt(0)}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Display Score center */}
                      <div className="flex flex-col items-center justify-center text-center w-2/12 select-none">
                        {m.scoreSets.length > 0 ? (
                          <div className="text-base md:text-lg font-mono font-extrabold text-blue-600 tracking-tight leading-none bg-blue-50/60 px-3 py-1.5 rounded-xl border border-blue-100 shadow-inner">
                            {/* Render aggregate sets finished won count */}
                            {(() => {
                              const stats = getCompletedSetsWonAndLost(m.scoreSets, selectedTourney, m.isFinal || m.isThirdPlace);
                              return stats.t1Sets;
                            })()}
                            <span className="text-slate-400 text-xs mx-1">:</span>
                            {(() => {
                              const stats = getCompletedSetsWonAndLost(m.scoreSets, selectedTourney, m.isFinal || m.isThirdPlace);
                              return stats.t2Sets;
                            })()}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-mono text-xs uppercase font-extrabold select-none">vs</span>
                        )}
                        <span className="text-[9px] text-slate-550 font-mono font-extrabold tracking-wider uppercase mt-1">
                          {m.court || 'Chưa xếp sân'}
                        </span>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center gap-2.5 w-5/12 justify-start">
                        {(() => {
                          const t = teams.find(team => team.id === m.team2Id);
                          if (t?.avatar) {
                            return (
                              <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-255 shrink-0 select-none shadow-sm">
                                <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            );
                          }
                          return (
                            <div className={`h-8 w-8 rounded-full border ${getTeamLogoColor(t?.logo || 'rose')} flex items-center justify-center font-extrabold text-[11px] shrink-0 select-none`}>
                              {getTeamName(m.team2Id).charAt(0)}
                            </div>
                          );
                        })()}
                        <span className="text-slate-800 text-xs md:text-sm font-bold truncate text-left">
                          {getTeamName(m.team2Id)}
                        </span>
                        {m.status === 'LIVE' && m.servingTeam === 2 && (
                          <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md animate-pulse shrink-0">
                            Giao 🏸
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Sets detail score print */}
                    {m.scoreSets.length > 0 && (
                      <div className="px-4 pb-3">
                        <div className="bg-slate-50 rounded-xl p-2 flex justify-center gap-4 text-[10px] font-mono border border-slate-100 select-none">
                          {m.scoreSets.map((set: any, idx: number) => (
                            <div key={idx} className="flex gap-1.5">
                              <span className="text-slate-400 font-semibold font-sans">S{idx+1}:</span>
                              <span className={`font-bold ${set.team1Score > set.team2Score ? 'text-blue-630 font-extrabold' : 'text-slate-500'}`}>{set.team1Score}</span>
                              <span className="text-slate-305">-</span>
                              <span className={`font-bold ${set.team2Score > set.team1Score ? 'text-blue-630 font-extrabold' : 'text-slate-500'}`}>{set.team2Score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}


                    {/* Action update score trigger */}
                    <div className="bg-slate-50/55 p-2.5 border-t border-slate-100 flex justify-between items-center select-none">
                      {(() => {
                        if (!m.scheduledTime) {
                          return (
                            <div className="flex flex-col text-[10px] font-semibold text-slate-500 leading-tight">
                              <span className="text-slate-400 font-mono text-[10px] font-semibold">Chưa lên lịch</span>
                              <button
                                type="button"
                                onClick={() => handleOpenCourtEdit(m.id, m.court || '')}
                                className="text-[9px] text-indigo-600 hover:text-indigo-850 underline font-extrabold transition text-left mt-0.5 cursor-pointer"
                              >
                                ⚙️ Sắp lịch & Sân
                              </button>
                            </div>
                          );
                        }
                        const startDate = new Date(m.scheduledTime);
                        const durationMin = selectedTourney?.matchDuration || 60;
                        const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
                        
                        const startStr = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        const endStr = endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                        const dateStr = startDate.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
                        
                        return (
                          <div className="flex flex-col text-[10px] font-semibold text-slate-500 leading-tight">
                            <span className="font-mono text-[9px] font-extrabold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                              📅 {dateStr}
                              <button
                                type="button"
                                onClick={() => handleOpenCourtEdit(m.id, m.court || '')}
                                className="text-[8px] text-indigo-650 hover:text-indigo-850 underline font-extrabold uppercase transition ml-1"
                              >
                                Đổi lịch/Sân
                              </button>
                            </span>
                            <span className="text-slate-700 font-extrabold font-mono flex items-center gap-0.5 mt-0.5">
                              ⏰ {startStr} - {endStr} ({durationMin}')
                            </span>
                          </div>
                        );
                      })()}
                      
                      {(() => {
                        const mStartTime = m.scheduledTime ? new Date(m.scheduledTime) : null;
                        const isFuture = mStartTime ? mStartTime > currentTime : false;
                        
                        if (isFuture) {
                          return (
                            <button
                              type="button"
                              disabled={true}
                              className="bg-slate-100 border border-slate-200 text-slate-400 px-3 py-1.5 rounded-lg text-[11.5px] font-bold flex items-center gap-1 cursor-not-allowed opacity-60 shadow-3xs"
                              title="Hệ thống tự động khóa: Trận đấu chưa đến giờ diễn ra. Không thể ghi điểm!"
                            >
                              <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                              Khóa (Chưa đấu)
                            </button>
                          );
                        }
                        
                        return (
                          <button
                            type="button"
                            onClick={() => openScoreModal(m)}
                            className="bg-white hover:bg-slate-50 hover:text-blue-600 border border-slate-200 text-slate-705 px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5 text-blue-500" />
                            Ghi điểm
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* SCOREBOARD UPDATE MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-5 md:p-7 space-y-5 relative animate-in zoom-in-95 duration-200 shadow-xl">
            
            <button
              onClick={() => setSelectedMatch(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-100 p-1.5 rounded-full cursor-pointer transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <span className="text-blue-600 text-[10px] font-mono tracking-widest uppercase font-bold">Quyền Trọng Tài</span>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Cập Nhật Biên Bản Trận Đấu</h2>
              <p className="text-slate-455 text-xs">
                Ghi nhận số điểm thực thi chính thức của từng hiệp theo nguyên tắc dẫn điểm chạm set.
              </p>
            </div>

            {/* Match Teams description with serving indicators */}
            <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border border-slate-200 select-none">
              <button 
                type="button"
                onClick={() => setServingTeam(1)}
                className={`min-w-0 p-2 rounded-lg text-left flex flex-col gap-0.5 border transition cursor-pointer ${servingTeam === 1 ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-1.5 w-full min-w-0">
                  <span className="font-extrabold text-blue-600 text-xs md:text-sm truncate block flex-1">{getTeamName(selectedMatch.team1Id)}</span>
                  {servingTeam === 1 && <span className="bg-amber-400 text-[10px] text-amber-950 font-extrabold px-1.5 py-0.5 rounded-md flex items-center animate-pulse whitespace-nowrap shrink-0">🏸 Giao</span>}
                </div>
                <span className="text-[10px] text-slate-400">Click chọn giao</span>
              </button>
              
              <div className="text-slate-350 text-xs shrink-0 font-mono font-extrabold px-2">VS</div>
              
              <button 
                type="button"
                onClick={() => setServingTeam(2)}
                className={`min-w-0 p-2 rounded-lg text-right flex flex-col items-end gap-0.5 border transition cursor-pointer ${servingTeam === 2 ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-100'}`}
              >
                <div className="flex items-center gap-1.5 justify-end w-full min-w-0">
                  {servingTeam === 2 && <span className="bg-amber-400 text-[10px] text-amber-950 font-extrabold px-1.5 py-0.5 rounded-md flex items-center animate-pulse whitespace-nowrap shrink-0">Giao 🏸</span>}
                  <span className="font-extrabold text-slate-800 text-xs md:text-sm truncate block flex-1">{getTeamName(selectedMatch.team2Id)}</span>
                </div>
                <span className="text-[10px] text-slate-400">Click chọn giao</span>
              </button>
            </div>

            {/* Match Status option triggers */}
            <div className="space-y-2 select-none">
              <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider font-mono">Trạng Thái Trận Đấu</label>
              <div className="grid grid-cols-3 gap-2">
                {['PENDING', 'LIVE', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setMatchStatus(st as Match['status'])}
                    className={`px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border transition ${
                      matchStatus === st 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {st === 'PENDING' ? 'Chưa đấu' : st === 'LIVE' ? 'Đang chơi LIVE' : 'Đã kết thúc'}
                  </button>
                ))}
              </div>
            </div>

            {/* Set Score Inputs */}
            {matchStatus !== 'PENDING' && (
              <div className="space-y-4 pt-4 border-t border-slate-100 select-none">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest font-extrabold block">
                  Chi tiết tỷ số set đấu:
                </span>

                <div className="space-y-2.5">
                  {/* Set 1 */}
                  <div className={`flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border transition ${activeSetIdx === 1 ? 'border-blue-100 bg-blue-50/10' : 'border-slate-100'}`}>
                    <div className="w-[20%] flex flex-col shrink-0">
                      <span className="text-xs font-bold text-slate-800">Set 1</span>
                      <span className="text-[9px] text-slate-400 font-mono">Chạm {limitSet1}đ</span>
                    </div>
                    
                    <div className={`flex items-center gap-1 w-[38%] justify-end p-1 rounded-lg border transition ${activeSetIdx === 1 && servingTeam === 1 ? 'bg-amber-50 border-amber-300 shadow-xs font-medium' : 'border-transparent'}`}>
                      {activeSetIdx === 1 && servingTeam === 1 && (
                        <span className="bg-amber-400 text-[8px] text-amber-950 font-extrabold px-1 py-0.5 rounded flex items-center animate-pulse whitespace-nowrap shrink-0 select-none">
                          Giao 🏸
                        </span>
                      )}
                      <button 
                        type="button"
                        onClick={() => setS1Team1(prev => Math.max(0, prev - 1))}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition cursor-pointer select-none shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={limitSet1 <= 15 ? 21 : 30}
                        value={s1Team1}
                        onChange={(e) => {
                          const rawVal = Math.max(0, parseInt(e.target.value) || 0);
                          const maxAllowed = getMaxScoreForTeam(s1Team1, s1Team2, limitSet1);
                          const val = Math.min(rawVal, maxAllowed);
                          if (val > s1Team1) setServingTeam(1);
                          setS1Team1(val);
                        }}
                        className={`w-10 text-center font-mono font-bold rounded-lg p-1 text-xs border focus:border-blue-500 focus:outline-none transition shrink-0 ${activeSetIdx === 1 && servingTeam === 1 ? 'bg-amber-100 border-amber-300 text-amber-950' : 'bg-white border-slate-250 text-slate-805'}`}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const maxAllowed = getMaxScoreForTeam(s1Team1, s1Team2, limitSet1);
                          setS1Team1(prev => Math.min(prev + 1, maxAllowed));
                          setServingTeam(1);
                        }}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition cursor-pointer select-none shadow-xs shrink-0"
                      >
                        +
                      </button>
                    </div>
                    
                    <span className="text-slate-400 text-xs shrink-0 font-mono font-bold">:</span>
                    
                    <div className={`flex items-center gap-1 w-[38%] justify-start p-1 rounded-lg border transition ${activeSetIdx === 1 && servingTeam === 2 ? 'bg-amber-50 border-amber-300 shadow-xs font-medium' : 'border-transparent'}`}>
                      <button 
                        type="button"
                        onClick={() => setS1Team2(prev => Math.max(0, prev - 1))}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition cursor-pointer select-none shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={limitSet1 <= 15 ? 21 : 30}
                        value={s1Team2}
                        onChange={(e) => {
                          const rawVal = Math.max(0, parseInt(e.target.value) || 0);
                          const maxAllowed = getMaxScoreForTeam(s1Team2, s1Team1, limitSet1);
                          const val = Math.min(rawVal, maxAllowed);
                          if (val > s1Team2) setServingTeam(2);
                          setS1Team2(val);
                        }}
                        className={`w-10 text-center font-mono font-bold rounded-lg p-1 text-xs border focus:border-blue-500 focus:outline-none transition shrink-0 ${activeSetIdx === 1 && servingTeam === 2 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-white border-slate-250 text-slate-805'}`}
                      />
                      <button 
                        type="button"
                        onClick={() => {
                          const maxAllowed = getMaxScoreForTeam(s1Team2, s1Team1, limitSet1);
                          setS1Team2(prev => Math.min(prev + 1, maxAllowed));
                          setServingTeam(2);
                        }}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition cursor-pointer select-none shadow-xs shrink-0"
                      >
                        +
                      </button>
                      {activeSetIdx === 1 && servingTeam === 2 && (
                        <span className="bg-amber-400 text-[8px] text-amber-950 font-extrabold px-1 py-0.5 rounded flex items-center animate-pulse whitespace-nowrap shrink-0 select-none">
                          Giao 🏸
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Set 2 */}
                  <div className={`flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border transition ${s2Active ? 'opacity-100' : 'opacity-40 pointer-events-none'} ${activeSetIdx === 2 ? 'border-blue-100 bg-blue-50/10' : 'border-slate-100'}`}>
                    <div className="w-[20%] flex flex-col shrink-0">
                      <span className="text-xs font-bold text-slate-800">Set 2</span>
                      <span className="text-[9px] text-slate-400 font-mono">Chạm {limitSet2}đ</span>
                    </div>
                    
                    <div className={`flex items-center gap-1 w-[38%] justify-end p-1 rounded-lg border transition ${activeSetIdx === 2 && servingTeam === 1 ? 'bg-amber-50 border-amber-300 shadow-xs font-medium' : 'border-transparent'}`}>
                      {activeSetIdx === 2 && servingTeam === 1 && (
                        <span className="bg-amber-400 text-[8px] text-amber-950 font-extrabold px-1 py-0.5 rounded flex items-center animate-pulse whitespace-nowrap shrink-0 select-none">
                          Giao 🏸
                        </span>
                      )}
                      <button 
                        type="button"
                        disabled={!s2Active}
                        onClick={() => setS2Team1(prev => Math.max(0, prev - 1))}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition cursor-pointer select-none disabled:opacity-50 shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={limitSet2 <= 15 ? 21 : 30}
                        value={s2Team1}
                        onChange={(e) => {
                          const rawVal = Math.max(0, parseInt(e.target.value) || 0);
                          const maxAllowed = getMaxScoreForTeam(s2Team1, s2Team2, limitSet2);
                          const val = Math.min(rawVal, maxAllowed);
                          if (val > s2Team1) setServingTeam(1);
                          setS2Team1(val);
                        }}
                        className={`w-10 text-center font-mono font-bold rounded-lg p-1 text-xs border focus:border-blue-500 focus:outline-none transition shrink-0 ${activeSetIdx === 2 && servingTeam === 1 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-white border-slate-250 text-slate-805'}`}
                        disabled={!s2Active}
                      />
                      <button 
                        type="button"
                        disabled={!s2Active}
                        onClick={() => {
                          const maxAllowed = getMaxScoreForTeam(s2Team1, s2Team2, limitSet2);
                          setS2Team1(prev => Math.min(prev + 1, maxAllowed));
                          setServingTeam(1);
                        }}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition cursor-pointer select-none shadow-xs disabled:opacity-50 shrink-0"
                      >
                        +
                      </button>
                    </div>
                    
                    <span className="text-slate-400 text-xs shrink-0 font-mono font-bold">:</span>
                    
                    <div className={`flex items-center gap-1 w-[38%] justify-start p-1 rounded-lg border transition ${activeSetIdx === 2 && servingTeam === 2 ? 'bg-amber-50 border-amber-300 shadow-xs font-medium' : 'border-transparent'}`}>
                      <button 
                        type="button"
                        disabled={!s2Active}
                        onClick={() => setS2Team2(prev => Math.max(0, prev - 1))}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition cursor-pointer select-none disabled:opacity-50 shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={limitSet2 <= 15 ? 21 : 30}
                        value={s2Team2}
                        onChange={(e) => {
                          const rawVal = Math.max(0, parseInt(e.target.value) || 0);
                          const maxAllowed = getMaxScoreForTeam(s2Team2, s2Team1, limitSet2);
                          const val = Math.min(rawVal, maxAllowed);
                          if (val > s2Team2) setServingTeam(2);
                          setS2Team2(val);
                        }}
                        className={`w-10 text-center font-mono font-bold rounded-lg p-1 text-xs border focus:border-blue-500 focus:outline-none transition shrink-0 ${activeSetIdx === 2 && servingTeam === 2 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-white border-slate-250 text-slate-805'}`}
                        disabled={!s2Active}
                      />
                      <button 
                        type="button"
                        disabled={!s2Active}
                        onClick={() => {
                          const maxAllowed = getMaxScoreForTeam(s2Team2, s2Team1, limitSet2);
                          setS2Team2(prev => Math.min(prev + 1, maxAllowed));
                          setServingTeam(2);
                        }}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition cursor-pointer select-none shadow-xs disabled:opacity-50 shrink-0"
                      >
                        +
                      </button>
                      {activeSetIdx === 2 && servingTeam === 2 && (
                        <span className="bg-amber-400 text-[8px] text-amber-950 font-extrabold px-1 py-0.5 rounded flex items-center animate-pulse whitespace-nowrap shrink-0 select-none">
                          Giao 🏸
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Set 3 */}
                  <div className={`flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border transition ${s3Active ? 'opacity-100' : 'opacity-40 pointer-events-none'} ${activeSetIdx === 3 ? 'border-blue-100 bg-blue-50/10' : 'border-slate-100'}`}>
                    <div className="w-[20%] flex flex-col shrink-0">
                      <span className="text-xs font-bold text-slate-800">Set 3 (Quyết định)</span>
                      <span className="text-[9px] text-blue-600 font-mono font-bold">Chạm {limitSet3}đ</span>
                    </div>
                    
                    <div className={`flex items-center gap-1 w-[38%] justify-end p-1 rounded-lg border transition ${activeSetIdx === 3 && servingTeam === 1 ? 'bg-amber-50 border-amber-300 shadow-xs font-medium' : 'border-transparent'}`}>
                      {activeSetIdx === 3 && servingTeam === 1 && (
                        <span className="bg-amber-400 text-[8px] text-amber-950 font-extrabold px-1 py-0.5 rounded flex items-center animate-pulse whitespace-nowrap shrink-0 select-none">
                          Giao 🏸
                        </span>
                      )}
                      <button 
                        type="button"
                        disabled={!s3Active}
                        onClick={() => setS3Team1(prev => Math.max(0, prev - 1))}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition cursor-pointer select-none disabled:opacity-50 shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={limitSet3 <= 15 ? 21 : 30}
                        value={s3Team1}
                        onChange={(e) => {
                          const rawVal = Math.max(0, parseInt(e.target.value) || 0);
                          const maxAllowed = getMaxScoreForTeam(s3Team1, s3Team2, limitSet3);
                          const val = Math.min(rawVal, maxAllowed);
                          if (val > s3Team1) setServingTeam(1);
                          setS3Team1(val);
                        }}
                        className={`w-10 text-center font-mono font-bold rounded-lg p-1 text-xs border focus:border-blue-500 focus:outline-none transition shrink-0 ${activeSetIdx === 3 && servingTeam === 1 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-white border-slate-250 text-slate-805'}`}
                        disabled={!s3Active}
                      />
                      <button 
                        type="button"
                        disabled={!s3Active}
                        onClick={() => {
                          const maxAllowed = getMaxScoreForTeam(s3Team1, s3Team2, limitSet3);
                          setS3Team1(prev => Math.min(prev + 1, maxAllowed));
                          setServingTeam(1);
                        }}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition cursor-pointer select-none shadow-xs disabled:opacity-50 shrink-0"
                      >
                        +
                      </button>
                    </div>
                    
                    <span className="text-slate-400 text-xs shrink-0 font-mono font-bold">:</span>
                    
                    <div className={`flex items-center gap-1 w-[38%] justify-start p-1 rounded-lg border transition ${activeSetIdx === 3 && servingTeam === 2 ? 'bg-amber-50 border-amber-300 shadow-xs font-medium' : 'border-transparent'}`}>
                      <button 
                        type="button"
                        disabled={!s3Active}
                        onClick={() => setS3Team2(prev => Math.max(0, prev - 1))}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition cursor-pointer select-none disabled:opacity-50 shrink-0"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={limitSet3 <= 15 ? 21 : 30}
                        value={s3Team2}
                        onChange={(e) => {
                          const rawVal = Math.max(0, parseInt(e.target.value) || 0);
                          const maxAllowed = getMaxScoreForTeam(s3Team2, s3Team1, limitSet3);
                          const val = Math.min(rawVal, maxAllowed);
                          if (val > s3Team2) setServingTeam(2);
                          setS3Team2(val);
                        }}
                        className={`w-10 text-center font-mono font-bold rounded-lg p-1 text-xs border focus:border-blue-500 focus:outline-none transition shrink-0 ${activeSetIdx === 3 && servingTeam === 2 ? 'bg-amber-50 border-amber-300 text-amber-950' : 'bg-white border-slate-250 text-slate-805'}`}
                        disabled={!s3Active}
                      />
                      <button 
                        type="button"
                        disabled={!s3Active}
                        onClick={() => {
                          const maxAllowed = getMaxScoreForTeam(s3Team2, s3Team1, limitSet3);
                          setS3Team2(prev => Math.min(prev + 1, maxAllowed));
                          setServingTeam(2);
                        }}
                        className="h-7 w-7 text-xs font-extrabold flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition cursor-pointer select-none shadow-xs disabled:opacity-50 shrink-0"
                      >
                        +
                      </button>
                      {activeSetIdx === 3 && servingTeam === 2 && (
                        <span className="bg-amber-400 text-[8px] text-amber-950 font-extrabold px-1.5 py-0.5 rounded flex items-center animate-pulse whitespace-nowrap shrink-0 select-none">
                          Giao 🏸
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {matchStatus === 'COMPLETED' && (
                  <div className="text-[10px] text-slate-405 font-medium flex items-center gap-1">
                    <Zap className="h-3 w-3 text-blue-600" /> Hệ thống tính điểm sẽ tự động xác định winner chung cuộc dựa trên số hiệp thắng (Chạm 2).
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 select-none whitespace-nowrap">
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-705 px-4 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={saveScoreboard}
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
              >
                Lưu kết quả
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Edit Match Schedule & Court Dialog Modal */}
      {editingCourtMatchId && (() => {
        const matchObjForCourt = matches.find(m => m.id === editingCourtMatchId);
        const tourneyForCourt = tournaments.find(t => t.id === matchObjForCourt?.tournamentId);
        const courtsLimit = tourneyForCourt?.courtsCount || 3;
        const matchDuration = tourneyForCourt?.matchDuration || 30;

        // Resolve teams' names
        const getTeamTitle = (teamId: string | null, pos: 'team1' | 'team2') => {
          if (!teamId) return pos === 'team1' ? 'Đội Chờ Xác Định (1)' : 'Đội Chờ Xác Định (2)';
          const found = teams.find(t => t.id === teamId);
          return found ? found.name : `Cặp đấu ${teamId}`;
        };

        const t1Name = matchObjForCourt ? getTeamTitle(matchObjForCourt.team1Id, 'team1') : '';
        const t2Name = matchObjForCourt ? getTeamTitle(matchObjForCourt.team2Id, 'team2') : '';

        // Real-time conflict checking: find other matches having overlapping times on same court
        const proposedStart = new Date(`${editingDateValue}T${editingTimeValue}:00`);
        const isTimeValid = !isNaN(proposedStart.getTime());

        const conflicts = isTimeValid ? matches.filter(m => {
          if (m.id === editingCourtMatchId) return false;
          if (m.status === 'COMPLETED') return false;
          if (!m.scheduledTime || !m.court) return false;
          if (m.court.trim().toLowerCase() !== editingCourtValue.trim().toLowerCase()) return false;

          const mStart = new Date(m.scheduledTime);
          if (isNaN(mStart.getTime())) return false;

          const otherTourney = tournaments.find(t => t.id === m.tournamentId);
          const otherDuration = otherTourney?.matchDuration || 30;
          const proposedEnd = new Date(proposedStart.getTime() + matchDuration * 60000);
          const otherEnd = new Date(mStart.getTime() + otherDuration * 60000);

          return proposedStart < otherEnd && mStart < proposedEnd;
        }) : [];

        // Real-time recommendation of free courts at exact proposed hours start
        const allCourts: string[] = [];
        for (let i = 0; i < courtsLimit; i++) {
          const std = `Sân ${i + 1}`;
          const courtNum = tourneyForCourt?.courtNumbers?.[i] || std;
          const courtName = tourneyForCourt?.courtNames?.[i];
          const fullCourtName = courtName ? `${courtNum} (${courtName})` : courtNum;
          allCourts.push(fullCourtName);
        }

        const freeCourts = isTimeValid ? allCourts.filter(cName => {
          return !matches.some(m => {
            if (m.id === editingCourtMatchId) return false;
            if (m.status === 'COMPLETED') return false;
            if (!m.scheduledTime || !m.court) return false;
            if (m.court.trim().toLowerCase() !== cName.trim().toLowerCase()) return false;

            const mStart = new Date(m.scheduledTime);
            if (isNaN(mStart.getTime())) return false;

            const otherEnd = new Date(mStart.getTime() + (tournaments.find(t => t.id === m.tournamentId)?.matchDuration || 30) * 60000);
            const proposedEnd = new Date(proposedStart.getTime() + matchDuration * 60000);

            return proposedStart < otherEnd && mStart < proposedEnd;
          });
        }) : [];

        // Real-time recommendation of subsequent free timeslots on the chosen court if occupied
        const nextFreeTimeOnCourt = isTimeValid ? (() => {
          for (let i = 1; i <= 5; i++) {
            const candidateStart = new Date(proposedStart.getTime() + i * matchDuration * 60000);
            const candidateEnd = new Date(candidateStart.getTime() + matchDuration * 60000);

            const occupied = matches.some(m => {
              if (m.id === editingCourtMatchId) return false;
              if (m.status === 'COMPLETED') return false;
              if (!m.scheduledTime || !m.court) return false;
              if (m.court.trim().toLowerCase() !== editingCourtValue.trim().toLowerCase()) return false;

              const mStart = new Date(m.scheduledTime);
              if (isNaN(mStart.getTime())) return false;

              const otherDuration = tournaments.find(t => t.id === m.tournamentId)?.matchDuration || 30;
              const otherEnd = new Date(mStart.getTime() + otherDuration * 60000);

              return candidateStart < otherEnd && mStart < candidateEnd;
            });

            if (!occupied) {
              const hh = String(candidateStart.getHours()).padStart(2, '0');
              const mm = String(candidateStart.getMinutes()).padStart(2, '0');
              return `${hh}:${mm}`;
            }
          }
          return null;
        })() : null;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden text-left p-6 space-y-5 animate-in scale-in duration-200">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 uppercase font-sans tracking-tight">
                    <Clock className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                    CẤU HÌNH LỊCH & SÂN ĐẤU
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                    Quản lý thủ công lịch trình & vị trí cặp thi đấu
                  </p>
                </div>
                <button 
                  onClick={() => setEditingCourtMatchId(null)}
                  className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1 rounded-full cursor-pointer transition select-none"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Match Header Information Card */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2">
                <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Cặp đấu đang chọn:</div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 gap-2">
                  <span className="truncate bg-white px-2 py-1 rounded border border-slate-100 max-w-[45%]" title={t1Name}>{t1Name}</span>
                  <span className="text-slate-400 italic shrink-0">VS</span>
                  <span className="truncate bg-white px-2 py-1 rounded border border-slate-100 max-w-[45%]" title={t2Name}>{t2Name}</span>
                </div>
                {matchObjForCourt?.groupName && (
                  <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide">
                    Vòng đấu: Vòng {matchObjForCourt?.round} • {matchObjForCourt?.groupName}
                  </div>
                )}
              </div>

              {/* Configurations Fields Area */}
              <div className="space-y-4">
                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Ngày Thi Đấu
                    </label>
                    <input
                      type="date"
                      value={editingDateValue}
                      min={tourneyForCourt?.startDate}
                      max={tourneyForCourt?.endDate}
                      onChange={(e) => setEditingDateValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Giờ Thi Đấu
                    </label>
                    <input
                      type="time"
                      value={editingTimeValue}
                      onChange={(e) => setEditingTimeValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold shadow-inner"
                    />
                  </div>
                </div>

                {/* Court selectors */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Chọn Sân Trống Hoặc Chỉ Định Sân
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Array.from({ length: courtsLimit }).map((_, idx) => {
                      const standardNumber = `Sân ${idx + 1}`;
                      const courtNum = tourneyForCourt?.courtNumbers?.[idx] || standardNumber;
                      const courtName = tourneyForCourt?.courtNames?.[idx];
                      const fullCourtName = courtName ? `${courtNum} (${courtName})` : courtNum;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditingCourtValue(fullCourtName)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition text-center ${
                            editingCourtValue === fullCourtName
                              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {fullCourtName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Optional manual entry of customs courts */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Hoặc Nhập Tên Sân Tự Chọn
                  </label>
                  <input
                    type="text"
                    value={editingCourtValue}
                    onChange={(e) => setEditingCourtValue(e.target.value)}
                    placeholder="Nhập tên sân đấu thủ công..."
                    className="w-full bg-slate-50 border border-slate-200 text-slate-850 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 focus:bg-white font-medium"
                  />
                </div>
              </div>

              {/* Dynamic Warning Notification Blocks */}
              {conflicts.length > 0 && (
                <div className="bg-rose-50 border border-rose-250 text-rose-805 rounded-xl p-3.5 space-y-2.5 max-h-[170px] overflow-y-auto">
                  <div className="flex items-start gap-1.5 text-[11px] font-bold uppercase select-none">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 animate-bounce" />
                    <span>⚠️ TRÙNG LỊCH THI ĐẤU!</span>
                  </div>
                  <div className="text-[10px] leading-relaxed select-text space-y-1">
                    <p>
                      Sân <strong className="font-bold text-rose-700">{editingCourtValue}</strong> trong khoảng thời gian này đã được xếp lịch trước:
                    </p>
                    <ul className="list-disc list-inside bg-white/50 p-2 rounded-lg space-y-1 font-semibold text-rose-900 border border-rose-100">
                      {conflicts.map((m: any) => {
                        const otherT1 = getTeamTitle(m.team1Id, 'team1');
                        const otherT2 = getTeamTitle(m.team2Id, 'team2');
                        const otherTourney = tournaments.find(t => t.id === m.tournamentId);
                        return (
                          <li key={m.id} className="truncate">
                            {otherT1} vs {otherT2} (Vòng {m.round} - {otherTourney?.name || 'Cầu lông'})
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Suggesters options */}
                  <div className="pt-2 border-t border-rose-200/50 space-y-2">
                    {freeCourts.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-emerald-800 block font-extrabold uppercase tracking-wide">💡 CÁC SÂN ĐANG TRỐNG CÙNG GIỜ NÀY:</span>
                        <div className="flex flex-wrap gap-1">
                          {freeCourts.slice(0, 3).map(cName => (
                            <button
                              key={cName}
                              type="button"
                              onClick={() => setEditingCourtValue(cName)}
                              className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-[8px] font-bold text-white px-1.5 py-0.5 rounded transition bg-emerald-610 border-none inline-block duration-150"
                            >
                              Chọn {cName}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {nextFreeTimeOnCourt && (
                      <div className="space-y-1">
                        <span className="text-[9px] text-indigo-800 block font-extrabold uppercase tracking-wide">💡 GIỜ TRỐNG TIẾP THEO TRÊN SÂN NÀY:</span>
                        <button
                          type="button"
                          onClick={() => setEditingTimeValue(nextFreeTimeOnCourt)}
                          className="bg-indigo-600 hover:bg-indigo-500 cursor-pointer text-[8px] font-bold text-white px-2 py-0.5 rounded transition uppercase border-none duration-150"
                        >
                          Dời sang {nextFreeTimeOnCourt}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action boundaries */}
              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCourtMatchId(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs hover:bg-slate-50 cursor-pointer font-bold duration-150"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="button"
                  disabled={!editingDateValue || !editingTimeValue}
                  onClick={() => {
                    const proposedDateObj = new Date(`${editingDateValue}T${editingTimeValue}:00`);
                    if (isNaN(proposedDateObj.getTime())) {
                      window.alert('⚠️ Định dạng ngày giờ không hợp lệ!');
                      return;
                    }
                    updateMatchDetail(editingCourtMatchId, { 
                      court: editingCourtValue.trim() || 'Sắp xếp',
                      scheduledTime: proposedDateObj.toISOString()
                    });
                    setEditingCourtMatchId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs cursor-pointer font-bold shadow-xs transition-all duration-150 flex items-center gap-1.5 ${
                    conflicts.length > 0 
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-100' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-200'
                  }`}
                >
                  {conflicts.length > 0 ? '⚠️ Cứ ghi đè lịch' : 'Lưu lịch thi đấu'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
