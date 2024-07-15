import { get, omit, values } from "lodash";
import produce from "immer";
import { createMigrate } from "redux-persist";

import { PersistConfig } from "storage/persistReducer";
import { ModuleCode } from "types/modules";
import { ModuleLessonConfig, SemTimetableConfig } from "types/timetables";
import { ColorMapping, TimetablesState } from "types/reducers";

import config from "config";
import {
  ADD_MODULE,
  CHANGE_LESSON,
  HIDDEN_IMPORTED_SEM,
  HIDE_LESSON_IN_TIMETABLE,
  REMOVE_MODULE,
  RESET_TIMETABLE,
  SELECT_MODULE_COLOR,
  SET_LESSON_CONFIG,
  SET_TIMETABLE,
  SHOW_LESSON_IN_TIMETABLE,
  CANCEL_EDIT_LESSON,
  EDIT_LESSON,
  ADD_SELECTED_MODULE,
  REMOVE_SELECTED_MODULE,
  RESET_ALL_TIMETABLES,
  UNFOCUS_LESSON_IN_TIMETABLE,
  FOCUS_LESSON_IN_TIMETABLE,
  DELETE_TIMETABLE_USER,
  UPDATE_TIMETABLE_GEN_CONF,
} from "actions/timetables";
import { getNewColor } from "utils/colors";
import { SET_EXPORTED_DATA } from "actions/constants";
import { Actions } from "../types/actions";
import { SWITCH_USER } from "actions/settings";

export const persistConfig = {
  /* eslint-disable no-useless-computed-key */
  migrate: createMigrate({
    [1]: (state) => ({
      ...state,
      archive: {},
      // FIXME: Remove the next line when _persist is optional again.
      // Cause: https://github.com/rt2zz/redux-persist/pull/919
      // Issue: https://github.com/rt2zz/redux-persist/pull/1170
      // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
      _persist: state?._persist!,
    }),
  }),
  /* eslint-enable */
  version: 1,

  // Our own state reconciler archives old timetables if the acad year is different,
  // otherwise use the persisted timetable state
  stateReconciler: (
    inbound: TimetablesState,
    original: TimetablesState,
    _reduced: TimetablesState,
    { debug }: PersistConfig<TimetablesState>,
  ): TimetablesState => {
    if (inbound.academicYear === original.academicYear) {
      return inbound;
    }

    if (debug) {
      // eslint-disable-next-line no-console
      console.log(
        "New academic year detected - resetting timetable and adding timetable to archive",
      );
    }

    return {
      ...original,
      archive: {
        ...inbound.archive,
        [inbound.academicYear]: inbound.multiUserLessons,
      },
    };
  },
};

// Map of lessonType to ClassNo.
const defaultModuleLessonConfig: ModuleLessonConfig = {};

function moduleLessonConfig(
  state: ModuleLessonConfig = defaultModuleLessonConfig,
  action: Actions,
): ModuleLessonConfig {
  if (!action.payload) return state;

  switch (action.type) {
    case CHANGE_LESSON: {
      const { classNo, lessonType } = action.payload;
      if (!(classNo && lessonType)) return state;
      return {
        ...state,
        [lessonType]: classNo,
      };
    }
    case SET_LESSON_CONFIG:
      return action.payload.lessonConfig;

    default:
      return state;
  }
}

// Map of ModuleCode to module lesson config.
const DEFAULT_SEM_TIMETABLE_CONFIG: SemTimetableConfig = {};
function semTimetable(
  state: SemTimetableConfig = DEFAULT_SEM_TIMETABLE_CONFIG,
  action: Actions,
): SemTimetableConfig {
  const moduleCode = get(action, "payload.moduleCode");
  if (!moduleCode) return state;

  switch (action.type) {
    case ADD_MODULE:
      return {
        ...state,
        [moduleCode]: action.payload.moduleLessonConfig,
      };
    case REMOVE_MODULE:
      return omit(state, [moduleCode]);
    case CHANGE_LESSON:
    case SET_LESSON_CONFIG:
      return {
        ...state,
        [moduleCode]: moduleLessonConfig(state[moduleCode], action),
      };
    default:
      return state;
  }
}

