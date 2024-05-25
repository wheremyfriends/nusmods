import { get, omit, values } from 'lodash';
import produce from 'immer';
import { createMigrate } from 'redux-persist';

import { PersistConfig } from 'storage/persistReducer';
import { ModuleCode, Semester } from 'types/modules';
import { ModuleLessonConfig, SemTimetableConfig, SemTimetableMultiConfig, TimetableConfig, TimetableMultiConfig } from 'types/timetables';
import { ColorMapping, TimetablesState } from 'types/reducers';

import config from 'config';
import {
  ADD_MODULE,
  CHANGE_LESSON,
  HIDDEN_IMPORTED_SEM,
  HIDE_LESSON_IN_TIMETABLE,
  REMOVE_MODULE,
  RESET_TIMETABLE,
  SELECT_MODULE_COLOR,
  SET_HIDDEN_IMPORTED,
  SET_LESSON_CONFIG,
  SET_TIMETABLE,
  SHOW_LESSON_IN_TIMETABLE,
  // TOGGLE_SELECT_LESSON,
  CANCEL_EDIT_LESSON,
  EDIT_LESSON,
  ADD_SELECTED_MODULE,
  REMOVE_SELECTED_MODULE,
  RESET_SELECTIONS,
} from 'actions/timetables';
import { getNewColor } from 'utils/colors';
import { SET_EXPORTED_DATA } from 'actions/constants';
import { Actions } from '../types/actions';
import { isLessonSelected } from 'utils/modules';

import { ApolloClient, InMemoryCache, ApolloProvider, gql } from '@apollo/client';

