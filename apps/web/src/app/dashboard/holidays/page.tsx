import { HolidayDataTable } from '@/components/holidays/holiday-data-table';
import { HolidayPageActions } from '@/components/holidays/holiday-page-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getServerPaginationParams,
  SearchParams,
} from '@/shared/lib/base-paginated-service';
import {
  GetHolidaysParams,
  holidayServerService,
} from '@/shared/services/server/holiday-server-service';

interface HolidayPageProps {
  searchParams?: SearchParams;
}

export default async function HolidayPage({ searchParams }: HolidayPageProps) {
  const resolvedSearchParams = await searchParams;

  const params: GetHolidaysParams = getServerPaginationParams(
    resolvedSearchParams || {},
    { defaultPage: 1, defaultPageSize: 10, defaultOrder: 'DESC' },
  );

  const holidayResponse = await holidayServerService.getAll(params);

  const holidays = holidayResponse?.result || [];
  const pagination = {
    page: holidayResponse?.page || 1,
    pageSize: holidayResponse?.pageSize || 10,
    total: holidayResponse?.total || 0,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Holidays</CardTitle>
          <HolidayPageActions />
        </CardHeader>
        <CardContent>
          <HolidayDataTable
            initialData={holidays}
            initialPagination={pagination}
          />
        </CardContent>
      </Card>
    </div>
  );
}
