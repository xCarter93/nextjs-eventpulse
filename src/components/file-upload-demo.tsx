"use client";
import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";

export default function FileUploadDemo() {
	const [files, setFiles] = useState<File[]>([]);
	const handleFileUpload = (files: File[]) => {
		setFiles(files);
		console.log(files);
	};

	return (
		<div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
			<FileUpload onChange={handleFileUpload} />
			{files.length > 0 && (
				<div className="mt-4 p-4">
					<p className="text-sm text-gray-600 dark:text-gray-400">
						{files.length} file(s) selected
					</p>
				</div>
			)}
		</div>
	);
}
