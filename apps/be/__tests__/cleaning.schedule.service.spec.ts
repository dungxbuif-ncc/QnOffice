
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ScheduleType } from '@qnoffice/shared';
import { DataSource } from 'typeorm';
import HolidayEntity from '../src/modules/holiday/holiday.entity';
import ScheduleEventEntity from '../src/modules/schedule/enties/schedule-event.entity';
import { CleaningScheduleService } from '../src/modules/schedule/services/cleaning.schedule.service';

class TestLogger {
  static caseStart(name: string) {
    process.stdout.write(`\n\x1b[33m=================================================================================\x1b[0m\n`);
    process.stdout.write(`\x1b[33m TEST CASE: ${name} \x1b[0m\n`);
    process.stdout.write(`\x1b[33m=================================================================================\x1b[0m\n`);
  }

  static table(title: string, events: any[], highlightIds: number[] = []) {
      process.stdout.write(`\n${title}\n`);
      if (!events || events.length === 0) {
          process.stdout.write("  (No events)\n\n");
          return;
      }
      
      const fmt = (str: string, len: number) => str.padEnd(len);
      const getDayName = (dateStr: string) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { weekday: 'short' });
      };

      const eventsByCycle: { [key: string]: any[] } = {};
      events.forEach(e => {
          const cId = String(e.cycleId ?? '?');
          if (!eventsByCycle[cId]) eventsByCycle[cId] = [];
          eventsByCycle[cId].push(e);
      });

      Object.keys(eventsByCycle).forEach(cycleId => {
          process.stdout.write(`  [Cycle ID: ${cycleId}]\n`);
          process.stdout.write(`  ┌──────────┬────────────────────┬──────────┐\n`);
          process.stdout.write(`  │ ${fmt('EventID', 8)} │ ${fmt('Date', 18)} │ ${fmt('StaffIDs', 10)} │\n`);
          process.stdout.write(`  ├──────────┼────────────────────┼──────────┤\n`);
          
          eventsByCycle[cycleId].forEach(e => {
            const isHighlighted = highlightIds.includes(e.id);
            const marker = isHighlighted ? ' >>' : '   '; 
            const idStr = String(e.id ?? -1);
            
            const id = fmt(idStr, 8);
            const rawDate = (e.date || e.eventDate || '');
            const dateStr = rawDate ? `${rawDate} (${getDayName(rawDate)})` : '';
            const date = fmt(dateStr, 18);
            
            // Handle staffIds
            let staffStr = '';
            if (e.eventParticipants) {
                staffStr = e.eventParticipants.map((p: any) => p.staffId).join(',');
            } else if (e.staffIds) {
                staffStr = e.staffIds.join(',');
            }
            const staff = fmt(staffStr, 10);

            const rowContent = `│ ${id} │ ${date} │ ${staff} │${marker}`;
            if (isHighlighted) {
                process.stdout.write(`  \x1b[32m${rowContent}\x1b[0m\n`); 
            } else {
                process.stdout.write(`  ${rowContent}\n`);
            }
          });
          process.stdout.write(`  └──────────┴────────────────────┴──────────┘\n`);
          process.stdout.write('\n');
      });
  }

  static assertion(msg: string) {
    process.stdout.write(`\x1b[32m✅ ${msg} \x1b[0m\n`);
  }
}

// --- Mocks ---
const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawMany: jest.fn(),
  getMany: jest.fn(),
};

const mockEventRepository = {
  find: jest.fn(),
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => Promise.resolve({ ...entity, id: Math.floor(Math.random() * 1000) + 1000 })),
  update: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

const mockHolidayRepository = {
  find: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn(async (cb) => {
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity === ScheduleEventEntity) return mockEventRepository;
        return null;
      }),
    };
    return cb(manager);
  }),
};

const setupMockData = (events: any[], holidays: any[] = []) => {
  mockEventRepository.find.mockResolvedValue(events);
  
  const uniqueCycles = [...new Set(events.map(e => e.cycleId))].map(id => ({ cycleId: id }));
  mockQueryBuilder.getRawMany.mockResolvedValue(uniqueCycles);
  mockQueryBuilder.getMany.mockResolvedValue(events);
  
  mockHolidayRepository.find.mockResolvedValue(holidays.map(d => ({ date: d })));
};

