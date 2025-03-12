import { openai } from "@ai-sdk/openai";
import { experimental_generateImage as generateImage } from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const { prompt } = await req.json();

		if (!prompt) {
			return NextResponse.json(
				{ error: "Prompt is required" },
				{ status: 400 }
			);
		}

		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error("OPENAI_API_KEY is not defined");
		}

		// Generate the image using the AI SDK
		const { image } = await generateImage({
			model: openai.image("dall-e-3"),
			prompt,
			size: "1024x1024",
		});

		// Ensure the base64 data is properly formatted with the data URL prefix
		const base64Data = image.base64;
		const formattedImageData = base64Data.startsWith("data:")
			? base64Data
			: `data:image/png;base64,${base64Data}`;

		// Return the base64 image data
		return NextResponse.json({
			imageData: formattedImageData,
			mimeType: "image/png",
		});
	} catch (error) {
		console.error("Error generating image:", error);
		return NextResponse.json(
			{ error: "Failed to generate image" },
			{ status: 500 }
		);
	}
}
