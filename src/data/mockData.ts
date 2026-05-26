import { Team, Sponsor, Post, Tournament, Match } from '../types';

export const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'CLB Cầu Lông Ba Đình',
    logo: 'emerald',
    players: [
      { id: 'p1-1', name: 'Nguyễn Tiến Minh', role: 'Captain' },
      { id: 'p1-2', name: 'Lê Đức Phát', role: 'Member' },
      { id: 'p1-3', name: 'Lê Duy Nam', role: 'Member' },
    ]
  },
  {
    id: 'team-2',
    name: 'CLB Cầu Lông Đống Đa',
    logo: 'blue',
    players: [
      { id: 'p2-1', name: 'Nguyễn Thùy Linh', role: 'Captain' },
      { id: 'p2-2', name: 'Vũ Thị Trang', role: 'Member' },
      { id: 'p2-3', name: 'Trần Thị Phương', role: 'Member' },
    ]
  },
  {
    id: 'team-3',
    name: 'Cầu Giấy Flyers',
    logo: 'amber',
    players: [
      { id: 'p3-1', name: 'Phạm Cao Cường', role: 'Captain' },
      { id: 'p3-2', name: 'Nguyễn Hải Đăng', role: 'Member' },
      { id: 'p3-3', name: 'Đỗ Tuấn Đức', role: 'Member' },
    ]
  },
  {
    id: 'team-4',
    name: 'Hoàn Kiếm Smashing',
    logo: 'rose',
    players: [
      { id: 'p4-1', name: 'Phạm Hồng Nam', role: 'Captain' },
      { id: 'p4-2', name: 'Trần Quốc Khánh', role: 'Member' },
      { id: 'p4-3', name: 'Nguyễn Đình Hoàng', role: 'Member' },
    ]
  },
  {
    id: 'team-5',
    name: 'CLB Thống Nhất',
    logo: 'indigo',
    players: [
      { id: 'p5-1', name: 'Lê Ngọc Nguyên', role: 'Captain' },
      { id: 'p5-2', name: 'Nguyễn Minh Thành', role: 'Member' },
      { id: 'p5-3', name: 'Phạm Nhật Duy', role: 'Member' },
    ]
  },
  {
    id: 'team-6',
    name: 'CLB Tây Hồ',
    logo: 'purple',
    players: [
      { id: 'p6-1', name: 'Vương Đình Đạt', role: 'Captain' },
      { id: 'p6-2', name: 'Đinh Công Minh', role: 'Member' },
      { id: 'p6-3', name: 'Nguyễn Thị Sen', role: 'Member' },
    ]
  },
  {
    id: 'team-7',
    name: 'Sông Hồng Badminton',
    logo: 'cyan',
    players: [
      { id: 'p7-1', name: 'Trịnh Huy Hoàng', role: 'Captain' },
      { id: 'p7-2', name: 'Vũ Thanh Lâm', role: 'Member' },
      { id: 'p7-3', name: 'Lâm Văn Hải', role: 'Member' },
    ]
  },
  {
    id: 'team-8',
    name: 'Thành Công Clb',
    logo: 'orange',
    players: [
      { id: 'p8-1', name: 'Đặng Quang Huy', role: 'Captain' },
      { id: 'p8-2', name: 'Vũ Ngọc Hùng', role: 'Member' },
      { id: 'p8-3', name: 'Mai Thế Dũng', role: 'Member' },
    ]
  }
];

export const mockSponsors: Sponsor[] = [
  {
    id: 's1',
    name: 'Yonex Việt Nam',
    logo: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // Placeholder elegant, black background abstract
    tier: 'KIM_CUONG',
    website: 'https://yonex.com'
  },
  {
    id: 's2',
    name: 'Li-Ning Badminton',
    logo: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    tier: 'KIM_CUONG',
    website: 'https://lining.com'
  },
  {
    id: 's3',
    name: 'Victor Sport',
    logo: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    tier: 'VANG',
    website: 'https://victorsport.com'
  },
  {
    id: 's4',
    name: 'Nước uống Bổ sung Red Bull',
    logo: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    tier: 'VANG',
    website: 'https://redbull.com'
  },
  {
    id: 's5',
    name: 'Nước khoáng thiên nhiên Aqua',
    logo: 'https://images.unsplash.com/photo-1512418490979-92798cec1380?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    tier: 'BAC',
    website: 'https://aquafina.vn'
  },
  {
    id: 's6',
    name: 'VNExpress - Bảo trợ Truyền thông',
    logo: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    tier: 'DONG',
    website: 'https://vnexpress.net'
  }
];

