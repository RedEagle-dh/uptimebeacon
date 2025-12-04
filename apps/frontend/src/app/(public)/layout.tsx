import { PublicFooter, PublicHeader } from "@/components/layouts";

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex min-h-screen flex-col">
			<PublicHeader />
			<main className="flex-1">{children}</main>
			<PublicFooter />
		</div>
	);
}
