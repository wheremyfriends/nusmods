import { each, flatMap } from 'lodash';

import type { ColorIndex, Lesson, ModuleLessonConfig, SemTimetableConfig } from 'types/timetables';
import type { Dispatch, GetState } from 'types/redux';
import type { ColorMapping } from 'types/reducers';
import type { ClassNo, LessonType, Module, ModuleCode, Semester, UserID } from 'types/modules';

import { fetchModule } from 'actions/moduleBank';
import { openNotification } from 'actions/app';
import { getModuleCondensed } from 'selectors/moduleBank';
import {
  randomModuleLessonConfig,
  validateModuleLessons,
  validateTimetableModules,
} from 'utils/timetables';
import { getModuleTimetable } from 'utils/modules';
import { CREATE_LESSON, apolloClient } from 'views/timetable/TimetableContent';

// Actions that should not be used directly outside of thunks
export const SET_TIMETABLE = 'SET_TIMETABLE' as const;
export const ADD_MODULE = 'ADD_MODULE' as const;
export const SET_HIDDEN_IMPORTED = 'SET_HIDDEN_IMPORTED' as const;
export const HIDDEN_IMPORTED_SEM = 'HIDDEN_IMPORTED_SEM' as const;
export const Internal = {
  setTimetable(
    userID: UserID,
    semester: Semester,
    timetable: SemTimetableConfig | undefined,
    colors?: ColorMapping,
    hiddenModules?: ModuleCode[],
  ) {
    return {
      type: SET_TIMETABLE,
      payload: {
        userID,
        semester,
        timetable,
        colors,
        hiddenModules
      },
    };
  },

  addModule(userID: UserID, semester: Semester, moduleCode: ModuleCode, moduleLessonConfig: ModuleLessonConfig) {
    return {
      type: ADD_MODULE,
      payload: {
        userID,
        semester,
        moduleCode,
        moduleLessonConfig,
      },
    };
  },
};


// Realtime implementation which will mutate to GraphQL instead of modifying local timetable
export function addModuleRT(userID: UserID, semester: Semester, moduleCode: ModuleCode, roomID: String) {
  return (dispatch: Dispatch, getState: GetState) =>
    dispatch(fetchModule(moduleCode)).then(() => {
      const module: Module = getState().moduleBank.modules[moduleCode];
      if (!module) {
        dispatch(
          openNotification(`Cannot load ${moduleCode}`, {
            action: {
              text: 'Retry',
              handler: () => {
                dispatch(addModuleRT(userID, semester, moduleCode, roomID));
              },
            },
          }),
        );

        return;
      }

      const lessons = getModuleTimetable(module, semester);
      const moduleLessonConfig = randomModuleLessonConfig(lessons);

      for (const [lessonType, classNo] of Object.entries(moduleLessonConfig)) {
        apolloClient
          .mutate({
            mutation: CREATE_LESSON,
            variables: {
              roomID: roomID, // TODO: Use variable roomID and name
              userID: userID,
              semester: semester,
              moduleCode: moduleCode,
              lessonType: lessonType,
              classNo: classNo
            }
          })
          .catch((err) => {
            console.error("CREATE_LESSON error: ", err)
          });
      }
    });
}


export function addModule(userID: UserID, semester: Semester, moduleCode: ModuleCode) {
  return (dispatch: Dispatch, getState: GetState) =>
    dispatch(fetchModule(moduleCode)).then(() => {
      const module: Module = getState().moduleBank.modules[moduleCode];

      if (!module) {
        dispatch(
          openNotification(`Cannot load ${moduleCode}`, {
            action: {
              text: 'Retry',
              handler: () => {
                dispatch(addModule(userID, semester, moduleCode));
              },
            },
          }),
        );

        return;
      }

      const lessons = getModuleTimetable(module, semester);
      const moduleLessonConfig = randomModuleLessonConfig(lessons);

      dispatch(Internal.addModule(userID, semester, moduleCode, moduleLessonConfig));
    });
}

export const REMOVE_MODULE = 'REMOVE_MODULE' as const;
export function removeModule(userID: UserID, semester: Semester, moduleCode: ModuleCode) {
  return {
    type: REMOVE_MODULE,
    payload: {
      userID,
      semester,
      moduleCode,
    },
  };
}

export const RESET_ALL_TIMETABLES = 'RESET_ALL_TIMETABLES' as const;
export function resetAllTimetables() {
  return {
    type: RESET_ALL_TIMETABLES,
    payload: null,
  };
}


export const RESET_TIMETABLE = 'RESET_TIMETABLE' as const;
export function resetTimetable(userID: UserID, semester: Semester) {
  return {
    type: RESET_TIMETABLE,
    payload: {
      userID,
      semester,
    },
  };
}

export const MODIFY_LESSON = 'MODIFY_LESSON' as const;
export function modifyLesson(activeLesson: Lesson) {
  return {
    type: MODIFY_LESSON,
    payload: {
      activeLesson,
    },
  };
}


// Enter edit mode to select and deselect lessons with the same moduleCode and lessonType
export const EDIT_LESSON = 'EDIT_LESSON' as const;
export function editLesson(semester: Semester, lesson: Lesson) {
  return {
    type: EDIT_LESSON,
    payload: {
      semester,
      lesson,
    },
  };
}

