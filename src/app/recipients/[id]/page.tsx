"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";
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
				<CardBody>
					<RecipientMetadataForm recipient={recipient} />
				</CardBody>
			</Card>
		</div>
	);
}
