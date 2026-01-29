'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { billingClientService } from '@/shared/services/client/billing-client-service';
import { Billing, Order } from '@qnoffice/shared';
import { format } from 'date-fns';
import { ChevronDown, Plus, Receipt, Send, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

interface BillingsPageClientProps {
  billings: any[];
  initialMonth?: string;
}

export function BillingsPageClient({
  billings: initialBillings,
  initialMonth,
}: BillingsPageClientProps) {
  const router = useRouter();
  const [billings, setBillings] = useState<Billing[]>(
    initialBillings as Billing[],
  );
  const [openBillings, setOpenBillings] = useState<Set<number>>(new Set());
  const [processingOrder, setProcessingOrder] = useState<string | null>(null);

  // Selection state
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set(),
  );
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [isSendingBill, setIsSendingBill] = useState<number | null>(null);

  // Month & Stats
  const currentMonthStr = initialMonth || format(new Date(), 'yyyy-MM');

  const stats = useMemo(() => {
    let total = 0;
    let paid = 0;
    let count = 0;
    billings.forEach((b) => {
      if (!b.orders) return;
      b.orders.forEach((o: Order) => {
        count++;
        total += o.amount || 0;
        if (o.isPaid) paid += o.amount || 0;
      });
    });
    return { total, paid, unpaid: total - paid, count };
  }, [billings]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(`/dashboard/my-bills?month=${e.target.value}`);
  };

  const toggleBilling = (billingId: number) => {
    setOpenBillings((prev) => {
      const next = new Set(prev);
      if (next.has(billingId)) {
        next.delete(billingId);
      } else {
        next.add(billingId);
      }
      return next;
    });
  };

  const handleUpdatePayment = async (
    billingId: number,
    orderId: string,
    isPaid: boolean,
  ) => {
    setProcessingOrder(orderId);
    try {
      setBillings((prev) =>
        prev.map((b) => {
          if (b.id !== billingId) return b;
          return {
            ...b,
            orders: b.orders.map((o) =>
              o.id === orderId ? { ...o, isPaid } : o,
            ),
          };
        }),
      );

      await billingClientService.updateOrder(billingId, orderId, { isPaid });
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleUpdateAmount = async (
    billingId: number,
    orderId: string,
    amount: number,
  ) => {
    setProcessingOrder(orderId);
    try {
      setBillings((prev) =>
        prev.map((b) => {
          if (b.id !== billingId) return b;
          return {
            ...b,
            orders: b.orders.map((o) =>
              o.id === orderId ? { ...o, amount } : o,
            ),
          };
        }),
      );

      await billingClientService.updateOrder(billingId, orderId, { amount });
    } catch (error) {
      console.error('Failed to update amount', error);
    } finally {
      setProcessingOrder(null);
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleBulkRemove = async () => {
    const count = selectedOrderIds.size;
    if (count === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${count} đơn đã chọn khỏi bill không?`))
      return;

    setIsBulkProcessing(true);
    try {
      const promises: Promise<any>[] = [];

      // Clone selected set to iterate
      const ordersToRemove = Array.from(selectedOrderIds);

      // Identify billing for each order to make API calls
      const removals: { billingId: number; orderId: string }[] = [];

      billings.forEach((b) => {
        b.orders.forEach((o) => {
          if (selectedOrderIds.has(o.id)) {
            removals.push({ billingId: b.id, orderId: o.id });
          }
        });
      });

      // Execute API calls
      // Ideally this should be a bulk API, but loop is fine for now
      await Promise.all(
        removals.map((item) =>
          billingClientService.removeOrderFromBilling(
            item.billingId,
            item.orderId,
          ),
        ),
      );

      // Update Local State
      setBillings((prev) =>
        prev.map((b) => ({
          ...b,
          orders: b.orders.filter((o) => !selectedOrderIds.has(o.id)),
        })),
      );

      // Clear selection
      setSelectedOrderIds(new Set());
    } catch (error) {
      console.error('Bulk remove failed', error);
      alert('Có lỗi xảy ra khi xóa các đơn hàng đã chọn');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Add Order Logic
  const [addOrderBillingId, setAddOrderBillingId] = useState<number | null>(
    null,
  );
  const [unbilledOrders, setUnbilledOrders] = useState<Order[]>([]);
  const [selectedUnbilledIds, setSelectedUnbilledIds] = useState<Set<string>>(
    new Set(),
  );
  const [isLoadingUnbilled, setIsLoadingUnbilled] = useState(false);
  const [isAddingOrders, setIsAddingOrders] = useState(false);

  const handleOpenAddDialog = async (
    billingId: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setAddOrderBillingId(billingId);
    setIsLoadingUnbilled(true);
    try {
      const orders = await billingClientService.getUnbilledOrders(billingId);
      setUnbilledOrders(orders || []);
      setSelectedUnbilledIds(new Set());
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setIsLoadingUnbilled(false);
    }
  };

  const toggleSelectUnbilled = (orderId: string) => {
    const newSet = new Set(selectedUnbilledIds);
    if (newSet.has(orderId)) newSet.delete(orderId);
    else newSet.add(orderId);
    setSelectedUnbilledIds(newSet);
  };

  const submitAddOrders = async () => {
    if (!addOrderBillingId) return;
    setIsAddingOrders(true);
    try {
      await billingClientService.addOrdersToBilling(
        addOrderBillingId,
        Array.from(selectedUnbilledIds),
      );
      toast.success('Đã thêm đơn hàng vào bill');
      setAddOrderBillingId(null);
      router.refresh();
    } catch (error) {
      toast.error('Thêm đơn hàng thất bại');
    } finally {
      setIsAddingOrders(false);
    }
  };

  const handleSendBill = async (billingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSendingBill(billingId);
    try {
      await billingClientService.sendBill(billingId);
      toast.success('Đã gửi bill thành công!');
    } catch (error) {
      toast.error('Gửi bill thất bại');
    } finally {
      setIsSendingBill(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Stats Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm sticky top-0 z-10">
        <Input
          type="month"
          value={currentMonthStr}
          onChange={handleMonthChange}
          className="w-full sm:w-auto"
        />
        <div className="flex flex-wrap gap-4 sm:gap-8 w-full sm:w-auto justify-between sm:justify-end">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Tổng chi
            </div>
            <div className="font-bold text-lg">
              {formatCurrency(stats.total)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider text-green-600">
              Đã thu
            </div>
            <div className="font-bold text-lg text-green-600">
              {formatCurrency(stats.paid)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider text-red-500">
              Còn thiếu
            </div>
            <div className="font-bold text-lg text-red-500">
              {formatCurrency(stats.unpaid)}
            </div>
          </div>
        </div>
      </div>
      <>
        {billings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Receipt className="h-12 w-12 mb-4 opacity-20" />
            <p>Không có hóa đơn nào</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            {billings.map((billing) => {
              const isOpen = openBillings.has(billing.id);
              const paidCount = billing.orders.filter((o) => o.isPaid).length;
              const isPaidAll =
                billing.orders.length > 0 &&
                paidCount === billing.orders.length;
              const totalAmount = billing.orders.reduce(
                (sum, o) => sum + (o.amount || 0),
                0,
              );

              return (
                <Collapsible
                  key={billing.id}
                  open={isOpen}
                  onOpenChange={() => toggleBilling(billing.id)}
                >
                  <div
                    className={`border rounded-lg bg-card transition-all duration-200 ${isOpen ? 'ring-1 ring-primary/20' : 'hover:border-primary/30'}`}
                  >
                    {/* Header Section */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer select-none bg-muted/5 group"
                      onClick={() => toggleBilling(billing.id)}
                    >
                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-6 w-6 text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}
                          />
                        </Button>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="font-semibold text-base">
                            Billing #{billing.id}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="hidden sm:inline">•</span>
                            <span>
                              {format(new Date(billing.date), 'dd/MM/yyyy')}
                            </span>
                            <span>•</span>
                            <span>{billing.orders.length} items</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-primary ml-2"
                            onClick={(e) => handleOpenAddDialog(billing.id, e)}
                            title="Thêm đơn hàng vào bill này"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-green-600 ml-1"
                            onClick={(e) => handleSendBill(billing.id, e)}
                            title="Gửi bill lên kênh Datcom"
                            disabled={isSendingBill === billing.id}
                          >
                            {isSendingBill === billing.id ? (
                              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        <Badge
                          variant="secondary"
                          className={`ml-2 font-normal ${isPaidAll ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}`}
                        >
                          {isPaidAll
                            ? 'Hoàn tất'
                            : `${paidCount}/${billing.orders.length} đã trả`}
                        </Badge>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-sm">
                          {formatCurrency(totalAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Order List (Grid Layout) */}
                    <CollapsibleContent>
                      <div className="border-t divide-y bg-background/50">
                        {/* Header Row */}
                        <div className="hidden sm:grid grid-cols-[50px_140px_1fr_110px_110px] gap-4 items-center p-3 pl-4 bg-muted/20 text-xs font-medium text-muted-foreground">
                          <div className="text-center">#</div>
                          <div className="pl-2">Người dùng</div>
                          <div className="pl-2">Nội dung</div>
                          <div className="text-right pr-2">Số tiền</div>
                          <div className="text-center">Trạng thái</div>
                        </div>

                        {billing.orders.map((order, idx) => {
                          const isSelected = selectedOrderIds.has(order.id);
                          return (
                            <div
                              key={order.id}
                              className={`grid grid-cols-1 sm:grid-cols-[50px_140px_1fr_110px_110px] gap-2 sm:gap-4 items-center p-3 pl-4 transition-colors ${isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                            >
                              {/* Checkbox & Index */}
                              <div className="flex items-center gap-3 justify-center sm:justify-start">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    toggleSelectOrder(order.id)
                                  }
                                  className="border-muted-foreground/30"
                                />
                                <span className="text-xs text-muted-foreground w-6 text-center">
                                  {idx + 1}
                                </span>
                              </div>

                              {/* User Info (No Avatar) */}
                              <div
                                className="text-sm font-medium truncate text-foreground/90 pl-8 sm:pl-2"
                                title={order.user?.name || order.userMezonId}
                              >
                                {order.user?.name || order.userMezonId}
                              </div>

                              {/* Content */}
                              <div
                                className="text-sm text-foreground/80 truncate pl-8 sm:pl-2"
                                title={order.content}
                              >
                                {order.content}
                              </div>

                              {/* Amount Input */}
                              <div className="pl-8 sm:pl-0">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    className="h-8 text-right font-mono text-sm bg-transparent border-transparent hover:border-input focus:border-input transition-all px-2 w-full"
                                    placeholder="0"
                                    defaultValue={order.amount}
                                    onBlur={(e) =>
                                      handleUpdateAmount(
                                        billing.id,
                                        order.id,
                                        Number(e.target.value),
                                      )
                                    }
                                  />
                                  <span className="absolute inset-y-0 right-7 flex items-center text-xs text-muted-foreground pointer-events-none opacity-0 focus-within:opacity-0 sm:hidden">
                                    đ
                                  </span>
                                </div>
                              </div>

                              {/* Status Toggle */}
                              <div className="flex justify-center pl-8 sm:pl-0">
                                <div
                                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all select-none border w-fit ${order.isPaid ? 'bg-green-50 border-green-200 text-green-700' : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted'}`}
                                  onClick={() =>
                                    handleUpdatePayment(
                                      billing.id,
                                      order.id,
                                      !order.isPaid,
                                    )
                                  }
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${order.isPaid ? 'bg-green-600' : 'bg-muted-foreground/30'}`}
                                  ></span>
                                  {order.isPaid ? 'Paid' : 'Unpaid'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Add Order Dialog */}
        <Dialog
          open={!!addOrderBillingId}
          onOpenChange={(open) => !open && setAddOrderBillingId(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Thêm đơn hàng vào Bill #{addOrderBillingId}
              </DialogTitle>
              <DialogDescription>
                Chọn các đơn hàng chưa thanh toán trong cùng ngày và kênh chat
                để thêm vào bill.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {isLoadingUnbilled ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full opacity-50" />
                </div>
              ) : unbilledOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/20 rounded-lg">
                  <Receipt className="h-8 w-8 mb-2 opacity-20" />
                  <p>Không có đơn hàng nào chưa thanh toán trong ngày này.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {unbilledOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-start gap-3 p-2 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedUnbilledIds.has(order.id)}
                        onCheckedChange={() => toggleSelectUnbilled(order.id)}
                        className="mt-1"
                      />
                      <div className="text-sm flex-1">
                        <div className="font-medium">{order.content}</div>
                        <div className="text-xs text-muted-foreground flex items-center justify-between mt-1">
                          <span className="font-medium text-foreground/80">
                            {order.user?.name || order.userMezonId}
                          </span>
                          <span className="font-mono">
                            {formatCurrency(order.amount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddOrderBillingId(null)}
              >
                Hủy
              </Button>
              <Button
                onClick={submitAddOrders}
                disabled={isAddingOrders || selectedUnbilledIds.size === 0}
              >
                {isAddingOrders
                  ? 'Đang thêm...'
                  : `Thêm (${selectedUnbilledIds.size})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>

      {/* Action Panel for Bulk Selection */}
      {selectedOrderIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-foreground text-background px-6 py-3 rounded-full shadow-xl animate-in slide-in-from-bottom-5 fade-in duration-200 z-50">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedOrderIds.size}</span>
            <span className="text-sm text-muted-secondary opacity-90">
              đơn đã chọn
            </span>
          </div>

          <div className="h-5 w-px bg-background/20" />

          <Button
            variant="destructive"
            size="sm"
            className="gap-2 h-8 px-4"
            onClick={handleBulkRemove}
            disabled={isBulkProcessing}
          >
            {isBulkProcessing ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Xóa hỏi bill
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-background/50 hover:text-background hover:bg-background/20 rounded-full"
            onClick={() => setSelectedOrderIds(new Set())}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