describe('CleaningScheduleService', () => {
  let service: CleaningScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleaningScheduleService,
        {
          provide: getRepositoryToken(ScheduleEventEntity),
          useValue: mockEventRepository,
        },
        {
          provide: getRepositoryToken(HolidayEntity),
          useValue: mockHolidayRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CleaningScheduleService>(CleaningScheduleService);
    jest.clearAllMocks();
  });

  describe('handleHolidayAdded', () => {

    it('Case 1: Holiday hits cleaning event -> Shift remaining events', async () => {
      const type = ScheduleType.CLEANING;
      TestLogger.caseStart('Case 1: Holiday hits Cleaning');
      
      // Cycle: [Mon, Tue, Wed]
      // Jan 08 (Mon), Jan 09 (Tue), Jan 10 (Wed).
      // Holiday: Jan 09 (Tue).
      // Expect: 
      // Jan 08 -> Stay.
      // Jan 09 -> Jan 10.
      // Jan 10 -> Jan 11 (Thu).
      
      const events = [
        { cycleId: 10, id: 501, eventDate: '2024-01-08', type, eventParticipants: [{ staffId: 1 }, { staffId: 2 }] },
        { cycleId: 10, id: 502, eventDate: '2024-01-09', type, eventParticipants: [{ staffId: 3 }, { staffId: 4 }] },
        { cycleId: 10, id: 503, eventDate: '2024-01-10', type, eventParticipants: [{ staffId: 5 }, { staffId: 6 }] },
      ] as any[];
      
      setupMockData(events);
      TestLogger.table('[BEFORE]', events, [502]);
      
      const holidayDate = '2024-01-09';
      await service.handleHolidayAdded(holidayDate);
      
      // Need to capture DB updates to verify
      // service doesn't return state like my manually written opentalk services.
      // So I check mockEventRepository.update calls.
      
      const updateCalls = mockEventRepository.update.mock.calls;
      // Map updates to ID -> Date
      const updates = new Map(updateCalls.map((call: any[]) => [call[0], call[1].eventDate]));
      
      // Visualize
      const finalEvents = events.map(e => ({
          ...e,
          date: updates.has(e.id) ? updates.get(e.id) : e.eventDate
      }));
      TestLogger.table('[AFTER (Simulation based on calls)]', finalEvents, [502, 503]);
      
      expect(updates.get(501)).toBeUndefined(); // Jan 08 unchanged
      expect(updates.get(502)).toBe('2024-01-10'); // Jan 09 -> Jan 10
      expect(updates.get(503)).toBe('2024-01-11'); // Jan 10 -> Jan 11
      
      TestLogger.assertion('Verified: Events pushed by 1 day due to holiday.');
    });

    it('Case 2: Holiday on Weekend -> No Effect (Cleaning is Mon-Fri)', async () => {
      const type = ScheduleType.CLEANING;
      TestLogger.caseStart('Case 2: Holiday on Weekend');
      
      // Cycle: [Fri, Mon]
      // Jan 12 (Fri), Jan 15 (Mon).
      // Holiday: Jan 13 (Sat).
      // Expect: No change. Algo skips Sat/Sun anyway.
      
      const events = [
        { cycleId: 10, id: 601, eventDate: '2024-01-12', type, eventParticipants: [{ staffId: 1 }, { staffId: 2 }] },
        { cycleId: 10, id: 602, eventDate: '2024-01-15', type, eventParticipants: [{ staffId: 3 }, { staffId: 4 }] },
      ] as any[];
      
      setupMockData(events);
      TestLogger.table('[BEFORE]', events);
      
      const holidayDate = '2024-01-13'; // Saturday
      await service.handleHolidayAdded(holidayDate);
      
      const updateCalls = mockEventRepository.update.mock.calls;
      expect(updateCalls.length).toBe(0);
      
      TestLogger.assertion('Verified: Weekend holiday ignored.');
    });
    
     it('Case 3: Holiday on Gap (non-event day) -> No shift if no event hit?', async () => {
      const type = ScheduleType.CLEANING;
      TestLogger.caseStart('Case 3: Holiday on Gap');
      
      // Cycle: [Mon, Wed]. (Gap Tue).
      // Jan 08, Jan 10.
      // Holiday: Jan 09 (Tue).
      // Algorithm behavior: It redistributes remaining events starting from first event date.
      // Events to shift: [Jan 08 (Staff1), Jan 10 (Staff2)].
      // Start Date: Jan 08.
      // Slot 1: Jan 08 -> Valid. Staff1 assigned.
      // Slot 2: Next valid after Jan 08 -> Jan 09 (Holiday!) -> Jan 10.
      // Staff2 assigned to Jan 10.
      // Result: Jan 08, Jan 10.
      // Matches original!
      // So no update.
      
      const events = [
        { cycleId: 10, id: 701, eventDate: '2024-01-08', type, eventParticipants: [{ staffId: 1 }, { staffId: 2 }] },
        { cycleId: 10, id: 702, eventDate: '2024-01-10', type, eventParticipants: [{ staffId: 3 }, { staffId: 4 }] },
      ] as any[];
      
      setupMockData(events);
      
      const holidayDate = '2024-01-09';
      await service.handleHolidayAdded(holidayDate);
      
      const updateCalls = mockEventRepository.update.mock.calls;
      expect(updateCalls.length).toBe(0);
      
      TestLogger.assertion('Verified: Holiday in gap did not cause shift (because gap was preserved/recalculated).');
    });

  });
});
