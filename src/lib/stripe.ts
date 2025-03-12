import Stripe from "stripe";

// Initialize Stripe directly with environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
	apiVersion: "2024-12-18.acacia", // Use the latest API version
});

export default stripe;
