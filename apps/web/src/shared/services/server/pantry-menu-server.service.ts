import { PantryMenuItem } from '@qnoffice/shared';
import { BaseServerService } from './base-server-service';

export class PantryMenuServerService extends BaseServerService {
  async getAll(): Promise<PantryMenuItem[]> {
    const response = await this.makeRequest<PantryMenuItem[]>('/pantry-menu');
    return response.data || [];
  }
}

export const pantryMenuServerService = new PantryMenuServerService();
