
## Test Environment

- Truffle v3.4.4
- Testrpc v3.0.5

## Setup

- startup Testrpc
- go to the project directory

`
npm install
truffle test
`


## Test Todo

- `ledger`
- `investedAmountOf`
- What happens owner_address is not the actual contact deployed address?
- Is the library version up to date?

## Notes

- Is `function() payable` needed?
- What is `isCrowdsale` for?
- No minimum nor max amount raised. What happens if max amount exceeds ICO limit?
- Why do we need `buy` and `invest`? Why not just `buy`?

## Suggestions

- Add max cap
- Remove unnecessary codes
