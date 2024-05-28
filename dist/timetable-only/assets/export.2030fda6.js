"use strict";
(self["webpackChunk"] = self["webpackChunk"] || []).push([["export"],{

/***/ "./data/academic-calendar.ts":
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _academic_calendar_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("./data/academic-calendar.json");


// Force TS to accept our typing instead of inferring from the JSON

const academicCalendar = _academic_calendar_json__WEBPACK_IMPORTED_MODULE_0__;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (academicCalendar);

/***/ }),

/***/ "./utils/ical.ts":
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   RECESS_WEEK: () => (/* binding */ RECESS_WEEK),
/* harmony export */   calculateNumericWeek: () => (/* binding */ calculateNumericWeek),
/* harmony export */   calculateWeekRange: () => (/* binding */ calculateWeekRange),
/* harmony export */   datesForAcademicWeeks: () => (/* binding */ datesForAcademicWeeks),
/* harmony export */   "default": () => (/* binding */ iCalForTimetable),
/* harmony export */   getTimeHour: () => (/* binding */ getTimeHour),
/* harmony export */   holidaysForYear: () => (/* binding */ holidaysForYear),
/* harmony export */   iCalEventForExam: () => (/* binding */ iCalEventForExam),
/* harmony export */   iCalEventForLesson: () => (/* binding */ iCalEventForLesson)
/* harmony export */ });
/* harmony import */ var lodash_each__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("../node_modules/lodash/each.js");
/* harmony import */ var lodash_each__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash_each__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var lodash_difference__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("../node_modules/lodash/difference.js");
/* harmony import */ var lodash_difference__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash_difference__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var core_js_modules_web_dom_collections_iterator_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("../node_modules/core-js/modules/web.dom-collections.iterator.js");
/* harmony import */ var core_js_modules_web_dom_collections_iterator_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_web_dom_collections_iterator_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var core_js_modules_es_array_includes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("../node_modules/core-js/modules/es.array.includes.js");
/* harmony import */ var core_js_modules_es_array_includes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_includes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var core_js_modules_es_string_includes_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("../node_modules/core-js/modules/es.string.includes.js");
/* harmony import */ var core_js_modules_es_string_includes_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_string_includes_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var core_js_modules_es_array_push_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("../node_modules/core-js/modules/es.array.push.js");
/* harmony import */ var core_js_modules_es_array_push_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_array_push_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var core_js_modules_es_symbol_description_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("../node_modules/core-js/modules/es.symbol.description.js");
/* harmony import */ var core_js_modules_es_symbol_description_js__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_symbol_description_js__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var core_js_modules_es_error_cause_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("../node_modules/core-js/modules/es.error.cause.js");
/* harmony import */ var core_js_modules_es_error_cause_js__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(core_js_modules_es_error_cause_js__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var date_fns__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__("../node_modules/date-fns/esm/addMinutes/index.js");
/* harmony import */ var date_fns__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__("../node_modules/date-fns/esm/isValid/index.js");
/* harmony import */ var date_fns__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__("../node_modules/date-fns/esm/addWeeks/index.js");
/* harmony import */ var date_fns__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__("../node_modules/date-fns/esm/addDays/index.js");
/* harmony import */ var types_modules__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("./types/modules.ts");
/* harmony import */ var config__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("./config/index.ts");
/* harmony import */ var data_academic_calendar__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__("./data/academic-calendar.ts");
/* harmony import */ var utils_modules__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__("./utils/modules.ts");
/* harmony import */ var _timify__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__("./utils/timify.ts");


function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }












const SG_UTC_TIME_DIFF_MS = 8 * 60 * 60 * 1000;
const RECESS_WEEK = -1;
const NUM_WEEKS_IN_A_SEM = 14; // including reading week
const ODD_WEEKS = [1, 3, 5, 7, 9, 11, 13];
const EVEN_WEEKS = [2, 4, 6, 8, 10, 12];
const ALL_WEEKS = [...ODD_WEEKS, ...EVEN_WEEKS];
const DEFAULT_EXAM_DURATION = 120; // If not provided, assume exams are 2 hours long

