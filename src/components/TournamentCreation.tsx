import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Trophy, HelpCircle, AlertCircle, Sparkles, Check, CheckCircle2, MapPin } from 'lucide-react';
import { TournamentFormat } from '../types';

interface TournamentCreationProps {
  setCurrentTab: (tab: string) => void;
}

export default function TournamentCreation({ setCurrentTab }: TournamentCreationProps) {
  const { createTournament, tournaments, teams } = useTournament();
  
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('GROUP_KNOCKOUT');
  const [numberOfTeams, setNumberOfTeams] = useState<number>(8);
  const [groupSize, setGroupSize] = useState<number>(4);
  const [advancePerGroup, setAdvancePerGroup] = useState<number>(2);
  const [pointsPerVictory, setPointsPerVictory] = useState<number>(3);
  const [setsToWin, setSetsToWin] = useState<2 | 3>(2); // best of 3 yields 2 sets to win
  const [pointsPerSet, setPointsPerSet] = useState<number>(21);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [decidingSetPoints, setDecidingSetPoints] = useState<number>(15);
  const [specialFinalsRuleEnabled, setSpecialFinalsRuleEnabled] = useState<boolean>(false);
  const [specialFinalsPoints, setSpecialFinalsPoints] = useState<number>(21);
  const [specialFinalsDecidingPoints, setSpecialFinalsDecidingPoints] = useState<number>(15);

  // States for Vòng Tròn top 4 knockout transition
  const [hasSemis, setHasSemis] = useState<boolean>(true);
  const [semisPairingType, setSemisPairingType] = useState<'1v2_3v4' | '1v4_2v3'>('1v4_2v3');

  // New scheduling & projection states
  const [startDate, setStartDate] = useState<string>('2026-05-24');
  const [endDate, setEndDate] = useState<string>('2026-05-31');
  const [playingDays, setPlayingDays] = useState<string[]>(['2026-05-24', '2026-05-25', '2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30', '2026-05-31']);
  const [playingHoursStart, setPlayingHoursStart] = useState<string>('08:00');
  const [playingHoursEnd, setPlayingHoursEnd] = useState<string>('18:00');
  const [optimizeSchedule, setOptimizeSchedule] = useState<boolean>(true); // default to optimization ON
  const [matchDuration, setMatchDuration] = useState<number>(60);
  const [courtsCount, setCourtsCount] = useState<number>(3);
  const [matchType, setMatchType] = useState<'SINGLES' | 'DOUBLES'>('DOUBLES');
  const [courtNamesArray, setCourtNamesArray] = useState<string[]>(['', '', '']);
  const [courtNumbersArray, setCourtNumbersArray] = useState<string[]>(['Sân 1', 'Sân 2', 'Sân 3']);

  const handleCourtsCountChange = (count: number) => {
    setCourtsCount(count);
    setCourtNamesArray(prev => {
      const arr = [...prev];
      if (arr.length < count) {
        for (let i = arr.length; i < count; i++) {
          arr.push('');
        }
      } else if (arr.length > count) {
        return arr.slice(0, count);
      }
      return arr;
    });
    setCourtNumbersArray(prev => {
      const arr = [...prev];
      if (arr.length < count) {
        for (let i = arr.length; i < count; i++) {
          arr.push(`Sân ${i + 1}`);
        }
      } else if (arr.length > count) {
        return arr.slice(0, count);
      }
      return arr;
    });
  };

  const getEstimatedMatchesCount = () => {
    if (format === 'ROUND_ROBIN') {
      const rrMatches = (numberOfTeams * (numberOfTeams - 1)) / 2;
      const koMatches = hasSemis ? 4 : 2;
      return rrMatches + koMatches;
    } else if (format === 'KNOCKOUT') {
      return numberOfTeams; // 8 teams -> 8 matches, etc.
    } else { // GROUP_KNOCKOUT
      const sizeA = Math.ceil(numberOfTeams / 2);
      const sizeB = Math.floor(numberOfTeams / 2);
      const matchesA = (sizeA * (sizeA - 1)) / 2;
      const matchesB = (sizeB * (sizeB - 1)) / 2;
      return matchesA + matchesB + 4; // 4 matches in KO (SF1, SF2, Final, 3rd)
    }
  };

  const getGroupDivisionInfo = () => {
    if (numberOfTeams % 2 === 0) {
      const perGroup = numberOfTeams / 2;
      return `Chia đều làm 2 bảng (Bảng A & Bảng B) — mỗi bảng ${perGroup} đội`;
    } else {
      const g1 = Math.ceil(numberOfTeams / 2);
      const g2 = Math.floor(numberOfTeams / 2);
      return `Chia làm 2 bảng: Bảng A (${g1} đội) & Bảng B (${g2} đội)`;
    }
  };

  React.useEffect(() => {
    if (format === 'GROUP_KNOCKOUT') {
      const calculatedGroupSize = Math.ceil(numberOfTeams / 2);
      setGroupSize(calculatedGroupSize);
    }
  }, [numberOfTeams, format]);

  const timeSlotsOptions = React.useMemo(() => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      const hStr = String(h).padStart(2, '0');
      slots.push(`${hStr}:00`);
      slots.push(`${hStr}:30`);
    }
    return slots;
  }, []);

  const getPlayingDaysOptions = () => {
    const dates: { label: string; value: string; short: string; dateStr: string }[] = [];
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 12, 0, 0, 0);

    const [ey, em, ed] = endDate.split('-').map(Number);
    const end = new Date(ey, em - 1, ed, 12, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return [];
    }
    const dayMapTranslations: Record<number, { full: string; short: string; en: string }> = {
      0: { full: 'Chủ Nhật', short: 'CN', en: 'Sunday' },
      1: { full: 'Thứ Hai', short: 'T2', en: 'Monday' },
      2: { full: 'Thứ Ba', short: 'T3', en: 'Tuesday' },
      3: { full: 'Thứ Tư', short: 'T4', en: 'Wednesday' },
      4: { full: 'Thứ Năm', short: 'T5', en: 'Thursday' },
      5: { full: 'Thứ Sáu', short: 'T6', en: 'Friday' },
      6: { full: 'Thứ Bảy', short: 'T7', en: 'Saturday' }
    };

    const current = new Date(start);
    let safety = 0;
    while (current <= end && safety < 60) {
      safety++;
      const dayNum = current.getDay();
      const translation = dayMapTranslations[dayNum];
      
      const dayStr = String(current.getDate()).padStart(2, '0');
      const monthStr = String(current.getMonth() + 1).padStart(2, '0');
      const dateStr = `${current.getFullYear()}-${monthStr}-${dayStr}`;
      
      dates.push({
        label: `${translation.full} (${dayStr}/${monthStr})`,
        value: dateStr,
        short: translation.short,
        dateStr
      });
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const getAvailableSlotsCount = () => {
    if (!startDate || !endDate) return 0;
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    const dayMap: Record<string, number> = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0
    };

    const allowedDayNums = playingDays.map(d => dayMap[d]).filter(n => n !== undefined);

    const [sh, sm] = playingHoursStart.split(':').map(Number);
    const [eh, em] = playingHoursEnd.split(':').map(Number);
    const hourLimit = isNaN(sh) ? 8 : sh;
    const minLimit = isNaN(sm) ? 0 : sm;
    const limitEndHour = isNaN(eh) ? 21 : eh;
    const limitEndMin = isNaN(em) ? 0 : em;

    let slotCount = 0;
    const current = new Date(startYear, startMonth - 1, startDay, 12, 0, 0, 0);
    const loopEnd = new Date(endYear, endMonth - 1, endDay, 12, 0, 0, 0);
    let safety = 0;

    const dayMapTranslations: Record<number, string> = {
      0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday'
    };

    while (current <= loopEnd && safety < 365) {
      safety++;
      const dayOfWeek = current.getDay();
      const currentYearStr = current.getFullYear();
      const currentMonthStr = String(current.getMonth() + 1).padStart(2, '0');
      const currentDayStr = String(current.getDate()).padStart(2, '0');
      const dateStringYMD = `${currentYearStr}-${currentMonthStr}-${currentDayStr}`;

      const enDayName = dayMapTranslations[dayOfWeek];

      const isAllowedString = playingDays.includes(dateStringYMD);
      const isAllowedDayName = playingDays.includes(enDayName);
      const isAllowedDayNum = allowedDayNums.includes(dayOfWeek);

      if (isAllowedString || isAllowedDayName || isAllowedDayNum) {
        const dayStart = new Date(current);
        dayStart.setHours(hourLimit, minLimit, 0, 0);

        const dayEnd = new Date(current);
        dayEnd.setHours(limitEndHour, limitEndMin, 0, 0);

        const totalMinutes = (dayEnd.getTime() - dayStart.getTime()) / (60 * 1000);
        if (totalMinutes > 0) {
          const slotsPerDay = Math.floor(totalMinutes / matchDuration);
          slotCount += slotsPerDay * courtsCount;
        }
      }
      current.setDate(current.getDate() + 1);
    }
    return slotCount;
  };

  // Automatically update playingDays when date range changes to default select all dates in range
  React.useEffect(() => {
    if (!startDate || !endDate) return;
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      const dates: string[] = [];
      const current = new Date(startYear, startMonth - 1, startDay, 12, 0, 0, 0);
      const loopEnd = new Date(endYear, endMonth - 1, endDay, 12, 0, 0, 0);
      let safety = 0;
      while (current <= loopEnd && safety < 60) {
        safety++;
        const monthStr = String(current.getMonth() + 1).padStart(2, '0');
        const dayStr = String(current.getDate()).padStart(2, '0');
        dates.push(`${current.getFullYear()}-${monthStr}-${dayStr}`);
        current.setDate(current.getDate() + 1);
      }
      setPlayingDays(dates);
    }
  }, [startDate, endDate]);

  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // Securing dynamic defaults when pointsPerSet changes
  React.useEffect(() => {
    if (pointsPerSet === 15) {
      setDecidingSetPoints(11);
      setSpecialFinalsRuleEnabled(true);
    } else if (pointsPerSet === 21) {
      setDecidingSetPoints(15);
      setSpecialFinalsRuleEnabled(false);
    }
  }, [pointsPerSet]);

  const getRecommendedDurationDetails = () => {
    const estStandardSetMin = pointsPerSet === 21 ? 18 : pointsPerSet === 15 ? 13 : pointsPerSet === 11 ? 9 : Math.round(pointsPerSet * 0.85);
    const estDecidingSetMin = decidingSetPoints === 21 ? 18 : decidingSetPoints === 15 ? 13 : decidingSetPoints === 11 ? 9 : Math.round(decidingSetPoints * 0.85);
    
    const isBestOf5 = setsToWin === 3;
    const maxDurationCalculated = isBestOf5 
      ? (4 * estStandardSetMin + estDecidingSetMin + 8)
      : (2 * estStandardSetMin + estDecidingSetMin + 5);

    const avgDurationCalculated = isBestOf5
      ? (3.1 * estStandardSetMin + estDecidingSetMin + 5)
      : (1.45 * estStandardSetMin + estDecidingSetMin + 4);

    let durationChoice = 60;
    if (maxDurationCalculated <= 35) {
      durationChoice = 30;
    } else if (maxDurationCalculated <= 50) {
      durationChoice = 45;
    } else if (maxDurationCalculated <= 75) {
      durationChoice = 60;
    } else if (maxDurationCalculated <= 105) {
      durationChoice = 90;
    } else {
      durationChoice = 120;
    }

    return {
      estStandardSetMin,
      estDecidingSetMin,
      maxDurationCalculated,
      avgDurationCalculated: Math.round(avgDurationCalculated),
      recommendedMatchDuration: durationChoice
    };
  };

  const recommendedDetails = getRecommendedDurationDetails();

  // Automatically adjust recommended match duration when scoring rules change
  React.useEffect(() => {
    const estStandardSetMin = pointsPerSet === 21 ? 18 : pointsPerSet === 15 ? 13 : pointsPerSet === 11 ? 9 : Math.round(pointsPerSet * 0.85);
    const estDecidingSetMin = decidingSetPoints === 21 ? 18 : decidingSetPoints === 15 ? 13 : decidingSetPoints === 11 ? 9 : Math.round(decidingSetPoints * 0.85);
    const isBestOf5 = setsToWin === 3;
    const maxDurationCalculated = isBestOf5 
      ? (4 * estStandardSetMin + estDecidingSetMin + 8)
      : (2 * estStandardSetMin + estDecidingSetMin + 5);

    let durationChoice = 60;
    if (maxDurationCalculated <= 35) {
      durationChoice = 30;
    } else if (maxDurationCalculated <= 50) {
      durationChoice = 45;
    } else if (maxDurationCalculated <= 75) {
      durationChoice = 60;
    } else if (maxDurationCalculated <= 105) {
      durationChoice = 90;
    } else {
      durationChoice = 120;
    }

    setMatchDuration(durationChoice);
  }, [setsToWin, pointsPerSet, decidingSetPoints]);

  // Seed default selections when teams load or target quantity changes
  React.useEffect(() => {
    if (teams.length > 0) {
      setSelectedTeamIds(teams.slice(0, numberOfTeams).map(t => t.id));
    }
  }, [teams, numberOfTeams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setAlert({ type: 'error', msg: 'Vui lòng điền tên giải đấu!' });
      return;
    }

    // Direct pass - uneven groups/sizes are now fully supported with dynamic splitting!

    // Auto-populate team ids if not enough are chosen because the selector is now hidden
    const finalTeamIds = teams.length >= numberOfTeams
      ? teams.slice(0, numberOfTeams).map(t => t.id)
      : teams.map(t => t.id);

    const created = createTournament({
      name,
      format,
      numberOfTeams,
      groupSize,
      advancePerGroup,
      pointsPerVictory,
      setsToWin,
      pointsPerSet,
      status: 'PLANNING',
      teamIds: finalTeamIds,
      decidingSetPoints,
      specialFinalsRuleEnabled,
      specialFinalsPoints,
      specialFinalsDecidingPoints,
      hasSemis: (format === 'ROUND_ROBIN' || format === 'GROUP_KNOCKOUT') ? hasSemis : undefined,
      semisPairingType: (format === 'ROUND_ROBIN' || format === 'GROUP_KNOCKOUT') && hasSemis ? semisPairingType : undefined,
      numGroups: format === 'GROUP_KNOCKOUT' ? 2 : undefined,
      startDate,
      endDate,
      playingDays,
      optimizeSchedule,
      playingHoursStart,
      playingHoursEnd,
      matchDuration,
      courtsCount,
      matchType,
      defaultCourt: (() => {
        const num = courtNumbersArray[0]?.trim() || 'Sân 1';
        const name = courtNamesArray[0]?.trim();
        return name ? `${num} (${name})` : num;
      })(),
      courtNames: courtNamesArray.map((cn) => cn.trim()),
      courtNumbers: courtNumbersArray.map((num, idx) => num.trim() || `Sân ${idx + 1}`)
    });

    setAlert({ type: 'success', msg: `Giải đấu "${created.name}" đã được khởi tạo thành công!` });
    setTimeout(() => {
      setAlert(null);
      setCurrentTab('schedule'); // Switch directly to Schedule view to view or bốc thăm!
    }, 1500);
  };

  return (
    <div id="tournament-creation" className="max-w-3xl mx-auto py-2 space-y-6">
      {/* Title block */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Trophy className="h-6.5 w-6.5 text-blue-600" />
          Thiết Kế & Tạo Giải Đấu Mới
        </h1>
        <p className="text-slate-500 text-xs md:text-sm">
          Khởi tạo một giải đấu cầu lông chuyên nghiệp với hệ thống thiết lập tự động hóa. Hãy cấu hình các thông số thể thức và luật thi đấu dưới đây.
        </p>
      </div>

      {notificationBlock(alert)}

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 space-y-6 shadow-sm">
        
        {/* Field 1: Name */}
        <div className="space-y-2">
          <label className="block text-slate-700 text-sm font-semibold">Tên Giải Đấu <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Giải Cầu Lông Đôi Nam Nữ Ba Đình Open 2026"
            className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Field 2: Format Choice */}
        <div className="space-y-3">
          <label className="block text-slate-700 text-sm font-semibold">Thể Thức Thi Đấu</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {formatCard(
              'GROUP_KNOCKOUT',
              'Chia bảng + Vòng loại',
              'Chia thành các bảng vòng tròn một lượt tính điểm, lấy các đội đứng đầu vào đấu bảng Knockout loại trực tiếp (Bán kết, Chung kết).',
              format,
              setFormat
            )}
            {formatCard(
              'ROUND_ROBIN',
              'Vòng Tròn Tính Điểm',
              'Tất cả các đội thi đấu vòng tròn một lượt tính điểm số. Đội có thứ hạng tổng điểm cao nhất khi kết thúc lượt đấu giành chức vô địch.',
              format,
              setFormat
            )}
            {formatCard(
              'KNOCKOUT',
              'Đấu Loại Trực Tiếp',
              'Sơ đồ nhánh đấu phân cặp Knockout từ Tứ kết, Bán kết đến Chung kết. Đội thua bị loại ngay tại chỗ, đội chiến thắng đi tiếp.',
              format,
              setFormat
            )}
          </div>
        </div>

        {/* Dynamic configuration options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div className="space-y-2">
            <label className="block text-slate-700 text-sm font-semibold">Thể Thức Đấu</label>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value as 'SINGLES' | 'DOUBLES')}
              className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:bg-white font-semibold transition"
            >
              <option value="SINGLES">Đánh Đơn (1 VĐV / đội)</option>
              <option value="DOUBLES">Đánh Đôi (2 VĐV / đội)</option>
            </select>
            <p className="text-slate-400 text-xs">Cấu hình thi đấu cá nhân đơn hay đấu đôi phối hợp.</p>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-700 text-sm font-semibold">Tổng Số Đội Tham Gia</label>
            <select
              value={numberOfTeams}
              onChange={(e) => setNumberOfTeams(Number(e.target.value))}
              className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:bg-white font-bold text-blue-700 transition"
            >
              {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => (
                <option key={num} value={num}>
                  {num} Đội {num === 8 ? '(Tiêu chuẩn)' : ''}
                </option>
              ))}
            </select>
            <p className="text-slate-400 text-xs">Cấu hình số lượng đội tham gia tranh cúp vô địch.</p>
          </div>

          {format === 'GROUP_KNOCKOUT' && (
            <>
              <div className="space-y-2">
                <label className="block text-slate-700 text-sm font-semibold">Quy Mô Mỗi Bảng</label>
                <div className="w-full bg-blue-50/50 text-blue-800 border border-blue-100 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm">
                  <span>
                    {getGroupDivisionInfo()}
                  </span>
                  <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase shrink-0">
                    TỰ ĐỘNG CHIA
                  </span>
                </div>
                <p className="text-slate-400 text-xs">Phân chia đội đều đặn vào bảng đấu tròn lọc hạt giống.</p>
              </div>

              <div className="space-y-2">
                <label className="block text-slate-700 text-sm font-semibold">Số Đội Đi Tiếp Mỗi Bảng</label>
                <select
                  value={advancePerGroup}
                  onChange={(e) => setAdvancePerGroup(Number(e.target.value))}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
                >
                  <option value={1}>Lấy 1 Đội nhất bảng</option>
                  <option value={2}>Lấy 2 Đội (Nhất & Nhì bảng)</option>
                </select>
                <p className="text-slate-400 text-xs">Số lượng đại diện lọt vào sơ đồ vòng loại trực tiếp.</p>
              </div>
            </>
          )}

          {format !== 'KNOCKOUT' && (
            <div className="space-y-2">
              <label className="block text-slate-700 text-sm font-semibold">Điểm Mỗi Trận Thắng</label>
              <input
                type="number"
                value={pointsPerVictory}
                onChange={(e) => setPointsPerVictory(Number(e.target.value))}
                min={1}
                max={5}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition"
              />
              <p className="text-slate-400 text-xs">Cộng lũy kế vào bảng điểm xếp hạng tự động của các đội.</p>
            </div>
          )}
        </div>

          {format === 'ROUND_ROBIN' && (
            <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 col-span-1 md:col-span-2 text-left space-y-4">
              <div className="bg-indigo-50 border border-indigo-200/60 p-3.5 rounded-xl text-slate-700 text-xs space-y-2 select-none">
                <span className="font-extrabold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wide">💡 THỂ THỨC VÒNG TRÒN (ROUND ROBIN):</span>
                <p className="leading-relaxed">
                  • <strong>Nếu bật Bán Kết (Mặc định)</strong>: Sau khi kết thúc loạt đấu vòng tròn tính điểm, giải đấu sẽ chọn ra <strong>Top 4 đội</strong> có điểm số cao nhất để tranh vị trí vàng (Top 1 gặp Top 4, Top 2 gặp Top 3). Các đội chiến thắng sẽ tiến thẳng đến trận <strong>Chung Kết</strong>, các đội bại trận sẽ thi đấu trận <strong>Tranh Hạng 3</strong>.
                </p>
                <p className="leading-relaxed">
                  • <strong>Nếu tắt Bán Kết</strong>: Không tổ chức vòng bán kết rời rạc để giảm số lượng trận dồn dập. Thay vào đó, <strong>Top 1 gặp Top 2</strong> tranh chức vô địch trực tiếp (Chung kết), và <strong>Top 3 gặp Top 4</strong> tranh giải ba trực tiếp ngay khi vòng tròn khép lại!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Vòng Trực Tiếp Tiếp Nối (Top 1,2,3,4)</label>
                  <div className="flex items-center gap-2 py-1 select-none">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-755 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasSemis}
                        onChange={(e) => setHasSemis(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-white border-slate-300"
                      />
                      Có thiết lập trận đấu Bán Kết
                    </label>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    Bật: Có Bán kết (Top 1 gặp Top 2/4...). Tắt: Top 1 gặp Top 2 tranh Nhất/Nhì trực tiếp, Top 3 gặp Top 4 tranh Hạng 3 trực tiếp.
                  </p>
                </div>

                {hasSemis && (
                  <div className="space-y-2">
                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Ghép Cặp Trận Đấu Bán Kết</label>
                    <select
                      value={semisPairingType}
                      onChange={(e) => setSemisPairingType(e.target.value as '1v2_3v4' | '1v4_2v3')}
                      className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    >
                      <option value="1v4_2v3">Top 1 gặp Top 4 & Top 2 gặp Top 3 (Theo cặp chéo tiêu chuẩn)</option>
                      <option value="1v2_3v4">Top 1 gặp Top 2 & Top 3 gặp Top 4</option>
                    </select>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Chọn cách ghép cặp bán kết. Sau đó chung kết sẽ là cặp trận win, tranh hạng 3 là cặp trận thua.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {format === 'GROUP_KNOCKOUT' && (
            <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 col-span-1 md:col-span-2 text-left space-y-4">
              <div className="bg-indigo-50 border border-indigo-200/60 p-3.5 rounded-xl text-slate-700 text-xs space-y-2 select-none">
                <span className="font-extrabold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wide">💡 THỂ THỨC CHIA BẢNG ĐẤU VÒNG LOẠI (GROUP KNOCKOUT):</span>
                <p className="leading-relaxed">
                  • <strong>Nếu bật Bán Kết (Mặc định)</strong>: Sau khi kết thúc loạt đấu vòng tròn của mỗi bảng, giải đấu sẽ chọn ra <strong>Top 2 đội đứng đầu của mỗi bảng (Nhất & Nhì)</strong> vào bán kết trực tiếp.
                </p>
                <p className="leading-relaxed">
                  • <strong>Nếu tắt Bán Kết</strong>: Bỏ qua loạt trận bán kết rời rạc. <strong>Nhất Bảng A sẽ gặp Nhất Bảng B</strong> trực tiếp tranh chức vô địch (Chung kết), và <strong>Nhì Bảng A gặp Nhì Bảng B</strong> trực tiếp tranh hạng ba ngay lập tức!
                </p>
                <p className="leading-relaxed text-slate-500 font-medium">
                  • <em>*Lưu ý</em>: Thiết lập cấu hình chuyên sâu này áp dụng trực quan cho trường hợp tiêu chuẩn 2 bảng đấu (Bảng A và B). Đối với từ 3 bảng đấu trở lên hoặc nhiều hơn 8 đội, hệ thống sẽ tự động bốc và chia cặp theo bảng chuẩn Knockout quốc tế.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Thiết lập trận địa Chung Kết & Bán Kết</label>
                  <div className="flex items-center gap-2 py-1 select-none">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-755 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasSemis}
                        onChange={(e) => setHasSemis(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-white border-slate-300"
                      />
                      Có thiết lập trận đấu Bán Kết
                    </label>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    Bật: Có Bán kết (Nhất A gặp Nhì B...). Tắt: Nhất A gặp Nhất B tranh Nhất/Nhì trực tiếp, Nhì A gặp Nhì B tranh Hạng 3 trực tiếp.
                  </p>
                </div>

                {hasSemis && (
                  <div className="space-y-2">
                    <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Cách Ghép Cặp Trận Đấu Bán Kết</label>
                    <select
                      value={semisPairingType}
                      onChange={(e) => setSemisPairingType(e.target.value as '1v2_3v4' | '1v4_2v3')}
                      className="w-full bg-white text-slate-800 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-600 focus:bg-white transition"
                    >
                      <option value="1v4_2v3">Nhất Bảng A gặp Nhì Bảng B & Nhất Bảng B gặp Nhì Bảng A (Crossover tiêu chuẩn BWF)</option>
                      <option value="1v2_3v4">Nhất Bảng A gặp Nhất Bảng B & Nhì Bảng A gặp Nhì Bảng B (Song song đồng hạng)</option>
                    </select>
                    <p className="text-slate-400 text-[10px] leading-relaxed">
                      Lựa chọn phương án chia nhánh. Đội chiến đấu giành vé đi chung kết, đội bại tranh hạng ba kì cựu.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Section: Luật Thi Đấu & Điểm Số Phân Set */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 md:p-6 space-y-4 shadow-inner">
          <div className="flex items-center gap-2 text-blue-600 font-sans font-semibold text-sm">
            <Sparkles className="h-4 w-4" />
            Luật Thi Đấu & Điểm Số Phân Set
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 text-left">
              <label className="block text-slate-700 text-xs font-semibold">Thể Thức Thắng Set (Best of)</label>
              <div className="flex flex-col gap-2 mt-1 sm:flex-row sm:gap-4">
                <label className="flex items-center gap-1.5 text-slate-600 text-xs cursor-pointer select-none">
                  <input
                    type="radio"
                    name="sets_best"
                    checked={setsToWin === 2}
                    onChange={() => setSetsToWin(2)}
                    className="accent-blue-600 h-3.5 w-3.5"
                  />
                  Best of 3 (Thắng 2 set)
                </label>
                <label className="flex items-center gap-1.5 text-slate-600 text-xs cursor-pointer select-none">
                  <input
                    type="radio"
                    name="sets_best"
                    checked={setsToWin === 3}
                    onChange={() => setSetsToWin(3)}
                    className="accent-blue-600 h-3.5 w-3.5"
                  />
                  Best of 5 (Thắng 3 set)
                </label>
              </div>
            </div>

            <div className="space-y-2 text-left">
              <label className="block text-slate-700 text-xs font-semibold">Giới Hạn Điểm Mỗi Set</label>
              <select
                value={pointsPerSet}
                onChange={(e) => setPointsPerSet(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 shadow-sm"
              >
                <option value={21}>21 Điểm (Tiêu chuẩn BWF)</option>
                <option value={15}>15 Điểm (Thi đấu nhanh)</option>
                <option value={11}>11 Điểm (Rút ngắn)</option>
              </select>
            </div>
          </div>

          {/* Tie-break points customization option */}
          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-slate-700 text-xs font-bold">Điểm Set Quyết Định (Tie-break)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min={5}
                  max={30}
                  value={decidingSetPoints}
                  onChange={(e) => setDecidingSetPoints(Number(e.target.value))}
                  className="w-24 bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 shadow-sm font-mono font-bold"
                />
                <span className="text-slate-400 text-xs">điểm</span>
                <div className="flex gap-1 ml-2">
                  <button
                    type="button"
                    onClick={() => setDecidingSetPoints(21)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition border ${decidingSetPoints === 21 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'}`}
                  >
                    21đ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecidingSetPoints(15)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition border ${decidingSetPoints === 15 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'}`}
                  >
                    15đ
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecidingSetPoints(11)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition border ${decidingSetPoints === 11 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'}`}
                  >
                    11đ
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-[10px] leading-tight">
                Áp dụng cho set cuối phân thắng bại ({setsToWin === 2 ? 'Set 3' : 'Set 5'}) khi hai bên hòa nhau {setsToWin === 2 ? '1-1' : '2-2'}.
              </p>
            </div>

            <div className="space-y-1 bg-blue-50/40 p-3 rounded-lg border border-blue-100/50 flex flex-col justify-center">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider font-mono">Chế độ phân set:</span>
              <p className="text-slate-600 text-[10px] leading-relaxed">
                Khi thi đấu chạm {setsToWin === 2 ? 'set thứ 3' : 'set thứ 5'} quyết định, điểm số trần sẽ được tự động điều chỉnh thành <strong className="text-blue-600 font-bold">{decidingSetPoints} điểm</strong> thay vì chơi đủ điểm vòng ngoài giúp tối ưu thể lực VĐV.
              </p>
            </div>
          </div>

          {/* Advanced override rules for Finals / 3rd-Place match */}
          <div className="pt-3 border-t border-slate-200/60 text-left">
            <div className="bg-white/80 rounded-xl p-3 border border-slate-200 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={specialFinalsRuleEnabled}
                  onChange={(e) => setSpecialFinalsRuleEnabled(e.target.checked)}
                  className="accent-blue-600 h-4 w-4 mt-0.5"
                />
                <div className="text-left">
                  <span className="text-slate-800 text-xs font-bold block">
                    Áp dụng Luật Phân Điểm Riêng cho Chung Kết & Tranh Hạng 3
                  </span>
                  <span className="text-slate-450 text-[10px] leading-tight block">
                    Kích hoạt để cấu hình lại điểm thi đấu (ví dụ: chơi 21 điểm độc lập cho các trận quyết định tranh huy chương khi vòng ngoài chơi 15 điểm).
                  </span>
                </div>
              </label>

              {specialFinalsRuleEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 pt-2 border-l-2 border-l-blue-400 text-left animate-in slide-in-from-left-2 duration-150">
                  <div className="space-y-1.5">
                    <span className="block text-slate-700 text-[10px] font-bold">Giới hạn điểm các trận Chung kết & Tranh Hạng 3:</span>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min={10}
                        max={30}
                        value={specialFinalsPoints}
                        onChange={(e) => setSpecialFinalsPoints(Number(e.target.value))}
                        className="w-20 bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-600 shadow-sm font-mono font-bold"
                      />
                      <span className="text-slate-400 text-xs">điểm</span>
                      <button
                        type="button"
                        onClick={() => setSpecialFinalsPoints(21)}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        Mặc định 21đ
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-slate-700 text-[10px] font-bold">Điểm cho set quyết định (Set 3 / Set 5) trận CK/Hàng 3:</span>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min={5}
                        max={30}
                        value={specialFinalsDecidingPoints}
                        onChange={(e) => setSpecialFinalsDecidingPoints(Number(e.target.value))}
                        className="w-20 bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-600 shadow-sm font-mono font-bold"
                      />
                      <span className="text-slate-400 text-xs">điểm</span>
                      <button
                        type="button"
                        onClick={() => setSpecialFinalsDecidingPoints(15)}
                        className="text-[10px] text-blue-600 hover:underline font-bold"
                      >
                        Mặc định 15đ
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gợi ý thời lượng dựa trên cấu hình luật chơi */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2 text-left">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
              Gợi ý Thời Lượng Từ Luật Đấu & Điểm Số
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Mỗi set đấu chính ({pointsPerSet}đ):</span>
                <span className="text-xs font-bold text-slate-800 font-mono">~{recommendedDetails.estStandardSetMin} phút / set</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Set quyết định ({decidingSetPoints}đ):</span>
                <span className="text-xs font-bold text-slate-800 font-mono">~{recommendedDetails.estDecidingSetMin} phút / set</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Tổng trận đấu tối đa:</span>
                <span className="text-xs font-extrabold text-blue-700 font-mono">~{recommendedDetails.maxDurationCalculated} phút / trận</span>
              </div>
            </div>

            <p className="text-slate-500 text-[10px] leading-relaxed pt-1">
              💡 <strong>Hệ Thống Phân Tích & Dự Kiến:</strong> Thời lượng trận trung bình thực tế khoảng <strong>{recommendedDetails.avgDurationCalculated} phút/trận</strong>, và có thể kéo dài tối đa <strong>{recommendedDetails.maxDurationCalculated} phút/trận</strong> (đã cộng dư thời lượng khởi động, nghỉ lướt set và rượt đuổi tỷ số Deuce). <strong className="text-emerald-600">Hệ thống đã tự động chọn sẵn thời lượng {recommendedDetails.recommendedMatchDuration} phút</strong> trong cấu hình lịch thi đấu dưới đây!
            </p>
          </div>

          <div className="text-slate-500 text-[11px] leading-relaxed flex gap-1.5 border-t border-slate-200/55 pt-3 text-left">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-blue-500 mt-0.5" />
            V-Badminton tự động áp dụng quy tắc Deuce mở rộng: Khi chạm điểm số 20-20, hai cặp tuyển thủ giằng co khoảng cách 2 điểm tối đa lên điểm thứ 30. Tại mốc 29-29, bên giành điểm thứ 30 trước sẽ chiến thắng tuyệt đối.
          </div>
        </div>

        {/* Section: Cấu hình Lịch trình giải đấu & Phân bố thời gian */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 md:p-6 space-y-4 shadow-inner text-left">
          <div className="flex items-center gap-2 text-blue-600 font-sans font-semibold text-sm">
            <Trophy className="h-4.5 w-4.5" />
            Cấu Hình Lịch Trình & Tổng Số Trận Đấu Dự Kiến
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Ngày Bắt Đầu Giải Đấu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600 shadow-sm font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Ngày Kết Thúc Giải Đấu</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600 shadow-sm font-semibold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Các Ngày Thi Đấu (Click để chọn/bỏ chọn ngày thi đấu)</label>
            <div className="flex flex-wrap gap-2">
              {getPlayingDaysOptions().map((day) => {
                const isSelected = playingDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setPlayingDays(playingDays.filter((d) => d !== day.value));
                      } else {
                        setPlayingDays([...playingDays, day.value]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-650 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <p className="text-slate-400 text-[10px]">Hệ thống sẽ chỉ xếp các trận đấu vào những ngày đã được chọn trong khoảng thời gian diễn ra giải.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Giờ Bắt Đầu Đánh</label>
              <select
                value={playingHoursStart}
                onChange={(e) => setPlayingHoursStart(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 shadow-sm font-semibold"
              >
                {timeSlotsOptions.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Giờ Kết Thúc Đánh</label>
              <select
                value={playingHoursEnd}
                onChange={(e) => setPlayingHoursEnd(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 shadow-sm font-semibold"
              >
                {timeSlotsOptions.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Thời Lượng Mỗi Trận</label>
                {matchDuration === recommendedDetails.recommendedMatchDuration && (
                  <span className="text-[9px] font-bold text-emerald-600 uppercase">Khuyên Dùng ✅</span>
                )}
              </div>
              <select
                value={matchDuration}
                onChange={(e) => setMatchDuration(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 shadow-sm font-mono font-bold"
              >
                <option value={30}>30 phút / trận</option>
                <option value={45}>45 phút / trận</option>
                <option value={60}>60 phút (Tiêu chuẩn)</option>
                <option value={90}>90 phút / trận</option>
                <option value={120}>120 phút / trận</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Số Sân Thi Đấu</label>
              <select
                value={courtsCount}
                onChange={(e) => handleCourtsCountChange(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 text-slate-850 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 shadow-sm font-bold text-blue-600 transition hover:bg-slate-100"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(c => (
                  <option key={c} value={c}>{c} Sân</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tối ưu lịch đấu toggle button */}
          <div className="flex items-center justify-between p-4 bg-indigo-50/55 border border-indigo-100 rounded-xl hover:bg-indigo-50/80 transition duration-150 shadow-2xs">
            <div className="space-y-1 text-left">
              <span className="flex items-center gap-1.5 text-indigo-900 text-xs font-bold uppercase tracking-wide">
                <Sparkles className="h-4 w-4 text-indigo-500 animate-pulse" />
                Tối ưu hóa lịch đấu (Giảm thiểu thời gian chờ)
              </span>
              <p className="text-[10px] text-indigo-650 max-w-md leading-relaxed">
                Tự động tối ưu sắp xếp lịch thi đấu, phân bổ các lượt trận sát nhau để hạn chế tối đa thời gian chờ đợi giữa hai trận liên tiếp cho mỗi đội/mỗi cặp VĐV.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 ml-4">
              <input
                type="checkbox"
                checked={optimizeSchedule}
                onChange={(e) => setOptimizeSchedule(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left space-y-4 shadow-inner">
            <div className="flex items-center gap-1.5 text-blue-600 font-sans font-semibold text-xs uppercase tracking-wider">
              <span className="p-1 bg-blue-100 rounded text-blue-700">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              Thiết lập Danh Sách Sân Thi Đấu Chi Tiết:
            </div>

            {/* Dynmamic inputs for each Court */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 space-y-3">
              <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1 pb-1.5 border-b border-slate-100">
                <span>⚙️ Nhập Tên Sân và Thông Tin Chi Tiết ({courtsCount} Sân)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {Array.from({ length: courtsCount }).map((_, idx) => {
                  const label = `Sân ${idx + 1}`;
                  const currentNum = courtNumbersArray[idx] || `Sân ${idx + 1}`;
                  const currentVal = courtNamesArray[idx] || '';
                  return (
                    <div key={idx} className="bg-slate-50/50 border border-slate-200 p-3 rounded-xl space-y-2.5 hover:border-slate-300 transition duration-150 shadow-2xs">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                        <span>Thiết lập {label}</span>
                        <span className="text-blue-600 font-extrabold truncate max-w-[110px]">{currentNum}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Số / Ký hiệu Sân</label>
                        <input
                          type="text"
                          value={courtNumbersArray[idx] || ''}
                          onChange={(e) => {
                            const updated = [...courtNumbersArray];
                            updated[idx] = e.target.value;
                            setCourtNumbersArray(updated);
                          }}
                          placeholder={`Ví dụ: ${label}`}
                          className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-inner transition"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Tên Sân (Tùy chọn)</label>
                        <input
                          type="text"
                          value={currentVal}
                          onChange={(e) => {
                            const updated = [...courtNamesArray];
                            updated[idx] = e.target.value;
                            setCourtNamesArray(updated);
                          }}
                          placeholder={`Ví dụ: Sân Icon Đ/c: 123 Tôn Đản`}
                          className="w-full bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100 shadow-inner transition"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Clean Total Estimated Matches Indicator Card */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block font-mono">Tổng số trận đấu dự kiến</span>
              <p className="text-slate-500 text-[10px] leading-relaxed max-w-md">
                Dựa trên quy mô vận động viên và thể thức thi đấu đã cấu hình, hệ thống sẽ tự động bốc thăm chia bảng và lập lịch thi đấu chi tiết cho giải đấu này.
              </p>
            </div>
            
            <div className="bg-white px-6 py-3 rounded-xl border border-blue-100 shadow-sm text-center shrink-0 min-w-[150px]">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Tổng số trận</span>
              <span className="text-2xl font-extrabold text-blue-700 font-mono">{getEstimatedMatchesCount()} trận</span>
            </div>
          </div>

          {/* Dynamic Playing Time Sufficiency Report Card */}
          {(() => {
            const availableSlots = getAvailableSlotsCount();
            const estimatedMatches = getEstimatedMatchesCount();
            const isSufficient = availableSlots >= estimatedMatches;

            // Daily hour calculation for user reference
            const [sh, sm] = playingHoursStart.split(':').map(Number);
            const [eh, em] = playingHoursEnd.split(':').map(Number);
            const diffMin = (eh * 60 + em) - (sh * 60 + sm);
            const hoursPerDay = Math.max(0, Number((diffMin / 60).toFixed(1)));

            if (isSufficient) {
              return (
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex items-start gap-3 text-left">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">Đảm Bảo Đủ Quỹ Thời Gian Thi Đấu</span>
                    <p className="text-slate-600 text-xs leading-relaxed">
                      Lịch thi đấu đã chọn gồm <strong className="text-slate-800 font-bold">{playingDays.length} ngày đấu</strong> (khung giờ từ <strong className="text-slate-800 font-bold">{playingHoursStart} &rarr; {playingHoursEnd}</strong> - khoảng <strong>{hoursPerDay} giờ/ngày</strong>), cung cấp tối đa <strong className="text-emerald-700 font-bold">{availableSlots} slots</strong> thi đấu cho {courtsCount} Sân. 
                    </p>
                    <p className="text-emerald-700 text-[10px] font-bold mt-1">
                      ✅ Hoàn toàn đủ khả năng hoàn thành toàn bộ {estimatedMatches} trận đấu dự kiến đúng tiến độ!
                    </p>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex items-start gap-3 text-left">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">Cảnh báo: Thiếu Quỹ Thời Gian Thi Đấu</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      Số ngày thi đấu được chọn (<strong className="text-slate-800 font-bold">{playingDays.length} ngày</strong>) hoặc khung giờ chơi hàng ngày (<strong className="text-slate-800 font-bold">{hoursPerDay} giờ/ngày</strong>, thời lượng <strong className="text-slate-800 font-bold">{matchDuration} phút/trận</strong>) <strong>quá ít / quá ngắn</strong>. 
                      Hiện chỉ có <strong className="text-amber-700 font-bold">{availableSlots} slots</strong> khả dụng ({courtsCount} Sân), không đủ để xếp hết <strong className="text-amber-700 font-bold">{estimatedMatches} trận</strong> đấu của <strong className="text-slate-800 font-bold">{numberOfTeams} đội</strong>.
                    </p>
                    <p className="text-slate-500 text-[10px] leading-relaxed pt-1 scale-95 origin-left">
                      💡 <strong>Mẹo xử lý nhanh:</strong> Chọn thêm ngày thi đấu, mở rộng giờ chơi hàng ngày, hoặc thay đổi thời lượng mỗi trận đấu ngắn hơn. 
                      <span className="text-amber-700 font-semibold block mt-1">*(Hệ thống vẫn hỗ trợ lưu cấu hình và tự bốc thăm tràn lịch sang các ngày tiếp theo nếu bạn giữ nguyên)*</span>
                    </p>
                  </div>
                </div>
              );
            }
          })()}
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-sans font-bold text-sm px-8 py-3 rounded-xl shadow-lg shadow-blue-200/80 transition-all cursor-pointer"
          >
            Đăng ký & Khởi Tạo Giải
          </button>
        </div>
      </form>
    </div>
  );
}

// Sub components visual helper
function formatCard(id: TournamentFormat, title: string, desc: string, active: TournamentFormat, setActive: (f: TournamentFormat) => void) {
  const isSelected = active === id;
  return (
    <div
      onClick={() => setActive(id)}
      className={`border rounded-xl p-4 cursor-pointer transition flex flex-col justify-between gap-2 h-full text-left select-none ${
        isSelected
          ? 'bg-blue-50/70 border-blue-500 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/40'
      }`}
    >
      <div className="space-y-1 bg-transparent">
        <div className="flex items-center justify-between pb-1">
          <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>{title}</span>
          {isSelected && <span className="bg-blue-600 text-white rounded-full p-0.5 shrink-0"><Check className="h-3 w-3" /></span>}
        </div>
        <p className="text-slate-500 text-[11px] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function notificationBlock(alert: { type: 'success' | 'error'; msg: string } | null) {
  if (!alert) return null;
  return (
    <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-sans ${
      alert.type === 'success' 
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
        : 'bg-rose-50 text-rose-700 border border-rose-200'
    }`}>
      {alert.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />}
      {alert.msg}
    </div>
  );
}

function getTeamLogoColor(logo: string) {
  switch (logo) {
    case 'emerald': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'blue': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'amber': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'rose': return 'bg-rose-50 text-rose-600 border-rose-200';
    case 'indigo': return 'bg-indigo-50 text-indigo-600 border-indigo-200';
    case 'purple': return 'bg-purple-50 text-purple-600 border-purple-200';
    case 'cyan': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'orange': return 'bg-orange-50 text-orange-600 border-orange-200';
    default: return 'bg-slate-50 text-slate-600 border-slate-200';
  }
}
