import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { Users, Plus, Trash2, Edit2, Shield, User, X, Check, CheckCircle, Camera, Lock } from 'lucide-react';
import { Player } from '../types';

// Helper function to compress and resize custom uploaded images to prevent exceeding localStorage storage limit
const compressAndResizeImage = (file: File, maxDim = 128): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress using quality 0.75 in JPEG format to keep the output base64 structure highly optimized (~5-15kb)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressedBase64);
      };
      img.onerror = () => {
        reject(new Error("Cannot load team image"));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export default function TeamsRoster() {
  const { teams, addTeam, deleteTeam, updateTeam, tournaments, matches } = useTournament();

  const getTournamentForTeam = (teamId: string) => {
    // Check if teamId is in any tourney.teamIds
    const foundTourneyByTeamId = tournaments.find(tourney => {
      // If the tournament has custom paired teams, the original teamIds are no longer active competitors
      if (tourney.pairedTeams && tourney.pairedTeams.length > 0) {
        return false;
      }
      return tourney.teamIds?.includes(teamId);
    });
    if (foundTourneyByTeamId) return foundTourneyByTeamId;

    // Check if team is in any matches
    const foundMatch = matches.find(m => m.team1Id === teamId || m.team2Id === teamId);
    if (foundMatch) {
      const foundTourneyByMatch = tournaments.find(t => t.id === foundMatch.tournamentId);
      if (foundTourneyByMatch) return foundTourneyByMatch;
    }

    // Also check if teamId starts with team-draw-{tourneyId}
    if (teamId.startsWith('team-draw-')) {
      const foundTourney = tournaments.find(t => teamId.includes(t.id));
      if (foundTourney) return foundTourney;
    }

    return null;
  };

  const visibleTeams = teams.filter(team => {
    const associatedTourney = getTournamentForTeam(team.id);
    if (!associatedTourney) return false; // Hide standalone teams that don't belong to any active tournament
    return associatedTourney.status !== 'DEACTIVE'; // Hide teams belonging to deactivated tournaments
  });

  const sortedTeams = [...visibleTeams].sort((a, b) => {
    const tA = getTournamentForTeam(a.id);
    const tB = getTournamentForTeam(b.id);
    
    // Status not finished is active or upcoming
    const isAActiveOrUpcoming = tA && tA.status !== 'FINISHED';
    const isBActiveOrUpcoming = tB && tB.status !== 'FINISHED';
    
    if (isAActiveOrUpcoming && !isBActiveOrUpcoming) return -1;
    if (!isAActiveOrUpcoming && isBActiveOrUpcoming) return 1;
    return 0;
  });

  const [isAdding, setIsAdding] = useState(false);
  const [teamName, setTeamName] = useState('');
  
  // Custom draft members
  const [captainName, setCaptainName] = useState('');
  const [member1Name, setMember1Name] = useState('');
  const [member2Name, setMember2Name] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editPlayers, setEditPlayers] = useState<Player[]>([]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !captainName.trim()) {
      window.alert('Vui lòng nhập tên đội và tối thiểu thông tin Đội trưởng!');
      return;
    }

    const playersInput: { name: string; role: 'Captain' | 'Member' }[] = [
      { name: captainName, role: 'Captain' }
    ];

    if (member1Name.trim()) {
      playersInput.push({ name: member1Name, role: 'Member' });
    }
    if (member2Name.trim()) {
      playersInput.push({ name: member2Name, role: 'Member' });
    }

    addTeam(teamName, playersInput);
    
    // Clear Form
    setTeamName('');
    setCaptainName('');
    setMember1Name('');
    setMember2Name('');
    setIsAdding(false);
  };

  const startEdit = (teamId: string) => {
    const t = teams.find(team => team.id === teamId);
    if (!t) return;
    setEditingId(teamId);
    setEditTeamName(t.name);
    setEditPlayers([...t.players]);
  };

  const handleUpdate = () => {
    if (!editTeamName.trim()) return;
    updateTeam(editingId!, editTeamName, editPlayers);
    setEditingId(null);
  };

  const handleEditPlayerName = (index: number, newName: string) => {
    const updated = editPlayers.map((p, idx) => idx === index ? { ...p, name: newName } : p);
    setEditPlayers(updated);
  };

  // Team logo colour theme getter
  const getBannerColor = (logo: string) => {
    switch (logo) {
      case 'emerald': return 'from-emerald-500 to-teal-500 text-white';
      case 'blue': return 'from-blue-500 to-sky-600 text-white';
      case 'amber': return 'from-amber-400 to-yellow-500 text-slate-900';
      case 'rose': return 'from-rose-500 to-pink-500 text-white';
      case 'indigo': return 'from-indigo-500 to-indigo-600 text-white';
      case 'purple': return 'from-purple-500 to-violet-500 text-white';
      case 'cyan': return 'from-cyan-400 to-cyan-500 text-slate-900';
      case 'orange': return 'from-orange-500 to-amber-500 text-white';
      default: return 'from-slate-450 to-slate-550 text-white';
    }
  };

  return (
    <div id="teams-roster" className="space-y-6 py-2">
      
      {/* Roster Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-6.5 w-6.5 text-blue-600" />
            Đội Tuyển & Thành Viên ({visibleTeams.length})
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            Quản lý các vận động viên gieo hạt, thành lập danh sách đăng ký thi đấu của các Câu Lạc Bộ.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start shadow-sm cursor-pointer ${
            isAdding 
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-200'
          }`}
        >
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAdding ? 'Hủy biểu mẫu' : 'Đăng ký đội mới'}
        </button>
      </div>

      {/* Adding Module Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <h2 className="font-bold text-blue-600 text-xs tracking-wider uppercase font-mono">CUNG CẤP THÔNG TIN CÂU LẠC BỘ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Tên Câu Lạc Bộ / Đôi Vợt <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Ví dụ: Đội tuyển Cầu Lông Tây Hồ"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-slate-55 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Tên Vận Động Viên Đội Trưởng <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Tiến Minh"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                className="w-full bg-slate-55 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Thành viên Đôi thứ nhất (Tùy chọn)</label>
              <input
                type="text"
                placeholder="Tên vận động viên 1"
                value={member1Name}
                onChange={(e) => setMember1Name(e.target.value)}
                className="w-full bg-slate-55 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Thành viên dự bị khác (Tùy chọn)</label>
              <input
                type="text"
                placeholder="Tên vận động viên 2"
                value={member2Name}
                onChange={(e) => setMember2Name(e.target.value)}
                className="w-full bg-slate-55 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm shadow-blue-200 cursor-pointer transition"
            >
              Hoàn tất đăng ký đội
            </button>
          </div>
        </form>
      )}

      {/* List teams grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {sortedTeams.map((team) => {
          const isEditing = editingId === team.id;
          return (
            <div
              key={team.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
            >
              {/* Card visual brand banner */}
              <div className={`p-4 bg-gradient-to-r ${getBannerColor(team.logo)} flex justify-between items-center select-none`}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editTeamName}
                    onChange={(e) => setEditTeamName(e.target.value)}
                    className="bg-slate-900 text-white border border-slate-750 rounded px-2 py-0.5 text-xs font-semibold w-2/3"
                  />
                ) : (
                  <h3 className="font-bold truncate max-w-[145px] text-sm md:text-base leading-tight">{team.name}</h3>
                )}
                
                {/* Clickable Team Avatar to upload custom image */}
                <div className="relative group/avatar shrink-0 select-none">
                  <label 
                    htmlFor={`avatar-upload-${team.id}`}
                    className="cursor-pointer block relative" 
                    title="Click để tải ảnh đại diện đội"
                  >
                    <input
                      id={`avatar-upload-${team.id}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          compressAndResizeImage(file)
                            .then((compressedBase64) => {
                              updateTeam(team.id, team.name, team.players, compressedBase64);
                            })
                            .catch((err) => {
                              console.error(err);
                              window.alert("Không thể nén được ảnh! Vui lòng thử lại với ảnh khác.");
                            });
                        }
                      }}
                    />
                    <div className="h-9 w-9 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center transition border border-white/20 overflow-hidden relative shadow-inner">
                      {team.avatar ? (
                        <img
                          src={team.avatar}
                          alt={team.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-white text-[10px] font-extrabold uppercase font-mono tracking-tighter">
                          {team.name.replace(/^(CLB|Đội)\s+/i, '').substring(0, 2) || "CL"}
                        </span>
                      )}
                      
                      {/* Upload hover overlay */}
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity duration-150 rounded-full">
                        <Camera className="h-4.5 w-4.5 text-white" />
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Roster lists body */}
              <div className="p-4 flex-1 space-y-2.5">
                <span className="text-[9px] text-slate-400 font-mono tracking-widest block uppercase font-bold">Danh Sách Tuyển Thủ</span>

                <div className="space-y-1">
                  {(isEditing ? editPlayers : team.players).map((player, idx) => (
                    <div key={player.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-1.5">
                        {player.role === 'Captain' ? (
                          <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        )}

                        {isEditing ? (
                          <input
                            type="text"
                            value={player.name}
                            onChange={(e) => handleEditPlayerName(idx, e.target.value)}
                            className="bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[11px] text-slate-900 w-32"
                          />
                        ) : (
                          <span className={`text-slate-700 font-medium ${player.role === 'Captain' && 'text-blue-600 font-semibold'}`}>
                            {player.name}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono font-medium">
                        {player.role === 'Captain' ? 'Đội trưởng' : 'VĐV'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Controls bar */}
              <div className="bg-slate-50/85 p-3 border-t border-slate-150 flex justify-between items-center select-none">
                {isEditing ? (
                  <button
                    onClick={handleUpdate}
                    className="text-emerald-600 hover:text-emerald-700 transition text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Lưu lại
                  </button>
                ) : (
                  <button
                    onClick={() => startEdit(team.id)}
                    className="text-slate-400 hover:text-blue-600 transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" /> Sửa đổi
                  </button>
                )}

                {(() => {
                  const associatedTourney = getTournamentForTeam(team.id);
                  const isLocked = associatedTourney && associatedTourney.status !== 'DEACTIVE';
                  if (isLocked) {
                    return (
                      <button
                        onClick={() => {
                          window.alert(`⚠️ Không thể xóa đội này vì đội đang tham gia giải đấu "${associatedTourney.name}"!`);
                        }}
                        className="text-slate-300 hover:text-amber-500 transition cursor-pointer"
                        title={`Đội đang trong giải đấu: ${associatedTourney.name}`}
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </button>
                    );
                  }
                  return (
                    <button
                      onClick={() => {
                        if (window.confirm(`Bạn chắc chắn muốn xóa đội "${team.name}"?`)) {
                          deleteTeam(team.id);
                        }
                      }}
                      className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                      title="Xóa đội tuyển"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
