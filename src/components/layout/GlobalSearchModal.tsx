import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, CalendarDays, ClipboardCheck, Search, Users, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { canAccessPage } from '../../data/permissions';

export const GlobalSearchModal: React.FC = () => {
  const {
    isGlobalSearchOpen,
    setGlobalSearchOpen,
    role,
    participants,
    classes,
    approvals,
    materials,
    navigate,
    jumpToParticipantDetail,
  } = useApp();

  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isGlobalSearchOpen) {
      setQuery('');
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setGlobalSearchOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isGlobalSearchOpen, setGlobalSearchOpen]);

  const q = query.trim().toLowerCase();

  const matchedParticipants = useMemo(() => {
    if (!canAccessPage(role, 'participants')) return [];
    if (!q) return participants.slice(0, 4);
    return participants
      .filter(
        (p) =>
          p.fullName.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.lingkungan.toLowerCase().includes(q) ||
          p.program.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [participants, q, role]);

  const matchedClasses = useMemo(() => {
    if (!q) return classes.slice(0, 3);
    return classes
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.catechistName.toLowerCase().includes(q) ||
          c.program.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [classes, q]);

  const matchedApprovals = useMemo(() => {
    if (!canAccessPage(role, 'approvals')) return [];
    if (!q) return approvals.filter((a) => a.status === 'Menunggu').slice(0, 3);
    return approvals
      .filter(
        (a) =>
          a.participantName.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.requestType.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [approvals, q, role]);

  const matchedMaterials = useMemo(() => {
    if (!q) return materials.slice(0, 3);
    return materials
      .filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.program.toLowerCase().includes(q) ||
          m.summary.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [materials, q]);

  if (!isGlobalSearchOpen) return null;

  const hasAnyResults =
    matchedParticipants.length > 0 ||
    matchedClasses.length > 0 ||
    matchedApprovals.length > 0 ||
    matchedMaterials.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-[#082340]/40"
      role="dialog"
      aria-modal="true"
      aria-label="Pencarian cepat Catevia"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setGlobalSearchOpen(false);
      }}
    >
      <div className="w-full max-w-xl bg-white border border-[#CBD4E1] rounded-[12px] shadow-[0_20px_50px_rgba(8,35,64,0.2)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E2E7EF] flex items-center gap-3">
          <Search className="w-4 h-4 text-[#5B687A] shrink-0" aria-hidden="true" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ketik nama peserta, kode, lingkungan, kelas, atau materi..."
            aria-label="Kata kunci pencarian"
            className="flex-1 text-[14px] text-[#0D1B2A] placeholder:text-[#7D8A9C] bg-transparent focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setGlobalSearchOpen(false)}
            aria-label="Tutup pencarian"
            className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[#5B687A] hover:bg-[#F2F4F8] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!hasAnyResults ? (
            <p className="py-8 text-center text-[14px] text-[#5B687A]">
              Tidak ditemukan data untuk "{query}". Coba kata kunci lain.
            </p>
          ) : (
            <>
              {matchedParticipants.length > 0 && (
                <div>
                  <p className="px-2.5 pb-1.5 text-[12px] font-medium text-[#5B687A]">Peserta</p>
                  <div className="space-y-0.5">
                    {matchedParticipants.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => jumpToParticipantDetail(p.id)}
                        className="w-full px-2.5 py-2 rounded-[8px] hover:bg-[#F2F4F8] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Users className="w-4 h-4 text-[#5B687A] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#0D1B2A] truncate">
                              {p.fullName}
                            </p>
                            <p className="text-[12px] text-[#5B687A] truncate">
                              {p.program} · Lingk. {p.lingkungan}
                            </p>
                          </div>
                        </div>
                        <span className="text-[12px] font-mono-num text-[#69778A] shrink-0">
                          {p.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedApprovals.length > 0 && (
                <div>
                  <p className="px-2.5 pb-1.5 text-[12px] font-medium text-[#5B687A]">
                    Antrean Persetujuan
                  </p>
                  <div className="space-y-0.5">
                    {matchedApprovals.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          navigate('approvals');
                          setGlobalSearchOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-[8px] hover:bg-[#F2F4F8] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ClipboardCheck className="w-4 h-4 text-[#A65E00] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#0D1B2A] truncate">
                              {a.participantName}
                            </p>
                            <p className="text-[12px] text-[#5B687A] truncate">
                              {a.requestType} · {a.status}
                            </p>
                          </div>
                        </div>
                        <span className="text-[12px] font-mono-num text-[#69778A] shrink-0">
                          {a.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedClasses.length > 0 && (
                <div>
                  <p className="px-2.5 pb-1.5 text-[12px] font-medium text-[#5B687A]">
                    Kelas & Pertemuan
                  </p>
                  <div className="space-y-0.5">
                    {matchedClasses.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          navigate('classes');
                          setGlobalSearchOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-[8px] hover:bg-[#F2F4F8] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CalendarDays className="w-4 h-4 text-[#5B687A] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#0D1B2A] truncate">
                              {c.name}
                            </p>
                            <p className="text-[12px] text-[#5B687A] truncate">
                              {c.scheduleDay}, {c.scheduleTime} · {c.catechistName}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {matchedMaterials.length > 0 && (
                <div>
                  <p className="px-2.5 pb-1.5 text-[12px] font-medium text-[#5B687A]">
                    Materi & Panduan
                  </p>
                  <div className="space-y-0.5">
                    {matchedMaterials.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          navigate('materials');
                          setGlobalSearchOpen(false);
                        }}
                        className="w-full px-2.5 py-2 rounded-[8px] hover:bg-[#F2F4F8] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen className="w-4 h-4 text-[#5B687A] shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[#0D1B2A] truncate">
                              {m.title}
                            </p>
                            <p className="text-[12px] text-[#5B687A] truncate">{m.program}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
