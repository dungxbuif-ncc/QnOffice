import { Button } from '@/components/ui/button';
import { PantryMenuItem } from '@qnoffice/shared';

interface PantryMenuCartProps {
  items: PantryMenuItem[];
  onIncrementItem: (itemId: number) => void;
  onDecrementItem: (itemId: number) => void;
}

function parsePriceToNumber(price: string): number {
  const normalized = price.toLowerCase().replace(/\s/g, '');

  if (normalized.endsWith('k')) {
    const n = Number(normalized.slice(0, -1).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n * 1000 : 0;
  }

  const digitsOnly = normalized.replace(/[^\d]/g, '');
  const n = Number(digitsOnly);
  return Number.isFinite(n) ? n : 0;
}

function formatVndCompact(amount: number): string {
  if (amount >= 1000 && amount % 1000 === 0) return `${amount / 1000}K`;
  return new Intl.NumberFormat('vi-VN').format(amount);
}

export function PantryMenuCart({ items, onIncrementItem, onDecrementItem }: PantryMenuCartProps) {
  const grouped = items.reduce<Map<number, { item: PantryMenuItem; qty: number }>>((acc, item) => {
    const existing = acc.get(item.id);
    if (existing) existing.qty += 1;
    else acc.set(item.id, { item, qty: 1 });
    return acc;
  }, new Map());

  const rows = Array.from(grouped.values());
  const totalPayment = rows.reduce((sum, row) => sum + parsePriceToNumber(row.item.price) * row.qty, 0);

  return (
    <div className="max-w-md mx-auto rounded-sm shadow-2xl overflow-hidden h-fit bg-white">
      <div className="bg-[#FFD700] p-5 text-center">
        <h2 className="text-gray-800 text-2xl font-bold uppercase">
          Giỏ hàng <span className="text-xxl">🛒</span>
        </h2>
      </div>

      <div className="p-5 max-h-96 overflow-y-auto">
        {rows.length === 0 ? (
          <div className="text-lg italic text-gray-600 text-center py-10">
            Chưa có món nào trong giỏ hàng.
          </div>
        ) : (
          rows.map(({ item, qty }) => {
            const rowTotal = parsePriceToNumber(item.price) * qty;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 mb-4 rounded-xl border-2 border-[#FFE87C] bg-[#fffef0] gap-3"
              >
                <div className="flex-1">
                  <div className="font-bold text-gray-800 mb-1 text-sm">{item.name}</div>
                  <div className="text-gray-600 text-xs">{item.price}</div>
                </div>
                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    className="w-8 h-8 bg-[#FFD700] text-gray-800 text-lg font-bold rounded hover:bg-[#FFC700] hover:scale-110 active:scale-95 transition-all"
                    onClick={() => onDecrementItem(item.id)}
                  >
                    -
                  </Button>
                  <span className="font-bold text-gray-800 min-w-8 text-center">{qty}</span>
                  <Button
                    type="button"
                    className="w-8 h-8 bg-[#FFD700] text-gray-800 text-lg font-bold rounded hover:bg-[#FFC700] hover:scale-110 active:scale-95 transition-all"
                    onClick={() => onIncrementItem(item.id)}
                  >
                    +
                  </Button>
                </div>
                <div className="font-bold text-red-600 min-w-10 text-right">
                  {formatVndCompact(rowTotal)}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-5 bg-[#fffef0] border-t-2 border-gold">
        <div className="flex justify-between items-center p-4 bg-white rounded-xl mb-4 border-2 border-gold gap-3">
          <span className="text-lg font-bold text-gray-800 uppercase whitespace-nowrap">Tổng thanh toán:</span>
          <span className="text-2xl font-bold text-red-600">{formatVndCompact(totalPayment)}</span>
        </div>
        <button
          type="button"
          className="w-full py-4 bg-[#FFD700] text-gray-800 text-lg font-bold uppercase rounded-xl hover:bg-[#FFC700] hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={rows.length === 0}
          onClick={() => {
            // TODO: implement checkout
          }}
        >
          Mua ngay
        </button>
      </div>
    </div>
  );
}