"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";
import { format } from "date-fns";
import { RecipientMetadataForm } from "../../../../src/components/recipients/RecipientMetadataForm";
import { Id } from "../../../../convex/_generated/dataModel";

export default function RecipientPage() {
	const params = useParams();
	const recipientId = params.id as Id<"recipients">;

	const recipient = useQuery(api.recipients.getRecipient, { id: recipientId });

	if (!recipient) {
		return (
			<div className="container py-6">
				<Card>
					<CardHeader>
						<h1 className="text-2xl font-bold">
							<Skeleton className="h-8 w-48" />
						</h1>
					</CardHeader>
					<CardBody>
						<Skeleton className="h-48 w-full" />
					</CardBody>
				</Card>
			</div>
		);
	}

	return (
		<div className="container py-6">
			<Card>
				<CardHeader>
					<h1 className="text-2xl font-bold">{recipient.name}</h1>
				</CardHeader>
				<CardBody className="space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<h3 className="text-sm font-medium text-default-500">Email</h3>
							<p className="mt-1">{recipient.email}</p>
						</div>
						<div>
							<h3 className="text-sm font-medium text-default-500">Birthday</h3>
							<p className="mt-1">
								{format(recipient.birthday, "MMMM d, yyyy")}
							</p>
						</div>
					</div>

					<div className="border-t pt-6">
						<h2 className="text-lg font-semibold mb-4">
							Additional Information
						</h2>
						<RecipientMetadataForm recipient={recipient} />
					</div>
				</CardBody>
			</Card>
		</div>
	);
}
