export type TournamentFormat = 'ROUND_ROBIN' | 'KNOCKOUT' | 'GROUP_KNOCKOUT';

export interface Player {
  id: string;
  name: string;
  phone?: string;
  role?: 'Captain' | 'Member';
}

export interface Team {
  id: string;
  name: string;
  logo: string; // url or solid color with initials
  players: Player[];
  group?: string; // e.g. 'A', 'B'
  avatar?: string; // custom uploaded team avatar image or base64
}

export interface Sponsor {
  id: string;
  name: string;
  logo: string;
  tier: 'KIM_CUONG' | 'VANG' | 'BAC' | 'DONG';
  website?: string;
  amount?: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  image: string;
  videoUrl?: string; // Optional YouTube ID or visual mock url
  category: 'News' | 'Video' | 'Notice';
  date: string;
  author: string;
}

export interface MatchSet {
  team1Score: number;
  team2Score: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number; // For RR it is Round Number, for KO it is e.g. 1/8, Quarter, Semi, Final (represented by level: 3, 2, 1, 0)
  stage: 'GROUP' | 'KNOCKOUT';
  groupName?: string; // e.g. "Bảng A", "Bảng B"
  team1Id: string | null; // null if TBD for bracket
  team2Id: string | null;
  scoreSets: MatchSet[]; // e.g. [{21, 19}, {18, 21}, {21, 15}]
  status: 'PENDING' | 'LIVE' | 'COMPLETED';
  winnerId: string | null;
  scheduledTime?: string;
  court?: string;
  nextMatchId?: string | null; // For bracket logic, where winner proceeds
  nextMatchPosition?: 'team1' | 'team2' | null;
  servingTeam?: 1 | 2 | null; // 1 for Team 1, 2 for Team 2 being the current serving team
  isFinal?: boolean;
  isThirdPlace?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  numberOfTeams: number;
  groupSize: number; // e.g. 4 teams per group for GROUP_KNOCKOUT
  advancePerGroup: number; // Number of teams advancing from each group
  pointsPerVictory: number; // e.g. 2 points or 3 points
  setsToWin: 2 | 3 | 5; // allow Best of 3 or Best of 5 (setsToWin is the max number of sets or sets needed to win. 2 = Best of 3, 3 = Best of 5, wait, or let's use standard name setsToWin: 2 is 2 sets won (Best of 3), 3 is 3 sets won (Best of 5))
  pointsPerSet: number; // e.g. 21
  status: 'PLANNING' | 'DRAW_DONE' | 'ACTIVE' | 'FINISHED' | 'DEACTIVE';
  createdAt: string;
  teamIds?: string[];
  
  // Custom tie-break scoring options
  decidingSetPoints?: number; // point limit of the deciding set (e.g. Set 3 in Bo3, Set 5 in Bo5), default 15
  specialFinalsRuleEnabled?: boolean; // if default points is 15 but final/3rd-place play to 21
  specialFinalsPoints?: number; // e.g. 21
  specialFinalsDecidingPoints?: number; // e.g. 15 for deciding set in final/3rd-place

  // New features for ROUND_ROBIN top 4 knockout transition
  hasSemis?: boolean;
  semisPairingType?: '1v2_3v4' | '1v4_2v3';

  // Scheduling data fields
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  playingDays?: string[]; // e.g. ['Monday', 'Wednesday', 'Saturday', 'Sunday']
  optimizeSchedule?: boolean; // automatically minimize idle time between consecutive matches for same team
  playingHoursStart?: string; // e.g. '08:00'
  playingHoursEnd?: string; // e.g. '21:00'
  matchDuration?: number; // e.g. 60 (minutes per match)
  courtsCount?: number; // Number of courts in the venue
  matchType?: 'SINGLES' | 'DOUBLES'; // 'SINGLES' for single, 'DOUBLES' for double play
  defaultCourt?: string; // Default court for the tournament matches (e.g. Sân 1, Sân Trung Tâm)
  courtNames?: string[]; // Custom names for each court (e.g. ["Sân Icon Đ/c: 123 Tôn Đản", "Sân 2"])
  courtNumbers?: string[]; // Custom labels/numbers for each court (e.g. ["Sân 1", "Sân 4"])
  athletesAssigned?: Athlete[]; // Assigned athletes for the tournament
  pairedTeams?: PairedTeam[]; // Custom paired teams for match-making
  numSeeds?: number; // Number of seed groups
  numGroups?: number; // Number of groups for GROUP_KNOCKOUT (e.g. 2, 3, 4)
}

export interface PairedTeam {
  id: string;
  name: string;
  athleteIds: string[];
  group?: string; // Optional group name, e.g., 'A', 'B', 'C', 'D'
  isCustomName?: boolean; // Track if the team name has been explicitly customized
}

export interface Athlete {
  id: string;
  name: string;
  age: number | string;
  gender: 'Nam' | 'Nữ' | 'Khác' | string;
  nickname?: string;
  address?: string;
  phone?: string;
  seed?: number | null; // Optional seed level (1 to N) or null
}

export interface GroupStanding {
  teamId: string;
  teamName: string;
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  pointsWon: number; // actual match outcome points (e.g., 3-0 wins -> points)
  pointsDifference: number; // rally points score diff
}
