import { FrontpageContent, ParishSettings, PublicProgram } from '../types/catevia';

export const DEFAULT_FRONTPAGE_CONTENT: FrontpageContent = {
  parishLabel: 'Paroki Santo Yoseph',
  heroTitle: 'Bertumbuh Bersama dalam Iman Kristus',
  heroSubtitle:
    'Catevia mendampingi setiap umat dalam perjalanan iman melalui program pembinaan sakramen, jadwal kelas, materi katekese, dan pendampingan pastoral yang terarah serta mudah diakses.',
  heroPrimaryCtaLabel: 'Mulai Perjalanan Iman',
  heroSecondaryCtaLabel: 'Lihat Program',

  showScriptureSection: true,
  scriptureHeading: 'Inspirasi Kitab Suci',
  scriptureQuote:
    '“Biarkanlah anak-anak itu datang kepada-Ku, janganlah menghalang-halangi mereka, sebab orang-orang yang seperti itulah yang empunya Kerajaan Allah.”',
  scriptureSource: 'Markus 10:14',
  scriptureNote:
    'Renungan pembinaan iman paroki · dapat diperbarui sewaktu-waktu oleh Sekretariat melalui dasbor Paroki & CMS.',

  programsEyebrow: 'Program Katekese',
  programsHeading: 'Pilih Pembinaan Sesuai Tahapan Iman',
  programsSubtitle:
    'Kenali tujuan, persyaratan, serta berkas yang perlu disiapkan sebelum mendaftar pada gelombang pembinaan aktif.',

  showRolesSection: true,
  rolesHeading: 'Untuk Siapa Catevia?',
  rolesSubtitle:
    'Dirancang untuk membantu seluruh umat dan pelayan pastoral berjalan bersama dalam satu sistem yang rapi.',
  roleHighlights: [
    {
      title: 'Peserta & Orang Tua/Wali',
      description:
        'Memilih program pembinaan, melihat jadwal pertemuan, mengunggah berkas persyaratan, serta membaca materi kelas.',
      iconType: 'user',
    },
    {
      title: 'Katekis & Pendamping',
      description:
        'Mengelola jadwal pertemuan, mencatat kehadiran peserta secara akurat, dan membagikan bahan ajar per sesi.',
      iconType: 'book',
    },
    {
      title: 'Pastor Paroki / Penyetuju',
      description:
        'Meninjau kesiapan calon penerima sakramen, kelengkapan dokumen, dan memberikan keputusan persetujuan pastoral.',
      iconType: 'cross',
    },
    {
      title: 'Sekretariat & Admin Paroki',
      description:
        'Memublikasikan program ke halaman depan, memverifikasi berkas administrasi, dan memantau laporan katekese.',
      iconType: 'settings',
    },
  ],

  aboutTitle: 'Tentang Pelayanan Katekese Paroki',
  aboutContent:
    'Pelayanan Katekese Paroki hadir untuk menemani anak-anak, remaja, orang muda, hingga dewasa dalam mengenal Kristus dan menghidupi iman Katolik. Melalui Catevia, informasi program, proses pendaftaran, kehadiran kelas, hingga kesiapan penerimaan sakramen dikelola secara transparan, tertib, dan penuh perhatian pastoral.',
  aboutHighlights: [
    'Pembinaan terstruktur untuk Baptis Bayi, Komuni Pertama, Sakramen Krisma, Katekumen Dewasa, dan Persink.',
    'Pendampingan langsung oleh para Katekis paroki dengan materi yang tersusun per sesi.',
    'Pencatatan kehadiran dan kelengkapan dokumen yang terhubung langsung ke tinjauan Pastor Paroki.',
    'Akses informasi publik yang terbuka bagi seluruh umat sebelum memulai pendaftaran.',
  ],

  guideTitle: 'Panduan Pendaftaran Program Katekese',
  guideIntro:
    'Ikuti empat langkah sederhana berikut untuk mendaftarkan diri atau putra-putri Anda pada program pembinaan yang sedang dibuka.',
  guideSteps: [
    {
      title: 'Pilih Program Pembinaan',
      description:
        'Buka halaman Program Katekese, lalu pilih program yang sesuai dengan usia dan tahapan sakramen Anda.',
    },
    {
      title: 'Pelajari Persyaratan & Berkas',
      description:
        'Baca detail program untuk mengetahui jadwal kelas, ketentuan paroki, dan dokumen yang perlu disiapkan.',
    },
    {
      title: 'Masuk atau Buat Akun Catevia',
      description:
        'Klik tombol Masuk untuk membuka Portal Catevia menggunakan username/email dan kata sandi Anda, atau buat akun baru saat mendaftar.',
    },
    {
      title: 'Lengkapi Formulir & Unggah Dokumen',
      description:
        'Isi biodata peserta, unggah berkas pendukung, dan pantau status verifikasi serta jadwal kelas langsung dari portal.',
    },
  ],

  showFaqSection: true,
  faqs: [
    {
      question: 'Apakah calon peserta harus memiliki akun terlebih dahulu untuk melihat program?',
      answer:
        'Tidak. Seluruh informasi program, persyaratan, jadwal ringkas, dan kontak sekretariat dapat dibaca secara bebas oleh publik tanpa perlu masuk.',
    },
    {
      question: 'Dokumen apa saja yang umumnya diminta saat mendaftar katekese?',
      answer:
        'Umumnya meliputi fotokopi/pindaian KTP atau Kartu Keluarga, Surat Baptis atau surat pengantar lingkungan, serta pas foto terbaru. Rincian setiap program tercantum pada halaman Detail Program.',
    },
    {
      question: 'Bagaimana jika peserta berhalangan hadir pada salah satu pertemuan?',
      answer:
        'Peserta tetap dapat mempelajari materi pertemuan yang tersedia di Portal Catevia dan berkoordinasi dengan Katekis kelas untuk mengikuti pendampingan susulan.',
    },
    {
      question: 'Siapa yang dapat dihubungi jika mengalami kendala pendaftaran?',
      answer:
        'Anda dapat menghubungi Sekretariat Katekese Paroki melalui nomor telepon, email, atau datang langsung pada jam layanan yang tertera di halaman Kontak.',
    },
  ],

  contactTitle: 'Hubungi Sekretariat Katekese',
  contactDescription:
    'Apabila Anda memiliki pertanyaan mengenai jadwal gelombang baru, syarat sakramen, atau kendala pendaftaran, silakan hubungi Sekretariat Paroki kami.',
  contactAddress: 'Sekretariat Gereja Paroki (lengkapi alamat di menu Paroki & CMS Website)',
  contactHours: 'Selasa – Sabtu, 09.00 – 16.00 WIB · Minggu, 08.00 – 12.00 WIB',
  contactEmail: 'katekese@paroki.or.id',
  contactPhone: '(021) 555-0148',

  footerTagline: 'Bersama bertumbuh dalam iman dan pelayanan.',
  footerCopyright: '© 2026 Catevia — Pelayanan Katekese Paroki.',
};

