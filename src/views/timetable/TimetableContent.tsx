import * as React from "react";
import classnames from "classnames";
import { connect, useDispatch } from "react-redux";
import _, { get, keys } from "lodash";

import {
  ColorMapping,
  HORIZONTAL,
  ModulesMap,
  TimetableOrientation,
  NotificationOptions,
} from "types/reducers";
import {
  Module,
  ModuleCode,
  LessonType,
  Semester,
  ClassNo,
  UserID,
} from "types/modules";
import {
  ColoredLesson,
  Lesson,
  EditingType,
  ModifiableLesson,
  SemTimetableConfig,
  SemTimetableConfigWithLessons,
  SemTimetableMultiConfig,
  TimetableArrangement,
  TimetableMultiConfig,
  LessonChange,
  MultiUserTimetableConfig,
  MultiUserSemTimetableConfigWithLessons,
} from "types/timetables";

import {
  cancelModifyLesson,
  changeLesson,
  HIDDEN_IMPORTED_SEM,
  modifyLesson,
  editLesson,
  cancelEditLesson,
  // toggleSelectLesson,
  resetTimetable,
  addModuleRT,
} from "actions/timetables";
import {
  areLessonsSameClass,
  isLessonSelected,
  formatExamDate,
  getExamDate,
  getModuleTimetable,
} from "utils/modules";
import {
  areOtherClassesAvailable,
  arrangeLessonsForWeek,
  findExamClashes,
  getLessonIdentifier,
  getSemesterModules,
  hydrateSemTimetableWithMultiLessons,
  lessonsForLessonType,
  randomModuleLessonConfig,
  timetableLessonsArray,
} from "utils/timetables";
import { resetScrollPosition } from "utils/react";
import ModulesSelectContainer from "views/timetable/ModulesSelectContainer";
import Title from "views/components/Title";
import ErrorBoundary from "views/errors/ErrorBoundary";
import { State as StoreState } from "types/state";
import { TombstoneModule } from "types/views";
import Timetable from "./Timetable";
import TimetableActions from "./TimetableActions";
import TimetableModulesTable from "./TimetableModulesTable";
import ModulesTableFooter from "./ModulesTableFooter";
import styles from "./TimetableContent.scss";

import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  gql,
  FetchResult,
} from "@apollo/client";

import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { openNotification } from "actions/app";
import { fetchModule } from "actions/moduleBank";
import type { Dispatch, GetState } from "types/redux";
import { Action } from "actions/constants";
import { getOptimisedTimetable } from "solver";

export const CREATE_LESSON = gql`
  mutation CreateLesson(
    $roomID: String!
    $userID: Int!
    $semester: Int!
    $moduleCode: String!
    $lessonType: String!
    $classNo: String!
  ) {
    createLesson(
      roomID: $roomID
      userID: $userID
      semester: $semester
      moduleCode: $moduleCode
      lessonType: $lessonType
      classNo: $classNo
    )
  }
`;

export const DELETE_LESSON = gql`
  mutation DeleteLesson(
    $roomID: String!
    $userID: Int!
    $semester: Int!
    $moduleCode: String!
    $lessonType: String!
    $classNo: String!
  ) {
    deleteLesson(
      roomID: $roomID
      userID: $userID
      semester: $semester
      moduleCode: $moduleCode
      lessonType: $lessonType
      classNo: $classNo
    )
  }
`;

export const DELETE_MODULE = gql`
  mutation DeleteModule(
    $roomID: String!
    $userID: Int!
    $semester: Int!
    $moduleCode: String!
  ) {
    deleteModule(
      roomID: $roomID
      userID: $userID
      semester: $semester
      moduleCode: $moduleCode
    )
  }
`;

export const RESET_TIMETABLE_MUTATION = gql`
  mutation ResetTimetable($roomID: String!, $userID: Int!, $semester: Int!) {
    resetTimetable(roomID: $roomID, userID: $userID, semester: $semester)
  }
`;

let url = "";
let wsURL = "";
if (process.env.NODE_ENV == "production") {
  url = `https://${window.location.hostname}/graphql`;
  wsURL = `wss://${window.location.hostname}/graphql`;
} else {
  url = `http://${window.location.hostname}:4000/graphql`;
  wsURL = `ws://${window.location.hostname}:4000/graphql`;
}

// TODO: Proper URL variable
const wsLink = new GraphQLWsLink(
  createClient({
    url: wsURL,
  }),
);

