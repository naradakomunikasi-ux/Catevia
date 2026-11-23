import React from 'react';
import { PublicProgramIconType, RoleHighlightItem } from '../../types/catevia';

export const ParishChurchIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 460 300"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`w-full h-auto select-none ${className}`}
  >
    {/* Warm morning sun */}
    <circle cx="358" cy="58" r="32" fill="#FBF0D2" />
    <circle cx="358" cy="58" r="22" fill="#F5DFAA" />

    {/* Soft sky clouds */}
    <g fill="#D7E7FA" opacity="0.85">
      <ellipse cx="148" cy="82" rx="74" ry="22" />
      <ellipse cx="182" cy="90" rx="54" ry="18" />
      <ellipse cx="322" cy="116" rx="78" ry="24" />
    </g>

    {/* Rolling horizon hills */}
    <path
      d="M0 248 Q115 190 225 242 T460 236 V300 H0 Z"
      fill="#C5DBF5"
    />
    <path
      d="M0 264 Q150 226 290 256 T460 252 V300 H0 Z"
      fill="#A9C8EC"
    />

    {/* Cypress / garden trees */}
    <g fill="#6CA9A6" opacity="0.9">
      <ellipse cx="72" cy="214" rx="28" ry="56" />
      <ellipse cx="394" cy="208" rx="30" ry="60" />
    </g>
    <g fill="#4E8E8B" opacity="0.55">
      <ellipse cx="48" cy="232" rx="20" ry="38" />
      <ellipse cx="420" cy="228" rx="20" ry="40" />
    </g>

    {/* Church Main Facade */}
    <path
      d="M142 280 V142 L226 84 L310 142 V280 Z"
      fill="#FFFFFF"
      stroke="#082340"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />

    {/* Side chapel wings */}
    <rect
      x="108"
      y="186"
      width="34"
      height="94"
      fill="#F4F8FD"
      stroke="#082340"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <rect
      x="310"
      y="186"
      width="34"
      height="94"
      fill="#F4F8FD"
      stroke="#082340"
      strokeWidth="3"
      strokeLinejoin="round"
    />

    {/* Pitched roof overhang */}
    <path
      d="M128 150 L226 78 L324 150"
      stroke="#082340"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Bell Cross */}
    <path
      d="M226 78 V34 M210 50 H242"
      stroke="#B8893E"
      strokeWidth="6"
      strokeLinecap="round"
    />

    {/* Rose window */}
    <circle
      cx="226"
      cy="144"
      r="16"
      fill="#FBF6EC"
      stroke="#B8893E"
      strokeWidth="3"
    />
    <path d="M226 128 V160 M210 144 H242" stroke="#B8893E" strokeWidth="1.8" />

    {/* Side stained glass windows */}
    <rect
      x="166"
      y="174"
      width="22"
      height="34"
      rx="11"
      fill="#DCEBFC"
      stroke="#2B5B8E"
      strokeWidth="2.5"
    />
    <rect
      x="264"
      y="174"
      width="22"
      height="34"
      rx="11"
      fill="#DCEBFC"
      stroke="#2B5B8E"
      strokeWidth="2.5"
    />

    {/* Arched sanctuary entrance */}
    <path
      d="M206 280 V222 C206 211 215 202 226 202 C237 202 246 211 246 222 V280 Z"
      fill="#B8893E"
      fillOpacity="0.22"
      stroke="#082340"
      strokeWidth="3"
    />
    <line x1="226" y1="204" x2="226" y2="280" stroke="#082340" strokeWidth="2" />

    {/* Welcoming pathway */}
    <path
      d="M202 280 L176 300 H276 L250 280 Z"
      fill="#FBF6EC"
      stroke="#D5BA87"
      strokeWidth="2"
    />

    {/* Community silhouettes walking together */}
    <g>
      <circle cx="312" cy="242" r="13" fill="#E9B890" />
      <path d="M294 288 V268 Q312 252 330 268 V288 Z" fill="#082340" />
      <circle cx="346" cy="249" r="10.5" fill="#C9926A" />
      <path d="M332 288 V272 Q346 260 360 272 V288 Z" fill="#B8893E" />
    </g>
  </svg>
);