// Map of semester to color mapping
const DEFAULT_SEM_COLOR_MAP = {};
function semColors(
  state: ColorMapping = DEFAULT_SEM_COLOR_MAP,
  action: Actions,
): ColorMapping {
  const moduleCode = get(action, "payload.moduleCode");
  if (!moduleCode) return state;

  switch (action.type) {
    case ADD_MODULE:
      return {
        ...state,
        // Dont change color if it is already defined
        [moduleCode]: state[moduleCode] || getNewColor(values(state)),
      };

    case REMOVE_MODULE:
      // return omit(state, moduleCode);
      // TODO: reference counter to remove only when no modules among all users
      return state;

    case SELECT_MODULE_COLOR:
      return {
        ...state,
        [moduleCode]: action.payload.colorIndex,
      };

    default:
      return state;
  }
}

// Map of semester to list of hidden modules
const DEFAULT_HIDDEN_STATE: ModuleCode[] = [];
function semHiddenModules(state = DEFAULT_HIDDEN_STATE, action: Actions) {
  if (!action.payload) {
    return state;
  }

  switch (action.type) {
    case HIDE_LESSON_IN_TIMETABLE:
      return [action.payload.moduleCode, ...state];
    case SHOW_LESSON_IN_TIMETABLE:
    case REMOVE_MODULE:
      return state.filter((c) => c !== action.payload.moduleCode);
    default:
      return state;
  }
}

export const defaultTimetableState: TimetablesState = {
  multiUserLessons: {},
  editingType: null,
  colors: {},
  multiUserHidden: {},
  multiUserFocus: {},
  academicYear: config.academicYear,
  archive: {},
  timetableGeneratorConfig: {
    prefDaysEnabled: false,
    maxDistEnabled: false,
    breaksEnabled: false,
    prefDays: "",
    maxDist: "",
    minDuration: "",
    breaks: [{ start: "", end: "" }],
  },
};

