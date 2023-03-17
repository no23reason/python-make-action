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
  const parsed: RuffEntry[] = JSON.parse(output)
  const problems = parsed.length
  if (!problems) {
    return
  }

  const basePath = `${process.cwd()}/`
  const octokit = github.getOctokit(core.getInput('token'))
  type Annotation = Parameters<typeof octokit['rest']['checks']['update']>[0]
  const annotations: Annotation[] = parsed.map(entry => {
    const relativePath = entry.filename.replace(basePath, '')
    return {
      path: relativePath,
      start_line: entry.location.row,
      end_line: entry.end_location.row,
      start_column: entry.location.column,
      end_column: entry.end_location.column,
      annotation_level: 'failure',
      message: `[${entry.code}] ${entry.message}`
    }
  })

  core.info('ANNOTATIONS:')
  core.info(JSON.stringify(annotations))

  const res = await octokit.rest.checks.listForRef({
    check_name: 'validate-python', // TODO configurable
    ...github.context.repo,
    ref: github.context.sha
  })

  core.info('RES:')
  core.info(JSON.stringify(res))

  const check_run_id = res.data.check_runs[0].id
  await octokit.rest.checks.update({
    ...github.context.repo,
    check_run_id,
    output: {
      title: 'Ruff failure',
      summary: `${annotations.length} errors(s) found`,
      annotations
    }
  })
  core.setFailed(`Problems found: ${parsed.length}`)
}
