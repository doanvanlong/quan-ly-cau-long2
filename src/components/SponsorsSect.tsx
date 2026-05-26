import React, { useState } from 'react';
import { useTournament } from '../context/TournamentContext';
import { ShieldCheck, Plus, Trash2, Award, DollarSign, Globe, X } from 'lucide-react';

export default function SponsorsSect() {
  const { sponsors, addSponsor, deleteSponsor } = useTournament();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [logo, setLogo] = useState('');
  const [tier, setTier] = useState<'KIM_CUONG' | 'VANG' | 'BAC' | 'DONG'>('VANG');
  const [website, setWebsite] = useState('');
  const [amount, setAmount] = useState<number>(5000000);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Standard high-quality default images if logo is empty
    const defaultLogo = logo.trim() || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&auto=format&fit=crop&q=60';

    addSponsor({
      name,
      logo: defaultLogo,
      tier,
      website: website.trim() || undefined,
      amount: amount
    });

    setName('');
    setLogo('');
    setWebsite('');
    setAmount(5000000);
    setIsAdding(false);
  };

  const getTierDetails = (t: string) => {
    switch (t) {
      case 'KIM_CUONG': return { label: 'Kim Cương', color: 'text-[#cca01a] border-amber-300 bg-amber-50' };
      case 'VANG': return { label: 'Hạng Vàng', color: 'text-amber-655 border-amber-200 bg-amber-50/50' };
      case 'BAC': return { label: 'Hạng Bạc', color: 'text-slate-600 border-slate-200 bg-slate-50' };
      case 'DONG': return { label: 'Hạng Đồng', color: 'text-orange-500 border-orange-200 bg-orange-50/40' };
      default: return { label: 'Đồng Hành', color: 'text-slate-500 border-slate-200' };
    }
  };

  // Sum all sponsorships contributions
  const totalFunding = sponsors.reduce((acc, current) => acc + (current.amount || 0), 0);

  return (
    <div id="sponsors-sect" className="space-y-6 py-2">
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6.5 w-6.5 text-blue-600" />
            Nhà Tài Trợ & Đối Tác
          </h1>
          <p className="text-slate-500 text-xs md:text-sm">
            Quản lý công bố và lưu trữ dữ liệu đối tác đồng hành đóng góp gầy dựng giải đấu thành công rực rỡ.
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
          {isAdding ? 'Hủy' : 'Đăng ký nhà tài trợ'}
        </button>
      </div>

      {/* Stats summary container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">TỔNG QUỸ TÀI TRỢ HIỆN TẠI</span>
            <span className="text-xl md:text-2xl font-mono font-bold text-slate-800 tracking-tight">
              {totalFunding.toLocaleString('vi-VN')} <span className="text-xs text-blue-605">VND</span>
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-550 shrink-0">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono block uppercase font-bold">TỔNG SỐ ĐỐI TÁC</span>
            <span className="text-xl md:text-2xl font-mono font-bold text-slate-800 tracking-tight">
              {sponsors.length} <span className="text-xs text-amber-600 font-semibold">Đối tác</span>
            </span>
          </div>
        </div>
      </div>

      {/* Adding profile */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 space-y-5 shadow-sm animate-in fade-in duration-200">
          <h2 className="font-bold text-blue-600 text-xs tracking-wider uppercase font-mono">BIỂU MẪU ĐĂNG KÝ TÀI TRỢ GIẢI ĐẤU</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Tên Thương Hiệu <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="Ví dụ: Công ty Cổ phần Thể thao Yonex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-55 text-slate-850 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-650 text-xs font-semibold">Phân Hạng Tài Trợ (Tier)</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
                className="w-full bg-slate-55 text-slate-855 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="KIM_CUONG">Kim Cương (Diamond)</option>
                <option value="VANG">Vàng (Gold)</option>
                <option value="BAC">Bạc (Silver)</option>
                <option value="DONG">Đồng (Bronze) / Hỗ trợ khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-655 text-xs font-semibold">Đường dẫn Website đối tác (Tùy chọn)</label>
              <input
                type="url"
                placeholder="Ví dụ: https://yonex.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full bg-slate-55 text-slate-850 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-655 text-xs font-semibold">Giá trị Hiện kim / Hiện vật phân bổ quy đổi (VND)</label>
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
                className="w-full bg-slate-55 text-slate-850 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-slate-655 text-xs font-semibold">Đường dẫn URL Logo hình ảnh (Để trống để lấy mặc định)</label>
              <input
                type="text"
                placeholder="https://images.unsplash.com/photo-..."
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                className="w-full bg-slate-55 text-slate-850 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold shadow-sm shadow-blue-200 cursor-pointer transition"
            >
              Phát hành Tài trợ
            </button>
          </div>
        </form>
      )}

      {/* Grid of registered sponsors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {sponsors.map((sp) => {
          const badge = getTierDetails(sp.tier);
          return (
            <div
              key={sp.id}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 shadow-sm flex flex-col justify-between gap-5 relative group transition"
            >
              
              {/* Badge level indicator */}
              <span className={`self-start text-[9px] font-mono font-bold px-2.5 py-0.5 rounded border uppercase select-none ${badge.color}`}>
                {badge.label}
              </span>

              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-lg overflow-hidden border border-slate-150 bg-white p-0.5 shrink-0 select-none">
                  <img src={sp.logo} alt={sp.name} className="h-full w-full object-cover rounded" referrerPolicy="no-referrer" />
                </div>
                <div className="space-y-1 truncate">
                  <h3 className="font-bold text-slate-800 text-xs md:text-sm truncate leading-tight">{sp.name}</h3>
                  <div className="flex gap-1 items-center">
                    <Globe className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {sp.website ? sp.website.replace('https://', '').replace('www.', '') : 'Chưa nhập link'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount display and deletion control */}
              <div className="flex justify-between items-center bg-slate-50 p-2 text-xs font-mono rounded-lg border border-slate-100 select-none">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 block uppercase font-bold leading-none">HẠN MỨC ĐÓNG GÓP</span>
                  <span className="text-slate-700 font-bold block leading-tight text-[11px] mt-0.5">
                    {(sp.amount || 0).toLocaleString('vi-VN')} VND
                  </span>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Bạn chắc chắn muốn huỷ gỡ nhà tài trợ "${sp.name}" khỏi hệ thống?`)) {
                      deleteSponsor(sp.id);
                    }
                  }}
                  className="text-slate-400 hover:text-rose-500 p-1.5 rounded transition cursor-pointer"
                  title="Xoá nhà bán lẻ"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
