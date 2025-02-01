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
	Button,
} from "@heroui/react";
import { SortDescriptor } from "@heroui/react";

interface Recipient {
	_id: Id<"recipients">;
	_creationTime: number;
	name: string;
	email: string;
	birthday: number;
	userId: Id<"users">;
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

	if (!recipients) {
		return <div className="h-[500px] grid place-items-center">Loading...</div>;
	}

	return (
		<div className="h-[500px]">
			<Table
				aria-label="Recipients table"
				sortDescriptor={sortDescriptor}
				onSortChange={setSortDescriptor}
				selectionMode="single"
				onRowAction={(key) => router.push(`/recipients/${key}`)}
				bottomContent={
					<div className="flex justify-center">
						<Pagination total={pages} page={page} onChange={setPage} />
					</div>
				}
				className="recipients-table"
			>
				<TableHeader>
					<TableColumn key="name" allowsSorting>
						Name
					</TableColumn>
					<TableColumn key="email" allowsSorting>
						Email
					</TableColumn>
					<TableColumn key="birthday" allowsSorting>
						Birthday
					</TableColumn>
					<TableColumn key="actions">Actions</TableColumn>
				</TableHeader>
				<TableBody items={items} emptyContent="No recipients found">
					{(recipient) => (
						<TableRow key={recipient._id}>
							<TableCell>
								<Input
									defaultValue={recipient.name}
									onBlur={(e) =>
										handleUpdate(recipient._id, "name", e.target.value)
									}
								/>
							</TableCell>
							<TableCell>
								<Input
									defaultValue={recipient.email}
									onBlur={(e) =>
										handleUpdate(recipient._id, "email", e.target.value)
									}
								/>
							</TableCell>
							<TableCell>
								<Input
									type="date"
									defaultValue={format(
										new Date(recipient.birthday),
										"yyyy-MM-dd"
									)}
									onBlur={(e) => {
										const timestamp = new Date(e.target.value).getTime();
										if (!isNaN(timestamp)) {
											handleUpdate(recipient._id, "birthday", timestamp);
										}
									}}
								/>
							</TableCell>
							<TableCell>
								<Button
									color="danger"
									size="sm"
									variant="flat"
									onPress={() => handleDelete(recipient._id)}
								>
									Delete
								</Button>
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
