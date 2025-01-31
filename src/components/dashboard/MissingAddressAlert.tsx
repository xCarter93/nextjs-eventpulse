import { Alert } from "@heroui/alert";
import { Button } from "@heroui/button";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MissingAddressAlert() {
	const router = useRouter();

	return (
		<Alert
			icon={<MapPin className="h-4 w-4" />}
			radius="full"
			color="secondary"
			endContent={
				<Button
					variant="faded"
					color="secondary"
					size="sm"
					className="text-secondary-foreground font-medium"
					onPress={() => router.push("/settings")}
				>
					Update Settings
				</Button>
			}
		>
			To see holidays for your country, please set your home address
		</Alert>
	);
}
