import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { User, Plus, Search, Trash2, Edit2, X, Check, Phone, MapPin, Award, UserPlus, Heart, Users } from 'lucide-react';
import { Athlete } from '../types';

export default function AthletesRoster() {
  const { athletes, addAthlete, updateAthlete, deleteAthlete } = useTournament();

  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | string>('');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác' | string>('Nam');
  const [nickname, setNickname] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const resetForm = () => {
    setName('');
    setAge('');
    setGender('Nam');
    setNickname('');
    setAddress('');
    setPhone('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      window.alert('Vui lòng nhập tên vận động viên!');
      return;
    }
    addAthlete({
      name,
      age: age ? Number(age) : '',
      gender,
      nickname: nickname.trim() || undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined
    });
    resetForm();
    setIsAdding(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAthlete) return;
    if (!name.trim()) {
      window.alert('Vui lòng nhập tên vận động viên!');
      return;
    }
    updateAthlete(editingAthlete.id, {
      name,
      age: age ? Number(age) : '',
      gender,
      nickname: nickname.trim() || undefined,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined
    });
    setEditingAthlete(null);
    resetForm();
  };

  const startEdit = (ath: Athlete) => {
    setEditingAthlete(ath);
    setName(ath.name);
    setAge(ath.age);
    setGender(ath.gender);
    setNickname(ath.nickname || '');
    setAddress(ath.address || '');
    setPhone(ath.phone || '');
    setIsAdding(false);
  };

  const filteredAthletes = athletes.filter(ath => {
    const term = search.toLowerCase();
    return (
      ath.name.toLowerCase().includes(term) ||
      (ath.nickname && ath.nickname.toLowerCase().includes(term)) ||
      (ath.phone && ath.phone.includes(term)) ||
      (ath.address && ath.address.toLowerCase().includes(term))
    );
  });

  const getGenderBadge = (g: string) => {
    switch (g) {
      case 'Nam':
        return 'bg-blue-50 text-blue-700 border border-blue-150';
      case 'Nữ':
        return 'bg-rose-50 text-rose-700 border border-rose-150';
      default:
        return 'bg-purple-50 text-purple-700 border border-purple-150';
    }
  };

  return (
    <div id="athletes-roster" className="space-y-6 py-2">
      {/* Header and Add Panel Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="h-6.5 w-6.5 text-blue-600" />
            Danh Sách Vận Động Viên ({athletes.length})
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            Quản lý hồ sơ vận động viên thi đấu của hệ thống: Tên tuổi, biệt danh, liên lạc và thể trạng hạt giống.
          </p>
        </div>

        <button
          onClick={() => {
            if (editingAthlete) {
              setEditingAthlete(null);
              resetForm();
            }
            setIsAdding(!isAdding);
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition self-start shadow-sm cursor-pointer ${
            isAdding || editingAthlete
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-200'
          }`}
        >
          {isAdding || editingAthlete ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAdding || editingAthlete ? 'Thoát form' : 'Ghi danh VĐV mới'}
        </button>
      </div>

      {/* Form Section: Create or Edit */}
      {(isAdding || editingAthlete) && (
        <form
          onSubmit={editingAthlete ? handleUpdate : handleCreate}
          className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <h2 className="font-bold text-blue-600 text-xs tracking-wider uppercase font-mono">
            {editingAthlete ? `CẬP NHẬT HỒ SƠ VĐV: ${editingAthlete.name}` : 'KHAI BÁO THÔNG TIN VẬN ĐỘNG VIÊN MỚI'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Tên Vận Động Viên <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Ví dụ: Nguyễn Tiến Minh"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Tuổi</label>
              <input
                type="number"
                placeholder="Ví dụ: 25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Giới Tính <span className="text-red-500">*</span></label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Biệt biệt danh (Nickname)</label>
              <input
                type="text"
                placeholder="Ví dụ: Minh Legend"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Số Điện Thoại</label>
              <input
                type="text"
                placeholder="Ví dụ: 0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Địa chỉ liên lạc</label>
              <input
                type="text"
                placeholder="Ví dụ: Quận 1, TP. HCM"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditingAthlete(null);
                setIsAdding(false);
                resetForm();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-bold shadow-sm cursor-pointer transition"
            >
              {editingAthlete ? 'Cập nhật' : 'Thêm vận động viên'}
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Input Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm vận động viên theo tên, biệt danh, liên lạc..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-55 text-slate-800 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
          Hiển thị <b>{filteredAthletes.length}</b> / {athletes.length} vận động viên
        </div>
      </div>

      {/* Grid List layout of athletes cards */}
      {filteredAthletes.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center border-slate-200">
          <User className="h-10 w-10 text-slate-350 mx-auto mb-2" />
          <p className="text-slate-600 text-sm font-semibold">Không tìm thấy vận động viên phù hợp.</p>
          <p className="text-slate-400 text-xs mt-1">Hãy thử gõ cụm từ tìm kiếm khác hoặc thêm mới vận động viên.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAthletes.map((ath) => {
            const isMale = ath.gender === 'Nam';
            return (
              <div
                key={ath.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:scale-[1.01] hover:border-slate-300 transition-all group"
              >
                <div className="p-4 space-y-4">
                  {/* Badge & profile abstract */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Initials Badge with elegant background */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm text-white select-none shadow-sm shadow-blue-500/10 ${
                        isMale ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-pink-500 to-rose-600'
                      }`}>
                        {ath.name.split(' ').slice(-1)[0][0] || 'V'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition truncate max-w-[140px]">{ath.name}</h4>
                          {ath.nickname && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded italic font-medium shrink-0">
                              "{ath.nickname}"
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">ID: {ath.id}</p>
                      </div>
                    </div>

                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getGenderBadge(ath.gender)}`}>
                      {ath.gender}
                    </span>
                  </div>

                  {/* Body values details */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600 font-medium">
                    {ath.age && (
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Tuổi tác: <b className="text-slate-800">{ath.age} tuổi</b></span>
                      </div>
                    )}
                    {ath.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>SĐT: <b className="text-slate-800 font-mono">{ath.phone}</b></span>
                      </div>
                    )}
                    {ath.address && (
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Địa chỉ: <b className="text-slate-800 font-normal">{ath.address}</b></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operations footer */}
                <div className="bg-slate-50 border-t border-slate-150 p-3 flex justify-between select-none">
                  <button
                    onClick={() => startEdit(ath)}
                    className="text-slate-500 hover:text-blue-600 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Sửa
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Bạn muốn xoá vận động viên "${ath.name}"?`)) {
                        deleteAthlete(ath.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
