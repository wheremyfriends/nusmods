import { it } from "@jest/globals";
import { timetable as user1 } from "../timetables/user1";
import { timetable as user2 } from "../timetables/user2";
import { timetable as user3 } from "../timetables/user3";
import { getOptimisedTimetable } from "../src/index";
import { Solver, TimeSlot } from "../src/solver";
import { init2DArr, preprocess } from "../src/utils";

describe("Timetable Generation", () => {
  let ans: TimeSlot[][];
  const NUMSOLS = 1;
  const INDEX = 0;
  const TIMETABLES = [user1, user2, user3];

  beforeEach(() => {
    ans = getOptimisedTimetable(TIMETABLES, INDEX, NUMSOLS);
  });

  it("test all lessons are assigned", () => {
    const classes = Solver.groupIntoClases(TIMETABLES[INDEX]);
    const numClassPerLesson = Solver.getNumClassPerLesson(classes);

    ans.forEach((timetable) => {
      const freq: { [cls: string]: Set<string> } = {};

      timetable.forEach((cls: any) => {
        const key = Solver.getLessonKey(cls);

        if (key in freq) {
          freq[key].add(cls.classNo);
        } else {
          freq[key] = new Set([cls.classNo]);
        }

        // Checks that each lesson only has one class
        expect(Array.from(freq[key])).toHaveLength(1);
      });

      const correctKeys = Object.keys(numClassPerLesson);
      correctKeys.sort();
      const solvedKeys = Object.keys(freq);
      solvedKeys.sort();

      expect(correctKeys).toEqual(solvedKeys);
    });
  });

  it("test timeslots have no overlap", () => {
    ans.forEach((timetable) => {
      const bitmap = init2DArr<number>(7, 24, 0);

      const processedTimetable = preprocess(timetable);
      processedTimetable.forEach((timeslot: any) => {
        expect(Solver.checkAvail(bitmap, [timeslot])).toBeTruthy();
        Solver.setTimetableVal(bitmap, timeslot, 1);
      });
    });
  });

  it("test timetable format", () => {
    ans.forEach((timetable) => {
      timetable.forEach((timeslot: any) => {
        expect(typeof timeslot["startTime"]).toBe("string");
        expect(timeslot["startTime"]).toHaveLength(4);

        expect(typeof timeslot["endTime"]).toBe("string");
        expect(timeslot["endTime"]).toHaveLength(4);

        expect(typeof timeslot["day"]).toBe("string");
        expect(timeslot["day"]).toBeDefined();
      });
    });
  });

  it("test number of solutions", () => {
    expect(ans).toHaveLength(NUMSOLS);
  });
});
