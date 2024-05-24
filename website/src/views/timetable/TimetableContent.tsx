import * as React from 'react';
import classnames from 'classnames';
import { connect, useDispatch } from 'react-redux';
import _, { get } from 'lodash';

import { ColorMapping, HORIZONTAL, ModulesMap, TimetableOrientation, NotificationOptions } from 'types/reducers';
import { Module, ModuleCode, LessonType, Semester, ClassNo } from 'types/modules';
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
} from 'types/timetables';

import {
  addModule,
  cancelModifyLesson,
  changeLesson,
  HIDDEN_IMPORTED_SEM,
  modifyLesson,
  editLesson,
  cancelEditLesson,
  // toggleSelectLesson,
  removeModule,
  resetTimetable,
  resetInternalSelections,
  selectLesson,
  deselectLesson,
  addModuleRT,
} from 'actions/timetables';
import {
  areLessonsSameClass,
  isLessonSelected,
  formatExamDate,
  getExamDate,
  getModuleTimetable,
} from 'utils/modules';
import {
  areOtherClassesAvailable,
  arrangeLessonsForWeek,
  findExamClashes,
  getLessonIdentifier,
  getSemesterModules,
  hydrateSemTimetableWithLessons,
  hydrateSemTimetableWithMultiLessons,
  lessonsForLessonType,
  randomModuleLessonConfig,
  timetableLessonsArray,
} from 'utils/timetables';
import { resetScrollPosition } from 'utils/react';
import ModulesSelectContainer from 'views/timetable/ModulesSelectContainer';
import Title from 'views/components/Title';
import ErrorBoundary from 'views/errors/ErrorBoundary';
import { State as StoreState } from 'types/state';
import { TombstoneModule } from 'types/views';
import Timetable from './Timetable';
import TimetableActions from './TimetableActions';
import TimetableModulesTable from './TimetableModulesTable';
import ModulesTableFooter from './ModulesTableFooter';
import styles from './TimetableContent.scss';

import { ApolloClient, InMemoryCache, ApolloProvider, gql, FetchResult } from '@apollo/client';

import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { openNotification } from 'actions/app';
import { fetchModule } from 'actions/moduleBank';
import type { Dispatch, GetState } from 'types/redux';
import { Action } from 'actions/constants';

export const CREATE_USER = gql`
  mutation CreateUser($roomID: String!, $name: String!) {
    createUser(roomID: $roomID, name: $name)
  }
`;

export const CREATE_LESSON = gql`
  mutation CreateLesson($roomID: String!, $name: String!, $semester: Int!, $moduleCode: String!, $lessonType: String!, $classNo: String!) {
    createLesson(roomID: $roomID, name: $name, semester: $semester, moduleCode: $moduleCode, lessonType: $lessonType, classNo: $classNo)
  }
`;

export const DELETE_LESSON = gql`
  mutation DeleteLesson($roomID: String!, $name: String!, $semester: Int!, $moduleCode: String!, $lessonType: String!, $classNo: String!) {
    deleteLesson(roomID: $roomID, name: $name, semester: $semester, moduleCode: $moduleCode, lessonType: $lessonType, classNo: $classNo)
  }
  `;

export const DELETE_MODULE = gql`
  mutation DeleteModule($roomID: String!, $name: String!, $semester: Int!, $moduleCode: String!) {
    deleteModule(roomID: $roomID, name: $name, semester: $semester, moduleCode: $moduleCode)
  }
  `;

// TODO: Proper URL variable
const wsLink = new GraphQLWsLink(createClient({
  url: 'ws://localhost:4000/graphql',
}));

export const apolloClient = new ApolloClient({
  uri: 'http://localhost:4000/graphql/',
  link: wsLink,
  cache: new InMemoryCache(),
});

// apolloClient
//   .mutate({
//     mutation: CREATE_USER,
//     variables: {
//       roomID: "room1", // TODO: Use variable roomID and name
//       name: "ks",
//     }
//   })
// // .then((result) => console.log(result));

type ModifiedCell = {
  className: string;
  position: ClientRect;
};

