
# Audit requirements

- The code must be open sourced prior to the start of the auditing so that we can publicly refer the specific commit number.
- Some common sense must be implemented (ie: set max amount)
- If critical error has been found, the Pre ICO has to be postponed.


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
