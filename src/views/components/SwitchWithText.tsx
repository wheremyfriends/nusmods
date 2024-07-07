import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import React from "react";

type Props = {
  checked?: boolean;
  onCheckedChange?: (arg: boolean) => void;
};
export default function SwitchWithText({ checked, onCheckedChange }: Props) {
  const id = React.useId();

  return (
    <fieldset className="flex items-center space-x-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="my-0">
        {checked ? "Enabled" : "Disabled"}
      </Label>
    </fieldset>
  );
}