import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { apolloClient } from 'views/timetable/TimetableContent';

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
        'New academic year detected - resetting timetable and adding timetable to archive',
      );
    }

    return {
      ...original,
      archive: {
        ...inbound.archive,
        [inbound.academicYear]: inbound.lessons,
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
const DEFAULT_SEM_TIMETABLE_MULTI_CONFIG: SemTimetableMultiConfig = {};
function semTimetable(
  state: SemTimetableConfig = DEFAULT_SEM_TIMETABLE_CONFIG,
  action: Actions,
): SemTimetableConfig {
  const moduleCode = get(action, 'payload.moduleCode');
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
function semColors(state: ColorMapping = DEFAULT_SEM_COLOR_MAP, action: Actions): ColorMapping {
  const moduleCode = get(action, 'payload.moduleCode');
  if (!moduleCode) return state;

  switch (action.type) {
    case ADD_MODULE:
      return {
        ...state,
        [moduleCode]: getNewColor(values(state)),
      };

    case REMOVE_MODULE:
      return omit(state, moduleCode);

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

function mergeSemTimetable(
  timetable: TimetableConfig,
  multiTimetable: TimetableMultiConfig
): TimetableMultiConfig {
  for (const [semester, semTimetableConfig] of Object.entries(timetable)) {
    for (const [moduleCode, moduleLessonConfig] of Object.entries(semTimetableConfig)) {
      for (const [lessonType, classNo] of Object.entries(moduleLessonConfig)) {
        // Merge only if multiTimetable does not contain entries for this specific type
        const multiClassNo = multiTimetable[semester]?.[moduleCode]?.[lessonType] || [];
        if (multiClassNo.length === 0) {
          ((multiTimetable[semester] ??= {})[moduleCode] ??= {})[lessonType] = [classNo];
        }
      }
    }
  }
  return multiTimetable;
}

export const defaultTimetableState: TimetablesState = {
  multiLessons: {},
  editingType: null,
  lessons: {},
  colors: {},
  hidden: {},
  academicYear: config.academicYear,
  archive: {},
};




function isModuleInTimetable(
  moduleCode: ModuleCode,
  timetable: TimetableConfig,
  semester: Semester
): boolean {
  return !!get(timetable[semester], moduleCode);
}

function produceTimetableState(semester: Semester, state: TimetablesState, action: Actions) {
  return produce(state, (draft) => {
    draft.lessons[semester] = semTimetable(draft.lessons[semester], action);
    draft.colors[semester] = semColors(state.colors[semester], action);
    draft.hidden[semester] = semHiddenModules(state.hidden[semester], action);
  });
}

function timetables(
  state: TimetablesState = defaultTimetableState,
  action: Actions,
): TimetablesState {
  // All normal timetable actions should specify their semester
  switch (action.type) {
    case ADD_SELECTED_MODULE: {
      const { semester, moduleCode, lessonType, classNo } = action.payload;

      const oldClassNoArray = state.multiLessons[semester]?.[moduleCode]?.[lessonType] || [];
      // Prevent duplicates
      if (oldClassNoArray.includes(classNo))
        return state;

      return {
        ...state,
        multiLessons: {
          ...state.multiLessons,
          [semester]: {
            ...state.multiLessons[semester],
            [moduleCode]: {
              ...state.multiLessons[semester]?.[moduleCode],
              [lessonType]: [...oldClassNoArray, classNo]
            }
          }
        }
      };
    }
    case REMOVE_SELECTED_MODULE: {
      const { semester, moduleCode, lessonType, classNo } = action.payload;

      const newClassNoArray = (state.multiLessons[semester]?.[moduleCode]?.[lessonType] || [])
        .filter(e => e !== classNo);

      return {
        ...state,
        multiLessons: {
          ...state.multiLessons,
          [semester]: {
            ...state.multiLessons[semester],
            [moduleCode]: {
              ...state.multiLessons[semester]?.[moduleCode],
              [lessonType]: newClassNoArray
            }
          }
        }
      };
    }
    case EDIT_LESSON:
      {
        const { semester } = action.payload;
        const { moduleCode, lessonType, classNo } = action.payload.lesson;

        // const multiLessons = mergeSemTimetable(state.lessons, state.multiLessons);
        // const oldClassNoArray = multiLessons[semester]?.[moduleCode]?.[lessonType] || [];
        // const newClassNoArray = oldClassNoArray.length === 0 ? [classNo] : oldClassNoArray;
        return {
          ...state,
          editingType: {
            moduleCode: moduleCode,
            lessonType: lessonType,
          },
          // multiLessons: {
          //   ...multiLessons,
          //   [semester]: {
          //     ...multiLessons[semester],
          //     [moduleCode]: {
          //       ...multiLessons[semester][moduleCode],
          //       [lessonType]: newClassNoArray
          //     }
          //   }
          // }
        };
      }
    case CANCEL_EDIT_LESSON:
      return {
        ...state,
        editingType: null,
      }
    // case TOGGLE_SELECT_LESSON:
    //   {
    //     const { semester } = action.payload;
    //     const { moduleCode, lessonType, classNo } = action.payload.lesson;

    //     // Select or deselect lesson by adding or removing it from array
    //     const oldClassNoArray = state.multiLessons[semester]?.[moduleCode]?.[lessonType] || [];
    //     const newClassNoArray = isLessonSelected(action.payload.lesson, state.multiLessons[semester]) ?
    //       oldClassNoArray.filter(e => e !== classNo) :
    //       [...oldClassNoArray, classNo];
    //     // Prevent deselecting every lesson
    //     if (newClassNoArray.length === 0) return state;
    //     return {
    //       ...state,
    //       multiLessons: {
    //         ...state.multiLessons,
    //         [semester]: {
    //           ...state.multiLessons[semester],
    //           [moduleCode]: {
    //             ...state.multiLessons[semester][moduleCode],
    //             [lessonType]: newClassNoArray
    //           }
    //         }
    //       }
    //     };
    //   }
    case SET_TIMETABLE: {
      const { semester, timetable, colors, hiddenModules } = action.payload;

      return produce(state, (draft) => {
        draft.lessons[semester] = timetable || DEFAULT_SEM_TIMETABLE_CONFIG;
        draft.colors[semester] = colors || {};
        draft.hidden[semester] = hiddenModules || [];

        // Remove the old hidden imported modules
        delete draft.hidden[HIDDEN_IMPORTED_SEM];
      });
    }

    case RESET_SELECTIONS: {
      const { semester } = action.payload;
      return produce(state, (draft) => {
        draft.multiLessons[semester] = DEFAULT_SEM_TIMETABLE_MULTI_CONFIG;
      });
    }
    case RESET_TIMETABLE: {
      const { semester } = action.payload;

      return produce(state, (draft) => {
        draft.lessons[semester] = DEFAULT_SEM_TIMETABLE_CONFIG;
        draft.colors[semester] = DEFAULT_SEM_COLOR_MAP;
        draft.hidden[semester] = DEFAULT_HIDDEN_STATE;
      });
    }

    case ADD_MODULE:
      {
        // Prevent double adding
        if (isModuleInTimetable(action.payload.moduleCode, state.lessons, action.payload.semester))
          return state;
        else
          return produceTimetableState(action.payload.semester, state, action);
      }
    case REMOVE_MODULE:
      {
        // Prevent double removing (likely not required)
        if (!isModuleInTimetable(action.payload.moduleCode, state.lessons, action.payload.semester))
          return state;
        else
        {
          const newState = produceTimetableState(action.payload.semester, state, action);
          newState.multiLessons[action.payload.semester][action.payload.moduleCode] = {};
          return newState;
        }
      }
    case SELECT_MODULE_COLOR:
    case CHANGE_LESSON:
    case SET_LESSON_CONFIG:
    case HIDE_LESSON_IN_TIMETABLE:
    case SHOW_LESSON_IN_TIMETABLE: {
      return produceTimetableState(action.payload.semester, state, action);
    }

    case SET_EXPORTED_DATA: {
      const { semester, timetable, colors, hidden } = action.payload;

      return {
        ...state,
        lessons: { [semester]: timetable },
        colors: { [semester]: colors },
        hidden: { [semester]: hidden },
      };
    }

    case SET_HIDDEN_IMPORTED: {
      const { semester, hiddenModules } = action.payload;
      return produce(state, (draft) => {
        draft.hidden[semester] = hiddenModules;
      });
    }

    default:
      return state;
  }
}

export default timetables;