export const apolloClient = new ApolloClient({
  uri: url,
  link: wsLink,
  cache: new InMemoryCache(),
});

type ModifiedCell = {
  className: string;
  position: ClientRect;
};

type OwnProps = {
  // Own props
  readOnly: boolean;
  header: React.ReactNode;
  semester: Semester;
  multiTimetable: SemTimetableMultiConfig;
  colors: ColorMapping;
  roomID: String;
  userID: UserID;
};

type Props = OwnProps & {
  // From Redux
  multiUserTimetableWithLessons: MultiUserSemTimetableConfigWithLessons;
  multiUserLessons: MultiUserTimetableConfig;
  modules: ModulesMap;
  activeLesson: Lesson | null;
  editingType: EditingType | null;
  timetableOrientation: TimetableOrientation;
  showTitle: boolean;
  hiddenInTimetable: ModuleCode[];

  // Actions
  addModuleRT: (
    userID: UserID,
    semester: Semester,
    moduleCode: ModuleCode,
    roomID: String,
  ) => void;
  resetTimetable: (userID: UserID, semester: Semester) => void;
  modifyLesson: (lesson: Lesson) => void;
  editLesson: (semester: Semester, lesson: Lesson) => void;
  // toggleSelectLesson: (semester: Semester, lesson: Lesson) => void;
  changeLesson: (semester: Semester, lesson: Lesson) => void;
  cancelModifyLesson: () => void;
  cancelEditLesson: () => void;
  openNotification: (message: string, options: NotificationOptions) => void;
};

type State = {
  isScrolledHorizontally: boolean;
  showExamCalendar: boolean;
  tombstone: TombstoneModule | null;
};

/**
 * When a module is modified, we want to ensure the selected timetable cell
 * is in approximately the same location when all of the new options are rendered.
 * This is important for modules with a lot of options which can push the selected
 * option off screen and disorientate the user.
 */
function maintainScrollPosition(
  container: HTMLElement,
  modifiedCell: ModifiedCell,
) {
  const newCell = container.getElementsByClassName(modifiedCell.className)[0];
  if (!newCell) return;

  const previousPosition = modifiedCell.position;
  const currentPosition = newCell.getBoundingClientRect();

  // We try to ensure the cell is in the same position on screen, so we calculate
  // the new position by taking the difference between the two positions and
  // adding it to the scroll position of the scroll container, which is the
  // window for the y axis and the timetable container for the x axis
  const x = currentPosition.left - previousPosition.left + window.scrollX;
  const y = currentPosition.top - previousPosition.top + window.scrollY;

  window.scroll(0, y);
  container.scrollLeft = x; // eslint-disable-line no-param-reassign
}

class TimetableContent extends React.Component<Props, State> {
  override state: State = {
    isScrolledHorizontally: false,
    showExamCalendar: false,
    tombstone: null,
  };

  timetableRef = React.createRef<HTMLDivElement>();

  modifiedCell: ModifiedCell | null = null;

  override componentDidUpdate() {
    if (this.modifiedCell && this.timetableRef.current) {
      maintainScrollPosition(this.timetableRef.current, this.modifiedCell);

      this.modifiedCell = null;
    }
  }

  override componentWillUnmount() {
    this.cancelModifyLesson();
  }

  onScroll: React.UIEventHandler = (e) => {
    // Only trigger when there is an active lesson
    const isScrolledHorizontally =
      !!this.props.activeLesson &&
      e.currentTarget &&
      e.currentTarget.scrollLeft > 0;
    if (this.state.isScrolledHorizontally !== isScrolledHorizontally) {
      this.setState({ isScrolledHorizontally });
    }
  };

  cancelEditLesson = () => {
    if (this.props.editingType) {
      this.props.cancelEditLesson();

      // resetScrollPosition();
    }
  };

  cancelModifyLesson = () => {
    if (this.props.activeLesson) {
      this.props.cancelModifyLesson();

      resetScrollPosition();
    }
  };

  isHiddenInTimetable = (moduleCode: ModuleCode) =>
    this.props.hiddenInTimetable.includes(moduleCode);

