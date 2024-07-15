import Modal from "./Modal";
import React, { useContext } from "react";
import { X } from "react-feather";
import Input from "./Input";
import SwitchWithText from "./SwitchWithText";
import { TimetableGeneratorConfig } from "types/timetables";
import { useDispatch, useSelector } from "react-redux";
import { updateTimetableGenConf } from "actions/timetables";
import { subscribeToConfigChanges, updateConfig } from "utils/graphql";
import { apolloClient } from "views/timetable/TimetableContent";
import { RoomContext } from "views/timetable/RoomContext";
import { State } from "types/state";

type Break = {
  start: string;
  end: string;
};

function addBreak(inp: Break[]) {
  return [...inp, { start: "", end: "" }];
}

function delBreak(inp: Break[], ind: number) {
  return inp.filter((_, i) => i !== ind);
}

function editBreak(
  inp: Break[],
  key: "start" | "end",
  val: string,
  ind: number,
) {
  return inp.map((b, i) => (i === ind ? { ...b, [key]: val } : b));
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
};
export default function TimetableGeneratorConfigModal({
  isOpen,
  onClose,
}: Props) {
  const { roomID, userID } = useContext(RoomContext);

  const config = useSelector((state: State) => {
    return state.timetables.timetableGeneratorConfig;
  });
  const {
    prefDaysEnabled,
    maxDistEnabled,
    breaksEnabled,
    prefDays,
    maxDist,
    minDuration,
    breaks,
  } = config;
  const dispatch = useDispatch();

  React.useEffect(() => {
    subscribeToConfigChanges(apolloClient, userID, (newConf) => {
      dispatch(updateTimetableGenConf(newConf));
    });
  }, [apolloClient, userID]);

  function handleClose() {
    onClose();
  }

  function handleChange(newConf: TimetableGeneratorConfig) {
    updateConfig(apolloClient, roomID, userID, newConf);
  }

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} animate>
      <h1>Configuration</h1>
      Configuration for the timetable generation algorithm
      <hr className="mt-5" />
      <fieldset>
        <SwitchWithText
          checked={prefDaysEnabled}
          onCheckedChange={(val) =>
            handleChange({ ...config, prefDaysEnabled: val })
          }
        />
        <Input
          label="Preferred Days"
          placeholder="5, 3, 4"
          helperText="Ranking of days separated by comma. 0 = Sunday, 1 = Monday etc"
          disabled={!prefDaysEnabled}
          value={prefDays}
          onChange={(e) => {
            handleChange({ ...config, prefDays: e.target.value });
          }}
        />
      </fieldset>
      <hr className="mt-5" />
      <fieldset>
        <SwitchWithText
          checked={maxDistEnabled}
          onCheckedChange={(val) =>
            handleChange({ ...config, maxDistEnabled: val })
          }
        />
        <Input
          type="number"
          label="Maximum Distance (km)"
          helperText="Maximum allowable travel distance for back to back classes"
          placeholder="0.8"
          disabled={!maxDistEnabled}
          value={maxDist}
          onChange={(e) => handleChange({ ...config, maxDist: e.target.value })}
        />
      </fieldset>
      <hr className="mt-5" />
      <fieldset>
        <SwitchWithText
          checked={breaksEnabled}
          onCheckedChange={(val) =>
            handleChange({ ...config, breaksEnabled: val })
          }
        />
        <Input
          type="number"
          label="Minimum Break Duration (mins)"
          helperText="Minimum consecutive minutes to be free from classes"
          placeholder="60"
          disabled={!breaksEnabled}
          value={minDuration}
          onChange={(e) =>
            handleChange({
              ...config,
              minDuration: e.target.value,
            })
          }
        />
        <div
          className="grid gap-x-2 gap-y-2 items-end"
          style={{ gridTemplateColumns: "1fr 1fr auto" }}
        >
          {breaks.map((b, ind) => (
            <React.Fragment key={ind}>
              <Input
                label={ind === 0 ? "Start" : undefined}
                type="time"
                disabled={!breaksEnabled}
                value={b.start}
                onChange={(event) =>
                  handleChange({
                    ...config,
                    breaks: editBreak(breaks, "start", event.target.value, ind),
                  })
                }
              />
              <Input
                label={ind === 0 ? "End" : undefined}
                type="time"
                disabled={!breaksEnabled}
                value={b.end}
                onChange={(event) =>
                  handleChange({
                    ...config,
                    breaks: editBreak(breaks, "end", event.target.value, ind),
                  })
                }
              />
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  handleChange({
                    ...config,
                    breaks: delBreak(breaks, ind),
                  });
                }}
              >
                <X />
              </button>
            </React.Fragment>
          ))}
        </div>
        <button
          className="btn btn-outline-primary mt-5"
          onClick={() => {
            handleChange({
              ...config,
              breaks: addBreak(breaks),
            });
          }}
        >
          Add time range
        </button>
        <div className="text-sm text-grey-900">
          The reason for multiple time ranges is to allow for you to have
          disjointed break (e.g 11am-12pm and 1pm-2pm)
        </div>
      </fieldset>
    </Modal>
  );
}
