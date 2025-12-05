import type { MetadataRoute } from "next";
import { getPageMap } from "nextra/page-map";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = "https://docs.eventmate.cloud";
	const lastModified = new Date();

	// Basis-Seiten für die Dokumentation
	const staticPages: MetadataRoute.Sitemap = [
		{
			url: baseUrl,
			lastModified,
			changeFrequency: "weekly",
			priority: 1.0,
		},
	];

	// Dynamisch alle Dokumentationsseiten aus der PageMap generieren
	try {
		const pageMap = await getPageMap();
		const dynamicPages = generateSitemapFromPageMap(
			pageMap,
			baseUrl,
			lastModified,
		);
		return [...staticPages, ...dynamicPages];
	} catch (error) {
		// Fallback falls PageMap nicht verfügbar ist
		console.error("Could not generate dynamic sitemap:", error);
		return staticPages;
	}
}

// Rekursive Funktion um alle Seiten aus der PageMap zu extrahieren
function generateSitemapFromPageMap(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	pageMap: any[],
	baseUrl: string,
	lastModified: Date,
	parentPath = "",
): MetadataRoute.Sitemap {
	const pages: MetadataRoute.Sitemap = [];

	for (const item of pageMap) {
		if (item.kind === "MdxPage" && item.route) {
			// Normale Dokumentationsseite
			pages.push({
				url: `${baseUrl}${item.route}`,
				lastModified,
				changeFrequency: "weekly",
				priority: getPriorityForRoute(item.route),
			});
		} else if (item.kind === "Folder" && item.children) {
			// Ordner mit Unterseiten
			const folderPath = item.route || parentPath;

			// Füge die Ordner-Index-Seite hinzu, falls vorhanden
			if (item.route) {
				pages.push({
					url: `${baseUrl}${item.route}`,
					lastModified,
					changeFrequency: "weekly",
					priority: getPriorityForRoute(item.route),
				});
			}

			// Rekursiv alle Unterseiten hinzufügen
			const childPages = generateSitemapFromPageMap(
				item.children,
				baseUrl,
				lastModified,
				folderPath,
			);
			pages.push(...childPages);
		}
	}

	return pages;
}

// Bestimme Priorität basierend auf der Route
function getPriorityForRoute(route: string): number {
	// Hauptseiten haben höhere Priorität
	if (route === "/" || route === "") return 1.0;
	if (route.startsWith("/getting-started") || route.startsWith("/installation"))
		return 0.9;
	if (route.startsWith("/commands") || route.startsWith("/befehle")) return 0.8;
	if (route.startsWith("/features")) return 0.8;
	if (route.startsWith("/dashboard")) return 0.7;
	if (route.startsWith("/api")) return 0.6;
	if (route.startsWith("/changelog") || route.startsWith("/faq")) return 0.5;

	// Tiefe verschachtelte Seiten haben niedrigere Priorität
	const depth = (route.match(/\//g) || []).length;
	return Math.max(0.4, 0.8 - depth * 0.1);
}
