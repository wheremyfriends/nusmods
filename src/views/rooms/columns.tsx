import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Room = {
  roomID: string;
  lastAccessed: Date | undefined;
};

export const columns: ColumnDef<Room>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "roomID",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          RoomID
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: (props: any) => (
      <Link
        className="text-[color:var(--body-color)]"
        to={`/${props.getValue()}`}
      >
        {props.getValue()}
      </Link>
    ),
  },
  {
    accessorKey: "lastAccessed",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Accessed
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      );
    },
    cell: (props: any) => (
      <span>
        {props.getValue()
          ? format(props.getValue(), "dd MMM yyyy, hh:mm a")
          : "-"}
      </span>
    ),
  },
];
