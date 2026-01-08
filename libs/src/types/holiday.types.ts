export interface Holiday {
  id: number;
  date: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface CreateHolidayDto {
  date: string;
  name: string;
}

export interface UpdateHolidayDto {
  date?: string;
  name?: string;
}

export interface CreateHolidaysRangeDto {
  startDate: string;
  endDate: string;
  name: string;
}
