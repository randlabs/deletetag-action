import * as core from '@actions/core';
import { getBoolInput, getOctokit, getRepoOwnerInput } from './helpers';

// -----------------------------------------------------------------------------

async function run(): Promise<void> {
	// Create the GitHub accessor
	const octokit = getOctokit();

	// Get target owner and repository
	const { repo, owner } = getRepoOwnerInput();

	// Get tag to delete
	const tagName = core.getInput('tag');
	if (!tagName) {
		throw new Error('missing `tag` input');
	}

	// Get deletion flags
	let deleteTag = getBoolInput('delete-tag', true);
	let deleteRelease = getBoolInput('delete-release', true);
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
				throw new Error('failed to retrieve release from tag');
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

// -----------------------------------------------------------------------------

run().catch((err: any) => {
	if (err instanceof Error) {
		core.setFailed(err.message);
	}
	else if (err.toString) {
		core.setFailed(err.toString());
	}
	else {
		core.setFailed('unknown error');
	}
});
