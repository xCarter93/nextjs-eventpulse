"use client";

import { useState } from "react";
import { type Recipient } from "@/types";
import { RecipientCard } from "@/components/recipients/RecipientCard";
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
];

export default function RecipientsPage() {
	const [recipients, setRecipients] = useState<Recipient[]>(initialRecipients);
	const [isEditing, setIsEditing] = useState(false);
	const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(
		null
	);

	const handleEdit = (recipient: Recipient) => {
		setEditingRecipient(recipient);
		setIsEditing(true);
	};

	const handleDelete = (id: string) => {
		setRecipients((current) => current.filter((r) => r.id !== id));
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold text-foreground">Recipients</h1>
				<Dialog open={isEditing} onOpenChange={setIsEditing}>
					<DialogTrigger asChild>
						<Button onClick={() => setEditingRecipient(null)}>
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
									birthday: new Date(formData.get("birthday") as string),
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
								<Label htmlFor="birthday">Birthday</Label>
								<Input
									type="date"
									id="birthday"
									name="birthday"
									required
									defaultValue={
										editingRecipient?.birthday.toISOString().split("T")[0]
									}
								/>
							</div>

							<div className="flex justify-end space-x-3">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsEditing(false);
										setEditingRecipient(null);
									}}
								>
									Cancel
								</Button>
								<Button type="submit">
									{editingRecipient ? "Save Changes" : "Add Recipient"}
								</Button>
							</div>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{recipients.length > 0 ? (
				<div className="grid gap-4">
					{recipients.map((recipient) => (
						<RecipientCard
							key={recipient.id}
							recipient={recipient}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					))}
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
