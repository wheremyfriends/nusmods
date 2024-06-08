var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

// src/utils.ts
function convertDaytoNumber(inp) {
  const days = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
  };
  return days[inp];
}
function convertNumbertoDay(inp) {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];
  return days[inp];
}
function init2DArr(row, col, initval) {
  let output = [];
  for (let i = 0; i < row; i++) {
    output.push(new Array(col).fill(initval));
  }
  return output;
}
function preprocess(timeslots) {
  return timeslots.map((ts) => {
    return __spreadProps(__spreadValues({}, ts), {
      startTime: parseInt(ts["startTime"]) / 100,
      endTime: parseInt(ts["endTime"]) / 100,
      day: convertDaytoNumber(ts["day"])
    });
  });
}
function postprocess(timeslots) {
  return timeslots.map((ts) => {
    return __spreadProps(__spreadValues({}, ts), {
      startTime: (ts["startTime"] * 100).toString().padStart(4, "0"),
      endTime: (ts["endTime"] * 100).toString().padStart(4, "0"),
      day: convertNumbertoDay(ts["day"])
    });
  });
}

// src/solver.ts
import { Roarr as log } from "roarr";
var HOURS_IN_DAY = 24;
var DAYS_IN_WEEK = 7;
var NO_SOL_ERR_MSG = "No Solution";
var Solver = class _Solver {
  constructor(input, index) {
    const allUsersClasses = [];
    input.forEach((lessons) => {
      allUsersClasses.push(_Solver.groupIntoClases(lessons));
    });
    const coursePriority = _Solver.calculatePriority(allUsersClasses);
    const allClasses = _Solver.assignPriority(
      allUsersClasses[index],
      coursePriority
    );
    this.numsols = 0;
    this.maxsols = -1;
    this.curClasses = [];
    this.result = [];
    this.isLessonAllocated = /* @__PURE__ */ new Map();
    this.isFree = init2DArr(DAYS_IN_WEEK, HOURS_IN_DAY, 0 /* FREE */);
    const { classes, numClassPerLesson } = this.preallocateMods(allClasses);
    this.numClassPerLesson = numClassPerLesson;
    this.allClasses = classes;
    this.allClasses.sort((a, b) => {
      return b.priority - a.priority;
    });
    log(Object(this.allClasses), "this.allClasses");
    log(this.numClassPerLesson, "this.numClassPerLesson");
  }
  static getLessonKey(cls) {
    return `${cls.moduleCode} ${cls.lessonType}`.toLowerCase();
  }
  static getClassKey(cls) {
    return `${this.getLessonKey(cls)} ${cls.classNo}`.toLowerCase();
  }
  static calculatePriority(allClasess) {
    const freq = {};
    allClasess.forEach((userClasses) => {
      userClasses.forEach((cls) => {
        const key = _Solver.getClassKey(cls);
        if (key in freq) freq[key] += 1;
        else freq[key] = 1;
      });
    });
    return freq;
  }
  static assignPriority(classes, priority) {
    classes = classes.map((c) => {
      const key = _Solver.getClassKey(c);
      if (!(key in priority)) return c;
      return __spreadProps(__spreadValues({}, c), { priority: priority[key] });
    });
    return classes;
  }
  static groupIntoClases(lessons) {
    const classToTimeSlot = {};
    lessons.forEach((l) => {
      const key = _Solver.getClassKey(l);
      if (key in classToTimeSlot) {
        classToTimeSlot[key].timeslots.push(l);
      } else {
        classToTimeSlot[key] = {
          moduleCode: l.moduleCode,
          lessonType: l.lessonType,
          classNo: l.classNo,
          priority: 0,
          timeslots: [l]
        };
      }
    });
    const classes = Object.values(classToTimeSlot);
    return classes;
  }
  static getNumClassPerLesson(classes) {
    const freq = {};
    classes.forEach((c) => {
      const key = _Solver.getLessonKey(c);
      if (key in freq) freq[key]++;
      else freq[key] = 1;
    });
    return freq;
  }
  preallocateMods(classes) {
    let numClassPerLesson = _Solver.getNumClassPerLesson(classes);
    classes.forEach((cls) => {
      const lessonKey = _Solver.getLessonKey(cls);
      const numclasses = numClassPerLesson[lessonKey];
      if (numclasses > 1) return;
      if (!_Solver.checkAvail(this.isFree, cls.timeslots))
        throw new Error(NO_SOL_ERR_MSG);
      this.setTimetable(cls);
      this.curClasses.push(cls);
    });
    classes = classes.filter((cls) => {
      const lessonKey = _Solver.getLessonKey(cls);
      const numclasses = numClassPerLesson[lessonKey];
      return numclasses > 1;
    });
    numClassPerLesson = Object.fromEntries(
      Object.entries(numClassPerLesson).filter(([_, value]) => {
        return value > 1;
      })
    );
    return {
      numClassPerLesson,
      classes
    };
  }
  resetTimetable(cls) {
    cls.timeslots.forEach((ts) => {
      _Solver.setTimetableVal(this.isFree, ts, 0 /* FREE */);
    });
  }
  setTimetable(cls) {
    cls.timeslots.forEach((ts) => {
      _Solver.setTimetableVal(this.isFree, ts, 1 /* ALLOCATED */);
    });
  }
  static setTimetableVal(bitmap, timeslot, val) {
    for (let i = timeslot.startTime; i < timeslot.endTime; i++) {
      bitmap[timeslot.day][i] = val;
    }
  }
  static checkAvail(bitmap, timeslots) {
    for (let ts of timeslots) {
      for (let i = ts.startTime; i < ts.endTime; i++) {
        if (bitmap[ts.day][i] == 1 /* ALLOCATED */) return false;
      }
    }
    return true;
  }
  solve(maxsols = -1) {
    this.maxsols = maxsols;
    this._solve(0, Object.keys(this.numClassPerLesson).length);
    log(Object(this.result), "this.result");
    if (this.result.length <= 0) throw new Error(NO_SOL_ERR_MSG);
    return this.result;
  }
  _solve(counter, numlessons) {
    if (this.maxsols > 0 && this.numsols >= this.maxsols) {
      return;
    }
    if (numlessons <= 0) {
      this.numsols++;
      log(Object(this.curClasses), "Solution");
      const solution = JSON.parse(JSON.stringify(this.curClasses));
      this.result.push(solution);
      return;
    }
    if (counter == this.allClasses.length) {
      return;
    }
    const curCls = this.allClasses[counter];
    const lessonKey = _Solver.getLessonKey(curCls);
    this.numClassPerLesson[lessonKey]--;
    const isAvail = _Solver.checkAvail(this.isFree, curCls.timeslots);
    const isAllocated = !!this.isLessonAllocated.get(lessonKey);
    if (isAvail && !isAllocated) {
      this.setTimetable(curCls);
      this.isLessonAllocated.set(lessonKey, true);
      this.curClasses.push(curCls);
      this._solve(counter + 1, numlessons - 1);
      this.resetTimetable(curCls);
      this.isLessonAllocated.set(lessonKey, false);
      this.curClasses.pop();
    }
    this._solve(counter + 1, numlessons);
    this.numClassPerLesson[lessonKey]++;
  }
};

// src/index.ts
function getOptimisedTimetable(timetables, index, maxsols = -1) {
  timetables = timetables.map((e) => {
    return preprocess(e);
  });
  const solver = new Solver(timetables, index);
  const solvedTimetable = solver.solve(maxsols);
  const ret = [];
  solvedTimetable.forEach((timetable) => {
    let retTimetable = [];
    timetable.forEach((cls) => {
      retTimetable = retTimetable.concat(postprocess(cls.timeslots));
    });
    ret.push(retTimetable);
  });
  return ret;
}
export {
  getOptimisedTimetable
};
//# sourceMappingURL=index.mjs.map