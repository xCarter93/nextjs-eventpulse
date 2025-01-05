"use client";

import { useState } from "react";
import { type Recipient } from "@/types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { AgGridReact } from "ag-grid-react";
import {
	type ColDef,
	type ICellRendererParams,
	ModuleRegistry,
	ClientSideRowModelModule,
	themeQuartz,
	colorSchemeLightCold,
	colorSchemeDarkBlue,
} from "ag-grid-community";
import { format } from "date-fns";
import { useTheme } from "next-themes";

// Register AG Grid Modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

// Mock data - would come from your database
const initialRecipients: Recipient[] = [
	{
		id: "1",
		name: "Alice Johnson",
		email: "alice@example.com",
		birthday: new Date(1990, 5, 15),
		userId: "user1",
	},
	{
		id: "2",
		name: "Bob Smith",
		email: "bob@example.com",
		birthday: new Date(1985, 7, 22),
		userId: "user1",
	},
	{
		id: "3",
		name: "Carol Davis",
		email: "carol@example.com",
		birthday: new Date(1992, 2, 8),
		userId: "user1",
	},
	{
		id: "4",
		name: "David Wilson",
		email: "david@example.com",
		birthday: new Date(1988, 11, 25),
		userId: "user1",
	},
	{
		id: "5",
		name: "Emma Brown",
		email: "emma@example.com",
		birthday: new Date(1995, 9, 30),
		userId: "user1",
	},
];

interface ActionCellRendererProps extends ICellRendererParams {
	data: Recipient;
	onEdit: (recipient: Recipient) => void;
	onDelete: (id: string) => void;
}

const ActionCellRenderer = (props: ActionCellRendererProps) => {
	return (
		<div className="flex gap-2 py-1">
			<Button
				variant="outline"
				size="sm"
				onClick={() => props.onEdit(props.data)}
				className="h-7 px-2"
			>
				Edit
			</Button>
			<Button
				variant="destructive"
				size="sm"
				onClick={() => props.onDelete(props.data.id)}
				className="h-7 px-2"
			>
				Delete
			</Button>
		</div>
	);
};

export default function RecipientsPage() {
	const { theme } = useTheme();
	const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
	const [isEditing, setIsEditing] = useState(false);
	const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(
		null
	);
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		editingRecipient?.birthday
	);

	const gridTheme = themeQuartz.withPart(
		theme === "dark" ? colorSchemeDarkBlue : colorSchemeLightCold
	);

	const handleEdit = (recipient: Recipient) => {
		setEditingRecipient(recipient);
		setSelectedDate(recipient.birthday);
		setIsEditing(true);
	};

	const handleDelete = (id: string) => {
		setRecipients((current) => current.filter((r) => r.id !== id));
	};

	const columnDefs: ColDef<Recipient>[] = [
		{ field: "name", headerName: "Name", flex: 1 },
		{ field: "email", headerName: "Email", flex: 1 },
		{
			field: "birthday",
			headerName: "Birthday",
			flex: 1,
			valueFormatter: (params) =>
				format(new Date(params.value), "MMMM d, yyyy"),
		},
		{
			headerName: "Actions",
			minWidth: 200,
			cellRenderer: ActionCellRenderer,
			cellRendererParams: {
				onEdit: handleEdit,
				onDelete: handleDelete,
			},
		},
	];

	const defaultColDef = {
		sortable: true,
		resizable: true,
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-foreground">Recipients</h1>
				<Dialog
					open={isEditing}
					onOpenChange={(open) => {
						setIsEditing(open);
						if (!open) {
							setSelectedDate(undefined);
						}
					}}
				>
					<DialogTrigger asChild>
						<Button
							onClick={() => {
								setEditingRecipient(null);
								setSelectedDate(undefined);
							}}
						>
							Add Recipient
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>
								{editingRecipient ? "Edit Recipient" : "Add Recipient"}
							</DialogTitle>
						</DialogHeader>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								const formData = new FormData(e.currentTarget);
								const newRecipient: Recipient = {
									id: editingRecipient?.id || Date.now().toString(),
									name: formData.get("name") as string,
									email: formData.get("email") as string,
									birthday: selectedDate || new Date(),
									userId: "user1",
								};

								if (editingRecipient) {
									setRecipients((current) =>
										current.map((r) =>
											r.id === editingRecipient.id ? newRecipient : r
										)
									);
								} else {
									setRecipients((current) => [...current, newRecipient]);
								}

								setIsEditing(false);
								setEditingRecipient(null);
								setSelectedDate(undefined);
							}}
							className="space-y-4"
						>
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									name="name"
									required
									defaultValue={editingRecipient?.name}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									type="email"
									id="email"
									name="email"
									required
									defaultValue={editingRecipient?.email}
								/>
							</div>

							<div className="space-y-2">
								<Label>Birthday</Label>
								<DatePicker
									selected={selectedDate}
									onSelect={setSelectedDate}
								/>
							</div>

							<div className="flex justify-end space-x-3">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsEditing(false);
										setEditingRecipient(null);
										setSelectedDate(undefined);
									}}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={!selectedDate}>
									{editingRecipient ? "Save Changes" : "Add Recipient"}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{recipients.length > 0 ? (
				<div className="w-full">
					<AgGridReact
						rowData={recipients}
						columnDefs={columnDefs}
						defaultColDef={defaultColDef}
						domLayout="autoHeight"
						animateRows={true}
						rowSelection="single"
						theme={gridTheme}
						rowHeight={40}
						headerHeight={40}
						suppressCellFocus={true}
					/>
				</div>
			) : (
				<div className="text-center py-12">
					<h3 className="text-lg font-medium text-foreground">
						No recipients yet
					</h3>
					<p className="mt-2 text-muted-foreground">
						Get started by adding your first recipient
					</p>
					<div className="mt-6">
						<Button onClick={() => setIsEditing(true)}>Add Recipient</Button>
					</div>
				</div>
			)}
		</div>
	);
}
