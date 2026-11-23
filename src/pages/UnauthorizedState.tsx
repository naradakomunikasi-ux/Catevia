import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useApp } from '../context/AppContext';

export const UnauthorizedState: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="bg-white border border-[#E2E7EF] rounded-[10px] px-6 py-14 text-center max-w-lg mx-auto mt-8">
      <div className="w-12 h-12 rounded-[10px] bg-[#FEF2F2] text-[#B42318] flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="w-6 h-6" aria-hidden="true" />
      </div>
      <h1 className="text-[20px] font-bold text-[#0D1B2A]">Akses Halaman Terbatas</h1>
      <p className="mt-2 text-[14px] text-[#4D5B6D] leading-relaxed">
        Peran akun Anda saat ini tidak memiliki izin untuk membuka halaman ini. Hubungi Administrator Paroki apabila Anda memerlukan akses tambahan.
      </p>
      <div className="mt-6">
        <Button variant="primary" onClick={() => navigate('dashboard')}>
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  );
};
