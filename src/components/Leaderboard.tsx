import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Medal, AlertCircle, Trophy, Flame, Zap, Sparkles } from 'lucide-react';
import { GroupStanding, Team, Match } from '../types';

// Helper calculating form trend (last 5 matches) and win/loss streak for a team
export function calculateTeamFormAndStreak(teamId: string, tournamentId: string, matches: Match[]) {
  const teamMatches = matches
    .filter(m => m.tournamentId === tournamentId && m.status === 'COMPLETED' && (m.team1Id === teamId || m.team2Id === teamId))
    .sort((a, b) => {
      if (a.scheduledTime && b.scheduledTime) {
        return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
      }
      return a.id.localeCompare(b.id);
    });

  const outcomes = teamMatches.map(m => (m.winnerId === teamId ? 'W' : 'L'));

  let streakType: 'W' | 'L' | null = null;
  let count = 0;
  for (let i = outcomes.length - 1; i >= 0; i--) {
    if (streakType === null) {
      streakType = outcomes[i] as 'W' | 'L';
      count = 1;
    } else if (outcomes[i] === streakType) {
      count++;
    } else {
      break;
    }
  }

  let streakText = '';
  let streakBadgeColor = '';
  if (streakType === 'W' && count >= 2) {
    streakText = `🔥 Thắng ${count} LT`;
    streakBadgeColor = 'bg-rose-50 border-rose-200 text-rose-700 font-bold';
  } else if (streakType === 'L' && count >= 2) {
    streakText = `❄️ Thua ${count} LT`;
    streakBadgeColor = 'bg-blue-55 border-blue-200 text-blue-800 font-bold';
  } else if (streakType === 'W' && count === 1) {
    streakText = 'Thắng gần nhất';
    streakBadgeColor = 'bg-slate-50 border-emerald-100 text-emerald-700';
  } else if (streakType === 'L' && count === 1) {
    streakText = 'Thua gần nhất';
    streakBadgeColor = 'bg-slate-50 border-rose-100 text-rose-600';
  }

  const last5 = outcomes.slice(-5);
  return { last5, streakText, streakBadgeColor };
}

interface RaceStandingItem {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  pointsWon: number;
  maxPossiblePoints: number;
  left: number;
  percentage: number;
  statusText: string;
  statusBadgeColor: string;
  stateType: 'SAFE' | 'BUBBLE' | 'DANGER' | 'ELIMINATED';
  scenarioText: string;
}

interface DeciderMatchAnalytics {
  match: Match;
  groupName: string;
  badge: 'TOP_CLASH' | 'DECIDER_MATCH' | 'MATCH_OF_ROUND';
  badgeLabel: string;
  badgeColorClass: string;
  team1Name: string;
  team2Name: string;
  t1CurrentRank: number;
  t2CurrentRank: number;
  scenarioT1Win: string;
  scenarioT2Win: string;
  hotnessFactor: number;
}

