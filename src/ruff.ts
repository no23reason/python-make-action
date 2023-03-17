import * as core from '@actions/core'
import * as github from '@actions/github'
import {OutputProcessor} from './types'

interface RuffEntry {
  code: string
  message: string
  location: Location
  end_location: Location
  filename: string
  noqa_row: number
}

interface Location {
  row: number
  column: number
}

export const ruffOutputProcessor: OutputProcessor = async output => {
  const octokit = github.getOctokit(core.getInput('token'))
  // const check = await octokit.rest.checks.create({
  //   ...github.context.repo,
  //   name: 'ruff',
  //   head_sha: github.context.sha,
  //   status: 'in_progress'
  // })

  // core.info('CHECK:')
  // core.info(JSON.stringify(check))

  // const check_run_id = check.data.id
  const parsed: RuffEntry[] = JSON.parse(output)
  const problems = parsed.length
  if (!problems) {
    // await octokit.rest.checks.update({
    //   ...github.context.repo,
    //   check_run_id,
    //   status: 'completed',
    //   conclusion: 'success'
    // })
    return
  }

  const basePath = `${process.cwd()}/`
  type Annotation = Parameters<typeof octokit['rest']['checks']['update']>[0]
  const annotations: Annotation[] = parsed.map(entry => {
    const relativePath = entry.filename.replace(basePath, '')
    const annotation: Annotation = {
      path: relativePath,
      start_line: entry.location.row,
      end_line: entry.end_location.row,
      annotation_level: 'failure',
      message: `[${entry.code}] ${entry.message}`
    }
    // only set the columns if rows match, otherwise the API will complain
    if (entry.location.row === entry.end_location.row) {
      annotation.start_column = entry.location.column
      annotation.end_column = entry.end_location.column
    }
    return annotation
  })

  core.info('ANNOTATIONS:')
  core.info(JSON.stringify(annotations))

  const res = await octokit.rest.checks.create({
    ...github.context.repo,
    output: {
      title: 'Ruff failure',
      summary: `${annotations.length} errors(s) found`,
      annotations
    },
    conclusion: 'failure',
    head_sha: 'ff2abd6', // github.context.ref,
    name: 'ruff'
  })
  core.info('RES:')
  core.info(JSON.stringify(res))
  core.setFailed(`Problems found: ${parsed.length}`)
}
