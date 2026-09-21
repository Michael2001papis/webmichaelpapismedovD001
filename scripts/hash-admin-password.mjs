import { randomBytes, scryptSync } from 'node:crypto'

const password = process.argv[2]
if (!password) {
  console.error('Usage: npm run admin:hash -- <password>')
  process.exit(1)
}

const salt = randomBytes(16)
const hash = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 })
console.log(`scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`)