export const ADD_SELECTED_MODULE = 'ADD_SELECTED_MODULE' as const;
export function selectLesson(userID: UserID, semester: Semester, moduleCode: ModuleCode, lessonType: LessonType, classNo: ClassNo) {
  return {
    type: ADD_SELECTED_MODULE,
    payload: {
      userID,
      semester,
      moduleCode,
      lessonType,
      classNo,
    },
  };
}

export const REMOVE_SELECTED_MODULE = 'REMOVE_SELECTED_MODULE' as const;
export function deselectLesson(userID: UserID, semester: Semester, moduleCode: ModuleCode, lessonType: LessonType, classNo: ClassNo) {
  return {
    type: REMOVE_SELECTED_MODULE,
    payload: {
      userID,
      semester,
      moduleCode,
      lessonType,
      classNo,
    },
  };
}

export const CANCEL_EDIT_LESSON = 'CANCEL_EDIT_LESSON' as const;
export function cancelEditLesson() {
  return {
    type: CANCEL_EDIT_LESSON,
    payload: null,
  };
}

export const CHANGE_LESSON = 'CHANGE_LESSON' as const;
export function setLesson(
  semester: Semester,
  moduleCode: ModuleCode,
  lessonType: LessonType,
  classNo: ClassNo,
) {
  return {
    type: CHANGE_LESSON,
    payload: {
      semester,
      moduleCode,
      lessonType,
      classNo,
    },
  };
}

export function changeLesson(semester: Semester, lesson: Lesson) {
  return setLesson(semester, lesson.moduleCode, lesson.lessonType, lesson.classNo);
}

export const SET_LESSON_CONFIG = 'SET_LESSON_CONFIG' as const;
export function setLessonConfig(
  semester: Semester,
  moduleCode: ModuleCode,
  lessonConfig: ModuleLessonConfig,
) {
  return {
    type: SET_LESSON_CONFIG,
    payload: {
      semester,
      moduleCode,
      lessonConfig,
    },
  };
}

export const CANCEL_MODIFY_LESSON = 'CANCEL_MODIFY_LESSON' as const;
export function cancelModifyLesson() {
  return {
    type: CANCEL_MODIFY_LESSON,
    payload: null,
  };
}

export function setTimetable(
  userID: UserID,
  semester: Semester,
  timetable?: SemTimetableConfig,
  colors?: ColorMapping,
) {
  return (dispatch: Dispatch, getState: GetState) => {
    let validatedTimetable = timetable;
    if (timetable) {
      [validatedTimetable] = validateTimetableModules(timetable, getState().moduleBank.moduleCodes);
    }

    return dispatch(
      Internal.setTimetable(
        userID,
        semester,
        validatedTimetable,
        colors,
        getState().timetables.multiUserHidden[userID]?.[HIDDEN_IMPORTED_SEM] || [],
      ),
    );
  };
}

export function validateTimetable(semester: Semester) {
  return (dispatch: Dispatch, getState: GetState) => {
    const { timetables, moduleBank } = getState();

    // Extract the timetable and the modules for the semester
    const timetable = timetables.lessons[semester];
    if (!timetable) return;

    // Check that all lessons for each module are valid. If they are not, we update it
    // such that they are
    each(timetable, (lessonConfig: ModuleLessonConfig, moduleCode: ModuleCode) => {
      const module = moduleBank.modules[moduleCode];
      if (!module) return;

      const [validatedLessonConfig, changedLessonTypes] = validateModuleLessons(
        semester,
        lessonConfig,
        module,
      );

      if (changedLessonTypes.length) {
        dispatch(setLessonConfig(semester, moduleCode, validatedLessonConfig));
      }
    });
  };
}

export function fetchTimetableModules(timetables: SemTimetableConfig[]) {
  return (dispatch: Dispatch, getState: GetState) => {
    const moduleCodes = new Set(flatMap(timetables, Object.keys));
    const validateModule = getModuleCondensed(getState());

    return Promise.all(
      Array.from(moduleCodes)
        .filter(validateModule)
        .map((moduleCode) => dispatch(fetchModule(moduleCode))),
    );
  };
}

export function setHiddenModulesFromImport(hiddenModules: ModuleCode[]) {
  return (dispatch: Dispatch) => dispatch(setHiddenImported(hiddenModules));
}

export function setHiddenImported(hiddenModules: ModuleCode[]) {
  return {
    type: SET_HIDDEN_IMPORTED,
    payload: { semester: HIDDEN_IMPORTED_SEM, hiddenModules },
  };
}

export const SELECT_MODULE_COLOR = 'SELECT_MODULE_COLOR' as const;
export function selectModuleColor(
  semester: Semester,
  moduleCode: ModuleCode,
  colorIndex: ColorIndex,
) {
  return {
    type: SELECT_MODULE_COLOR,
    payload: {
      semester,
      moduleCode,
      colorIndex,
    },
  };
}

export const HIDE_LESSON_IN_TIMETABLE = 'HIDE_LESSON_IN_TIMETABLE' as const;
export function hideLessonInTimetable(userID: UserID, semester: Semester, moduleCode: ModuleCode) {
  return {
    type: HIDE_LESSON_IN_TIMETABLE,
    payload: { userID, moduleCode, semester },
  };
}

export const SHOW_LESSON_IN_TIMETABLE = 'SHOW_LESSON_IN_TIMETABLE' as const;
export function showLessonInTimetable(userID: UserID, semester: Semester, moduleCode: ModuleCode) {
  return {
    type: SHOW_LESSON_IN_TIMETABLE,
    payload: { userID, moduleCode, semester },
  };
}
