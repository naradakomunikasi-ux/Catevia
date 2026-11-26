import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Mail,
  MapPin,
  Menu,
  Phone,
  Search,
  X,
} from 'lucide-react';
import { ProgramType, PublicProgram, PublicProgramStatus } from '../types/catevia';
import { useApp } from '../context/AppContext';
import { CATEVIA_LOGO_PATH } from '../components/layout/Sidebar';
import { Button } from '../components/ui/Button';
import {
  ParishChurchIllustration,
  ProgramArtwork,
  RoleHighlightIcon,
} from '../components/public/PublicIcons';
import { PublicRegistrationForm } from '../components/public/PublicRegistrationForm';

type PublicView = 'home' | 'programs' | 'detail' | 'register' | 'about' | 'guide' | 'contact';

const STATUS_TEXT_CLASS: Record<PublicProgramStatus, string> = {
  'Pendaftaran Dibuka': 'text-[#157347] font-semibold',
  'Akan Dibuka': 'text-[#A65E00] font-semibold',
  Ditutup: 'text-[#5B687A] font-medium',
};

const NAV_LINKS: { id: Exclude<PublicView, 'detail'>; label: string }[] = [
  { id: 'home', label: 'Beranda' },
  { id: 'programs', label: 'Program' },
  { id: 'register', label: 'Daftar' },
  { id: 'guide', label: 'Panduan' },
  { id: 'contact', label: 'Kontak' },
];

const FOOTER_LINKS: { id: Exclude<PublicView, 'detail'>; label: string }[] = [
  { id: 'home', label: 'Beranda' },
  { id: 'programs', label: 'Program' },
  { id: 'register', label: 'Daftar' },
  { id: 'about', label: 'Tentang' },
  { id: 'guide', label: 'Panduan' },
  { id: 'contact', label: 'Kontak' },
];

