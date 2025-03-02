"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
	type EmailComponent,
	type EventComponent,
	type AudioComponent,
} from "@/types/email-components";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Calendar, Mic, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ComponentConfigDialogProps {
	component: EmailComponent;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (updatedComponent: EmailComponent) => void;
}

interface AudioComponentConfigProps {
	component: AudioComponent;
	onChange: (component: AudioComponent) => void;
	userAudioFiles: Array<{
		_id: string;
		title: string;
		url: string;
		isRecorded: boolean;
		createdAt: number;
	}>;
}

function AudioComponentConfig({
	component,
	onChange,
	userAudioFiles,
}: AudioComponentConfigProps) {
	const [activeTab, setActiveTab] = useState<"upload" | "record">("upload");
	const [isRecording, setIsRecording] = useState(false);
	const [recordingTime, setRecordingTime] = useState(0);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [recordingPreviewUrl, setRecordingPreviewUrl] = useState<string | null>(
		null
	);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
	const [title, setTitle] = useState(component.title);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const generateUploadUrl = useMutation(api.audioFiles.generateUploadUrl);
	const storeAudioFile = useMutation(api.audioFiles.storeAudioFile);

	useEffect(() => {
		// Clean up any object URLs when component unmounts
		return () => {
			if (recordingPreviewUrl) URL.revokeObjectURL(recordingPreviewUrl);
			if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
		};
	}, [recordingPreviewUrl, uploadPreviewUrl]);

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(stream);
			mediaRecorderRef.current = mediaRecorder;
			audioChunksRef.current = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunksRef.current.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: "audio/wav",
				});
				setAudioBlob(audioBlob);

				// Create a preview URL for the recording
				const url = URL.createObjectURL(audioBlob);
				setRecordingPreviewUrl(url);

				// Update component with recorded status
				onChange({
					...component,
					isRecorded: true,
					title: title,
				});

				// Stop all tracks in the stream
				stream.getTracks().forEach((track) => track.stop());
			};

			// Start recording
			mediaRecorder.start();
			setIsRecording(true);

			// Start timer
			let seconds = 0;
			timerRef.current = setInterval(() => {
				seconds++;
				setRecordingTime(seconds);
			}, 1000);
		} catch (error) {
			console.error("Error accessing microphone:", error);
			alert(
				"Could not access microphone. Please check your browser permissions."
			);
		}
	};

	const stopRecording = () => {
		if (mediaRecorderRef.current && isRecording) {
			mediaRecorderRef.current.stop();
			setIsRecording(false);

			// Clear timer
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedFile(file);

			// Create a preview URL for the uploaded file
			const url = URL.createObjectURL(file);
			setUploadPreviewUrl(url);

			// Update component
			onChange({
				...component,
				isRecorded: false,
				title: title,
			});
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	const saveAudioToConvex = async () => {
		try {
			// Handle recording
			if (activeTab === "record" && audioBlob) {
				try {
					console.log("Generating upload URL...");
					const uploadUrl = await generateUploadUrl();
					console.log("Upload URL generated:", uploadUrl);

					// Check if the URL is valid
					if (
						!uploadUrl ||
						typeof uploadUrl !== "string" ||
						!uploadUrl.startsWith("http")
					) {
						console.error("Invalid upload URL:", uploadUrl);
						alert("Error: Invalid upload URL generated");
						return false;
					}

					// Log the blob details for debugging
					console.log("Audio blob:", {
						type: audioBlob.type,
						size: audioBlob.size,
					});

					// Ensure the blob has a valid MIME type
					const blobToUpload = audioBlob.type
						? audioBlob
						: new Blob([audioBlob], { type: "audio/wav" });

					console.log("Uploading blob to Convex...");
					// Upload the blob with better error handling - NOTE: Using POST instead of PUT
					const response = await fetch(uploadUrl, {
						method: "POST", // Changed from PUT to POST as per Convex docs
						body: blobToUpload,
						headers: {
							"Content-Type": blobToUpload.type,
						},
					});

					if (!response.ok) {
						const errorText = await response.text();
						console.error("Upload failed:", response.status, errorText);
						alert(`Upload failed: ${response.status} ${response.statusText}`);
						return false;
					}

					console.log("Upload successful:", response.status);

					// Parse the response to get the storageId
					const result = await response.json();
					console.log("Upload response:", result);

					if (!result.storageId) {
						console.error("No storageId returned from upload");
						alert("Error: No storage ID returned from upload");
						return false;
					}

					console.log(
						"Storing audio file in database with ID:",
						result.storageId
					);
					// Store in database using the storageId from the response
					await storeAudioFile({
						storageId: result.storageId, // Use the storageId from the response
						title: title,
						isRecorded: true,
					});

					// Get the URL for the audio file
					const audioUrl = `${uploadUrl.split("?")[0].split("/").slice(0, -1).join("/")}/${result.storageId}`;
					console.log("Audio URL:", audioUrl);

					// Update component with the audio URL
					onChange({
						...component,
						audioUrl,
						isRecorded: true,
						title: title,
					});

					return true;
				} catch (error) {
					console.error("Error in recording upload process:", error);
					alert(
						`Error saving recording: ${error instanceof Error ? error.message : String(error)}`
					);
					return false;
				}
			}

			// Handle upload
			if (activeTab === "upload" && selectedFile) {
				try {
					console.log("Generating upload URL for file upload...");
					const uploadUrl = await generateUploadUrl();
					console.log("Upload URL generated:", uploadUrl);

					// Check if the URL is valid
					if (
						!uploadUrl ||
						typeof uploadUrl !== "string" ||
						!uploadUrl.startsWith("http")
					) {
						console.error("Invalid upload URL:", uploadUrl);
						alert("Error: Invalid upload URL generated");
						return false;
					}

					// Log the file details for debugging
					console.log("File to upload:", {
						name: selectedFile.name,
						type: selectedFile.type,
						size: selectedFile.size,
					});

					console.log("Uploading file to Convex...");
					// Upload the file with better error handling - NOTE: Using POST instead of PUT
					const response = await fetch(uploadUrl, {
						method: "POST", // Changed from PUT to POST as per Convex docs
						body: selectedFile,
						headers: {
							"Content-Type": selectedFile.type || "audio/mpeg",
						},
					});

					if (!response.ok) {
						const errorText = await response.text();
						console.error("Upload failed:", response.status, errorText);
						alert(`Upload failed: ${response.status} ${response.statusText}`);
						return false;
					}

					console.log("Upload successful:", response.status);

					// Parse the response to get the storageId
					const result = await response.json();
					console.log("Upload response:", result);

					if (!result.storageId) {
						console.error("No storageId returned from upload");
						alert("Error: No storage ID returned from upload");
						return false;
					}

					console.log(
						"Storing audio file in database with ID:",
						result.storageId
					);
					// Store in database using the storageId from the response
					await storeAudioFile({
						storageId: result.storageId, // Use the storageId from the response
						title: title,
						isRecorded: false,
					});

					// Get the URL for the audio file
					const audioUrl = `${uploadUrl.split("?")[0].split("/").slice(0, -1).join("/")}/${result.storageId}`;
					console.log("Audio URL:", audioUrl);

					// Update component with the audio URL
					onChange({
						...component,
						audioUrl,
						isRecorded: false,
						title: title,
					});

					return true;
				} catch (error) {
					console.error("Error in file upload process:", error);
					alert(
						`Error uploading file: ${error instanceof Error ? error.message : String(error)}`
					);
					return false;
				}
			}

			return false;
		} catch (error) {
			console.error("Error in saveAudioToConvex:", error);
			alert(
				`Error saving audio: ${error instanceof Error ? error.message : String(error)}`
			);
			return false;
		}
	};

	const handleSelectExistingAudio = (
		audioUrl: string,
		audioTitle: string,
		isRecorded: boolean
	) => {
		onChange({
			...component,
			audioUrl,
			title: audioTitle,
			isRecorded,
		});
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label>Audio Title</Label>
				<Input
					value={title}
					onChange={(e) => {
						setTitle(e.target.value);
						onChange({
							...component,
							title: e.target.value,
						});
					}}
					placeholder="Enter a title for this audio"
				/>
			</div>

			{userAudioFiles.length > 0 && (
				<div className="space-y-2">
					<Label>Select Existing Audio</Label>
					<Select
						value={component.audioUrl || ""}
						onValueChange={(value) => {
							const selectedAudio = userAudioFiles.find(
								(audio) => audio.url === value
							);
							if (selectedAudio) {
								handleSelectExistingAudio(
									selectedAudio.url,
									selectedAudio.title,
									selectedAudio.isRecorded
								);
							}
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="Choose an audio file..." />
						</SelectTrigger>
						<SelectContent>
							{userAudioFiles.map((audio) => (
								<SelectItem key={audio._id} value={audio.url}>
									<div className="flex items-center gap-2">
										<Mic className="h-4 w-4" />
										<span>{audio.title}</span>
										<span className="text-muted-foreground text-xs">
											{new Date(audio.createdAt).toLocaleDateString()}
										</span>
									</div>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}

			{component.audioUrl && (
				<div className="p-4 border rounded-lg">
					<p className="font-medium mb-2">{component.title}</p>
					<audio controls className="w-full" src={component.audioUrl}>
						Your browser does not support the audio element.
					</audio>
				</div>
			)}

			<div className="pt-4">
				<Label>Add New Audio</Label>
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as "upload" | "record")}
				>
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="upload">Upload</TabsTrigger>
						<TabsTrigger value="record">Record</TabsTrigger>
					</TabsList>

					<TabsContent value="upload" className="space-y-4">
						<div className="flex items-center justify-center w-full">
							<label
								htmlFor="audio-upload"
								className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/30"
							>
								<div className="flex flex-col items-center justify-center pt-5 pb-6">
									<Upload className="w-8 h-8 mb-2 text-muted-foreground" />
									<p className="mb-2 text-sm text-muted-foreground">
										<span className="font-semibold">Click to upload</span> or
										drag and drop
									</p>
									<p className="text-xs text-muted-foreground">
										MP3, WAV, or OGG (max 10MB)
									</p>
								</div>
								<input
									id="audio-upload"
									type="file"
									accept="audio/*"
									className="hidden"
									onChange={handleFileChange}
								/>
							</label>
						</div>

						{uploadPreviewUrl && (
							<div className="p-4 border rounded-lg">
								<p className="font-medium mb-2">Preview</p>
								<audio controls className="w-full" src={uploadPreviewUrl}>
									Your browser does not support the audio element.
								</audio>
							</div>
						)}

						{uploadPreviewUrl && (
							<Button onClick={saveAudioToConvex} className="w-full">
								Save Audio
							</Button>
						)}
					</TabsContent>

					<TabsContent value="record" className="space-y-4">
						<div className="flex flex-col items-center justify-center w-full p-6 border rounded-lg">
							<div className="mb-4">
								{isRecording ? (
									<div className="text-center">
										<div className="text-2xl font-bold text-primary mb-2">
											{formatTime(recordingTime)}
										</div>
										<div className="animate-pulse flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
											<Mic className="h-8 w-8 text-primary" />
										</div>
										<p className="text-sm text-muted-foreground mb-4">
											Recording...
										</p>
									</div>
								) : (
									<Mic className="h-12 w-12 text-muted-foreground mb-4" />
								)}
							</div>

							{!isRecording && !recordingPreviewUrl && (
								<Button
									onClick={startRecording}
									variant="outline"
									className="w-full"
								>
									Start Recording
								</Button>
							)}

							{isRecording && (
								<Button
									onClick={stopRecording}
									variant="destructive"
									className="w-full"
								>
									Stop Recording
								</Button>
							)}
						</div>

						{recordingPreviewUrl && (
							<div className="p-4 border rounded-lg">
								<p className="font-medium mb-2">Preview</p>
								<audio controls className="w-full" src={recordingPreviewUrl}>
									Your browser does not support the audio element.
								</audio>
							</div>
						)}

						{recordingPreviewUrl && (
							<Button onClick={saveAudioToConvex} className="w-full">
								Save Recording
							</Button>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

export function ComponentConfigDialog({
	component,
	open,
	onOpenChange,
	onSave,
}: ComponentConfigDialogProps) {
	const [editedComponent, setEditedComponent] =
		useState<EmailComponent>(component);
	const userAnimations = useQuery(api.animations.getUserAnimations);
	const userAudioFiles = useQuery(api.audioFiles.getUserAudioFiles);
	const events = useQuery(api.events.getEvents);
	const recipients = useQuery(api.recipients.getRecipients);

	// Filter upcoming events (custom events and birthdays)
	const upcomingEvents = [
		...(events || []).map((event) => ({
			id: event._id,
			type: "custom" as const,
			title: event.name,
			date: event.date,
		})),
		...(recipients || []).map((recipient) => {
			// For birthdays, we need to check if the month and day haven't occurred this year
			const birthday = new Date(recipient.birthday);
			const today = new Date();
			const thisYearBirthday = new Date(
				today.getFullYear(),
				birthday.getMonth(),
				birthday.getDate()
			);

			// If this year's birthday has passed, use next year's date
			if (thisYearBirthday < today) {
				thisYearBirthday.setFullYear(today.getFullYear() + 1);
			}

			return {
				id: recipient._id,
				type: "birthday" as const,
				title: `${recipient.name}'s Birthday`,
				date: thisYearBirthday.getTime(),
			};
		}),
	]
		.filter((event) => {
			if (event.type === "custom") {
				return event.date > Date.now(); // Filter out past custom events
			}
			return true; // Keep all birthdays since we've already adjusted their dates
		})
		.sort((a, b) => a.date - b.date);

	const handleSave = () => {
		onSave(editedComponent);
		onOpenChange(false);
	};

	const renderFields = () => {
		switch (editedComponent.type) {
			case "heading":
			case "text":
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Content</Label>
							<Textarea
								value={editedComponent.content}
								onChange={(e) =>
									setEditedComponent({
										...editedComponent,
										content: e.target.value,
									})
								}
								placeholder={`Enter ${editedComponent.type} content...`}
							/>
						</div>
					</div>
				);

			case "button":
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Button Text</Label>
							<Input
								value={editedComponent.content}
								onChange={(e) =>
									setEditedComponent({
										...editedComponent,
										content: e.target.value,
									})
								}
								placeholder="Enter button text..."
							/>
						</div>
						<div className="space-y-2">
							<Label>URL</Label>
							<Input
								value={editedComponent.url}
								onChange={(e) =>
									setEditedComponent({
										...editedComponent,
										url: e.target.value,
									})
								}
								placeholder="Enter button URL..."
							/>
						</div>
					</div>
				);

			case "image":
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Select Image</Label>
							<Select
								value={editedComponent.url}
								onValueChange={(value) =>
									setEditedComponent({
										...editedComponent,
										url: value,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Choose an image..." />
								</SelectTrigger>
								<SelectContent>
									{userAnimations?.map((animation) => (
										<SelectItem key={animation._id} value={animation.url || ""}>
											<div className="flex items-center gap-2">
												<div className="w-8 h-8 relative rounded overflow-hidden">
													<Image
														src={animation.url || ""}
														alt={animation.name || ""}
														fill
														className="object-cover"
													/>
												</div>
												<span>{animation.name || "Untitled"}</span>
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Alt Text</Label>
							<Input
								value={editedComponent.alt}
								onChange={(e) =>
									setEditedComponent({
										...editedComponent,
										alt: e.target.value,
									})
								}
								placeholder="Enter image description..."
							/>
						</div>
						{editedComponent.url && (
							<div className="mt-4">
								<div className="aspect-video relative rounded-lg overflow-hidden">
									<Image
										src={editedComponent.url}
										alt={editedComponent.alt}
										fill
										className="object-cover"
									/>
								</div>
							</div>
						)}
					</div>
				);

			case "event":
				const eventComponent = editedComponent as EventComponent;
				return (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Event Type</Label>
							<Select
								value={eventComponent.eventType}
								onValueChange={(value: "birthday" | "custom") =>
									setEditedComponent({
										...eventComponent,
										eventType: value,
										eventId: undefined, // Reset selection when changing type
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Choose event type..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="birthday">Birthday</SelectItem>
									<SelectItem value="custom">Custom Event</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Select Event</Label>
							<Select
								value={eventComponent.eventId}
								onValueChange={(value) => {
									const selectedEvent = upcomingEvents.find(
										(e) => e.id === value
									);
									if (selectedEvent) {
										setEditedComponent({
											...eventComponent,
											eventId: value,
											eventType: selectedEvent.type,
											placeholderTitle: selectedEvent.title,
											placeholderDate: selectedEvent.date,
										});
									}
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Choose an event..." />
								</SelectTrigger>
								<SelectContent>
									{upcomingEvents
										.filter(
											(event) =>
												!eventComponent.eventType ||
												event.type === eventComponent.eventType
										)
										.map((event) => (
											<SelectItem key={event.id} value={event.id}>
												<div className="flex items-center gap-2">
													<Calendar className="h-4 w-4" />
													<span>{event.title}</span>
													<span className="text-muted-foreground">
														{new Date(event.date).toLocaleDateString()}
													</span>
												</div>
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>

						{eventComponent.eventId && (
							<div className="mt-4 p-4 rounded-lg border">
								<div className="flex items-center gap-2">
									<Calendar className="h-5 w-5 text-primary" />
									<div>
										<p className="font-medium">
											{eventComponent.placeholderTitle}
										</p>
										<p className="text-sm text-muted-foreground">
											{new Date(
												eventComponent.placeholderDate
											).toLocaleDateString(undefined, {
												weekday: "long",
												year: "numeric",
												month: "long",
												day: "numeric",
											})}
										</p>
									</div>
								</div>
							</div>
						)}
					</div>
				);

			case "audio":
				const audioComponent = editedComponent as AudioComponent;
				return (
					<AudioComponentConfig
						component={audioComponent}
						onChange={(updatedComponent) =>
							setEditedComponent(updatedComponent)
						}
						userAudioFiles={(userAudioFiles || [])
							.filter((audio) => audio.url !== null)
							.map((audio) => ({
								_id: audio._id.toString(),
								title: audio.title,
								url: audio.url || "", // Ensure url is never null
								isRecorded: audio.isRecorded,
								createdAt: audio.createdAt,
							}))}
					/>
				);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Edit{" "}
						{editedComponent.type.charAt(0).toUpperCase() +
							editedComponent.type.slice(1)}
					</DialogTitle>
				</DialogHeader>
				<div className="py-4">{renderFields()}</div>
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save Changes</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
