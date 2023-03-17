import * as core from '@actions/core'
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
  core.debug(`Problems found: ${parsed.length}`)
  // TODO process the entries
  for (const entry of parsed) {
    core.debug(`Entry: ${entry.filename}`)
  }
}