export const DEFAULT_PUBLIC_PROGRAMS: PublicProgram[] = [
  {
    id: 'pub-baptis-bayi',
    name: 'Baptis Bayi',
    iconType: 'baptis',
    audience: 'Orang tua atau wali bayi/anak',
    mode: 'Tatap muka',
    scheduleSummary: 'Rekoleksi orang tua & wali · 2 pertemuan sebelum penerimaan',
    status: 'Pendaftaran Dibuka',
    summary: 'Persiapan keluarga untuk menyambut Sakramen Baptis bagi bayi dan anak-anak.',
    overview:
      'Orang tua dan wali baptis didampingi secara hangat untuk memahami makna Sakramen Baptis serta panggilan mendidik anak dalam kehidupan iman Katolik sehari-hari.',
    learnItems: [
      'Makna dan rahmat Sakramen Baptis dalam Gereja Katolik',
      'Peran dan tanggung jawab orang tua serta wali baptis',
      'Membangun kebiasaan doa dan kehidupan iman dalam keluarga',
    ],
    requirements: [
      'Orang tua atau wali sah yang hendak membaptiskan bayi/anak (usia 0–6 tahun)',
      'Menentukan wali baptis Katolik yang sudah menerima Sakramen Krisma',
      'Mengikuti sesi rekoleksi persiapan yang ditetapkan oleh paroki',
    ],
    documents: [
      'Salinan Akta Kelahiran anak',
      'Salinan Kartu Keluarga Katolik / Surat Keterangan Lingkungan',
      'Salinan Surat Nikah Gereja orang tua & Surat Baptis/Krisma wali baptis',
    ],
    policyNote:
      'Jadwal penerimaan Baptis Bayi dilaksanakan berkala setiap triwulan sesuai kalender liturgi paroki.',
    linkedProgram: '',
    published: true,
    displayOrder: 1,
  },
  {
    id: 'pub-komuni-pertama',
    name: 'Komuni Pertama',
    iconType: 'ekaristi',
    audience: 'Anak usia SD kelas 4 ke atas',
    mode: 'Tatap muka',
    scheduleSummary: 'Sabtu · 15.30–17.00 WIB · Ruang Katekese Paroki',
    status: 'Pendaftaran Dibuka',
    summary: 'Pembinaan anak untuk mengenal Yesus dan menyambut Sakramen Ekaristi Pertama.',
    overview:
      'Anak-anak didampingi dengan metode kreatif dan ramah usia agar semakin mengenal Yesus, memahami makna Perayaan Ekaristi, Sakramen Tobat, serta hidup mengasihi sesama.',
    learnItems: [
      'Mengenal pribadi Yesus dan karya keselamatan-Nya',
      'Tata Perayaan Ekaristi dan makna Tubuh serta Darah Kristus',
      'Persiapan Sakramen Pengakuan Dosa pertama dan hidup doa harian',
    ],
    requirements: [
      'Anak Katolik yang telah dibaptis dan berusia minimal 9 tahun (atau kelas 4 SD)',
      'Mendapat dukungan dan pendampingan aktif dari orang tua/wali',
      'Memenuhi tingkat kehadiran minimal sesuai ketentuan paroki',
    ],
    documents: [
      'Salinan Surat Baptis anak',
      'Salinan Kartu Keluarga & rekomendasi Ketua Lingkungan',
      'Pas foto terbaru anak ukuran 3×4',
    ],
    policyNote:
      'Usia minimum, ketentuan sakramental, dan jadwal penerimaan mengikuti ketetapan Pastor Paroki pada tahun ajaran berjalan.',
    linkedProgram: 'Komuni Pertama',
    published: true,
    displayOrder: 2,
  },
  {
    id: 'pub-krisma',
    name: 'Sakramen Krisma (Penguatan)',
    iconType: 'krisma',
    audience: 'Remaja, OMK & Dewasa',
    mode: 'Tatap muka & sesi diskusi kelompok',
    scheduleSummary: 'Minggu · 13.00–14.30 WIB · Aula Paroki',
    status: 'Akan Dibuka',
    summary: 'Pendampingan pendewasaan iman menuju penerimaan Sakramen Penguatan.',
    overview:
      'Program pendampingan bagi remaja, orang muda, dan umat dewasa untuk memperdalam karya Roh Kudus, meneguhkan komitmen menggereja, serta terlibat aktif dalam pelayanan.',
    learnItems: [
      'Roh Kudus, tujuh karunia Roh, dan makna Sakramen Penguatan',
      'Panggilan hidup menggereja, pelayanan paroki, dan kesaksian iman',
      'Retret penguatan iman dan persiapan liturgis penerimaan Krisma',
    ],
    requirements: [
      'Sudah menerima Sakramen Baptis dan Komuni Pertama secara sah',
      'Berusia minimal 14 tahun / kelas 8 SMP ke atas sesuai kebijakan keuskupan',
      'Mengikuti seluruh rangkaian pembinaan kelas dan rekoleksi wajib',
    ],
    documents: [
      'Salinan Surat Baptis yang mencantumkan catatan Komuni Pertama',
      'Salinan KTP atau Kartu Pelajar serta Kartu Keluarga',
      'Surat pengantar dari Ketua Lingkungan dan pas foto 3×4',
    ],
    policyNote:
      'Pendaftaran gelombang berikutnya akan segera dibuka setelah konfirmasi jadwal penerimaan bersama Bapak Uskup.',
    linkedProgram: 'Krisma (Penguatan)',
    published: true,
    displayOrder: 3,
  },
  {
    id: 'pub-katekumen',
    name: 'Katekumen (Baptis Dewasa)',
    iconType: 'baptis',
    audience: 'Calon baptis dewasa & OMK',
    mode: 'Tatap muka & daring terpadu',
    scheduleSummary: 'Minggu · 09.00–11.00 WIB · Ruang Katekese Paroki',
    status: 'Pendaftaran Dibuka',
    summary: 'Perjalanan iman bertahap menuju penerimaan Sakramen Inisiasi pada Malam Paskah.',
    overview:
      'Calon katekumen menjalani proses pembinaan iman yang terarah melalui pertemuan mingguan, pendampingan wali baptis, tahap-tahap liturgis (Penerimaan Katekumen, Pengukuhan, Skrutinium), retret, hingga mistagogi.',
    learnItems: [
      'Dasar-dasar iman Katolik, Kitab Suci, dan Syahadat Para Rasul',
      'Tujuh Sakramen Gereja, Liturgi, serta sepuluh Perintah Allah',
      'Hidup doa, moral Kristiani, retret perutusan, dan pendampingan mistagogi',
    ],
    requirements: [
      'Memiliki kerinduan pribadi untuk mengenal dan memeluk iman Katolik',
      'Bersedia mengikuti masa pembinaan ±1 tahun bersama wali baptis',
      'Menyerahkan dokumen identitas dan rekomendasi lingkungan sesuai tahapan',
    ],
    documents: [
      'Salinan KTP / Kartu Keluarga',
      'Surat pengantar Ketua Lingkungan atau surat pindah paroki (jika ada)',
      'Pas foto terbaru ukuran 3×4',
    ],
    policyNote:
      'Kelayakan penerimaan sakramen ditinjau secara pastoral oleh Katekis, Koordinator, dan Pastor Paroki.',
    linkedProgram: 'Katekumen (Baptis Dewasa)',
    published: true,
    displayOrder: 4,
  },
  {
    id: 'pub-persink',
    name: 'Persink (Pelajar Katolik)',
    iconType: 'persink',
    audience: 'Pelajar Katolik SD–SMA di sekolah non-Katolik',
    mode: 'Tatap muka dan daring',
    scheduleSummary: 'Sabtu · 10.00–11.30 WIB · Ruang Katekese & Daring',
    status: 'Pendaftaran Dibuka',
    summary: 'Pendampingan iman dan pelajaran Agama Katolik bagi pelajar di sekolah non-Katolik.',
    overview:
      'Persink membantu pelajar Katolik jenjang SD sampai SMA/SMK yang bersekolah di sekolah non-Katolik untuk memperdalam iman, mengenal Gereja, serta memperoleh pendampingan rohani yang hangat.',
    learnItems: [
      'Pengenalan Kitab Suci, ajaran dasar iman Katolik, dan doa harian',
      'Mengenal hidup menggereja, tahun liturgi, dan sakramen-sakramen',
      'Kebersamaan, diskusi remaja, pelayanan, dan kesaksian iman di lingkungan sekolah',
    ],
    requirements: [
      'Pelajar Katolik jenjang SD, SMP, atau SMA/SMK di sekolah non-Katolik',
      'Memperoleh izin serta dukungan pendampingan dari orang tua/wali',
      'Mengikuti kelas pendampingan rutin sesuai jenjang masing-masing',
    ],
    documents: [
      'Data identitas pelajar dan keterangan sekolah',
      'Kontak aktif orang tua atau wali',
      'Salinan Surat Baptis (jika sudah dibaptis)',
    ],
    policyNote:
      'Nilai atau surat keterangan keikutsertaan Persink dapat diterbitkan paroki untuk keperluan administrasi sekolah.',
    linkedProgram: '',
    published: true,
    displayOrder: 5,
  },
];

