"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
	Table,
	TableHeader,
	TableBody,
	TableColumn,
	TableRow,
	TableCell,
	Pagination,
	User,
	Chip,
} from "@heroui/react";
import { SortDescriptor } from "@heroui/react";

interface Recipient {
	_id: Id<"recipients">;
	_creationTime: number;
	name: string;
	email: string;
	birthday: number;
	userId: Id<"users">;
	groupIds?: Id<"groups">[];
	metadata?: {
		relation?: "friend" | "parent" | "spouse" | "sibling";
	};
}

interface Group {
	_id: Id<"groups"> | string;
	name: string;
	color?: string;
}

interface Column {
	key: string;
	label: string;
	allowsSorting?: boolean;
	align?: "center" | "start" | "end";
	className?: string;
}

interface RecipientsTableProps {
	onRecipientSelect?: (recipientId: Id<"recipients">) => void;
	filteredRecipients?: Recipient[];
}

export function RecipientsTable({
	onRecipientSelect,
	filteredRecipients,
}: RecipientsTableProps) {
	const [page, setPage] = useState(1);
	const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
		column: "name",
		direction: "ascending",
	});

	// Number of items per page
	const rowsPerPage = 5;

	const recipients = useQuery(api.recipients.getRecipients);
	const groupsData = useQuery(api.groups.getGroupsWithCounts);

	const handleRowClick = (recipientId: Id<"recipients">) => {
		if (onRecipientSelect) {
			onRecipientSelect(recipientId);
		}
	};

	const sortedRecipients = useMemo(() => {
		// Use filtered recipients if provided, otherwise fall back to all recipients
		const recipientsToSort = filteredRecipients || recipients;
		if (!recipientsToSort) return [];

		return [...recipientsToSort].sort((a, b) => {
			const column = sortDescriptor.column as keyof Recipient;
			const direction = sortDescriptor.direction === "ascending" ? 1 : -1;

			if (column === "birthday") {
				return (a[column] - b[column]) * direction;
			}

			return String(a[column]).localeCompare(String(b[column])) * direction;
		});
	}, [filteredRecipients, recipients, sortDescriptor]);

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
				key: "birthday",
				label: "Birthday",
				allowsSorting: true,
				className: "hidden min-[1330px]:table-cell",
			},
			{
				key: "groups",
				label: "Groups",
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
			case "birthday":
				return (
					<div className="hidden min-[1330px]:block text-sm text-default-600">
						{format(new Date(recipient.birthday), "MMM dd, yyyy")}
					</div>
				);
			case "groups":
				const recipientGroups =
					groupsData && "groups" in groupsData
						? groupsData.groups.filter((group: Group) =>
								recipient.groupIds?.includes(group._id as Id<"groups">)
							)
						: [];

				return (
					<div className="flex flex-wrap gap-1">
						{recipientGroups.length > 0 ? (
							recipientGroups.slice(0, 2).map((group: Group) => (
								<Chip
									key={group._id}
									size="sm"
									variant="flat"
									style={{
										backgroundColor: group.color
											? `${group.color}15`
											: undefined,
										color: group.color || "#6b7280",
										border: group.color
											? `1px solid ${group.color}40`
											: undefined,
									}}
									className="text-xs min-w-0"
								>
									<span className="truncate max-w-16">{group.name}</span>
								</Chip>
							))
						) : (
							<span className="text-xs text-default-400">No groups</span>
						)}
						{recipientGroups.length > 2 && (
							<Chip
								size="sm"
								variant="flat"
								className="text-xs text-default-500 bg-default-100"
							>
								+{recipientGroups.length - 2}
							</Chip>
						)}
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
		<div className="w-full">
			<Table
				aria-label="Recipients table"
				sortDescriptor={sortDescriptor}
				onSortChange={setSortDescriptor}
				bottomContent={
					<div className="flex justify-center">
						<Pagination
							isCompact
							showControls
							showShadow
							color="primary"
							total={pages}
							page={page}
							onChange={setPage}
						/>
					</div>
				}
				className="recipients-table border border-default-200"
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
						<TableRow
							key={item._id}
							className="cursor-pointer hover:bg-default-50 transition-colors"
							onClick={(e) => {
								// Prevent row click if interacting with form elements
								if (
									(e.target as HTMLElement).closest("input, select, button")
								) {
									return;
								}
								handleRowClick(item._id);
							}}
						>
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
