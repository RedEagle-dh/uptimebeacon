module.exports = {
	branches: [
		"main",
		{
			name: "develop",
			channel: "beta",
			prerelease: "beta",
		},
	],
	tagFormat: "v${version}",
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
			"@semantic-release/exec",
			{
				prepareCmd:
					'sed -i \'s/"version": "[^"]*"/"version": "${nextRelease.version}"/\' package.json && ' +
					'sed -i \'s/"version": "[^"]*"/"version": "${nextRelease.version}"/\' apps/frontend/package.json && ' +
					'sed -i \'s/"version": "[^"]*"/"version": "${nextRelease.version}"/\' apps/backend/package.json',
			},
		],
		[
			"@semantic-release/git",
			{
				assets: [
					"package.json",
					"apps/frontend/package.json",
					"apps/backend/package.json",
					"CHANGELOG.md",
				],
				message:
					"chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
			},
		],
		[
			"@semantic-release/github",
			{
				successComment: false,
				failComment: false,
			},
		],
	],
};