  modifyCell = (lesson: ModifiableLesson, position: ClientRect) => {
    if (lesson.isActive) {
      // this.props.toggleSelectLesson(this.props.semester, lesson);
      const { userID, semester, roomID } = this.props;
      const { moduleCode, lessonType, classNo } = lesson;

      // Prevent deselecting all lessons
      if (
        !lesson.isAvailable &&
        (
          this.props.multiUserLessons[userID]?.[semester]?.[moduleCode]?.[
            lessonType
          ] || []
        ).filter((e) => e !== classNo).length === 0
      ) {
        this.props.openNotification(
          `Must select at least one ${lessonType} for ${moduleCode}`,
          {
            timeout: 12000,
            overwritable: true,
          },
        );
      } else {
        const MUTATION = lesson.isAvailable ? CREATE_LESSON : DELETE_LESSON;
        apolloClient
          .mutate({
            mutation: MUTATION,
            variables: {
              roomID: roomID, // TODO: Use variable roomID and name
              userID: userID,
              semester: semester,
              moduleCode: moduleCode,
              lessonType: lessonType,
              classNo: classNo,
            },
          })
          .catch((err) => {
            console.error("CREATE/DELETE_LESSON error: ", err);
          });
      }
    } else {
      // Enter edit mode for the module and lesson type
      this.props.editLesson(this.props.semester, lesson);

      this.modifiedCell = {
        position,
        className: getLessonIdentifier(lesson),
      };
    }
  };

  // Centralized function to send addModule mutation
  addModuleRT = (semester: Semester, moduleCode: ModuleCode) => {
    this.props.addModuleRT(
      this.props.userID,
      semester,
      moduleCode,
      this.props.roomID,
    );
  };

  // Centralized function to send deleteModule mutation
  removeModuleRT = (moduleCode: ModuleCode) => {
    apolloClient
      .mutate({
        mutation: DELETE_MODULE,
        variables: {
          roomID: this.props.roomID, // TODO: Use variable roomID and name
          userID: this.props.userID,
          semester: this.props.semester,
          moduleCode: moduleCode,
        },
      })
      .catch((err) => {
        console.error("DELETE_MODULE error: ", err);
      });
  };

  resetTimetable = () => {
    apolloClient
      .mutate({
        mutation: RESET_TIMETABLE_MUTATION,
        variables: {
          roomID: this.props.roomID, // TODO: Use variable roomID and name
          userID: this.props.userID,
          semester: this.props.semester,
        },
      })
      .catch((err) => {
        console.error("RESET_TIMETABLE error: ", err);
      });
  };

  resetTombstone = () => this.setState({ tombstone: null });

  // Returns modules currently in the timetable
  addedModules(): Module[] {
    const modules = getSemesterModules(
      this.props.multiUserTimetableWithLessons?.[this.props.userID] || {},
      this.props.modules,
    );
    return _.sortBy(modules, (module: Module) =>
      getExamDate(module, this.props.semester),
    );
  }

  toModuleWithColor = (module: Module) => ({
    ...module,
    colorIndex: this.props.colors[module.moduleCode],
    hiddenInTimetable: this.isHiddenInTimetable(module.moduleCode),
  });

  colorLessons = (timetableLessons: Lesson[], colors: ColorMapping) => {
    // Inject color into module
    return (
      timetableLessons
        // Only populate lessons with colors that have been set
        .filter((lesson: Lesson) => lesson.moduleCode in colors)
        .map(
          (lesson: Lesson): ColoredLesson => ({
            ...lesson,
            colorIndex: colors[lesson.moduleCode],
          }),
        )
    );
  };

  renderModuleTable = (
    modules: Module[],
    horizontalOrientation: boolean,
    tombstone: TombstoneModule | null = null,
  ) => (
    <TimetableModulesTable
      userID={this.props.userID}
      modules={modules.map(this.toModuleWithColor)}
      horizontalOrientation={horizontalOrientation}
      semester={this.props.semester}
      onRemoveModule={this.removeModuleRT}
      readOnly={this.props.readOnly}
      tombstone={tombstone}
      resetTombstone={this.resetTombstone}
    />
  );

