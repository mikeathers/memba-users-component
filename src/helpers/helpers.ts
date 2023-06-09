import {Construct} from 'constructs'
import {execSync} from 'child_process'

const stages = ['dev', 'prod'] as const

export const isLocalStage = (val: string): val is `local-${string}` =>
  val.startsWith('local')

const isValidStage = <T extends readonly string[]>(
  array: T,
  val: string,
): val is (typeof stages)[number] => {
  return isLocalStage(val) || array.includes(val)
}

export const getStage = (scope: Construct) => {
  //eslint-disable-next-line
  const stage = scope.node.tryGetContext('stage')

  if (typeof stage !== 'string') {
    throw new Error(
      `You have not configured a stage. Please try again with 'cdk deploy --context stage=<stage>'`,
    )
  }

  if (!isValidStage(stages, stage)) {
    throw new Error(`Stage '${stage}' is not valid.`)
  }

  return stage
}

export const getVersion = () =>
  execSync('git describe --tags --always --dirty', {encoding: 'utf8'}).trim()
