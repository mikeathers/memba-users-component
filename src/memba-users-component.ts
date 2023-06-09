#!/usr/bin/env node
import 'source-map-support/register'
import {App} from 'aws-cdk-lib'
import {getStage, getVersion} from './helpers'
import CONFIG from './config'
import {MembaUsersComponentStack} from './memba-users-component-stack'

const app = new App()
const stage = getStage(app)
const stackName = `${CONFIG.STACK_PREFIX}Component-${stage}`

const defaultConfig = {
  stage,
  stackName: stackName,
  tags: {
    service: 'auth-component',
    version: 'N/A',
    env: 'dev',
  },
}

const config = {
  dev: {
    env: {
      account: CONFIG.AWS_ACCOUNT_ID_DEV,
      region: CONFIG.REGION,
    },
    tags: {
      ...defaultConfig.tags,
      version: getVersion(),
    },
  },
  prod: {
    env: {
      account: CONFIG.AWS_ACCOUNT_ID_PROD,
      region: CONFIG.REGION,
    },
    tags: {
      ...defaultConfig.tags,
      version: getVersion(),
      env: 'prod',
    },
  },
}

new MembaUsersComponentStack(app, stackName, {
  ...defaultConfig,
  ...config[stage],
})