function timetables(
  state: TimetablesState = defaultTimetableState,
  action: Actions,
): TimetablesState {
  // All normal timetable actions should specify their semester
  switch (action.type) {
    case ADD_SELECTED_MODULE: {
      const { userID, semester, moduleCode, lessonType, classNo } =
        action.payload;

      const oldClassNoArray =
        state.multiUserLessons[userID]?.[semester]?.[moduleCode]?.[
          lessonType
        ] || [];
      // Prevent duplicates
      if (oldClassNoArray.includes(classNo)) return state;

      return {
        ...state,
        multiUserLessons: {
          ...state.multiUserLessons,
          [userID]: {
            ...state.multiUserLessons[userID],
            [semester]: {
              ...state.multiUserLessons[userID]?.[semester],
              [moduleCode]: {
                ...state.multiUserLessons[userID]?.[semester]?.[moduleCode],
                [lessonType]: [...oldClassNoArray, classNo],
              },
            },
          },
        },
      };
    }

    case REMOVE_SELECTED_MODULE: {
      const { userID, semester, moduleCode, lessonType, classNo } =
        action.payload;

      return {
        ...state,
        multiUserLessons: {
          ...state.multiUserLessons,
          [userID]: {
            ...state.multiUserLessons[userID],
            [semester]: {
              ...state.multiUserLessons[userID]?.[semester],
              [moduleCode]: {
                ...state.multiUserLessons[userID]?.[semester]?.[moduleCode],
                [lessonType]: (
                  state.multiUserLessons[userID]?.[semester]?.[moduleCode]?.[
                    lessonType
                  ] || []
                ).filter((e) => e !== classNo),
              },
            },
          },
        },
      };
    }

    case EDIT_LESSON: {
      const { semester } = action.payload;
      const { moduleCode, lessonType, classNo } = action.payload.lesson;

      return {
        ...state,
        editingType: {
          moduleCode: moduleCode,
          lessonType: lessonType,
        },
      };
    }
    case SWITCH_USER:
    case CANCEL_EDIT_LESSON:
      return {
        ...state,
        editingType: null,
      };

    case SET_TIMETABLE: {
      const { userID, semester, timetable, colors, hiddenModules } =
        action.payload;

      return produce(state, (draft) => {
        draft.colors[semester] = colors || {};
        draft.multiUserHidden[userID][semester] = hiddenModules || [];

        // Remove the old hidden imported modules
        delete draft.multiUserHidden[userID][HIDDEN_IMPORTED_SEM];
      });
    }

    case RESET_ALL_TIMETABLES: {
      return produce(state, (draft) => {
        draft.multiUserLessons = {};
        draft.colors = {};
        draft.multiUserHidden = {};
        draft.multiUserFocus = {};
      });
    }

    case RESET_TIMETABLE: {
      const { userID, semester } = action.payload;

      return produce(state, (draft) => {
        draft.editingType = null;
        draft.multiUserLessons[userID] = { [semester]: {} };
        // draft.colors[semester] = DEFAULT_SEM_COLOR_MAP; // TODO: Reference count
        draft.multiUserHidden[userID] = { [semester]: DEFAULT_HIDDEN_STATE };
        draft.multiUserFocus[userID] = { [semester]: undefined };
      });
    }

    case ADD_MODULE: {
      const { userID, semester, moduleCode } = action.payload;
      return produce(state, (draft) => {
        draft.colors[semester] = semColors(state.colors[semester], action);

        if (draft.multiUserHidden[userID]?.[semester] === undefined)
          draft.multiUserHidden[userID] = { [semester]: [] };

        if (draft.multiUserFocus[userID]?.[semester] === undefined)
          draft.multiUserFocus[userID] = { [semester]: undefined };
      });
    }

    case DELETE_TIMETABLE_USER: {
      const { userID } = action.payload;

      return produce(state, (draft) => {
        draft.multiUserLessons = omit(draft.multiUserLessons, userID);
      });
    }

    case REMOVE_MODULE: {
      const { userID, semester, moduleCode } = action.payload;
      return produce(state, (draft) => {
        // Exit edit mode if editing module is removed
        if (moduleCode == state.editingType?.moduleCode)
          draft.editingType = null;
        draft.multiUserLessons[userID][semester] = omit(
          draft.multiUserLessons[userID][semester],
          moduleCode,
        );
        draft.colors[semester] = semColors(state.colors[semester], action);
        draft.multiUserHidden[userID][semester] = semHiddenModules(
          state.multiUserHidden[userID][semester],
          action,
        );
      });
    }

    case SELECT_MODULE_COLOR: {
      const { semester, moduleCode } = action.payload;
      return produce(state, (draft) => {
        draft.colors[semester] = semColors(state.colors[semester], action);
      });
    }

    case HIDE_LESSON_IN_TIMETABLE:
    case SHOW_LESSON_IN_TIMETABLE: {
      const { userID, semester, moduleCode } = action.payload;
      return produce(state, (draft) => {
        draft.multiUserHidden[userID][semester] = semHiddenModules(
          state.multiUserHidden[userID][semester],
          action,
        );
      });
    }

    case UNFOCUS_LESSON_IN_TIMETABLE:
      const { userID, semester } = action.payload;
      return produce(state, (draft) => {
        draft.multiUserFocus[userID] = { [semester]: undefined };
      });

    case FOCUS_LESSON_IN_TIMETABLE: {
      const { userID, semester, moduleCode } = action.payload;
      return produce(state, (draft) => {
        draft.multiUserFocus[userID] = { [semester]: moduleCode };
      });
    }

    case UPDATE_TIMETABLE_GEN_CONF:
      const { config } = action.payload;
      return {
        ...state,
        timetableGeneratorConfig: config,
      };
    // case SET_EXPORTED_DATA: {
    //   const { semester, timetable, colors, hidden } = action.payload;

    //   return {
    //     ...state,
    //     colors: { [semester]: colors },
    //     hidden: { [semester]: hidden },
    //   };
    // }

    // case SET_HIDDEN_IMPORTED: {
    //   const { semester, hiddenModules } = action.payload;
    //   return produce(state, (draft) => {
    //     draft.hidden[semester] = hiddenModules;
    //   });
    // }

    default:
      return state;
  }
}

export default timetables;