function dayIndex(weekday) {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].indexOf(weekday.toLowerCase());
}

/**
 * Parse out the hour component from a time string in the format of hhmm
 */
function getTimeHour(time) {
  return (0,_timify__WEBPACK_IMPORTED_MODULE_12__.getLessonTimeHours)(time) + (0,_timify__WEBPACK_IMPORTED_MODULE_12__.getLessonTimeMinutes)(time) / 60;
}
function addLessonOffset(date, hourOffset) {
  return (0,date_fns__WEBPACK_IMPORTED_MODULE_13__["default"])(date, hourOffset * 60);
}
function iCalEventForExam(module, semester) {
  const examDate = (0,utils_modules__WEBPACK_IMPORTED_MODULE_11__.getExamDate)(module, semester);
  if (!examDate) return null;
  const start = new Date(examDate);
  if (!(0,date_fns__WEBPACK_IMPORTED_MODULE_14__["default"])(start)) return null;
  return {
    start,
    end: (0,date_fns__WEBPACK_IMPORTED_MODULE_13__["default"])(start, (0,utils_modules__WEBPACK_IMPORTED_MODULE_11__.getExamDuration)(module, semester) || DEFAULT_EXAM_DURATION),
    summary: "".concat(module.moduleCode, " Exam"),
    description: module.title
  };
}
function holidaysForYear() {
  let hourOffset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  return config__WEBPACK_IMPORTED_MODULE_9__["default"].holidays.map(date => new Date(date.valueOf() - SG_UTC_TIME_DIFF_MS)) // Convert to local time
  .map(holiday => addLessonOffset(holiday, hourOffset));
}

// given academic weeks in semester and a start date in week 1,
// return dates corresponding to the respective weeks
function datesForAcademicWeeks(start, week) {
  // all weeks 7 and after are bumped by 7 days because of recess week
  if (week === RECESS_WEEK) {
    return (0,date_fns__WEBPACK_IMPORTED_MODULE_15__["default"])(start, 6);
  }
  return (0,date_fns__WEBPACK_IMPORTED_MODULE_15__["default"])(start, week <= 6 ? week - 1 : week);
}
function calculateStartEnd(date, startTime, endTime) {
  const start = addLessonOffset(date, getTimeHour(startTime));
  const end = addLessonOffset(date, getTimeHour(endTime));
  return {
    start,
    end
  };
}
function calculateNumericWeek(lesson, _semester, weeks, firstDayOfSchool) {
  const lessonDay = (0,date_fns__WEBPACK_IMPORTED_MODULE_16__["default"])(firstDayOfSchool, dayIndex(lesson.day));
  const {
    start,
    end
  } = calculateStartEnd(lessonDay, lesson.startTime, lesson.endTime);
  const excludedWeeks = lodash_difference__WEBPACK_IMPORTED_MODULE_1___default()([RECESS_WEEK, ...ALL_WEEKS], weeks);
  return {
    start,
    end,
    repeating: {
      freq: 'WEEKLY',
      count: NUM_WEEKS_IN_A_SEM,
      byDay: [lesson.day.slice(0, 2)],
      exclude: [...excludedWeeks.map(week => datesForAcademicWeeks(start, week)), ...holidaysForYear(getTimeHour(lesson.startTime))]
    }
  };
}
function calculateWeekRange(lesson, _semester, weekRange) {
  const rangeStart = (0,_timify__WEBPACK_IMPORTED_MODULE_12__.parseDate)(weekRange.start);
  const rangeEnd = (0,_timify__WEBPACK_IMPORTED_MODULE_12__.parseDate)(weekRange.end);
  const {
    start,
    end
  } = calculateStartEnd(rangeStart, lesson.startTime, lesson.endTime);
  const interval = weekRange.weekInterval || 1;
  const exclusions = [];
  if (weekRange.weeks) {
    for (let current = rangeStart, weekNumber = 1; current <= rangeEnd; current = (0,date_fns__WEBPACK_IMPORTED_MODULE_15__["default"])(current, interval), weekNumber += interval) {
      if (!weekRange.weeks.includes(weekNumber)) {
        const lessonTime = calculateStartEnd(current, lesson.startTime, lesson.endTime);
        exclusions.push(lessonTime.start);
      }
    }
  }
  const lastLesson = calculateStartEnd(rangeEnd, lesson.startTime, lesson.endTime);
  return {
    start,
    end,
    repeating: {
      interval,
      freq: 'WEEKLY',
      until: lastLesson.end,
      byDay: [lesson.day.slice(0, 2)],
      exclude: [...exclusions, ...holidaysForYear(getTimeHour(lesson.startTime))]
    }
  };
}

