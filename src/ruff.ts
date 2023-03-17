import * as core from '@actions/core'
import {OutputProcessor} from './types'
import path from 'path'

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
  const basepath = path.resolve(__dirname)
  core.info(`Base ${basepath}, ${process.cwd()}`)
  core.info(`Problems found: ${parsed.length}`)
  // TODO process the entries
  for (const entry of parsed) {
    core.info(`Entry: ${entry.filename}`)
  }
}