const LEGACY_SEEDED_PARISH_NAMES = ['Paroki Santo Yoseph', 'Paroki St. Yoseph'];
const LEGACY_SEEDED_ADDRESS = 'Jl. Gereja Santo Yoseph No. 14, Lingkungan St. Lukas, Jakarta Pusat 10430';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceParishReferences(
  text: string,
  nextParishName: string,
  previousParishName?: string
): string {
  const target = nextParishName.trim();
  if (!text || !target) return text;

  const candidates = new Set<string>();
  if (previousParishName && previousParishName.trim() && previousParishName.trim() !== target) {
    candidates.add(previousParishName.trim());
  }

  // If the configured parish is no longer the initial demo parish, also scrub leftover demo parish strings
  if (!target.toLowerCase().includes('yoseph')) {
    LEGACY_SEEDED_PARISH_NAMES.forEach((legacy) => candidates.add(legacy));
  }

  let result = text;
  candidates.forEach((oldName) => {
    const regex = new RegExp(escapeRegExp(oldName), 'gi');
    result = result.replace(regex, target);
  });

  return result;
}

/**
 * Keeps Public Frontpage CMS content strictly aligned with the single source of truth
 * in Parish Settings (`settings/parish`), preventing duplicate or conflicting parish names/contacts.
 */
