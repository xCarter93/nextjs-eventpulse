"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
	Table,
	TableHeader,
	TableBody,
	TableColumn,
	TableRow,
	TableCell,
	Input,
	Pagination,
	User,
	Tooltip,
	Select,
	SelectItem,
} from "@heroui/react";
import { SortDescriptor } from "@heroui/react";
import { Eye, Trash2 } from "lucide-react";

interface Recipient {
	_id: Id<"recipients">;
	_creationTime: number;
	name: string;
	email: string;
	birthday: number;
	userId: Id<"users">;
	metadata?: {
		relation?: "friend" | "parent" | "spouse" | "sibling";
	};
}

const relationOptions = [
	{ label: "Friend", value: "friend" },
	{ label: "Parent", value: "parent" },
	{ label: "Spouse", value: "spouse" },
	{ label: "Sibling", value: "sibling" },
];

interface Column {
	key: string;
	label: string;
	allowsSorting?: boolean;
	align?: "center" | "start" | "end";
	className?: string;
}

export function RecipientsTable() {
	const router = useRouter();
	const [page, setPage] = useState(1);
	const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
		column: "name",
		direction: "ascending",
	});

	// Number of items per page
	const rowsPerPage = 10;

	const recipients = useQuery(api.recipients.getRecipients);
	const updateRecipient = useMutation(api.recipients.updateRecipient);
	const updateRecipientMetadata = useMutation(
		api.recipients.updateRecipientMetadata
	);
	const deleteRecipient = useMutation(api.recipients.deleteRecipient);

	const handleDelete = async (id: Id<"recipients">) => {
		try {
			await deleteRecipient({ id });
			toast.success("Recipient deleted successfully");
		} catch (error) {
			toast.error("Failed to delete recipient");
			console.error(error);
		}
	};

	const handleUpdate = async (
		id: Id<"recipients">,
		field: string,
		value: string | number
	) => {
		try {
			const recipient = recipients?.find((r) => r._id === id);
			if (!recipient) return;

			await updateRecipient({
				id,
				name: field === "name" ? (value as string) : recipient.name,
				email: field === "email" ? (value as string) : recipient.email,
				birthday: field === "birthday" ? (value as number) : recipient.birthday,
			});
			toast.success("Recipient updated successfully");
		} catch (error) {
			toast.error("Failed to update recipient");
			console.error(error);
		}
	};

	const handleUpdateRelation = async (
		id: Id<"recipients">,
		relation: string
	) => {
		try {
			const recipient = recipients?.find((r) => r._id === id);
			if (!recipient) return;

			await updateRecipientMetadata({
				id,
				metadata: {
					...recipient.metadata,
					relation: relation as "friend" | "parent" | "spouse" | "sibling",
				},
			});
			toast.success("Relationship updated successfully");
		} catch (error) {
			toast.error("Failed to update relationship");
			console.error(error);
		}
	};

	const sortedRecipients = useMemo(() => {
		if (!recipients) return [];

		return [...recipients].sort((a, b) => {
			const column = sortDescriptor.column as keyof Recipient;
			const direction = sortDescriptor.direction === "ascending" ? 1 : -1;

			if (column === "birthday") {
				return (a[column] - b[column]) * direction;
			}

			return String(a[column]).localeCompare(String(b[column])) * direction;
		});
	}, [recipients, sortDescriptor]);

	// Calculate pagination
	const pages = Math.ceil((sortedRecipients?.length || 0) / rowsPerPage);
	const items = sortedRecipients?.slice(
		(page - 1) * rowsPerPage,
		page * rowsPerPage
	);

	const columns = useMemo<Column[]>(() => {
		return [
			{
				key: "name",
				label: "Name",
				allowsSorting: true,
			},
			{
				key: "relation",
				label: "Relationship",
				className: "hidden md:table-cell",
			},
			{
				key: "birthday",
				label: "Birthday",
				allowsSorting: true,
				className: "hidden md:table-cell",
			},
			{
				key: "actions",
				label: "Actions",
				align: "center",
			},
		];
	}, []);

	const renderCell = (recipient: Recipient, columnKey: string | number) => {
		const key = String(columnKey);
		switch (key) {
			case "name":
				return (
					<User
						name={recipient.name}
						description={recipient.email}
						classNames={{
							name: "text-sm font-semibold",
							description: "text-sm text-default-500",
						}}
					/>
				);
			case "relation":
				return (
					<div className="hidden md:block">
						<Select
							defaultSelectedKeys={[recipient.metadata?.relation || ""]}
							onChange={(e) =>
								handleUpdateRelation(recipient._id, e.target.value)
							}
							className="max-w-[200px]"
						>
							{relationOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</Select>
					</div>
				);
			case "birthday":
				return (
					<div className="hidden md:block">
						<Input
							type="date"
							defaultValue={format(new Date(recipient.birthday), "yyyy-MM-dd")}
							onBlur={(e) => {
								const timestamp = new Date(e.target.value).getTime();
								if (!isNaN(timestamp)) {
									handleUpdate(recipient._id, "birthday", timestamp);
								}
							}}
						/>
					</div>
				);
			case "actions":
				return (
					<div className="relative flex items-center justify-center gap-2">
						<Tooltip content="View Details">
							<span
								className="text-lg text-default-400 cursor-pointer active:opacity-50"
								onClick={() => router.push(`/recipients/${recipient._id}`)}
							>
								<Eye className="h-5 w-5" />
							</span>
						</Tooltip>
						<Tooltip color="danger" content="Delete Recipient">
							<span
								className="text-lg text-danger cursor-pointer active:opacity-50"
								onClick={() => handleDelete(recipient._id)}
							>
								<Trash2 className="h-5 w-5" />
							</span>
						</Tooltip>
					</div>
				);
			default:
				return null;
		}
	};

	if (!recipients) {
		return <div className="h-[500px] grid place-items-center">Loading...</div>;
	}

	return (
		<div className="h-[500px]">
			<Table
				aria-label="Recipients table"
				sortDescriptor={sortDescriptor}
				onSortChange={setSortDescriptor}
				bottomContent={
					<div className="flex justify-center">
						<Pagination total={pages} page={page} onChange={setPage} />
					</div>
				}
				className="recipients-table"
			>
				<TableHeader>
					{columns.map((column) => (
						<TableColumn
							key={column.key}
							align={column.align}
							allowsSorting={column.allowsSorting}
							className={column.className}
						>
							{column.label}
						</TableColumn>
					))}
				</TableHeader>
				<TableBody items={items} emptyContent="No recipients found">
					{(item) => (
						<TableRow key={item._id}>
							{(columnKey) => (
								<TableCell
									className={
										columns.find((col) => col.key === columnKey)?.className
									}
								>
									{renderCell(item, columnKey)}
								</TableCell>
							)}
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
