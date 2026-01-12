import { API_PATHS } from '@/shared/constants';
import baseApi from '@/shared/services/client/base-api';
import {
  ICreatePantryMenuItemDto,
  IUpdatePantryMenuItemDto,
  PantryMenuItem,
} from '@qnoffice/shared';

class PantryMenuService {
  async findAll() {
    const response = await baseApi.get<PantryMenuItem[]>(API_PATHS.PANTRY_MENU);
    return response.data;
  }

  async create(dto: ICreatePantryMenuItemDto) {
    const response = await baseApi.post<PantryMenuItem>(API_PATHS.PANTRY_MENU, dto);
    return response.data;
  }

  async update(id: number, dto: IUpdatePantryMenuItemDto) {
    const response = await baseApi.patch<PantryMenuItem>(`${API_PATHS.PANTRY_MENU}/${id}`, dto);
    return response.data;
  }

  async remove(id: number) {
    const response = await baseApi.delete<void>(`${API_PATHS.PANTRY_MENU}/${id}`);
    return response.data;
  }
}

const pantryMenuService = new PantryMenuService();
export default pantryMenuService;
