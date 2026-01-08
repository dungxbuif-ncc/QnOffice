'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Branch } from '@qnoffice/shared';

interface BranchActionsProps {
  branch: Branch;
  onEdit?: (branch: Branch) => void;
  onDelete?: (id: number, name: string) => void;
  onView?: (branch: Branch) => void;
}

const BranchActions = ({ branch, onView }: BranchActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(branch.id.toString())}
        >
          Copy branch ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {onView && (
          <DropdownMenuItem onClick={() => onView(branch)}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
        )}
        <DropdownMenuItem disabled>
          <Pencil className="mr-2 h-4 w-4" />
          Edit branch (Coming soon)
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="text-muted-foreground">
          <Trash className="mr-2 h-4 w-4" />
          Delete branch (Coming soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const createBranchColumns = (
  onEdit?: (branch: Branch) => void,
  onDelete?: (id: number, name: string) => void,
  onView?: (branch: Branch) => void,
): ColumnDef<Branch>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Branch Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('name')}</div>
    ),
  },
  {
    accessorKey: 'code',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Code
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue('code')}</div>
    ),
  },
  {
    accessorKey: 'address',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Address
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {row.getValue('address') || 'N/A'}
      </div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.getValue('createdAt')).toLocaleDateString('vi-VN')}
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const branch = row.original;
      return (
        <BranchActions
          branch={branch}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      );
    },
  },
];