  // Returns component with table(s) of modules
  renderModuleSections(modules: Module[], horizontalOrientation: boolean) {
    const { tombstone } = this.state;

    // Separate added modules into sections of clashing modules
    const clashes = findExamClashes(modules, this.props.semester);
    const nonClashingMods: Module[] = _.difference(
      modules,
      _.flatten(_.values(clashes)),
    );

    if (_.isEmpty(clashes) && _.isEmpty(nonClashingMods) && !tombstone) {
      return (
        <div className="row">
          <div className="col-sm-12">
            <p className="text-sm-center">No courses added.</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {!_.isEmpty(clashes) && (
          <>
            <div className="alert alert-danger">
              Warning! There are clashes in your exam timetable.
            </div>
            {Object.keys(clashes)
              .sort()
              .map((clashDate) => (
                <div key={clashDate}>
                  <p>
                    Clash on <strong>{formatExamDate(clashDate)}</strong>
                  </p>
                  {this.renderModuleTable(
                    clashes[clashDate],
                    horizontalOrientation,
                  )}
                </div>
              ))}
            <hr />
          </>
        )}
        {this.renderModuleTable(
          nonClashingMods,
          horizontalOrientation,
          tombstone,
        )}
      </>
    );
  }

  override render() {
    const {
      userID,
      semester,
      modules,
      colors,
      editingType,
      multiUserLessons,
      timetableOrientation,
      showTitle,
      readOnly,
      hiddenInTimetable,
      multiUserTimetableWithLessons,
    } = this.props;

    const { showExamCalendar } = this.state;

    const filteredTimetableWithLessons = structuredClone(
      multiUserTimetableWithLessons?.[userID],
    );

    if (editingType)
      // Remove duplicates
      filteredTimetableWithLessons[editingType.moduleCode][
        editingType.lessonType
      ].length = 0;

    let timetableLessons: Lesson[] = timetableLessonsArray(
      filteredTimetableWithLessons,
    )
      // Do not process hidden modules
      .filter((lesson) => !this.isHiddenInTimetable(lesson.moduleCode));

    const multiTimetableLessons = _.values(multiUserTimetableWithLessons).map(
      (timetableWithLessons) => {
        return timetableLessonsArray(timetableWithLessons).filter(
          (lesson) => !this.isHiddenInTimetable(lesson.moduleCode),
        );
      },
    );

    const targetTimetableIdx = _.keys(multiUserTimetableWithLessons).indexOf(
      userID.toString(),
    );

    let optimisedTimetables: Lesson[][] = [];

    const maxsols = 1;

    if (multiTimetableLessons[targetTimetableIdx]) {
      try {
        optimisedTimetables = getOptimisedTimetable(
          multiTimetableLessons,
          targetTimetableIdx,
          maxsols,
        );
      } catch (e) {
        console.error(e);
      }
    }

    // TODO: Set editingType to null when abruptly exiting from edit mode
    if (editingType) {
      const { moduleCode, lessonType } = editingType;
      const module = modules[moduleCode];
      const moduleTimetable = getModuleTimetable(module, semester);
      lessonsForLessonType(moduleTimetable, lessonType).forEach((lesson) => {
        const modifiableLesson: Lesson & {
          isActive?: boolean;
          isAvailable?: boolean;
        } = {
          ...lesson,
          // Inject module code in
          moduleCode,
          title: module.title,
        };

        // Blink animation
        modifiableLesson.isActive = true;
        // Transparency
        modifiableLesson.isAvailable = !isLessonSelected(
          modifiableLesson,
          multiUserLessons[userID]?.[semester] || {},
        );

        timetableLessons.push(modifiableLesson);
      });
    }

    const coloredOptimisedTimetableLessons = this.colorLessons(
      optimisedTimetables[maxsols - 1] || [],
      colors,
    );
    const arrangedOptimisedLessons = arrangeLessonsForWeek(
      coloredOptimisedTimetableLessons,
    );

    const coloredTimetableLessons = this.colorLessons(timetableLessons, colors);
    const arrangedLessons = arrangeLessonsForWeek(coloredTimetableLessons);
    const arrangedLessonsWithModifiableFlag: TimetableArrangement = _.mapValues(
      arrangedLessons,
      (dayRows) =>
        dayRows.map((row) =>
          row.map((lesson) => {
            const module: Module = modules[lesson.moduleCode];
            const moduleTimetable = getModuleTimetable(module, semester);

            return {
              ...lesson,
              isModifiable:
                !readOnly &&
                areOtherClassesAvailable(moduleTimetable, lesson.lessonType),
            };
          }),
        ),
    );

    const isVerticalOrientation = timetableOrientation !== HORIZONTAL;
    const isShowingTitle = !isVerticalOrientation && showTitle;
    const addedModules = this.addedModules();

    return (
      <div
        className={classnames("page-container", styles.container, {
          verticalMode: isVerticalOrientation,
        })}
        onClick={this.cancelEditLesson}
        onKeyUp={(e) => e.key === "Escape" && this.cancelEditLesson()} // Quit modifying when Esc is pressed
      >
        <Title>Timetable</Title>

        <div>{this.props.header}</div>

        <div className="row">
          <div
            className={classnames({
              "col-md-12": !isVerticalOrientation,
              "col-md-8": isVerticalOrientation,
            })}
          >
            <div
              className={styles.timetableWrapper}
              onScroll={this.onScroll}
              ref={this.timetableRef}
            >
              <Timetable
                lessons={arrangedOptimisedLessons}
                isVerticalOrientation={isVerticalOrientation}
                isScrolledHorizontally={this.state.isScrolledHorizontally}
                showTitle={isShowingTitle}
                onModifyCell={() => {}}
              />
              <Timetable
                lessons={arrangedLessonsWithModifiableFlag}
                isVerticalOrientation={isVerticalOrientation}
                isScrolledHorizontally={this.state.isScrolledHorizontally}
                showTitle={isShowingTitle}
                onModifyCell={this.modifyCell}
              />
            </div>
          </div>
          <div
            className={classnames({
              "col-md-12": !isVerticalOrientation,
              "col-md-4": isVerticalOrientation,
            })}
          >
            <div className="row">
              <div className="col-12 no-export">
                <TimetableActions
                  isVerticalOrientation={isVerticalOrientation}
                  showTitle={isShowingTitle}
                  semester={semester}
                  multiTimetable={
                    this.props.multiUserLessons[userID]?.[semester]
                  }
                  showExamCalendar={showExamCalendar}
                  resetTimetable={this.resetTimetable}
                  toggleExamCalendar={() =>
                    this.setState({ showExamCalendar: !showExamCalendar })
                  }
                  hiddenModules={hiddenInTimetable}
                />
                <button className="TimetableActions-titleBtn btn-outline-primary btn btn-svg" onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(multiTimetableLessons, null, 4));
                }}>Copy as JSON</button>
              </div>

