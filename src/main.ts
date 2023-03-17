import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {OutputProcessor} from './types'
import {ruffOutputProcessor} from './ruff'

const outputProcessors: Record<string, OutputProcessor> = {
  ruff: ruffOutputProcessor
}

function parseInputs(): {
  scriptName: string
  outputProcessor: OutputProcessor
} {
  const scriptName = core.getInput('scriptName')
  const scriptType = core.getInput('scriptType')
  const outputProcessor = outputProcessors[scriptType]
  if (!outputProcessor) {
    throw new Error(`Unknown script type "${scriptType}"`)
  }
  return {scriptName, outputProcessor}
}

async function runMakeScript(scriptName: string): Promise<string> {
  const {stdout} = await exec.getExecOutput('make', ['-s', scriptName])
  return stdout
}

async function run(): Promise<void> {
  try {
    const {scriptName, outputProcessor} = parseInputs()
    const output = await runMakeScript(scriptName)
    await outputProcessor(output)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
