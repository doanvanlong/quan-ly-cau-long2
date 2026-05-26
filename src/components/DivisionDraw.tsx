import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { 
  Award, 
  Zap, 
  ChevronRight, 
  Shuffle, 
  AlertCircle, 
  Users, 
  Check, 
  Users2, 
  Swords, 
  Edit, 
  Phone, 
  UserCheck, 
  ChevronDown, 
  ChevronUp, 
  Trophy, 
  Play, 
  CheckCircle,
  Clock,
  Search,
  Sparkles,
  GripVertical,
  MapPin,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { Athlete, Tournament, TournamentFormat, Match } from '../types';

const SEED_EMBLEMS: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
  4: '🎗️',
  5: '🏅',
  6: '✨',
  7: '⚡',
  8: '⭐'
};

export default function DivisionDraw() {
  const { 
    tournaments, 
    teams, 
    matches, 
    athletes, 
    activeTournamentId, 
    runDraw, 
    setActiveTournamentId, 
    updateTournament, 
    addAthlete,
    updateDrawnTeams,
    updateMatchDetail
  } = useTournament();

  const activeTournaments = tournaments.filter(t => t.status !== 'DEACTIVE');

  const [drawingTourneyId, setDrawingTourneyId] = useState<string | null>(null);
  const [athleteSearch, setAthleteSearch] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [editingCourtMatchId, setEditingCourtMatchId] = useState<string | null>(null);
  const [editingCourtValue, setEditingCourtValue] = useState<string>('');
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [editingTimeValue, setEditingTimeValue] = useState<string>('');

  const handleOpenCourtEdit = (matchId: string, currentCourt: string) => {
    setEditingCourtMatchId(matchId);
    setEditingCourtValue(currentCourt || 'Sắp xếp');

    const selectedMatch = matches.find(m => m.id === matchId);
    if (selectedMatch && selectedMatch.scheduledTime) {
      const d = new Date(selectedMatch.scheduledTime);
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
    const tourney = selectedMatch ? tournaments.find(t => t.id === selectedMatch.tournamentId) : null;
    if (tourney && tourney.startDate) {
      setEditingDateValue(tourney.startDate);
      setEditingTimeValue(tourney.playingHoursStart || '08:00');
    } else {
      setEditingDateValue(getTodayString());
      setEditingTimeValue('08:00');
    }
  };

  // Local draft states for tournaments that are already drawn
  const [drafts, setDrafts] = useState<Record<string, Partial<Tournament>>>({});

  const getTodayString = () => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const localDate = new Date(utc + (3600000 * 7)); // Vietnam GMT+7
    const yyyy = localDate.getFullYear();
    const mm = String(localDate.getMonth() + 1).padStart(2, '0');
    const dd = String(localDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isTournamentDateArrived = (tourney?: Tournament): boolean => {
    if (!tourney || !tourney.startDate) return false;
    return getTodayString() >= tourney.startDate;
  };

  const checkTournamentEditable = (tourney: Tournament, actionName: string = "thay đổi"): boolean => {
    if (!tourney) return false;
    if (tourney.status === 'FINISHED') {
      window.alert(`⚠️ Giải đấu đã kết thúc, không thể thực hiện ${actionName}!`);
      return false;
    }
    const hasBeenDrawn = tourney.status !== 'PLANNING';
    if (hasBeenDrawn && isTournamentDateArrived(tourney)) {
      window.alert(`⚠️ Đã đến ngày/qua ngày thi đấu, không thể thực hiện ${actionName}!`);
      return false;
    }
    return true;
  };

  // Dynamic preview helper to calculate simulated matches array when draft changes or format differs
  const getDrawnMatchesForPreview = (tourney: Tournament, actualMatches: Match[]): Match[] => {
    const draft = drafts[tourney.id];
    
    // Check if actual matches structure is mismatched with current tournament format
    const hasActualMatches = actualMatches.some(m => m.tournamentId === tourney.id);
    const actualHasGroupMatches = actualMatches.some(m => m.tournamentId === tourney.id && m.groupName && m.groupName.startsWith("Bảng"));
    const actualHasRoundRobinMatches = actualMatches.some(m => m.tournamentId === tourney.id && m.groupName === "Vòng Tròn");
    
    const outOfSync = hasActualMatches && (
      (tourney.format === 'ROUND_ROBIN' && actualHasGroupMatches) ||
      (tourney.format === 'GROUP_KNOCKOUT' && actualHasRoundRobinMatches)
    );

    if (!draft && !outOfSync) {
      return actualMatches;
    }

    const activeFormat = draft?.format || tourney.format;
    const activePairedTeams = draft?.pairedTeams || tourney.pairedTeams || [];
    const activeNumGroups = draft?.numGroups || tourney.numGroups || 2;
    const activeCourtsCount = tourney.courtsCount || 3;
    const activeHasSemis = draft?.hasSemis !== undefined ? draft.hasSemis : (tourney.hasSemis !== false);

    const tournamentId = tourney.id;
    const previewMatches: Match[] = [];

    if (activeFormat === 'ROUND_ROBIN') {
      const list = activePairedTeams.map((pt, idx) => `team-draw-${tournamentId}-${idx}`);
      if (list.length % 2 !== 0) {
        list.push('BYE');
      }
      const roundsCount = list.length - 1;
      const halfSize = list.length / 2;

      for (let r = 0; r < roundsCount; r++) {
        for (let i = 0; i < halfSize; i++) {
          const t1Index = (r + i) % (list.length - 1);
          let t2Index = (list.length - 1 - i + r) % (list.length - 1);
          if (i === 0) {
            t2Index = list.length - 1;
          }
          const team1 = list[t1Index];
          const team2 = list[t2Index];

          if (team1 !== 'BYE' && team2 !== 'BYE') {
            previewMatches.push({
              id: `match-rr-${tournamentId}-${r}-${i}`,
              tournamentId,
              round: r + 1,
              stage: 'GROUP',
              groupName: 'Vòng Tròn',
              team1Id: team1,
              team2Id: team2,
              scoreSets: [],
              status: 'PENDING',
              winnerId: null,
              scheduledTime: new Date(Date.now() + r * 24 * 60 * 60 * 1000).toISOString(),
              court: `Sân ${((i) % 3) + 1}`
            });
          }
        }
      }

      const finalMatch: Match = {
        id: `match-ko-${tournamentId}-final`,
        tournamentId,
        round: 1,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: null,
        nextMatchPosition: null,
        isFinal: true
      };

      const thirdPlaceMatch: Match = {
        id: `match-ko-${tournamentId}-third`,
        tournamentId,
        round: 1.5,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Số 2',
        nextMatchId: null,
        nextMatchPosition: null,
        isThirdPlace: true
      };

      previewMatches.push(finalMatch, thirdPlaceMatch);

      if (activeHasSemis !== false) {
        const semi1: Match = {
          id: `match-ko-${tournamentId}-semi1`,
          tournamentId,
          round: 2,
          stage: 'KNOCKOUT',
          team1Id: null,
          team2Id: null,
          scoreSets: [],
          status: 'PENDING',
          winnerId: null,
          scheduledTime: new Date().toISOString(),
          court: 'Sân Trung Tâm',
          nextMatchId: finalMatch.id,
          nextMatchPosition: 'team1'
        };
        const semi2: Match = {
          id: `match-ko-${tournamentId}-semi2`,
          tournamentId,
          round: 2,
          stage: 'KNOCKOUT',
          team1Id: null,
          team2Id: null,
          scoreSets: [],
          status: 'PENDING',
          winnerId: null,
          scheduledTime: new Date().toISOString(),
          court: 'Sân Trung Tâm',
          nextMatchId: finalMatch.id,
          nextMatchPosition: 'team2'
        };
        previewMatches.push(semi1, semi2);
      }

    } else if (activeFormat === 'KNOCKOUT') {
      const count = activePairedTeams.length;
      const matchesToCreate: Match[] = [];

      const finalMatch: Match = {
        id: `match-ko-${tournamentId}-f1`,
        tournamentId,
        round: 1,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: null,
        nextMatchPosition: null,
        isFinal: true
      };

      const thirdPlaceMatch: Match = {
        id: `match-ko-${tournamentId}-3rd`,
        tournamentId,
        round: 1.5,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: null,
        nextMatchPosition: null,
        isThirdPlace: true
      };

      const semi1: Match = {
        id: `match-ko-${tournamentId}-s1`,
        tournamentId,
        round: 2,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: finalMatch.id,
        nextMatchPosition: 'team1'
      };

      const semi2: Match = {
        id: `match-ko-${tournamentId}-s2`,
        tournamentId,
        round: 2,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: finalMatch.id,
        nextMatchPosition: 'team2'
      };

      matchesToCreate.push(finalMatch, thirdPlaceMatch, semi1, semi2);

      if (count >= 8) {
        for (let i = 0; i < 4; i++) {
          const t1Id = activePairedTeams[i * 2] ? `team-draw-${tournamentId}-${i * 2}` : null;
          const t2Id = activePairedTeams[i * 2 + 1] ? `team-draw-${tournamentId}-${i * 2 + 1}` : null;
          matchesToCreate.push({
            id: `match-ko-${tournamentId}-q${i+1}`,
            tournamentId,
            round: 3,
            stage: 'KNOCKOUT',
            team1Id: t1Id,
            team2Id: t2Id,
            scoreSets: [],
            status: 'PENDING',
            winnerId: null,
            scheduledTime: new Date().toISOString(),
            court: `Sân ${(i % 2) + 1}`,
            nextMatchId: i < 2 ? semi1.id : semi2.id,
            nextMatchPosition: (i % 2 === 0) ? 'team1' : 'team2'
          });
        }
      } else {
        semi1.team1Id = activePairedTeams[0] ? `team-draw-${tournamentId}-0` : null;
        semi1.team2Id = activePairedTeams[1] ? `team-draw-${tournamentId}-1` : null;
        semi2.team1Id = activePairedTeams[2] ? `team-draw-${tournamentId}-2` : null;
        semi2.team2Id = activePairedTeams[3] ? `team-draw-${tournamentId}-3` : null;
      }
      previewMatches.push(...matchesToCreate);

    } else if (activeFormat === 'GROUP_KNOCKOUT') {
      const numGroups = activeNumGroups;
      const groupLists: string[][] = Array.from({ length: numGroups }, () => []);

      activePairedTeams.forEach((pt, idx) => {
        let groupLetter = pt.group;
        if (!groupLetter) {
          const gIdx = idx % numGroups;
          groupLetter = String.fromCharCode(65 + gIdx);
        }
        const gIdx = groupLetter.charCodeAt(0) - 65;
        if (gIdx >= 0 && gIdx < numGroups) {
          groupLists[gIdx].push(`team-draw-${tournamentId}-${idx}`);
        } else {
          groupLists[idx % numGroups].push(`team-draw-${tournamentId}-${idx}`);
        }
      });

      groupLists.forEach((list, gIdx) => {
        const groupLetter = String.fromCharCode(65 + gIdx);
        const grpName = `Bảng ${groupLetter}`;
        const grpId = groupLetter;

        if (list.length < 2) return;
        const rrList = [...list];
        if (rrList.length % 2 !== 0) {
          rrList.push(null as any);
        }
        
        const roundsCount = rrList.length - 1;
        const halfSize = rrList.length / 2;
        
        for (let r = 0; r < roundsCount; r++) {
          for (let i = 0; i < halfSize; i++) {
            const t1Index = (r + i) % (rrList.length - 1);
            let t2Index = (rrList.length - 1 - i + r) % (rrList.length - 1);
            if (i === 0) {
              t2Index = rrList.length - 1;
            }
            const team1 = rrList[t1Index];
            const team2 = rrList[t2Index];

            if (team1 && team2) {
              previewMatches.push({
                id: `match-gk-${tournamentId}-${grpId}-${r}-${i}`,
                tournamentId,
                round: r + 1,
                stage: 'GROUP',
                groupName: grpName,
                team1Id: team1,
                team2Id: team2,
                scoreSets: [],
                status: 'PENDING',
                winnerId: null,
                scheduledTime: new Date().toISOString(),
                court: `Sân ${(i % activeCourtsCount) + 1}`
              });
            }
          }
        }
      });

      const finalMatch: Match = {
        id: `match-ko-${tournamentId}-final`,
        tournamentId,
        round: 1,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: null,
        nextMatchPosition: null,
        isFinal: true
      };

      const thirdPlaceMatch: Match = {
        id: `match-ko-${tournamentId}-third`,
        tournamentId,
        round: 1.5,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Số 2',
        nextMatchId: null,
        nextMatchPosition: null,
        isThirdPlace: true
      };

      const semi1: Match = {
        id: `match-ko-${tournamentId}-semi1`,
        tournamentId,
        round: 2,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: finalMatch.id,
        nextMatchPosition: 'team1'
      };

      const semi2: Match = {
        id: `match-ko-${tournamentId}-semi2`,
        tournamentId,
        round: 2,
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date().toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: finalMatch.id,
        nextMatchPosition: 'team2'
      };

      previewMatches.push(semi1, semi2, finalMatch, thirdPlaceMatch);
    }

    return previewMatches.map(m => {
      const existing = actualMatches.find(ex => ex.id === m.id);
      if (existing) {
        return {
          ...m,
          status: existing.status,
          scoreSets: existing.scoreSets,
          winnerId: existing.winnerId
        };
      }
      return m;
    });
  };

  // Helper to choose whether to commit immediately or keep as draft (we always keep as draft so user can reset dynamically)
  const updateTourneyDraftOrState = (tourneyId: string, updates: Partial<Tournament>) => {
    const t = tournaments.find(item => item.id === tourneyId);
    if (!t) return;
    setDrafts(prev => {
      const currentDraft = prev[tourneyId] || {};
      return {
        ...prev,
        [tourneyId]: {
          ...currentDraft,
          ...updates
        }
      };
    });
  };
  
  // Drag and Drop active states for swapping athletes between paired teams
  const [draggedAthleteId, setDraggedAthleteId] = useState<string | null>(null);
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);
  const [hoveredAthleteId, setHoveredAthleteId] = useState<string | null>(null);
  
  // Local state to keep track of expanded tournaments in rows
  const [expandedTourneyId, setExpandedTourneyId] = useState<string | null>(null);

  // Sync expanded row with current active tournament upon loading
  React.useEffect(() => {
    if (activeTournamentId) {
      const aTourney = tournaments.find(t => t.id === activeTournamentId);
      if (aTourney && aTourney.status !== 'DEACTIVE') {
        setExpandedTourneyId(activeTournamentId);
      }
    } else if (activeTournaments.length > 0 && !expandedTourneyId) {
      setExpandedTourneyId(activeTournaments[0].id);
    }
  }, [activeTournamentId, tournaments, activeTournaments]);

  // Calculate historical achievements of an athlete in a format (SINGLES / DOUBLES)
  const getAthleteAchievementScore = (athleteId: string, matchType: 'SINGLES' | 'DOUBLES') => {
    let score = 0;
    let matchesCount = 0;
    let winsCount = 0;
    let finalsCount = 0;
    let finalsWonCount = 0;

    // Filter tournaments matching format
    const formatTourneys = tournaments.filter(t => {
      const isDoub = t.matchType !== 'SINGLES';
      const reqDoub = matchType === 'DOUBLES';
      return isDoub === reqDoub;
    });
    
    const tourneyIds = formatTourneys.map(t => t.id);
    const relevantMatches = matches.filter(m => tourneyIds.includes(m.tournamentId) && m.status === 'FINISHED');

    relevantMatches.forEach(m => {
      const t1 = teams.find(t => t.id === m.team1Id);
      const t2 = teams.find(t => t.id === m.team2Id);

      const hasAth1 = t1?.players?.some(p => p.id === athleteId);
      const hasAth2 = t2?.players?.some(p => p.id === athleteId);

      if (hasAth1 || hasAth2) {
        matchesCount++;
        const myTeamId = hasAth1 ? m.team1Id : m.team2Id;
        const won = m.winnerId === myTeamId;
        
        if (won) {
          winsCount++;
          score += 10; // 10 points for a regular match win
        } else {
          score += 2; // 2 points for participation
        }

        if (m.isFinal) {
          finalsCount++;
          if (won) {
            finalsWonCount++;
            score += 50; // extra 50 points for winning a final
          } else {
            score += 20; // extra 20 points for playing in a final
          }
        }
      }
    });

    return {
      score,
      matchesCount,
      winsCount,
      finalsCount,
      finalsWonCount
    };
  };

  // Smart automatic seeding helper (only for Doubles, Singles has no seeds)
  const applyAutoSeeding = (tourney: Tournament, currentAssigned: Athlete[]): Athlete[] => {
    const isDoubles = tourney.matchType !== 'SINGLES';
    if (!isDoubles) {
      // Singles: no seeds at all
      return currentAssigned.map(a => ({ ...a, seed: null }));
    }

    const activeNumSeeds = tourney.numSeeds || 4;

    // Doubles: check if the user has already manually configured any seeds among the selected list
    const hasManualSeeds = currentAssigned.some(a => a.seed !== null && a.seed !== undefined);
    
    if (hasManualSeeds) {
      // Respect manual seeds but clear seeds exceeding activeNumSeeds
      return currentAssigned.map(a => {
        if (a.seed && a.seed > activeNumSeeds) {
          return { ...a, seed: null };
        }
        return a;
      });
    }

    // Allocate seeds automatically based on historical achievements
    const scoredAthletes = currentAssigned.map(ath => {
      const stats = getAthleteAchievementScore(ath.id, 'DOUBLES');
      return {
        athlete: ath,
        score: stats.score,
        tieBreaker: Math.random()
      };
    });

    // Sort by achievement score descending, then tieBreaker
    scoredAthletes.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.tieBreaker - a.tieBreaker;
    });

    return currentAssigned.map(ath => {
      const rankIndex = scoredAthletes.findIndex(sa => sa.athlete.id === ath.id);
      if (rankIndex >= 0 && rankIndex < activeNumSeeds) {
        return {
          ...ath,
          seed: (rankIndex + 1)
        };
      }
      return {
        ...ath,
        seed: null
      };
    });
  };

  // Athlete automatic allocate handler per tournament with auto seeding
  const handleAutoAllocate = (tourney: Tournament) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "phân bổ tự động")) return;
    const isDoubles = tourney.matchType !== 'SINGLES';
    const requiredAthletesCount = isDoubles ? tourney.numberOfTeams * 2 : tourney.numberOfTeams;
    
    // Pick enough athletes from global pool
    let chosen = [...athletes];
    
    if (chosen.length < requiredAthletesCount) {
      const extraNeeded = requiredAthletesCount - chosen.length;
      for (let i = 0; i < extraNeeded; i++) {
        const index = chosen.length + 1;
        const fresh: Athlete = {
          id: `ath-auto-${Date.now()}-${Math.floor(Math.random() * 10000)}-${i}`,
          name: `Tuyển thủ hạt giống ${index}`,
          age: 20 + (index % 15),
          gender: index % 3 === 0 ? 'Nữ' : 'Nam',
          nickname: `Hạt giống số ${index}`,
          address: 'Hà Nội',
          phone: `09876543${String(index).padStart(2, '0')}`
        };
        addAthlete(fresh);
        chosen.push(fresh);
      }
    }
    
    const finalSelection = chosen.slice(0, requiredAthletesCount).map(a => ({ ...a, seed: null }));
    const seededSelection = applyAutoSeeding(tourney, finalSelection);
    
    updateTourneyDraftOrState(tourney.id, { 
      athletesAssigned: seededSelection,
      pairedTeams: []
    });
  };

  const handleToggleAthleteSelection = (tourney: Tournament, athlete: Athlete) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "lựa chọn vận động viên")) return;
    const isDoubles = tourney.matchType !== 'SINGLES';
    const required = isDoubles ? tourney.numberOfTeams * 2 : tourney.numberOfTeams;
    const current = [...(tourney.athletesAssigned || [])];
    
    const isAssigned = current.some(a => a.id === athlete.id);
    if (isAssigned) {
      // Remove
      const filtered = current.filter(a => a.id !== athlete.id);
      // Clear manual seeds of any retired athletes or just re-run auto sealing if needed
      const seededFiltered = applyAutoSeeding(tourney, filtered);
      updateTourneyDraftOrState(tourney.id, { 
        athletesAssigned: seededFiltered,
        pairedTeams: []
      });
    } else {
      // Add
      if (current.length >= required) {
        window.alert(`⚠️ Đã đạt tỷ lệ tuyển lựa tối đa ${required} VĐV cho giải đấu! Hãy bỏ bớt VĐV khác trước khi chọn thêm.`);
        return;
      }
      
      const newAthlete = { ...athlete, seed: null };
      const combined = [...current, newAthlete];
      const seededCombined = applyAutoSeeding(tourney, combined);
      
      updateTourneyDraftOrState(tourney.id, { 
        athletesAssigned: seededCombined,
        pairedTeams: []
      });
    }
  };

  const handleRandomSelect = (tourney: Tournament) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "chọn ngẫu nhiên")) return;
    const isDoubles = tourney.matchType !== 'SINGLES';
    const required = isDoubles ? tourney.numberOfTeams * 2 : tourney.numberOfTeams;
    
    let pool = [...athletes];
    if (pool.length < required) {
      const extraNeeded = required - pool.length;
      for (let i = 0; i < extraNeeded; i++) {
        const index = pool.length + 1;
        const fresh: Athlete = {
          id: `ath-auto-${Date.now()}-${Math.floor(Math.random() * 10000)}-${i}`,
          name: `Tuyển thủ hạt giống ${index}`,
          age: 20 + (index % 15),
          gender: index % 3 === 0 ? 'Nữ' : 'Nam',
          nickname: `Hạt giống số ${index}`,
          address: 'Hà Nội',
          phone: `09876543${String(index).padStart(2, '0')}`,
          seed: null
        };
        addAthlete(fresh);
        pool.push(fresh);
      }
    }
    
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffledPool.slice(0, required).map(a => ({ ...a, seed: null }));
    const seededSelected = applyAutoSeeding(tourney, selected);
    
    updateTourneyDraftOrState(tourney.id, { 
      athletesAssigned: seededSelected,
      pairedTeams: []
    });
  };

  const handleUpdateAthleteSeed = (tourney: Tournament, athleteId: string, seedVal: number | null) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "cập nhật hạt giống")) return;
    const assigned = tourney.athletesAssigned || [];
    const updated = assigned.map(ath => {
      if (ath.id === athleteId) {
        return { ...ath, seed: seedVal };
      }
      return ath;
    });
    updateTourneyDraftOrState(tourney.id, { 
      athletesAssigned: updated,
      pairedTeams: []
    });
  };

  const handleRandomAssignSeeds = (tourney: Tournament) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "gán hạt giống ngẫu nhiên")) return;
    const isDoubles = tourney.matchType !== 'SINGLES';
    if (!isDoubles) return;

    const activeNumSeeds = tourney.numSeeds || 4;
    const assigned = [...(tourney.athletesAssigned || [])];
    if (assigned.length === 0) {
      window.alert("⚠️ Vui lòng gieo tuyển chọn các vận động viên ở Bước 1 trước!");
      return;
    }

    // Shuffle the players indices
    const indices = Array.from({ length: assigned.length }, (_, i) => i);
    const shuffledIndices = indices.sort(() => Math.random() - 0.5);

    // Distribute seeds 1 to activeNumSeeds to all assigned players as evenly as possible.
    const updated = assigned.map((ath, idx) => {
      const positionInShuffled = shuffledIndices.indexOf(idx);
      const seedVal = ((positionInShuffled % activeNumSeeds) + 1);
      return {
        ...ath,
        seed: seedVal
      };
    });

    updateTourneyDraftOrState(tourney.id, { 
      athletesAssigned: updated,
      pairedTeams: []
    });
  };

  const handleSmartPairTeams = (tourney: Tournament) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "bốc cặp thông minh")) return;
    const isDoubles = tourney.matchType !== 'SINGLES';
    const assigned = [...(tourney.athletesAssigned || [])];
    const N = tourney.numberOfTeams;
    const required = isDoubles ? N * 2 : N;

    if (assigned.length !== required) {
      window.alert(`⚠️ Vui lòng tuyển chọn đủ đúng ${required} vận động viên cho giải đấu trước khi bốc cặp!`);
      return;
    }

    const activeNumSeeds = tourney.numSeeds || 4;
    const teamsList: Athlete[][] = Array.from({ length: N }, () => []);

    if (isDoubles) {
      // Group athletes by their seed value (1, 2, ..., activeNumSeeds, and unseeded)
      const seededGroups: Record<number, Athlete[]> = {};
      const unseededList: Athlete[] = [];

      assigned.forEach(ath => {
        const seedValue = ath.seed;
        if (seedValue && seedValue >= 1 && seedValue <= activeNumSeeds) {
          if (!seededGroups[seedValue]) {
            seededGroups[seedValue] = [];
          }
          seededGroups[seedValue].push(ath);
        } else {
          unseededList.push(ath);
        }
      });

      // Build a list of athletes sorted from strongest seed to weakest (seed 1 -> activeNumSeeds -> unseeded)
      // We shuffle each group individually first so there's randomized matching of same-level seeds
      const sortedAthletes: Athlete[] = [];
      
      for (let s = 1; s <= activeNumSeeds; s++) {
        if (seededGroups[s]) {
          const shuffledGroup = [...seededGroups[s]].sort(() => Math.random() - 0.5);
          sortedAthletes.push(...shuffledGroup);
        }
      }

      const shuffledUnseeded = [...unseededList].sort(() => Math.random() - 0.5);
      sortedAthletes.push(...shuffledUnseeded);

      // Snake draft division pairing (pair index i with (2N - 1 - i)):
      // This distributes the strongest players at the top with the weakest players at the bottom.
      // - Team 0 gets player at index 0 (strongest seed 1) and index 2N-1 (weakest/unseeded)
      // - Team 1 gets player at index 1 and index 2N-2, etc.
      // - Team N-1 gets player at index N-1 and index N.
      // This guarantees two seed 1s or two weak seeds never end up together, achieving maximum competitive balance.
      const totalPlayers = sortedAthletes.length;
      for (let i = 0; i < N; i++) {
        const p1 = sortedAthletes[i];
        const p2 = sortedAthletes[totalPlayers - 1 - i];
        if (p1) teamsList[i].push(p1);
        if (p2) teamsList[i].push(p2);
      }
    } else {
      // Singles: 1 player per team
      // Group and sort from strongest to weakest for distribution
      const seededGroups: Record<number, Athlete[]> = {};
      const unseededList: Athlete[] = [];

      assigned.forEach(ath => {
        const seedValue = ath.seed;
        if (seedValue && seedValue >= 1 && seedValue <= activeNumSeeds) {
          if (!seededGroups[seedValue]) {
            seededGroups[seedValue] = [];
          }
          seededGroups[seedValue].push(ath);
        } else {
          unseededList.push(ath);
        }
      });

      const sortedAthletes: Athlete[] = [];
      for (let s = 1; s <= activeNumSeeds; s++) {
        if (seededGroups[s]) {
          const shuffledGroup = [...seededGroups[s]].sort(() => Math.random() - 0.5);
          sortedAthletes.push(...shuffledGroup);
        }
      }
      const shuffledUnseeded = [...unseededList].sort(() => Math.random() - 0.5);
      sortedAthletes.push(...shuffledUnseeded);

      // Standard distribution: 1 player per team
      for (let i = 0; i < N; i++) {
        if (sortedAthletes[i]) {
          teamsList[i].push(sortedAthletes[i]);
        }
      }
    }

    // Convert teamsList to pairedTeams schema
    const pairedTeams = teamsList.map((teamPlayers, idx) => {
      const joinedNames = teamPlayers.map(p => p.name).join(' . ');
      const name = joinedNames ? `Đội ${joinedNames}` : `Đội ${idx + 1}`;
      return {
        id: `paired-team-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        name,
        athleteIds: teamPlayers.map(p => p.id)
      };
    });

    const orderedAthletes: Athlete[] = [];
    teamsList.forEach(team => {
      team.forEach(player => {
        orderedAthletes.push(player);
      });
    });

    updateTourneyDraftOrState(tourney.id, { 
      athletesAssigned: orderedAthletes,
      pairedTeams: pairedTeams
    });
  };

  const handleSaveTeamName = (tourney: Tournament, teamId: string) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "đổi tên đội")) return;
    const draft = drafts[tourney.id];
    const pairedTeams = draft?.pairedTeams || tourney.pairedTeams || [];
    if (pairedTeams.length === 0) return;
    
    const updated = pairedTeams.map(pt => {
      if (pt.id === teamId) {
        return { ...pt, name: editingTeamName, isCustomName: true };
      }
      return pt;
    });
    updateTourneyDraftOrState(tourney.id, { pairedTeams: updated });
    setEditingTeamId(null);
  };

  const handleUpdateTeamGroup = (tourney: Tournament, ptId: string, newGroup: string) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "phân nhóm đấu")) return;
    const draft = drafts[tourney.id];
    const pairedTeams = draft?.pairedTeams || tourney.pairedTeams || [];
    if (pairedTeams.length === 0) return;

    const updated = pairedTeams.map(pt => {
      if (pt.id === ptId) {
        return { ...pt, group: newGroup };
      }
      return pt;
    });
    updateTourneyDraftOrState(tourney.id, { pairedTeams: updated });
  };

  const handleSwapAthletes = (
    tourney: Tournament,
    sourceTeamId: string,
    sourceAthId: string,
    targetTeamId: string,
    targetAthId: string
  ) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "đổi chéo tuyển thủ")) return;
    const draft = drafts[tourney.id];
    const pairedTeams = draft?.pairedTeams || tourney.pairedTeams || [];
    const athletesAssigned = draft?.athletesAssigned || tourney.athletesAssigned || [];
    if (pairedTeams.length === 0) return;
    if (sourceTeamId === targetTeamId) return; // Prevent swapping within the same team
    if (sourceAthId === targetAthId) return;

    const updatedPairedTeams = pairedTeams.map(pt => {
      const athleteIds = [...pt.athleteIds];
      if (pt.id === sourceTeamId) {
        const idx = athleteIds.indexOf(sourceAthId);
        if (idx !== -1) {
          athleteIds[idx] = targetAthId;
        }
      } else if (pt.id === targetTeamId) {
        const idx = athleteIds.indexOf(targetAthId);
        if (idx !== -1) {
          athleteIds[idx] = sourceAthId;
        }
      }
      return { ...pt, athleteIds };
    });

    const finalPairedTeams = updatedPairedTeams.map(pt => {
      if (pt.id === sourceTeamId || pt.id === targetTeamId) {
        const teamAthletes = pt.athleteIds
          .map(id => (athletesAssigned || []).find(a => a.id === id))
          .filter(Boolean) as Athlete[];
        const joined = teamAthletes.map(p => p.name).join(' . ');
        const newName = joined ? `Đội ${joined}` : pt.name;
        return { ...pt, name: newName };
      }
      return pt;
    });

    const orderedAthletes: Athlete[] = [];
    finalPairedTeams.forEach(team => {
      team.athleteIds.forEach(id => {
        const found = (athletesAssigned || []).find(a => a.id === id);
        if (found) {
          orderedAthletes.push(found);
        }
      });
    });

    const uniqueOrderedAthletes: Athlete[] = [];
    const seenIds = new Set<string>();
    orderedAthletes.forEach(p => {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        uniqueOrderedAthletes.push(p);
      }
    });

    updateTourneyDraftOrState(tourney.id, {
      athletesAssigned: uniqueOrderedAthletes,
      pairedTeams: finalPairedTeams
    });
  };

  const handleSaveTeamChanges = (tourney: Tournament) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "lưu thay đổi đội hình")) return;
    if (!tourney.playingDays || tourney.playingDays.length === 0) {
      window.alert("⚠️ Không thể lưu thay đổi đội hình do giải đấu chưa chọn ngày thi đấu nào! Vui lòng chọn ít nhất một ngày trong 'Quản Lý Giải Đấu' trước.");
      return;
    }
    const draft = drafts[tourney.id];
    const updatedPairedTeams = draft?.pairedTeams || tourney.pairedTeams || [];
    const updatedAthletesAssigned = draft?.athletesAssigned || tourney.athletesAssigned || [];
    
    if (updatedPairedTeams.length === 0) {
      window.alert("⚠️ Chưa có đội hình thi đấu được bốc cặp!");
      return;
    }

    const additionalUpdates: Partial<Tournament> = {};
    if (draft?.matchType !== undefined) additionalUpdates.matchType = draft.matchType;
    if (draft?.numSeeds !== undefined) additionalUpdates.numSeeds = draft.numSeeds;
    if (draft?.format !== undefined) additionalUpdates.format = draft.format;

    // Save drawn teams and variables to main storage
    updateDrawnTeams(tourney.id, updatedPairedTeams, updatedAthletesAssigned, additionalUpdates);
    
    // Automatically regenerate schedule and brackets with the updated format & teams if already drawn
    if (tourney.status !== 'PLANNING') {
      runDraw(tourney.id, draft);
    }

    // Clear draft for this tournament
    setDrafts(prev => {
      const next = { ...prev };
      delete next[tourney.id];
      return next;
    });

    window.alert("✨ Lưu thay đổi thành công! Sơ đồ toàn bộ các trận đấu và lịch đấu đã được cập nhật đồng bộ và lưu trữ.");
  };

  const handleUpdateAssignedAthlete = (tourney: Tournament, index: number, fields: Partial<Athlete>) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "cập nhật vận động viên")) return;
    const assignedList = tourney.athletesAssigned || [];
    const updated = [...assignedList];
    
    if (!updated[index]) {
      updated[index] = {
        id: `ath-created-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`,
        name: `Vận động viên ${index + 1}`,
        age: 23,
        gender: 'Nam',
        nickname: `Slot ${index + 1}`
      };
    }
    updated[index] = { ...updated[index], ...fields };
    updateTourneyDraftOrState(tourney.id, { 
      athletesAssigned: updated,
      pairedTeams: []
    });
  };

  const handleDrawTrigger = (tourney: Tournament) => {
    if (!tourney) return;
    if (!checkTournamentEditable(tourney, "bốc thăm")) return;
    if (!tourney.playingDays || tourney.playingDays.length === 0) {
      window.alert("⚠️ Giải đấu này chưa được chọn ngày thi đấu nào! Vui lòng thiết lập chọn ngày thi đấu trong trang 'Quản Lý Giải Đấu' trước khi bốc thăm.");
      return;
    }
    const isDoubles = tourney.matchType !== 'SINGLES';
    const requiredAthletesCount = isDoubles ? tourney.numberOfTeams * 2 : tourney.numberOfTeams;
    const assignedList = tourney.athletesAssigned || [];
    const hasEnoughAthletes = assignedList.length === requiredAthletesCount;

    if (!hasEnoughAthletes) {
      window.alert(`⚠️ Vui lòng phân bổ hoặc ghi danh đầy đủ ${requiredAthletesCount} Vận động viên cho giải đấu trước khi bốc thăm!`);
      return;
    }

    // Save/Commit current local drafts to the main database store before runDraw is executed
    const draft = drafts[tourney.id];
    if (draft) {
      updateTournament(tourney.id, draft);
      setDrafts(prev => {
        const next = { ...prev };
        delete next[tourney.id];
        return next;
      });
    }
    
    setDrawingTourneyId(tourney.id);
    setTimeout(() => {
      runDraw(tourney.id, draft);
      setDrawingTourneyId(null);
    }, 1200); // realistic lottery spin feel
  };

  const getTeamName = (id: string | null) => {
    if (!id) return 'Chờ xác định';
    const found = teams.find(t => t.id === id || (id.startsWith('team-draw-') && t.id.startsWith(id + '-')));
    return found ? found.name : 'Chưa xác định';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DEACTIVE':
        return {
          label: 'Vô hiệu hóa (Deactive)',
          style: 'bg-rose-50 text-rose-700 border-rose-200 border text-[10px]',
          icon: AlertCircle
        };
      case 'COMPLETED':
        return {
          label: 'Đã hoàn thành',
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px]',
          icon: CheckCircle
        };
      case 'ACTIVE':
      case 'DRAW_DONE':
        return {
          label: 'Đã chia lịch thi đấu',
          style: 'bg-indigo-50 text-indigo-700 border-indigo-200 border text-[10px]',
          icon: Play
        };
      default:
        return {
          label: 'Chưa chia lịch thi đấu',
          style: 'bg-amber-50 text-amber-700 border-amber-200 border text-[10px]',
          icon: Clock
        };
    }
  };

  if (activeTournaments.length === 0) {
    return (
      <div id="division-draw-empty" className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto my-8">
        <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Chưa có giải đấu nào trong hệ thống!</h2>
        <p className="text-slate-500 text-xs font-medium">
          Vui lòng chuyển sang tab "Tạo Giải Đấu" để tạo một giải mới trước khi thực hiện sắp xếp sơ đồ & chia bảng.
        </p>
      </div>
    );
  }

  return (
    <div id="division-draw-container" className="space-y-6 py-2 text-left">
      
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Award className="h-6.5 w-6.5 text-blue-600" />
            Điều Phối Giải Đấu & Sơ Đồ Nhánh
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            Tất cả các giải đấu đang diễn ra. Bấm mở từng hàng giải tương ứng để xem hồ sơ VĐV, bốc cặp đấu, bảng phân chia và sơ đồ loại trực tiếp.
          </p>
        </div>
      </div>

      {/* Accordion Rows List */}
      <div className="space-y-4">
        {activeTournaments.map((originalTourney) => {
          const draft = drafts[originalTourney.id];
          const tourney: Tournament = draft ? { ...originalTourney, ...draft } : originalTourney;

          const isExpanded = expandedTourneyId === tourney.id;
          const isActiveView = activeTournamentId === tourney.id;
          const isDrawing = drawingTourneyId === tourney.id;

          const isDoubles = tourney.matchType !== 'SINGLES';
          const requiredAthletesCount = isDoubles ? tourney.numberOfTeams * 2 : tourney.numberOfTeams;
          const assignedList = tourney.athletesAssigned || [];
          const hasEnoughAthletes = assignedList.length === requiredAthletesCount;
          const activeNumSeeds = tourney.numSeeds || 4;

          const statusInfo = getStatusBadge(tourney.status);
          const StatusIcon = statusInfo.icon;

          // Retrieve dynamic groups and knockout bracket per tournament
          const previewMatches = getDrawnMatchesForPreview(tourney, matches);
          const tMatches = previewMatches.filter(m => m.tournamentId === tourney.id);
          const groupMatches = tMatches.filter(m => m.stage === 'GROUP');
          
          // Resolve team names dynamically from drafts or active athlete list in real-time
          const getDynamicTeamName = (teamId: string | null, mObj?: any, position?: 'team1' | 'team2') => {
            if (!teamId) {
              if (mObj && mObj.stage === 'KNOCKOUT') {
                const isFinal = mObj.isFinal || mObj.id?.endsWith('final') || mObj.id?.endsWith('f1') || mObj.round === 1;
                const isThirdPlace = mObj.isThirdPlace || mObj.id?.includes('third') || mObj.id?.includes('3rd') || mObj.round === 1.5;
                const isSemi1 = mObj.id?.endsWith('semi1') || mObj.id?.endsWith('s1');
                const isSemi2 = mObj.id?.endsWith('semi2') || mObj.id?.endsWith('s2');

                const format = drafts[tourney.id]?.format || tourney.format;
                const hasSemis = drafts[tourney.id]?.hasSemis !== undefined ? drafts[tourney.id]?.hasSemis : (tourney.hasSemis !== false);
                const pairing = drafts[tourney.id]?.semisPairingType || tourney.semisPairingType || '1v4_2v3';

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
                  const activePairedTeams = drafts[tourney.id]?.pairedTeams || tourney.pairedTeams || [];
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
              
              const activePairedTeams = drafts[tourney.id]?.pairedTeams || tourney.pairedTeams || [];
              const activeAthletesAssigned = drafts[tourney.id]?.athletesAssigned || tourney.athletesAssigned || [];
              
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

          // Re-compute groups based on actual matches of this tournament dynamically
          const groups: Record<string, string[]> = {};
          groupMatches.forEach(m => {
            const gName = m.groupName || 'Vòng Bảng';
            if (!groups[gName]) {
              groups[gName] = [];
            }
            if (m.team1Id) {
              const tName = getDynamicTeamName(m.team1Id);
              if (tName && !groups[gName].includes(tName)) {
                groups[gName].push(tName);
              }
            }
            if (m.team2Id) {
              const tName = getDynamicTeamName(m.team2Id);
              if (tName && !groups[gName].includes(tName)) {
                groups[gName].push(tName);
              }
            }
          });

          // Knockout bracket matches for diagram
          const koMatches = tMatches.filter(m => m.stage === 'KNOCKOUT');
          const level1Finals = koMatches.filter(m => m.round === 1);
          const level2Semis = koMatches.filter(m => m.round === 2);
          const level3Quarters = koMatches.filter(m => m.round === 3);
          const level1ThirdPlace = koMatches.filter(m => m.isThirdPlace || m.round === 1.5);

          return (
            <div 
              key={tourney.id} 
              id={`tourney-row-${tourney.id}`} 
              className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all duration-200 ${
                isExpanded ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200 hover:border-slate-350'
              } ${isActiveView ? 'border-l-4 border-l-blue-600' : ''}`}
            >
              
              {/* Accordion Row Header */}
              <div 
                onClick={() => setExpandedTourneyId(isExpanded ? null : tourney.id)}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 cursor-pointer bg-slate-50/50 hover:bg-slate-50 select-none transition gap-4"
              >
                <div className="flex items-center gap-4">
                  {/* Icon status */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Trophy className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm md:text-base tracking-tight">
                        {tourney.name}
                      </h3>
                      {isActiveView && (
                        <span className="bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full select-none animate-pulse">
                          Giải đang xem chính
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-500 text-[11px] font-semibold font-mono uppercase tracking-wider">
                      <span>{tourney.numberOfTeams} Đội tuyển</span>
                      <span>•</span>
                      <span>Đấu {tourney.matchType === 'SINGLES' ? 'Đơn (Singles)' : 'Đôi (Doubles)'}</span>
                      <span>•</span>
                      <span>
                        {tourney.format === 'GROUP_KNOCKOUT' 
                          ? 'Chia bảng hạt giống' 
                          : tourney.format === 'ROUND_ROBIN' 
                          ? 'Vòng tròn một lượt' 
                          : 'Loại trực tiếp'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badges & Expanding triggers */}
                <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    <span className={`px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shrink-0 ${statusInfo.style}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </span>

                    {/* Quick set active view button */}
                    {!isActiveView && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTournamentId(tourney.id);
                        }}
                        className="text-[10px] bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-3 py-1 rounded-full font-bold transition cursor-pointer shrink-0 border border-slate-200 hover:border-blue-200"
                        title="Đặt giải này làm bộ lọc dữ liệu chính trên các tab khác"
                      >
                        Đặt xem chính
                      </button>
                    )}
                  </div>

                  {/* Expand Chevron */}
                  <div className="text-slate-400 p-1 rounded-full hover:bg-slate-150 transition ml-1 shrink-0">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </div>

              {/* Accordion Dropdown Content */}
              {isExpanded && (
                <div 
                  id={`tourney-detail-${tourney.id}`} 
                  className="border-t border-slate-150 p-5 md:p-6 space-y-6 bg-white animate-in slide-in-from-top-3 duration-200"
                >
                  
                  {/* Warning and constraint notices */}
                  {(() => {
                    const isFinished = tourney.status === 'FINISHED';
                    const isDrawn = tourney.status !== 'PLANNING';
                    const dateArrived = isTournamentDateArrived(tourney);
                    
                    if (isFinished) {
                      return (
                        <div className="bg-amber-55 border border-amber-200 text-amber-900 rounded-xl p-4 flex items-start gap-3 shadow-3xs">
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-left space-y-1">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800">GIẢI ĐẤU ĐÃ KẾT THÚC (CHỈ XEM)</h5>
                            <p className="text-[11px] text-amber-700 leading-relaxed">
                              Giải đấu này đã hoàn tất và kết thúc hoàn toàn. Mọi tính năng phân chia bảng đấu, cập nhật hạt giống, bốc cặp, bốc thăm lại hay lưu thay đổi đội tuyển đều đã bị khóa. Bạn chỉ có thể xem dữ liệu lịch sử.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    if (isDrawn && dateArrived) {
                      return (
                        <div className="bg-rose-50 border border-rose-200 text-rose-950 rounded-xl p-4 flex items-start gap-3 shadow-3xs">
                          <Lock className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                          <div className="text-left space-y-1">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-rose-800">LỊCH THI ĐẤU ĐÃ LÊN VÀ NGÀY THI ĐẤU ĐÃ ĐẾN</h5>
                            <p className="text-[11px] text-rose-750 leading-relaxed">
                              Giải đấu đã bốc thăm xếp lịch và hôm nay ({getTodayString()}) đã đến hoặc vượt quá ngày khởi tranh ({tourney.startDate}). Để bảo toàn tính minh bạch và lịch trình, tính năng bốc thăm lại và lưu thay đổi đội hình đã được khoá.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}

                  {/* Tournament Schedule Stats Bar */}
                  {tourney.startDate && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-slate-600 select-none leading-relaxed animate-in fade-in duration-150">
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Thời gian diễn ra</span>
                        <p className="text-xs font-bold text-slate-800">{tourney.startDate} &rarr; {tourney.endDate || 'Đang cập nhật'}</p>
                      </div>
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Các ngày thi đấu</span>
                        <p className="text-xs font-bold text-slate-800">
                          {tourney.playingDays && tourney.playingDays.length > 0 ? (
                            tourney.playingDays.map(d => {
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
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Khung giờ đánh hằng ngày</span>
                        <p className="text-xs font-bold text-slate-800">{tourney.playingHoursStart || '08:00'} - {tourney.playingHoursEnd || '18:00'}</p>
                      </div>
                      <div className="space-y-0.5 text-left">
                        <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-slate-400">Thời lượng trận dự tính</span>
                        <p className="text-xs font-bold text-slate-800">{tourney.matchDuration || 30} phút / trận</p>
                      </div>
                    </div>
                  )}
                  
                  {/* SECTION 1: Config summary & Action bốc thăm */}
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 flex flex-col xl:flex-row xl:items-start justify-between gap-6 shadow-sm">
                    {/* Left: The configuration controls */}
                    <div className="space-y-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div className="space-y-1">
                          <span className="bg-blue-105 border border-blue-200 text-blue-700 text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-md inline-block uppercase select-none font-sans">
                            BẢNG ĐIỀU KHIỂN THỂ THỨC & CẤU HÌNH GIẢI ĐẤU
                          </span>
                          <h4 className="text-xs md:text-sm font-black text-slate-800 uppercase tracking-wide">
                            Cơ cấu đội tuyển & Tùy biến Quy hoạch đấu bảng
                          </h4>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-250 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0 select-none">
                          <Check className="h-3.5 w-3.5" /> HOẠT ĐỘNG
                        </span>
                      </div>

                      {/* SƠ ĐỒ THIẾT LẬP TÓM TẮT (READ-ONLY VIEW) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Thể thức */}
                        <div className="space-y-1 text-left bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono block">Thể Thức Thi Đấu</span>
                          <span className="text-xs font-black text-blue-700 font-sans block">
                            {tourney.format === 'GROUP_KNOCKOUT' 
                              ? 'Chia bảng & Vòng loại (Group KO)' 
                              : tourney.format === 'ROUND_ROBIN' 
                                ? 'Vòng tròn một lượt (Round Robin)' 
                                : 'Loại trực tiếp (Knockout Bracket)'}
                          </span>
                        </div>

                        {/* Quy mô Đội */}
                        <div className="space-y-1 text-left bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono block">Quy Mô Đội Tuyển</span>
                          <span className="text-xs font-bold text-slate-800 font-sans block">
                            {tourney.numberOfTeams} Đội tuyển
                          </span>
                        </div>

                        {/* Hình thức */}
                        <div className="space-y-1 text-left bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono block">Hình Thức Thi Đấu</span>
                          <span className="text-xs font-bold text-slate-800 font-sans block">
                            {tourney.matchType === 'SINGLES' ? 'Đánh đơn (Singles)' : 'Đánh đôi (Doubles)'}
                          </span>
                        </div>

                        {/* Thống kê Bảng */}
                        <div className="space-y-1 text-left bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider font-mono block">Phân Bổ Kế Hoạch</span>
                          <span className="text-xs font-bold text-slate-850 font-sans block">
                            {tourney.format === 'GROUP_KNOCKOUT'
                              ? `Rải đều ${tourney.numGroups || 2} Bảng • Lấy ${tourney.advancePerGroup || 2} đội/bảng`
                              : 'Vòng tròn / Nhánh Bracket loại trực tiếp'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2.5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 text-xs text-slate-500 font-semibold select-none">
                        <span className="text-[11px] text-blue-700 bg-blue-50 px-3 py-1 rounded-xl font-medium">
                          💡 Các thông số thể thức và quy hoạch trên được quản lý và cấu hình chuyên sâu tại tab <strong className="font-extrabold uppercase text-blue-800">Quản Lý Giải Đấu</strong>.
                        </span>
                        
                        {tourney.format === 'GROUP_KNOCKOUT' && (
                          <span className="text-[11px] text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl">
                            Quy mô dự kiến: <strong className="font-extrabold">{Math.ceil(tourney.numberOfTeams / (tourney.numGroups || 2))} đội/bảng</strong>.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: The action buttons inside the parent card */}
                    {(() => {
                      const isDoubles = (draft?.matchType || tourney.matchType) !== 'SINGLES';
                      const required = isDoubles ? (draft?.numberOfTeams || tourney.numberOfTeams) * 2 : (draft?.numberOfTeams || tourney.numberOfTeams);
                      const isPairingComplete = !!(
                        tourney.pairedTeams &&
                        tourney.pairedTeams.length === (draft?.numberOfTeams || tourney.numberOfTeams) &&
                        tourney.athletesAssigned &&
                        tourney.athletesAssigned.length === required
                      );

                      return (
                        <div className="shrink-0 space-y-2 select-none w-full xl:w-auto text-center xl:text-right border-t xl:border-t-0 border-slate-200 pt-4 xl:pt-0 self-center">
                          <button
                            type="button"
                            onClick={() => handleDrawTrigger(tourney)}
                            disabled={isDrawing || !isPairingComplete}
                            className={`w-full xl:w-auto ${
                              !isPairingComplete
                                ? 'bg-slate-100 border border-slate-300 text-slate-400 font-semibold cursor-not-allowed opacity-80'
                                : isDrawing
                                  ? 'bg-slate-300 border border-slate-400 text-slate-500 cursor-not-allowed'
                                  : draft
                                    ? 'bg-amber-600 hover:bg-amber-550 text-white font-bold shadow-md shadow-amber-250 animate-pulse border border-amber-550 cursor-pointer'
                                    : tourney.status !== 'PLANNING' 
                                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold border border-slate-350 shadow-xs cursor-pointer' 
                                      : 'bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-200 cursor-pointer'
                            } px-5 py-3 rounded-xl text-xs flex items-center justify-center gap-2 transition`}
                          >
                            <Shuffle className={`h-4 w-4 ${isDrawing && 'animate-spin'}`} />
                            {isDrawing ? 'Đang chia nhánh quay số...' : tourney.status !== 'PLANNING' ? 'Tiến hành chia lịch thi đấu lại' : 'Tiến hành chia lịch thi đấu'}
                          </button>
                          
                          {!isPairingComplete ? (
                            <p className="text-[10px] text-rose-500 text-center font-bold uppercase tracking-wide font-sans animate-pulse">
                              ⚠️ Hãy ghép cặp xong ở bước 2 trước!
                            </p>
                          ) : draft ? (
                            <div className="space-y-1.5 text-center xl:text-right">
                              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider font-mono leading-relaxed">
                                ⚠️ CÓ THAY ĐỔI ĐỘI HÌNH CẦN LƯU! <br />
                                Hãy bấm "Lưu Thay Đổi Đội" ở phần danh sách phía dưới <br />
                                hoặc chia lịch thi đấu lại nếu muốn xếp lịch mới.
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2 justify-end items-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDrafts(prev => {
                                      const next = { ...prev };
                                      delete next[tourney.id];
                                      return next;
                                    });
                                  }}
                                  className="w-full sm:w-auto text-[10px] text-slate-500 hover:text-red-500 hover:underline font-bold transition cursor-pointer"
                                >
                                  Hủy thay đổi (Khôi phục)
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider font-mono">
                              {tourney.status === 'PLANNING' ? 'Chuẩn bị ghép đôi & bốc thăm' : 'Sơ đồ nhánh & lịch thi đấu đã khoá'}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* SECTION 2: Athletes profiles roster of this tournament */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-xs space-y-6">
                    
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 select-none">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-blue-600" />
                          Quản Lý Đội Ngũ & Chọn Lựa VĐV Thi Đấu ({assignedList.length} / {requiredAthletesCount} VĐV)
                        </h4>
                        <p className="text-[11px] text-slate-400 font-semibold">
                          {isDoubles 
                            ? `Cần tuyển chọn đủ ${requiredAthletesCount} tay vợt (${tourney.numberOfTeams} cặp đôi) để chia cặp & rải đều hạt giống.`
                            : `Cần tuyển chọn đủ ${requiredAthletesCount} vận động viên cho sơ đồ nhánh đơn.`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
                          {isDoubles ? 'Thể thức Đấu Đôi' : 'Thể thức Đấu Đơn'}
                        </span>
                        <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
                          {isDoubles ? '2 VĐV MỖI CẶP' : '1 VĐV MỖI NHÁNH'}
                        </span>
                      </div>
                    </div>

                    {/* Step A: Quick selection grid of ALL available athletes */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
                        <div className="space-y-1">
                          <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-blue-600" />
                            Bước 1: Chọn từ Danh bạ Vận động viên hệ thống
                          </h5>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Bấm để Chọn / Bỏ chọn cụ thể các vận động viên tham gia thi đấu giải này.
                          </p>
                        </div>

                        {/* Search Input filter */}
                        <div className="relative w-full sm:w-60">
                          <input
                            type="text"
                            value={athleteSearch}
                            onChange={(e) => setAthleteSearch(e.target.value)}
                            placeholder="Tìm tên hoặc biệt danh..."
                            className="w-full bg-white text-slate-800 border border-slate-205 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 font-medium transition"
                          />
                          <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      {isDoubles && (
                        <div className="bg-white border border-slate-200/80 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
                          <div className="space-y-0.5">
                            <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider font-mono">
                              CÀI ĐẶT HẠT GIỐNG (ĐẤU ĐÔI)
                            </span>
                            <h6 className="font-bold text-xs text-slate-800">
                              Thiết lập số loại nhóm hạt giống
                            </h6>
                            <p className="text-[10px] text-slate-400 font-medium font-sans">
                              Hệ thống hỗ trợ gieo rắc ngẫu nhiên đều đặn hạt giống cho toàn bộ VĐV đăng ký tham gia.
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-lg border border-slate-205">
                              <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Số loại HG:</span>
                              <select
                                value={activeNumSeeds}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  
                                  // Auto-adjust any existing athlete seeds that exceed the new limit
                                  const updated = assignedList.map(a => {
                                    if (a.seed && a.seed > val) {
                                      return { ...a, seed: null };
                                    }
                                    return a;
                                  });
                                  updateTourneyDraftOrState(tourney.id, { 
                                    numSeeds: val,
                                    athletesAssigned: updated,
                                    pairedTeams: []
                                  });
                                }}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold transition focus:outline-none focus:border-blue-500 cursor-pointer"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                  <option key={num} value={num}>{num} HG</option>
                                ))}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRandomAssignSeeds(tourney)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 text-xs rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Tự động gieo rắc hạt giống đồng đều cho tất cả VĐV"
                            >
                              <Sparkles className="h-3.5 w-3.5 shrink-0" /> Tự random HG đồng đều
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = assignedList.map(a => ({ ...a, seed: null }));
                                updateTourneyDraftOrState(tourney.id, { 
                                  athletesAssigned: updated,
                                  pairedTeams: []
                                });
                              }}
                              className="text-slate-500 hover:text-red-500 hover:underline font-bold text-xs px-2 py-1 transition cursor-pointer"
                            >
                              Xóa sạch hạt giống
                            </button>
                          </div>
                        </div>
                      )}

                                            {/* Filtered Athletes list container */}
                      {athletes.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4 italic font-medium">
                          Chưa có bất kỳ vận động viên nào trong danh bạ. Hãy qua tab "Đội & Thành Viên" để đăng ký!
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-white">
                          {athletes.filter(a => {
                            const term = athleteSearch.toLowerCase();
                            return (
                              a.name.toLowerCase().includes(term) ||
                              (a.nickname && a.nickname.toLowerCase().includes(term))
                            );
                          }).map((ath) => {
                            const isSelected = assignedList.some(assigned => assigned.id === ath.id);
                            // Detect if seed rating is set on this selected athlete
                            const foundSelected = assignedList.find(assigned => assigned.id === ath.id);
                            const activeSeed = foundSelected?.seed;

                            return (
                              <button
                                key={ath.id}
                                type="button"
                                onClick={() => handleToggleAthleteSelection(tourney, ath)}
                                className={`text-left p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-150 flex flex-col justify-between min-h-14 ${
                                  isSelected 
                                    ? 'bg-blue-50/70 border-blue-400 text-blue-800 ring-1 ring-blue-100' 
                                    : 'bg-slate-50/40 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start justify-between w-full">
                                  <span className="font-bold truncate max-w-[110px]" title={ath.name}>
                                    {ath.name}
                                  </span>
                                  {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                                </div>
                                
                                <div className="flex items-center justify-between w-full mt-1.5 select-none">
                                  <span className="text-[10px] text-slate-400 font-medium italic truncate max-w-[80px]">
                                    {ath.nickname ? `"${ath.nickname}"` : `Không biệt danh`}
                                  </span>
                                                                  {isSelected && isDoubles ? (
                                    <select
                                      value={activeSeed || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : null;
                                        handleUpdateAthleteSeed(tourney, ath.id, val);
                                      }}
                                      className="bg-white hover:bg-slate-55 text-slate-705 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer h-5 transition duration-150"
                                      title="Chọn thứ tự hạt giống cho VĐV này"
                                    >
                                      <option value="">Không HG</option>
                                      {Array.from({ length: activeNumSeeds }).map((_, rIdx) => {
                                        const r = rIdx + 1;
                                        const icon = SEED_EMBLEMS[r] || '⭐';
                                        return (
                                          <option key={r} value={r}>
                                            HG #{r} {icon}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  ) : (
                                    isSelected && activeSeed && (
                                      <span className="bg-red-50 text-red-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-red-200">
                                        HG #{activeSeed} {SEED_EMBLEMS[activeSeed] || '⭐'}
                                      </span>
                                    )
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick automatic action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200 text-xs">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleRandomSelect(tourney)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                          >
                            <Shuffle className="h-3.5 w-3.5" /> Tuyển ngẫu nhiên đủ {requiredAthletesCount} VĐV
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleAutoAllocate(tourney)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                          >
                            Nạp chỉ định nhanh
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isTournamentDateArrived(originalTourney) && originalTourney.status !== 'PLANNING'}
                          onClick={() => {
                            if (!checkTournamentEditable(tourney, "hủy chọn tất cả")) return;
                            updateTourneyDraftOrState(tourney.id, { athletesAssigned: [], pairedTeams: [] });
                          }}
                          className={`${
                            isTournamentDateArrived(originalTourney) && originalTourney.status !== 'PLANNING'
                              ? 'text-slate-400 cursor-not-allowed line-through'
                              : 'text-red-650 hover:text-red-700 hover:underline cursor-pointer'
                          } font-bold transition text-[11px]`}
                        >
                          Hủy chọn tất cả (Xóa trống)
                        </button>
                      </div>
                    </div>

                    {/* Step B: Selected roster and team preview */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between select-none border-t border-slate-100 pt-4">
                        <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                          Bước 2: Xem Đội Hình Thi Đấu & Rải Hạt Giống ({assignedList.length} / {requiredAthletesCount} VĐV)
                        </h5>
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          Danh sách tham gia chính thức
                        </span>
                      </div>

                      {assignedList.length === 0 ? (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-500 text-xs font-semibold">
                          Hãy qua Bước 1 phía trên để chọn hoặc bấm nút "Tuyển ngẫu nhiên" để ghi danh vận động viên thi đấu giải!
                        </div>
                      ) : (
                        <div className="space-y-5">
                          {/* Board columns mapped by seeds if isDoubles */}
                          {isDoubles ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                              {Array.from({ length: activeNumSeeds }).map((_, rankIdx) => {
                                const seedRank = rankIdx + 1;
                                const seedAthletes = assignedList.filter(a => a.seed === seedRank);
                                const emoji = SEED_EMBLEMS[seedRank] || '⭐';

                                return (
                                  <div key={seedRank} className="bg-indigo-50/40 border border-indigo-150 rounded-xl p-3.5 space-y-3 flex flex-col justify-between min-h-36 shadow-xs">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                                        <h6 className="font-extrabold text-[11px] text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                                          <span>{emoji}</span> Hạt Giống #{seedRank}
                                        </h6>
                                        <span className="text-[10px] bg-indigo-100/70 text-indigo-700 px-2 py-0.5 rounded-full font-mono font-bold">
                                          {seedAthletes.length} VĐV
                                        </span>
                                      </div>

                                      {seedAthletes.length === 0 ? (
                                        <div className="text-[11px] text-slate-400 italic py-4 text-center font-semibold bg-white rounded-lg border border-slate-100">
                                          Chưa có VĐV hạt giống #{seedRank}
                                        </div>
                                      ) : (
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                          {seedAthletes.map(ath => (
                                            <div key={ath.id} className="bg-white border border-indigo-100/50 p-2 rounded-lg flex items-center justify-between gap-2 shadow-xs hover:border-indigo-200 transition">
                                              <div className="space-y-0.5 truncate">
                                                <span className="text-xs font-bold text-slate-800 block truncate">{ath.name}</span>
                                                {ath.nickname && <span className="text-[10px] text-slate-400 italic font-semibold">"{ath.nickname}"</span>}
                                              </div>
                                              <span className="text-[9px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded">
                                                {ath.gender}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Unseeded column */}
                              {(() => {
                                const unseededAthletes = assignedList.filter(a => !a.seed || a.seed > activeNumSeeds);
                                return (
                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 flex flex-col justify-between min-h-36 shadow-xs">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                                        <h6 className="font-extrabold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                          👥 VĐV Tự Do (Không HG)
                                        </h6>
                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono font-bold">
                                          {unseededAthletes.length} VĐV
                                        </span>
                                      </div>

                                      {unseededAthletes.length === 0 ? (
                                        <div className="text-[11px] text-slate-400 italic py-4 text-center font-semibold bg-white rounded-lg border border-slate-100">
                                          Không có VĐV tự do
                                        </div>
                                      ) : (
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto w-full">
                                          {unseededAthletes.map(ath => (
                                            <div key={ath.id} className="bg-white border border-slate-100 p-2 rounded-lg flex items-center justify-between gap-2 shadow-xs hover:border-slate-200 transition">
                                              <div className="space-y-0.5 truncate">
                                                <span className="text-xs font-bold text-slate-800 block truncate">{ath.name}</span>
                                                {ath.nickname && <span className="text-[10px] text-slate-400 italic font-semibold">"{ath.nickname}"</span>}
                                              </div>
                                              <span className="text-[9px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded font-bold">
                                                {ath.gender}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                              {assignedList.map((ath, idx) => (
                                <div key={ath.id} className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg hover:border-slate-350 transition text-center space-y-1">
                                  <div className="font-mono font-bold text-slate-450 text-[9px] uppercase">Đấu Thủ #{idx + 1}</div>
                                  <span className="text-xs font-extrabold text-slate-800 block truncate">{ath.name}</span>
                                  {ath.nickname && <span className="text-[10px] text-slate-400 italic block truncate font-semibold">"{ath.nickname}"</span>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Seeding matchmaking guide and automated smart separator for tournament */}
                          {!(tourney.pairedTeams && tourney.pairedTeams.length > 0) && (
                            <div className="bg-indigo-50/50 border border-indigo-150 rounded-xl p-4 space-y-3 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
                              <div className="flex items-start gap-3">
                                <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <h5 className="font-bold text-xs text-indigo-950">Phân Phối Hạt Giống & Ghép Cặp Tự Động</h5>
                                  <p className="text-slate-600 text-[11px] leading-relaxed font-semibold">
                                    Hệ thống sẽ dựa trên các hạt giống đã được thiết lập (HG #1 - HG #{activeNumSeeds}) để tự động tản rải đồng đều các vận động viên hạt giống này vào các đội khác nhau, tránh đụng độ sớm ở vòng bảng, sau đó ghép ngẫu nhiên họ với các tuyển thủ tự do còn lại.
                                  </p>
                                </div>
                              </div>
                              
                              <div className="pt-1 flex flex-wrap items-center gap-3">
                                {assignedList.length === requiredAthletesCount ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSmartPairTeams(tourney)}
                                    className={
                                      (!tourney.pairedTeams || tourney.pairedTeams.length === 0)
                                        ? "bg-violet-600 hover:bg-violet-550 text-white font-extrabold px-6 py-3 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-violet-350 active:scale-95 duration-150 ring-4 ring-violet-400 animate-pulse scale-105 border border-violet-400"
                                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-5 py-2.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-2 border border-slate-300 shadow-sm"
                                    }
                                  >
                                    <Swords className="h-4 w-4" /> Bốc cặp & Chia đội theo Hạt Giống
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="bg-slate-200 border border-slate-350 text-slate-400 font-bold px-4 py-2 rounded-lg text-xs cursor-not-allowed flex items-center gap-1.5 opacity-75"
                                    title={`Vui lòng tuyển chọn đủ đúng ${requiredAthletesCount} VĐV ở Bước 1`}
                                  >
                                    <Swords className="h-4 w-4 text-slate-400" /> Bốc cặp & Chia đội theo Hạt Giống
                                  </button>
                                )}
                                
                                <span className="text-[10px] text-slate-500 font-bold font-mono uppercase tracking-wider bg-indigo-100/60 px-2.5 py-1 rounded-md border border-indigo-250">
                                  Đã gán: {assignedList.filter(a => a.seed && a.seed <= activeNumSeeds).length} hạt giống hợp lệ
                                </span>

                                {assignedList.length !== requiredAthletesCount && (
                                  <span className="text-[10px] text-amber-600 font-bold italic animate-pulse">
                                    (Vui lòng tuyển đủ {assignedList.length} / {requiredAthletesCount} VĐV ở Bước 1 để làm sáng nút bốc cặp)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Synchronized indicator */}
                          {assignedList.length === requiredAthletesCount && (
                            <div className="flex justify-between items-center bg-blue-50 border border-blue-105 rounded-xl p-3 md:p-4 text-xs select-none">
                              <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-blue-600 shrink-0" />
                                <span className="text-blue-850 font-bold">
                                  Hồ sơ VĐV ghi danh đã khớp hoàn toàn chỉ tiêu đề ra ({requiredAthletesCount} / {requiredAthletesCount} VĐV). Sẵn sàng bốc thăm!
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Display paired teams list below */}
                          {tourney.pairedTeams && tourney.pairedTeams.length > 0 && (
                            <div className="mt-6 space-y-4 border-t border-slate-200 pt-5 animate-in fade-in duration-300">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="space-y-0.5">
                                  <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                                    <span className="p-1 bg-violet-100 text-violet-700 rounded select-none">
                                      <Users className="h-4 w-4" />
                                    </span>
                                    DANH SÁCH ĐỘI VỪA CHIA TỰ ĐỘNG ({tourney.pairedTeams.length} ĐỘI)
                                  </h4>
                                  <p className="text-[11px] text-slate-500 font-medium select-none">
                                    Đội hình được tản rải sòng phẳng theo hạt giống. Bạn có thể <span className="text-violet-600 font-bold bg-violet-50 px-1 rounded">kéo thả (drag & drop) VĐV</span> giữa các đội để hoán đổi nhân sự thuận tiện, hoặc gõ sửa trực tiếp tên đội!
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 select-none shrink-0">
                                  {draft && (
                                    <button
                                      type="button"
                                      onClick={() => handleSaveTeamChanges(tourney)}
                                      className="bg-emerald-600 hover:bg-emerald-550 text-white font-extrabold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-250 animate-pulse border border-emerald-550"
                                    >
                                      <CheckCircle className="h-4 w-4" /> Lưu Thay Đổi Đội
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleSmartPairTeams(tourney)}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-sm shadow-amber-100 select-none"
                                  >
                                    <Shuffle className="h-3.5 w-3.5" /> Bốc lại & Chia lại đội
                                  </button>
                                </div>
                              </div>

                              {(() => {
                                const activeFormat = draft?.format || tourney.format;
                                const numGroups = draft?.numGroups || tourney.numGroups || 2;
                                const groupKeys = ['A', 'B', 'C', 'D'].slice(0, numGroups);

                                if (activeFormat === 'GROUP_KNOCKOUT') {
                                  return (
                                    <div className="space-y-8 pb-4">
                                      {groupKeys.map(groupKey => {
                                        const groupTeams = (draft?.pairedTeams || tourney.pairedTeams || [])
                                          .map((pt, idx) => ({ pt, idx }))
                                          .filter(({ pt, idx }) => {
                                            const computedGroup = pt.group || (idx % numGroups === 0 ? 'A' : (idx % numGroups === 1 ? 'B' : (idx % numGroups === 2 ? 'C' : 'D')));
                                            return computedGroup === groupKey;
                                          });

                                        return (
                                          <div key={groupKey} className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                                            <div className="flex items-center justify-between border-b border-slate-205 pb-2 select-none">
                                              <h5 className="font-extrabold text-xs md:text-sm text-blue-700 flex items-center gap-2 uppercase tracking-wide">
                                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                                                BẢNG {groupKey} ({groupTeams.length} ĐỘI)
                                              </h5>
                                              <span className="text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                VÒNG ĐẤU BẢNG
                                              </span>
                                            </div>

                                            {groupTeams.length === 0 ? (
                                              <div className="text-xs text-slate-400 italic py-6 text-center bg-white rounded-xl border border-slate-100">
                                                Chưa có đội nào thuộc bảng {groupKey}. Hãy chọn ở menu dưới của đội để dời vào đây!
                                              </div>
                                            ) : (
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                {groupTeams.map(({ pt, idx }) => {
                                                  const teamAthletes = pt.athleteIds
                                                    .map(id => assignedList.find(a => a.id === id))
                                                    .filter(Boolean) as Athlete[];

                                                  const isEditing = editingTeamId === pt.id;

                                                  return (
                                                    <div key={pt.id} className="bg-white border-2 border-slate-150 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-blue-300 hover:shadow-xs transition relative overflow-hidden">
                                                      <div className="absolute top-2 right-2 select-none">
                                                        <span className="text-[9px] bg-slate-100 font-extrabold px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                                                          Đội #{idx + 1}
                                                        </span>
                                                      </div>

                                                      <div className="space-y-3 pt-1">
                                                        {/* Team Name with Quick Edit */}
                                                        <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                                                          {isEditing ? (
                                                            <div className="flex items-center gap-1.5 w-full">
                                                              <input
                                                                type="text"
                                                                value={editingTeamName}
                                                                onChange={(e) => setEditingTeamName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                  if (e.key === 'Enter') {
                                                                    handleSaveTeamName(tourney, pt.id);
                                                                  } else if (e.key === 'Escape') {
                                                                    setEditingTeamId(null);
                                                                  }
                                                                }}
                                                                className="bg-white border border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-2 py-0.5 text-xs font-bold text-slate-800 w-full"
                                                                autoFocus
                                                              />
                                                              <button
                                                                type="button"
                                                                onClick={() => handleSaveTeamName(tourney, pt.id)}
                                                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-1 rounded transition text-[10px] shrink-0"
                                                                title="Lưu"
                                                              >
                                                                <Check className="h-3 w-3" />
                                                              </button>
                                                              <button
                                                                type="button"
                                                                onClick={() => setEditingTeamId(null)}
                                                                className="bg-slate-150 hover:bg-slate-250 text-slate-500 font-bold p-1 rounded transition text-[10px] shrink-0"
                                                                title="Hủy"
                                                              >
                                                                X
                                                              </button>
                                                            </div>
                                                          ) : (
                                                            <div className="flex items-center justify-between gap-1 w-full group/title select-none">
                                                              <span className="font-extrabold text-xs text-slate-800 truncate pr-4" title={pt.name}>
                                                                {pt.name}
                                                              </span>
                                                              <button
                                                                type="button"
                                                                onClick={() => {
                                                                  setEditingTeamId(pt.id);
                                                                  setEditingTeamName(pt.name);
                                                                }}
                                                                className="text-slate-400 hover:text-violet-600 p-1 rounded hover:bg-slate-50 transition shrink-0 opacity-100 sm:opacity-0 sm:group-hover/title:opacity-100 focus:opacity-100"
                                                                title="Sửa nhanh tên"
                                                              >
                                                                <Edit className="h-3 w-3" />
                                                              </button>
                                                            </div>
                                                          )}
                                                        </div>

                                                        {/* Athletes list inside paired team */}
                                                        <div className="space-y-1.5 text-xs font-semibold">
                                                          {teamAthletes.length === 0 ? (
                                                            <div className="text-[10px] text-slate-400 italic">Chờ ghép vận động viên...</div>
                                                          ) : (
                                                            teamAthletes.map(ath => {
                                                              const isCurrentlyDragged = draggedAthleteId === ath.id;
                                                              const isHoveredTarget = hoveredAthleteId === ath.id;

                                                              return (
                                                                <div 
                                                                  key={ath.id} 
                                                                  draggable={true}
                                                                  onDragStart={(e) => {
                                                                    setDraggedAthleteId(ath.id);
                                                                    setDraggedTeamId(pt.id);
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                  }}
                                                                  onDragOver={(e) => {
                                                                    e.preventDefault();
                                                                  }}
                                                                  onDragEnter={(e) => {
                                                                    e.preventDefault();
                                                                    if (draggedAthleteId && draggedAthleteId !== ath.id && draggedTeamId !== pt.id) {
                                                                      setHoveredAthleteId(ath.id);
                                                                    }
                                                                  }}
                                                                  onDragLeave={() => {
                                                                    if (hoveredAthleteId === ath.id) {
                                                                      setHoveredAthleteId(null);
                                                                    }
                                                                  }}
                                                                  onDragEnd={() => {
                                                                    setDraggedAthleteId(null);
                                                                    setDraggedTeamId(null);
                                                                    setHoveredAthleteId(null);
                                                                  }}
                                                                  onDrop={(e) => {
                                                                    e.preventDefault();
                                                                    if (draggedAthleteId && draggedTeamId && draggedTeamId !== pt.id && draggedAthleteId !== ath.id) {
                                                                      handleSwapAthletes(tourney, draggedTeamId, draggedAthleteId, pt.id, ath.id);
                                                                    }
                                                                    setDraggedAthleteId(null);
                                                                    setDraggedTeamId(null);
                                                                    setHoveredAthleteId(null);
                                                                  }}
                                                                  className={`p-2 rounded-lg flex items-center justify-between gap-1.5 shadow-3xs transition-all duration-150 cursor-grab active:cursor-grabbing border ${
                                                                    isCurrentlyDragged 
                                                                      ? 'opacity-30 bg-slate-100 border-dashed border-slate-400 scale-95 shadow-none' 
                                                                      : isHoveredTarget 
                                                                        ? 'bg-blue-100 border-blue-500 border-dashed ring-2 ring-blue-200 scale-[1.02] font-semibold animate-pulse' 
                                                                        : 'bg-slate-50/70 border-slate-100 hover:border-blue-300 hover:bg-blue-50/40'
                                                                  }`}
                                                                  title="Kéo thả VĐV này để đổi chỗ"
                                                                >
                                                                  <div className="flex items-center gap-1 truncate">
                                                                    <GripVertical className="h-3 w-3 text-slate-400 shrink-0 cursor-grab" />
                                                                    <div className="space-y-0.5 truncate">
                                                                      <div className="flex items-center gap-1.5">
                                                                        <span className="text-xs font-bold text-slate-800 block truncate" title={ath.name}>
                                                                          {ath.name}
                                                                        </span>
                                                                        <span className={`text-[9px] font-bold px-1 rounded-full ${ath.gender === 'Nữ' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                                          {ath.gender === 'Nữ' ? 'Nữ' : 'Nam'}
                                                                        </span>
                                                                      </div>
                                                                      {ath.nickname && (
                                                                        <span className="text-[9px] text-slate-450 italic font-semibold block leading-none">
                                                                          "{ath.nickname}"
                                                                        </span>
                                                                      )}
                                                                    </div>
                                                                  </div>

                                                                  {ath.seed && ath.seed <= activeNumSeeds ? (
                                                                    <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 select-none">
                                                                      <span>{SEED_EMBLEMS[ath.seed] || '⭐'}</span> HG #{ath.seed}
                                                                    </span>
                                                                  ) : null}
                                                                </div>
                                                              );
                                                            })
                                                          )}
                                                        </div>

                                                        {/* Group assignment switcher */}
                                                        <div className="flex items-center justify-between gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[10px] select-none">
                                                          <span className="text-slate-500 font-bold">Chuyển sang Bảng:</span>
                                                          <select
                                                            value={pt.group || (idx % numGroups === 0 ? 'A' : (idx % numGroups === 1 ? 'B' : (idx % numGroups === 2 ? 'C' : 'D')))}
                                                            onChange={(e) => handleUpdateTeamGroup(tourney, pt.id, e.target.value)}
                                                            className="bg-slate-100 border border-slate-200 text-slate-850 font-bold rounded px-1.5 py-0.5 select-none focus:outline-none focus:bg-white cursor-pointer hover:bg-slate-200 transition"
                                                          >
                                                            {groupKeys.map(k => (
                                                              <option key={k} value={k}>Bảng {k}</option>
                                                            ))}
                                                          </select>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                }

                                // Normal Round Robin or Knockout rendering (without group boards)
                                return (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-1">
                                    {(draft?.pairedTeams || tourney.pairedTeams || []).map((pt, index) => {
                                      const teamAthletes = pt.athleteIds
                                        .map(id => assignedList.find(a => a.id === id))
                                        .filter(Boolean) as Athlete[];

                                      const isEditing = editingTeamId === pt.id;

                                      return (
                                        <div key={pt.id} className="bg-white border-2 border-slate-100 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-violet-200 transition shadow-3xs hover:shadow-xs relative overflow-hidden">
                                          <div className="absolute top-2 right-2 select-none">
                                            <span className="text-[9px] bg-slate-100 font-extrabold px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                                              Đội #{index + 1}
                                            </span>
                                          </div>

                                          <div className="space-y-3 pt-1">
                                            {/* Team Name with Quick Edit */}
                                            <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                                              {isEditing ? (
                                                <div className="flex items-center gap-1.5 w-full">
                                                  <input
                                                    type="text"
                                                    value={editingTeamName}
                                                    onChange={(e) => setEditingTeamName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                        handleSaveTeamName(tourney, pt.id);
                                                      } else if (e.key === 'Escape') {
                                                        setEditingTeamId(null);
                                                      }
                                                    }}
                                                    className="bg-white border border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-2 py-0.5 text-xs font-bold text-slate-800 w-full"
                                                    autoFocus
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => handleSaveTeamName(tourney, pt.id)}
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-1 rounded transition text-[10px] shrink-0"
                                                    title="Lưu"
                                                  >
                                                    <Check className="h-3 w-3" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => setEditingTeamId(null)}
                                                    className="bg-slate-150 hover:bg-slate-250 text-slate-500 font-bold p-1 rounded transition text-[10px] shrink-0"
                                                    title="Hủy"
                                                  >
                                                    X
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center justify-between gap-1 w-full group/title select-none">
                                                  <span className="font-extrabold text-xs text-slate-800 truncate pr-4" title={pt.name}>
                                                    {pt.name}
                                                  </span>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setEditingTeamId(pt.id);
                                                      setEditingTeamName(pt.name);
                                                    }}
                                                    className="text-slate-400 hover:text-violet-600 p-1 rounded hover:bg-slate-50 transition shrink-0 opacity-100 sm:opacity-0 sm:group-hover/title:opacity-100 focus:opacity-100"
                                                    title="Sửa nhanh tên"
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>

                                            {/* Athletes list inside paired team */}
                                            <div className="space-y-1.5 text-xs font-semibold">
                                              {teamAthletes.length === 0 ? (
                                                <div className="text-[10px] text-slate-400 italic">Chờ ghép vận động viên...</div>
                                              ) : (
                                                teamAthletes.map(ath => {
                                                  const isCurrentlyDragged = draggedAthleteId === ath.id;
                                                  const isHoveredTarget = hoveredAthleteId === ath.id;

                                                  return (
                                                    <div 
                                                      key={ath.id} 
                                                      draggable={true}
                                                      onDragStart={(e) => {
                                                        setDraggedAthleteId(ath.id);
                                                        setDraggedTeamId(pt.id);
                                                        e.dataTransfer.effectAllowed = 'move';
                                                      }}
                                                      onDragOver={(e) => {
                                                        e.preventDefault();
                                                      }}
                                                      onDragEnter={(e) => {
                                                        e.preventDefault();
                                                        if (draggedAthleteId && draggedAthleteId !== ath.id && draggedTeamId !== pt.id) {
                                                          setHoveredAthleteId(ath.id);
                                                        }
                                                      }}
                                                      onDragLeave={() => {
                                                        if (hoveredAthleteId === ath.id) {
                                                          setHoveredAthleteId(null);
                                                        }
                                                      }}
                                                      onDragEnd={() => {
                                                        setDraggedAthleteId(null);
                                                        setDraggedTeamId(null);
                                                        setHoveredAthleteId(null);
                                                      }}
                                                      onDrop={(e) => {
                                                        e.preventDefault();
                                                        if (draggedAthleteId && draggedTeamId && draggedTeamId !== pt.id && draggedAthleteId !== ath.id) {
                                                          handleSwapAthletes(tourney, draggedTeamId, draggedAthleteId, pt.id, ath.id);
                                                        }
                                                        setDraggedAthleteId(null);
                                                        setDraggedTeamId(null);
                                                        setHoveredAthleteId(null);
                                                      }}
                                                      className={`p-2 rounded-lg flex items-center justify-between gap-1.5 shadow-3xs transition-all duration-150 cursor-grab active:cursor-grabbing border ${
                                                        isCurrentlyDragged 
                                                          ? 'opacity-30 bg-slate-100 border-dashed border-slate-400 scale-95 shadow-none' 
                                                          : isHoveredTarget 
                                                            ? 'bg-violet-100 border-violet-500 border-dashed ring-2 ring-violet-200 scale-[1.02] font-semibold animate-pulse' 
                                                            : 'bg-slate-50/70 border-slate-100 hover:border-violet-300 hover:bg-violet-50/40'
                                                      }`}
                                                      title="Kéo thả VĐV này để đổi chỗ"
                                                    >
                                                      <div className="flex items-center gap-1 truncate">
                                                        <GripVertical className="h-3 w-3 text-slate-400 shrink-0 cursor-grab" />
                                                        <div className="space-y-0.5 truncate">
                                                          <div className="flex items-center gap-1.5">
                                                            <span className="text-xs font-bold text-slate-800 block truncate" title={ath.name}>
                                                              {ath.name}
                                                            </span>
                                                            <span className={`text-[9px] font-bold px-1 rounded-full ${ath.gender === 'Nữ' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-blue-50 text-blue-600 border border-blue-105'}`}>
                                                              {ath.gender === 'Nữ' ? 'Nữ' : 'Nam'}
                                                            </span>
                                                          </div>
                                                          {ath.nickname && (
                                                            <span className="text-[9px] text-slate-450 italic font-semibold block leading-none">
                                                              "{ath.nickname}"
                                                            </span>
                                                          )}
                                                        </div>
                                                      </div>

                                                      {ath.seed && ath.seed <= activeNumSeeds ? (
                                                        <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[8px] font-mono font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shrink-0 select-none">
                                                          <span>{SEED_EMBLEMS[ath.seed] || '⭐'}</span> HG #{ath.seed}
                                                        </span>
                                                      ) : null}
                                                    </div>
                                                  );
                                                })
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 4: Comprehensive Bracket Drawing */}
                  {!tourney.playingDays || tourney.playingDays.length === 0 ? (
                    <div className="space-y-3 pt-4">
                      <div className="flex items-center justify-between select-none">
                        <h4 className="text-xs font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-bold">
                          <Swords className="h-4 w-4 text-slate-400" />
                          SƠ ĐỒ TOÀN BỘ CÁC TRẬN ĐẤU & NHÁNH ĐẤU ĐÃ LẬP
                        </h4>
                      </div>
                      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-6 text-center shadow-3xs max-w-2xl mx-auto my-3">
                        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2 animate-bounce" />
                        <h5 className="font-bold text-amber-900 text-xs uppercase tracking-wider">Chưa chọn ngày thi đấu nào!</h5>
                        <p className="text-amber-705 text-[11px] mt-1.5 leading-relaxed font-semibold">
                          Giải đấu này hiện không có ngày thi đấu nào được lựa chọn. Lịch thi đấu đã được reset rỗng và sơ đồ toàn bộ trận đấu tạm thời không hiển thị.
                          <br />
                          Vui lòng quay lại tab <strong className="text-indigo-700">"Quản Lý Giải Đấu"</strong> để thiết lập các mốc ngày thi đấu phù hợp.
                        </p>
                      </div>
                    </div>
                  ) : tourney.status !== 'PLANNING' && (koMatches.length > 0 || groupMatches.length > 0) && (
                    <div className="space-y-3 pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
                        <div className="space-y-0.5 text-left">
                          <h4 className="text-xs font-mono tracking-widest text-slate-500 uppercase flex items-center gap-1.5 font-bold">
                            <Swords className="h-4 w-4 text-blue-600" />
                            SƠ ĐỒ TOÀN BỘ CÁC TRẬN ĐẤU & NHÁNH ĐẤU ĐÃ LẬP
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold italic">Sắp xếp các trận đấu từ vòng bảng/vòng tròn cho đến chung kết trực tiếp</p>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-6 overflow-x-auto shadow-xs">
                        <div className="flex items-stretch min-w-[950px] justify-start py-4 gap-6 select-none">
                          
                          {/* Column 0: Group Stage / Round Robin Matches - Parallelized by Group Boards */}
                          {groupMatches.length > 0 && (
                            <>
                              {(() => {
                                // Extract unique group names sorted in standard order
                                const groupNames = Array.from(new Set(groupMatches.map(m => m.groupName || 'Vòng Bảng'))).sort();
                                return (
                                  <div className="flex gap-4 items-stretch">
                                    {groupNames.map((gName) => {
                                      const filteredGroupMatches = groupMatches.filter(m => (m.groupName || 'Vòng Bảng') === gName);
                                      return (
                                        <div key={gName} className="flex flex-col justify-start min-h-[380px] text-left w-[320px] border border-slate-200 bg-slate-50/20 rounded-xl p-3 shrink-0 shadow-3xs">
                                          <div className="text-[10px] font-mono text-slate-500 font-extrabold uppercase tracking-widest text-center border-b border-indigo-150 bg-indigo-50/50 py-1.5 rounded-md mb-3">
                                            {gName}
                                          </div>
                                          <div className="flex-1 space-y-2.5">
                                            {filteredGroupMatches.map((m) => (
                                              <div key={m.id} className="bg-white border border-slate-200 p-2.5 rounded-xl space-y-1.5 shadow-3xs transition hover:border-blue-300">
                                                {renderBracketMatchNode(m, getDynamicTeamName, false, handleOpenCourtEdit, tourney)}
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
                            <div className="w-[185px] shrink-0 flex flex-col justify-start self-stretch text-left">
                              <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center border-b border-slate-100 pb-1 mr-2 mb-4">
                                Vòng Tứ Kết
                              </div>
                              <div className="flex-1 flex flex-col justify-center space-y-4 pr-2">
                                {level3Quarters.map((m) => (
                                  <div key={m.id} className="bg-slate-55 border border-slate-200 p-2.5 rounded-xl space-y-2 shadow-xs transition hover:border-slate-350">
                                    {renderBracketMatchNode(m, getDynamicTeamName, false, handleOpenCourtEdit, tourney)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Connector line icon */}
                          {level3Quarters.length > 0 && <ChevronRight className="h-4 w-4 text-slate-300 self-center shrink-0" />}

                          {/* Column 2: Semifinals */}
                          {((tourney.format !== 'ROUND_ROBIN' && tourney.format !== 'GROUP_KNOCKOUT') || tourney.hasSemis !== false) ? (
                            <>
                              <div className="w-[185px] shrink-0 flex flex-col justify-start self-stretch text-left">
                                <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center border-b border-slate-100 pb-1 mr-2 mb-4">
                                  Vòng Bán Kết
                                </div>
                                <div className="flex-1 flex flex-col justify-center space-y-6 pr-2">
                                  {level2Semis.length === 0 ? (
                                    <>
                                      <div className="bg-slate-50 border border-dashed border-slate-200 p-2.5 rounded-xl space-y-2 shadow-xs opacity-75">
                                        {renderBracketMatchNode({
                                          id: `match-ko-${tourney.id}-semi1`,
                                          stage: 'KNOCKOUT',
                                          team1Id: null,
                                          team2Id: null,
                                          scoreSets: [],
                                          status: 'PENDING',
                                          court: 'Sân Trung Tâm',
                                          scheduledTime: null
                                        }, getDynamicTeamName, false, undefined, tourney)}
                                      </div>
                                      <div className="bg-slate-50 border border-dashed border-slate-200 p-2.5 rounded-xl space-y-2 shadow-xs opacity-75">
                                        {renderBracketMatchNode({
                                          id: `match-ko-${tourney.id}-semi2`,
                                          stage: 'KNOCKOUT',
                                          team1Id: null,
                                          team2Id: null,
                                          scoreSets: [],
                                          status: 'PENDING',
                                          court: 'Sân Trung Tâm',
                                          scheduledTime: null
                                        }, getDynamicTeamName, false, undefined, tourney)}
                                      </div>
                                    </>
                                  ) : (
                                    level2Semis.map((m) => (
                                      <div key={m.id} className="bg-slate-55 border border-slate-200 p-2.5 rounded-xl space-y-2 shadow-xs transition hover:border-slate-350">
                                        {renderBracketMatchNode(m, getDynamicTeamName, false, handleOpenCourtEdit, tourney)}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              <ChevronRight className="h-4 w-4 text-slate-300 self-center shrink-0" />
                            </>
                          ) : null}

                          {/* Column 3: Finals & Third-Place Game */}
                          <div className="w-[185px] shrink-0 flex flex-col justify-start self-stretch text-left">
                            <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center border-b border-slate-100 pb-1 mb-4">
                              VÒNG CHUNG KẾT
                            </div>
                            <div className="flex-1 flex flex-col justify-center space-y-6">
                              <div className="space-y-4">
                                {level1Finals.length === 0 ? (
                                   <div className="bg-gradient-to-b from-blue-50/5 to-blue-50/30 border border-dashed border-blue-200 p-3 rounded-xl space-y-2 shadow-sm relative opacity-75">
                                     <span className="absolute -top-2.5 right-3 bg-slate-400 text-white text-[8px] font-mono font-extrabold px-2 py-0.5 rounded uppercase shadow-xs">
                                       Tranh Cúp Vàng
                                     </span>
                                     {renderBracketMatchNode({
                                       id: `match-ko-${tourney.id}-final`,
                                       stage: 'KNOCKOUT',
                                       team1Id: null,
                                       team2Id: null,
                                       isFinal: true,
                                       scoreSets: [],
                                       status: 'PENDING',
                                       court: 'Sân Trung Tâm',
                                       scheduledTime: null
                                     }, getDynamicTeamName, true, undefined, tourney)}
                                   </div>
                                 ) : (
                                  level1Finals.map((m) => (
                                    <div key={m.id} className="bg-gradient-to-b from-blue-50/10 to-blue-50/60 border-2 border-blue-400 p-3 rounded-xl space-y-2 shadow-sm relative">
                                      <span className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[8px] font-mono font-extrabold px-2 py-0.5 rounded uppercase shadow-xs">
                                        Tranh Cúp Vàng
                                      </span>
                                      {renderBracketMatchNode(m, getDynamicTeamName, true, handleOpenCourtEdit, tourney)}
                                    </div>
                                  ))
                                )}
                              </div>

                              {level1ThirdPlace.length === 0 ? (
                                <div className="space-y-4 pt-4 border-t border-slate-150 border-dashed">
                                  <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center border-b border-slate-100 pb-1">
                                    TRANH HẠNG BA
                                  </div>
                                  <div className="bg-slate-50 border border-dashed border-slate-200 p-2.5 rounded-xl space-y-2 shadow-xs opacity-75">
                                    <span className="text-[8px] bg-slate-400 text-white px-1.5 py-0.5 rounded font-mono font-extrabold uppercase shrink-0 mb-1 inline-block">
                                      Hạng 3
                                    </span>
                                    {renderBracketMatchNode({
                                      id: `match-ko-${tourney.id}-third`,
                                      stage: 'KNOCKOUT',
                                      team1Id: null,
                                      team2Id: null,
                                      isThirdPlace: true,
                                      round: 1.5,
                                      scoreSets: [],
                                      status: 'PENDING',
                                      court: 'Sân Số 2',
                                      scheduledTime: null
                                    }, getDynamicTeamName, false, undefined, tourney)}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-4 pt-4 border-t border-slate-150 border-dashed">
                                  <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest text-center border-b border-slate-100 pb-1">
                                    TRANH HẠNG BA
                                  </div>
                                  {level1ThirdPlace.map((m) => (
                                    <div key={m.id} className="bg-slate-55 border border-slate-200 p-2.5 rounded-xl space-y-2 shadow-xs transition hover:border-slate-350">
                                      <span className="text-[8px] bg-slate-500 text-white px-1.5 py-0.2 rounded font-mono font-extrabold uppercase shrink-0 mb-1 inline-block font-bold">
                                        Hạng 3
                                      </span>
                                      {renderBracketMatchNode(m, getDynamicTeamName, false, handleOpenCourtEdit, tourney)}
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
              )}
            </div>
          );
        })}
      </div>

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
                  className="text-slate-400 hover:text-slate-600 font-bold text-base cursor-pointer px-1.5 rounded hover:bg-slate-100 transition duration-150"
                >
                  ✕
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
                    placeholder="Ví dụ: Sân VIP 1, Sân A, Sân Hoà Bình..."
                    className="w-full bg-slate-55 border border-slate-250 text-slate-850 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-600 focus:bg-white font-semibold shadow-inner"
                  />
                </div>
              </div>

              {/* Dynamic Warning Notification Blocks */}
              {conflicts.length > 0 && (
                <div className="bg-rose-50 border border-rose-250 text-rose-800 rounded-xl p-3.5 space-y-2.5 max-h-[170px] overflow-y-auto">
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
                              className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer text-[8px] font-bold text-white px-1.5 py-0.5 rounded transition"
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
                          className="bg-indigo-600 hover:bg-indigo-500 cursor-pointer text-[8px] font-bold text-white px-2 py-0.5 rounded transition uppercase border-none"
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

const isSetCompleted = (
  setScore: { team1Score: number; team2Score: number }, 
  setIdx: number, 
  tourney: any, 
  isFinalOr3rd: boolean
): boolean => {
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

// Draw bracket node containing team titles and matching sets scores
function renderBracketMatchNode(
  match: any, 
  getTeamName: (id: string | null, match?: any, position?: 'team1' | 'team2') => string, 
  isGoldMatch = false,
  onEditCourt?: (matchId: string, currentCourt: string) => void,
  tourney?: any
) {
  const getScoreStr = (teamIdx: 1 | 2) => {
    if (!match.scoreSets || match.scoreSets.length === 0) return '0';
    let setsWon = 0;
    const isFinalOr3rd = !!(match.isFinal || match.isThirdPlace);
    match.scoreSets.forEach((set: any, idx: number) => {
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
    return `${match.scoreSets.map((s: any) => `${s.team1Score}-${s.team2Score}`).join(', ')}`;
  };

  const isT1Winner = match.winnerId && match.winnerId === match.team1Id;
  const isT2Winner = match.winnerId && match.winnerId === match.team2Id;

  // Highlight if live score is active
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
    <div className={`text-xs space-y-2 ${isGoldMatch ? 'py-1' : ''} ${isLive ? 'relative' : ''}`}>
      
      {/* Top Header Row: Round & Status Badge */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono font-black uppercase tracking-wider select-none border-b border-slate-100 pb-1.5 mb-1.5">
        <span>{getRoundLabel()}</span>
        <span className={isLive ? 'text-rose-600 font-extrabold animate-pulse' : match.status === 'COMPLETED' ? 'text-blue-600 font-bold' : 'text-slate-400'}>
          {isLive ? '● TRỰC TIẾP' : match.status === 'COMPLETED' ? 'Đã Kết Thúc' : 'Chờ Đấu'}
        </span>
      </div>

      {/* Structured & Elegant Scheduled Time + Court Details Row */}
      <div className="flex flex-wrap items-center gap-1.5 select-none pt-0.5">
        {/* Time Badge */}
        {match.scheduledTime ? (
          <div className="flex items-center gap-1 text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded-md font-mono font-extrabold uppercase tracking-wide select-none">
            <Clock className="h-2.5 w-2.5 text-indigo-500 shrink-0" />
            <span className="truncate">{formatScheduledTime(match.scheduledTime)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[9px] text-slate-450 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md font-mono font-medium uppercase tracking-wide select-none">
            <Clock className="h-2.5 w-2.5 text-slate-400 shrink-0" />
            <span>Chưa xếp lịch</span>
          </div>
        )}

        {/* Court Badge */}
        <div className="flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-150 px-1.5 py-0.5 rounded-md font-mono font-extrabold uppercase tracking-wide select-none">
          <MapPin className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
          <span className="truncate">Sân: {match.court || 'Sắp xếp'}</span>
          {onEditCourt && match.id && !match.id.startsWith('dummy') && (
            <button
              onClick={() => onEditCourt(match.id, match.court || '')}
              className="text-blue-600 hover:text-blue-800 bg-blue-100/50 hover:bg-blue-150/70 ml-1 px-1 py-[0.5px] rounded transition cursor-pointer text-[8px] font-sans font-black tracking-normal"
              title="Đổi sân cho cặp đấu này"
            >
              Sửa
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {/* Team 1 */}
        <div className={`flex justify-between items-center px-2 py-1 bg-white rounded border border-slate-100 hover:bg-slate-50 transition ${
          isT1Winner ? 'text-blue-600 font-extrabold border-l-2 border-l-blue-600 shadow-xs' : isLive ? 'border-l-2 border-l-rose-500 bg-rose-50/10' : 'text-slate-600'
        }`}>
          <div className="flex items-center gap-1 flex-1 min-w-0 pr-2">
            {isLive && match.servingTeam === 1 && (
              <span className="bg-amber-100 text-amber-850 text-[8px] font-extrabold px-1 py-0.5 rounded animate-pulse shrink-0 select-none">🏸 GIAO</span>
            )}
            <span className="truncate font-semibold text-[11px]" title={getTeamName(match.team1Id, match, 'team1')}>{getTeamName(match.team1Id, match, 'team1')}</span>
          </div>
          <span className={`font-mono px-1 rounded text-[10px] shrink-0 ml-2 ${
            isT1Winner ? 'bg-blue-50 text-blue-600 font-bold' : isLive ? 'bg-rose-100 text-rose-700 font-extrabold shadow-3xs' : 'bg-slate-55 text-slate-400'
          }`}>
            {getScoreStr(1)}
          </span>
        </div>

        {/* Team 2 */}
        <div className={`flex justify-between items-center px-2 py-1 bg-white rounded border border-slate-100 hover:bg-slate-50 transition ${
          isT2Winner ? 'text-blue-600 font-extrabold border-l-2 border-l-blue-600 shadow-xs' : isLive ? 'border-l-2 border-l-rose-500 bg-rose-50/10' : 'text-slate-600'
        }`}>
          <div className="flex items-center gap-1 flex-1 min-w-0 pr-2">
            {isLive && match.servingTeam === 2 && (
              <span className="bg-amber-100 text-amber-850 text-[8px] font-extrabold px-1 py-0.5 rounded animate-pulse shrink-0 select-none">🏸 GIAO</span>
            )}
            <span className="truncate font-semibold text-[11px]" title={getTeamName(match.team2Id, match, 'team2')}>{getTeamName(match.team2Id, match, 'team2')}</span>
          </div>
          <span className={`font-mono px-1 rounded text-[10px] shrink-0 ml-2 ${
            isT2Winner ? 'bg-blue-50 text-blue-600 font-bold' : isLive ? 'bg-rose-100 text-rose-700 font-extrabold shadow-3xs' : 'bg-slate-55 text-slate-400'
          }`}>
            {getScoreStr(2)}
          </span>
        </div>
      </div>

      {match.scoreSets && match.scoreSets.length > 0 && (
        <div className={`text-[10px] font-mono font-bold tracking-wider text-right pt-0.5 select-none ${isLive ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
          {isLive ? 'Đang đánh: ' : ''}({getExactScoresStr()})
        </div>
      )}
    </div>
  );
}