              <div className={styles.modulesSelect}>
                {!readOnly && (
                  <ModulesSelectContainer
                    semester={semester}
                    multiTimetable={
                      this.props.multiUserLessons[userID]?.[semester] || {}
                    }
                    addModule={this.addModuleRT}
                    removeModuleRT={this.removeModuleRT}
                  />
                )}
              </div>

              <div className="col-12">
                {this.renderModuleSections(
                  addedModules,
                  !isVerticalOrientation,
                )}
              </div>
              {/* <div className="col-12">
                <ModulesTableFooter
                  modules={addedModules}
                  semester={semester}
                  hiddenInTimetable={hiddenInTimetable}
                />
              </div> */}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: StoreState, ownProps: OwnProps) {
  const { semester, readOnly, roomID, userID } = ownProps;
  const { modules } = state.moduleBank;
  const { multiUserLessons } = state.timetables;

  const multiUserTimetableWithLessons: MultiUserSemTimetableConfigWithLessons =
    _.mapValues(
      multiUserLessons,
      (timetableMultiConfig: TimetableMultiConfig) => {
        // TODO: handle possibility of non-existent SemConfig
        return hydrateSemTimetableWithMultiLessons(
          timetableMultiConfig?.[semester] || {},
          modules,
          semester,
        );
      },
    );

  // Determine the key to check for hidden modules based on readOnly status
  const hiddenModulesKey = readOnly ? HIDDEN_IMPORTED_SEM : semester;
  const hiddenInTimetable =
    state.timetables.multiUserHidden?.[userID]?.[hiddenModulesKey] || [];

  return {
    semester,
    multiUserTimetableWithLessons,
    modules,
    roomID,
    userID,
    activeLesson: state.app.activeLesson,
    editingType: state.timetables.editingType,
    multiUserLessons: state.timetables.multiUserLessons,
    timetableOrientation: state.theme.timetableOrientation,
    showTitle: state.theme.showTitle,
    hiddenInTimetable,
  };
}

export default connect(mapStateToProps, {
  addModuleRT,
  resetTimetable,
  modifyLesson,
  editLesson,
  // toggleSelectLesson,
  changeLesson,
  cancelModifyLesson,
  cancelEditLesson,
  openNotification,
})(TimetableContent);
