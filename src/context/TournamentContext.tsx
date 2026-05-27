import React, { createContext, useContext, useState, useEffect } from 'react';
import { Team, Sponsor, Post, Tournament, Match, Player, GroupStanding, MatchSet, Athlete, PairedTeam } from '../types';
import { mockTeams, mockSponsors, mockPosts, mockTournaments, mockMatches } from '../data/mockData';
import { db, auth, firebaseEnabled as isFirebaseConfigured, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, collectionGroup, getDoc } from 'firebase/firestore';

function cleanUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item));
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = cleanUndefined(value);
        }
      }
    }
    return cleaned;
  }
  return obj;
}

const defaultMockAthletes: Athlete[] = [
  { id: 'ath-1', name: 'Nguyễn Tiến Minh', age: 39, gender: 'Nam', nickname: 'Minh Legend', address: 'Quận 1, TP.HCM', phone: '0901234567' },
  { id: 'ath-2', name: 'Lê Đức Phát', age: 26, gender: 'Nam', nickname: 'Phát Sét', address: 'Quận Đống Đa, Hà Nội', phone: '0912345678' },
  { id: 'ath-3', name: 'Lê Duy Nam', age: 24, gender: 'Nam', nickname: 'Nam Bay', address: 'Quận Tây Hồ, Hà Nội', phone: '0977665544' },
  { id: 'ath-4', name: 'Nguyễn Thùy Linh', age: 27, gender: 'Nữ', nickname: 'Linh Hoa', address: 'TP. Biên Hòa, Đồng Nai', phone: '0988776655' },
  { id: 'ath-5', name: 'Vũ Thị Trang', age: 31, gender: 'Nữ', nickname: 'Trang Bão', address: 'Quận Hải Châu, Đà Nẵng', phone: '0944332211' },
  { id: 'ath-6', name: 'Trần Thị Phương', age: 23, gender: 'Nữ', nickname: 'Phương Thảo', address: 'Quận Cầu Giấy, Hà Nội', phone: '0933221100' },
  { id: 'ath-7', name: 'Phạm Cao Cường', age: 28, gender: 'Nam', nickname: 'Cường Chớp', address: 'Quận Hoàn Kiếm, Hà Nội', phone: '0911223344' },
  { id: 'ath-8', name: 'Nguyễn Hải Đăng', age: 24, gender: 'Nam', nickname: 'Đăng Lửa', address: 'Hải Châu, Đà Nẵng', phone: '0922334455' },
  { id: 'ath-9', name: 'Đỗ Tuấn Đức', age: 30, gender: 'Nam', nickname: 'Đức Bền', address: 'Hà Nội', phone: '0955667788' },
  { id: 'ath-10', name: 'Phạm Hồng Nam', age: 28, gender: 'Nam', nickname: 'Nam Hotboy', address: 'Quận Ba Đình, Hà Nội', phone: '0966778899' },
  { id: 'ath-11', name: 'Trần Quốc Khánh', age: 25, gender: 'Nam', nickname: 'Khánh Bay', address: 'Quận Hoàn Kiếm, Hà Nội', phone: '0977889900' },
  { id: 'ath-12', name: 'Nguyễn Đình Hoàng', age: 21, gender: 'Nam', nickname: 'Hoàng Nhỏ', address: 'Quận Long Biên, Hà Nội', phone: '0988990011' },
  { id: 'ath-13', name: 'Lê Ngọc Nguyên', age: 27, gender: 'Nam', nickname: 'Nguyên Gió', address: 'Quận Hải An, Hải Phòng', phone: '0912121212' },
  { id: 'ath-14', name: 'Nguyễn Minh Thành', age: 25, gender: 'Nam', nickname: 'Thành Thần', address: 'Quận Thanh Xuân, Hà Nội', phone: '0923232323' },
  { id: 'ath-15', name: 'Phạm Nhật Duy', age: 24, gender: 'Nam', nickname: 'Duy Sấm', address: 'Lê Chân, Hải Phòng', phone: '0934343434' },
  { id: 'ath-16', name: 'Vương Đình Đạt', age: 29, gender: 'Nam', nickname: 'Đạt Pháo', address: 'Hồ Tây, Hà Nội', phone: '0945454545' },
  { id: 'ath-17', name: 'Đinh Công Minh', age: 28, gender: 'Nam', nickname: 'Minh Nhỏ', address: 'Sơn Tây, Hà Nội', phone: '0956565656' },
  { id: 'ath-18', name: 'Nguyễn Thị Sen', age: 32, gender: 'Nữ', nickname: 'Sen Thơm', address: 'Bắc Giang', phone: '0967676767' },
  { id: 'ath-19', name: 'Trịnh Huy Hoàng', age: 26, gender: 'Nam', nickname: 'Hoàng Trọc', address: 'Nha Trang', phone: '0978787878' },
  { id: 'ath-20', name: 'Vũ Thanh Lâm', age: 24, gender: 'Nam', nickname: 'Lâm Sét', address: 'Vũng Tàu', phone: '0989898989' },
  { id: 'ath-21', name: 'Lâm Văn Hải', age: 25, gender: 'Nam', nickname: 'Hải Sói', address: 'Bình Dương', phone: '0990909090' },
  { id: 'ath-22', name: 'Đặng Quang Huy', age: 27, gender: 'Nam', nickname: 'Huy Bút', address: 'Cần Thơ', phone: '0911777777' },
  { id: 'ath-23', name: 'Vũ Ngọc Hùng', age: 29, gender: 'Nam', nickname: 'Hùng Lực', address: 'Bình Phước', phone: '0911888888' },
  { id: 'ath-24', name: 'Mai Thế Dũng', age: 33, gender: 'Nam', nickname: 'Dũng Trâu', address: 'Quận 3, TP.HCM', phone: '0911999999' }
];

interface TournamentContextType {
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
  sponsors: Sponsor[];
  posts: Post[];
  athletes: Athlete[];
  activeTournamentId: string | null;
  firebaseEnabled: boolean;
  firebaseStatus: 'DISCONNECTED' | 'ERROR' | 'CONNECTED';
  
  // State changers
  setActiveTournamentId: (id: string | null) => void;
  createTournament: (tournament: Omit<Tournament, 'id' | 'createdAt'>) => Tournament;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  deleteTournament: (id: string) => void;
  
  runDraw: (tournamentId: string, additionalUpdates?: Partial<Tournament>) => void;
  updateMatchScore: (matchId: string, scoreSets: MatchSet[], status: Match['status'], winnerId: string | null, servingTeam?: 1 | 2 | null) => void;
  updateMatchDetail: (matchId: string, updates: Partial<Match>) => void;
  
  // Teams management
  addTeam: (name: string, players: { name: string; role: 'Captain' | 'Member' }[]) => void;
  updateTeam: (id: string, name: string, players: Player[], avatar?: string) => void;
  deleteTeam: (id: string) => void;
  updateDrawnTeams: (tournamentId: string, updatedPairedTeams: PairedTeam[], updatedAthletes: Athlete[], additionalUpdates?: Partial<Tournament>) => void;
  
  // Athletes Management
  addAthlete: (athlete: Omit<Athlete, 'id'> & { id?: string }) => void;
  updateAthlete: (id: string, updates: Partial<Athlete>) => void;
  deleteAthlete: (id: string) => void;
  
  // Sponsors
  addSponsor: (sponsor: Omit<Sponsor, 'id'>) => void;
  deleteSponsor: (id: string) => void;
  
  // News
  addPost: (post: Omit<Post, 'id' | 'date'>) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  
  // Reset database to default
  resetData: () => void;
  uploadAllToFirebase?: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [activeTournamentId, setActiveTournamentIdState] = useState<string | null>(null);
  
  // Firebase configuration statuses
  const [firebaseEnabled] = useState<boolean>(isFirebaseConfigured);
  const [firebaseStatus, setFirebaseStatusState] = useState<'DISCONNECTED' | 'ERROR' | 'CONNECTED'>(
    isFirebaseConfigured ? 'CONNECTED' : 'DISCONNECTED'
  );

