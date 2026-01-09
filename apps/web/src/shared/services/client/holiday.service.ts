import baseApi from '@/shared/services/client/base-api';
import {
   ApiResponse,
   Holiday,
   ICreateHolidayDto,
   ICreateHolidaysRangeDto,
   IHolidayQuery,
   IPaginationDto,
   IUpdateHolidayDto,
} from '@qnoffice/shared';

class HolidayService {
  private readonly baseUrl = '/holidays';

  async getAll(params: IHolidayQuery = {}) {
    return baseApi.get<ApiResponse<IPaginationDto<Holiday>>>(this.baseUrl, {
      params,
    });
  }

  async getById(id: number) {
    return baseApi.get<ApiResponse<Holiday>>(`${this.baseUrl}/${id}`);
  }

  async create(data: ICreateHolidayDto) {
    return baseApi.post<ApiResponse<Holiday>>(this.baseUrl, data);
  }

  async createBulk(data: ICreateHolidaysRangeDto) {
    return baseApi.post<ApiResponse<Holiday[]>>(`${this.baseUrl}/bulk`, data);
  }

  async update(id: number, data: IUpdateHolidayDto) {
    return baseApi.put<ApiResponse<Holiday>>(`${this.baseUrl}/${id}`, data);
  }

  async delete(id: number) {
    return baseApi.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }
}

export const holidayService = new HolidayService();
