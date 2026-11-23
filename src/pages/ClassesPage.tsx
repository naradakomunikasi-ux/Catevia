import React, { useMemo, useState } from 'react';
import { CalendarDays, CheckSquare, MapPin, Plus, User, UserPlus } from 'lucide-react';
import { hasPermission } from '../data/permissions';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { StatusIndicator } from '../components/ui/StatusIndicator';
import { Modal } from '../components/ui/Modal';
import { TextInput } from '../components/ui/Input';

export const ClassesPage: React.FC = () => {
  const {
    currentUser,
    role,
    isPreviewingRole,
    classes,
    participants,
    openRegistrationWizard,
    toggleSessionAttendance,
    completeClassSession,
    addClassSession,
  } = useApp();

  const canManageClasses = hasPermission(role, 'manage_classes');
  const canRecordAttendance = hasPermission(role, 'record_attendance');

  const myRecord = useMemo(() => {
    if (role !== 'general') return undefined;
    const own = participants.find((p) => p.ownerUid === currentUser?.uid);
    if (own) return own;
    return isPreviewingRole ? participants.find((p) => p.id === 'p-01') || participants[0] : undefined;
  }, [role, participants, currentUser, isPreviewingRole]);

  // For General Users, show their enrolled class (or all parish classes if not yet placed)
  const visibleClasses = useMemo(() => {
    if (role === 'general' && myRecord) {
      const ownClass = classes.filter((c) => c.id === myRecord.classId);
      if (ownClass.length > 0) return ownClass;
    }
    return classes;
  }, [classes, role, myRecord]);

  const [selectedClassId, setSelectedClassId] = useState<string>(visibleClasses[0]?.id || classes[0]?.id || '');
  const activeClass =
    visibleClasses.find((c) => c.id === selectedClassId) || visibleClasses[0] || classes[0];

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    activeClass?.sessions[activeClass.sessions.length - 1]?.id || ''
  );

  const activeSession =
    activeClass?.sessions.find((s) => s.id === selectedSessionId) ||
    activeClass?.sessions[activeClass.sessions.length - 1];

  const classParticipants = useMemo(
    () => (activeClass ? participants.filter((p) => p.classId === activeClass.id) : []),
    [participants, activeClass]
  );

  const classParticipantIdSet = useMemo(
    () => new Set(classParticipants.map((p) => p.id)),
    [classParticipants]
  );

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [formError, setFormError] = useState('');

  if (!activeClass) {
    return (
      <div className="bg-white border border-[#E2E7EF] rounded-[10px] p-8 text-center text-[14px] text-[#5B687A]">
        Memuat daftar kelas pembinaan...
      </div>
    );
  }

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    const nextCls = classes.find((c) => c.id === classId);
    if (nextCls && nextCls.sessions.length > 0) {
      setSelectedSessionId(nextCls.sessions[nextCls.sessions.length - 1].id);
    }
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTopic.trim()) {
      setFormError('Tanggal dan topik pertemuan wajib diisi.');
      return;
    }
    addClassSession(activeClass.id, newDate, newTopic.trim());
    setNewDate('');
    setNewTopic('');
    setFormError('');
    setAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[#0D1B2A]">
            {role === 'general' ? 'Jadwal Kelas Saya' : 'Kelas & Pertemuan'}
          </h1>
          <p className="mt-1 text-[14px] text-[#4D5B6D]">
            {role === 'general'
              ? 'Daftar jadwal pertemuan, ruangan, dan topik pembinaan yang akan datang.'
              : 'Kelola jadwal kelas katekese, tambahkan sesi baru, dan catat daftar hadir peserta.'}
          </p>
        </div>

        {canManageClasses && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setAddModalOpen(true)}
          >
            Tambah Pertemuan
          </Button>
        )}
      </div>

      {/* Class Selector Strip */}
      {visibleClasses.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {visibleClasses.map((cls) => {
            const enrolled = participants.filter((p) => p.classId === cls.id).length;
            const isSelected = cls.id === activeClass.id;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => handleSelectClass(cls.id)}
                className={`text-left p-4 rounded-[10px] border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#082340] shadow-[0_2px_8px_rgba(8,35,64,0.08)]'
                    : 'bg-white border-[#E2E7EF] hover:border-[#CBD4E1]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-mono-num text-[#5B687A]">{cls.code}</span>
                  <StatusIndicator status={cls.status} />
                </div>
                <p className="mt-2 text-[14px] font-semibold text-[#0D1B2A] line-clamp-2">
                  {cls.name}
                </p>
                <p className="mt-1.5 text-[12px] text-[#5B687A]">
                  {cls.scheduleDay}, {cls.scheduleTime}
                </p>
                <p className="mt-1 text-[12px] text-[#4D5B6D] font-mono-num">
                  {enrolled}/{cls.capacity} peserta · {cls.catechistName}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Class Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Sessions List */}
        <section className="bg-white border border-[#E2E7EF] rounded-[10px] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E2E7EF]">
            <h2 className="text-[16px] font-semibold text-[#0D1B2A]">{activeClass.name}</h2>
            <div className="mt-2 space-y-1 text-[13px] text-[#5B687A]">
              <p className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Setiap {activeClass.scheduleDay}, {activeClass.scheduleTime}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{activeClass.room}</span>
              </p>
              <p className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 shrink-0" />
                <span>Katekis: {activeClass.catechistName}</span>
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#EEF1F6]">
            {activeClass.sessions.map((ses, idx) => {
              const isSelected = activeSession?.id === ses.id;
              return (
                <button
                  key={ses.id}
                  type="button"
                  onClick={() => setSelectedSessionId(ses.id)}
                  className={`w-full text-left px-5 py-3.5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-[#EDF2F7]/70' : 'hover:bg-[#F8F9FB]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-mono-num text-[#5B687A]">
                      Pertemuan {idx + 1} · {ses.date}
                    </span>
                    <StatusIndicator status={ses.completed ? 'Selesai' : 'Dijadwalkan'} />
                  </div>
                  <p className="mt-1 text-[14px] font-medium text-[#0D1B2A]">{ses.topic}</p>
                  {role !== 'general' && (
                    <p className="mt-1 text-[12px] font-mono-num text-[#5B687A]">
                      Hadir:{' '}
                      {ses.presentParticipantIds.filter((id) => classParticipantIdSet.has(id)).length}/
                      {classParticipants.length} peserta
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Right: Session Detail & Interactive Attendance Sheet */}
        <section className="lg:col-span-2 bg-white border border-[#E2E7EF] rounded-[10px] overflow-hidden">
          {activeSession && (
            <>
              <div className="px-5 sm:px-6 py-4 border-b border-[#E2E7EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-mono-num text-[#5B687A]">
                    Tanggal {activeSession.date} · {activeClass.room}
                  </p>
                  <h2 className="text-[18px] font-semibold text-[#0D1B2A] mt-0.5">
                    {activeSession.topic}
                  </h2>
                </div>
                {canRecordAttendance && !activeSession.completed && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckSquare className="w-4 h-4" />}
                    onClick={() => void completeClassSession(activeClass.id, activeSession.id)}
                  >
                    Simpan & Tandai Selesai
                  </Button>
                )}
              </div>

              {role === 'general' ? (
                <div className="p-6 space-y-4">
                  {myRecord ? (
                    <div className="flex items-center justify-between py-3 px-4 rounded-[8px] bg-[#F8F9FB] border border-[#E2E7EF]">
                      <span className="text-[14px] text-[#4D5B6D]">Status Kehadiran Anda</span>
                      {activeSession.presentParticipantIds.includes(myRecord.id) ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#157347]">
                          <span className="w-2 h-2 rounded-full bg-[#157347]" aria-hidden="true" />
                          Hadir
                        </span>
                      ) : activeSession.completed ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#B42318]">
                          <span className="w-2 h-2 rounded-full bg-[#B42318]" aria-hidden="true" />
                          Tidak Hadir
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#082340]">
                          <span className="w-2 h-2 rounded-full bg-[#082340]" aria-hidden="true" />
                          Dijadwalkan
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 px-4 rounded-[8px] bg-[#FBF6EC] border border-[#E5CFA6]">
                      <div>
                        <p className="text-[14px] font-semibold text-[#6B4A14]">
                          Anda belum terdaftar pada kelas ini
                        </p>
                        <p className="text-[12px] text-[#7D5818] mt-0.5">
                          Lengkapi pendaftaran katekese agar kehadiran pertemuan Anda mulai tercatat.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<UserPlus className="w-4 h-4" />}
                        onClick={() => openRegistrationWizard(activeClass.program)}
                      >
                        Daftar Program Ini
                      </Button>
                    </div>
                  )}
                  <p className="text-[14px] text-[#4D5B6D] leading-relaxed">
                    Mohon hadir 10 menit sebelum pertemuan dimulai dengan membawa Kitab Suci dan buku catatan katekese. Apabila berhalangan hadir, silakan mengabari Katekis {activeClass.catechistName}.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#EEF1F6]">
                  <div className="px-6 py-2.5 bg-[#FAFBFC] text-[12px] font-medium text-[#5B687A] flex items-center justify-between">
                    <span>Daftar Peserta Kelas ({classParticipants.length})</span>
                    <span className="font-mono-num">
                      Hadir:{' '}
                      {
                        activeSession.presentParticipantIds.filter((id) =>
                          classParticipantIdSet.has(id)
                        ).length
                      }
                      /{classParticipants.length}
                    </span>
                  </div>

                  {classParticipants.map((p) => {
                    const isPresent = activeSession.presentParticipantIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-[#F8F9FB]"
                      >
                        <div className="min-w-0">
                          <p className="text-[14px] font-medium text-[#0D1B2A] truncate">
                            {p.fullName}
                          </p>
                          <p className="text-[12px] text-[#5B687A]">
                            Lingk. {p.lingkungan} · Total hadir{' '}
                            <span className="font-mono-num">
                              {p.attendanceCount}/{p.totalSessions}
                            </span>
                          </p>
                        </div>

                        {canRecordAttendance ? (
                          <label className="inline-flex items-center gap-2.5 text-[13px] font-medium text-[#0D1B2A] cursor-pointer select-none min-h-[36px]">
                            <input
                              type="checkbox"
                              checked={isPresent}
                              onChange={() =>
                                toggleSessionAttendance(activeClass.id, activeSession.id, p.id)
                              }
                              className="w-4 h-4 accent-[#082340] cursor-pointer"
                            />
                            <span>{isPresent ? 'Hadir' : 'Belum Hadir'}</span>
                          </label>
                        ) : (
                          <StatusIndicator status={isPresent ? 'Aktif' : 'Belum Lengkap'} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Add Session Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Jadwal Pertemuan"
        description={`Menambahkan sesi baru pada kelas ${activeClass.name}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddModalOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleCreateSession}>
              Simpan Jadwal
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <TextInput
            label="Tanggal Pertemuan"
            type="date"
            required
            value={newDate}
            onChange={(e) => {
              setNewDate(e.target.value);
              setFormError('');
            }}
          />
          <TextInput
            label="Topik / Materi Pertemuan"
            required
            value={newTopic}
            onChange={(e) => {
              setNewTopic(e.target.value);
              setFormError('');
            }}
            placeholder="Contoh: Rekoleksi dan Pengakuan Dosa Pertama"
            error={formError}
          />
        </form>
      </Modal>
    </div>
  );
};
