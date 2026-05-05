import { UndoStore, UNDO_MAX_PER_USER, UNDO_TTL_MS } from './undo.store';
import { Schedule, ScheduleStatus } from './entities/schedule.entity';

function makeSchedule(id: number, title = 'demo'): Schedule {
  const s = new Schedule();
  Object.assign(s, {
    id,
    user_id: 'user-1',
    item_type: 'task',
    title,
    description: null,
    start_time: new Date('2026-05-15T09:00:00Z'),
    end_time: null,
    status: 'pending' as ScheduleStatus,
    priority: 'normal',
    remind_at: null,
    is_reminded: false,
    acknowledged_at: null,
    end_notified_at: null,
    recurrence_type: 'none',
    recurrence_interval: 1,
    recurrence_until: null,
    recurrence_parent_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return s;
}

describe('UndoStore', () => {
  let store: UndoStore;

  beforeEach(() => {
    store = new UndoStore();
  });

  it('returns null when empty', () => {
    expect(store.peek('u1')).toBeNull();
    expect(store.pop('u1')).toBeNull();
  });

  it('peek does not mutate the stack', () => {
    store.push('u1', { action: 'delete', snapshot: makeSchedule(1) });
    expect(store.peek('u1')).not.toBeNull();
    expect(store.peek('u1')).not.toBeNull();
    expect(store.pop('u1')).not.toBeNull();
    expect(store.peek('u1')).toBeNull();
  });

  it('pop returns most recent entry (LIFO)', () => {
    store.push('u1', { action: 'delete', snapshot: makeSchedule(1, 'first') });
    store.push('u1', { action: 'complete', snapshot: makeSchedule(2, 'second') });
    const e1 = store.pop('u1');
    expect(e1?.snapshot.title).toBe('second');
    const e2 = store.pop('u1');
    expect(e2?.snapshot.title).toBe('first');
    expect(store.pop('u1')).toBeNull();
  });

  it('separates entries by user', () => {
    store.push('u1', { action: 'delete', snapshot: makeSchedule(1, 'a') });
    store.push('u2', { action: 'delete', snapshot: makeSchedule(2, 'b') });
    expect(store.peek('u1')?.snapshot.title).toBe('a');
    expect(store.peek('u2')?.snapshot.title).toBe('b');
  });

  it('drops entry older than TTL on peek/pop', () => {
    const now = Date.now();
    store.push('u1', { action: 'delete', snapshot: makeSchedule(1) });
    expect(store.peek('u1', now + UNDO_TTL_MS - 1)).not.toBeNull();
    expect(store.peek('u1', now + UNDO_TTL_MS + 1)).toBeNull();
    expect(store.pop('u1', now + UNDO_TTL_MS + 1)).toBeNull();
  });

  it('cleanup removes expired entries across users', () => {
    const now = Date.now();
    jest.spyOn(Date, 'now').mockReturnValueOnce(now - UNDO_TTL_MS - 1000);
    store.push('u1', { action: 'delete', snapshot: makeSchedule(1) });
    jest.spyOn(Date, 'now').mockReturnValueOnce(now);
    store.push('u1', { action: 'delete', snapshot: makeSchedule(2) });
    jest.spyOn(Date, 'now').mockReturnValueOnce(now - UNDO_TTL_MS - 1000);
    store.push('u2', { action: 'delete', snapshot: makeSchedule(3) });

    const dropped = store.cleanup(now);
    expect(dropped).toBe(2);
    expect(store.peek('u1')?.snapshot.id).toBe(2);
    expect(store.peek('u2')).toBeNull();
  });

  it('caps stack at UNDO_MAX_PER_USER', () => {
    for (let i = 0; i < UNDO_MAX_PER_USER + 5; i++) {
      store.push('u1', { action: 'delete', snapshot: makeSchedule(i, `t${i}`) });
    }
    let n = 0;
    while (store.pop('u1')) n++;
    expect(n).toBe(UNDO_MAX_PER_USER);
  });

  it('cloneSchedule produces a deep-ish copy of date fields', () => {
    const s = makeSchedule(1);
    s.remind_at = new Date('2026-05-15T08:00:00Z');
    const clone = UndoStore.cloneSchedule(s);
    expect(clone).not.toBe(s);
    expect(clone.start_time).not.toBe(s.start_time);
    expect(clone.start_time.getTime()).toBe(s.start_time.getTime());
    expect(clone.remind_at?.getTime()).toBe(s.remind_at!.getTime());
  });
});
