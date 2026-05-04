import { parseScheduleText } from "@smartschedule/shared";

// Reference "now": 2026-05-02 (Saturday) 10:00:00 local time
const NOW = new Date(2026, 4, 2, 10, 0, 0, 0);

function expectStart(iso: string, y: number, mo: number, d: number, h: number, mi: number) {
  const dt = new Date(iso);
  expect(dt.getFullYear()).toBe(y);
  expect(dt.getMonth()).toBe(mo);
  expect(dt.getDate()).toBe(d);
  expect(dt.getHours()).toBe(h);
  expect(dt.getMinutes()).toBe(mi);
}

describe("parseScheduleText (Vietnamese)", () => {
  describe("relative day + time", () => {
    it("parses 'mai 9h họp scrum'", () => {
      const r = parseScheduleText("mai 9h họp scrum", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 9, 0);
      expect(r.title).toBe("họp scrum");
    });

    it("parses 'ngày mai 14:30 đi gym'", () => {
      const r = parseScheduleText("ngày mai 14:30 đi gym", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 14, 30);
      expect(r.title).toBe("đi gym");
    });

    it("parses 'mốt 8h Review sprint'", () => {
      const r = parseScheduleText("mốt 8h Review sprint", { now: NOW });
      expectStart(r.start_time, 2026, 4, 4, 8, 0);
      expect(r.title).toBe("Review sprint");
    });

    it("parses 'hôm nay 11h ăn trưa'", () => {
      const r = parseScheduleText("hôm nay 11h ăn trưa", { now: NOW });
      expectStart(r.start_time, 2026, 4, 2, 11, 0);
      expect(r.title).toBe("ăn trưa");
    });

    it("parses 'nay 11h test'", () => {
      const r = parseScheduleText("nay 11h test", { now: NOW });
      expectStart(r.start_time, 2026, 4, 2, 11, 0);
      expect(r.title).toBe("test");
    });
  });

  describe("period qualifiers", () => {
    it("converts '2h chiều' to 14h", () => {
      const r = parseScheduleText("mai 2h chiều họp", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 14, 0);
      expect(r.title).toBe("họp");
    });

    it("converts '8h tối' to 20h", () => {
      const r = parseScheduleText("mai 8h tối ăn cơm", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 20, 0);
      expect(r.title).toBe("ăn cơm");
    });

    it("leaves '9h sáng' as 9h", () => {
      const r = parseScheduleText("mai 9h sáng họp", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 9, 0);
      expect(r.title).toBe("họp");
    });

    it("uses period default when no hour given", () => {
      const r = parseScheduleText("mai chiều đi cafe", { now: NOW });
      // chiều default = 14
      expectStart(r.start_time, 2026, 4, 3, 14, 0);
      expect(r.title).toBe("đi cafe");
      expect(r.inferred.some((x) => x.includes("chiều"))).toBe(true);
    });

    it("uses tối default when no hour given", () => {
      const r = parseScheduleText("tối nay học bài", { now: NOW });
      // tối default = 19, today
      expectStart(r.start_time, 2026, 4, 2, 19, 0);
      expect(r.title).toBe("học bài");
    });

    it("handles diacritic-stripped 'sang' as morning", () => {
      const r = parseScheduleText("mai 7h sang chay bo", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 7, 0);
      expect(r.title).toBe("chay bo");
    });
  });

  describe("absolute date dd/mm", () => {
    it("parses '15/5 9h sinh nhật'", () => {
      const r = parseScheduleText("15/5 9h sinh nhật", { now: NOW });
      expectStart(r.start_time, 2026, 4, 15, 9, 0);
      expect(r.title).toBe("sinh nhật");
    });

    it("parses '15/05/2027 9h họp'", () => {
      const r = parseScheduleText("15/05/2027 9h họp", { now: NOW });
      expectStart(r.start_time, 2027, 4, 15, 9, 0);
      expect(r.title).toBe("họp");
    });

    it("parses '15-5 9h họp'", () => {
      const r = parseScheduleText("15-5 9h họp", { now: NOW });
      expectStart(r.start_time, 2026, 4, 15, 9, 0);
      expect(r.title).toBe("họp");
    });
  });

  describe("time formats", () => {
    it("parses '9h30'", () => {
      const r = parseScheduleText("mai 9h30 họp", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 9, 30);
    });

    it("parses '9:30'", () => {
      const r = parseScheduleText("mai 9:30 họp", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 9, 30);
    });

    it("parses '9 giờ'", () => {
      const r = parseScheduleText("mai 9 giờ họp", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 9, 0);
    });

    it("parses '9 giờ 30'", () => {
      const r = parseScheduleText("mai 9 giờ 30 họp", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 9, 30);
    });
  });

  describe("fallback / inference", () => {
    it("bumps to tomorrow when time is in past today", () => {
      // NOW = 10:00; ask for 9h (no date) → tomorrow 09:00
      const r = parseScheduleText("9h họp", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 9, 0);
      expect(r.inferred.some((x) => x.includes("Đã qua giờ"))).toBe(true);
    });

    it("keeps today when time is later today", () => {
      // NOW = 10:00; ask for 14h (no date) → today 14:00
      const r = parseScheduleText("14h họp", { now: NOW });
      expectStart(r.start_time, 2026, 4, 2, 14, 0);
    });

    it("uses default 9h when no time given", () => {
      const r = parseScheduleText("mai họp scrum", { now: NOW });
      expectStart(r.start_time, 2026, 4, 3, 9, 0);
      expect(r.inferred.some((x) => x.includes("Mặc định"))).toBe(true);
    });

    it("uses default title when only time given", () => {
      const r = parseScheduleText("mai 9h", { now: NOW });
      expect(r.title).toBe("Lịch mới");
      expectStart(r.start_time, 2026, 4, 3, 9, 0);
    });

    it("returns end_time = start + duration", () => {
      const r = parseScheduleText("mai 9h họp", {
        now: NOW,
        durationMinutes: 30,
      });
      const start = new Date(r.start_time);
      const end = new Date(r.end_time);
      expect(end.getTime() - start.getTime()).toBe(30 * 60 * 1000);
    });

    it("handles empty input", () => {
      const r = parseScheduleText("", { now: NOW });
      expect(r.title).toBe("Lịch mới");
      // 9h tomorrow (10am bumped past 9am default)
      expectStart(r.start_time, 2026, 4, 3, 9, 0);
    });
  });

  describe("complex / multi-token title", () => {
    it("preserves original title casing", () => {
      const r = parseScheduleText("mai 9h Họp Scrum Hằng Tuần", { now: NOW });
      expect(r.title).toBe("Họp Scrum Hằng Tuần");
    });

    it("preserves diacritics in title", () => {
      const r = parseScheduleText("mai 14h chiều cà phê với bố mẹ", {
        now: NOW,
      });
      expectStart(r.start_time, 2026, 4, 3, 14, 0);
      expect(r.title).toBe("cà phê với bố mẹ");
    });
  });
});