type OwnProps = {
  // Own props
  readOnly: boolean;
  header: React.ReactNode;
  semester: Semester;
  timetable: SemTimetableConfig;
  colors: ColorMapping;
};

type Props = OwnProps & {
  // From Redux
  timetableWithLessons: SemTimetableConfigWithLessons;
  multiLessons: TimetableMultiConfig;
  modules: ModulesMap;
  activeLesson: Lesson | null;
  editingType: EditingType | null;
  timetableOrientation: TimetableOrientation;
  showTitle: boolean;
  hiddenInTimetable: ModuleCode[];

  // Actions
  addModule: (semester: Semester, moduleCode: ModuleCode) => void;
  addModuleRT: (semester: Semester, moduleCode: ModuleCode) => void;
  removeModule: (semester: Semester, moduleCode: ModuleCode) => void;
  resetTimetable: (semester: Semester) => void;
  resetInternalSelections: (semester: Semester) => void;
  modifyLesson: (lesson: Lesson) => void;
  editLesson: (semester: Semester, lesson: Lesson) => void;
  // toggleSelectLesson: (semester: Semester, lesson: Lesson) => void;
  changeLesson: (semester: Semester, lesson: Lesson) => void;
  cancelModifyLesson: () => void;
  cancelEditLesson: () => void;
  selectLesson: (semester: Semester, moduleCode: ModuleCode, lessonType: LessonType, classNo: ClassNo) => void;
  deselectLesson: (semester: Semester, moduleCode: ModuleCode, lessonType: LessonType, classNo: ClassNo) => void;
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
function maintainScrollPosition(container: HTMLElement, modifiedCell: ModifiedCell) {
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

  constructor(props: any) {
    super(props);
    this.resetTimetable();
    this.resetInternalSelections();
    const self = this;
    apolloClient.subscribe({
      query: gql`
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
  `,
      variables: {
        roomID: "room1",
      },
    }).subscribe({
      next(data) {
        // console.log("data", data);
        if (data.data) {
          self.handleLessonChange(data.data.lessonChange);
        }
      }, error(error) {
        console.log("Apollo subscribe error", error);
      },
      complete() {
      },
    })
  }

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
      !!this.props.activeLesson && e.currentTarget && e.currentTarget.scrollLeft > 0;
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
      const { semester } = this.props;
      const { moduleCode, lessonType, classNo } = lesson;

      // Prevent deselecting all lessons
      if (!lesson.isAvailable && (this.props.multiLessons[semester]?.[moduleCode]?.[lessonType] || [])
        .filter(e => e !== classNo).length === 0) {
        this.props.openNotification(`Must select at least one ${lessonType} for ${moduleCode}`,
          {
            timeout: 12000,
            overwritable: true,
          });
      } else {
        const MUTATION = lesson.isAvailable ? CREATE_LESSON : DELETE_LESSON;
        apolloClient
          .mutate({
            mutation: MUTATION,
            variables: {
              roomID: "room1", // TODO: Use variable roomID and name
              name: "ks",
              semester: semester,
              moduleCode: moduleCode,
              lessonType: lessonType,
              classNo: classNo
            }
          })
        // .then((result) => console.log(result));
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

  isModuleInTimetable = (
    moduleCode: ModuleCode,
    timetable: SemTimetableConfig,
  ): boolean => {
    return !!get(timetable, moduleCode);
  }

  handleLessonChange = (lessonChange: LessonChange) => {
    // TODO: Include semester param
    // TODO: Check if request is intended for correct user via name
    const { action, name, semester, moduleCode, lessonType, classNo } = lessonChange;
    const activeSemester = this.props.semester;

    if (semester != activeSemester)
      return;

    console.log(lessonChange)
    switch (action) {
      case Action.CREATE_LESSON: {
        if (!this.isModuleInTimetable(moduleCode, this.props.timetable)) {
          this.addModule(semester, moduleCode);
        }

        this.selectLesson(semester, moduleCode, lessonType, classNo);
        return;
      }

      case Action.DELETE_LESSON: {
        this.deselectLesson(semester, moduleCode, lessonType, classNo);
        return;

      }
      case Action.DELETE_MODULE: {
        this.removeModuleLocal(moduleCode);
        return;
      }
      default:
        return;
    }
  }

  deselectLesson = (semester: Semester, moduleCode: ModuleCode, lessonType: LessonType, classNo: ClassNo) => {
    this.props.deselectLesson(semester, moduleCode, lessonType, classNo);
  }

  selectLesson = (semester: Semester, moduleCode: ModuleCode, lessonType: LessonType, classNo: ClassNo) => {
    this.props.selectLesson(semester, moduleCode, lessonType, classNo);
  };

  addModuleRT = (semester: Semester, moduleCode: ModuleCode) => {
    this.props.addModuleRT(semester, moduleCode);
  };

  // Old functionality, still used for adding to module table
  addModule = (semester: Semester, moduleCode: ModuleCode) => {
    this.props.addModule(semester, moduleCode);
    this.resetTombstone();
  };

  removeModuleRT = (moduleCode: ModuleCode) => {
    apolloClient
      .mutate({
        mutation: DELETE_MODULE,
        variables: {
          roomID: "room1", // TODO: Use variable roomID and name
          name: "ks",
          semester: this.props.semester,
          moduleCode: moduleCode,
        }
      })
    // .then((result) => console.log(result));
  }

  removeModuleLocal = (moduleCode: ModuleCode) => {
    // TODO: Implement GraphQL remove entire module and UNDO
    this.removeModule(moduleCode);
  }

  removeModule = (moduleCodeToRemove: ModuleCode) => {
    // Save the index of the module before removal so the tombstone can be inserted into
    // the correct position
    // const index = this.addedModules().findIndex(
    //   ({ moduleCode }) => moduleCode === moduleCodeToRemove,
    // );
    this.props.removeModule(this.props.semester, moduleCodeToRemove);
    
    // Does not work with RT as addedModules uses this.props.timetableWithLessons which has been merged with RT lessons
    // const moduleWithColor = this.toModuleWithColor(this.addedModules()[index]);

    // A tombstone is displayed in place of a deleted module
    // this.setState({ tombstone: { ...moduleWithColor, index } });
  };

  resetInternalSelections = () => {
    this.props.resetInternalSelections(this.props.semester);
  };

  resetTimetable = () => {
    this.props.resetTimetable(this.props.semester);
  };

  resetTombstone = () => this.setState({ tombstone: null });

  // Returns modules currently in the timetable
  addedModules(): Module[] {
    const modules = getSemesterModules(this.props.timetableWithLessons, this.props.modules);
    return _.sortBy(modules, (module: Module) => getExamDate(module, this.props.semester));
  }

  toModuleWithColor = (module: Module) => ({
    ...module,
    colorIndex: this.props.colors[module.moduleCode],
    hiddenInTimetable: this.isHiddenInTimetable(module.moduleCode),
  });

  renderModuleTable = (
    modules: Module[],
    horizontalOrientation: boolean,
    tombstone: TombstoneModule | null = null,
  ) => (
    <TimetableModulesTable
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
    const nonClashingMods: Module[] = _.difference(modules, _.flatten(_.values(clashes)));

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
                  {this.renderModuleTable(clashes[clashDate], horizontalOrientation)}
                </div>
              ))}
            <hr />
          </>
        )}
        {this.renderModuleTable(nonClashingMods, horizontalOrientation, tombstone)}
      </>
    );
  }

  override render() {
    const {
      semester,
      modules,
      colors,
      activeLesson,
      editingType,
      multiLessons,
      timetableOrientation,
      showTitle,
      readOnly,
      hiddenInTimetable,
    } = this.props;

    const { showExamCalendar } = this.state;

    const filteredTimetableWithLessons = {
      ...this.props.timetableWithLessons,
    };

    if (editingType)
      // Remove duplicates
      filteredTimetableWithLessons[editingType.moduleCode][editingType.lessonType].length = 0;

    let timetableLessons: Lesson[] = timetableLessonsArray(filteredTimetableWithLessons)
      // Do not process hidden modules
      .filter((lesson) => !this.isHiddenInTimetable(lesson.moduleCode));

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
        modifiableLesson.isAvailable = isLessonSelected(modifiableLesson, multiLessons[semester]) ? false : true;

        timetableLessons.push(modifiableLesson);
      });
    }

    // Inject color into module
    const coloredTimetableLessons = timetableLessons.map(
      (lesson: Lesson): ColoredLesson => ({
        ...lesson,
        colorIndex: colors[lesson.moduleCode],
      }),
    );

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
                !readOnly && areOtherClassesAvailable(moduleTimetable, lesson.lessonType),
            };
          }),
        ),
    );

    const isVerticalOrientation = timetableOrientation !== HORIZONTAL;
    const isShowingTitle = !isVerticalOrientation && showTitle;
    const addedModules = this.addedModules();

    return (
      <div
        className={classnames('page-container', styles.container, {
          verticalMode: isVerticalOrientation,
        })}
        onClick={this.cancelEditLesson}
        onKeyUp={(e) => e.key === 'Escape' && this.cancelEditLesson()} // Quit modifying when Esc is pressed
      >
        <Title>Timetable</Title>

        <div>{this.props.header}</div>

        <div className="row">
          <div
            className={classnames({
              'col-md-12': !isVerticalOrientation,
              'col-md-8': isVerticalOrientation,
            })}
          >
            <div
              className={styles.timetableWrapper}
              onScroll={this.onScroll}
              ref={this.timetableRef}
            >
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
              'col-md-12': !isVerticalOrientation,
              'col-md-4': isVerticalOrientation,
            })}
          >
            <div className="row">
              <div className="col-12 no-export">
                <TimetableActions
                  isVerticalOrientation={isVerticalOrientation}
                  showTitle={isShowingTitle}
                  semester={semester}
                  timetable={this.props.timetable}
                  showExamCalendar={showExamCalendar}
                  resetTimetable={this.resetTimetable}
                  toggleExamCalendar={() => this.setState({ showExamCalendar: !showExamCalendar })}
                  hiddenModules={hiddenInTimetable}
                />
              </div>

              <div className={styles.modulesSelect}>
                {!readOnly && (
                  <ModulesSelectContainer
                    semester={semester}
                    timetable={this.props.timetable}
                    addModule={this.addModuleRT}
                    removeModule={this.removeModuleRT}
                  />
                )}
              </div>

              <div className="col-12">
                {this.renderModuleSections(addedModules, !isVerticalOrientation)}
              </div>
              <div className="col-12">
                <ModulesTableFooter
                  modules={addedModules}
                  semester={semester}
                  hiddenInTimetable={hiddenInTimetable}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state: StoreState, ownProps: OwnProps) {
  const { semester, timetable, readOnly } = ownProps;
  const { modules } = state.moduleBank;
  const { multiLessons } = state.timetables;

  const timetableWithLessons = hydrateSemTimetableWithMultiLessons(timetable, multiLessons[semester], modules, semester);

  // Determine the key to check for hidden modules based on readOnly status
  const hiddenModulesKey = readOnly ? HIDDEN_IMPORTED_SEM : semester;
  const hiddenInTimetable = state.timetables.hidden[hiddenModulesKey] || [];

  return {
    semester,
    timetable,
    timetableWithLessons,
    modules,
    activeLesson: state.app.activeLesson,
    editingType: state.timetables.editingType,
    multiLessons: state.timetables.multiLessons,
    timetableOrientation: state.theme.timetableOrientation,
    showTitle: state.theme.showTitle,
    hiddenInTimetable,
  };
}

export default connect(mapStateToProps, {
  addModule,
  addModuleRT,
  removeModule,
  resetTimetable,
  resetInternalSelections,
  modifyLesson,
  editLesson,
  // toggleSelectLesson,
  changeLesson,
  cancelModifyLesson,
  cancelEditLesson,
  selectLesson,
  deselectLesson,
  openNotification
})(TimetableContent);
