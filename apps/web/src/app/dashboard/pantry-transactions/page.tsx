import PantryTransactionView from '@/components/features/pantry-transaction/pantry-transaction-view';
import { pantryTransactionServerService } from '@/shared/services/server/pantry-transaction-server.service';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pantry Transactions | NCC QN',
  description: 'View pantry payment transactions',
};

// Force dynamic because we fetch data from API
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ 
    page?: string; 
    limit?: string;
    start_time?: string;
    end_time?: string;
  }>;
}

export default async function PantryTransactionPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 20;
  
  // Default: 1 month ago to today
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  const startTime = params.start_time || oneMonthAgo.toISOString().split('T')[0];
  const endTime = params.end_time || today.toISOString().split('T')[0];

  const result = await pantryTransactionServerService.getTransactions(
    page,
    limit,
    startTime,
    endTime,
  );
  const stats = await pantryTransactionServerService.getStats(startTime, endTime);


  return <PantryTransactionView initialData={result} stats={stats} />;
}