/**
 * Strategy is to generate a weekly event,
 * then calculate exclusion for special cases in calculateExclusion.
 */
function iCalEventForLesson(lesson, module, semester, firstDayOfSchool) {
  const event = (0,types_modules__WEBPACK_IMPORTED_MODULE_8__.consumeWeeks)(lesson.weeks, weeks => calculateNumericWeek(lesson, semester, weeks, firstDayOfSchool), weeks => calculateWeekRange(lesson, semester, weeks));
  return _objectSpread(_objectSpread({}, event), {}, {
    summary: "".concat(module.moduleCode, " ").concat(lesson.lessonType),
    description: "".concat(module.title, "\n").concat(lesson.lessonType, " Group ").concat(lesson.classNo),
    location: lesson.venue
  });
}
function iCalForTimetable(semester, timetable, moduleData, hiddenModules) {
  let academicYear = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : config__WEBPACK_IMPORTED_MODULE_9__["default"].academicYear;
  const [year, month, day] = data_academic_calendar__WEBPACK_IMPORTED_MODULE_10__["default"][academicYear][semester].start;
  // 'month - 1' because JS months are zero indexed
  const firstDayOfSchool = new Date(Date.UTC(year, month - 1, day) - SG_UTC_TIME_DIFF_MS);
  const events = [];
  lodash_each__WEBPACK_IMPORTED_MODULE_0___default()(timetable, (lessonConfig, moduleCode) => {
    if (hiddenModules.includes(moduleCode)) return;
    lodash_each__WEBPACK_IMPORTED_MODULE_0___default()(lessonConfig, lessons => {
      lessons.forEach(lesson => {
        events.push(iCalEventForLesson(lesson, moduleData[moduleCode], semester, firstDayOfSchool));
      });
    });
    const examEvent = iCalEventForExam(moduleData[moduleCode], semester);
    if (examEvent) events.push(examEvent);
  });
  return events;
}

/***/ }),

/***/ "./data/academic-calendar.json":
/***/ ((module) => {

module.exports = JSON.parse('{"2014/2015":{"1":{"start":[2014,8,11]},"2":{"start":[2015,1,12]}},"2015/2016":{"1":{"start":[2015,8,10]},"2":{"start":[2016,1,11]}},"2016/2017":{"1":{"start":[2016,8,8]},"2":{"start":[2017,1,9]}},"2017/2018":{"1":{"start":[2017,8,14]},"2":{"start":[2018,1,15]}},"2018/2019":{"1":{"start":[2018,8,13]},"2":{"start":[2019,1,14]}},"2019/2020":{"1":{"start":[2019,8,12]},"2":{"start":[2020,1,13]},"3":{"start":[2020,5,11]},"4":{"start":[2020,6,22]}},"2020/2021":{"1":{"start":[2020,8,10]},"2":{"start":[2021,1,11]},"3":{"start":[2021,5,10]},"4":{"start":[2021,6,21]}},"2021/2022":{"1":{"start":[2021,8,9]},"2":{"start":[2022,1,10]},"3":{"start":[2022,5,9]},"4":{"start":[2022,6,20]}},"2022/2023":{"1":{"start":[2022,8,8]},"2":{"start":[2023,1,9]},"3":{"start":[2023,5,8]},"4":{"start":[2023,6,19]}},"2023/2024":{"1":{"start":[2023,8,14]},"2":{"start":[2024,1,15]},"3":{"start":[2024,5,13]},"4":{"start":[2024,6,24]}}}');

/***/ })

}]);
//# sourceMappingURL=export.2030fda6.js.map