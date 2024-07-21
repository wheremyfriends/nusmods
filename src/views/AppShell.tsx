import { FC, useCallback, useContext, useEffect, useState } from "react";
import { AuthUser } from "types/accounts";

import { Helmet } from "react-helmet";
import { Link, NavLink, useHistory, useLocation } from "react-router-dom";
import { useDispatch, useSelector, useStore } from "react-redux";
import classnames from "classnames";
import { each } from "lodash";
import { DARK_MODE } from "types/settings";
import type { Semester } from "types/modules";
import type { SemTimetableConfig } from "types/timetables";

import weekText from "utils/weekText";
import { captureException } from "utils/error";
import { openNotification } from "actions/app";
import { fetchModuleList as fetchModuleListAction } from "actions/moduleBank";
import {
  fetchTimetableModules as fetchTimetableModulesAction,
  validateTimetable,
} from "actions/timetables";
import Navtabs from "views/layout/Navtabs";
import Notification from "views/components/notfications/Notification";
import ErrorBoundary from "views/errors/ErrorBoundary";
import ErrorPage from "views/errors/ErrorPage";
import ApiError from "views/errors/ApiError";
import { isIOS } from "bootstrapping/browser";
import Logo from "img/nusmods-logo.svg";
import type { Dispatch } from "types/redux";
import type { State } from "types/state";
import type { Actions } from "types/actions";
import LoadingSpinner from "./components/LoadingSpinner";
import FeedbackModal from "./components/FeedbackModal";
import KeyboardShortcuts from "./components/KeyboardShortcuts";

import styles from "./AppShell.scss";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronsDown } from "lucide-react";

import { AuthContext } from "./account/AuthContext";
import { getUser, logoutUser } from "utils/graphql";
import { apolloClient } from "./timetable/TimetableContent";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Fetch module list on mount.
 */
function useFetchModuleListAndTimetableModules(): {
  moduleListError: Error | null;
  refetchModuleListAndTimetableModules: () => void;
} {
  const [moduleListError, setModuleListError] = useState<Error | null>(null);

  const dispatch = useDispatch<Dispatch>();
  const store = useStore<State, Actions>();

  const fetchModuleList = useCallback(
    () =>
      // TODO: This always re-fetch the entire modules list. Consider a better strategy for this
      dispatch(fetchModuleListAction()).catch((error) => {
        captureException(error);
        setModuleListError(error);
      }),
    [dispatch],
  );

  const fetchTimetableModules = useCallback(
    function fetchTimetableModulesImpl(
      timetable: SemTimetableConfig,
      semester: Semester,
    ) {
      dispatch(fetchTimetableModulesAction([timetable]))
        .then(() => dispatch(validateTimetable(semester)))
        .catch((error) => {
          captureException(error);
          dispatch(
            openNotification("Data for some courses failed to load", {
              action: {
                text: "Retry",
                handler: () => fetchTimetableModulesImpl(timetable, semester),
              },
            }),
          );
        });
    },
    [dispatch],
  );

  const fetchModuleListAndTimetableModules = useCallback(() => {
    // Retrieve module list
    const moduleListPromise = fetchModuleList();

    // Fetch the module data of the existing modules in the timetable and ensure all
    // lessons are filled
    // const timetables = store.getState().timetables.lessons;
    // each(timetables, (timetable, semesterString) => {
    //   const semester = Number(semesterString);
    //   moduleListPromise.then(() => {
    //     // Wait for module list to be fetched before trying to fetch timetable modules
    //     // TODO: There may be a more optimal way to do this
    //     fetchTimetableModules(timetable, semester);
    //   });
    // });
  }, [fetchModuleList, fetchTimetableModules, store]);

  useEffect(
    () => fetchModuleListAndTimetableModules(),
    [fetchModuleListAndTimetableModules],
  );

  return {
    moduleListError,
    refetchModuleListAndTimetableModules: fetchModuleListAndTimetableModules,
  };
}

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { moduleListError, refetchModuleListAndTimetableModules } =
    useFetchModuleListAndTimetableModules();

  const moduleList = useSelector((state: State) => state.moduleBank.moduleList);
  const isModuleListReady = moduleList.length;

  const mode = useSelector((state: State) => state.settings.mode);
  const isDarkMode = mode === DARK_MODE;

  const theme = useSelector((state: State) => state.theme.id);

  if (!isModuleListReady && moduleListError) {
    return (
      <ApiError
        dataName="course information"
        retry={refetchModuleListAndTimetableModules}
      />
    );
  }

  const [user, setUser] = useState<AuthUser>(undefined);

  useEffect(() => {
    getUser(apolloClient).then((user) => setUser(user));
  }, []);

  const handleLogout = async () => {
    await logoutUser(apolloClient);
    setUser(undefined);
  };

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div className="overflow-hidden grid grid-rows-[auto_minmax(0,_1fr)] h-[100vh]">
        <Helmet>
          <body
            className={classnames(`theme-${theme}`, {
              "mode-dark": isDarkMode,
              "mdc-theme--dark": isDarkMode,
              "mobile-safari": isIOS,
            })}
          />
        </Helmet>

        <nav className={styles.navbar}>
          <NavLink className={styles.brand} to="#" title="Home">
            Where are my friends?
          </NavLink>

          <div className={styles.navRight}>
            <Link to="/rooms">
              <Button variant="link">Rooms</Button>
            </Link>
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger className="btn text-black underline-offset-4 hover:bg-gray-200">
                    {user.username} <ChevronDown />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={handleLogout}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="link">Login</Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        <>
          {isModuleListReady ? (
            <ErrorBoundary errorPage={() => <ErrorPage showReportDialog />}>
              {children}
            </ErrorBoundary>
          ) : (
            <LoadingSpinner />
          )}
        </>

        <ErrorBoundary>
          <FeedbackModal />
        </ErrorBoundary>

        <ErrorBoundary>
          <Notification />
        </ErrorBoundary>

        <ErrorBoundary>
          <KeyboardShortcuts />
        </ErrorBoundary>
      </div>
    </AuthContext.Provider>
  );
};

export default AppShell;
