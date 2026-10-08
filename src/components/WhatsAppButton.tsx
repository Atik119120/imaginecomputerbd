import { useLocation } from 'react-router-dom';
import { useWhatsappNumber } from '@/hooks/useWhatsappNumber';

export const WhatsAppButton = () => {
  const location = useLocation();
  const whatsappNumber = useWhatsappNumber();

  const hidden = location.pathname.startsWith('/admin') || location.pathname.startsWith('/auth');
  if (hidden || !whatsappNumber) return null;

  const href = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed right-3 bottom-32 md:bottom-32 lg:bottom-24 z-40 w-12 h-12 md:w-14 md:h-14 rounded-lg bg-[#25D366] text-white shadow-xl shadow-[#25D366]/30 flex flex-col items-center justify-center hover:scale-105 transition-transform ring-2 ring-[#25D366]/20"
    >
      <svg viewBox="0 0 32 32" className="w-6 h-6 md:w-7 md:h-7 fill-white" aria-hidden="true">
        <path d="M16.003 3C9.374 3 4 8.373 4 15c0 2.39.706 4.612 1.918 6.484L4 29l7.71-1.879A11.94 11.94 0 0 0 16.003 27C22.63 27 28 21.627 28 15S22.63 3 16.003 3zm0 21.6a9.6 9.6 0 0 1-4.9-1.341l-.351-.207-4.575 1.115 1.142-4.46-.229-.36A9.6 9.6 0 1 1 16.003 24.6zm5.534-7.183c-.302-.151-1.787-.882-2.064-.982-.277-.101-.479-.151-.681.151-.202.302-.781.982-.957 1.183-.176.202-.353.227-.655.076-.302-.151-1.276-.47-2.43-1.498-.898-.801-1.504-1.79-1.681-2.092-.176-.302-.019-.465.132-.616.135-.135.302-.353.453-.529.151-.176.202-.302.302-.504.101-.202.05-.378-.025-.529-.076-.151-.681-1.642-.933-2.247-.245-.59-.494-.51-.681-.519l-.58-.011a1.11 1.11 0 0 0-.806.378c-.277.302-1.058 1.034-1.058 2.52 0 1.487 1.083 2.924 1.234 3.126.151.202 2.134 3.257 5.171 4.566.723.312 1.286.498 1.726.638.725.231 1.385.198 1.907.12.582-.087 1.787-.73 2.039-1.435.252-.706.252-1.31.176-1.435-.075-.126-.277-.202-.579-.353z"/>
      </svg>
    </a>
  );
};
