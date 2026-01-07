'use client';

export interface OpentalkCycle {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: any;
  updatedBy?: any;
  events?: OpentalkEvent[]; // For joined data from getCyclesWithEvents
}

export interface OpentalkEvent {
  id: number;
  title: string;
  description?: string;
  eventDate: string;
  status: string;
  type: string;
  cycleId: number;
  cycle?: OpentalkCycle;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: any;
  updatedBy?: any;
  eventParticipants?: Array<{
    staffId: number;
    staff: {
      id: number;
      email: string;
      user?: {
        email: string;
        name: string;
      };
    };
  }>;
  // Virtual property for easier access
  participants?: Array<{
    id: number;
    email: string;
    user?: {
      email: string;
      name: string;
    };
  }>;
}

export interface CreateOpentalkCycleDto {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  type?: string;
}

export interface CreateOpentalkEventDto {
  title: string;
  description?: string;
  eventDate: string;
  status?: string;
  type?: string;
  cycleId: number;
  notes?: string;
  participantIds?: number[];
}

export class OpentalkClientService {
  private readonly baseUrl = '/api/opentalk';

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    // Handle API response wrapper
    if (result.statusCode === 200 && result.data !== undefined) {
      return result.data;
    }
    return result;
  }

  // Cycle operations
  async createCycle(data: CreateOpentalkCycleDto): Promise<OpentalkCycle> {
    return this.request('/cycles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCycles(): Promise<OpentalkCycle[]> {
    return this.request('/cycles');
  }

  async getCycleById(id: number): Promise<OpentalkCycle> {
    return this.request(`/cycles/${id}`);
  }

  async updateCycle(
    id: number,
    data: Partial<CreateOpentalkCycleDto>,
  ): Promise<OpentalkCycle> {
    return this.request(`/cycles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCycle(id: number): Promise<void> {
    return this.request(`/cycles/${id}`, {
      method: 'DELETE',
    });
  }

  // Event operations
  async createEvent(data: CreateOpentalkEventDto): Promise<OpentalkEvent> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEvents(): Promise<OpentalkEvent[]> {
    return this.request('/events');
  }

  async getEventsByCycle(cycleId: number): Promise<OpentalkEvent[]> {
    return this.request(`/cycles/${cycleId}/events`);
  }

  async getEventById(id: number): Promise<OpentalkEvent> {
    return this.request(`/events/${id}`);
  }

  async updateEvent(
    id: number,
    data: Partial<CreateOpentalkEventDto>,
  ): Promise<OpentalkEvent> {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: number): Promise<void> {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Swap operations
  async swapEvents(eventId1: number, eventId2: number): Promise<void> {
    return this.request('/swap', {
      method: 'POST',
      body: JSON.stringify({
        event1Id: eventId1,
        event2Id: eventId2,
        participantsFrom1to2: [],
        participantsFrom2to1: [],
      }),
    });
  }

  async bulkAssignEvents(data: {
    eventIds: number[];
    participantIds: number[];
  }): Promise<void> {
    return this.request('/bulk-assign', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getConflicts(): Promise<any[]> {
    return this.request('/conflicts');
  }

  async getSpreadsheetData(): Promise<{
    events: OpentalkEvent[];
    cycles: OpentalkCycle[];
  }> {
    return this.request('/spreadsheet');
  }

  // Swap Request Management
  async createSwapRequest(data: {
    scheduleId: number;
    targetStaffId?: number;
    reason: string;
  }): Promise<any> {
    return this.request('/swap-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSwapRequests(params?: {
    status?: string;
    requesterId?: number;
  }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.requesterId)
      query.append('requesterId', params.requesterId.toString());

    const queryString = query.toString();
    return this.request(
      `/swap-requests${queryString ? `?${queryString}` : ''}`,
    );
  }

  async getUserStaff(userId: string): Promise<any | null> {
    try {
      // Call staff endpoint directly, not through opentalk base path
      const url = `/api/staffs/by-user/${userId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // User doesn't have a staff record
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      // Handle API response wrapper
      if (result.statusCode === 200 && result.data !== undefined) {
        return result.data;
      }
      return result;
    } catch (error) {
      console.error('Error getting user staff record:', error);
      return null;
    }
  }

  async getUserSchedules(userId: string): Promise<any[]> {
    try {
      // First get the staff record for this user
      const staff = await this.getUserStaff(userId);
      if (!staff) {
        console.log('No staff record found for user:', userId);
        return [];
      }

      console.log('Found staff record:', staff);
      const staffId = staff.id;

      // Get all events and filter for staff's assignments
      const events = await this.getEvents();
      console.log('All events:', events);
      console.log('Looking for staff ID:', staffId);

      const userEvents = events.filter((event) => {
        const hasParticipant = event.eventParticipants?.some((participant) => {
          console.log('Checking participant:', participant);
          return participant.staffId === staffId;
        });
        console.log(`Event ${event.id} has staff ${staffId}:`, hasParticipant);
        return hasParticipant;
      });

      console.log('Staff events found:', userEvents);

      // Transform events to schedule format
      return userEvents.map((event) => ({
        id: event.id,
        topic: event.title,
        date: event.eventDate,
        cycleId: event.cycleId,
        cycle: event.cycle,
        status: event.status,
      }));
    } catch (error) {
      console.error('Error getting user schedules:', error);
      return [];
    }
  }

  async getSwapRequestById(id: number): Promise<any> {
    return this.request(`/swap-requests/${id}`);
  }

  async reviewSwapRequest(
    id: number,
    data: {
      status: 'APPROVED' | 'REJECTED';
      reviewNote?: string;
    },
  ): Promise<any> {
    return this.request(`/swap-requests/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const opentalkClientService = new OpentalkClientService();
