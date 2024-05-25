import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useHistory, useLocation, useParams } from 'react-router-dom';
import { Repeat } from 'react-feather';
import classnames from 'classnames';

import type { ModuleCode, Semester } from 'types/modules';
import type { ColorMapping } from 'types/reducers';
import type { State } from 'types/state';
import type { LessonChange, SemTimetableConfig } from 'types/timetables';

import { selectSemester } from 'actions/settings';
import { getSemesterTimetableColors, getSemesterTimetableLessons } from 'selectors/timetables';
import {
  addModule,
  deselectLesson,
  fetchTimetableModules,
  removeModule,
  selectLesson,
  setHiddenModulesFromImport,
  setTimetable,
} from 'actions/timetables';
import { openNotification } from 'actions/app';
import { undo } from 'actions/undoHistory';
import { getModuleCondensed } from 'selectors/moduleBank';
import { deserializeHidden, deserializeTimetable } from 'utils/timetables';
import { fillColorMapping } from 'utils/colors';
import { generateRoomID, semesterForTimetablePage, TIMETABLE_SHARE, timetablePage } from 'views/routes/paths';
import deferComponentRender from 'views/hocs/deferComponentRender';
import SemesterSwitcher from 'views/components/semester-switcher/SemesterSwitcher';
import LoadingSpinner from 'views/components/LoadingSpinner';
import useScrollToTop from 'views/hooks/useScrollToTop';
import TimetableContent, { apolloClient } from './TimetableContent';

import styles from './TimetableContainer.scss';
import { gql } from '@apollo/client';
import { Action } from 'actions/constants';
import store from 'entry/main';
import _ from 'lodash';

export const LESSON_CHANGE_SUBSCRIPTION = gql`
  subscription LessonChange($roomID: String!) {
    lessonChange(roomID: $roomID) {
      action
      name
      semester
      moduleCode
      lessonType
      classNo
    }
  }
  `;

type Params = {
  roomID: string;
  semester: string;
};

function handleLessonChange(lessonChange: LessonChange) {
  // TODO: Include semester param
  // TODO: Check if request is intended for correct user via name
  const state = store.getState();
  const dispatch = store.dispatch;
  const { action, name, semester, moduleCode, lessonType, classNo } = lessonChange;

  console.log(lessonChange)
  switch (action) {
    case Action.CREATE_LESSON: {
      // Presence of moduleCode should guarantee module is being/already added
      // Prevents multiple adding
      if (_.isEmpty(state.timetables.multiLessons[semester]?.[moduleCode])) {
        dispatch(addModule(semester, moduleCode)); // TODO: define typed dispatch
      }

      dispatch(selectLesson(semester, moduleCode, lessonType, classNo));
      return;
    }

    case Action.DELETE_LESSON: {
      dispatch(deselectLesson(semester, moduleCode, lessonType, classNo));
      return;

    }
    case Action.DELETE_MODULE: {
      dispatch(removeModule(semester, moduleCode));
      return;
    }
    default:
      return;
  }
}


const TimetableHeader: FC<{
  semester: Semester;
  readOnly?: boolean;
}> = ({ semester, readOnly }) => {
  const history = useHistory();
  const dispatch = useDispatch();

  const handleSelectSemester = useCallback(
    (newSemester: Semester) => {
      dispatch(selectSemester(newSemester));
      history.push({
        ...history.location,
        pathname: timetablePage(newSemester),
      });
    },
    [dispatch, history],
  );

  return (
    <SemesterSwitcher
      semester={semester}
      onSelectSemester={handleSelectSemester}
      readOnly={readOnly}
    />
  );
};

/**
 * Manages semester switching and sync/shared timetables
 * - Checks if the semester path param is valid and display a 404 page if it is not
 * - Import timetable data from query string if action is defined
 * - Create the UI for the user to confirm their actions
 */
export const TimetableContainerComponent: FC = () => {
  const params = useParams<Params>();

  const semester = semesterForTimetablePage(params.semester);
  const roomID = params.roomID;

  const timetable = useSelector(getSemesterTimetableLessons)(semester);
  const colors = useSelector(getSemesterTimetableColors)(semester);
  const getModule = useSelector(getModuleCondensed);
  const modules = useSelector(({ moduleBank }: State) => moduleBank.modules);
  const activeSemester = useSelector(({ app }: State) => app.activeSemester);
  const location = useLocation();

  const dispatch = useDispatch();

  // Resubscribe if roomID changes 
  // TODO: Unsubscribe
  useEffect(() => {
    apolloClient.subscribe({
      query: LESSON_CHANGE_SUBSCRIPTION,
      variables: {
        roomID: roomID,
      },
    })
      .subscribe({
        next(data) {
          // console.log("data", data);
          if (data.data) {
            handleLessonChange(data.data.lessonChange);
          }
        },
        error(error) {
          console.log("Apollo subscribe error", error);
        },
        complete() {
        },
      })
  }, [roomID]);

  const isLoading = useMemo(() => {
    // Check that all modules are fully loaded into the ModuleBank
    const moduleCodes = new Set(Object.keys(timetable));
    // TODO: Account for loading error
    return Array.from(moduleCodes).some((moduleCode) => !modules[moduleCode]);
  }, [getModule, modules, timetable]);

  const displayedTimetable = timetable;
  const filledColors = useMemo(
    () => fillColorMapping(displayedTimetable, colors),
    [colors, displayedTimetable],
  );
  const readOnly = false;

  useScrollToTop();

  // Early returns must be placed last
  if (semester == null) {
    return <Redirect to={timetablePage(activeSemester)} />;
  }

  if (!roomID) {
    return <Redirect to={`${timetablePage(semester)}/${generateRoomID()}`} />;
  }

  // 2. If we are importing a timetable, check that all imported modules are
  //    loaded first, and display a spinner if they're not.
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <TimetableContent
      key={semester}
      semester={semester}
      timetable={displayedTimetable}
      colors={filledColors}
      roomID={roomID}
      header={
        <>
          <TimetableHeader
            semester={semester}
            readOnly={readOnly}
          />
        </>
      }
      readOnly={readOnly}
    />
  );
};

export default deferComponentRender(TimetableContainerComponent);
