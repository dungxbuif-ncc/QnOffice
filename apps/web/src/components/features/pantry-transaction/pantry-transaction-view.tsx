'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PaginatedPantryTransactionResponse } from '@qnoffice/shared';
import { format } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, DollarSign, TrendingUp, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface PantryTransactionViewProps {
  initialData: PaginatedPantryTransactionResponse;
  stats: {
    totalTransactions: number;
    totalAmount: number;
    uniqueContributors: number;
  };
}

export default function PantryTransactionView({
  initialData,
  stats,
}: PantryTransactionViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentPage = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 20;
  
  // Default: 1 month ago to today
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);
  
  const [startDate, setStartDate] = useState(
    searchParams.get('start_time') || oneMonthAgo.toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    searchParams.get('end_time') || today.toISOString().split('T')[0]
  );

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'dd/MM/yyyy HH:mm');
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleDateFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('start_time', startDate);
    params.set('end_time', endDate);
    params.set('page', '1'); // Reset to page 1 when filtering
    router.push(`?${params.toString()}`);
  };

  const handleLimitChange = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', newLimit.toString());
    params.set('page', '1'); // Reset to page 1 when changing limit
    router.push(`?${params.toString()}`);
  };

  // Safe check for data
  const transactions = initialData?.data || [];
  const meta = initialData?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 };

  return (
    <div className="space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contributors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.uniqueContributors}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Transactions</CardTitle>
            
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                From:
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36 h-9"
              />
              <label className="text-sm font-medium whitespace-nowrap">
                To:
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36 h-9"
              />
              <Button onClick={handleDateFilter} size="sm" className="gap-1 h-9">
                <Calendar className="h-3 w-3" />
                Apply
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Transaction Hash</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.hash}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={transaction.userAvatar} />
                        <AvatarFallback>
                          {transaction.userName?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {transaction.userName || 'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {transaction.userEmail || transaction.from_address.substring(0, 8) + '...'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {formatAmount(transaction.amountInDong)}
                  </TableCell>
                  <TableCell>
                    {transaction.text_data || (
                      <span className="text-muted-foreground italic">
                        No note
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(transaction.transaction_timestamp)}
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      {transaction.hash.substring(0, 8)}...
                      {transaction.hash.substring(transaction.hash.length - 6)}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, meta.total)} of {meta.total} transactions
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">
                  Items/page:
                </label>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {currentPage} of {meta.totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= meta.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