const ARTWORK_STYLE: Record<
  PublicProgramIconType,
  { bg: string; stroke: string }
> = {
  baptis: { bg: 'bg-[#EFF5FF]', stroke: 'text-[#1D4ED8]' },
  ekaristi: { bg: 'bg-[#FBF6EC]', stroke: 'text-[#9C712E]' },
  krisma: { bg: 'bg-[#FEF2F2]', stroke: 'text-[#B42318]' },
  persink: { bg: 'bg-[#F3F1FC]', stroke: 'text-[#5B3CC4]' },
  umum: { bg: 'bg-[#EDF2F7]', stroke: 'text-[#082340]' },
};

export const ProgramArtwork: React.FC<{
  type: PublicProgramIconType;
  compact?: boolean;
}> = ({ type, compact = false }) => {
  const palette = ARTWORK_STYLE[type] || ARTWORK_STYLE.umum;
  const iconSize = compact ? 'w-10 h-10' : 'w-12 h-12';
  const boxClass = compact ? 'w-20 h-20 rounded-[10px]' : 'w-full h-24 rounded-[10px]';

  return (
    <div
      className={`${boxClass} ${palette.bg} ${palette.stroke} flex items-center justify-center shrink-0`}
      aria-hidden="true"
    >
      {type === 'baptis' && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconSize}>
          <path d="M12 2.5C15.5 7.2 18 10.2 18 13.2a6 6 0 1 1-12 0c0-3 2.5-6 6-10.7Z" />
          <path d="M4 21c2.8-1.6 5.2-1.6 8 0s5.2 1.6 8 0" />
        </svg>
      )}
      {type === 'ekaristi' && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconSize}>
          <path d="M6 6h12v3a6 6 0 0 1-12 0V6Z" />
          <path d="M12 15v6M7.5 21h9" />
          <path d="M12 1.8v3.2M10.2 3.4h3.6" />
        </svg>
      )}
      {type === 'krisma' && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconSize}>
          <path d="M4 12.5c4.5-6 7.5-2.5 8 .2.4-2.7 3.8-6.2 8-.2-2.8 6.2-5.6 8.2-8 8.2S6.8 18.7 4 12.5Z" />
          <path d="M12 3v6.5M9.5 6h5" />
        </svg>
      )}
      {type === 'persink' && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconSize}>
          <path d="M2.5 7c3.6-1.6 6.5-.8 9.5 1.8 3-2.6 5.9-3.4 9.5-1.8v12.5c-3.6-1.6-6.5-.8-9.5 1.8-3-2.6-5.9-3.4-9.5-1.8V7Z" />
          <path d="M12 8.8v12.5M12 2v4.5M9.8 4h4.4" />
        </svg>
      )}
      {type === 'umum' && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={iconSize}>
          <path d="M12 3v18M7 9h10" />
          <circle cx="12" cy="12" r="9" strokeOpacity="0.35" />
        </svg>
      )}
    </div>
  );
};

export const RoleHighlightIcon: React.FC<{
  type: RoleHighlightItem['iconType'];
}> = ({ type }) => (
  <div
    className="w-10 h-10 rounded-[8px] bg-[#EDF2F7] text-[#082340] flex items-center justify-center shrink-0"
    aria-hidden="true"
  >
    {type === 'user' && (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20v-1.5a6.5 6.5 0 0 1 13 0V20" />
      </svg>
    )}
    {type === 'book' && (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 6.5C8.5 4 5.5 4 2.5 5v14c3-1 6-1 9.5 1.5 3.5-2.5 6.5-2.5 9.5-1.5V5c-3-1-6-1-9.5 1.5Z" />
        <path d="M12 6.5v14" />
      </svg>
    )}
    {type === 'cross' && (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M12 3v18M7 9h10" />
      </svg>
    )}
    {type === 'settings' && (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" />
      </svg>
    )}
  </div>
);
