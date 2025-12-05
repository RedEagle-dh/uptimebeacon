module.exports = {
	branches: [
		"main",
		{
			name: "develop",
			channel: "beta",
			prerelease: "beta",
		},
	],
	tagFormat: "backend-v${version}",
	plugins: [
		[
			"@semantic-release/commit-analyzer",
			{
				releaseRules: [
					{ type: "feat", release: "minor" },
					{ type: "fix", release: "patch" },
					{ type: "perf", release: "patch" },
					{ type: "refactor", release: "patch" },
					{ type: "docs", release: false },
					{ type: "style", release: false },
					{ type: "chore", release: false },
				],
			},
		],
		"@semantic-release/release-notes-generator",
		[
			"@semantic-release/changelog",
			{
				changelogFile: "CHANGELOG.md",
			},
		],
		[
			"@semantic-release/npm",
			{
				npmPublish: false,
			},
		],
		[
			"@semantic-release/git",
			{
				assets: ["package.json", "CHANGELOG.md"],
				message:
					"chore(release/backend): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
			},
		],
		[
			"@semantic-release/github",
			{
				releasedLabels: ["released-backend"],
				successComment: false,
				failComment: false,
			},
		],
	],
};