export const PublicWebsitePage: React.FC = () => {
  const {
    currentUser,
    settings,
    frontpageContent,
    publicPrograms,
    openLoginScreen,
    openPortal,
    clearFrontpageRegistrationResult,
    navigate,
    role,
    showToast,
  } = useApp();

  const resolvedParishName = currentUser ? settings.parishName : frontpageContent.parishLabel;
  const resolvedContactEmail = currentUser ? settings.contactEmail : frontpageContent.contactEmail;
  const resolvedContactPhone = currentUser ? settings.contactPhone : frontpageContent.contactPhone;

  const [view, setView] = useState<PublicView>('home');
  const [previousView, setPreviousView] = useState<Exclude<PublicView, 'detail'>>('home');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [preselectedFormProgram, setPreselectedFormProgram] = useState<ProgramType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | PublicProgramStatus>('Semua');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);
  const [logoError, setLogoError] = useState(false);

  // Only show published programs on the public website
  const visiblePrograms = useMemo(
    () =>
      publicPrograms
        .filter((p) => p.published)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
    [publicPrograms]
  );

  const filteredPrograms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visiblePrograms.filter((p) => {
      const matchesStatus = statusFilter === 'Semua' || p.status === statusFilter;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.audience.toLowerCase().includes(q) ||
        p.mode.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [visiblePrograms, searchQuery, statusFilter]);

  const selectedProgram: PublicProgram | null = useMemo(() => {
    if (!selectedProgramId) return null;
    return visiblePrograms.find((p) => p.id === selectedProgramId) || null;
  }, [visiblePrograms, selectedProgramId]);

  const goToView = (nextView: Exclude<PublicView, 'detail'>) => {
    setView(nextView);
    setSelectedProgramId(null);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProgramDetail = (programId: string) => {
    if (view !== 'detail') {
      setPreviousView(view);
    }
    setSelectedProgramId(programId);
    setView('detail');
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openFrontpageRegistration = (programType?: ProgramType) => {
    clearFrontpageRegistrationResult();
    if (programType) {
      setPreselectedFormProgram(programType);
    }
    setSelectedProgramId(null);
    setView('register');
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleContinueRegistration = (program: PublicProgram) => {
    if (program.status !== 'Pendaftaran Dibuka') {
      showToast({
        type: 'info',
        title:
          program.status === 'Akan Dibuka'
            ? 'Pendaftaran program ini segera dibuka'
            : 'Pendaftaran gelombang ini telah ditutup',
        description:
          'Anda dapat menghubungi Sekretariat Paroki untuk informasi jadwal gelombang berikutnya.',
      });
      return;
    }

    if (currentUser && role === 'approver') {
      openPortal();
      navigate('approvals');
      showToast({
        type: 'info',
        title: 'Antrean persetujuan terbuka',
        description: `Silakan tinjau berkas pendaftar ${program.name} di halaman Persetujuan.`,
      });
      return;
    }

    openFrontpageRegistration(program.linkedProgram || 'Katekumen (Baptis Dewasa)');
  };

  const renderProgramCard = (program: PublicProgram) => (
    <article
      key={program.id}
      className="bg-white border border-[#E2E7EF] rounded-[14px] p-5 flex flex-col gap-4 hover:border-[#BFD0E5] transition-colors duration-150"
    >
      <ProgramArtwork type={program.iconType} />

      <div className="space-y-1.5">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[12px]">
          <span className={STATUS_TEXT_CLASS[program.status]}>{program.status}</span>
          <span className="text-[#94A3B8]" aria-hidden="true">
            ·
          </span>
          <span className="text-[#5B687A]">{program.mode}</span>
        </div>

        <h3 className="text-[18px] font-semibold tracking-tight text-[#0D1B2A] leading-snug">
          {program.name}
        </h3>

        <p className="text-[13px] text-[#5B687A]">{program.audience}</p>
      </div>

      <p className="text-[14px] text-[#4D5B6D] leading-relaxed flex-1">{program.summary}</p>

      <div className="pt-3 border-t border-[#EEF1F6] flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => openProgramDetail(program.id)}
          className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#082340] hover:text-[#1D4ED8] transition-colors cursor-pointer whitespace-nowrap min-h-[40px]"
        >
          <span>Lihat Detail</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>

        {program.status === 'Pendaftaran Dibuka' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleContinueRegistration(program)}
          >
            Daftar
          </Button>
        )}
      </div>
    </article>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#0D1B2A] flex flex-col">
      {/* Skip link */}
      <a
        href="#public-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#082340] focus:text-white focus:rounded-[8px] text-[14px] font-medium"
      >
        Lewati ke konten utama
      </a>

      {/* Clean 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-b border-[#E2E7EF]">
        <div className="max-w-[1200px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={() => goToView('home')}
            className="flex items-center shrink-0 focus-visible:outline-2 rounded-[6px] cursor-pointer"
            aria-label="Catevia Beranda"
          >
            {!logoError ? (
              <img
                src={CATEVIA_LOGO_PATH}
                alt="Catevia"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="h-9 sm:h-10 w-auto object-contain select-none"
              />
            ) : (
              <span className="text-[20px] font-bold tracking-tight text-[#082340] whitespace-nowrap">
                Catevia
              </span>
            )}
          </button>

          {/* Zone 2: 5 Clean Single-Line Nav Links */}
          <nav
            aria-label="Navigasi situs publik"
            className="hidden md:flex items-center gap-7 text-[14px] font-medium text-[#4D5B6D]"
          >
            {NAV_LINKS.map((item) => {
              const isActive =
                view === item.id || (view === 'detail' && item.id === 'programs');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToView(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#082340] border-[#B8893E] font-semibold'
                      : 'border-transparent hover:text-[#082340]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action + Mobile Drawer Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={currentUser ? openPortal : openLoginScreen}
            >
              {currentUser ? 'Buka Portal' : 'Masuk'}
            </Button>

            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Buka menu navigasi"
              className="md:hidden w-10 h-10 rounded-[8px] border border-[#E2E7EF] flex items-center justify-center text-[#082340] hover:bg-[#F2F4F8] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden bg-[#082340]/40 flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi publik"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMobileNavOpen(false);
          }}
        >
          <div className="w-[280px] max-w-[85vw] bg-white h-full p-5 flex flex-col border-l border-[#E2E7EF]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E7EF]">
              <span className="text-[16px] font-bold text-[#082340]">Menu Catevia</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Tutup menu"
                className="w-10 h-10 rounded-[8px] flex items-center justify-center text-[#5B687A] hover:bg-[#F2F4F8] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="mt-4 space-y-1 flex-1">
              {NAV_LINKS.map((item) => {
                const isActive =
                  view === item.id || (view === 'detail' && item.id === 'programs');
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToView(item.id)}
                    className={`w-full text-left px-3.5 min-h-[44px] rounded-[8px] text-[15px] flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#082340] text-white font-semibold'
                        : 'text-[#334155] hover:bg-[#F2F4F8]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="w-4 h-4 opacity-70" aria-hidden="true" />
                  </button>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-[#E2E7EF]">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setMobileNavOpen(false);
                  if (currentUser) openPortal();
                  else openLoginScreen();
                }}
              >
                {currentUser ? 'Buka Portal Catevia' : 'Masuk Portal Catevia'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="public-main" className="flex-1">
        {/* ======================== HOME VIEW ======================== */}
        {view === 'home' && (
          <>
            {/* Hero Section */}
            <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-8">
              <div className="rounded-[20px] border border-[#D8E5F5] bg-gradient-to-br from-[#FFFFFF] via-[#F2F7FE] to-[#E2EEFC] p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <p className="text-[13px] font-semibold tracking-wide text-[#855E1E]">
                    {resolvedParishName}
                  </p>
                  <h1 className="text-[32px] sm:text-[44px] lg:text-[50px] font-bold tracking-tight text-[#082340] leading-[1.08] max-w-xl">
                    {frontpageContent.heroTitle}
                  </h1>
                  <p className="text-[16px] sm:text-[17px] text-[#42546A] leading-relaxed max-w-xl">
                    {frontpageContent.heroSubtitle}
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => openFrontpageRegistration()}
                    >
                      <span>Daftar Katekese Sekarang</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => goToView('programs')}
                    >
                      {frontpageContent.heroPrimaryCtaLabel}
                    </Button>
                  </div>
                </div>

                <div className="lg:col-span-5 flex items-end justify-center">
                  <div className="w-full max-w-[420px]">
                    <ParishChurchIllustration />
                  </div>
                </div>
              </div>
            </section>

            {/* Scripture Inspiration Section */}
            {frontpageContent.showScriptureSection && frontpageContent.scriptureQuote && (
              <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="bg-white border border-[#E2E7EF] rounded-[16px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3 max-w-3xl">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[#082340]">
                      <BookOpen className="w-4 h-4 text-[#B8893E]" aria-hidden="true" />
                      <span>{frontpageContent.scriptureHeading}</span>
                    </div>
                    <blockquote className="font-serif text-[20px] sm:text-[23px] leading-relaxed text-[#0D1B2A]">
                      {frontpageContent.scriptureQuote}
                    </blockquote>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
                      <span className="font-semibold text-[#082340]">
                        {frontpageContent.scriptureSource}
                      </span>
                      {frontpageContent.scriptureNote && (
                        <>
                          <span className="text-[#94A3B8]" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[#5B687A]">{frontpageContent.scriptureNote}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Programs Showcase Section */}
            <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
                <div className="space-y-1.5 max-w-2xl">
                  <p className="text-[13px] font-semibold text-[#855E1E]">
                    {frontpageContent.programsEyebrow}
                  </p>
                  <h2 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#082340]">
                    {frontpageContent.programsHeading}
                  </h2>
                  <p className="text-[15px] text-[#4D5B6D] leading-relaxed">
                    {frontpageContent.programsSubtitle}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => goToView('programs')}>
                  Lihat Semua Program
                </Button>
              </div>

              {visiblePrograms.length === 0 ? (
                <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-10 text-center">
                  <p className="text-[15px] font-medium text-[#0D1B2A]">
                    Belum ada program katekese yang dipublikasikan.
                  </p>
                  <p className="mt-1 text-[13px] text-[#5B687A]">
                    Pengurus paroki dapat menambahkan dan memublikasikan program melalui menu Paroki & CMS Website.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visiblePrograms.map(renderProgramCard)}
                </div>
              )}
            </section>

            {/* Inline Frontpage Self-Registration Section */}
            <section
              id="formulir-pendaftaran"
              className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 border-t border-[#E2E7EF]"
            >
              <div className="space-y-1.5 max-w-2xl mb-7">
                <p className="text-[13px] font-semibold text-[#855E1E]">Pendaftaran Mandiri Umat</p>
                <h2 className="text-[26px] sm:text-[32px] font-bold tracking-tight text-[#082340]">
                  Formulir Pendaftaran Peserta Katekese
                </h2>
                <p className="text-[15px] text-[#4D5B6D] leading-relaxed">
                  Lengkapi data diri calon peserta dan pilih jadwal pembinaan langsung dari halaman
                  ini. Setelah dikirim, pendaftaran Anda akan langsung diverifikasi oleh Sekretariat{' '}
                  {resolvedParishName}.
                </p>
              </div>

              <PublicRegistrationForm
                preselectedProgram={preselectedFormProgram}
                onBrowsePrograms={() => goToView('programs')}
              />
            </section>

            {/* Roles Overview Section */}
            {frontpageContent.showRolesSection && frontpageContent.roleHighlights.length > 0 && (
              <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 border-t border-[#E2E7EF]">
                <div className="space-y-1.5 max-w-2xl mb-7">
                  <h2 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#082340]">
                    {frontpageContent.rolesHeading}
                  </h2>
                  <p className="text-[15px] text-[#4D5B6D] leading-relaxed">
                    {frontpageContent.rolesSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {frontpageContent.roleHighlights.map((item, idx) => (
                    <button
                      key={`${item.title}-${idx}`}
                      type="button"
                      onClick={currentUser ? openPortal : openLoginScreen}
                      className="text-left bg-white border border-[#E2E7EF] rounded-[14px] p-5 flex flex-col gap-3 hover:border-[#BFD0E5] transition-colors cursor-pointer"
                    >
                      <RoleHighlightIcon type={item.iconType} />
                      <h3 className="text-[16px] font-semibold text-[#0D1B2A]">{item.title}</h3>
                      <p className="text-[13px] text-[#4D5B6D] leading-relaxed flex-1">
                        {item.description}
                      </p>
                      <span className="text-[13px] font-medium text-[#082340] inline-flex items-center gap-1 pt-1">
                        <span>{currentUser ? 'Buka Portal' : 'Masuk ke Portal'}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* ======================== PROGRAMS CATALOG VIEW ======================== */}
        {view === 'programs' && (
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="mb-8 space-y-2 max-w-2xl">
              <p className="text-[13px] font-semibold text-[#855E1E]">
                {frontpageContent.programsEyebrow}
              </p>
              <h1 className="text-[30px] sm:text-[38px] font-bold tracking-tight text-[#082340]">
                {frontpageContent.programsHeading}
              </h1>
              <p className="text-[15px] text-[#4D5B6D] leading-relaxed">
                Baca tujuan, persyaratan, serta dokumen yang perlu disiapkan sebelum melanjutkan pendaftaran di Portal Catevia.
              </p>
            </div>

            {/* Search & Interactive Status Filter */}
            <div className="bg-white border border-[#E2E7EF] rounded-[12px] p-4 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search
                  className="w-4 h-4 text-[#69778A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama program, sasaran peserta..."
                  aria-label="Cari program katekese"
                  className="w-full min-h-[42px] pl-10 pr-3.5 py-2 rounded-[8px] border border-[#CBD4E1] bg-[#F8F9FB] focus:bg-white text-[14px] text-[#0D1B2A] placeholder:text-[#69778A] focus:outline-none focus:border-[#082340]"
                />
              </div>

              <div
                className="flex items-center gap-1 p-1 bg-[#F2F4F8] rounded-[9px] overflow-x-auto"
                role="tablist"
                aria-label="Filter status pendaftaran"
              >
                {(['Semua', 'Pendaftaran Dibuka', 'Akan Dibuka', 'Ditutup'] as const).map(
                  (status) => {
                    const active = statusFilter === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 min-h-[36px] rounded-[7px] text-[13px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          active
                            ? 'bg-white text-[#082340] font-semibold shadow-xs'
                            : 'text-[#4D5B6D] hover:text-[#0D1B2A] font-medium'
                        }`}
                      >
                        {status}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {filteredPrograms.length === 0 ? (
              <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-10 text-center">
                <p className="text-[15px] font-medium text-[#0D1B2A]">
                  Tidak ada program yang sesuai dengan pencarian Anda.
                </p>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('Semua');
                    }}
                  >
                    Atur Ulang Filter
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPrograms.map(renderProgramCard)}
              </div>
            )}
          </section>
        )}

        {/* ======================== PROGRAM DETAIL VIEW ======================== */}
        {view === 'detail' && selectedProgram && (
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <button
              type="button"
              onClick={() => goToView(previousView)}
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[#4D5B6D] hover:text-[#082340] mb-6 min-h-[40px] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Kembali ke {previousView === 'home' ? 'Beranda' : 'Daftar Program'}</span>
            </button>

            {/* Detail Hero */}
            <div className="bg-gradient-to-br from-[#FFFFFF] via-[#F4F8FE] to-[#E6F0FC] border border-[#D8E5F5] rounded-[18px] p-6 sm:p-9 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-6">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
                  <span className={STATUS_TEXT_CLASS[selectedProgram.status]}>
                    {selectedProgram.status}
                  </span>
                  <span className="text-[#94A3B8]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#4D5B6D]">{selectedProgram.audience}</span>
                  <span className="text-[#94A3B8]" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-[#4D5B6D]">{selectedProgram.mode}</span>
                </div>

                <h1 className="text-[28px] sm:text-[38px] font-bold tracking-tight text-[#082340] leading-tight">
                  {selectedProgram.name}
                </h1>

                <p className="text-[15px] sm:text-[16px] text-[#42546A] leading-relaxed max-w-2xl">
                  {selectedProgram.overview}
                </p>
              </div>

              <div className="lg:col-span-4 flex items-center justify-center">
                <div className="w-full max-w-[240px]">
                  <ProgramArtwork type={selectedProgram.iconType} />
                </div>
              </div>
            </div>

            {/* 2-Column Detail Body */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6">
                  <h2 className="text-[18px] font-semibold text-[#082340]">Hal yang Dipelajari</h2>
                  <ul className="mt-4 space-y-3">
                    {selectedProgram.learnItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-[14px] text-[#334155] leading-relaxed">
                        <CheckCircle2
                          className="w-4 h-4 text-[#157347] shrink-0 mt-1"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6">
                  <h2 className="text-[18px] font-semibold text-[#082340]">Persyaratan Peserta</h2>
                  <ul className="mt-4 space-y-2.5 list-disc pl-5 text-[14px] text-[#334155] leading-relaxed">
                    {selectedProgram.requirements.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>

                  {selectedProgram.policyNote && (
                    <div className="mt-5 p-4 rounded-[10px] bg-[#F4F8FD] border border-[#D8E5F5] text-[13px] text-[#1E3A5F] leading-relaxed">
                      {selectedProgram.policyNote}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6">
                  <h2 className="text-[18px] font-semibold text-[#082340]">
                    Dokumen yang Perlu Disiapkan
                  </h2>
                  <ul className="mt-4 space-y-2.5 list-disc pl-5 text-[14px] text-[#334155] leading-relaxed">
                    {selectedProgram.documents.map((docItem, idx) => (
                      <li key={idx}>{docItem}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6 space-y-3">
                  <h2 className="text-[18px] font-semibold text-[#082340]">Bentuk Kelas & Jadwal</h2>
                  <div className="flex items-start gap-2.5 text-[14px] text-[#334155]">
                    <CalendarDays className="w-4 h-4 text-[#855E1E] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-semibold text-[#0D1B2A]">{selectedProgram.mode}</p>
                      <p className="text-[#4D5B6D] mt-0.5">
                        {selectedProgram.scheduleSummary ||
                          'Jadwal lengkap diumumkan oleh Sekretariat Paroki pada awal gelombang.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#CBD4E1] rounded-[14px] p-6 space-y-4">
                  <h2 className="text-[18px] font-semibold text-[#082340]">Langkah Selanjutnya</h2>
                    <p className="text-[14px] text-[#4D5B6D] leading-relaxed">
                    {selectedProgram.status === 'Pendaftaran Dibuka'
                      ? 'Setelah membaca informasi program di atas, Anda dapat langsung mengisi Formulir Pendaftaran Mandiri di halaman depan dan mengunggah dokumen persyaratan.'
                      : 'Pendaftaran gelombang ini belum dibuka. Anda tetap dapat menghubungi Sekretariat Paroki untuk mendapatkan informasi pembukaan berikutnya.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                    <Button
                      variant="primary"
                      fullWidth
                      disabled={selectedProgram.status !== 'Pendaftaran Dibuka'}
                      onClick={() => handleContinueRegistration(selectedProgram)}
                    >
                      {selectedProgram.status === 'Pendaftaran Dibuka'
                        ? 'Isi Formulir Pendaftaran'
                        : selectedProgram.status}
                    </Button>
                    <Button variant="secondary" fullWidth onClick={() => goToView('contact')}>
                      Tanya Sekretariat
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================== DEDICATED SELF-REGISTRATION VIEW ======================== */}
        {view === 'register' && (
          <section className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <p className="text-[13px] font-semibold text-[#855E1E]">
                  Pendaftaran Mandiri · {resolvedParishName}
                </p>
                <h1 className="text-[30px] sm:text-[38px] font-bold tracking-tight text-[#082340] leading-tight">
                  Formulir Pendaftaran Peserta Katekese
                </h1>
                <p className="text-[15px] text-[#4D5B6D] leading-relaxed">
                  Isi data calon penerima sakramen di bawah ini untuk mendaftar secara mandiri.
                  Berkas persyaratan dapat diunggah langsung atau menyusul melalui Portal Peserta.
                </p>
              </div>
              <Button variant="secondary" onClick={() => goToView('programs')}>
                Lihat Daftar Program
              </Button>
            </div>

            <PublicRegistrationForm
              preselectedProgram={preselectedFormProgram}
              onBrowsePrograms={() => goToView('programs')}
            />
          </section>
        )}

        {/* ======================== ABOUT VIEW ======================== */}
        {view === 'about' && (
          <section className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-[#855E1E]">
                {resolvedParishName}
              </p>
              <h1 className="text-[30px] sm:text-[38px] font-bold tracking-tight text-[#082340]">
                {frontpageContent.aboutTitle}
              </h1>
            </div>

            <div className="bg-white border border-[#E2E7EF] rounded-[16px] p-6 sm:p-8 space-y-6">
              <p className="text-[15px] sm:text-[16px] text-[#334155] leading-relaxed whitespace-pre-line">
                {frontpageContent.aboutContent}
              </p>

              {frontpageContent.aboutHighlights.length > 0 && (
                <div className="pt-5 border-t border-[#EEF1F6]">
                  <h2 className="text-[17px] font-semibold text-[#082340] mb-4">
                    Fokus Pelayanan Kami
                  </h2>
                  <ul className="space-y-3">
                    {frontpageContent.aboutHighlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-[14px] text-[#334155] leading-relaxed"
                      >
                        <CheckCircle2
                          className="w-4 h-4 text-[#157347] shrink-0 mt-1"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 flex flex-wrap gap-3">
                <Button variant="primary" onClick={() => goToView('programs')}>
                  Lihat Program Katekese
                </Button>
                <Button variant="secondary" onClick={() => goToView('contact')}>
                  Hubungi Sekretariat
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ======================== GUIDE & FAQ VIEW ======================== */}
        {view === 'guide' && (
          <section className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-[#855E1E]">Panduan Umat</p>
              <h1 className="text-[30px] sm:text-[38px] font-bold tracking-tight text-[#082340]">
                {frontpageContent.guideTitle}
              </h1>
              <p className="text-[15px] text-[#4D5B6D] leading-relaxed max-w-2xl">
                {frontpageContent.guideIntro}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {frontpageContent.guideSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[#E2E7EF] rounded-[14px] p-6 space-y-2.5"
                >
                  <span className="inline-block text-[12px] font-mono-num font-semibold text-[#855E1E]">
                    0{idx + 1}
                  </span>
                  <h2 className="text-[17px] font-semibold text-[#082340]">{step.title}</h2>
                  <p className="text-[14px] text-[#4D5B6D] leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>

            {frontpageContent.showFaqSection && frontpageContent.faqs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-[24px] font-bold tracking-tight text-[#082340]">
                  Pertanyaan Umum (FAQ)
                </h2>
                <div className="bg-white border border-[#E2E7EF] rounded-[14px] divide-y divide-[#EEF1F6]">
                  {frontpageContent.faqs.map((faq, idx) => {
                    const isOpen = openFaqIdx === idx;
                    return (
                      <div key={idx} className="p-5">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                          aria-expanded={isOpen}
                          className="w-full text-left flex items-center justify-between gap-4 cursor-pointer min-h-[36px]"
                        >
                          <span className="text-[15px] font-semibold text-[#0D1B2A]">
                            {faq.question}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-[#5B687A] shrink-0 transition-transform duration-150 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                        {isOpen && (
                          <p className="mt-3 text-[14px] text-[#4D5B6D] leading-relaxed">
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ======================== CONTACT VIEW ======================== */}
        {view === 'contact' && (
          <section className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
            <div className="space-y-3">
              <p className="text-[13px] font-semibold text-[#855E1E]">Sekretariat Paroki</p>
              <h1 className="text-[30px] sm:text-[38px] font-bold tracking-tight text-[#082340]">
                {frontpageContent.contactTitle}
              </h1>
              <p className="text-[15px] text-[#4D5B6D] leading-relaxed max-w-2xl">
                {frontpageContent.contactDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6 flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#082340] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-[14px] font-semibold text-[#0D1B2A]">Alamat Sekretariat</h2>
                  <p className="mt-1 text-[14px] text-[#4D5B6D] leading-relaxed">
                    {frontpageContent.contactAddress}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6 flex items-start gap-3.5">
                <Clock className="w-5 h-5 text-[#082340] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-[14px] font-semibold text-[#0D1B2A]">Jam Layanan</h2>
                  <p className="mt-1 text-[14px] text-[#4D5B6D] leading-relaxed">
                    {frontpageContent.contactHours}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6 flex items-start gap-3.5">
                <Mail className="w-5 h-5 text-[#082340] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-[14px] font-semibold text-[#0D1B2A]">Email Resmi</h2>
                  <p className="mt-1 text-[14px] text-[#4D5B6D] break-all">
                    {resolvedContactEmail}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#E2E7EF] rounded-[14px] p-6 flex items-start gap-3.5">
                <Phone className="w-5 h-5 text-[#082340] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-[14px] font-semibold text-[#0D1B2A]">
                    Telepon & WhatsApp
                  </h2>
                  <p className="mt-1 text-[14px] text-[#4D5B6D]">
                    {resolvedContactPhone}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-white border-t border-[#E2E7EF] mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            {!logoError ? (
              <img
                src={CATEVIA_LOGO_PATH}
                alt="Catevia"
                referrerPolicy="no-referrer"
                onError={() => setLogoError(true)}
                className="h-8 w-auto object-contain select-none"
              />
            ) : (
              <span className="text-[18px] font-bold text-[#082340]">Catevia</span>
            )}
            <p className="text-[14px] text-[#4D5B6D]">{frontpageContent.footerTagline}</p>
            <p className="text-[12px] text-[#69778A]">{frontpageContent.footerCopyright}</p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-[14px] font-medium text-[#4D5B6D]">
            {FOOTER_LINKS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToView(item.id)}
                className="hover:text-[#082340] transition-colors cursor-pointer whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={currentUser ? openPortal : openLoginScreen}
              className="text-[#082340] font-semibold hover:underline cursor-pointer whitespace-nowrap"
            >
              {currentUser ? 'Buka Portal' : 'Masuk Portal'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
