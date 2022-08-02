import * as core from '@actions/core';
import * as github from '@actions/github';

// -----------------------------------------------------------------------------

async function run(): Promise<void> {
	try {
		// Ensure the github token is passed through environment variables
		const token = core.getInput('github-token') || process.env.GITHUB_TOKEN;
		if (!token) {
			throw new Error('no `github-token` input nor GITHUB_TOKEN environment variable not found. pass `GITHUB_TOKEN` as env');
		}

		// Get tag to delete
		const tagName = core.getInput('tag', { required: true });
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

		// Create the GitHub accessor
		const octokit = github.getOctokit(token);

		// Delete releases of the given tag
		if (deleteRelease) {
			let releaseId = 0;

			// Get the release ID of the given tag
			core.info('Deleting release with tag: ' + tagName);
			try {
				const { data } = await octokit.rest.repos.getReleaseByTag({
					owner,
					repo,
					tag: tagName
				});
				releaseId = data.id;
			}
			catch (err: any) {
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
					if (err.status !== 404 && err.message !== 'Not Found') {
						throw err;
					}
				}
			}
		}

		// Delete tag
		if (deleteTag) {
			core.info('Deleting tag: ' + tagName);
			try {
				await octokit.rest.git.deleteRef({
					owner,
					repo,
					ref: 'tags/' + tagName
				});
			}
			catch (err: any) {
				if (err.status !== 422 && err.message !== 'Reference does not exist') {
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
	return (input === 'true') || (input === 'yes') || (input === '1') || (input === '1')
}

// -----------------------------------------------------------------------------

run();
