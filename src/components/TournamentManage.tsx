import React, { useState, useEffect } from 'react';
import { useTournament } from '../context/TournamentContext';
import { 
  Trophy, 
  Settings, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Calendar, 
  Clock, 
  HelpCircle,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Users,
  Award,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { Tournament, TournamentFormat } from '../types';

export default function TournamentManage() {
  const { 
    tournaments, 
    activeTournamentId, 
    setActiveTournamentId, 
    updateTournament, 
    deleteTournament,
    teams,
    matches
  } = useTournament();

  const [selectedId, setSelectedId] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string>('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Form states matching TournamentCreation.tsx
  const [name, setName] = useState('');
  const [format, setFormat] = useState<TournamentFormat>('GROUP_KNOCKOUT');
  const [numberOfTeams, setNumberOfTeams] = useState<number>(8);
  const [groupSize, setGroupSize] = useState<number>(4);
  const [advancePerGroup, setAdvancePerGroup] = useState<number>(2);
  const [pointsPerVictory, setPointsPerVictory] = useState<number>(3);
  const [setsToWin, setSetsToWin] = useState<2 | 3>(2);
  const [pointsPerSet, setPointsPerSet] = useState<number>(21);
  const [decidingSetPoints, setDecidingSetPoints] = useState<number>(15);
  const [specialFinalsRuleEnabled, setSpecialFinalsRuleEnabled] = useState<boolean>(false);
  const [specialFinalsPoints, setSpecialFinalsPoints] = useState<number>(21);
  const [specialFinalsDecidingPoints, setSpecialFinalsDecidingPoints] = useState<number>(15);

  // RR bottom knockout transitions
  const [hasSemis, setHasSemis] = useState<boolean>(true);
  const [semisPairingType, setSemisPairingType] = useState<'1v2_3v4' | '1v4_2v3'>('1v4_2v3');

  // Scheduling states
  const [startDate, setStartDate] = useState<string>('2026-05-24');
  const [endDate, setEndDate] = useState<string>('2026-05-31');
  const [playingDays, setPlayingDays] = useState<string[]>([]);
  const [playingHoursStart, setPlayingHoursStart] = useState<string>('08:00');
  const [playingHoursEnd, setPlayingHoursEnd] = useState<string>('18:00');
  const [optimizeSchedule, setOptimizeSchedule] = useState<boolean>(true);
  const [matchDuration, setMatchDuration] = useState<number>(60);
  const [courtsCount, setCourtsCount] = useState<number>(3);
  const [matchType, setMatchType] = useState<'SINGLES' | 'DOUBLES'>('DOUBLES');
  const [courtNamesArray, setCourtNamesArray] = useState<string[]>(['', '', '']);
  const [courtNumbersArray, setCourtNumbersArray] = useState<string[]>(['Sân 1', 'Sân 2', 'Sân 3']);
  const [numGroups, setNumGroups] = useState<number>(2);
  const [status, setStatus] = useState<Tournament['status']>('PLANNING');

  const selectedTourney = tournaments.find(t => t.id === selectedId);

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

  // Sync selectedId with activeTournamentId initially
  useEffect(() => {
    if (activeTournamentId) {
      setSelectedId(activeTournamentId);
      setExpandedId(activeTournamentId);
    } else if (tournaments.length > 0) {
      setSelectedId(tournaments[0].id);
      setExpandedId(tournaments[0].id);
    }
  }, [activeTournamentId]);

  // Load tournament data into inputs when selected ID changes or switches
  useEffect(() => {
    if (selectedTourney) {
      setName(selectedTourney.name);
      setFormat(selectedTourney.format);
      setNumberOfTeams(selectedTourney.numberOfTeams);
      setGroupSize(selectedTourney.groupSize || Math.ceil(selectedTourney.numberOfTeams / 2));
      setAdvancePerGroup(selectedTourney.advancePerGroup || 2);
      setPointsPerVictory(selectedTourney.pointsPerVictory || 3);
      setSetsToWin(selectedTourney.setsToWin === 3 ? 3 : 2);
      setPointsPerSet(selectedTourney.pointsPerSet || 21);
      setDecidingSetPoints(selectedTourney.decidingSetPoints || 15);
      setSpecialFinalsRuleEnabled(!!selectedTourney.specialFinalsRuleEnabled);
      setSpecialFinalsPoints(selectedTourney.specialFinalsPoints || 21);
      setSpecialFinalsDecidingPoints(selectedTourney.specialFinalsDecidingPoints || 15);
      setHasSemis(selectedTourney.hasSemis !== false);
      setSemisPairingType(selectedTourney.semisPairingType || '1v4_2v3');
      setStartDate(selectedTourney.startDate || '2026-05-24');
      setEndDate(selectedTourney.endDate || '2026-05-31');
      setPlayingDays(selectedTourney.playingDays || []);
      setOptimizeSchedule(selectedTourney.optimizeSchedule !== false);
      setPlayingHoursStart(selectedTourney.playingHoursStart || '08:00');
      setPlayingHoursEnd(selectedTourney.playingHoursEnd || '18:00');
      setMatchDuration(selectedTourney.matchDuration || 60);
      setCourtsCount(selectedTourney.courtsCount || 3);
      setMatchType(selectedTourney.matchType || 'DOUBLES');
      const existingCourtNames = selectedTourney.courtNames || [];
      const existingCourtNumbers = selectedTourney.courtNumbers || [];
      const currentCourtsLength = selectedTourney.courtsCount || 3;
      setCourtNamesArray(Array.from({ length: currentCourtsLength }).map((_, i) => existingCourtNames[i] || ''));
      setCourtNumbersArray(Array.from({ length: currentCourtsLength }).map((_, i) => existingCourtNumbers[i] || `Sân ${i + 1}`));
      setNumGroups(selectedTourney.numGroups || 2);
      setStatus(selectedTourney.status || 'PLANNING');
    }
  }, [selectedId, tournaments]);

  // Synchronous sync helper for playing days when manually changing date range
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    adjustPlayingDays(newStart, endDate, playingDays);
  };

  const handleEndDateChange = (newEnd: string) => {
    setEndDate(newEnd);
    adjustPlayingDays(startDate, newEnd, playingDays);
  };

  const adjustPlayingDays = (startStr: string, endStr: string, currentDays: string[]) => {
    if (!startStr || !endStr) return;
    const [sy, sm, sd] = startStr.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);

    const [ey, em, ed] = endStr.split('-').map(Number);
    const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
      // Keep only playing days that fall within the new start and end range
      const validPlayingDays = currentDays.filter(d => d >= startStr && d <= endStr);
      
      // If we filtered out of-bounds dates, update the state,
      // or if there are no valid days left, select all days in the new range
      if (validPlayingDays.length === 0) {
        const dates: string[] = [];
        const current = new Date(sy, sm - 1, sd, 12, 0, 0, 0);
        const loopEnd = new Date(ey, em - 1, ed, 12, 0, 0, 0);
        let safety = 0;
        while (current <= loopEnd && safety < 100) {
          safety++;
          const monthStr = String(current.getMonth() + 1).padStart(2, '0');
          const dayStr = String(current.getDate()).padStart(2, '0');
          dates.push(`${current.getFullYear()}-${monthStr}-${dayStr}`);
          current.setDate(current.getDate() + 1);
        }
        setPlayingDays(dates);
      } else if (validPlayingDays.length !== currentDays.length) {
        setPlayingDays(validPlayingDays);
      }
    }
  };

  // Secondary sync adjustments when pointsPerSet changes (matching TournamentCreation presets)
  useEffect(() => {
    if (pointsPerSet === 15) {
      setDecidingSetPoints(11);
      setSpecialFinalsRuleEnabled(true);
    } else if (pointsPerSet === 21) {
      setDecidingSetPoints(15);
      setSpecialFinalsRuleEnabled(false);
    }
  }, [pointsPerSet]);

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
      const translation = dayMapTranslations[dayNum] || { full: 'Ngày', short: 'N', en: 'Day' };
      
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

  const getEstimatedMatchesCount = () => {
    if (format === 'ROUND_ROBIN') {
      const rrMatches = (numberOfTeams * (numberOfTeams - 1)) / 2;
      const koMatches = hasSemis ? 4 : 2;
      return rrMatches + koMatches;
    } else if (format === 'KNOCKOUT') {
      return numberOfTeams;
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

  // Automatically adjust recommended match duration when scoring rules change in edit mode too
  useEffect(() => {
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

  const getAvailableSlotsCount = (): number => {
    if (!startDate || !endDate) return 0;
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

    const dayMapStr: Record<string, number> = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0
    };

    const allowedDayNums = playingDays.map(d => dayMapStr[d]).filter(n => n !== undefined);

    const [sh, sm] = playingHoursStart.split(':').map(Number);
    const [eh, em] = playingHoursEnd.split(':').map(Number);
    const hourLimit = isNaN(sh) ? 8 : sh;
    const minLimit = isNaN(sm) ? 0 : sm;
    const limitEndHour = isNaN(eh) ? 18 : eh;
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

  const availableSlots = getPlayingDaysOptions().length > 0 ? getAvailableSlotsCount() : 0;
  const estimatedMatches = getEstimatedMatchesCount();
  const isSufficient = availableSlots >= estimatedMatches;

  // Real-time slot calculation hour display
  const [shVal, smVal] = playingHoursStart.split(':').map(Number);
  const [ehVal, emVal] = playingHoursEnd.split(':').map(Number);
  const diffMinVal = (ehVal * 60 + emVal) - (shVal * 60 + smVal);
  const hoursPerDayVal = Math.max(0, Number((diffMinVal / 60).toFixed(1)));

  // Determine current timeline status based on dates
  const getTournamentStatusInfo = (t: Tournament) => {
    const todayStr = '2026-05-25'; // From metadata rules
    const today = new Date(todayStr);
    const start = t.startDate ? new Date(t.startDate) : null;
    const end = t.endDate ? new Date(t.endDate) : null;

    let period: 'ONGOING' | 'UPCOMING' | 'PAST' | 'DEACTIVE' = 'UPCOMING';
    let label = 'Sắp Diễn Ra';
    let colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
    let dotColor = 'bg-blue-500';

    if (t.status === 'DEACTIVE') {
      period = 'DEACTIVE';
      label = 'Vô Hiệu Hóa';
      colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
    } else if (start && end) {
      if (today >= start && today <= end) {
        period = 'ONGOING';
        label = 'Đang Diễn Ra';
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotColor = 'bg-emerald-500';
      } else if (today > end) {
        period = 'PAST';
        label = 'Đã Kết Thúc';
        colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
        dotColor = 'bg-slate-400';
      } else {
        period = 'UPCOMING';
        label = 'Sắp Diễn Ra';
        colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
        dotColor = 'bg-blue-500';
      }
    } else {
      if (t.status === 'FINISHED') {
        period = 'PAST';
        label = 'Đã Kết Thúc';
        colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
        dotColor = 'bg-slate-400';
      } else if (t.status === 'ACTIVE') {
        period = 'ONGOING';
        label = 'Đang Diễn Ra';
        colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        dotColor = 'bg-emerald-500';
      } else {
        period = 'UPCOMING';
        label = 'Sắp Diễn Ra';
        colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
        dotColor = 'bg-blue-500';
      }
    }

    return { period, label, colorClass, dotColor };
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    const currentTourneyObj = tournaments.find(t => t.id === selectedId);
    if (currentTourneyObj?.status === 'FINISHED') {
      window.alert("⚠️ Giải đấu đã kết thúc, không thể thay đổi thông số cấu hình!");
      return;
    }

    // Check if tournament has started based on system local date
    const getTodayString = () => {
      const d = new Date();
      const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
      const localDate = new Date(utc + (3600000 * 7)); // Vietnam GMT+7
      const yyyy = localDate.getFullYear();
      const mm = String(localDate.getMonth() + 1).padStart(2, '0');
      const dd = String(localDate.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    if (status !== 'DEACTIVE' && currentTourneyObj?.status !== 'DEACTIVE' && currentTourneyObj?.startDate && getTodayString() >= currentTourneyObj.startDate) {
      window.alert("⚠️ Giải đấu đã bắt đầu nên không thể thay đổi vào lúc này.");
      return;
    }

    if (!name.trim()) {
      setAlert({ type: 'error', msg: 'Tên giải đấu không được bỏ trống!' });
      return;
    }

    // Auto-populate team ids if not enough are chosen
    const finalTeamIds = teams.length >= numberOfTeams
      ? teams.slice(0, numberOfTeams).map(t => t.id)
      : teams.map(t => t.id);

    // Prepare updates
    const updates: Partial<Tournament> = {
      name,
      format,
      numberOfTeams,
      groupSize,
      advancePerGroup,
      pointsPerVictory,
      setsToWin,
      pointsPerSet,
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
      courtNumbers: courtNumbersArray.map((num, idx) => num.trim() || `Sân ${idx + 1}`),
      teamIds: finalTeamIds,
      status
    };

    updateTournament(selectedId, updates);
    setAlert({ type: 'success', msg: `Đã lưu cập nhật cấu hình cho giải "${name}" thành công!` });
    setTimeout(() => {
      setAlert(null);
      // Keep selected or collapse accordion
      setExpandedId('');
    }, 2000);
  };

  const handleDeleteById = (id: string, nameToDelete: string) => {
    const tourneyObj = tournaments.find(t => t.id === id);
    if (!tourneyObj) return;

    if (tourneyObj.status === 'DEACTIVE') {
      if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn giải đấu đã vô hiệu hóa "${nameToDelete}" không?`)) {
        deleteTournament(id);
        setAlert({ type: 'success', msg: `Giải đấu "${nameToDelete}" đã được xóa khỏi hệ thống.` });
        if (selectedId === id) {
          setSelectedId('');
          setExpandedId('');
        }
        setTimeout(() => setAlert(null), 3500);
      }
      return;
    }

    if (tourneyObj.status === 'FINISHED') {
      window.alert("⚠️ Giải đấu đã kết thúc, không thể xóa!");
      return;
    }

    // Check if tournament has been drawn or has matches
    const hasBeenDrawn = tourneyObj.status === 'DRAW_DONE' || tourneyObj.status === 'ACTIVE' || tourneyObj.status === 'FINISHED' || matches.some(m => m.tournamentId === id);

    if (hasBeenDrawn) {
      window.alert(`Giải đấu "${nameToDelete}" đã được bốc thăm lịch thi đấu nên không thể xóa.`);
      return;
    }

    if (confirm(`Giải đấu "${nameToDelete}" chưa được bốc thăm lịch đấu. Bạn có chắc chắn muốn xóa không?`)) {
      deleteTournament(id);
      setAlert({ type: 'success', msg: `Giải đấu "${nameToDelete}" đã được xóa khỏi hệ thống.` });
      
      if (selectedId === id) {
        setSelectedId('');
        setExpandedId('');
      }
      setTimeout(() => setAlert(null), 3500);
    }
  };

  // Sort tournaments dynamically: Ongoing (1) -> Upcoming (2) -> Finished (3) -> Deactive (4). Deep sub-sorting by startDate descending
  const sortedTournaments = [...tournaments].sort((a, b) => {
    const infoA = getTournamentStatusInfo(a);
    const infoB = getTournamentStatusInfo(b);

    const score = { ONGOING: 1, UPCOMING: 2, PAST: 3, DEACTIVE: 4 };
    const diff = score[infoA.period] - score[infoB.period];
    if (diff !== 0) return diff;

    // Secondary sorting: by start date (descending)
    const dateA = a.startDate || '';
    const dateB = b.startDate || '';
    return dateB.localeCompare(dateA);
  });

  if (tournaments.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 max-w-3xl mx-auto">
        <Trophy className="h-12 w-12 text-slate-350 mx-auto animate-bounce duration-1000" />
        <h3 className="font-extrabold text-slate-800 text-base uppercase">Không Tìm Thấy Giải Đấu</h3>
        <p className="text-slate-500 text-xs">Hãy chuyển sang tab "Tạo Giải Đấu" để khởi tạo giải đấu đầu tiên.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6 text-left">
      {/* Header view title */}
      <div className="space-y-1 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <Settings className="h-6.5 w-6.5 text-blue-600" />
          Điều Chỉnh & Quản Lý Giải Đấu
        </h1>
        <p className="text-slate-500 text-xs md:text-sm">
          Xem danh sách và tùy biến toàn diện thể thức, quy mô, lịch trình, và thiết lập điểm số tính set của các giải đấu đang vận hành.
        </p>
      </div>

      {alert && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-xs md:text-sm font-semibold border animate-in slide-in-from-top-2 duration-155 shadow-3xs ${
          alert.type === 'success' 
            ? 'bg-blue-50 text-blue-700 border-blue-105' 
            : 'bg-rose-50 text-rose-600 border-rose-105'
        }`}>
          {alert.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 shrink-0" /> : <AlertCircle className="h-4.5 w-4.5 shrink-0" />}
          {alert.msg}
        </div>
      )}

      {/* DETAILED TOURNAMENTS ACCORDION LIST */}
      <div className="space-y-4 font-sans text-left">
        <div className="text-xs font-bold text-slate-450 uppercase tracking-widest pl-1 font-mono">
          Danh sách giải đấu ({tournaments.length}) — Ưu tiên Sắp xếp giải đấu đang diễn ra lên đầu:
        </div>

        {sortedTournaments.map((t) => {
          const statusInfo = getTournamentStatusInfo(t);
          const isExpanded = expandedId === t.id;
          
          return (
            <div 
              key={t.id} 
              id={`tourney-accordion-${t.id}`}
              className={`border rounded-2xl transition-all duration-150 overflow-hidden bg-white ${
                isExpanded 
                  ? 'border-blue-400 shadow-md ring-2 ring-blue-50' 
                  : 'border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* ACCORDION BAR HEADER */}
              <div 
                className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none transition-colors ${
                  isExpanded ? 'bg-blue-50/20 border-b border-slate-100' : 'hover:bg-slate-50'
                }`}
                onClick={() => {
                  if (isExpanded) {
                    setExpandedId('');
                  } else {
                    setExpandedId(t.id);
                    setSelectedId(t.id);
                    setActiveTournamentId(t.id);
                  }
                }}
              >
                {/* Visual indicator & Meta details */}
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl text-white block shrink-0 ${
                    statusInfo.period === 'ONGOING' 
                      ? 'bg-emerald-600 shadow-sm' 
                      : statusInfo.period === 'UPCOMING' 
                        ? 'bg-blue-600 shadow-sm' 
                        : 'bg-slate-500'
                  }`}>
                    {t.format === 'GROUP_KNOCKOUT' ? (
                      <Award className="h-5 w-5" />
                    ) : t.format === 'ROUND_ROBIN' ? (
                      <Trophy className="h-5 w-5" />
                    ) : (
                      <Settings className="h-5 w-5" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold text-slate-800 text-sm md:text-base leading-snug">
                        {t.name}
                      </span>
                      {/* Active tag inside */}
                      {activeTournamentId === t.id && (
                        <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-3xs uppercase tracking-wider shrink-0">
                          ĐANG CHỌN
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-550 font-medium">
                      <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md text-slate-655 font-bold text-[10.5px]">
                        {t.format === 'GROUP_KNOCKOUT' 
                          ? 'Chia Bảng + Vòng Loại' 
                          : t.format === 'ROUND_ROBIN' 
                            ? 'Vòng tròn một lượt' 
                            : 'Đấu loại trực tiếp'}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <strong>{t.numberOfTeams}</strong> đội ({t.matchType === 'SINGLES' ? 'Đấu Đơn' : 'Đánh Đôi'})
                      </span>

                      {t.startDate && t.endDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {t.startDate.split('-').reverse().slice(0, 2).join('/')} &rarr; {t.endDate.split('-').reverse().slice(0, 2).join('/')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Area: Buttons & Status */}
                <div className="flex items-center justify-between md:justify-end gap-3.5 border-t border-slate-50 pt-2 md:pt-0 md:border-0 shrink-0">
                  {/* Status Badge */}
                  <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 select-none ${statusInfo.colorClass}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dotColor} ${statusInfo.period === 'ONGOING' ? 'animate-pulse' : ''}`} />
                    {statusInfo.label}
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Delete Quick Utility */}
                    <button
                      type="button"
                      onClick={() => handleDeleteById(t.id, t.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100 cursor-pointer"
                      title="Xóa giải đấu"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>

                    {/* Expand/Collapse arrow */}
                    <button
                      type="button"
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedId('');
                        } else {
                          setExpandedId(t.id);
                          setSelectedId(t.id);
                          setActiveTournamentId(t.id);
                        }
                      }}
                      className="px-2.5 py-1.5 text-xs text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-50 font-bold rounded-lg transition-all border border-blue-100 flex items-center gap-1 cursor-pointer select-none"
                    >
                      {isExpanded ? (
                        <>Ẩn bớt <ChevronUp className="h-3.5 w-3.5" /></>
                      ) : (
                        <>Sửa / Xem chi tiết <ChevronDown className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD DETAILS EDIT FORM PANEL (Only if expanded) */}
              {isExpanded && selectedTourney && (
                <div className="p-4 md:p-6 bg-slate-50/30 border-t border-slate-100 space-y-6">
                  
                  {selectedTourney.status === 'FINISHED' && (
                    <div className="bg-amber-55 border-2 border-amber-200 text-amber-950 rounded-2xl p-4 flex items-start gap-3 shadow-sm mb-1 animate-pulse">
                      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-left space-y-1">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800">GIẢI ĐẤU ĐÃ KẾT THÚC (CHỈ XEM)</h5>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          Giải đấu này đã hoàn tất và kết thúc hoàn toàn. Tính năng điều chỉnh cấu hình và quản lý thông số giải đấu đã bị khóa. Bạn chỉ có thể xem các thông tin chi tiết.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/60 text-xs text-blue-800 leading-relaxed font-sans mb-1 flex gap-2">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      <strong>Điều chỉnh cấu hình:</strong> Toàn bộ các mốc thay đổi dưới đây sẽ tự động viết đè vào thông số giải đấu <strong>"{name}"</strong>. Khi lưu lại, hệ thống có thể bốc thăm lại danh sách hạt giống nếu bạn cập nhật số lượng đội hoặc thể thức.
                    </p>
                  </div>

                  <form onSubmit={handleSave} className="space-y-6 text-left">
                    <fieldset disabled={t.status === 'FINISHED'} className="space-y-6">
                    
                    {/* Cấu hình 1: Tên & Thể thức (Basic Configs) */}
                    <div className="space-y-4">
                      
                      {/* Name input */}
                      <div className="space-y-1.5">
                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Tên Giải Đấu <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-white text-slate-850 border border-slate-250 rounded-xl px-4 py-2 text-xs font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-3xs"
                          placeholder="Tên giải đấu cầu lông"
                        />
                      </div>

                      {/* Dropdown selectors */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Hình thức thi đấu</label>
                          <select
                            value={matchType}
                            onChange={(e) => setMatchType(e.target.value as 'SINGLES' | 'DOUBLES')}
                            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition shadow-3xs cursor-pointer"
                          >
                            <option value="SINGLES">Đánh Đơn (1 VĐV / đội)</option>
                            <option value="DOUBLES">Đánh Đôi (2 VĐV / đội)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Thể Thức Thi Đấu</label>
                          <select
                            value={format}
                            onChange={(e) => {
                              const newFormat = e.target.value as TournamentFormat;
                              setFormat(newFormat);
                              if (newFormat !== 'GROUP_KNOCKOUT') {
                                setNumGroups(2);
                              }
                            }}
                            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-805 focus:outline-none focus:border-blue-500 transition shadow-3xs cursor-pointer"
                          >
                            <option value="GROUP_KNOCKOUT">Chia bảng + Vòng loại (Group KO)</option>
                            <option value="ROUND_ROBIN">Vòng tròn tính điểm (Round Robin)</option>
                            <option value="KNOCKOUT">Đấu loại trực tiếp (Knockout Bracket)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Tổng số Đội tham gia</label>
                          <select
                            value={numberOfTeams}
                            onChange={(e) => setNumberOfTeams(Number(e.target.value))}
                            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-extrabold text-blue-700 focus:outline-none focus:border-blue-500 transition shadow-3xs cursor-pointer"
                          >
                            {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((num) => (
                              <option key={num} value={num}>
                                {num} Đội {num === 8 ? '(Tiêu chuẩn)' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Trạng Thái Giải Đấu / Hoạt Động</label>
                          <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Tournament['status'])}
                            className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500 transition shadow-3xs cursor-pointer"
                          >
                            <option value="ACTIVE">Kích hoạt bình thường (Active)</option>
                            <option value="PLANNING">Chuẩn bị giải bốc thăm (Planning)</option>
                            <option value="DRAW_DONE">Đã bốc thăm (Draw Done)</option>
                            <option value="FINISHED">Đã hoàn thành (Finished)</option>
                            <option value="DEACTIVE">Vô hiệu hóa tạm thời (Deactive)</option>
                          </select>
                        </div>

                        {/* If Round Robin points */}
                        {format !== 'KNOCKOUT' && (
                          <div className="space-y-1.5">
                            <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Điểm Mỗi Trận Thắng</label>
                            <input
                              type="number"
                              min={1}
                              max={5}
                              value={pointsPerVictory}
                              onChange={(e) => setPointsPerVictory(Number(e.target.value))}
                              className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 transition shadow-3xs"
                            />
                          </div>
                        )}

                        {format === 'GROUP_KNOCKOUT' && (
                          <>
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide text-blue-700">Quy Mô Mỗi Bảng</label>
                              <div className="w-full bg-blue-50/50 border border-blue-100 text-blue-800 rounded-xl px-3 py-2 text-xs font-bold flex items-center justify-between shadow-3xs">
                                <span>{getGroupDivisionInfo()}</span>
                                <span className="bg-blue-600 text-white text-[8px] font-bold px-1.5 rounded tracking-wide shrink-0">TỰ ĐỘNG</span>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide text-indigo-700 font-sans">Số Đội Đi Tiếp Mỗi Bảng</label>
                              <select
                                value={advancePerGroup}
                                onChange={(e) => setAdvancePerGroup(Number(e.target.value))}
                                className="w-full bg-white border border-slate-250 rounded-xl px-3 py-2 text-xs font-bold text-indigo-750 focus:outline-none focus:border-blue-500 transition shadow-3xs cursor-pointer"
                              >
                                <option value={1}>Lấy 1 Đội đứng nhất bảng</option>
                                <option value={2}>Lấy 2 Đội (Nhất & Nhì bảng)</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>

                    </div>

                    {/* Round Robin bottom bracket configuration */}
                    {format === 'ROUND_ROBIN' && (
                      <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 col-span-1 text-left space-y-4">
                        <div className="bg-indigo-50 border border-indigo-200/60 p-3.5 rounded-xl text-slate-700 text-xs space-y-2 select-none">
                          <span className="font-extrabold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wide">💡 GIẢI THÍCH THỂ THỨC VÒNG TRÒN (ROUND ROBIN):</span>
                          <p className="leading-relaxed">
                            • <strong>Có Bán Kết (Mặc định)</strong>: Sau khi kết thúc vòng tròn, Top 4 đội cao nhất đấu Bán kết loại trực tiếp chéo. Đội thắng đá Chung kết, đội thua Tranh giải 3.
                          </p>
                          <p className="leading-relaxed">
                            • <strong>Không Bán Kết</strong>: Không đấu bán kết. <strong>Top 1 gặp Top 2</strong> đá Chung kết trực tiếp để tránh thêm quá nhiều vòng đấu vất vả, <strong>Top 3 gặp Top 4</strong> đá Tranh hạng 3 trực tiếp.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Vòng Tiếp Nối (Top 4)</label>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none py-1">
                              <input
                                type="checkbox"
                                checked={hasSemis}
                                onChange={(e) => setHasSemis(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-white border-slate-300"
                              />
                              Thiết lập trận Bán kết & Chung Kết
                            </label>
                            <p className="text-slate-400 text-[10px]">Lấy 4 đội đứng đầu BXH tiếp nối vào đấu chéo loại trực tiếp.</p>
                          </div>

                          {hasSemis && (
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide text-slate-600">Ghép Cặp Trận Đấu Bán Kết</label>
                              <select
                                value={semisPairingType}
                                onChange={(e) => setSemisPairingType(e.target.value as '1v2_3v4' | '1v4_2v3')}
                                className="w-full bg-white border border-slate-205 text-slate-800 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-blue-600"
                              >
                                <option value="1v4_2v3">Hạng 1 gặp Hạng 4, Hạng 2 gặp Hạng 3 (Theo cặp chéo tiêu chuẩn)</option>
                                <option value="1v2_3v4">Hạng 1 gặp Hạng 2, Hạng 3 gặp Hạng 4</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Group Knockout bracket configuration */}
                    {format === 'GROUP_KNOCKOUT' && (
                      <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 col-span-1 text-left space-y-4">
                        <div className="bg-indigo-50 border border-indigo-200/60 p-3.5 rounded-xl text-slate-700 text-xs space-y-2 select-none">
                          <span className="font-extrabold text-indigo-700 flex items-center gap-1.5 uppercase tracking-wide">💡 GIẢI THÍCH THỂ THỨC CHIA BẢNG (GROUP KNOCKOUT):</span>
                          <p className="leading-relaxed">
                            • <strong>Có Bán Kết (Mặc định)</strong>: Sau khi kết thúc vòng đấu bảng, Top 2 đội nhất & nhì của mỗi bảng lọt vào vòng Bán kết.
                          </p>
                          <p className="leading-relaxed">
                            • <strong>Không Bán Kết</strong>: Không đấu bán kết rời rạc. <strong>Nhất Bảng A gặp Nhất Bảng B</strong> trực tiếp đá Chung kết, <strong>Nhì Bảng A gặp Nhì Bảng B</strong> trực tiếp đá Tranh Hạng 3.
                          </p>
                          <p className="leading-relaxed text-slate-500 font-medium">
                            • <em>*Lưu ý</em>: Thiết lập này áp dụng cho 2 bảng đấu (A & B). Từ 3 bảng hoặc nhiều hơn 8 đội, hệ thống tự động bốc/chia nhánh knockout chuẩn.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Vòng Tiếp Nối (Bán Kết & Chung Kết)</label>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none py-1">
                              <input
                                type="checkbox"
                                checked={hasSemis}
                                onChange={(e) => setHasSemis(e.target.checked)}
                                className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 bg-white border-slate-300"
                              />
                              Có tổ chức vòng Bán kết
                            </label>
                            <p className="text-slate-400 text-[10px]">Lấy các đội đứng đầu mỗi bảng lọt vào tranh tài trực tiếp.</p>
                          </div>

                          {hasSemis && (
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide text-slate-600">Ghép Cặp Trận Đấu Bán Kết</label>
                              <select
                                value={semisPairingType}
                                onChange={(e) => setSemisPairingType(e.target.value as '1v2_3v4' | '1v4_2v3')}
                                className="w-full bg-white border border-slate-205 text-slate-800 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-blue-600"
                              >
                                <option value="1v4_2v3">Nhất Bảng A gặp Nhì Bảng B & Nhất Bảng B gặp Nhì Bảng A (Crossover tiêu chuẩn BWF)</option>
                                <option value="1v2_3v4">Nhất Bảng A gặp Nhất Bảng B & Nhì Bảng A gặp Nhì Bảng B (Song song đồng hạng)</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cấu hình 2: LUẬT THI ĐẤU & ĐIỂM SỐ PHÂN SET (MATCHING TOURNAMENT CREATION PREMIUM DESIGN) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 space-y-4 shadow-sm text-left">
                      <div className="flex items-center gap-2 text-blue-600 font-sans font-semibold text-sm border-b border-slate-100 pb-2.5">
                        <Sparkles className="h-4.5 w-4.5" />
                        Luật Thi Đấu & Điểm Số Phân Set
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 text-left">
                          <label className="block text-slate-750 text-xs font-bold">Thể Thức Thắng Set (Best of)</label>
                          <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-4 mt-1.5">
                            <label className="flex items-center gap-1.5 text-slate-655 text-xs font-medium cursor-pointer select-none">
                              <input
                                type="radio"
                                name={`sets_best_edit_${t.id}`}
                                checked={setsToWin === 2}
                                onChange={() => setSetsToWin(2)}
                                className="accent-blue-600 h-4 w-4"
                              />
                              Best of 3 (Thắng 2 set)
                            </label>
                            <label className="flex items-center gap-1.5 text-slate-655 text-xs font-medium cursor-pointer select-none">
                              <input
                                type="radio"
                                name={`sets_best_edit_${t.id}`}
                                checked={setsToWin === 3}
                                onChange={() => setSetsToWin(3)}
                                className="accent-blue-600 h-4 w-4"
                              />
                              Best of 5 (Thắng 3 set)
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="block text-slate-750 text-xs font-bold">Giới Hạn Điểm Mỗi Set</label>
                          <select
                            value={pointsPerSet}
                            onChange={(e) => setPointsPerSet(Number(e.target.value))}
                            className="w-full bg-white border border-slate-250 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 font-bold focus:outline-none focus:border-blue-600 shadow-3xs"
                          >
                            <option value={21}>21 Điểm (Tiêu chuẩn BWF)</option>
                            <option value={15}>15 Điểm (Thi đấu nhanh)</option>
                            <option value={11}>11 Điểm (Rút ngắn)</option>
                          </select>
                        </div>
                      </div>

                      {/* Tie-break points customization option */}
                      <div className="pt-3.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="space-y-2">
                          <label className="block text-slate-750 text-xs font-bold">Điểm Set Quyết Định (Tie-break)</label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              min={5}
                              max={30}
                              value={decidingSetPoints}
                              onChange={(e) => setDecidingSetPoints(Number(e.target.value))}
                              className="w-24 bg-white border border-slate-250 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 shadow-3xs font-mono font-bold text-center"
                            />
                            <span className="text-slate-400 text-xs">điểm</span>
                            <div className="flex gap-1 ml-2">
                              {['21', '15', '11'].map((pts) => (
                                <button
                                  key={pts}
                                  type="button"
                                  onClick={() => setDecidingSetPoints(Number(pts))}
                                  className={`px-2 py-1 rounded text-[10px] font-bold transition border cursor-pointer select-none ${
                                    decidingSetPoints === Number(pts) 
                                      ? 'bg-blue-50 text-blue-600 border-blue-200' 
                                      : 'bg-white text-slate-500 hover:bg-slate-5 font-medium border-slate-200'
                                  }`}
                                >
                                  {pts}đ
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-slate-400 text-[10px] leading-tight">
                            Áp dụng cho set cuối phân thắng bại ({setsToWin === 2 ? 'Set 3' : 'Set 5'}) khi hai bên hòa tỷ số set.
                          </p>
                        </div>

                        <div className="space-y-1 bg-blue-50/40 p-3 rounded-xl border border-blue-100 flex flex-col justify-center">
                          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider font-mono">CHẾ ĐỘ PHÂN SET CHÊN LỆCH:</span>
                          <p className="text-slate-600 text-[10px] leading-relaxed">
                            Khi thi đấu chạm set 결정, điểm số trần được tự động giới hạn ở mức <strong className="text-blue-600 font-bold">{decidingSetPoints} điểm</strong> giúp đấu thủ tránh kiệt quệ thể lực.
                          </p>
                        </div>
                      </div>

                      {/* Advanced overrides for Finals / 3rd-Place match */}
                      <div className="pt-3.5 border-t border-slate-100 text-left">
                        <div className="bg-white rounded-xl p-3 border border-slate-205 space-y-3.5 shadow-3xs">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={specialFinalsRuleEnabled}
                              onChange={(e) => setSpecialFinalsRuleEnabled(e.target.checked)}
                              className="accent-blue-600 h-4.5 w-4.5 mt-0.5"
                            />
                            <div className="text-left">
                              <span className="text-slate-800 text-xs font-bold block">
                                Áp dụng Luật Phân Điểm Riêng cho Chung Kết & Tranh Hạng 3
                              </span>
                              <span className="text-slate-450 text-[10px] leading-tight block">
                                Cấu hình luật đặc biệt cho các cuộc tranh tài tranh vàng/đồng (ví dụ: vòng ngoài chơi nhanh 15đ, chung kết chơi đủ 21đ chính thức).
                              </span>
                            </div>
                          </label>

                          {specialFinalsRuleEnabled && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 pt-1 border-l-2 border-l-blue-400 text-left animate-in slide-in-from-left-2 duration-150">
                              <div className="space-y-1.5">
                                <span className="block text-slate-705 text-[10px] font-bold uppercase">Điểm set chính:</span>
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="number"
                                    min={10}
                                    max={30}
                                    value={specialFinalsPoints}
                                    onChange={(e) => setSpecialFinalsPoints(Number(e.target.value))}
                                    className="w-20 bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2 py-1 font-bold text-center"
                                  />
                                  <span className="text-slate-400 text-xs">điểm</span>
                                  <button
                                    type="button"
                                    onClick={() => setSpecialFinalsPoints(21)}
                                    className="text-[10px] text-blue-650 hover:underline font-bold"
                                  >
                                    Mặc định 21đ
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <span className="block text-slate-705 text-[10px] font-bold uppercase">Set Tie-break quyết định:</span>
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="number"
                                    min={5}
                                    max={30}
                                    value={specialFinalsDecidingPoints}
                                    onChange={(e) => setSpecialFinalsDecidingPoints(Number(e.target.value))}
                                    className="w-20 bg-white border border-slate-205 text-slate-800 text-xs rounded-lg px-2 py-1 font-bold text-center"
                                  />
                                  <span className="text-slate-400 text-xs">điểm</span>
                                  <button
                                    type="button"
                                    onClick={() => setSpecialFinalsDecidingPoints(15)}
                                    className="text-[10px] text-blue-650 hover:underline font-bold"
                                  >
                                    Mặc định 15đ
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Recommendations block consistent with Creation page styling */}
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-2 text-left">
                        <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                          <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                          GỢI Ý THỜI LƯỢNG TIÊU CHUẨN TỪ LUẬT CHƠI
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/85">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Mỗi set đấu chính ({pointsPerSet}đ):</span>
                            <span className="text-xs font-bold text-slate-800 font-mono">~{recommendedDetails.estStandardSetMin} phút / set</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/85">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Set quyết định ({decidingSetPoints}đ):</span>
                            <span className="text-xs font-bold text-slate-800 font-mono">~{recommendedDetails.estDecidingSetMin} phút / set</span>
                          </div>
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200/85">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase tracking-wider">Tổng trận tối đa (Bo{setsToWin === 2 ? 3 : 5}):</span>
                            <span className="text-xs font-black text-blue-700 font-mono">~{recommendedDetails.maxDurationCalculated} phút / trận</span>
                          </div>
                        </div>

                        <p className="text-slate-500 text-[10px] leading-relaxed pt-1.5">
                          💡 <strong>Phân Tích & Dự Dự Kiến:</strong> Thời lượng thi đấu tối đa khoảng <strong>{recommendedDetails.maxDurationCalculated} phút/trận</strong>. <strong className="text-emerald-600">Hệ thống đã tự động đề xuất phân bổ khung {recommendedDetails.recommendedMatchDuration} phút</strong> cho lịch trình vận hành bên dưới để luôn có dư thời gian chuẩn bị & chống trễ giờ!
                        </p>
                      </div>

                      <div className="text-slate-500 text-[10.5px] leading-snug flex gap-1.5 border-t border-slate-100 pt-3">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-blue-500 mt-0.5" />
                        Luật đấu cầu lông liên đoàn vô địch thế giới (BWF) kéo dài tính điểm Deuce mở rộng: Tỷ số tới 20-20 sẽ đấu thắng cách biệt 2 điểm, mốc trần giới hạn tuyện đối là 30 điểm (bên nào chạm 30 trước thắng hiệp đấu).
                      </div>
                    </div>

                    {/* Cấu hình 3: CẤU HÌNH LỊCH TRÌNH VÀ TỔNG SỐ TRẬN ĐẤU DỰ KIẾN (MATCHING CREATION DESIGN) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 space-y-4 shadow-sm text-left">
                      <div className="flex items-center gap-2 text-blue-600 font-sans font-semibold text-sm border-b border-slate-100 pb-2.5">
                        <Calendar className="h-4.5 w-4.5" />
                        Cấu Hình Lịch Trình & Sân Đấu
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Ngày Bắt Đầu Giải Đấu</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className="w-full bg-white border border-slate-205 text-slate-805 text-xs rounded-lg px-2.5 py-2 font-semibold shadow-3xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Ngày Kết Thúc Giải Đấu</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            className="w-full bg-white border border-slate-205 text-slate-805 text-xs rounded-lg px-2.5 py-2 font-semibold shadow-3xs"
                          />
                        </div>
                      </div>

                      {/* Playing Days checkboxes */}
                      <div className="space-y-2">
                        <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Các Ngày Thi Đấu (Click để chọn/bỏ chọn những ngày diễn ra trận đấu)</label>
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
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer select-none ${
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
                        <p className="text-slate-400 text-[10px]">Lịch thi đấu sẽ chỉ rải phân cặp vào các mốc ngày được tích chọn phía trên.</p>
                      </div>

                      {/* Hours, courts and duration choices */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-slate-700 text-xs font-bold uppercase tracking-wide">Giờ Bắt Đầu Đánh</label>
                          <select
                            value={playingHoursStart}
                            onChange={(e) => setPlayingHoursStart(e.target.value)}
                            className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none"
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
                            className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none"
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
                              <span className="text-[8px] font-extrabold text-emerald-600 uppercase">KHUYÊN DÙNG ✅</span>
                            )}
                          </div>
                          <select
                            value={matchDuration}
                            onChange={(e) => setMatchDuration(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg px-2.5 py-1.5 font-mono font-bold"
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
                            className="w-full bg-white border border-slate-200 text-blue-700 text-xs rounded-lg px-2.5 py-1.5 font-bold"
                          >
                            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16].map(c => (
                              <option key={c} value={c}>{c} Sân</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Tối ưu lịch đấu toggle button */}
                      <div className="flex items-center justify-between p-4 bg-indigo-50/55 border border-indigo-100 rounded-xl hover:bg-indigo-50/80 transition duration-150 shadow-2xs mt-3">
                        <div className="space-y-1 text-left">
                          <span className="flex items-center gap-1.5 text-indigo-900 text-xs font-bold uppercase tracking-wide">
                            <span className="p-0.5 bg-indigo-100 rounded text-indigo-700">⚙️</span>
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

                      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-left space-y-4 shadow-inner mt-2">
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

                      {/* Dynamic Playing Time Sufficiency Report Card */}
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                        <div className="space-y-0.5 text-left">
                          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block font-mono">Quy mô tổng trận dự kiến</span>
                          <p className="text-slate-500 text-[10px] leading-relaxed max-w-md">
                            Quy mô trận đấu vòng bảng, vòng xếp hạng & knockout trực tiếp bốc ngẫu nhiên từ cấp hạt giống.
                          </p>
                        </div>

                        <div className="bg-white px-5 py-2 rounded-xl border border-blue-100 text-center shadow-3xs shrink-0 min-w-[130px]">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Tổng trận</span>
                          <span className="text-2xl font-black text-blue-700 font-mono">{estimatedMatches} trận</span>
                        </div>
                      </div>

                      {playingDays.length > 0 && (
                        isSufficient ? (
                          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-100 flex items-start gap-3 text-left">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">Đảm Bảo Đủ Quỹ Thời Gian Thi Đấu</span>
                              <p className="text-slate-655 text-xs leading-relaxed">
                                Lịch trình với <strong className="text-slate-800 font-bold">{playingDays.length} ngày đấu</strong> (khung giờ <strong className="text-slate-800 font-bold">{playingHoursStart} - {playingHoursEnd}</strong> - khoảng <strong>{hoursPerDayVal} tiếng/ngày</strong>), cung cấp tối đa <strong className="text-emerald-700 font-bold">{availableSlots} slots</strong> thi đấu cho {courtsCount} sân.
                              </p>
                              <p className="text-emerald-700 text-[10px] font-bold mt-1">
                                ✅ Cấu hình này chứa đủ quỹ rảnh để tổ chức trọn vẹn {estimatedMatches} trận!
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80 flex items-start gap-3 text-left">
                            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">Quỹ Thời Gian Thi Đấu Có Thể Thiếu Hụt</span>
                              <p className="text-slate-655 text-xs leading-relaxed">
                                Tổng quỹ thời gian khả dụng (<strong className="text-amber-850 font-extrabold">{availableSlots} slots</strong>) nhỏ hơn quy mô tổng số trận đấu ({estimatedMatches} trận). Xin vui lòng tăng số lượng ngày đấu, mở rộng múi giờ thi đấu hoặc tăng số lượng sân đấu lên để tránh rủi ro vỡ trận!
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    </fieldset>

                    {/* Bottom buttons panel inside active accordion block */}
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-5 gap-4">
                      {t.status !== 'FINISHED' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteById(t.id, t.name)}
                          className="w-full sm:w-auto bg-white hover:bg-rose-50 border border-slate-250 text-slate-505 hover:text-rose-600 hover:border-rose-100 px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                          Xóa giải đấu này
                        </button>
                      ) : (
                        <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider font-mono bg-slate-100 px-3 py-1 border border-slate-205 rounded-lg">
                          🔒 Đã kết thúc (Chỉ xem)
                        </div>
                      )}

                      <div className="w-full sm:w-auto flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setExpandedId('')}
                          className="w-1/2 sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Hủy / Đóng lại
                        </button>
                        {t.status !== 'FINISHED' && (
                          <button
                            type="submit"
                            className="w-1/2 sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-250"
                          >
                            <Save className="h-4.5 w-4.5" />
                            Lưu cấu hình
                          </button>
                        )}
                      </div>
                    </div>

                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
