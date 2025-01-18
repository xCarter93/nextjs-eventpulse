"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AgGridReact } from "ag-grid-react";
import {
	type ColDef,
	type ICellRendererParams,
	type CellValueChangedEvent,
	ModuleRegistry,
	ClientSideRowModelModule,
	GridOptions,
	themeQuartz,
	colorSchemeLightCold,
	colorSchemeDarkBlue,
	TextEditorModule,
	ValidationModule,
	RowSelectionModule,
	PaginationModule,
	DateEditorModule,
	RowStyleModule,
} from "ag-grid-community";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

// Register AG Grid Modules
ModuleRegistry.registerModules([
	ClientSideRowModelModule,
	TextEditorModule,
	ValidationModule,
	RowSelectionModule,
	PaginationModule,
	DateEditorModule,
	RowStyleModule,
]);

interface Recipient {
	_id: Id<"recipients">;
	_creationTime: number;
	name: string;
	email: string;
	birthday: number;
	userId: Id<"users">;
}

interface ActionCellRendererProps extends ICellRendererParams {
	data: Recipient;
	onDelete: (id: Id<"recipients">) => void;
}

const ActionCellRenderer = (props: ActionCellRendererProps) => {
	return (
		<div className="flex justify-center py-1">
			<Button
				variant="destructive"
				size="sm"
				onClick={(e) => {
					e.stopPropagation();
					props.onDelete(props.data._id);
				}}
				className="h-7 px-2"
			>
				Delete
			</Button>
		</div>
	);
};

export function RecipientsTable() {
	const router = useRouter();
	const { theme } = useTheme();

	const recipients = useQuery(api.recipients.getRecipients);
	const updateRecipient = useMutation(api.recipients.updateRecipient);
	const deleteRecipient = useMutation(api.recipients.deleteRecipient);

	const gridTheme = themeQuartz.withPart(
		theme === "dark" ? colorSchemeDarkBlue : colorSchemeLightCold
	);

	const defaultColDef = {
		sortable: true,
		resizable: true,
		editable: true,
	};

	const gridOptions: GridOptions<Recipient> = {
		suppressCellFocus: true,
		rowHeight: 48,
		headerHeight: 48,
		suppressMovableColumns: true,
		animateRows: true,
		rowSelection: "single",
		...defaultColDef,
		onRowClicked: (event) => {
			// Check if we're clicking the delete button or its container
			const target = event.event?.target as HTMLElement;
			const isDeleteButton = target?.closest("button") !== null;

			if (event.data && !isDeleteButton) {
				router.push(`/recipients/${event.data._id}`);
			}
		},
		rowStyle: { cursor: "pointer" },
	};

	const handleDelete = async (id: Id<"recipients">) => {
		try {
			await deleteRecipient({ id });
			toast.success("Recipient deleted successfully");
		} catch (error) {
			toast.error("Failed to delete recipient");
			console.error(error);
		}
	};

	const handleCellValueChanged = async (event: CellValueChangedEvent) => {
		try {
			await updateRecipient({
				id: event.data._id,
				name: event.data.name,
				email: event.data.email,
				birthday: event.data.birthday,
			});
			toast.success("Recipient updated successfully");
		} catch (error) {
			toast.error("Failed to update recipient");
			console.error(error);
		}
	};

	const columnDefs: ColDef<Recipient>[] = [
		{
			field: "name",
			headerName: "Name",
			flex: 1,
			editable: true,
			cellEditor: "agTextCellEditor",
		},
		{
			field: "email",
			headerName: "Email",
			flex: 1,
			editable: true,
			cellEditor: "agTextCellEditor",
		},
		{
			field: "birthday",
			headerName: "Birthday",
			flex: 1,
			editable: true,
			valueFormatter: (params) => {
				if (!params.value) return "";
				const date = new Date(params.value);
				return format(date, "MMMM d, yyyy");
			},
			valueGetter: (params) => {
				if (!params.data?.birthday) return null;
				const date = new Date(params.data.birthday);
				return date;
			},
			valueSetter: (params) => {
				if (!params.data) return false;
				const newValue = params.newValue;
				const timestamp =
					newValue instanceof Date
						? newValue.getTime()
						: new Date(newValue).getTime();
				if (isNaN(timestamp)) return false;
				params.data.birthday = timestamp;
				return true;
			},
			cellEditor: "agDateCellEditor",
			cellEditorParams: {
				browserDatePicker: true,
			},
		},
		{
			headerName: "Actions",
			minWidth: 100,
			cellRenderer: ActionCellRenderer,
			cellRendererParams: {
				onDelete: handleDelete,
			},
		},
	];

	return (
		<div style={{ height: "500px" }}>
			{recipients && (
				<AgGridReact
					gridOptions={gridOptions}
					rowData={recipients}
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					theme={gridTheme}
					pagination={true}
					paginationAutoPageSize={true}
					onCellValueChanged={handleCellValueChanged}
				/>
			)}
		</div>
	);
}
