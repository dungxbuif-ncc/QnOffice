
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import HolidayEntity from '../src/modules/holiday/holiday.entity';
import ScheduleEventEntity from '../src/modules/schedule/enties/schedule-event.entity';
import { OpentalkHolidayScheduleService } from '../src/modules/schedule/services/opentalk-holiday.schedule.service';

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

describe('OpentalkHolidayScheduleService', () => {
  let service: OpentalkHolidayScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpentalkHolidayScheduleService,
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

    service = module.get<OpentalkHolidayScheduleService>(OpentalkHolidayScheduleService);
    jest.clearAllMocks();
  });

  describe('handleHolidayAdded', () => {
    it('Case 1: Holiday added ON Event Date -> Event and subsequent events shift', async () => {
      const currentDate = '2024-01-01';
      TestLogger.caseStart('Case 1: Holiday ON Event');
      jest.useFakeTimers().setSystemTime(new Date(currentDate + 'T12:00:00Z'));

      // Cycle 1: [Jan 06, Jan 13, Jan 20]
      // ADD Holiday: Jan 13.
      // Expect: Jan 13 -> Jan 20. Jan 20 -> Jan 27.
      
      const events = [
        { cycleId: 1, id: 101, eventDate: '2024-01-06' },
        { cycleId: 1, id: 102, eventDate: '2024-01-13' }, // Target
        { cycleId: 1, id: 103, eventDate: '2024-01-20' },
      ] as any[];
      
      setupMockData(events);
      TestLogger.table('[BEFORE]', events, [102], currentDate);
      
      const holidayDate = '2024-01-13';
      const result = await service.handleHolidayAdded(holidayDate);
      
      const allEvents = result.after.flatMap(c => c.events.map(e => ({...e, cycleId: c.id})));
      TestLogger.table('[AFTER]', allEvents, [], currentDate);
      
      expect(allEvents.find(e => e.id === 101)?.date).toBe('2024-01-06'); // Unchanged
      expect(allEvents.find(e => e.id === 102)?.date).toBe('2024-01-20'); // Shifted
      expect(allEvents.find(e => e.id === 103)?.date).toBe('2024-01-27'); // Rippled
      
      TestLogger.assertion('Verified: Event on holiday shifted, subsequent event rippled properly.');
    });

    it('Case 2: Holiday added on non-event day -> No Change', async () => {

      TestLogger.caseStart('Case 2: Holiday on Non-Event Day');
      
      // Cycle: [Jan 06 (Sat), Jan 13 (Sat)]
      // Holiday: Jan 10 (Wed).
      
       const events = [
        { cycleId: 1, id: 201, eventDate: '2024-01-06' },
        { cycleId: 1, id: 202, eventDate: '2024-01-13' }, 
      ] as any[];
      
      setupMockData(events);
      const holidayDate = '2024-01-10';
      const result = await service.handleHolidayAdded(holidayDate);
      
      const allEvents = result.after.flatMap(c => c.events.map(e => ({...e, cycleId: c.id})));
      
      expect(allEvents.find(e => e.id === 201)?.date).toBe('2024-01-06');
      expect(allEvents.find(e => e.id === 202)?.date).toBe('2024-01-13');
      
      TestLogger.assertion('Verified: No events shifted.');
    });

    it('Case 3: Multi Cycle - Shift ripples to next cycle', async () => {

      TestLogger.caseStart('Case 3: Multi Cycle Ripple');
      
      // C1: [Jan 06, Jan 13]
      // C2: Starts Jan 20 (Immediately follows C1).
      // Holiday: Jan 13.
      // C1: Jan 13 -> Jan 20.
      // C1 new End: Jan 20.
      // C2 Start (Jan 20) overlaps/too close?
      // C2 Start must be >= C1 End + 7 days?
      // Wait, Opentalk logic: C2 events are just events.
      // If C1 Last Event moves to Jan 20.
      // C2 First Event (originally Jan 20) MUST move to Jan 27.
      
      const events = [
        // C1
        { cycleId: 1, id: 301, eventDate: '2024-01-06' },
        { cycleId: 1, id: 302, eventDate: '2024-01-13' }, // Moves to Jan 20
        // C2
        { cycleId: 2, id: 303, eventDate: '2024-01-20' }, // Moves to Jan 27
        { cycleId: 2, id: 304, eventDate: '2024-01-27' }, // Moves to Feb 03
      ] as any[];
      
      setupMockData(events);
      TestLogger.table('[BEFORE]', events, [302, 303], currentDate);
      
      const holidayDate = '2024-01-13';
      const result = await service.handleHolidayAdded(holidayDate);
      
      const allEvents = result.after.flatMap(c => c.events.map(e => ({...e, cycleId: c.id})));
      TestLogger.table('[AFTER]', allEvents, [], currentDate);
      
      expect(allEvents.find(e => e.id === 302)?.date).toBe('2024-01-20');
      expect(allEvents.find(e => e.id === 303)?.date).toBe('2024-01-27');
      expect(allEvents.find(e => e.id === 304)?.date).toBe('2024-02-03');
      
      TestLogger.assertion('Verified: Muli-cycle ripple. C1 push caused C2 push.');
    });
    
     it('Case 4: Multi Cycle - Gap preserved', async () => {

      TestLogger.caseStart('Case 4: Multi Cycle - Gap preserved');
      
      // C1: [Jan 06]
      // C2: Starts Jan 27 (Gap of 2 weeks: Jan 13, Jan 20 empty).
      // Holiday: Jan 06.
      // C1(Jan 06) -> Moves to Jan 13. (Next sat).
      // C1 Ends Jan 13.
      // C2 Starts Jan 27.
      // Rules: Next Sat after Jan 13 is Jan 20.
      // C2(Jan 27) > Jan 20. So C2 does NOT shift?
      // Yes, gap is maintained/shrunk but check overlap logic.
      // Logic: if C2 Start < NextSat(C1 End), shift.
      // Jan 27 >= Jan 20. No shift needed.
      
      const events = [
        { cycleId: 1, id: 401, eventDate: '2024-01-06' },
        { cycleId: 2, id: 402, eventDate: '2024-01-27' },
      ] as any[];
      
      setupMockData(events);
      TestLogger.table('[BEFORE]', events, [401], currentDate);
      
      const holidayDate = '2024-01-06';
      const result = await service.handleHolidayAdded(holidayDate);
      const allEvents = result.after.flatMap(c => c.events.map(e => ({...e, cycleId: c.id})));
      TestLogger.table('[AFTER]', allEvents, [], currentDate);
      
      expect(allEvents.find(e => e.id === 401)?.date).toBe('2024-01-13');
      expect(allEvents.find(e => e.id === 402)?.date).toBe('2024-01-27'); // Unchanged
      
      TestLogger.assertion('Verified: C1 shifted. C2 stayed (gap was sufficient).'); 
    });
  });
});
