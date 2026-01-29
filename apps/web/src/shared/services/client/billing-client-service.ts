import baseApi from '@/shared/services/client/base-api';

class BillingClientService {
  async updateOrder(
    billingId: number,
    orderId: string,
    updates: { isPaid?: boolean; amount?: number },
  ) {
    const response = await baseApi.patch(
      `/billings/${billingId}/orders/${orderId}`,
      updates,
    );
    return response.data.data;
  }

  async removeOrderFromBilling(billingId: number, orderId: string) {
    const response = await baseApi.delete(
      `/billings/${billingId}/orders/${orderId}`,
    );
    return response.data.data;
  }

  async getUnbilledOrders(billingId: number) {
    const response = await baseApi.get(
      `/billings/${billingId}/unbilled-orders`,
    );
    return response.data.data;
  }

  async addOrdersToBilling(billingId: number, orderIds: string[]) {
    const response = await baseApi.post(`/billings/${billingId}/orders`, {
      orderIds,
    });
    return response.data.data;
  }

  async sendBill(billingId: number) {
    const response = await baseApi.post(`/billings/${billingId}/send`);
    return response.data.data;
  }
}

export const billingClientService = new BillingClientService();
