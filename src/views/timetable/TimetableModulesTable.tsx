import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import classnames from "classnames";
import { sortBy } from "lodash";
import produce from "immer";

import { Crosshair, Eye, EyeOff, Trash } from "react-feather";
import { ModuleWithColor, TombstoneModule } from "types/views";
import { ColorIndex } from "types/timetables";
import { ModuleCode, Semester, UserID } from "types/modules";
import { State as StoreState } from "types/state";
import { ModuleTableOrder } from "types/reducers";

import ColorPicker from "views/components/ColorPicker";
import {
  focusLessonInTimetable,
  hideLessonInTimetable,
  selectModuleColor,
  showLessonInTimetable,
  unfocusLessonInTimetable,
} from "actions/timetables";
import { getExamDate, getFormattedExamDate, renderMCs } from "utils/modules";
import { intersperse } from "utils/array";
import { BULLET_NBSP } from "utils/react";
import { modulePage, semesterForTimetablePage } from "views/routes/paths";
import elements from "views/elements";
import Tooltip from "views/components/Tooltip";
import config from "config";

import styles from "./TimetableModulesTable.scss";
import ModuleTombstone from "./ModuleTombstone";
import { moduleOrders } from "./ModulesTableFooter";

export type Props = {
  userID: UserID;
  semester: Semester;
  readOnly: boolean;
  horizontalOrientation: boolean;
  moduleTableOrder: ModuleTableOrder;
  modules: ModuleWithColor[];
  tombstone: TombstoneModule | null; // Placeholder for a deleted module

  // Actions
  selectModuleColor: (
    semester: Semester,
    moduleCode: ModuleCode,
    colorIndex: ColorIndex,
  ) => void;
  hideLessonInTimetable: (
    userID: UserID,
    semester: Semester,
    moduleCode: ModuleCode,
  ) => void;
  showLessonInTimetable: (
    userID: UserID,
    semester: Semester,
    moduleCode: ModuleCode,
  ) => void;
  focusLessonInTimetable: (
    userID: UserID,
    semester: Semester,
    moduleCode: ModuleCode,
  ) => void;
  unfocusLessonInTimetable: (userID: UserID, semester: Semester) => void;
  onRemoveModule: (moduleCode: ModuleCode) => void;
  resetTombstone: () => void;
  undoTombstone: () => void;
};

export const TimetableModulesTableComponent: React.FC<Props> = (props) => {
  const renderModuleActions = (module: ModuleWithColor) => {
    const hideBtnLabel = `${module.hiddenInTimetable ? "Show" : "Hide"} ${module.moduleCode}`;
    const removeBtnLabel = `Remove ${module.moduleCode} from timetable`;
    const focusBtnLabel = `${module.focused ? "Unfocus" : "Focus"} ${module.moduleCode}`;
    const { userID, semester } = props;

    return (
      <div className={styles.moduleActionButtons}>
        <div className="btn-group">
          <Tooltip content={removeBtnLabel} touch="hold">
            <button
              type="button"
              className={classnames(
                "btn btn-outline-secondary btn-svg",
                styles.moduleAction,
              )}
              aria-label={removeBtnLabel}
              onClick={() => props.onRemoveModule(module.moduleCode)}
            >
              <Trash className={styles.actionIcon} />
            </button>
          </Tooltip>
          <Tooltip content={hideBtnLabel} touch="hold">
            <button
              type="button"
              className={classnames(
                "btn btn-outline-secondary btn-svg",
                styles.moduleAction,
              )}
              aria-label={hideBtnLabel}
              onClick={() => {
                if (module.hiddenInTimetable) {
                  props.showLessonInTimetable(
                    userID,
                    semester,
                    module.moduleCode,
                  );
                } else {
                  props.hideLessonInTimetable(
                    userID,
                    semester,
                    module.moduleCode,
                  );
                }
              }}
            >
              {module.hiddenInTimetable ? (
                <Eye className={styles.actionIcon} />
              ) : (
                <EyeOff className={styles.actionIcon} />
              )}
            </button>
          </Tooltip>
          <Tooltip content={focusBtnLabel} touch="hold">
            <button
              type="button"
              className={classnames(
                "btn btn-svg",
                styles.moduleAction,
                module.focused ? "btn-secondary" : "btn-outline-secondary",
              )}
              aria-label={focusBtnLabel}
              onClick={() => {
                if (module.focused)
                  props.unfocusLessonInTimetable(userID, semester);
                else
                  props.focusLessonInTimetable(
                    userID,
                    semester,
                    module.moduleCode,
                  );
              }}
            >
              <Crosshair className={styles.actionIcon} />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  };

  const renderModule = (module: ModuleWithColor) => {
    const { semester, readOnly, tombstone, resetTombstone, undoTombstone } =
      props;

    if (tombstone && tombstone.moduleCode === module.moduleCode) {
      return (
        <ModuleTombstone
          module={module}
          undoTombstone={undoTombstone}
          resetTombstone={resetTombstone}
        />
      );
    }

    // Second row of text consists of the exam date and the MCs
    const secondRowText = [renderMCs(module.moduleCredit)];
    if (config.examAvailabilitySet.has(semester)) {
      secondRowText.unshift(
        getExamDate(module, semester)
          ? `Exam: ${getFormattedExamDate(module, semester)}`
          : "No Exam",
      );
    }

    return (
      <>
        <div className={styles.moduleColor}>
          <ColorPicker
            label={`Change ${module.moduleCode} timetable color`}
            color={module.colorIndex}
            isHidden={module.hiddenInTimetable}
            onChooseColor={(colorIndex: ColorIndex) => {
              props.selectModuleColor(semester, module.moduleCode, colorIndex);
            }}
          />
        </div>
        <div className={styles.moduleInfo}>
          {!readOnly && renderModuleActions(module)}
          <a
            href={
              `https://nusmods.com` +
              modulePage(module.moduleCode, module.title)
            }
            target="_blank"
          >
            {module.moduleCode} {module.title}
          </a>
          <div className={styles.moduleExam}>
            {intersperse(secondRowText, BULLET_NBSP)}
          </div>
        </div>
      </>
    );
  };

  const { semester, tombstone, horizontalOrientation, moduleTableOrder } =
    props;
  let { modules } = props;

  // tombstone contains the data for the last deleted module. We insert it back
  // so that it gets sorted into its original location, then in renderModule()
  // takes care of rendering the tombstone
  if (
    tombstone &&
    !modules.some((module) => module.moduleCode === tombstone.moduleCode)
  ) {
    modules = produce(modules, (draft: ModuleWithColor[]) => {
      draft.splice(tombstone.index, 0, tombstone);
    });
  }
  modules = sortBy(modules, (module) =>
    moduleOrders[moduleTableOrder].orderBy(module, semester),
  );

  return (
    <div
      className={classnames(styles.modulesTable, elements.moduleTable, "row")}
    >
      {modules.map((module) => (
        <div
          className={classnames(
            styles.modulesTableRow,
            "col-sm-6",
            horizontalOrientation ? "col-lg-4" : "col-md-12",
          )}
          key={module.moduleCode}
        >
          {renderModule(module)}
        </div>
      ))}
    </div>
  );
};

export default connect(
  (state: StoreState) => ({
    moduleTableOrder: state.settings.moduleTableOrder,
  }),
  {
    selectModuleColor,
    hideLessonInTimetable,
    showLessonInTimetable,
    focusLessonInTimetable,
    unfocusLessonInTimetable,
  },
)(React.memo(TimetableModulesTableComponent));
