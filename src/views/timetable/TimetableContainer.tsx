import {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { Redirect, useHistory, useLocation, useParams } from "react-router-dom";
import { Repeat } from "react-feather";
import classnames from "classnames";

import type { ModuleCode, Semester } from "types/modules";
import type { ColorMapping } from "types/reducers";
import type { State } from "types/state";
import type { LessonChange, SemTimetableConfig } from "types/timetables";

import Navtabs from "views/layout/Navtabs";
import { selectSemester } from "actions/settings";
import {
  getSemesterTimetableColors,
  getSemesterTimetableMultiLessons,
} from "selectors/timetables";
import {
  addModule,
  cancelEditLesson,
  deleteTimetableUser,
  deselectLesson,
  removeModule,
  resetAllTimetables,
  resetTimetable,
  selectLesson,
} from "actions/timetables";
import { openNotification } from "actions/app";
import { undo } from "actions/undoHistory";
import { getModuleCondensed } from "selectors/moduleBank";
import { fillColorMapping } from "utils/colors";
import {
  generateRoomID,
  semesterForTimetablePage,
  TIMETABLE_SHARE,
  timetablePage,
  pageWithRoomID,
} from "views/routes/paths";
import deferComponentRender from "views/hocs/deferComponentRender";
import SemesterSwitcher from "views/components/semester-switcher/SemesterSwitcher";
import LoadingSpinner from "views/components/LoadingSpinner";
import useScrollToTop from "views/hooks/useScrollToTop";
import TimetableContent, { apolloClient } from "./TimetableContent";

import styles from "./TimetableContainer.scss";
import { ApolloClient, gql } from "@apollo/client";
import { Action } from "actions/constants";
import store from "entry/main";
import _ from "lodash";
import config from "config";
import {
  getRooms,
  subscribeToLessonChanges,
  subscribeToUserChanges,
} from "utils/graphql";
import { AuthContext } from "views/account/AuthContext";
import { handleProtocols } from "graphql-ws";

type Params = {
  roomID: string;
};

// Receives lesson change subscription from the backend, then updates the redux state
export function handleLessonChange(lessonChange: LessonChange) {
  // TODO: Include semester param
  // TODO: Check if request is intended for correct user via name
  const state = store.getState();
  const dispatch = store.dispatch;
  const { action, userID, semester, moduleCode, lessonType, classNo } =
    lessonChange;

  switch (action) {
    case Action.CREATE_LESSON: {
      // Presence of moduleCode should guarantee module is being/already added
      // Prevents multiple adding
      if (
        _.isEmpty(
          state.timetables.multiUserLessons[userID]?.[semester]?.[moduleCode],
        )
      ) {
        dispatch(addModule(userID, semester, moduleCode)); // TODO: define typed dispatch
      }

      dispatch(selectLesson(userID, semester, moduleCode, lessonType, classNo));
      return;
    }

    case Action.DELETE_LESSON: {
      dispatch(
        deselectLesson(userID, semester, moduleCode, lessonType, classNo),
      );
      return;
    }
    case Action.DELETE_MODULE: {
      dispatch(removeModule(userID, semester, moduleCode));
      return;
    }
    case Action.RESET_TIMETABLE: {
      dispatch(resetTimetable(userID, semester));
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
  const activeUserMapping = useSelector(
    ({ app }: State) => app.activeUserMapping,
  );
  const roomID = params.roomID;
  const activeUser = activeUserMapping[roomID]?.user;
  const { user: authUser } = useContext(AuthContext);
  const userID = activeUser?.userID ?? -1;
  const isAuth = activeUser?.isAuth ?? false;

  const multiTimetable = useSelector(getSemesterTimetableMultiLessons)(
    userID,
    semester,
  );
  const colors = useSelector(getSemesterTimetableColors)(semester);
  const getModule = useSelector(getModuleCondensed);
  const modules = useSelector(({ moduleBank }: State) => moduleBank.modules);
  const activeSemester = useSelector(({ app }: State) => app.activeSemester);
  const location = useLocation();

  const dispatch = useDispatch();

  // Resubscribe if roomID changes
  useEffect(() => {
    // Clear the state first                                                                                                               ║
    dispatch(resetAllTimetables());
    const sub = subscribeToLessonChanges(
      apolloClient,
      roomID,
      handleLessonChange,
    );

    return () => {
      sub.unsubscribe();
    };
  }, [roomID]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    if (authUser.userID !== userID) {
      return;
    }

    let userIDs = new Set<number>(); // UserID of extra users

    // Subscribe to additional rooms, other than the original one
    const subscriptions = getRooms(apolloClient).then((rooms) => {
      if (!rooms) return;
      return rooms
        .filter((room) => roomID !== room)
        .flatMap((roomID) => {
          const sub1 = subscribeToLessonChanges(
            apolloClient,
            roomID,
            (lessonChange) => {
              if (lessonChange.userID === authUser?.userID) {
                return;
              }

              userIDs.add(lessonChange.userID);
              handleLessonChange(lessonChange);
            },
          );
          const sub2 = subscribeToUserChanges(
            apolloClient,
            roomID,
            (userChange) => {
              const { action, userID } = userChange;

              switch (action) {
                case Action.DELETE_USER: {
                  if (authUser?.userID === userID) return;

                  dispatch(deleteTimetableUser(userID));
                  return;
                }
              }
            },
          );

          return [sub1, sub2];
        });
    });

    return () => {
      subscriptions.then((subs) => subs?.forEach((s) => s.unsubscribe()));
      userIDs.forEach((id) => {
        dispatch(deleteTimetableUser(id));
      });
    };
  }, [roomID, userID]);

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

  // 2. If we are importing a timetable, check that all imported modules are
  //    loaded first, and display a spinner if they're not.
  // if (isLoading) {
  //   return <LoadingSpinner />;
  // }

  return (
    <main className="pt-3">
      <aside className="md:fixed md:left-0 md:w-[10rem] md:h-[80vh] lg:w-[15rem]">
        <Navtabs roomID={roomID} />
      </aside>
      <div className="md:pl-[10rem] lg:pl-[15rem]">
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
          readOnly={isAuth && authUser?.userID !== activeUser.userID}
        />
      </div>
    </main>
  );
};

export default deferComponentRender(TimetableContainerComponent);