export const mockPosts: Post[] = [
  {
    id: 'post-1',
    title: 'Khai mạc Giải Cầu lông Vô Địch Đồng Đội Thủ Đô 2026',
    content: 'Giải đấu quy tụ 8 đội tuyển cầu lông mạnh nhất khu vực Hà Nội tranh tài giành cúp vô địch trị giá 50,000,000 VND. Sự kiện hứa hẹn mang đến những trận cầu đỉnh cao kịch tính từ các tuyển thủ quốc gia hàng đầu Việt Nam như Tiến Minh, Thùy Linh hay Đức Phát.',
    image: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=600&auto=format&fit=crop&q=80&ixlib=rb-4.0.3',
    category: 'News',
    date: '2026-05-20',
    author: 'BTC Giải Đấu'
  },
  {
    id: 'post-2',
    title: 'Review kỹ thuật đập cầu nhảy (Jump Smash) đỉnh cao',
    content: 'Hướng dẫn cụ thể tư thế, nhịp nhảy bật, cách chọn điểm đón cầu và góc tiếp xúc vợt tối ưu để tạo ra những pha đập cầu cắm sân tốc độ cao trên 350km/h từ các chuyên gia chuyên môn của Li-Ning.',
    image: 'https://images.unsplash.com/photo-1617083934333-e0094b8e8609?w=600&auto=format&fit=crop&q=80&ixlib=rb-4.0.3',
    videoUrl: 'https://www.youtube.com/embed/9eP3tTio6R0', // Mock dynamic link / clip representation
    category: 'Video',
    date: '2026-05-22',
    author: 'HLV Trần Trung'
  },
  {
    id: 'post-3',
    title: 'Yonex tài trợ toàn bộ cầu đấu Pro Tournament cho giải',
    content: 'Tại buổi lễ công bố diễn ra sáng nay, Yonex Việt Nam đã chính thức ký kết tài trợ toàn bộ cầu thi đấu Yonex AS50 tiêu chuẩn quốc tế và trang phục thi đấu cho Ban Trọng tài làm nhiệm vụ.',
    image: 'https://images.unsplash.com/photo-1611251147551-7667d73cc271?w=600&auto=format&fit=crop&q=80&ixlib=rb-4.0.3',
    category: 'News',
    date: '2026-05-18',
    author: 'Phóng viên Thể thao'
  },
  {
    id: 'post-4',
    title: 'Highlights Trận Chung Kết đơn nam căng thẳng kịch tính',
    content: 'Cùng xem lại khoảnh khắc giằng co nghẹt thở từng điểm số ở set 3 quyết định trong trận đấu giữa Tiến Minh và Đức Phát với chuỗi cứu cầu không tưởng làm rung chuyển cả nhà thi đấu.',
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600&auto=format&fit=crop&q=80&ixlib=rb-4.0.3',
    videoUrl: 'https://www.youtube.com/embed/tI7LwE878R8',
    category: 'Video',
    date: '2026-05-23',
    author: 'BadmintonTV'
  }
];

export const mockTournaments: Tournament[] = [
  {
    id: 'tour-demo',
    name: 'Giải Cầu Lông Cup Grand Prix Hà Nội 2026',
    format: 'GROUP_KNOCKOUT',
    numberOfTeams: 8,
    groupSize: 4,
    advancePerGroup: 2,
    pointsPerVictory: 3,
    setsToWin: 2,
    pointsPerSet: 21,
    status: 'ACTIVE',
    createdAt: '2026-05-15T08:00:00Z'
  }
];