export default function Leaderboard() {
  const { tournaments, teams, matches, activeTournamentId } = useTournament();

  const [selectedTourneyId, setSelectedTourneyId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'standings' | 'race' | 'deciders'>('standings');

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
    }
  }, [activeTournamentId, tournaments]);

  const selectedTourney = activeTournaments.find(t => t.id === selectedTourneyId) || activeTournaments[0];

  // Helper calculating standings for a given group/bảng name
  const calculateGroupStandings = (grpName: string, groupTeamsList: Team[]): GroupStanding[] => {
    if (!selectedTourney) return [];

    const tMatches = matches.filter(m => m.tournamentId === selectedTourney.id && m.stage === 'GROUP' && m.groupName === grpName);

    const standingsMap: Record<string, GroupStanding> = {};

    // Initialize all teams in this group
    groupTeamsList.forEach(t => {
      standingsMap[t.id] = {
        teamId: t.id,
        teamName: t.name,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        setsWon: 0,
        setsLost: 0,
        pointsWon: 0,
        pointsDifference: 0 // rally points differential
      };
    });

    // Populate from finished games
    tMatches.forEach(m => {
      if (m.status !== 'COMPLETED' || !m.team1Id || !m.team2Id) return;

      const t1 = standingsMap[m.team1Id];
      const t2 = standingsMap[m.team2Id];

      if (!t1 || !t2) return; // robustness check

      t1.matchesPlayed++;
      t2.matchesPlayed++;

      const isT1MatchWinner = m.winnerId === m.team1Id;
      if (isT1MatchWinner) {
        t1.matchesWon++;
        t2.matchesLost++;
        t1.pointsWon += selectedTourney.pointsPerVictory;
      } else {
        t2.matchesWon++;
        t1.matchesLost++;
        t2.pointsWon += selectedTourney.pointsPerVictory;
      }

      // Sum set and rally score
      m.scoreSets.forEach(set => {
        // Sets aggregate
        if (set.team1Score > set.team2Score) {
          t1.setsWon++;
          t2.setsLost++;
        } else if (set.team2Score > set.team1Score) {
          t2.setsWon++;
          t1.setsLost++;
        }

        // Rally points cumulative differences
        t1.pointsDifference += (set.team1Score - set.team2Score);
        t2.pointsDifference += (set.team2Score - set.team1Score);
      });
    });

    // Sort standings according to rules
    return Object.values(standingsMap).sort((a, b) => {
      // 1. Points
      if (b.pointsWon !== a.pointsWon) return b.pointsWon - a.pointsWon;
      // 2. Matches Won
      if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
      // 3. Set Diff (sets won - sets lost)
      const aSetDiff = a.setsWon - a.setsLost;
      const bSetDiff = b.setsWon - b.setsLost;
      if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
      // 4. Rally Point Diff
      return b.pointsDifference - a.pointsDifference;
    });
  };

  // Helper calculating race to qualification probability and advice scenarios
  const calculateRaceData = (grpName: string, standings: GroupStanding[]): RaceStandingItem[] => {
    if (!selectedTourney) return [];

    const totalTeams = standings.length;
    const maxMatches = totalTeams - 1;
    const pointsPerWin = selectedTourney.pointsPerVictory || 2;
    
    // How many teams progress?
    let advanceCount = 2;
    if (selectedTourney.format === 'ROUND_ROBIN') {
      advanceCount = selectedTourney.hasSemis ? 4 : 1;
    } else if (selectedTourney.format === 'GROUP_KNOCKOUT') {
      advanceCount = selectedTourney.advancePerGroup || 2;
    }

    const items: RaceStandingItem[] = standings.map((row) => {
      const left = Math.max(0, maxMatches - row.matchesPlayed);
      const maxPossiblePoints = row.pointsWon + (left * pointsPerWin);
      
      return {
        teamId: row.teamId,
        teamName: row.teamName,
        matchesPlayed: row.matchesPlayed,
        matchesWon: row.matchesWon,
        matchesLost: row.matchesLost,
        pointsWon: row.pointsWon,
        maxPossiblePoints,
        left,
        percentage: 50,
        statusText: 'Cạnh tranh trực tiếp',
        statusBadgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        stateType: 'BUBBLE',
        scenarioText: ''
      };
    });

    items.forEach((item, idx) => {
      const otherMaxPossiblePoints = items
        .filter((_, oIdx) => oIdx !== idx)
        .map(it => it.maxPossiblePoints)
        .sort((a, b) => b - a);

      const otherCurrentPoints = items
        .filter((_, oIdx) => oIdx !== idx)
        .map(it => it.pointsWon)
        .sort((a, b) => b - a);

      const cutoffMaxOfOthers = otherMaxPossiblePoints[advanceCount - 1] || 0;
      const isGuaranteedSecure = item.pointsWon > cutoffMaxOfOthers;

      const cutoffCurrentOfOthers = otherCurrentPoints[advanceCount - 1] || 0;
      const isGuaranteedEliminated = item.maxPossiblePoints < cutoffCurrentOfOthers;

      let percentage = 50;
      let stateType: 'SAFE' | 'BUBBLE' | 'DANGER' | 'ELIMINATED' | string = 'BUBBLE';
      let statusText = '⚠️ Cạnh tranh trực tiếp';
      let statusBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';

      if (totalTeams <= advanceCount) {
        percentage = 100;
        stateType = 'SAFE';
        statusText = 'Đội an toàn (Chắc suất)';
        statusBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      } else if (isGuaranteedSecure) {
        percentage = 100;
        stateType = 'SAFE';
        statusText = `✅ Đã chắc suất (${selectedTourney.format === 'ROUND_ROBIN' && selectedTourney.hasSemis ? 'Bán kết' : 'Vé Vàng'})`;
        statusBadgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-250';
      } else if (isGuaranteedEliminated) {
        percentage = 0;
        stateType = 'ELIMINATED';
        statusText = '❌ Đã hết cơ hội';
        statusBadgeColor = 'bg-slate-100 text-slate-500 border-slate-200';
      } else {
        if (idx < advanceCount) {
          stateType = 'SAFE';
          statusText = '✅ Đang an toàn';
          statusBadgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

          const leadPoints = item.pointsWon - (items[advanceCount]?.pointsWon || 0);
          const ratio = item.left === 0 ? 1 : Math.min(1, leadPoints / (item.left * pointsPerWin || 1));
          const computed = 50 + Math.round(ratio * 35) + (item.matchesWon * 2);
          percentage = Math.min(99, Math.max(51, computed));
        } else {
          stateType = 'DANGER';
          statusText = '⚠️ Đội nguy hiểm';
          statusBadgeColor = 'bg-orange-50 text-orange-850 border-orange-200';
          
          const maxLeft = item.left;
          if (maxLeft === 1) {
            statusText = '🔥 Phải thắng trận cuối';
            statusBadgeColor = 'bg-rose-50 text-rose-700 border-rose-220 animate-pulse font-extrabold';
          }
          
          const defPoints = (items[advanceCount - 1]?.pointsWon || 0) - item.pointsWon;
          const potential = item.maxPossiblePoints - (items[advanceCount - 1]?.pointsWon || 0);
          if (potential < 0) {
            percentage = 2; // critically low
            statusText = '❌ Cơ hội mong manh';
            statusBadgeColor = 'bg-rose-100 text-rose-900 border-rose-300';
          } else {
            const computed = Math.round((potential / (maxLeft * pointsPerWin || 1)) * 40) + Math.max(0, 10 - defPoints * 5);
            percentage = Math.min(49, Math.max(1, computed));
          }
        }
      }

      // Special custom detailed qualification advice scenarios answering: "Cần thắng bao nhiêu?"
      let scenarioText = '';
      if (stateType === 'SAFE') {
        if (percentage === 100) {
          scenarioText = `Chúc mừng! Câu lạc bộ đã chính thức đi tiếp trước ${item.left} trận đấu nhờ tích luỹ điểm vượt trội tuyệt đối.`;
        } else {
          scenarioText = `Bán toàn: Chỉ cần tích luỹ tối thiểu ${Math.max(1, Math.ceil((cutoffMaxOfOthers - item.pointsWon) / pointsPerWin))} trận thắng để khoá chặt tấm vé đi tiếp.`;
        }
      } else if (stateType === 'ELIMINATED') {
        scenarioText = `Không thể đạt đủ điểm tối thiểu ngay cả khi thắng tuyệt đối tất cả trận đấu còn lại. Rất tiếc!`;
      } else if (stateType === 'BUBBLE' || stateType === 'DANGER') {
        if (item.left === 1) {
          scenarioText = `🔥 Buộc phải giành chiến thắng ở lượt trận cuối cùng với cách biệt hiệu số Set thật cao và trông chờ đối thủ sẩy chân.`;
        } else if (item.left > 1) {
          scenarioText = `⚡ Cơ hội đi tiếp vẫn rộng mở! Tuyệt đối phải thắng tối thiểu ${Math.max(1, Math.ceil(((items[advanceCount - 1]?.pointsWon || 0) - item.pointsWon) / pointsPerWin))} trận trong ${item.left} lượt đấu tới.`;
        } else {
          scenarioText = `⏳ Đã hoàn thành các lượt đấu chính thức. Hiện cần chờ kết quả các cặp đấu muộn khác để xác định tấm vé cuối cùng.`;
        }
      }

      if (percentage > 90 && percentage < 100) {
        statusText = '✅ Cơ hội cực cao (92%+)';
        statusBadgeColor = 'bg-emerald-55 text-emerald-800 border-emerald-250 font-bold';
      }

      item.percentage = percentage;
      item.statusText = statusText;
      item.statusBadgeColor = statusBadgeColor;
      item.stateType = stateType as 'SAFE' | 'BUBBLE' | 'DANGER' | 'ELIMINATED';
      item.scenarioText = scenarioText;
    });

    return items;
  };

  // Divide teams based on group attributes
  const tourneyTeams = selectedTourney
    ? teams.filter(t => t.id.startsWith(`team-draw-${selectedTourney.id}-`))
    : [];

  const numGroups = selectedTourney?.numGroups || 2;
  const groupKeys = ['A', 'B', 'C', 'D'].slice(0, numGroups);

  const getGroupTeams = (gKey: string) => {
    return tourneyTeams.filter(t => t.group === gKey);
  };

  const roundRobin_Teams = tourneyTeams;

  const hasGroupsFormat = selectedTourney?.format === 'GROUP_KNOCKOUT';
  const hasRRFormat = selectedTourney?.format === 'ROUND_ROBIN';

  // Helper to retrieve and calculate analytics for key matching scenarios
  const getKeyMatchesAnalytics = (): DeciderMatchAnalytics[] => {
    if (!selectedTourney) return [];

    // Filter pending/live matches in current tournament
    const activeMatches = matches.filter(
      m => m.tournamentId === selectedTourney.id && m.status !== 'COMPLETED' && m.team1Id && m.team2Id
    );

    const isRR = selectedTourney.format === 'ROUND_ROBIN';
    const advanceCount = isRR ? (selectedTourney.hasSemis ? 4 : 1) : (selectedTourney.advancePerGroup || 2);
    const pointsPerWin = selectedTourney.pointsPerVictory || 2;

    const analyticsList: DeciderMatchAnalytics[] = [];

    activeMatches.forEach(m => {
      // Find team names
      const t1 = teams.find(t => t.id === m.team1Id);
      const t2 = teams.find(t => t.id === m.team2Id);
      if (!t1 || !t2) return;

      const team1Name = t1.name;
      const team2Name = t2.name;

      // Group context
      let grpName = m.groupName || 'Vòng Tròn';
      let groupTeamsList: Team[] = [];
      if (isRR) {
        groupTeamsList = roundRobin_Teams;
      } else {
        const key = grpName.replace('Bảng ', '');
        groupTeamsList = getGroupTeams(key);
      }

      const standings = calculateGroupStandings(grpName, groupTeamsList);
      const t1Idx = standings.findIndex(row => row.teamId === m.team1Id);
      const t2Idx = standings.findIndex(row => row.teamId === m.team2Id);

      const r1 = t1Idx !== -1 ? t1Idx + 1 : 99;
      const r2 = t2Idx !== -1 ? t2Idx + 1 : 99;

      // Filter: Only Group stages or Knockout stages
      if (m.stage === 'KNOCKOUT') {
        const isFin = m.isFinal;
        const isSemi = !m.isFinal && !m.isThirdPlace; 
        let badge: 'TOP_CLASH' | 'DECIDER_MATCH' | 'MATCH_OF_ROUND' = 'DECIDER_MATCH';
        let badgeLabel = 'TRẬN CẦU SINH TỬ';
        let badgeColorClass = 'bg-rose-500 text-white font-extrabold border-rose-650 animate-pulse';

        if (isFin) {
          badge = 'TOP_CLASH';
          badgeLabel = '🏆 CHUNG KẾT VÔ ĐỊCH';
          badgeColorClass = 'bg-gradient-to-r from-amber-500 to-rose-600 text-white font-black animate-bounce ring-2 ring-amber-100';
        } else if (isSemi) {
          badgeLabel = '🔥 BÁN KẾT ĐỈNH CAO';
        }

        analyticsList.push({
          match: m,
          groupName: 'Vòng Loại Trực Tiếp',
          badge,
          badgeLabel,
          badgeColorClass,
          team1Name,
          team2Name,
          t1CurrentRank: 0,
          t2CurrentRank: 0,
          scenarioT1Win: `🔥 Trận đấu một mất một còn tại vòng Knockout! Đội chiến thắng [${team1Name}] sẽ trực tiếp giành quyền đi tiếp vào vòng đấu quyết liệt hơn, đội bại trận sẽ bị loại.`,
          scenarioT2Win: `⚡ Nếu [${team2Name}] giành chiến thắng, họ sẽ trực tiếp đi tiếp, khép lại hành trình giải của đối thủ nặng ký [${team1Name}].`,
          hotnessFactor: 95
        });
        return;
      }

      if (t1Idx === -1 || t2Idx === -1) return;

      // We simulate Team 1 winning 2-0:
      const standT1Wins = standings.map(row => {
        if (row.teamId === m.team1Id) {
          return {
            ...row,
            matchesPlayed: row.matchesPlayed + 1,
            matchesWon: row.matchesWon + 1,
            pointsWon: row.pointsWon + pointsPerWin,
            setsWon: row.setsWon + 2,
          };
        }
        if (row.teamId === m.team2Id) {
          return {
            ...row,
            matchesPlayed: row.matchesPlayed + 1,
            matchesLost: row.matchesLost + 1,
            setsLost: row.setsLost + 2,
          };
        }
        return { ...row };
      }).sort((a, b) => {
        if (b.pointsWon !== a.pointsWon) return b.pointsWon - a.pointsWon;
        if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
        const aSetDiff = a.setsWon - a.setsLost;
        const bSetDiff = b.setsWon - b.setsLost;
        if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
        return b.pointsDifference - a.pointsDifference;
      });

      const nextR1_IfT1Wins = standT1Wins.findIndex(row => row.teamId === m.team1Id) + 1;

      // We simulate Team 2 winning 2-0:
      const standT2Wins = standings.map(row => {
        if (row.teamId === m.team2Id) {
          return {
            ...row,
            matchesPlayed: row.matchesPlayed + 1,
            matchesWon: row.matchesWon + 1,
            pointsWon: row.pointsWon + pointsPerWin,
            setsWon: row.setsWon + 2,
          };
        }
        if (row.teamId === m.team1Id) {
          return {
            ...row,
            matchesPlayed: row.matchesPlayed + 1,
            matchesLost: row.matchesLost + 1,
            setsLost: row.setsLost + 2,
          };
        }
        return { ...row };
      }).sort((a, b) => {
        if (b.pointsWon !== a.pointsWon) return b.pointsWon - a.pointsWon;
        if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
        const aSetDiff = a.setsWon - a.setsLost;
        const bSetDiff = b.setsWon - b.setsLost;
        if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
        return b.pointsDifference - a.pointsDifference;
      });

      const nextR2_IfT2Wins = standT2Wins.findIndex(row => row.teamId === m.team2Id) + 1;

      // Scenario builder strings matching custom soccer/esports style (nêu rõ tỷ số 2-0)
      let scenarioT1Win = '';
      if (nextR1_IfT1Wins < r1) {
        if (nextR1_IfT1Wins <= advanceCount && r1 > advanceCount) {
          scenarioT1Win = ` Nếu ${team1Name} thắng ${team2Name} tỷ số 2-0, họ bứt phá từ hạng #${r1} lọt thẳng vào Top ${advanceCount} đi tiếp (lên hạng #${nextR1_IfT1Wins})!`;
        } else if (nextR1_IfT1Wins === 1) {
          scenarioT1Win = ` Nếu ${team1Name} thắng ${team2Name} tỷ số 2-0, họ chính thức soán ngôi đầu bảng (lên hạng #1)!`;
        } else {
          scenarioT1Win = ` Nếu ${team1Name} thắng ${team2Name} tỷ số 2-0, họ vươn lên vị trí hạng #${nextR1_IfT1Wins}.`;
        }
      } else {
        scenarioT1Win = ` Nếu ${team1Name} thắng ${team2Name} tỷ số 2-0, họ vững vàng bảo vệ vị trí hạng #${nextR1_IfT1Wins}.`;
      }

      let scenarioT2Win = '';
      if (nextR2_IfT2Wins < r2) {
        if (nextR2_IfT2Wins <= advanceCount && r2 > advanceCount) {
          scenarioT2Win = ` Nếu ${team2Name} thắng ${team1Name} tỷ số 2-0, họ bứt phá từ hạng #${r2} lọt thẳng vào Top ${advanceCount} đi tiếp (lên hạng #${nextR2_IfT2Wins})!`;
        } else if (nextR2_IfT2Wins === 1) {
          scenarioT2Win = ` Nếu ${team2Name} thắng ${team1Name} tỷ số 2-0, họ chính thức chiếm lĩnh ngôi đầu bảng (lên hạng #1)!`;
        } else {
          scenarioT2Win = ` Nếu ${team2Name} Thắng ${team1Name} tỷ số 2-0, họ nâng cao thứ hạng lên hạng #${nextR2_IfT2Wins}.`;
        }
      } else {
        scenarioT2Win = ` Nếu ${team2Name} thắng ${team1Name} tỷ số 2-0, họ vững vàng giữ nguyên hạng #${nextR2_IfT2Wins}.`;
      }

      // Determine Badge types and stake rating
      let badge: 'TOP_CLASH' | 'DECIDER_MATCH' | 'MATCH_OF_ROUND' = 'MATCH_OF_ROUND';
      let badgeLabel = 'MATCH OF THE ROUND';
      let badgeColorClass = 'bg-blue-600 border-blue-700 text-white font-black uppercase text-[9px] px-2 py-0.5 rounded-md shadow-sm';
      let hotnessFactor = 50;

      const isTopClash = r1 <= advanceCount && r2 <= advanceCount;
      const isBubbleClash = 
        (r1 >= advanceCount - 1 && r1 <= advanceCount + 1) || 
        (r2 >= advanceCount - 1 && r2 <= advanceCount + 1);

      if (isTopClash) {
        badge = 'TOP_CLASH';
        badgeLabel = 'TOP CLASH';
        badgeColorClass = 'bg-rose-600 border-rose-700 text-white font-black uppercase text-[9px] px-2.5 py-0.5 rounded-md shadow-md animate-pulse';
        hotnessFactor = 90 - (r1 + r2);
      } else if (isBubbleClash) {
        badge = 'DECIDER_MATCH';
        badgeLabel = 'DECIDER MATCH';
        badgeColorClass = 'bg-amber-500 border-amber-600 text-white font-black uppercase text-[9px] px-2.5 py-0.5 rounded-md shadow-sm';
        hotnessFactor = 80;
      }

      analyticsList.push({
        match: m,
        groupName: grpName,
        badge,
        badgeLabel,
        badgeColorClass,
        team1Name,
        team2Name,
        t1CurrentRank: r1,
        t2CurrentRank: r2,
        scenarioT1Win,
        scenarioT2Win,
        hotnessFactor
      });
    });

    return analyticsList.sort((a, b) => b.hotnessFactor - a.hotnessFactor);
  };

  return (
    <div id="leaderboard" className="space-y-6 py-2 text-left">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-205 pb-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Medal className="h-6.5 w-6.5 text-blue-600" />
            Bảng Xếp Hạng Tự Động
          </h1>
          <p className="text-slate-505 text-xs md:text-sm">
            Tự động cập nhật thứ hạng các đội ngay sau khi ban tổ chức tiến hành lưu điểm số. Áp dụng chuẩn số hiệu phân định giải BWF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-slate-500 text-xs shrink-0 font-bold select-none">Giải đấu:</label>
          <select
            value={selectedTourneyId}
            onChange={(e) => setSelectedTourneyId(e.target.value)}
            className="bg-slate-55 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer transition"
          >
            {activeTournaments.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedTourney ? (
        <div className="bg-slate-50 p-12 text-center rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-550 text-xs">Không có giải đấu nào hoạt động.</p>
        </div>
      ) : selectedTourney.status === 'PLANNING' ? (
        <div className="bg-white rounded-xl p-10 text-center border border-slate-200 shadow-sm space-y-3">
          <AlertCircle className="h-9 w-9 text-amber-500 mx-auto" />
          <h2 className="text-slate-800 text-base font-bold">Giải đấu chưa phân chia bốc thăm!</h2>
          <p className="text-slate-505 text-xs max-w-sm mx-auto">
            Hệ thống bảng xếp hạng tự động chỉ hiển thị các mốc thống kê điểm số sau khi ban tổ chức tiến hành bốc thăm ghép cặp.
          </p>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Rules explainer popup banner */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs space-y-1.5 text-blue-750">
            <span className="font-bold text-blue-800 text-xs block uppercase tracking-wide flex items-center gap-1.5 select-none">
              <Trophy className="h-4 w-4 text-blue-600" /> Quy Tắc Xếp Hạng Tiêu Chuẩn Quốc Tế BWF:
            </span>
            <div className="space-y-0.5 leading-relaxed text-blue-700 font-medium">
              <p>1. Tổng điểm tích lũy trận thắng ({selectedTourney.pointsPerVictory}đ / trận thắng). </p>
              <p>2. Chênh lệch Set thắng trừ Set thua (Set Difference) toàn vòng đấu.</p>
              <p>3. Hiệu số điểm thắt nút (Rally Point Difference) tổng tích lũy thi đấu thực tế.</p>
            </div>
          </div>

          {/* Core Navigation Switch Tabs */}
          <div className="flex border-b border-slate-200/80 bg-slate-50/50 p-1 rounded-xl select-none">
            <button
              onClick={() => setActiveTab('standings')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs md:text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'standings'
                  ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-100'
                  : 'text-slate-505 hover:text-slate-705 hover:bg-white/40'
              }`}
            >
              📊 Bảng Điểm
            </button>
            <button
              onClick={() => setActiveTab('race')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs md:text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'race'
                  ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-100'
                  : 'text-slate-505 hover:text-slate-705 hover:bg-white/40'
              }`}
            >
              <Flame className="h-4 w-4 text-rose-500 animate-pulse fill-rose-500" />
              Đường Đua Top (Race)
              <span className="bg-rose-500 text-white text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded-full animate-bounce">LIVE</span>
            </button>
            <button
              onClick={() => setActiveTab('deciders')}
              className={`flex-1 py-2 px-4 rounded-lg font-bold text-xs md:text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'deciders'
                  ? 'bg-white shadow-sm text-blue-600 ring-1 ring-slate-100'
                  : 'text-slate-505 hover:text-slate-705 hover:bg-white/40'
              }`}
            >
              <Zap className="h-4 w-4 text-amber-500 animate-pulse fill-amber-500" />
              Trận Quyết Định (Key Matches)
              <span className="bg-amber-500 text-white text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded-full animate-pulse">ALERT</span>
            </button>
          </div>

          {activeTab === 'standings' && (
            <>
              {/* Group Knockout columns display */}
              {hasGroupsFormat && (
                <div className={`grid grid-cols-1 ${numGroups > 2 ? 'xl:grid-cols-3 lg:grid-cols-2' : 'lg:grid-cols-2'} gap-6`}>
                  {groupKeys.map(k => (
                    <div key={k} className="space-y-2">
                      {renderStandingsTable(`Bảng ${k}`, calculateGroupStandings(`Bảng ${k}`, getGroupTeams(k)), matches, selectedTourney)}
                    </div>
                  ))}
                </div>
              )}

              {/* Round Robin single table display */}
              {hasRRFormat && (
                <div className="bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                  {renderStandingsTable('Vòng Tròn Tính Điểm', calculateGroupStandings('Vòng Tròn', roundRobin_Teams), matches, selectedTourney)}
                </div>
              )}
            </>
          )}

          {activeTab === 'race' && (
            <div className="space-y-6">
              {/* Educational info for dynamic prediction model */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 text-xs text-slate-600">
                <span className="font-bold text-slate-700 block select-none">💡 Cách Hệ Thống Tính Toán Cơ Hội Đi Tiếp:</span>
                <p className="leading-relaxed font-medium">
                  Xác suất phần trăm <strong>(%)</strong> và kịch bản cơ hội được giả định tự động theo thời gian thực (BWF Predictive Model) dựa trên số hiệu trận thắng/thua, số trận còn lại, và hiệu số hiệu số set/điểm thắt nút tối đa có thể đạt được so với các câu lạc bộ cạnh tranh trực tiếp trong nhóm.
                </p>
              </div>

              {/* Group Knockout columns display */}
              {hasGroupsFormat && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {groupKeys.map(k => (
                    <div key={k} className="space-y-2">
                      {renderRaceAnalysisTable(`Bảng ${k}`, calculateRaceData(`Bảng ${k}`, calculateGroupStandings(`Bảng ${k}`, getGroupTeams(k))), matches, selectedTourney.id)}
                    </div>
                  ))}
                </div>
              )}

              {/* Round Robin list display */}
              {hasRRFormat && (
                <div className="space-y-2">
                  {renderRaceAnalysisTable('Vòng Tròn Tính Điểm', calculateRaceData('Vòng Tròn', calculateGroupStandings('Vòng Tròn', roundRobin_Teams)), matches, selectedTourney.id)}
                </div>
              )}
            </div>
          )}

          {activeTab === 'deciders' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="bg-gradient-to-br from-amber-500/10 to-rose-500/10 border border-amber-200/50 p-5 rounded-2xl space-y-2.5">
                <span className="font-extrabold text-amber-800 text-xs sm:text-sm block uppercase tracking-wider flex items-center gap-1.5 select-none">
                  <Zap className="h-5 w-5 text-amber-500 animate-pulse fill-amber-500" />
                  Dự báo AI - Các trận đấu quyết định cục diện (Key Match Scenarios):
                </span>
                <p className="leading-relaxed text-xs text-slate-650 font-medium">
                  Hệ thống tự động phân tích các lượt trận tiếp theo của giải đấu, giả định các kịch bản bất ngờ hoặc thắng tuyệt đối <strong>(2-0)</strong> để dự báo thứ hạng mới, chỉ ra các trận đấu có tầm ảnh hưởng lớn nhất tới tấm vé đi tiếp của mỗi câu lạc bộ.
                </p>
              </div>

              {/* List of deciders */}
              {(() => {
                const keyMatches = getKeyMatchesAnalytics();
                if (keyMatches.length === 0) {
                  return (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-150 shadow-sm space-y-3">
                      <Sparkles className="h-9 w-9 text-slate-300 mx-auto animate-pulse" />
                      <h3 className="text-slate-800 text-sm font-bold">Không tìm thấy trận đấu quyết định nào sắp tới</h3>
                      <p className="text-slate-400 text-xs max-w-sm mx-auto">
                        Tất cả các trận đấu trong khuôn khổ vòng đấu hoặc giai đoạn hiện tại đã hoàn tất lưu kết quả hoặc chưa có lượt đấu mới được tạo lập.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-5">
                    {keyMatches.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden text-left"
                      >
                        {/* Decorative corner indicator for absolute bangers */}
                        {item.badge === 'TOP_CLASH' && (
                          <div className="absolute top-0 right-0 h-16 w-16 pointer-events-none overflow-hidden">
                            <div className="bg-rose-500 text-white text-[8px] font-bold text-center py-1 uppercase rotate-45 translate-x-4 translate-y-2.5 w-24 shadow-sm">
                              TOP CLASH
                            </div>
                          </div>
                        )}

                        {/* Header containing badging info */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className={item.badgeColorClass}>
                              {item.badgeLabel}
                            </span>
                            <span className="text-[10px] text-slate-450 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.groupName}
                            </span>
                          </div>

                          <div className="text-[10px] text-slate-405 font-mono">
                            Khả năng thăng tiến: <strong className="text-slate-700">{item.hotnessFactor}%</strong>
                          </div>
                        </div>

                        {/* Visual vs banner between Teams */}
                        <div className="grid grid-cols-1 md:grid-cols-7 items-center gap-4 text-center md:text-left">
                          
                          {/* Team 1 Side with current rating badge */}
                          <div className="md:col-span-3 space-y-2">
                            <div className="flex flex-col items-center md:items-end justify-center">
                              <span className="text-xs font-mono font-extrabold text-slate-450 select-none uppercase tracking-widest mb-1 block">Team 1</span>
                              <strong className="text-sm md:text-base font-black text-slate-800 text-center md:text-right">
                                {item.team1Name}
                              </strong>
                              {item.t1CurrentRank > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 bg-slate-100 text-slate-605">
                                  Hạng hiện tại: #{item.t1CurrentRank}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* VS Center */}
                          <div className="md:col-span-1 flex flex-col items-center justify-center">
                            <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center text-xs text-slate-505 font-black tracking-tighter ring-4 ring-slate-50 border border-slate-150">
                              VS
                            </div>
                            {item.match.scheduledTime && (
                              <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase block text-center">
                                {new Date(item.match.scheduledTime).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>

                          {/* Team 2 Side */}
                          <div className="md:col-span-3 space-y-2">
                            <div className="flex flex-col items-center md:items-start justify-center">
                              <span className="text-xs font-mono font-extrabold text-slate-455 select-none uppercase tracking-widest mb-1 block">Team 2</span>
                              <strong className="text-sm md:text-base font-black text-slate-800 text-center md:text-left">
                                {item.team2Name}
                              </strong>
                              {item.t2CurrentRank > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded mt-1 bg-slate-100 text-slate-605">
                                  Hạng hiện tại: #{item.t2CurrentRank}
                                </span>
                              ) : null}
                            </div>
                          </div>

                        </div>

                        {/* AI Predictive Scenario Analysis */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-2.5 text-xs text-left">
                          <div className="font-extrabold text-slate-700 uppercase tracking-wider text-[9px] flex items-center gap-1 select-none">
                            <Sparkles className="h-3 w-3 text-purple-600 animate-pulse" /> Kịch bản Giả định & Hệ quả BXH:
                          </div>

                          <div className="space-y-2.5 leading-relaxed font-semibold text-slate-600">
                            {item.match.stage === 'KNOCKOUT' ? (
                              <div className="space-y-1">
                                <p className="text-slate-700 font-extrabold flex items-center gap-1.5">
                                  <span>🏆</span> VÒNG ĐẤU LOẠI TRỰC TIẾP
                                </p>
                                <p className="text-slate-500 text-[11px] leading-relaxed">
                                  Đây là trận cầu quyết định trực tiếp tấm vé đi sâu hơn vào giải đấu. Đội thua cuộc sẽ bị loại ngay lập tức.
                                </p>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start gap-1.5">
                                  <span className="text-emerald-500 shrink-0 mt-0.5">🟢</span>
                                  <p>{item.scenarioT1Win}</p>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <span className="text-indigo-500 shrink-0 mt-0.5">🔵</span>
                                  <p>{item.scenarioT2Win}</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Pure Knockout (no group stage warning) */}
          {selectedTourney.format === 'KNOCKOUT' && (
            <div className="bg-white rounded-xl p-10 text-center border border-slate-200 shadow-sm space-y-2">
              <Medal className="h-9 w-9 text-blue-600 mx-auto" />
              <h2 className="text-slate-800 text-sm md:text-base font-bold">Giải Đấu Loại Trực Tiếp (Knockout Bracket)</h2>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Thể thức thi đấu loại trực tiếp không tích luỹ bảng tính tổng điểm. Vui lòng chuyển sang mục <strong className="text-blue-600">"Sơ Đồ Thi Đấu"</strong> để xem trực tiếp các nhánh Bracket.
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

// Sub helper rendering actual table of standings
function renderStandingsTable(groupTitle: string, standings: GroupStanding[], matches: Match[], selectedTourney: any) {
  // Determine advanceCount
  const isRR = selectedTourney?.format === 'ROUND_ROBIN';
  const advanceCount = isRR 
    ? (selectedTourney?.hasSemis ? 4 : 1) 
    : (selectedTourney?.advancePerGroup || 2);

  return (
    <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center border-b border-slate-105 pb-2">
        <h3 className="font-bold text-blue-620 text-sm uppercase tracking-wider font-mono">{groupTitle}</h3>
        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">Real-time update</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[600px] table-auto">
          <thead>
            <tr className="text-slate-405 font-mono uppercase text-[9px] border-b border-slate-150 font-bold tracking-widest whitespace-nowrap">
              <th className="py-2.5 w-[8%] text-center font-bold">Hạng</th>
              <th className="py-2.5 w-[25%] font-bold">Tên CLB</th>
              <th className="py-2.5 w-[18%] text-center font-bold">Phong Độ (5 trận)</th>
              <th className="py-2.5 w-[8%] text-center font-bold">Trận</th>
              <th className="py-2.5 w-[6%] text-center font-bold">T</th>
              <th className="py-2.5 w-[6%] text-center font-bold">B</th>
              <th className="py-2.5 w-[13%] text-center font-bold">Hiệu số Set</th>
              <th className="py-2.5 w-[10%] text-center font-bold">Rally +/-</th>
              <th className="py-2.5 w-[6%] text-center text-blue-600 font-bold">Điểm</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {standings.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-slate-400 py-6 font-medium">Chưa có dữ liệu thi đấu bảng.</td>
              </tr>
            ) : (
              standings.map((row, idx) => {
                const setDiff = row.setsWon - row.setsLost;
                const formTrend = calculateTeamFormAndStreak(row.teamId, selectedTourney?.id || '', matches);

                // Zone Classification Logic (Green, Yellow, Red)
                let zone: 'safe' | 'bubble' | 'danger' = 'danger';
                if (advanceCount === 1) {
                  if (idx === 0) zone = 'safe';
                  else if (idx === 1) zone = 'bubble';
                  else zone = 'danger';
                } else {
                  if (idx < advanceCount - 1) {
                    zone = 'safe';
                  } else if (idx >= advanceCount - 1 && idx <= advanceCount) {
                    zone = 'bubble';
                  } else {
                    zone = 'danger';
                  }
                }

                // Determine CSS Styles for each zone helper
                let rowBgClass = '';
                let rankBadgeClass = '';

                if (zone === 'safe') {
                  rowBgClass = 'bg-emerald-500/[0.015] hover:bg-emerald-50/25 transition-colors';
                  rankBadgeClass = 'bg-emerald-500 text-white font-black shadow-sm shadow-emerald-100 ring-4 ring-emerald-50';
                } else if (zone === 'bubble') {
                  rowBgClass = 'bg-amber-500/[0.015] hover:bg-amber-50/25 transition-colors';
                  rankBadgeClass = 'bg-amber-500 text-white font-black shadow-sm shadow-amber-50 ring-4 ring-amber-50';
                } else {
                  rowBgClass = 'bg-rose-500/[0.005]/[0.01] hover:bg-rose-50/15 transition-colors';
                  rankBadgeClass = 'bg-rose-500 text-white font-black shadow-sm shadow-rose-50 ring-4 ring-rose-50';
                }

                const isWinnerZone = idx < advanceCount;

                return (
                  <tr key={row.teamId} className={`${rowBgClass} ${isWinnerZone ? 'font-medium' : ''}`}>
                    <td className="py-3 text-center font-mono font-bold select-none">
                      <span className={`inline-flex items-center justify-center h-[22px] w-[22px] rounded-full text-xs font-mono font-black transition-all ${rankBadgeClass}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className={`py-3 font-semibold text-slate-800 ${isWinnerZone ? 'text-blue-620' : 'text-slate-600'}`}>
                      {row.teamName}
                    </td>
                    
                    {/* Form Trend Column */}
                    <td className="py-3 text-center">
                      {formTrend.last5.length === 0 ? (
                        <span className="text-slate-300 font-mono">—</span>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <div className="flex items-center gap-0.5">
                            {formTrend.last5.map((result, rIdx) => (
                              <span
                                key={rIdx}
                                className={`inline-flex items-center justify-center h-4.5 w-4.5 rounded-full text-[8px] font-black text-white select-none shadow-sm ${
                                  result === 'W'
                                    ? 'bg-emerald-500 ring-1 ring-emerald-100'
                                    : 'bg-rose-500 ring-1 ring-rose-100'
                                  }`}
                                title={result === 'W' ? 'Thắng' : 'Thua'}
                              >
                                {result}
                              </span>
                            ))}
                          </div>
                          {formTrend.streakText && (
                            <span className="text-[9px] scale-[0.9] origin-center font-extrabold bg-slate-100 border border-slate-200 text-slate-700 px-1 py-0.2 rounded shrink-0">
                              {formTrend.streakText.split(' ')[0] === '🔥' || formTrend.streakText.split(' ')[0] === '❄️' ? formTrend.streakText.split(' ')[0] + ' ' + formTrend.streakText.split(' ').slice(1).join(' ') : `📈 ${formTrend.streakText}`}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3 text-center font-mono text-slate-500 font-medium">{row.matchesPlayed}</td>
                    <td className="py-3 text-center font-mono text-emerald-605 font-bold">{row.matchesWon}</td>
                    <td className="py-3 text-center font-mono text-rose-505 font-bold">{row.matchesLost}</td>
                    <td className="py-3 text-center font-mono">
                      <span className={`font-semibold ${setDiff > 0 ? 'text-emerald-605' : setDiff < 0 ? 'text-rose-505' : 'text-slate-400'}`}>
                        {setDiff > 0 ? `+${setDiff}` : setDiff}
                      </span>
                      <span className="text-[9px] text-slate-400 block">({row.setsWon}/{row.setsLost})</span>
                    </td>
                    <td className="py-3 text-center font-mono">
                      <span className={`font-semibold ${row.pointsDifference > 0 ? 'text-emerald-600' : row.pointsDifference < 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {row.pointsDifference > 0 ? `+${row.pointsDifference}` : row.pointsDifference}
                      </span>
                    </td>
                    <td className="py-3 text-center font-mono text-blue-600 font-extrabold text-sm">{row.pointsWon}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Legend Footer for Qual Regions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3.5 border-t border-slate-100 text-[10px] text-slate-500 font-semibold leading-relaxed">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
            <span><strong>Top đi tiếp (Anchor)</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100" />
            <span><strong>Cạnh tranh cận biên / Dễ rớt (Bubble)</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100" />
            <span><strong>Nguy cơ bị loại cao (Danger)</strong></span>
          </div>
        </div>
        <span className="text-slate-400 font-mono text-[9px] uppercase tracking-wider">Hệ thống phân loại kịch bản tự động</span>
      </div>
    </div>
  );
}

// Sub helper rendering actual table of race analysis
function renderRaceAnalysisTable(groupTitle: string, raceItems: RaceStandingItem[], matches: Match[], tournamentId: string) {
  return (
    <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center border-b border-slate-105 pb-3">
        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono flex items-center gap-1.5 select-none">
          <span className="text-rose-500">🔥</span> Đường đua: {groupTitle}
        </h3>
        <span className="text-[9px] text-blue-620 bg-blue-50/50 border border-blue-100/60 font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
          Preds model
        </span>
      </div>

      <div className="space-y-3.5">
        {raceItems.length === 0 ? (
          <p className="text-center text-slate-400 py-8 font-medium text-xs">Chưa có dữ liệu thi đấu bảng.</p>
        ) : (
          raceItems.map((item, idx) => {
            const getProgressColor = (prob: number) => {
              if (prob === 100) return 'bg-emerald-500';
              if (prob >= 80) return 'bg-teal-500';
              if (prob >= 50) return 'bg-blue-500';
              if (prob >= 20) return 'bg-amber-500';
              if (prob > 0) return 'bg-rose-500';
              return 'bg-slate-300';
            };

            const formTrend = calculateTeamFormAndStreak(item.teamId, tournamentId, matches);

            return (
              <div 
                key={item.teamId} 
                className={`p-3.5 rounded-xl border transition-all ${
                  item.stateType === 'SAFE' 
                    ? 'bg-emerald-50/10 border-emerald-100/50 hover:bg-emerald-50/25' 
                    : item.stateType === 'ELIMINATED'
                      ? 'bg-slate-50 border-slate-150 opacity-60'
                      : 'bg-white border-slate-150 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                    <span className="font-mono text-[11px] font-black text-slate-400 select-none">#{idx + 1}</span>
                    <strong className="text-slate-800 text-xs md:text-sm font-extrabold truncate block">{item.teamName}</strong>
                    
                    {/* Inline miniature form dots for sports flair */}
                    {formTrend.last5.length > 0 && (
                      <div className="flex items-center gap-0.5 ml-1 select-none">
                        {formTrend.last5.map((result, rIdx) => (
                          <span
                            key={rIdx}
                            className={`inline-block h-1.5 w-1.5 rounded-full ${
                              result === 'W' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            title={result === 'W' ? 'Thắng' : 'Thua'}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border text-center ${item.statusBadgeColor}`}>
                      {item.statusText}
                    </span>
                    <span className="text-xs font-black font-mono text-slate-700">
                      {item.percentage === 100 ? '✅ 100%' : item.percentage === 0 ? '❌ 0%' : `🔥 ${item.percentage}%`}
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(item.percentage)}`} 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pt-1.5 border-t border-slate-100 mt-2 text-[10px] text-slate-500 leading-relaxed">
                  <p className="font-semibold text-slate-650 max-w-lg">
                    {item.scenarioText}
                  </p>
                  <div className="flex items-center gap-2 text-slate-400 font-mono text-[9px] flex-wrap leading-none">
                    {/* Streak notification badge */}
                    {formTrend.streakText && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] border uppercase text-[8px] font-bold ${formTrend.streakBadgeColor}`}>
                        {formTrend.streakText}
                      </span>
                    )}
                    <span>Trận: <strong className="text-slate-705">{item.matchesPlayed}</strong></span>
                    <span>Thắng: <strong className="text-emerald-600">{item.matchesWon}</strong></span>
                    <span>Còn lại: <strong className="text-blue-600">{item.left}</strong></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
