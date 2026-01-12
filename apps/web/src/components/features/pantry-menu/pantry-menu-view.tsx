'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/shared/contexts/auth-context';
import pantryMenuService from '@/shared/services/client/pantry-menu.service';
import { PantryMenuItem, UserRole } from '@qnoffice/shared';
import { useQuery } from '@tanstack/react-query';
import { Download, Heart, Settings, Video } from 'lucide-react';
import { Inter } from 'next/font/google';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { PantryMenuManagementModal } from './pantry-menu-management-modal';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700', '800', '900'],
});

interface Props {
  initialData: PantryMenuItem[];
}

export default function PantryMenuView({ initialData }: Props) {
  const { user } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  const { data: menuItems } = useQuery({
    queryKey: ['pantry-menu'],
    queryFn: () => pantryMenuService.findAll(),
    initialData,
    select: (response: any) => (Array.isArray(response) ? response : response.data),
  });

  const safeMenuItems = Array.isArray(menuItems)
    ? menuItems
    : (menuItems as any)?.data || [];

  const handleExportPNG = async () => {
    if (!menuRef.current) return;
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(menuRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#FDF8E4',
      });
      const link = document.createElement('a');
      link.download = 'pantry-menu.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Xuất ảnh thất bại. Vui lòng thử lại.');
    }
  };



  const activeItems = safeMenuItems;
  const midPoint = Math.ceil(activeItems.length / 2);
  const menuItemsLeft = activeItems.slice(0, midPoint);
  const menuItemsRight = activeItems.slice(midPoint);

  const isHR = user?.role === UserRole.HR;

  const renderMenuItem = (item: PantryMenuItem) => (
    <div key={item.id} className="flex items-center justify-between gap-2">
      <div className="bg-[#FFCC00] px-2 py-1 rounded-sm font-bold text-[#3D3D3D] text-xs shadow-sm">
        {item.name}
      </div>
      <div className="font-black text-[#3D3D3D] text-sm whitespace-nowrap">
        {item.price}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-4 font-sans flex flex-col items-center justify-center gap-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleExportPNG} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export PNG
        </Button>
        {isHR && (
          <Button onClick={() => setIsManagementOpen(true)} variant="secondary" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Quản lý Menu
          </Button>
        )}
      </div>

      <div
        ref={menuRef}
        data-export
        className="w-full max-w-[210mm] aspect-[210/297] bg-[#FDF8E4] relative p-8 pt-10 flex flex-col shadow-2xl rounded-sm"
      >
        {/* Header Section */}
        <div className="flex flex-row gap-4 mb-6">
          {/* QR Code Card */}
          <div className="shrink-0">
            <div className="bg-[#FFCC00] p-3 rounded-2xl text-center shadow-sm relative aspect-square flex flex-col justify-center">
              <div className="bg-white p-2 rounded-lg inline-block mb-1 border border-black/5 relative mx-auto">
                <div className="w-32 h-32 bg-white flex items-center justify-center relative">
                  <Image
                    src="/pantry-qr.svg"
                    alt="QR Code"
                    width={128}
                    height={128}
                    className="w-full h-full"
                  />
                  <div className="absolute top-1/2 -left-6 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-black border-b-[8px] border-b-transparent"></div>
                  <div className="absolute top-1/2 -right-6 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-black border-b-[8px] border-b-transparent"></div>
                </div>
              </div>
              <h2 className="text-lg font-bold mt-1 font-mono tracking-wider">
                SCAN HERE!
              </h2>
            </div>
          </div>

          {/* Title Section */}
          <div className="flex-1 flex flex-col justify-center py-2">
            <div className="border-b-2 border-black/80 pb-1 mb-2">
              <h1 className="text-5xl font-extrabold text-[#3D3D3D] tracking-tight uppercase leading-none">
                QUYNHONCORNER
              </h1>
            </div>
            <div className="relative flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-5xl md:text-6xl font-semibold text-[#3D3D3D] leading-none tracking-[0.2em]">
                  REFUEL
                </h1>
                <div className="flex gap-1">
                  <Heart className="w-10 h-10 fill-[#DC2626] text-[#DC2626] rotate-12" />
                  <Heart className="w-8 h-8 fill-[#DC2626] text-[#DC2626] -rotate-12" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-5xl md:text-6xl font-semibold text-[#3D3D3D] leading-none tracking-[0.2em]">
                  ZONE
                </h1>
                <div className="flex gap-1">
                  <Heart className="w-12 h-12 fill-[#DC2626] text-[#DC2626] rotate-12" />
                  <Heart className="w-10 h-10 fill-[#DC2626] text-[#DC2626] -rotate-12" />
                </div>
              </div>
              <div className="w-full h-1 bg-[#3D3D3D] mt-3 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-2 gap-x-6 flex-1 mb-6 px-12">
          {/* Left Column */}
          <div className="flex flex-col justify-between">
            {menuItemsLeft.map(renderMenuItem)}
          </div>

          {/* Right Column */}
          <div className="flex flex-col justify-between">
            {menuItemsRight.map(renderMenuItem)}
          </div>
        </div>

        {/* Footer Section */}
        <div className="grid grid-cols-[200px_1fr] gap-4 items-center mb-4">
           {/* Warning Box */}
           <div className="bg-[#FFCC00] rounded-xl p-2 relative overflow-hidden flex flex-col items-center justify-center aspect-square w-full">
              <div className="border-4 border-black rounded-lg w-full h-full flex flex-col items-center justify-center bg-[#FFCC00] p-3">
                 <div className="flex-1 flex items-center justify-center">
                   <Video className="w-16 h-16 text-black stroke-[2.5]" />
                 </div>
                 <div className="bg-black text-[#FFCC00] px-4 py-1.5 font-black text-xl w-full text-center tracking-wide">
                   WARNING
                 </div>
                 <div className="text-black text-[0.5rem] font-bold tracking-widest mt-1">
                   CCTV IN OPERATION
                 </div>
              </div>
           </div>

          {/* Payment Instructions */}
          <div className="bg-[#FFCC00] rounded-3xl p-4 flex flex-col justify-center shadow-sm">
            <h3
              className={`text-xl font-black text-[#3D3D3D] text-center mb-3 uppercase tracking-tight ${inter.className}`}
              style={{ fontWeight: 900 }}
            >
              HƯỚNG DẪN THANH TOÁN:
            </h3>
            <ul
              className={`space-y-1.5 text-[#3D3D3D] font-black text-base list-none pl-0 leading-relaxed ${inter.className}`}
              style={{ fontWeight: 800 }}
            >
              <li>Quét mã QR trên bằng Mezon</li>
              <li>Nhập đúng số tiền cần thanh toán</li>
              <li>
                Note:{' '}
                <span className="text-[#3D3D3D]/80 font-extrabold text-sm">
                  ten.hovatendem + món ăn
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Logo */}
        <div className="flex items-center justify-center gap-3 text-[#3D3D3D]">
          <Image
            src="/ncc-logo.png"
            alt="NCC Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <h3 className="font-black text-base tracking-wide uppercase">
            HÃY LÀ KHÁCH HÀNG VĂN MINH
          </h3>
          <Image
            src="/ncc-logo.png"
            alt="NCC Logo"
            width={40}
            height={40}
            className="object-contain"
          />
        </div>
      </div>

      <PantryMenuManagementModal
        open={isManagementOpen}
        onOpenChange={setIsManagementOpen}
        items={activeItems}
      />
    </div>
  );
}