export const mockMatches: Match[] = [
  // Group A (team-1, team-2, team-3, team-4)
  {
    id: 'match-g1',
    tournamentId: 'tour-demo',
    round: 1,
    stage: 'GROUP',
    groupName: 'Bảng A',
    team1Id: 'team-1',
    team2Id: 'team-2',
    scoreSets: [{ team1Score: 21, team2Score: 19 }, { team1Score: 18, team2Score: 21 }, { team1Score: 21, team2Score: 17 }],
    status: 'COMPLETED',
    winnerId: 'team-1',
    scheduledTime: '2026-05-23T08:00:00Z',
    court: 'Sân 1'
  },
  {
    id: 'match-g2',
    tournamentId: 'tour-demo',
    round: 1,
    stage: 'GROUP',
    groupName: 'Bảng A',
    team1Id: 'team-3',
    team2Id: 'team-4',
    scoreSets: [{ team1Score: 21, team2Score: 15 }, { team1Score: 21, team2Score: 18 }],
    status: 'COMPLETED',
    winnerId: 'team-3',
    scheduledTime: '2026-05-23T09:00:00Z',
    court: 'Sân 2'
  },
  {
    id: 'match-g3',
    tournamentId: 'tour-demo',
    round: 2,
    stage: 'GROUP',
    groupName: 'Bảng A',
    team1Id: 'team-1',
    team2Id: 'team-3',
    scoreSets: [{ team1Score: 22, team2Score: 20 }, { team1Score: 21, team2Score: 19 }],
    status: 'COMPLETED',
    winnerId: 'team-1',
    scheduledTime: '2026-05-23T14:00:00Z',
    court: 'Sân 1'
  },
  {
    id: 'match-g4',
    tournamentId: 'tour-demo',
    round: 2,
    stage: 'GROUP',
    groupName: 'Bảng A',
    team1Id: 'team-2',
    team2Id: 'team-4',
    scoreSets: [{ team1Score: 21, team2Score: 11 }, { team1Score: 21, team2Score: 14 }],
    status: 'COMPLETED',
    winnerId: 'team-2',
    scheduledTime: '2026-05-23T15:00:00Z',
    court: 'Sân 2'
  },
  {
    id: 'match-g5',
    tournamentId: 'tour-demo',
    round: 3,
    stage: 'GROUP',
    groupName: 'Bảng A',
    team1Id: 'team-1',
    team2Id: 'team-4',
    scoreSets: [],
    status: 'LIVE',
    winnerId: null,
    scheduledTime: '2026-05-23T19:30:00Z',
    court: 'Sân Trung Tâm'
  },
  {
    id: 'match-g6',
    tournamentId: 'tour-demo',
    round: 3,
    stage: 'GROUP',
    groupName: 'Bảng A',
    team1Id: 'team-2',
    team2Id: 'team-3',
    scoreSets: [],
    status: 'PENDING',
    winnerId: null,
    scheduledTime: '2026-05-23T20:30:00Z',
    court: 'Sân 2'
  },

  // Group B (team-5, team-6, team-7, team-8)
  {
    id: 'match-g7',
    tournamentId: 'tour-demo',
    round: 1,
    stage: 'GROUP',
    groupName: 'Bảng B',
    team1Id: 'team-5',
    team2Id: 'team-6',
    scoreSets: [{ team1Score: 15, team2Score: 21 }, { team1Score: 14, team2Score: 21 }],
    status: 'COMPLETED',
    winnerId: 'team-6',
    scheduledTime: '2026-05-23T10:00:00Z',
    court: 'Sân 1'
  },
  {
    id: 'match-g8',
    tournamentId: 'tour-demo',
    round: 1,
    stage: 'GROUP',
    groupName: 'Bảng B',
    team1Id: 'team-7',
    team2Id: 'team-8',
    scoreSets: [{ team1Score: 21, team2Score: 19 }, { team1Score: 19, team2Score: 21 }, { team1Score: 23, team2Score: 21 }],
    status: 'COMPLETED',
    winnerId: 'team-7',
    scheduledTime: '2026-05-23T11:00:00Z',
    court: 'Sân 2'
  },
  {
    id: 'match-g9',
    tournamentId: 'tour-demo',
    round: 2,
    stage: 'GROUP',
    groupName: 'Bảng B',
    team1Id: 'team-5',
    team2Id: 'team-7',
    scoreSets: [],
    status: 'PENDING',
    winnerId: null,
    scheduledTime: '2026-05-23T16:00:00Z',
    court: 'Sân 1'
  },
  {
    id: 'match-g10',
    tournamentId: 'tour-demo',
    round: 2,
    stage: 'GROUP',
    groupName: 'Bảng B',
    team1Id: 'team-6',
    team2Id: 'team-8',
    scoreSets: [],
    status: 'PENDING',
    winnerId: null,
    scheduledTime: '2026-05-23T17:00:00Z',
    court: 'Sân 2'
  },

  // Knockout stage placeholder (Semifinal & Finals) matches
  {
    id: 'match-semi-1',
    tournamentId: 'tour-demo',
    round: 2, // Semis are level 2
    stage: 'KNOCKOUT',
    team1Id: null, // First of Group A (will be team-1 or team-2)
    team2Id: null, // Second of Group B
    scoreSets: [],
    status: 'PENDING',
    winnerId: null,
    scheduledTime: '2026-05-24T09:00:00Z',
    court: 'Sân Trung Tâm',
    nextMatchId: 'match-final',
    nextMatchPosition: 'team1'
  },
  {
    id: 'match-semi-2',
    tournamentId: 'tour-demo',
    round: 2,
    stage: 'KNOCKOUT',
    team1Id: null, // First of Group B
    team2Id: null, // Second of Group A
    scoreSets: [],
    status: 'PENDING',
    winnerId: null,
    scheduledTime: '2026-05-24T10:30:00Z',
    court: 'Sân Trung Tâm',
    nextMatchId: 'match-final',
    nextMatchPosition: 'team2'
  },
  {
    id: 'match-final',
    tournamentId: 'tour-demo',
    round: 1, // Finals level 1
    stage: 'KNOCKOUT',
    team1Id: null,
    team2Id: null,
    scoreSets: [],
    status: 'PENDING',
    winnerId: null,
    scheduledTime: '2026-05-24T15:00:00Z',
    court: 'Sân Trung Tâm',
    nextMatchId: null,
    nextMatchPosition: null
  }
];
