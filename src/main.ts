import * as core from '@actions/core';
import * as github from '@actions/github';

// -----------------------------------------------------------------------------

async function run(): Promise<void> {
	try {
		// Ensure the github token is passed through environment variables
		const token = process.env.GITHUB_TOKEN;
		if (!token) {
			throw new Error('GITHUB_TOKEN environment variable not found. pass `GITHUB_TOKEN` as env');
		}

		// Create the GitHub accessor
		const octokit = github.getOctokit(token);

		// Get target owner and repository
		let { repo, owner } = github.context.repo;
		const ownerRepo = core.getInput('repo');
		if (ownerRepo) {
			const ownerRepoItems = ownerRepo.split('/');
			if (ownerRepoItems.length != 2) {
				throw new Error('the specified `repo` is invalid');
			}
			owner = ownerRepoItems[0].trim();
			repo = ownerRepoItems[1].trim();
			if (owner.length == 0 || repo.length == 0) {
				throw new Error('the specified `repo` is invalid');
			}
		}

		// Get tag to delete
		const tagName = core.getInput('tag');
		if (!tagName) {
			throw new Error('no `tag` input');
		}

		// Get deletion flags
		let input = core.getInput('delete_tag');
		let deleteTag = (!input) || isYes(input);

		input = core.getInput('delete_release');
		let deleteRelease = (!input) || isYes(input);

		if (deleteTag) {
			deleteRelease = true;
		}
		if (!(deleteRelease || deleteTag)) {
			throw new Error('no action to execute');
		}

		// Execute delete release action
		if (deleteRelease) {
			core.info('Deleting release with tag: ' + tagName);

			let releaseId = 0;

			// Get the release ID of the given tag
			try {
				const releaseInfo = await octokit.rest.repos.getReleaseByTag({
					owner,
					repo,
					tag: tagName
				});
				if (releaseInfo.status !== 200) {
					throw new Error('Failed to retrieve release from tag');
				}

				releaseId = releaseInfo.data.id;
			}
			catch (err: any) {
				// Handle release not found error
				if (err.status !== 404 && err.message !== 'Not Found') {
					throw err;
				}
			}

			// Delete release if found
			if (releaseId > 0) {
				try {
					await octokit.rest.repos.deleteRelease({
						owner,
						repo,
						release_id: releaseId,
					});
				}
				catch (err: any) {
					// Handle release not found error
					if (err.status !== 404 && err.message !== 'Not Found') {
						throw err;
					}
				}
			}
		}

		// Execute delete tag action
		if (deleteTag) {
			core.info('Deleting tag: ' + tagName);

			// Delete tag reference
			try {
				await octokit.rest.git.deleteRef({
					owner,
					repo,
					ref: 'tags/' + tagName
				});
			}
			catch (err: any) {
				// Handle tag reference not found error
				if (err.status !== 404 && err.message !== 'Not Found' && err.status !== 422 && err.message !== 'Reference does not exist') {
					throw err;
				}
			}
		}
	}
	catch (err: any) {
		if (err instanceof Error) {
			core.setFailed(err.message);
		}
		else if (err.toString) {
			core.setFailed(err.toString());
		}
		else {
			core.setFailed('unknown error');
		}
	}
}

function isYes(input: string): boolean {
	input = input.toLowerCase();
	return (input === 'true') || (input === 'yes') || (input === 'y') || (input === '1')
}

// -----------------------------------------------------------------------------

run();
