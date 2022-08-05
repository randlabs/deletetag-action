# deletetag-action

A [GitHub Action][github-actions-url] to delete tags and/or releases written in [TypeScript][typescript-url]

[![License][license-image]][license-url]
[![Issues][issues-image]][issues-url]

## Usage

```YML
    ...
    - name: Deleting mytag tag and release
      id: deltag
      uses: randlabs/deletetag-action@v1.0.0
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag: mytag
    ...
```

### Inputs

```YML
inputs:
  tag:
    description: 'Tag name'
    required: true
  delete_release:
    description: 'Whether to delete release or not'
    required: false
    default: true
  delete_tag:
    description: 'Whether to delete tag or not (implies delete_release if true)'
    required: false
    default: true
  repo:
    description: 'Target repository in <owner-or-company>/<repository> format'
    required: false
```

### Permissions

This Action requires the following permissions on the GitHub integration token:

```YML
permissions:
  contents: write
```

### Environment variables:

`GITHUB_TOKEN` must be set to the workflow's token or the personal access token (PAT) required to accomplish the task.

[typescript-url]: http://www.typescriptlang.org/
[github-actions-url]: https://github.com/features/actions
[license-url]: https://github.com/randlabs/deletetag-action/blob/master/LICENSE
[license-image]: https://img.shields.io/github/license/randlabs/deletetag-action.svg
[issues-url]: https://github.com/randlabs/deletetag-action/issues
[issues-image]: https://img.shields.io/github/issues-raw/randlabs/deletetag-action.svg
