import * as core from '@actions/core'
import * as exec from '@actions/exec'
import {OutputProcessor} from './types'
import {ruffOutputProcessor} from './ruff'

const outputProcessors: Record<string, OutputProcessor> = {
  ruff: ruffOutputProcessor
}

function parseInputs(): {
  target: string
  outputProcessor: OutputProcessor
} {
  const target = core.getInput('target')
  const scriptType = core.getInput('type')
  const outputProcessor = outputProcessors[scriptType]
  if (!outputProcessor) {
    throw new Error(`Unknown script type "${scriptType}"`)
  }
  return {target, outputProcessor}
}

async function runMakeScript(scriptName: string): Promise<string> {
  const {stdout} = await exec.getExecOutput('make', ['-s', scriptName])
  return stdout
}

async function run(): Promise<void> {
  try {
    const {target: scriptName, outputProcessor} = parseInputs()
    const output = await runMakeScript(scriptName)
    await outputProcessor(output)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
