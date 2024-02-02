/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

import ethers from 'ethers'
import crypto from 'crypto'

function genWallet(): void {
  const id = crypto.randomBytes(32).toString('hex')
  const privateKey = '0x' + id
  console.log('pvt key', privateKey)
  const wallet = new ethers.Wallet(privateKey)
  console.log('Address: ' + wallet.address)
}

genWallet()
