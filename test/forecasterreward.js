const ForecasterReward = artifacts.require("./ForecasterReward.sol");
const Tempo = require('@digix/tempo');
const chai = require('chai');
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)
assert = chai.assert;

contract('ForecasterReward', function(accounts) {
  let instance;
  let owner_address = accounts[0];
  let start_block   = 1;
  let end_block     = 10;
  let forecaster_contract_address = accounts[1];
  let pre_ico_contract_address = accounts[2];

  beforeEach(async function(){
    instance = await ForecasterReward.new(
      owner_address,
      start_block,
      end_block,
      forecaster_contract_address,
      pre_ico_contract_address
    )
  })

  describe('on construction', function(){
    it('correct params', async function(){
      instance = await ForecasterReward.new(
        owner_address,
        start_block,
        end_block,
        forecaster_contract_address,
        pre_ico_contract_address
      ).catch(function(){});
      assert.exists(instance);
    })

    it('0 owner_address', async function(){
      instance = await ForecasterReward.new(
        0,
        start_block,
        end_block,
        forecaster_contract_address,
        pre_ico_contract_address
      ).catch(function(){});
      assert.notExists(instance);
    })

    it('0 forecaster_contract_address', async function(){
      instance = await ForecasterReward.new(
        owner_address,
        start_block,
        end_block,
        0,
        pre_ico_contract_address
      ).catch(function(){});
      assert.notExists(instance);
    })

    it('0 pre_ico_contract_address', async function(){
      instance = await ForecasterReward.new(
        owner_address,
        start_block,
        end_block,
        forecaster_contract_address,
        0
      ).catch(function(){});
      assert.notExists(instance);
    })

    it('start_block cannot be greater than ends block', async function(){
      instance = await ForecasterReward.new(
        owner_address,
        start_block,
        start_block,
        forecaster_contract_address,
        0
      ).catch(function(){});
      assert.notExists(instance);
    })

  })

  describe('getState', function(){
    it("returns 1 by default", async function() {
      let r = await instance.getState()
      console.log(r, 1);
    });
  })
});