export function syncFrontpageWithParishSettings(
  content: FrontpageContent,
  parishSettings: ParishSettings,
  previousParishName?: string
): FrontpageContent {
  const parishName = parishSettings.parishName.trim();
  const isLegacyDemoParish = parishName.toLowerCase().includes('yoseph');

  let nextAddress = content.contactAddress;
  if (
    !isLegacyDemoParish &&
    (nextAddress.trim() === LEGACY_SEEDED_ADDRESS ||
      nextAddress.toLowerCase().includes('gereja santo yoseph'))
  ) {
    nextAddress = `Sekretariat ${parishName}`;
  }

  return {
    ...content,
    parishLabel: parishName.slice(0, 120),
    contactEmail: parishSettings.contactEmail.trim().slice(0, 160),
    contactPhone: parishSettings.contactPhone.trim().slice(0, 100),
    contactAddress: nextAddress.slice(0, 300),
    aboutTitle: replaceParishReferences(content.aboutTitle, parishName, previousParishName).slice(
      0,
      160
    ),
    aboutContent: replaceParishReferences(
      content.aboutContent,
      parishName,
      previousParishName
    ).slice(0, 2000),
    faqs: content.faqs.map((faq) => ({
      question: replaceParishReferences(faq.question, parishName, previousParishName).slice(0, 200),
      answer: replaceParishReferences(faq.answer, parishName, previousParishName).slice(0, 600),
    })),
    footerTagline: replaceParishReferences(
      content.footerTagline,
      parishName,
      previousParishName
    ).slice(0, 180),
    footerCopyright: replaceParishReferences(
      content.footerCopyright,
      parishName,
      previousParishName
    ).slice(0, 180),
  };
}

export function isFrontpageOutOfSyncWithParish(
  content: FrontpageContent,
  parishSettings: ParishSettings
): boolean {
  const parishName = parishSettings.parishName.trim();
  if (!parishName) return false;

  if (
    content.parishLabel.trim() !== parishName ||
    content.contactEmail.trim() !== parishSettings.contactEmail.trim() ||
    content.contactPhone.trim() !== parishSettings.contactPhone.trim()
  ) {
    return true;
  }

  if (!parishName.toLowerCase().includes('yoseph')) {
    const combinedText = [
      content.aboutTitle,
      content.aboutContent,
      content.contactAddress,
      content.footerTagline,
      content.footerCopyright,
      ...content.faqs.map((f) => `${f.question} ${f.answer}`),
    ]
      .join(' ')
      .toLowerCase();

    if (
      combinedText.includes('paroki santo yoseph') ||
      combinedText.includes('paroki st. yoseph') ||
      combinedText.includes('gereja santo yoseph')
    ) {
      return true;
    }
  }

  return false;
}
