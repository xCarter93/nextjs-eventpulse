"use client";

import { datadogRum } from "@datadog/browser-rum";

datadogRum.init({
	applicationId: "9b739de2-5f76-4b5d-921c-08f30b1a10d8",
	clientToken: "pub4bd96b517366722df7e48b7ec912c039",
	site: "datadoghq.com",
	service: "eventpulse",
	env: "prod",
	sessionSampleRate: 100,
	sessionReplaySampleRate: 20,
	defaultPrivacyLevel: "mask-user-input",
	trackUserInteractions: true,
	trackResources: true,
	trackLongTasks: true,
});

export default function DatadogInit() {
	return null;
}
