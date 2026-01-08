'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { scheduleService } from '@/shared/lib/services/schedule-service';
import { cn } from '@/shared/utils';
import { ScheduleStatus, ScheduleType } from '@qnoffice/shared';
import { ArrowUpDown, Loader2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Assignment {
  id: number;
  type: ScheduleType;
  cycleId: string;
  assignedDate: string;
  status: ScheduleStatus;
  staff: {
    id: number;
    email: string;
    user: {
      name: string;
      avatar?: string;
    };
    branch: {
      name: string;
    };
  };
  isSwapped: boolean;
}

interface GroupedAssignments {
  cycleId: string;
  type: ScheduleType;
  assignments: Assignment[];
  startDate: string;
  endDate: string;
}

export function ScheduleManagementView() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ScheduleType>(
    ScheduleType.OPENTALK,
  );
  const [selectedAssignments, setSelectedAssignments] = useState<Set<number>>(
    new Set(),
  );
  const [swapMode, setSwapMode] = useState(false);

  useEffect(() => {
    loadAssignments();
  }, [selectedType]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getAssignments({
        type: selectedType,
        status: ScheduleStatus.PENDING,
      });

      if (data) {
        setAssignments(data);
        groupAssignmentsByCycle(data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupAssignmentsByCycle = (assignments: Assignment[]) => {
    const grouped = assignments.reduce(
      (acc, assignment) => {
        if (!acc[assignment.cycleId]) {
          acc[assignment.cycleId] = [];
        }
        acc[assignment.cycleId].push(assignment);
        return acc;
      },
      {} as Record<string, Assignment[]>,
    );

    const groupedArray = Object.entries(grouped).map(
      ([cycleId, assignments]) => {
        const sortedAssignments = assignments.sort(
          (a, b) =>
            new Date(a.assignedDate).getTime() -
            new Date(b.assignedDate).getTime(),
        );

        return {
          cycleId,
          type: assignments[0].type,
          assignments: sortedAssignments,
          startDate: sortedAssignments[0]?.assignedDate || '',
          endDate:
            sortedAssignments[sortedAssignments.length - 1]?.assignedDate || '',
        };
      },
    );

    // Sort cycles by start date (newest first)
    groupedArray.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

    setGroupedData(groupedArray);
  };

  const handleAssignmentSelect = (assignmentId: number, checked: boolean) => {
    const newSelection = new Set(selectedAssignments);
    if (checked) {
      newSelection.add(assignmentId);
    } else {
      newSelection.delete(assignmentId);
    }
    setSelectedAssignments(newSelection);
  };

  const handleSwap = async () => {
    const selectedIds = Array.from(selectedAssignments);
    if (selectedIds.length !== 2) {
      alert('Please select exactly 2 assignments to swap');
      return;
    }

    try {
      await scheduleService.manualSwap(selectedIds[0], selectedIds[1]);
      setSelectedAssignments(new Set());
      setSwapMode(false);
      loadAssignments(); // Reload data
      alert('Swap completed successfully!');
    } catch (error) {
      console.error('Error performing swap:', error);
      alert('Error performing swap');
    }
  };

  const getStatusBadge = (status: ScheduleStatus, isSwapped: boolean) => {
    if (isSwapped) {
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          Swapped
        </Badge>
      );
    }

    switch (status) {
      case ScheduleStatus.PENDING:
        return <Badge variant="outline">Pending</Badge>;
      case ScheduleStatus.ACTIVE:
        return <Badge variant="default">Active</Badge>;
      case ScheduleStatus.COMPLETED:
        return <Badge variant="secondary">Completed</Badge>;
      case ScheduleStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Schedule Management</h2>
        <div className="flex items-center gap-4">
          {swapMode && selectedAssignments.size === 2 && (
            <Button
              onClick={handleSwap}
              className="bg-green-600 hover:bg-green-700"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Execute Swap
            </Button>
          )}
          <Button
            variant={swapMode ? 'destructive' : 'outline'}
            onClick={() => {
              setSwapMode(!swapMode);
              setSelectedAssignments(new Set());
            }}
          >
            {swapMode ? 'Cancel Swap' : 'Swap Mode'}
          </Button>
        </div>
      </div>

      <Tabs
        value={selectedType}
        onValueChange={(value) => setSelectedType(value as ScheduleType)}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value={ScheduleType.OPENTALK}>OpenTalk</TabsTrigger>
          <TabsTrigger value={ScheduleType.CLEANING}>Cleaning</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="space-y-6">
          {groupedData.map((cycle, index) => (
            <Card key={cycle.cycleId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Cycle {index + 1} - {cycle.type}
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {new Date(cycle.startDate).toLocaleDateString()} -{' '}
                    {new Date(cycle.endDate).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {swapMode && (
                        <TableHead className="w-12">Select</TableHead>
                      )}
                      <TableHead>Date</TableHead>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycle.assignments.map((assignment) => (
                      <TableRow
                        key={assignment.id}
                        className={cn(
                          selectedAssignments.has(assignment.id) && 'bg-accent',
                        )}
                      >
                        {swapMode && (
                          <TableCell>
                            <Checkbox
                              checked={selectedAssignments.has(assignment.id)}
                              onCheckedChange={(checked) =>
                                handleAssignmentSelect(
                                  assignment.id,
                                  checked as boolean,
                                )
                              }
                              disabled={
                                selectedAssignments.size >= 2 &&
                                !selectedAssignments.has(assignment.id)
                              }
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          {new Date(assignment.assignedDate).toLocaleDateString(
                            'en-US',
                            {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            },
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {assignment.staff.user.avatar && (
                              <img
                                src={assignment.staff.user.avatar}
                                alt={assignment.staff.user.name}
                                className="h-6 w-6 rounded-full"
                              />
                            )}
                            <span>{assignment.staff.user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{assignment.staff.branch.name}</TableCell>
                        <TableCell>
                          {getStatusBadge(
                            assignment.status,
                            assignment.isSwapped,
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {groupedData.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">
                  No {selectedType.toLowerCase()} assignments found
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
