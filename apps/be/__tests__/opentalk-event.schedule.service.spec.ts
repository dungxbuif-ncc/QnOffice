
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import HolidayEntity from '../src/modules/holiday/holiday.entity';
import ScheduleEventEntity from '../src/modules/schedule/enties/schedule-event.entity';
import { OpentalkEventScheduleService } from '../src/modules/schedule/services/opentalk-event.schedule.service';

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

      // Group events by CycleID
      const eventsByCycle: { [key: string]: any[] } = {};
      events.forEach(e => {
          const cId = String(e.cycleId ?? '?');
          if (!eventsByCycle[cId]) eventsByCycle[cId] = [];
          eventsByCycle[cId].push(e);
      });

      Object.keys(eventsByCycle).forEach(cycleId => {
          process.stdout.write(`  [Cycle ID: ${cycleId}]\n`);
          process.stdout.write(`  ┌──────────┬────────────────────┬──────────┐\n`);
          process.stdout.write(`  │ ${fmt('EventID', 8)} │ ${fmt('Date', 18)} │ ${fmt('CycleID', 8)} │\n`);
          process.stdout.write(`  ├──────────┼────────────────────┼──────────┤\n`);
          
          eventsByCycle[cycleId].forEach(e => {
            const isHighlighted = highlightIds.includes(e.id);
            const marker = isHighlighted ? ' >>' : '   '; 
            const idStr = String(e.id ?? -1);
            
            const id = fmt(idStr, 8);
            const rawDate = (e.date || e.eventDate || '');
            const dateStr = rawDate ? `${rawDate} (${getDayName(rawDate)})` : '';
            const date = fmt(dateStr, 18);
            const cId = fmt(String(e.cycleId ?? '?'), 8);

            const rowContent = `│ ${id} │ ${date} │ ${cId} │${marker}`;
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
  
  mockHolidayRepository.find.mockResolvedValue(holidays);
};

describe('OpentalkEventScheduleService', () => {
  let service: OpentalkEventScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpentalkEventScheduleService,
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

    service = module.get<OpentalkEventScheduleService>(OpentalkEventScheduleService);
    jest.clearAllMocks();
  });

  describe('handleEventUpdate', () => {
    
    it('Case 1: Move to Empty Slot (No Collision) -> Only Target Moves', async () => {

      TestLogger.caseStart('Case 1: No Collision');
      
      // Cycle: Jan 6, Jan 20. (Gap on Jan 13).
      // Move Jan 6 -> Jan 13.
      // Result: Jan 13, Jan 20. (No collision).
      
      const events = [
        { cycleId: 1, id: 101, eventDate: '2024-01-06' },
        { cycleId: 1, id: 102, eventDate: '2024-01-20' },
      ] as any[];
      
      setupMockData(events);
      TestLogger.table('[BEFORE]', events, [101]);
      
      const result = await service.handleEventUpdate(101, '2024-01-13');
      const allEvents = result.after.flatMap(c => c.events.map(e => ({...e, cycleId: c.id})));
      TestLogger.table('[AFTER]', allEvents, [101]);
      
      expect(allEvents.find(e => e.id === 101)?.date).toBe('2024-01-13');
      expect(allEvents.find(e => e.id === 102)?.date).toBe('2024-01-20'); // Stayed
      
      TestLogger.assertion('Verified: Target moved into gap. No other changes.');
    });

    it('Case 2: Move to Occupied Slot (Collision) -> Shift Right', async () => {

      TestLogger.caseStart('Case 2: Collision -> Shift Right');
      
      // Cycle: Jan 06, Jan 13, Jan 20.
      // Move Jan 06 -> Jan 13.
      // Target (101) becomes Jan 13.
      // Existing (102) was Jan 13. Collision!
      // 102 Shifts -> Jan 20.
      // Existing (103) was Jan 20. Collision!
      // 103 Shifts -> Jan 27.
      
      const events = [
        { cycleId: 1, id: 201, eventDate: '2024-01-06' },
        { cycleId: 1, id: 202, eventDate: '2024-01-13' },
        { cycleId: 1, id: 203, eventDate: '2024-01-20' },
      ] as any[];
      
      setupMockData(events);
      TestLogger.table('[BEFORE]', events, [201]);
      
      const result = await service.handleEventUpdate(201, '2024-01-13');
      const allEvents = result.after.flatMap(c => c.events.map(e => ({...e, cycleId: c.id})));
      TestLogger.table('[AFTER]', allEvents, [201]);
      
      expect(allEvents.find(e => e.id === 201)?.date).toBe('2024-01-13');
      expect(allEvents.find(e => e.id === 202)?.date).toBe('2024-01-20');
      expect(allEvents.find(e => e.id === 203)?.date).toBe('2024-01-27');
      
      TestLogger.assertion('Verified: Collision caused ripple effect.');
    });

    it('Case 3: JUMP forward causing collision downstream', async () => {

        TestLogger.caseStart('Case 3: Jump Forward');
        
        // Cycle: Jan 06, Jan 13, Jan 20, Jan 27.
        // Move Jan 06 -> Jan 20.
        // Jan 13: Unaffected.
        // Jan 20 (Target): Has collision with Existing 203(Jan 20).
        // 203 -> Jan 27.
        // 204 (Jan 27) -> Feb 03.
        
        const events = [
          { cycleId: 1, id: 301, eventDate: '2024-01-06' },
          { cycleId: 1, id: 302, eventDate: '2024-01-13' },
          { cycleId: 1, id: 303, eventDate: '2024-01-20' },
          { cycleId: 1, id: 304, eventDate: '2024-01-27' },
        ] as any[];
        
        setupMockData(events);
        TestLogger.table('[BEFORE]', events, [301]);
        
        const result = await service.handleEventUpdate(301, '2024-01-20');
        const allEvents = result.after.flatMap(c => c.events.map(e => ({...e, cycleId: c.id})));
        TestLogger.table('[AFTER]', allEvents, [301]);
        
        expect(allEvents.find(e => e.id === 302)?.date).toBe('2024-01-13'); // Stayed
        expect(allEvents.find(e => e.id === 301)?.date).toBe('2024-01-20'); // Moved Target
        expect(allEvents.find(e => e.id === 303)?.date).toBe('2024-01-27'); // Pushed
        
        TestLogger.assertion('Verified: Jump forward pushed only downstream events.');
    });
    
    it('Case 4: Move Backward causing Swap/Shuffle', async () => {

        TestLogger.caseStart('Case 4: Jump Backward (Swap)');
        
        // Cycle: Jan 06, Jan 13.
        // Move Jan 13 -> Jan 06.
        // Target (402) -> Jan 06.
        // Existing (401) was Jan 06. Collision.
        // 401 -> Jan 13.
        // Result: 402(Jan 06), 401(Jan 13).
        // Effectively a swap.
        
        const events = [
            { cycleId: 1, id: 401, eventDate: '2024-01-06' },
            { cycleId: 1, id: 402, eventDate: '2024-01-13' },
        ] as any[];
        
        setupMockData(events);
         TestLogger.table('[BEFORE]', events, [402]); // Highlight the one moving
         
         const result = await service.handleEventUpdate(402, '2024-01-06');
         const allEvents = result.after.flatMap(c => c.events.map(e => ({...e, cycleId: c.id})));
         TestLogger.table('[AFTER]', allEvents, [402]);
         
         expect(allEvents.find(e => e.id === 402)?.date).toBe('2024-01-06');
         expect(allEvents.find(e => e.id === 401)?.date).toBe('2024-01-13');
         
         TestLogger.assertion('Verified: Backward move caused existing to shift right (swap).');
    });

  });
});