  // Firestore Specific Write Helper Functions (Direct Cloud Sync)
  const firestoreSetTournament = async (t: Tournament) => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'tournaments', t.id), cleanUndefined(t));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tournaments/${t.id}`);
      }
    }
  };

  const firestoreDeleteTournament = async (id: string) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'tournaments', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tournaments/${id}`);
      }
    }
  };

  const firestoreSetTeam = async (team: Team, tournamentId: string = 'general') => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'tournaments', tournamentId, 'teams', team.id), cleanUndefined(team));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tournaments/${tournamentId}/teams/${team.id}`);
      }
    }
  };

  const firestoreDeleteTeam = async (id: string, tournamentId: string = 'general') => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'tournaments', tournamentId, 'teams', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tournaments/${tournamentId}/teams/${id}`);
      }
    }
  };

  const firestoreSetMatch = async (match: Match) => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'tournaments', match.tournamentId, 'matches', match.id), cleanUndefined(match));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `tournaments/${match.tournamentId}/matches/${match.id}`);
      }
    }
  };

  const firestoreDeleteMatch = async (id: string, tournamentId: string) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'tournaments', tournamentId, 'matches', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `tournaments/${tournamentId}/matches/${id}`);
      }
    }
  };

  const firestoreSetSponsor = async (s: Sponsor) => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'sponsors', s.id), cleanUndefined(s));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `sponsors/${s.id}`);
      }
    }
  };

  const firestoreDeleteSponsor = async (id: string) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'sponsors', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `sponsors/${id}`);
      }
    }
  };

  const firestoreSetPost = async (p: Post) => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'posts', p.id), cleanUndefined(p));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `posts/${p.id}`);
      }
    }
  };

  const firestoreDeletePost = async (id: string) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'posts', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `posts/${id}`);
      }
    }
  };

  const firestoreSetAthlete = async (a: Athlete) => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'athletes', a.id), cleanUndefined(a));
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `athletes/${a.id}`);
      }
    }
  };

  const firestoreDeleteAthlete = async (id: string) => {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'athletes', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `athletes/${id}`);
      }
    }
  };

  // Helper to initialize custom live Database with Vietnamese MVP dataset on first boot
  const initializeFirebaseWithMockData = async () => {
    if (!db) return;
    try {
      console.log("Auto-initializing Firestore with high-fidelity system defaults...");
      // 0. Set initialization metadata so we know this database had template loaded (and deleting tournaments won't reset it)
      await setDoc(doc(db, 'system_state', 'config'), { initialized: true });

      // 1. Tournaments
      for (const t of mockTournaments) {
        await setDoc(doc(db, 'tournaments', t.id), cleanUndefined(t));
      }
      // 2. Sponsors
      for (const s of mockSponsors) {
        await setDoc(doc(db, 'sponsors', s.id), cleanUndefined(s));
      }
      // 3. Posts
      for (const p of mockPosts) {
        await setDoc(doc(db, 'posts', p.id), cleanUndefined(p));
      }
      // 4. Athletes
      for (const a of defaultMockAthletes) {
        await setDoc(doc(db, 'athletes', a.id), cleanUndefined(a));
      }
      // 5. Teams
      for (const team of mockTeams) {
        let parentTId = 'general';
        const associated = mockTournaments.find(t => t.teamIds?.includes(team.id) || t.pairedTeams?.some(pt => pt.name === team.name));
        if (associated) {
          parentTId = associated.id;
        }
        await setDoc(doc(db, 'tournaments', parentTId, 'teams', team.id), cleanUndefined(team));
      }
      // 6. Matches
      for (const m of mockMatches) {
        await setDoc(doc(db, 'tournaments', m.tournamentId, 'matches', m.id), cleanUndefined(m));
      }
      console.log("Firestore successfully populated and shared across all devices.");
    } catch (error) {
      console.error("Error auto-populating empty Firestore collections:", error);
    }
  };

  // Load initial data
  useEffect(() => {
    const localTourneys = localStorage.getItem('badminton_tournaments');
    const localTeams = localStorage.getItem('badminton_teams');
    const localMatches = localStorage.getItem('badminton_matches');
    const localSponsors = localStorage.getItem('badminton_sponsors');
    const localPosts = localStorage.getItem('badminton_posts');
    const localActive = localStorage.getItem('badminton_active_id');
    const localAthletes = localStorage.getItem('badminton_athletes');

    const parsedTourneys = localTourneys ? JSON.parse(localTourneys) : mockTournaments;
    const parsedTeams = localTeams ? JSON.parse(localTeams) : mockTeams;
    const parsedMatches = localMatches ? JSON.parse(localMatches) : mockMatches;
    const parsedSponsors = localSponsors ? JSON.parse(localSponsors) : mockSponsors;
    const parsedPosts = localPosts ? JSON.parse(localPosts) : mockPosts;
    const parsedAthletes = localAthletes ? JSON.parse(localAthletes) : defaultMockAthletes;
    const finalActive = localActive || (parsedTourneys.length > 0 ? parsedTourneys[0].id : 'tour-demo');

    setTournaments(parsedTourneys);
    setTeams(parsedTeams);
    setMatches(parsedMatches);
    setSponsors(parsedSponsors);
    setPosts(parsedPosts);
    setActiveTournamentIdState(finalActive);
    setAthletes(parsedAthletes);

    // Persist defaults if they weren't already created
    if (!localTourneys) localStorage.setItem('badminton_tournaments', JSON.stringify(parsedTourneys));
    if (!localTeams) localStorage.setItem('badminton_teams', JSON.stringify(parsedTeams));
    if (!localMatches) localStorage.setItem('badminton_matches', JSON.stringify(parsedMatches));
    if (!localSponsors) localStorage.setItem('badminton_sponsors', JSON.stringify(parsedSponsors));
    if (!localPosts) localStorage.setItem('badminton_posts', JSON.stringify(parsedPosts));
    if (!localAthletes) localStorage.setItem('badminton_athletes', JSON.stringify(parsedAthletes));
    if (!localActive) localStorage.setItem('badminton_active_id', finalActive);
  }, []);

  // Live real-time active subscription to Firestore Database collections
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    setFirebaseStatusState('CONNECTED');

    // Subscribe to tournaments
    const unsubTournaments = onSnapshot(collection(db, 'tournaments'), async (snapshot) => {
      if (snapshot.empty) {
        try {
          const configDoc = await getDoc(doc(db, 'system_state', 'config'));
          if (configDoc.exists() && configDoc.data()?.initialized) {
            // Yes, already initialized previously, meaning the user intentionally deleted all tournaments or wants a clean slide
            setTournaments([]);
            return;
          }
          // Brand new database, auto-initialize with template
          await initializeFirebaseWithMockData();
        } catch (error) {
          console.error("Error checking database initialization status:", error);
          setTournaments([]);
        }
      } else {
        const list: Tournament[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as Tournament);
        });
        setTournaments(list);
      }
    }, (err) => {
      console.error("Firestore subscription tournaments error:", err);
      setFirebaseStatusState('ERROR');
    });

    // Subscribe to sponsors
    const unsubSponsors = onSnapshot(collection(db, 'sponsors'), (snapshot) => {
      const list: Sponsor[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Sponsor);
      });
      setSponsors(list);
    }, (err) => console.error(err));

    // Subscribe to posts
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const list: Post[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Post);
      });
      setPosts(list);
    }, (err) => console.error(err));

    // Subscribe to athletes
    const unsubAthletes = onSnapshot(collection(db, 'athletes'), (snapshot) => {
      const list: Athlete[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Athlete);
      });
      setAthletes(list);
    }, (err) => console.error(err));

    // Subscribe to teams collectionGroup
    const unsubTeams = onSnapshot(collectionGroup(db, 'teams'), (snapshot) => {
      const list: Team[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Team);
      });
      const unique: Record<string, Team> = {};
      list.forEach(t => {
        unique[t.id] = t;
      });
      setTeams(Object.values(unique));
    }, (err) => console.error(err));

    // Subscribe to matches collectionGroup
    const unsubMatches = onSnapshot(collectionGroup(db, 'matches'), (snapshot) => {
      const list: Match[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Match);
      });
      setMatches(list);
    }, (err) => console.error(err));

    return () => {
      unsubTournaments();
      unsubSponsors();
      unsubPosts();
      unsubAthletes();
      unsubTeams();
      unsubMatches();
    };
  }, []);

  const uploadAllToFirebase = async () => {
    if (!isFirebaseConfigured || !db) {
      alert("Chưa cấu hình liên kết Firebase. Vui lòng thiết lập apiKey trong file firebase-applet-config.json");
      return;
    }

    try {
      // Set initialization metadata so we don't accidentally auto-populate with defaults later
      await setDoc(doc(db, 'system_state', 'config'), { initialized: true });

      // 1. Tournaments
      for (const t of tournaments) {
        await setDoc(doc(db, 'tournaments', t.id), cleanUndefined(t));
      }
      // 2. Sponsors
      for (const s of sponsors) {
        await setDoc(doc(db, 'sponsors', s.id), cleanUndefined(s));
      }
      // 3. Posts
      for (const p of posts) {
        await setDoc(doc(db, 'posts', p.id), cleanUndefined(p));
      }
      // 4. Athletes
      for (const a of athletes) {
        await setDoc(doc(db, 'athletes', a.id), cleanUndefined(a));
      }
      // 5. Teams
      for (const team of teams) {
        let parentTId = 'general';
        const associated = tournaments.find(t => t.teamIds?.includes(team.id) || t.pairedTeams?.some(pt => pt.name === team.name));
        if (associated) {
          parentTId = associated.id;
        } else if (activeTournamentId) {
          parentTId = activeTournamentId;
        }
        await setDoc(doc(db, 'tournaments', parentTId, 'teams', team.id), cleanUndefined(team));
      }
      // 6. Matches
      for (const m of matches) {
        await setDoc(doc(db, 'tournaments', m.tournamentId, 'matches', m.id), cleanUndefined(m));
      }
      alert("Đồng bộ dữ liệu bảng đấu lên Firestore thành công!");
    } catch (e: any) {
      console.error(e);
      alert("Lỗi đồng bộ: " + e.message);
    }
  };

  // Sync back to local storage helper
  const syncStorage = (
    updatedTournaments: Tournament[],
    updatedTeams: Team[],
    updatedMatches: Match[],
    updatedSponsors: Sponsor[],
    updatedPosts: Post[],
    activeId: string | null
  ) => {
    localStorage.setItem('badminton_tournaments', JSON.stringify(updatedTournaments));
    localStorage.setItem('badminton_teams', JSON.stringify(updatedTeams));
    localStorage.setItem('badminton_matches', JSON.stringify(updatedMatches));
    localStorage.setItem('badminton_sponsors', JSON.stringify(updatedSponsors));
    localStorage.setItem('badminton_posts', JSON.stringify(updatedPosts));
    if (activeId) {
      localStorage.setItem('badminton_active_id', activeId);
    } else {
      localStorage.removeItem('badminton_active_id');
    }
  };

  const setActiveTournamentId = (id: string | null) => {
    setActiveTournamentIdState(id);
    localStorage.setItem('badminton_active_id', id || '');
  };
 
  // Reset database back to factory
  const resetData = async () => {
    setTournaments(mockTournaments);
    setTeams(mockTeams);
    setMatches(mockMatches);
    setSponsors(mockSponsors);
    setPosts(mockPosts);
    setAthletes(defaultMockAthletes);
    localStorage.setItem('badminton_athletes', JSON.stringify(defaultMockAthletes));
    setActiveTournamentIdState('tour-demo');
    syncStorage(mockTournaments, mockTeams, mockMatches, mockSponsors, mockPosts, 'tour-demo');

    if (isFirebaseConfigured && db) {
      await initializeFirebaseWithMockData();
    }
  };
 
  // Creating tournament tournament
  const createTournament = (newT: Omit<Tournament, 'id' | 'createdAt'>): Tournament => {
    const id = 'tour-' + Date.now();
    const created: Tournament = {
      ...newT,
      id,
      createdAt: new Date().toISOString()
    };
    
    const updated = [created, ...tournaments];
    setTournaments(updated);
    setActiveTournamentIdState(id);
    syncStorage(updated, teams, matches, sponsors, posts, id);

    firestoreSetTournament(created);

    return created;
  };
 
  const updateTournament = (id: string, updates: Partial<Tournament>) => {
    const tourney = tournaments.find(t => t.id === id);
    if (!tourney) return;
 
    const mergedTourney: Tournament = { ...tourney, ...updates };
 
    if (updates.status === 'DEACTIVE') {
      const updatedMatches = matches.filter(m => m.tournamentId !== id);
      const deactiveTourney: Tournament = {
        ...mergedTourney,
        status: 'DEACTIVE'
      };
      const updatedTourneys = tournaments.map(t => t.id === id ? deactiveTourney : t);
      setTournaments(updatedTourneys);
      setMatches(updatedMatches);
      syncStorage(updatedTourneys, teams, updatedMatches, sponsors, posts, activeTournamentId);

      firestoreSetTournament(deactiveTourney);
      // Clean matches from Firestore
      const matchesToDelete = matches.filter(m => m.tournamentId === id);
      for (const m of matchesToDelete) {
        firestoreDeleteMatch(m.id, id);
      }
      return;
    }
 
    if (!mergedTourney.playingDays || mergedTourney.playingDays.length === 0) {
      // Clear matches of this tournament and update tournament status to PLANNING
      const updatedMatches = matches.filter(m => m.tournamentId !== id);
      const resetTourney: Tournament = {
        ...mergedTourney,
        status: 'PLANNING'
      };
      const updatedTourneys = tournaments.map(t => t.id === id ? resetTourney : t);
      setTournaments(updatedTourneys);
      setMatches(updatedMatches);
      syncStorage(updatedTourneys, teams, updatedMatches, sponsors, posts, activeTournamentId);

      firestoreSetTournament(resetTourney);
      // Clean matches from Firestore
      const matchesToDelete = matches.filter(m => m.tournamentId === id);
      for (const m of matchesToDelete) {
        firestoreDeleteMatch(m.id, id);
      }
      return;
    }
 
    // Find matches of this tournament
    const tourneyMatches = matches.filter(m => m.tournamentId === id);
    const hasMatches = tourneyMatches.length > 0;
    const hasStarted = tourneyMatches.some(m => m.status === 'LIVE' || m.status === 'COMPLETED');
 
    const structureRulesChanged = 
      (updates.hasSemis !== undefined && updates.hasSemis !== tourney.hasSemis) ||
      (updates.semisPairingType !== undefined && updates.semisPairingType !== tourney.semisPairingType) ||
      (updates.format !== undefined && updates.format !== tourney.format) ||
      (updates.numberOfTeams !== undefined && updates.numberOfTeams !== tourney.numberOfTeams) ||
      (updates.matchType !== undefined && updates.matchType !== tourney.matchType);
 
    const schedulingChanged = 
      updates.startDate !== undefined ||
      updates.endDate !== undefined ||
      updates.playingDays !== undefined ||
      updates.playingHoursStart !== undefined ||
      updates.playingHoursEnd !== undefined ||
      updates.matchDuration !== undefined ||
      updates.courtsCount !== undefined ||
      updates.courtNames !== undefined ||
      updates.courtNumbers !== undefined;
 
    if (hasMatches) {
      if (structureRulesChanged && !hasStarted) {
        // Since structure changed and it has not started, call runDraw to fully rebuild the matches safely
        runDraw(id, updates);
        return;
      } else if (schedulingChanged) {
        // Structure did not change, but scheduling / court / rule parameters might have changed.
        // We will just re-allocate schedules on the existing matches to preserve team pairings/customizations!
        const rescheduledMatches = allocateSchedules(tourneyMatches, mergedTourney);
        
        // Replace matches of this tournament in the global matches array
        const updatedMatches = matches.map(m => {
          if (m.tournamentId === id) {
            const rescheduled = rescheduledMatches.find(rm => rm.id === m.id);
            return rescheduled ? rescheduled : m;
          }
          return m;
        });
 
        const updatedTourneys = tournaments.map(t => t.id === id ? mergedTourney : t);
        setTournaments(updatedTourneys);
        setMatches(updatedMatches);
        syncStorage(updatedTourneys, teams, updatedMatches, sponsors, posts, activeTournamentId);

        firestoreSetTournament(mergedTourney);
        for (const rm of rescheduledMatches) {
          firestoreSetMatch(rm);
        }
        return;
      }
    }
 
    const updated = tournaments.map(t => t.id === id ? { ...t, ...updates } : t);
    setTournaments(updated);
    syncStorage(updated, teams, matches, sponsors, posts, activeTournamentId);

    const updatedTourneyObj = updated.find(t => t.id === id);
    if (updatedTourneyObj) {
      firestoreSetTournament(updatedTourneyObj);
    }
  };
 
  const deleteTournament = (id: string) => {
    const updatedTournaments = tournaments.filter(t => t.id !== id);
    const updatedMatches = matches.filter(m => m.tournamentId !== id);
    
    // Clean up teams linked exclusively to this deleted tournament
    const updatedTeams = teams.filter(t => {
      // 1. If it's a draw/auto-generated team for this tournament, delete it
      if (t.id.startsWith(`team-draw-${id}`) || t.id.includes(id)) {
        return false;
      }
      
      // 2. Check if the team is in any OTHER tournament
      const inOtherTourney = updatedTournaments.some(tourney => tourney.teamIds?.includes(t.id));
      if (inOtherTourney) return true;
      
      // 3. Check if the team is in any OTHER matches
      const inOtherMatch = updatedMatches.some(m => m.team1Id === t.id || m.team2Id === t.id);
      if (inOtherMatch) return true;
      
      // If none of these, but it WAS in the deleted tournament, we delete it
      const wasInDeletedTourney = tournaments.find(tourney => tourney.id === id)?.teamIds?.includes(t.id) || 
                                   matches.some(m => m.tournamentId === id && (m.team1Id === t.id || m.team2Id === t.id));
      
      if (wasInDeletedTourney) {
        return false;
      }
      
      return true;
    });
 
    setTournaments(updatedTournaments);
    setMatches(updatedMatches);
    setTeams(updatedTeams);
    
    let nextActive = activeTournamentId;
    if (activeTournamentId === id) {
      nextActive = updatedTournaments.length > 0 ? updatedTournaments[0].id : null;
      setActiveTournamentIdState(nextActive);
    }
    syncStorage(updatedTournaments, updatedTeams, updatedMatches, sponsors, posts, nextActive);

    firestoreDeleteTournament(id);
    const deletedMatches = matches.filter(m => m.tournamentId === id);
    for (const m of deletedMatches) {
      firestoreDeleteMatch(m.id, id);
    }
    const deletedTeams = teams.filter(t => !updatedTeams.some(ut => ut.id === t.id));
    for (const t of deletedTeams) {
      firestoreDeleteTeam(t.id, id);
    }
  };
 
  // Add tournament Team
  const addTeam = (name: string, playerInputs: { name: string; role: 'Captain' | 'Member' }[]) => {
    const newTeam: Team = {
      id: 'team-' + Date.now(),
      name,
      logo: ['emerald', 'blue', 'amber', 'rose', 'indigo', 'purple', 'cyan', 'orange'][Math.floor(Math.random() * 8)],
      players: playerInputs.map((p, i) => ({
        id: `player-${Date.now()}-${i}`,
        name: p.name,
        role: p.role
      }))
    };
    const updated = [...teams, newTeam];
    setTeams(updated);
    syncStorage(tournaments, updated, matches, sponsors, posts, activeTournamentId);

    const parentTId = activeTournamentId || 'general';
    firestoreSetTeam(newTeam, parentTId);
  };
 
  const updateTeam = (id: string, name: string, playerList: Player[], avatar?: string) => {
    const updated = teams.map(t => t.id === id ? { ...t, name, players: playerList, avatar: avatar !== undefined ? avatar : t.avatar } : t);
    setTeams(updated);
    syncStorage(tournaments, updated, matches, sponsors, posts, activeTournamentId);

    const updatedTeamObj = updated.find(t => t.id === id);
    if (updatedTeamObj) {
      const parentTId = tournaments.find(t => t.teamIds?.includes(id))?.id || activeTournamentId || 'general';
      firestoreSetTeam(updatedTeamObj, parentTId);
    }
  };
 
  const deleteTeam = (id: string) => {
    const updated = teams.filter(t => t.id !== id);
    setTeams(updated);
    syncStorage(tournaments, updated, matches, sponsors, posts, activeTournamentId);

    const parentTId = tournaments.find(t => t.teamIds?.includes(id))?.id || activeTournamentId || 'general';
    firestoreDeleteTeam(id, parentTId);
  };

  const updateDrawnTeams = (
    tournamentId: string,
    updatedPairedTeams: PairedTeam[],
    updatedAthletes: Athlete[],
    additionalUpdates?: Partial<Tournament>
  ) => {
    const tourneyObj = tournaments.find(t => t.id === tournamentId);
    const numGroups = additionalUpdates?.numGroups || tourneyObj?.numGroups || 2;

    // 1. Update the tournament details with the newly paired teams and athletes list
    const updatedTournaments = tournaments.map(t => {
      if (t.id === tournamentId) {
        return {
          ...t,
          ...additionalUpdates,
          pairedTeams: updatedPairedTeams,
          athletesAssigned: updatedAthletes
        };
      }
      return t;
    });
    setTournaments(updatedTournaments);

    // 2. Update the corresponding Team objects in the global teams list
    const updatedTeams = teams.map(t => {
      if (t.id.startsWith(`team-draw-${tournamentId}-`)) {
        // Extract the index from the team ID: team-draw-tournamentId-index-timestamp
        const suffix = t.id.substring(`team-draw-${tournamentId}-`.length);
        const dashIdx = suffix.indexOf('-');
        const indexStr = dashIdx !== -1 ? suffix.substring(0, dashIdx) : suffix;
        const index = parseInt(indexStr, 10);

        if (!isNaN(index) && updatedPairedTeams[index]) {
          const pt = updatedPairedTeams[index];
          const mappedPlayers: Player[] = pt.athleteIds.map((athId, pIdx) => {
            const correspondingAthlete = updatedAthletes.find(a => a.id === athId);
            return {
              id: athId,
              name: correspondingAthlete?.name || `VĐV ${pIdx + 1}`,
              role: pIdx === 0 ? 'Captain' : 'Member'
            };
          });

          let name = pt.name;
          if (!name.startsWith("Đội ")) {
            name = "Đội " + name;
          }

          const computedGroup = pt.group || (index % numGroups === 0 ? 'A' : (index % numGroups === 1 ? 'B' : (index % numGroups === 2 ? 'C' : 'D')));

          return {
            ...t,
            name: name,
            players: mappedPlayers,
            group: computedGroup
          };
        }
      }
      return t;
    });
    setTeams(updatedTeams);

    // 3. Save to localStorage and persistent store
    syncStorage(updatedTournaments, updatedTeams, matches, sponsors, posts, activeTournamentId);

    // Stream directly to Firestore
    const activeTourney = updatedTournaments.find(t => t.id === tournamentId);
    if (activeTourney) {
      firestoreSetTournament(activeTourney);
    }
    const derivedTeams = updatedTeams.filter(t => t.id.startsWith(`team-draw-${tournamentId}-`));
    for (const dt of derivedTeams) {
      firestoreSetTeam(dt, tournamentId);
    }
    for (const da of updatedAthletes) {
      firestoreSetAthlete(da);
    }
  };

  // Athletes Management Operations
  const addAthlete = (newAth: Omit<Athlete, 'id'> & { id?: string }) => {
    const id = newAth.id || 'ath-' + Date.now();
    const gender = newAth.gender && newAth.gender.trim() !== '' ? newAth.gender : 'Nam';
    const created: Athlete = { ...newAth, id, gender };
    const updated = [...athletes, created];
    setAthletes(updated);
    localStorage.setItem('badminton_athletes', JSON.stringify(updated));

    firestoreSetAthlete(created);
  };

  const updateAthlete = (id: string, updates: Partial<Athlete>) => {
    const updated = athletes.map(a => a.id === id ? { ...a, ...updates } : a);
    setAthletes(updated);
    localStorage.setItem('badminton_athletes', JSON.stringify(updated));

    const updatedAth = updated.find(a => a.id === id);
    if (updatedAth) {
      firestoreSetAthlete(updatedAth);
    }
  };

  const deleteAthlete = (id: string) => {
    const updated = athletes.filter(a => a.id !== id);
    setAthletes(updated);
    localStorage.setItem('badminton_athletes', JSON.stringify(updated));

    firestoreDeleteAthlete(id);
  };

  // Sponsor Operations
  const addSponsor = (s: Omit<Sponsor, 'id'>) => {
    const newSponsor: Sponsor = {
      ...s,
      id: 'sponsor-' + Date.now()
    };
    const updated = [...sponsors, newSponsor];
    setSponsors(updated);
    syncStorage(tournaments, teams, matches, updated, posts, activeTournamentId);

    firestoreSetSponsor(newSponsor);
  };

  const deleteSponsor = (id: string) => {
    const updated = sponsors.filter(s => s.id !== id);
    setSponsors(updated);
    syncStorage(tournaments, teams, matches, updated, posts, activeTournamentId);

    firestoreDeleteSponsor(id);
  };

  // News Operations
  const addPost = (p: Omit<Post, 'id' | 'date'>) => {
    const newPost: Post = {
      ...p,
      id: 'post-' + Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    syncStorage(tournaments, teams, matches, sponsors, updated, activeTournamentId);

    firestoreSetPost(newPost);
  };

  const updatePost = (id: string, updates: Partial<Post>) => {
    const updated = posts.map(p => p.id === id ? { ...p, ...updates } : p);
    setPosts(updated);
    syncStorage(tournaments, teams, matches, sponsors, updated, activeTournamentId);

    const updatedPost = updated.find(p => p.id === id);
    if (updatedPost) {
      firestoreSetPost(updatedPost);
    }
  };

  const deletePost = (id: string) => {
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    syncStorage(tournaments, teams, matches, sponsors, updated, activeTournamentId);

    firestoreDeletePost(id);
  };

  // Helper to allocate dates based on user schedule configurations (start/end dates, weekdays, hours, duration)
  const allocateSchedules = (matchesList: Match[], tourney: Tournament): Match[] => {
    const preserveScores = (list: Match[]) => {
      return list.map(m => {
        const existing = matches.find(ex => ex.id === m.id && ex.tournamentId === tourney.id);
        if (existing && (existing.status === 'LIVE' || existing.status === 'COMPLETED')) {
          return {
            ...m,
            status: existing.status,
            scoreSets: existing.scoreSets || [],
            winnerId: existing.winnerId,
            scheduledTime: existing.scheduledTime,
            court: existing.court,
            servingTeam: existing.servingTeam
          };
        }
        return m;
      });
    };

    if (!tourney.startDate || !tourney.endDate) {
      // Fallback: No scheduling configs, keep original times
      return preserveScores(matchesList);
    }

    const [startYear, startMonth, startDay] = tourney.startDate.split('-').map(Number);
    const start = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);

    const [endYear, endMonth, endDay] = tourney.endDate.split('-').map(Number);
    const end = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return preserveScores(matchesList);
    }

    // Keep only playing days that fall within the tourney start and end date range
    const validPlayingDays = (tourney.playingDays || []).filter(
      d => d >= tourney.startDate && d <= tourney.endDate
    );

    // If valid playing days is empty and no playingDays are configured, reset match schedule to empty
    if (!tourney.playingDays || tourney.playingDays.length === 0) {
      return matchesList.map(m => ({
        ...m,
        scheduledTime: undefined,
        court: undefined
      }));
    }

    // If valid playing days is empty, fallback to including all dates in the range
    const activePlayingDays = validPlayingDays.length > 0 ? validPlayingDays : (() => {
      const dates: string[] = [];
      const current = new Date(startYear, startMonth - 1, startDay, 12, 0, 0, 0);
      const loopEnd = new Date(endYear, endMonth - 1, endDay, 12, 0, 0, 0);
      let safety = 0;
      while (current <= loopEnd && safety < 100) {
        safety++;
        const monthStr = String(current.getMonth() + 1).padStart(2, '0');
        const dayStr = String(current.getDate()).padStart(2, '0');
        dates.push(`${current.getFullYear()}-${monthStr}-${dayStr}`);
        current.setDate(current.getDate() + 1);
      }
      return dates;
    })();

    const dayMap: Record<string, number> = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 0,
      'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6, 'CN': 0,
      'Thứ Hai': 1, 'Thứ Ba': 2, 'Thứ Tư': 3, 'Thứ Năm': 4, 'Thứ Sáu': 5, 'Thứ Bảy': 6, 'Chủ Nhật': 0,
      'Thứ hai': 1, 'Thứ ba': 2, 'Thứ tư': 3, 'Thứ năm': 4, 'Thứ sáu': 5, 'Thứ bảy': 6, 'Chủ nhật': 0
    };

    const allowedDayNums = activePlayingDays.map(d => dayMap[d]).filter(n => n !== undefined);

    const startHourStr = tourney.playingHoursStart || '08:00';
    const endHourStr = tourney.playingHoursEnd || '21:00';
    const [sh, sm] = startHourStr.split(':').map(Number);
    const [eh, em] = endHourStr.split(':').map(Number);

    const hourLimit = isNaN(sh) ? 8 : sh;
    const minLimit = isNaN(sm) ? 0 : sm;
    const limitEndHour = isNaN(eh) ? 21 : eh;
    const limitEndMin = isNaN(em) ? 0 : em;

    const matchDurationMin = tourney.matchDuration || 60;
    const courtsCount = tourney.courtsCount || 3;

    const slots: { time: Date; court: string }[] = [];
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

      const isAllowedString = activePlayingDays.includes(dateStringYMD);
      const isAllowedDayName = activePlayingDays.includes(enDayName);
      const isAllowedDayNum = allowedDayNums.includes(dayOfWeek);

      if (isAllowedString || isAllowedDayName || isAllowedDayNum || (allowedDayNums.length === 0 && activePlayingDays.length === 0)) {
        const dayStart = new Date(current);
        dayStart.setHours(hourLimit, minLimit, 0, 0);

        const dayEnd = new Date(current);
        dayEnd.setHours(limitEndHour, limitEndMin, 0, 0);

        const slotTime = new Date(dayStart);
        let daySafety = 0;
        while (slotTime.getTime() + matchDurationMin * 60 * 1000 <= dayEnd.getTime() && daySafety < 50) {
          daySafety++;
          for (let c = 1; c <= courtsCount; c++) {
            slots.push({
              time: new Date(slotTime),
              court: (() => {
                const num = tourney.courtNumbers?.[c - 1] || `Sân ${c}`;
                const name = tourney.courtNames?.[c - 1];
                return name ? `${num} (${name})` : num;
              })()
            });
          }
          slotTime.setMinutes(slotTime.getMinutes() + matchDurationMin);
        }
      }
      current.setDate(current.getDate() + 1);
    }

    if (slots.length === 0) {
      return preserveScores(matchesList);
    }

    const optimizeMatchOrder = (list: Match[]): Match[] => {
      const groupMatches = list.filter(m => m.stage === 'GROUP');
      const knockoutMatches = list.filter(m => m.stage === 'KNOCKOUT');

      if (groupMatches.length === 0) {
        return list;
      }

      const pendingGroup = groupMatches.filter(m => {
        const existing = matches.find(ex => ex.id === m.id && ex.tournamentId === tourney.id);
        return !(existing && (existing.status === 'LIVE' || existing.status === 'COMPLETED'));
      });
      const fixedGroup = groupMatches.filter(m => {
        const existing = matches.find(ex => ex.id === m.id && ex.tournamentId === tourney.id);
        return !!(existing && (existing.status === 'LIVE' || existing.status === 'COMPLETED'));
      });

      if (pendingGroup.length === 0) {
        return list;
      }

      const unassigned = [...pendingGroup];
      const ordered: Match[] = [];

      const lastPlayed: Record<string, number> = {};
      const remainingCounts: Record<string, number> = {};

      unassigned.forEach(m => {
        if (m.team1Id) remainingCounts[m.team1Id] = (remainingCounts[m.team1Id] || 0) + 1;
        if (m.team2Id) remainingCounts[m.team2Id] = (remainingCounts[m.team2Id] || 0) + 1;
      });

      fixedGroup.forEach(m => {
        if (m.scheduledTime) {
          const tIso = new Date(m.scheduledTime).toISOString();
          const slotIdx = slots.findIndex(s => s.time.toISOString() === tIso);
          if (slotIdx !== -1) {
            const periodIdx = Math.floor(slotIdx / courtsCount);
            if (m.team1Id && (lastPlayed[m.team1Id] === undefined || periodIdx > lastPlayed[m.team1Id])) {
              lastPlayed[m.team1Id] = periodIdx;
            }
            if (m.team2Id && (lastPlayed[m.team2Id] === undefined || periodIdx > lastPlayed[m.team2Id])) {
              lastPlayed[m.team2Id] = periodIdx;
            }
          }
        }
      });

      let periodIndex = 0;
      const fixedPeriodIndices = Object.values(lastPlayed);
      if (fixedPeriodIndices.length > 0) {
        periodIndex = Math.max(...fixedPeriodIndices) + 1;
      }

      let safety = 0;
      while (unassigned.length > 0 && safety < 1000) {
        safety++;
        const activeTeamsInPeriod = new Set<string>();
        let assignedInThisPeriod = 0;

        while (assignedInThisPeriod < courtsCount && unassigned.length > 0) {
          let bestIndex = -1;
          let bestScore = -Infinity;

          for (let i = 0; i < unassigned.length; i++) {
            const m = unassigned[i];
            const t1 = m.team1Id;
            const t2 = m.team2Id;

            if ((t1 && activeTeamsInPeriod.has(t1)) || (t2 && activeTeamsInPeriod.has(t2))) {
              continue;
            }

            let score = 0;

            if (t1 && lastPlayed[t1] !== undefined) {
              const gap = periodIndex - lastPlayed[t1];
              if (gap > 0) {
                score += 20000 / gap;
              }
            }
            if (t2 && lastPlayed[t2] !== undefined) {
              const gap = periodIndex - lastPlayed[t2];
              if (gap > 0) {
                score += 20000 / gap;
              }
            }

            if (t1) score += (remainingCounts[t1] || 0) * 15;
            if (t2) score += (remainingCounts[t2] || 0) * 15;

            score -= m.round * 5;

            if (score > bestScore) {
              bestScore = score;
              bestIndex = i;
            }
          }

          if (bestIndex !== -1) {
            const matchObj = unassigned[bestIndex];
            ordered.push(matchObj);
            unassigned.splice(bestIndex, 1);

            const t1 = matchObj.team1Id;
            const t2 = matchObj.team2Id;

            if (t1) {
              activeTeamsInPeriod.add(t1);
              lastPlayed[t1] = periodIndex;
              remainingCounts[t1] = Math.max(0, (remainingCounts[t1] || 0) - 1);
            }
            if (t2) {
              activeTeamsInPeriod.add(t2);
              lastPlayed[t2] = periodIndex;
              remainingCounts[t2] = Math.max(0, (remainingCounts[t2] || 0) - 1);
            }

            assignedInThisPeriod++;
          } else {
            break;
          }
        }

        periodIndex++;
        if (assignedInThisPeriod === 0 && unassigned.length > 0) {
          const forcedMatch = unassigned.shift()!;
          ordered.push(forcedMatch);
          const t1 = forcedMatch.team1Id;
          const t2 = forcedMatch.team2Id;
          if (t1) {
            lastPlayed[t1] = periodIndex;
            remainingCounts[t1] = Math.max(0, (remainingCounts[t1] || 0) - 1);
          }
          if (t2) {
            lastPlayed[t2] = periodIndex;
            remainingCounts[t2] = Math.max(0, (remainingCounts[t2] || 0) - 1);
          }
        }
      }

      return [...fixedGroup, ...ordered, ...knockoutMatches];
    };

    // Sort to schedule group stages first, and then knockouts
    const groupM = matchesList.filter(m => m.stage === 'GROUP').sort((a, b) => a.round - b.round);
    const knockoutM = matchesList.filter(m => m.stage === 'KNOCKOUT').sort((a, b) => b.round - a.round);
    let sortedMatches = [...groupM, ...knockoutM];

    if (tourney.optimizeSchedule) {
      sortedMatches = optimizeMatchOrder(sortedMatches);
    }

    let slotIndex = 0;
    const mapped = sortedMatches.map(m => {
      let assignedTime: string;
      let assignedCourt: string;

      if (slotIndex < slots.length) {
        assignedTime = slots[slotIndex].time.toISOString();
        assignedCourt = slots[slotIndex].court;
        slotIndex++;
      } else {
        const lastSlotTime = slots.length > 0 ? slots[slots.length - 1].time : new Date();
        const extraMin = (slotIndex - slots.length + 1) * matchDurationMin;
        const t = new Date(lastSlotTime.getTime() + extraMin * 60 * 1000);
        assignedTime = t.toISOString();
        assignedCourt = `Sân ${(slotIndex % courtsCount) + 1}`;
        slotIndex++;
      }

      return {
        ...m,
        scheduledTime: assignedTime,
        court: assignedCourt
      };
    });

    return preserveScores(mapped);
  };

  // Automated DRAW DIVISION & SCHEDULE GENERATION (Bốc thăm chia bảng, tính toán thuật toán ghép cặp)
  const runDraw = (tournamentId: string, additionalUpdates?: Partial<Tournament>) => {
    let tourney = tournaments.find(t => t.id === tournamentId);
    if (!tourney) return;

    if (additionalUpdates) {
      tourney = { ...tourney, ...additionalUpdates };
    }

    if (!tourney.playingDays || tourney.playingDays.length === 0) {
      // Clear matches of this tournament and update tournament status to PLANNING
      const updatedMatches = matches.filter(m => m.tournamentId !== tournamentId);
      const updatedTourneys = tournaments.map(t => {
        if (t.id === tournamentId) {
          return { ...t, ...additionalUpdates, status: 'PLANNING' as const };
        }
        return t;
      });
      setTournaments(updatedTourneys);
      setMatches(updatedMatches);
      syncStorage(updatedTourneys, teams, updatedMatches, sponsors, posts, activeTournamentId);
      return;
    }

    // Filter clear matches of this tournament
    let cleanMatches = matches.filter(m => m.tournamentId !== tournamentId);
    
    // Auto-create dummy CLBs if not enough teams in system
    const neededTeamsCount = tourney.numberOfTeams;
    let fallbackTeams = [...teams];
    if (fallbackTeams.length < neededTeamsCount) {
      const dummyPool = [
        'CLB Cầu Lông Ba Đình', 'CLB Cầu Lông Cầu Giấy', 'CLB Tây Hồ Sport',
        'CLB Đống Đa Pro', 'CLB Hoàn Kiếm Smashing', 'CLB Sông Hồng Badminton',
        'CLB Sân Thống Nhất', 'CLB Tây Hồ Club', 'CLB Hai Bà Trưng',
        'CLB Long Biên Flyers', 'CLB Hà Đông Open', 'CLB Hoàng Mai Gold',
        'CLB Thắng Lợi', 'CLB Đại Học Bách Khoa', 'CLB Vinschool', 'CLB Hoàng Gia'
      ];
      const unusedNames = dummyPool.filter(name => !teams.some(t => t.name === name));
      let addedCount = 0;
      while (fallbackTeams.length < neededTeamsCount) {
        let name = '';
        if (addedCount < unusedNames.length) {
          name = unusedNames[addedCount];
        } else {
          name = `CLB Khách mời ${fallbackTeams.length + 1}`;
        }
        const newTeam: Team = {
          id: `team-auto-${Date.now()}-${fallbackTeams.length}`,
          name,
          logo: ['indigo', 'rose', 'purple', 'cyan', 'orange'][fallbackTeams.length % 5],
          players: [
            { id: `p-${Date.now()}-1`, name: 'Nguyễn Văn Hùng', role: 'Captain' },
            { id: `p-${Date.now()}-2`, name: 'Trần Minh Quân', role: 'Member' },
            { id: `p-${Date.now()}-3`, name: 'Lê Hoàng Minh', role: 'Member' }
          ]
        };
        fallbackTeams.push(newTeam);
        addedCount++;
      }
    }

    // Clean up any previously drawn teams for this specific tournament to avoid duplicates
    const cleanTeams = teams.filter(t => !t.id.startsWith(`team-draw-${tournamentId}-`));
    const finalTournamentTeams: Team[] = [];
    const isSingles = tourney.matchType === 'SINGLES';

    if (tourney.pairedTeams && tourney.pairedTeams.length === neededTeamsCount) {
      tourney.pairedTeams.forEach((pt, index) => {
        let name = pt.name;
        if (!name.startsWith("Đội ")) {
          name = "Đội " + name;
        }
        const mappedPlayers: Player[] = pt.athleteIds.map((athId, pIdx) => {
          const correspondingAthlete = tourney.athletesAssigned?.find(a => a.id === athId);
          return {
            id: athId,
            name: correspondingAthlete?.name || `VĐV ${pIdx + 1}`,
            role: pIdx === 0 ? 'Captain' : 'Member'
          };
        });
        
        finalTournamentTeams.push({
          id: `team-draw-${tournamentId}-${index}-${Date.now()}`,
          name: name,
          logo: ['emerald', 'blue', 'amber', 'rose', 'indigo', 'purple', 'cyan', 'orange'][index % 8],
          players: mappedPlayers
        });
      });
    } else if (tourney.athletesAssigned && tourney.athletesAssigned.length > 0) {
      for (let index = 0; index < neededTeamsCount; index++) {
        let players: Player[] = [];
        let name = "";
        
        if (isSingles) {
          const ath = tourney.athletesAssigned?.[index];
          if (ath) {
            players = [{ id: ath.id, name: ath.name, role: 'Captain' }];
            name = `Đội ${ath.name}`;
          } else {
            players = [{ id: `placeholder-${index}`, name: `VĐV ${index + 1}`, role: 'Captain' }];
            name = `Đội ${index + 1}`;
          }
        } else {
          const ath1 = tourney.athletesAssigned?.[index * 2];
          const ath2 = tourney.athletesAssigned?.[index * 2 + 1];
          if (ath1) players.push({ id: ath1.id, name: ath1.name, role: 'Captain' });
          if (ath2) players.push({ id: ath2.id, name: ath2.name, role: 'Member' });
          
          const namesStr = [ath1?.name, ath2?.name].filter(Boolean).join(' . ') || `${index * 2 + 1} & ${index * 2 + 2}`;
          name = `Đội ${namesStr}`;
        }

        finalTournamentTeams.push({
          id: `team-draw-${tournamentId}-${index}-${Date.now()}`,
          name: name,
          logo: ['emerald', 'blue', 'amber', 'rose', 'indigo', 'purple', 'cyan', 'orange'][index % 8],
          players: players
        });
      }
    } else {
      // Fallback: use existing or auto dummy teams
      let candidateTeams = [...fallbackTeams];
      if (tourney.teamIds && tourney.teamIds.length > 0) {
        candidateTeams = fallbackTeams.filter(t => tourney.teamIds?.includes(t.id));
      }
      const shuffledTeams = [...candidateTeams].sort(() => Math.random() - 0.5);
      const selectedTeamsCount = Math.min(shuffledTeams.length, tourney.numberOfTeams);
      const tempTournamentTeams = shuffledTeams.slice(0, selectedTeamsCount);

      tempTournamentTeams.forEach((t, index) => {
        let name = t.name;
        if (!name.startsWith("Đội ")) {
          name = "Đội " + name;
        }
        finalTournamentTeams.push({
          id: `team-draw-${tournamentId}-${index}-${Date.now()}`,
          name: name,
          logo: t.logo || ['emerald', 'blue', 'amber', 'rose', 'indigo', 'purple', 'cyan', 'orange'][index % 8],
          players: t.players
        });
      });
    }

    const updatedTeamsList = [...cleanTeams, ...finalTournamentTeams];
    let freshTeams = [...updatedTeamsList];
    let tournamentTeams = [...finalTournamentTeams];

    if (tourney.format === 'ROUND_ROBIN') {
      // Round robin algorithm
      // Put everyone in Bảng A
      const groupName = 'Vòng Tròn';
      const teamState = freshTeams.map(t => {
        if (tournamentTeams.some(tt => tt.id === t.id)) {
          return { ...t, group: 'A' };
        }
        return t;
      });
      freshTeams = teamState;

      // Generate round robin match combinations (Berger system / Scheduler)
      const list = tournamentTeams.map(t => t.id);
      if (list.length % 2 !== 0) {
        list.push('BYE'); // odd number check (null opponent represents BYE)
      }
      
      const roundsCount = list.length - 1;
      const halfSize = list.length / 2;
      const newMatchesList: Match[] = [];

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
            const dateOffset = r * 24 * 60 * 60 * 1000; // staggered by days
            const gameTime = new Date(Date.now() + dateOffset + (i * 2 + 8) * 60 * 60 * 1000);
            
            newMatchesList.push({
              id: `match-rr-${tournamentId}-${r}-${i}`,
              tournamentId,
              round: r + 1,
              stage: 'GROUP',
              groupName,
              team1Id: team1,
              team2Id: team2,
              scoreSets: [],
              status: 'PENDING',
              winnerId: null,
              scheduledTime: gameTime.toISOString(),
              court: `Sân ${((i) % 3) + 1}`
            });
          }
        }
      }

      // Create KO bracket wrappers for ROUND_ROBIN
      const koBaseTime = Date.now() + (roundsCount + 1) * 24 * 60 * 60 * 1000;

      const finalMatch: Match = {
        id: `match-ko-${tournamentId}-final`,
        tournamentId,
        round: 1, // Final
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date(koBaseTime + 1.2 * 24 * 60 * 60 * 1000).toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: null,
        nextMatchPosition: null,
        isFinal: true
      };

      const thirdPlaceMatch: Match = {
        id: `match-ko-${tournamentId}-third`,
        tournamentId,
        round: 1.5, // Tranh hạng 3
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date(koBaseTime + 1 * 24 * 60 * 60 * 1000).toISOString(),
        court: 'Sân Số 2',
        nextMatchId: null,
        nextMatchPosition: null,
        isThirdPlace: true
      };

      if (tourney.hasSemis !== false) {
        const semi1: Match = {
          id: `match-ko-${tournamentId}-semi1`,
          tournamentId,
          round: 2, // Semifinal 1
          stage: 'KNOCKOUT',
          team1Id: null,
          team2Id: null,
          scoreSets: [],
          status: 'PENDING',
          winnerId: null,
          scheduledTime: new Date(koBaseTime).toISOString(),
          court: 'Sân Trung Tâm',
          nextMatchId: finalMatch.id,
          nextMatchPosition: 'team1'
        };

        const semi2: Match = {
          id: `match-ko-${tournamentId}-semi2`,
          tournamentId,
          round: 2, // Semifinal 2
          stage: 'KNOCKOUT',
          team1Id: null,
          team2Id: null,
          scoreSets: [],
          status: 'PENDING',
          winnerId: null,
          scheduledTime: new Date(koBaseTime + 120 * 60 * 1000).toISOString(),
          court: 'Sân Trung Tâm',
          nextMatchId: finalMatch.id,
          nextMatchPosition: 'team2'
        };

        newMatchesList.push(semi1, semi2);
      }

      newMatchesList.push(finalMatch, thirdPlaceMatch);
      
      const scheduledNewMatches = allocateSchedules(newMatchesList, tourney);
      const finalMatches = [...cleanMatches, ...scheduledNewMatches];
      setMatches(finalMatches);
      setTeams(freshTeams);
      const finalTourneys = tournaments.map(t => t.id === tournamentId ? { ...t, ...additionalUpdates, status: 'DRAW_DONE' as const } : t);
      setTournaments(finalTourneys);
      syncStorage(
        finalTourneys,
        freshTeams,
        finalMatches,
        sponsors,
        posts,
        activeTournamentId
      );

      if (isFirebaseConfigured && db) {
        const finalTourneyObj = finalTourneys.find(t => t.id === tournamentId);
        if (finalTourneyObj) {
          firestoreSetTournament(finalTourneyObj);
        }
        const teamsToSave = freshTeams.filter(t => t.id.startsWith(`team-draw-${tournamentId}-`));
        for (const t of teamsToSave) {
          firestoreSetTeam(t, tournamentId);
        }
        const oldMatches = matches.filter(m => m.tournamentId === tournamentId);
        for (const m of oldMatches) {
          firestoreDeleteMatch(m.id, tournamentId);
        }
        for (const m of scheduledNewMatches) {
          firestoreSetMatch(m);
        }
      }

    } else if (tourney.format === 'KNOCKOUT') {
      // pure single-elimination bracket
      // supported numbers: 8, 4, 16. In our mock case we fit 8 teams into Quarterfinals.
      const participants = tournamentTeams;
      const count = participants.length;
      
      // We will create the bracket
      const matchesToCreate: Match[] = [];
      
      // Let's create level 3 (Quarterfinals: 4 matches), level 2 (Semifinals: 2 matches), level 1 (Final: 1 match)
      // Level 3 (Quarters) -> match-ko-q1..q4
      // Level 2 (Semis) -> match-ko-s1..s2
      // Level 1 (Final) -> match-ko-f1
      
      const finalMatch: Match = {
        id: `match-ko-${tournamentId}-f1`,
        tournamentId,
        round: 1, // Vòng chung kết (Final)
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: null,
        nextMatchPosition: null,
        isFinal: true
      };

      const thirdPlaceMatch: Match = {
        id: `match-ko-${tournamentId}-3rd`,
        tournamentId,
        round: 1.5, // Tranh hạng 3
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date(Date.now() + 2.8 * 24 * 60 * 60 * 1000).toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: null,
        nextMatchPosition: null,
        isThirdPlace: true
      };

      const semi1: Match = {
        id: `match-ko-${tournamentId}-s1`,
        tournamentId,
        round: 2, // Vòng bán kết (Semifinal)
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
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
        scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: finalMatch.id,
        nextMatchPosition: 'team2'
      };

      matchesToCreate.push(finalMatch, thirdPlaceMatch, semi1, semi2);

      // Quarters (4 matches) if we have 8 teams
      if (count >= 8) {
        for (let i = 0; i < 4; i++) {
          const team1 = participants[i * 2] || null;
          const team2 = participants[i * 2 + 1] || null;
          
          matchesToCreate.push({
            id: `match-ko-${tournamentId}-q${i+1}`,
            tournamentId,
            round: 3, // Vòng tứ kết (Quarterfinal)
            stage: 'KNOCKOUT',
            team1Id: team1 ? team1.id : null,
            team2Id: team2 ? team2.id : null,
            scoreSets: [],
            status: 'PENDING',
            winnerId: null,
            scheduledTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + i * 120 * 60 * 1000).toISOString(),
            court: `Sân ${(i % 2) + 1}`,
            nextMatchId: i < 2 ? semi1.id : semi2.id,
            nextMatchPosition: (i % 2 === 0) ? 'team1' : 'team2'
          });
        }
      } else {
        // Just Semi directly! Let's fill semis with the teams
        semi1.team1Id = participants[0]?.id || null;
        semi1.team2Id = participants[1]?.id || null;
        semi2.team1Id = participants[2]?.id || null;
        semi2.team2Id = participants[3]?.id || null;
      }

      const scheduledNewMatches = allocateSchedules(matchesToCreate, tourney);
      const finalK0Matches = [...cleanMatches, ...scheduledNewMatches];
      setMatches(finalK0Matches);
      setTeams(freshTeams);
      const finalTourneys = tournaments.map(t => t.id === tournamentId ? { ...t, ...additionalUpdates, status: 'DRAW_DONE' as const } : t);
      setTournaments(finalTourneys);
      syncStorage(
        finalTourneys,
        freshTeams,
        finalK0Matches,
        sponsors,
        posts,
        activeTournamentId
      );

      if (isFirebaseConfigured && db) {
        const finalTourneyObj = finalTourneys.find(t => t.id === tournamentId);
        if (finalTourneyObj) {
          firestoreSetTournament(finalTourneyObj);
        }
        const teamsToSave = freshTeams.filter(t => t.id.startsWith(`team-draw-${tournamentId}-`));
        for (const t of teamsToSave) {
          firestoreSetTeam(t, tournamentId);
        }
        const oldMatches = matches.filter(m => m.tournamentId === tournamentId);
        for (const m of oldMatches) {
          firestoreDeleteMatch(m.id, tournamentId);
        }
        for (const m of scheduledNewMatches) {
          firestoreSetMatch(m);
        }
      }

    } else if (tourney.format === 'GROUP_KNOCKOUT') {
      const numGroups = tourney.numGroups || 2;
      const groupLists: Team[][] = Array.from({ length: numGroups }, () => []);

      // Associate group tag dynamically based on selection or index fallback
      const teamState = freshTeams.map(t => {
        const teamIdx = tournamentTeams.findIndex(tt => tt.id === t.id);
        if (teamIdx !== -1) {
          const pairedT = tourney.pairedTeams?.[teamIdx];
          let groupLetter = pairedT?.group;
          if (!groupLetter) {
            const gIdx = teamIdx % numGroups;
            groupLetter = String.fromCharCode(65 + gIdx); // 'A', 'B', 'C', 'D'
          }
          return { ...t, group: groupLetter };
        }
        return t;
      });
      freshTeams = teamState;

      // Classified lists for matchmaking round robin
      tournamentTeams.forEach((t, idx) => {
        const pairedT = tourney.pairedTeams?.[idx];
        let groupLetter = pairedT?.group;
        if (!groupLetter) {
          const gIdx = idx % numGroups;
          groupLetter = String.fromCharCode(65 + gIdx); // 'A', 'B', 'C', 'D'
        }
        const gIdx = groupLetter.charCodeAt(0) - 65;
        if (gIdx >= 0 && gIdx < numGroups) {
          groupLists[gIdx].push(t);
        } else {
          groupLists[idx % numGroups].push(t);
        }
      });

      const newMatchesList: Match[] = [];

      // Dynamic Round-robin Generator per group supporting any uneven group sizes
      const generateGroupStage = (groupList: Team[], grpName: string, grpId: string) => {
        if (groupList.length < 2) return;
        const list = [...groupList];
        if (list.length % 2 !== 0) {
          list.push(null as any); // represent BYE as null
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

            if (team1 && team2) {
              const roundNo = r + 1;
              const dateOffset = r * 24 * 60 * 60 * 1000;
              const sched = new Date(Date.now() + dateOffset + (i * 2 + 8) * 60 * 60 * 1000);
              
              newMatchesList.push({
                id: `match-gk-${tournamentId}-${grpId}-${r}-${i}`,
                tournamentId,
                round: roundNo,
                stage: 'GROUP',
                groupName: grpName,
                team1Id: team1.id,
                team2Id: team2.id,
                scoreSets: [],
                status: 'PENDING',
                winnerId: null,
                scheduledTime: sched.toISOString(),
                court: `Sân ${(i % (tourney.courtsCount || 3)) + 1}`
              });
            }
          }
        }
      };

      groupLists.forEach((list, gIdx) => {
        const groupLetter = String.fromCharCode(65 + gIdx); // 'A', 'B', 'C', 'D'
        generateGroupStage(list, `Bảng ${groupLetter}`, groupLetter);
      });

      // Create KO bracket wrappers
      const finalMatch: Match = {
        id: `match-ko-${tournamentId}-final`,
        tournamentId,
        round: 1, // Level 1 is Final
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        court: 'Sân Trung Tâm',
        nextMatchId: null,
        nextMatchPosition: null,
        isFinal: true
      };

      const thirdPlaceMatch: Match = {
        id: `match-ko-${tournamentId}-third`,
        tournamentId,
        round: 1.5, // Tranh hạng 3
        stage: 'KNOCKOUT',
        team1Id: null,
        team2Id: null,
        scoreSets: [],
        status: 'PENDING',
        winnerId: null,
        scheduledTime: new Date(Date.now() + 3.8 * 24 * 60 * 60 * 1000).toISOString(),
        court: 'Sân Số 2',
        nextMatchId: null,
        nextMatchPosition: null,
        isThirdPlace: true
      };

      if (tourney.hasSemis !== false) {
        const semi1: Match = {
          id: `match-ko-${tournamentId}-semi1`,
          tournamentId,
          round: 2, // Semifinal 1
          stage: 'KNOCKOUT',
          team1Id: null, // Derived when group finishes
          team2Id: null,
          scoreSets: [],
          status: 'PENDING',
          winnerId: null,
          scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          court: 'Sân Trung Tâm',
          nextMatchId: finalMatch.id,
          nextMatchPosition: 'team1'
        };

        const semi2: Match = {
          id: `match-ko-${tournamentId}-semi2`,
          tournamentId,
          round: 2, // Semifinal 2
          stage: 'KNOCKOUT',
          team1Id: null,
          team2Id: null,
          scoreSets: [],
          status: 'PENDING',
          winnerId: null,
          scheduledTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000).toISOString(),
          court: 'Sân Trung Tâm',
          nextMatchId: finalMatch.id,
          nextMatchPosition: 'team2'
        };

        newMatchesList.push(semi1, semi2);
      }

      newMatchesList.push(finalMatch, thirdPlaceMatch);

      const scheduledNewMatches = allocateSchedules(newMatchesList, tourney);
      const finalMatches = [...cleanMatches, ...scheduledNewMatches];
      setMatches(finalMatches);
      setTeams(freshTeams);
      const finalTourneys = tournaments.map(t => t.id === tournamentId ? { ...t, ...additionalUpdates, status: 'DRAW_DONE' as const } : t);
      setTournaments(finalTourneys);
      syncStorage(
        finalTourneys,
        freshTeams,
        finalMatches,
        sponsors,
        posts,
        activeTournamentId
      );

      if (isFirebaseConfigured && db) {
        const finalTourneyObj = finalTourneys.find(t => t.id === tournamentId);
        if (finalTourneyObj) {
          firestoreSetTournament(finalTourneyObj);
        }
        const teamsToSave = freshTeams.filter(t => t.id.startsWith(`team-draw-${tournamentId}-`));
        for (const t of teamsToSave) {
          firestoreSetTeam(t, tournamentId);
        }
        const oldMatches = matches.filter(m => m.tournamentId === tournamentId);
        for (const m of oldMatches) {
          firestoreDeleteMatch(m.id, tournamentId);
        }
        for (const m of scheduledNewMatches) {
          firestoreSetMatch(m);
        }
      }
    }
  };

  // Update match scoring logic (Deuce 21 up to max 30) - Best of 3 sets automatically
  const updateMatchScore = (matchId: string, scoreSets: MatchSet[], status: Match['status'], winnerId: string | null, servingTeam?: 1 | 2 | null) => {
    // Find matching game
    const matchObj = matches.find(m => m.id === matchId);
    if (!matchObj) return;

    let computedWinnerId = winnerId;
    
    // Automatically calculate sets won to determine winner if sets are completed
    if (status === 'COMPLETED' && scoreSets.length > 0) {
      let team1SetsWon = 0;
      let team2SetsWon = 0;
      
      scoreSets.forEach(set => {
        if (set.team1Score > set.team2Score) team1SetsWon++;
        else if (set.team2Score > set.team1Score) team2SetsWon++;
      });
      
      if (team1SetsWon > team2SetsWon) {
        computedWinnerId = matchObj.team1Id;
      } else if (team2SetsWon > team1SetsWon) {
        computedWinnerId = matchObj.team2Id;
      }
    }

    // Let's perform the update
    const updatedMatches = matches.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          scoreSets,
          status,
          winnerId: computedWinnerId,
          servingTeam: servingTeam !== undefined ? servingTeam : m.servingTeam
        };
      }
      return m;
    });

    // CASCADE WINNER IN THE SINGLE-ELIMINATION BRACKET:
    // If this completed match has a nextMatchId, we must automatically populate team1 or team2 in that next match!
    if (status === 'COMPLETED' && computedWinnerId && matchObj.nextMatchId) {
      for (let i = 0; i < updatedMatches.length; i++) {
        if (updatedMatches[i].id === matchObj.nextMatchId) {
          if (matchObj.nextMatchPosition === 'team1') {
            updatedMatches[i].team1Id = computedWinnerId;
          } else if (matchObj.nextMatchPosition === 'team2') {
            updatedMatches[i].team2Id = computedWinnerId;
          }
          break;
        }
      }
    }

    // CASCADE LOSER TO 3RD PLACE MATCH:
    if (status === 'COMPLETED' && matchObj.round === 2) {
      const semiWinnerId = computedWinnerId;
      const semiLoserId = matchObj.team1Id === semiWinnerId ? matchObj.team2Id : matchObj.team1Id;
      if (semiLoserId) {
        for (let i = 0; i < updatedMatches.length; i++) {
          if (updatedMatches[i].tournamentId === matchObj.tournamentId && updatedMatches[i].isThirdPlace) {
            if (matchObj.nextMatchPosition === 'team1') {
              updatedMatches[i].team1Id = semiLoserId;
            } else if (matchObj.nextMatchPosition === 'team2') {
              updatedMatches[i].team2Id = semiLoserId;
            }
            break;
          }
        }
      }
    }

    // AUTOMATIC GROUP-TO-KNOCKOUT PROMOTION:
    const tourneyObj = tournaments.find(t => t.id === matchObj.tournamentId);
    if (tourneyObj && (tourneyObj.format === 'GROUP_KNOCKOUT' || tourneyObj.format === 'ROUND_ROBIN')) {
      const gMatches = updatedMatches.filter(m => m.tournamentId === tourneyObj.id && m.stage === 'GROUP');
      const allGroupMatchesFinished = gMatches.length > 0 && gMatches.every(m => m.status === 'COMPLETED');
      
      if (allGroupMatchesFinished) {
        // Standings calculation helper matching international standard BWF rules
        const calculateStandings = (grpName: string, grpTeamsList: Team[]) => {
          const tMatches = gMatches.filter(m => m.groupName === grpName);
          const standingsMap: Record<string, any> = {};
          
          grpTeamsList.forEach(t => {
            standingsMap[t.id] = {
              teamId: t.id,
              teamName: t.name,
              matchesPlayed: 0,
              matchesWon: 0,
              matchesLost: 0,
              setsWon: 0,
              setsLost: 0,
              pointsWon: 0,
              pointsDifference: 0
            };
          });

          tMatches.forEach(m => {
            if (!m.team1Id || !m.team2Id) return;
            const t1 = standingsMap[m.team1Id];
            const t2 = standingsMap[m.team2Id];
            if (!t1 || !t2) return;

            t1.matchesPlayed++;
            t2.matchesPlayed++;

            const isT1MatchWinner = m.winnerId === m.team1Id;
            if (isT1MatchWinner) {
              t1.matchesWon++;
              t2.matchesLost++;
              t1.pointsWon += tourneyObj.pointsPerVictory || 3;
            } else {
              t2.matchesWon++;
              t1.matchesLost++;
              t2.pointsWon += tourneyObj.pointsPerVictory || 3;
            }

            m.scoreSets.forEach(set => {
              if (set.team1Score > set.team2Score) {
                t1.setsWon++;
                t2.setsLost++;
              } else if (set.team2Score > set.team1Score) {
                t2.setsWon++;
                t1.setsLost++;
              }
              t1.pointsDifference += (set.team1Score - set.team2Score);
              t2.pointsDifference += (set.team2Score - set.team1Score);
            });
          });

          return Object.values(standingsMap).sort((a: any, b: any) => {
            if (b.pointsWon !== a.pointsWon) return b.pointsWon - a.pointsWon;
            if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
            const aSetDiff = a.setsWon - a.setsLost;
            const bSetDiff = b.setsWon - b.setsLost;
            if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
            return b.pointsDifference - a.pointsDifference;
          }) as any[];
        };

        if (tourneyObj.format === 'GROUP_KNOCKOUT') {
          const groupATeams = teams.filter(t => t.group === 'A');
          const groupBTeams = teams.filter(t => t.group === 'B');
          const standingsA = calculateStandings('Bảng A', groupATeams);
          const standingsB = calculateStandings('Bảng B', groupBTeams);

          const A1 = standingsA[0]?.teamId || null;
          const A2 = standingsA[1]?.teamId || null;
          const B1 = standingsB[0]?.teamId || null;
          const B2 = standingsB[1]?.teamId || null;

          if (tourneyObj.hasSemis !== false) {
            updatedMatches.forEach(mut => {
              if (mut.tournamentId === tourneyObj.id && mut.stage === 'KNOCKOUT') {
                if (mut.id.endsWith('semi1')) {
                  if (tourneyObj.semisPairingType === '1v2_3v4') {
                    mut.team1Id = A1;
                    mut.team2Id = B1;
                  } else {
                    mut.team1Id = A1;
                    mut.team2Id = B2;
                  }
                } else if (mut.id.endsWith('semi2')) {
                  if (tourneyObj.semisPairingType === '1v2_3v4') {
                    mut.team1Id = A2;
                    mut.team2Id = B2;
                  } else {
                    mut.team1Id = B1;
                    mut.team2Id = A2;
                  }
                }
              }
            });
          } else {
            // No Semis: Nhất A vs Nhất B in Final, Nhì A vs Nhì B in 3rd place
            updatedMatches.forEach(mut => {
              if (mut.tournamentId === tourneyObj.id && mut.stage === 'KNOCKOUT') {
                if (mut.isFinal) {
                  mut.team1Id = A1;
                  mut.team2Id = B1;
                } else if (mut.isThirdPlace) {
                  mut.team1Id = A2;
                  mut.team2Id = B2;
                }
              }
            });
          }
        } else if (tourneyObj.format === 'ROUND_ROBIN') {
          const rrTeams = teams.filter(t => t.group === 'A');
          const standings = calculateStandings('Vòng Tròn', rrTeams);

          const Top1 = standings[0]?.teamId || null;
          const Top2 = standings[1]?.teamId || null;
          const Top3 = standings[2]?.teamId || null;
          const Top4 = standings[3]?.teamId || null;

          if (tourneyObj.hasSemis !== false) {
            // Semis enabled
            updatedMatches.forEach(mut => {
              if (mut.tournamentId === tourneyObj.id && mut.stage === 'KNOCKOUT') {
                if (mut.id.endsWith('semi1')) {
                  if (tourneyObj.semisPairingType === '1v2_3v4') {
                    // Top 1 meets Top 2
                    mut.team1Id = Top1;
                    mut.team2Id = Top2;
                  } else {
                    // Top 1 meets Top 4 (default)
                    mut.team1Id = Top1;
                    mut.team2Id = Top4;
                  }
                } else if (mut.id.endsWith('semi2')) {
                  if (tourneyObj.semisPairingType === '1v2_3v4') {
                    // Top 3 meets Top 4
                    mut.team1Id = Top3;
                    mut.team2Id = Top4;
                  } else {
                    // Top 2 meets Top 3 (default)
                    mut.team1Id = Top2;
                    mut.team2Id = Top3;
                  }
                }
              }
            });
          } else {
            // Semis disabled: Top 1 plays Top 2 in final, Top 3 plays Top 4 in third-place match
            updatedMatches.forEach(mut => {
              if (mut.tournamentId === tourneyObj.id && mut.stage === 'KNOCKOUT') {
                if (mut.isFinal) {
                  mut.team1Id = Top1;
                  mut.team2Id = Top2;
                } else if (mut.isThirdPlace) {
                  mut.team1Id = Top3;
                  mut.team2Id = Top4;
                }
              }
            });
          }
        }
      } else {
        // Revert setup if matches are not all completed (e.g. Administrator unchecked or edited a completed match back)
        updatedMatches.forEach(mut => {
          if (mut.tournamentId === tourneyObj.id && mut.stage === 'KNOCKOUT') {
            if (tourneyObj.format === 'GROUP_KNOCKOUT') {
              if (mut.id.endsWith('semi1') || mut.id.endsWith('semi2')) {
                mut.team1Id = null;
                mut.team2Id = null;
                mut.status = 'PENDING';
                mut.winnerId = null;
                mut.scoreSets = [];
              }
            } else if (tourneyObj.format === 'ROUND_ROBIN') {
              if (tourneyObj.hasSemis !== false) {
                if (mut.id.endsWith('semi1') || mut.id.endsWith('semi2')) {
                  mut.team1Id = null;
                  mut.team2Id = null;
                  mut.status = 'PENDING';
                  mut.winnerId = null;
                  mut.scoreSets = [];
                }
              } else {
                if (mut.isFinal || mut.isThirdPlace) {
                  mut.team1Id = null;
                  mut.team2Id = null;
                  mut.status = 'PENDING';
                  mut.winnerId = null;
                  mut.scoreSets = [];
                }
              }
            }
          }
        });
      }
    }

    // Automatic transition of tournament state to active if first match completed/live
    if (tournaments.find(t => t.id === matchObj.tournamentId)?.status === 'DRAW_DONE') {
      updateTournament(matchObj.tournamentId, { status: 'ACTIVE' });
    }

    setMatches(updatedMatches);
    syncStorage(tournaments, teams, updatedMatches, sponsors, posts, activeTournamentId);

    if (isFirebaseConfigured && db) {
      const matchTournamentId = matchObj.tournamentId;
      const tourneyMatches = updatedMatches.filter(m => m.tournamentId === matchTournamentId);
      for (const m of tourneyMatches) {
        firestoreSetMatch(m);
      }
    }
  };

  const updateMatchDetail = (matchId: string, updates: Partial<Match>) => {
    const updatedMatches = matches.map(m => {
      if (m.id === matchId) {
        return { ...m, ...updates };
      }
      return m;
    });
    setMatches(updatedMatches);
    syncStorage(tournaments, teams, updatedMatches, sponsors, posts, activeTournamentId);

    if (isFirebaseConfigured && db) {
      const updatedMatch = updatedMatches.find(m => m.id === matchId);
      if (updatedMatch) {
        firestoreSetMatch(updatedMatch);
      }
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        teams,
        matches,
        sponsors,
        posts,
        athletes,
        activeTournamentId,
        firebaseEnabled,
        firebaseStatus,
        setActiveTournamentId,
        createTournament,
        updateTournament,
        deleteTournament,
        runDraw,
        updateMatchScore,
        updateMatchDetail,
        addTeam,
        updateTeam,
        deleteTeam,
        updateDrawnTeams,
        addAthlete,
        updateAthlete,
        deleteAthlete,
        addSponsor,
        deleteSponsor,
        addPost,
        updatePost,
        deletePost,
        resetData,
        uploadAllToFirebase
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}
