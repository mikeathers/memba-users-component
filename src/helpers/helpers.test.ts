import * as cdk from 'aws-cdk-lib'
import {execSync} from 'child_process'
import {mocked} from 'jest-mock'
import {mock} from 'jest-mock-extended'
import {getStage, getVersion, isLocalStage} from './helpers'

jest.mock('child_process')

beforeEach(() => {
  mocked(execSync).mockReturnValue(mock())
})

describe('Helpers', () => {
  describe('isLocalStage', () => {
    it('should return true if starting with local-', () => {
      expect(isLocalStage('local-')).toBeTruthy()
    })

    it('should return false without local-', () => {
      expect(isLocalStage('dev')).toBeFalsy()
    })
  })

  describe('getStage', () => {
    it('throws an error if a stage is not configured', () => {
      const app = new cdk.App()
      const stack = new cdk.Stack(app)

      expect(() => getStage(stack)).toThrow(
        new Error(
          `You have not configured a stage. Please try again with 'cdk deploy --context stage=<stage>'`,
        ),
      )
    })

    it('throws an error if stage is not valid', () => {
      const app = new cdk.App({
        context: {
          stage: 'invalid-test',
        },
      })

      const stack = new cdk.Stack(app)

      expect(() => getStage(stack)).toThrow(
        new Error("Stage 'invalid-test' is not valid."),
      )
    })

    it('returns the stage if it is a valid local stage', () => {
      const app = new cdk.App({
        context: {
          stage: 'local-test',
        },
      })

      const stack = new cdk.Stack(app)

      expect(getStage(stack)).toBe('local-test')
    })

    it('returns the stage if it is valid', () => {
      const app = new cdk.App({
        context: {
          stage: 'dev',
        },
      })

      const stack = new cdk.Stack(app)

      expect(getStage(stack)).toBe('dev')
    })
  })

  describe('getVersion', () => {
    it('uses execSync', () => {
      getVersion()
      expect(execSync).toBeCalled()
    })
  })
})
