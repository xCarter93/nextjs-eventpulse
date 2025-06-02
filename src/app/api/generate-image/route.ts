import { openai } from "@ai-sdk/openai";
import { experimental_generateImage as generateImage } from "ai";
import { NextResponse } from "next/server";

// Simple in-memory cache for prompt optimization suggestions
const promptCache = new Map<string, string>();

// Enhance prompts with artistic and technical details
function enhancePrompt(userPrompt: string): string {
	// Check cache first
	if (promptCache.has(userPrompt)) {
		return promptCache.get(userPrompt)!;
	}

	// Add professional photography and artistic enhancements
	const enhancements = [
		"high quality",
		"detailed",
		"professional lighting",
		"sharp focus",
		"vivid colors",
		"8k resolution"
	];

	// Only enhance if the prompt doesn't already contain quality indicators
	const hasQualityTerms = enhancements.some(term => 
		userPrompt.toLowerCase().includes(term.toLowerCase())
	);

	let enhancedPrompt = userPrompt.trim();
	
	if (!hasQualityTerms && enhancedPrompt.length < 200) {
		enhancedPrompt += ", high quality, detailed, professional lighting";
	}

	// Cache the result
	promptCache.set(userPrompt, enhancedPrompt);
	return enhancedPrompt;
}

export async function POST(req: Request) {
	try {
		const { prompt, size = "1024x1024", quality = "standard" } = await req.json();

		// Enhanced validation
		if (!prompt || typeof prompt !== "string") {
			return NextResponse.json(
				{ error: "Valid prompt is required" },
				{ status: 400 }
			);
		}

		if (prompt.length > 500) {
			return NextResponse.json(
				{ error: "Prompt must be 500 characters or less" },
				{ status: 400 }
			);
		}

		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			console.error("OPENAI_API_KEY is not configured");
			return NextResponse.json(
				{ error: "AI service is not available" },
				{ status: 503 }
			);
		}

		// Enhance the prompt for better results
		const enhancedPrompt = enhancePrompt(prompt);

		console.log(`Generating image with enhanced prompt: "${enhancedPrompt}"`);  
		
		// Generate the image using the AI SDK with enhanced options
		const startTime = Date.now();
		const { image } = await generateImage({
			model: openai.image("dall-e-3"),
			prompt: enhancedPrompt,
			size: size as "1024x1024" | "1792x1024" | "1024x1792",
		});
		const generationTime = Date.now() - startTime;

		// Ensure the base64 data is properly formatted
		const base64Data = image.base64;
		const formattedImageData = base64Data.startsWith("data:")
			? base64Data
			: `data:image/png;base64,${base64Data}`;

		console.log(`Image generated successfully in ${generationTime}ms`);

		// Return enhanced response with metadata
		return NextResponse.json({
			imageData: formattedImageData,
			mimeType: "image/png",
			metadata: {
				originalPrompt: prompt,
				enhancedPrompt: enhancedPrompt,
				generationTime: generationTime,
				size: size,
				quality: quality,
				timestamp: new Date().toISOString()
			}
		});
	} catch (error) {
		console.error("Error generating image:", error);
		
		// Enhanced error handling with specific error types
		if (error instanceof Error) {
			if (error.message.includes("content_policy_violation")) {
				return NextResponse.json(
					{ error: "The prompt violates content policy. Please try a different description." },
					{ status: 400 }
				);
			}
			
			if (error.message.includes("rate_limit")) {
				return NextResponse.json(
					{ error: "Rate limit exceeded. Please try again in a moment." },
					{ status: 429 }
				);
			}
			
			if (error.message.includes("insufficient_quota")) {
				return NextResponse.json(
					{ error: "Service quota exceeded. Please contact support." },
					{ status: 402 }
				);
			}
		}
		
		return NextResponse.json(
			{ error: "Failed to generate image. Please try again." },
			{ status: 500 }
		);
	}
}
