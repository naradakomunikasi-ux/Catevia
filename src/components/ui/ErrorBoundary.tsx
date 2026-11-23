import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let friendly = 'Terjadi gangguan tak terduga saat memuat data Catevia.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        if (parsed.error.toLowerCase().includes('permission')) {
          friendly =
            'Akses ke data ditolak oleh aturan keamanan server. Pastikan akun Anda aktif dan memiliki izin peran yang sesuai.';
        } else if (parsed.error.toLowerCase().includes('quota')) {
          friendly =
            'Kuota harian basis data telah tercapai. Silakan coba kembali besok atau periksa kuota proyek Firebase.';
        } else {
          friendly = parsed.error;
        }
      }
    } catch {
      if (error.message) {
        friendly = error.message;
      }
    }
    return { hasError: true, message: friendly };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Catevia ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white border border-[#E2E7EF] rounded-[12px] p-6 text-center shadow-[0_10px_24px_rgba(8,35,64,0.08)]">
            <div className="w-12 h-12 rounded-[10px] bg-[#FEF2F2] text-[#B42318] flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <h1 className="text-[19px] font-bold text-[#0D1B2A]">
              Kendala Akses atau Sinkronisasi
            </h1>
            <p className="mt-2 text-[14px] text-[#4D5B6D] leading-relaxed">
              {this.state.message}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2.5">
              <Button
                variant="primary"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => window.location.reload()}
              >
                Muat Ulang Aplikasi
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
