import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useHistory, useLocation, useParams } from 'react-router-dom';
import { Repeat } from 'react-feather';
import classnames from 'classnames';

import type { ModuleCode, Semester } from 'types/modules';
import type { ColorMapping } from 'types/reducers';
import type { State } from 'types/state';
import type { LessonChange, SemTimetableConfig } from 'types/timetables';

import Navtabs from 'views/layout/Navtabs';
import { selectSemester } from 'actions/settings';
import { getSemesterTimetableColors, getSemesterTimetableMultiLessons } from 'selectors/timetables';
import {
  addModule,
  cancelEditLesson,
  deselectLesson,
  fetchTimetableModules,
  removeModule,
  resetAllTimetables,
  resetTimetable,
  selectLesson,
  setHiddenModulesFromImport,
  setTimetable,
} from 'actions/timetables';
import { openNotification } from 'actions/app';
import { undo } from 'actions/undoHistory';
import { getModuleCondensed } from 'selectors/moduleBank';
import { deserializeHidden, deserializeTimetable } from 'utils/timetables';
import { fillColorMapping } from 'utils/colors';
import { generateRoomID, semesterForTimetablePage, TIMETABLE_SHARE, timetablePage, pageWithRoomID } from 'views/routes/paths';
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
import config from 'config';


export const LESSON_CHANGE_SUBSCRIPTION = gql`
  subscription LessonChange($roomID: String!) {
    lessonChange(roomID: $roomID) {
      action
      userID
      semester
      moduleCode
      lessonType
      classNo
    }
  }
  `;

type Params = {
  roomID: string;
};

function handleLessonChange(lessonChange: LessonChange) {
  // TODO: Include semester param
  // TODO: Check if request is intended for correct user via name
  const state = store.getState();
  const dispatch = store.dispatch;
  const { action, userID, semester, moduleCode, lessonType, classNo } = lessonChange;

  // console.log(lessonChange)
  switch (action) {
    case Action.CREATE_LESSON: {
      // Presence of moduleCode should guarantee module is being/already added
      // Prevents multiple adding
      if (_.isEmpty(state.timetables.multiLessons[semester]?.[moduleCode])) {
        dispatch(addModule(userID, semester, moduleCode)); // TODO: define typed dispatch
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
    case Action.RESET_TIMETABLE: {
      dispatch(resetTimetable(semester));
      return;
    }
    default:
      return;
  }
}


const TimetableHeader: FC<{
  semester: Semester;
  readOnly?: boolean;
  roomID: String;
}> = ({ semester, readOnly, roomID }) => {
  const history = useHistory();
  const dispatch = useDispatch();

  // const handleSelectSemester = useCallback(
  //   (newSemester: Semester) => {
  //     dispatch(selectSemester(newSemester));
  //     history.push({
  //       ...history.location,
  //       pathname: pageWithRoomID(roomID),
  //     });
  //   },
  //   [dispatch, history],
  // );

  return (
    <SemesterSwitcher
      semester={semester}
      onSelectSemester={(semester) => dispatch(selectSemester(semester))}
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

  const semester = useSelector(({ app }: State) => app.activeSemester);
  const userID = useSelector(({ app }: State) => app.activeUserID);
  const roomID = params.roomID;

  const multiTimetable = useSelector(getSemesterTimetableMultiLessons)(semester);
  const colors = useSelector(getSemesterTimetableColors)(semester);
  const getModule = useSelector(getModuleCondensed);
  const modules = useSelector(({ moduleBank }: State) => moduleBank.modules);
  const activeSemester = useSelector(({ app }: State) => app.activeSemester);
  const location = useLocation();

  const dispatch = useDispatch();

  console.log("TIMETABLE COMPONENT UPDATE", colors)

  // Resubscribe if roomID changes 
  // TODO: Unsubscribe
  useEffect(() => {
    // TODO: states should not even be saved in the first place
    dispatch(cancelEditLesson());
    dispatch(resetAllTimetables());


    apolloClient
      .subscribe({
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

  // Not needed as modules are fetched on demand
  const isLoading = useMemo(() => {
    // Check that all modules are fully loaded into the ModuleBank
    const moduleCodes = new Set(Object.keys(multiTimetable));
    // TODO: Account for loading error
    return Array.from(moduleCodes).some((moduleCode) => !modules[moduleCode]);
  }, [getModule, modules, multiTimetable]);

  const displayedMultiTimetable = multiTimetable;
  const filledColors = useMemo(
    () => fillColorMapping(displayedMultiTimetable, colors),
    [colors, displayedMultiTimetable],
  );
  const readOnly = false;

  useScrollToTop();

  // Early returns must be placed last

  // Redirect to auto generated roomID
  if (!roomID) {
    return <Redirect to={pageWithRoomID(generateRoomID())} />;
  }

  // 2. If we are importing a timetable, check that all imported modules are
  //    loaded first, and display a spinner if they're not.
  // if (isLoading) {
  //   return <LoadingSpinner />;
  // }

  return (
    <>
      <div className="main-container">
        <Navtabs roomID={roomID} />
      </div>
      <TimetableContent
        key={semester}
        semester={semester}
        userID={userID}
        multiTimetable={displayedMultiTimetable}
        colors={filledColors}
        roomID={roomID}
        header={
          <>
            <TimetableHeader
              semester={semester}
              readOnly={readOnly}
              roomID={roomID}
            />
          </>
        }
        readOnly={readOnly}
      />
    </>
  );
};

export default deferComponentRender(TimetableContainerComponent);
