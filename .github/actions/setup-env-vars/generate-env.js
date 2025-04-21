#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Read the template file
const templatePath = path.join(__dirname, 'env-template.txt')
const template = fs.readFileSync(templatePath, 'utf8')

// Replace the NODE_ENV placeholder with the value from command line args
const nodeEnv = process.argv[2] || 'test'
const envVars = template.replace('{{NODE_ENV}}', nodeEnv)

// Output the environment variables section
console.log(envVars)
