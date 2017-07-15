const ForecasterReward = artifacts.require("./ForecasterReward.sol");
const Tempo = require('@digix/tempo');
const chai = require('chai');
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)
assert = chai.assert;
const state = {
  'PreFunding':0, 'Funding':1, 'Closed':2
}

contract('ForecasterReward', function(accounts) {
  let instance, current_block, investment;
  let owner_address = accounts[0];
  let start_block   = 10;
  let end_block     = 20;
  let forecaster_contract_address = accounts[1];
  let pre_ico_contract_address = accounts[2];
  let investor_1 = accounts[3];
  let investor_2 = accounts[4];

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
    beforeEach(async function(){
      current_block = web3.eth.blockNumber;
      start_block = current_block + 10;
      end_block = start_block + 100;
      instance = await ForecasterReward.new(
        owner_address,
        start_block,
        end_block,
        forecaster_contract_address,
        pre_ico_contract_address
      )
    })

    it("PreFunding by default", async function() {
      assert.deepEqual((await instance.getState.call()).toNumber(), state['PreFunding']);
    });

    it("Funding after start time has passed", async function() {
      await waitUntilBlock(0, start_block + 2);
      assert.deepEqual((await instance.getState.call()).toNumber(), state['Funding']);
    });

    it("Closed after end time has passed", async function() {
      await waitUntilBlock(0, end_block + 2);
      assert.deepEqual((await instance.getState.call()).toNumber(), state['Closed']);
    });

  })

  describe('basic investment flow', function(){
    beforeEach(async function(){
      current_block = web3.eth.blockNumber;
      start_block = current_block + 10;
      end_block = start_block + 100;
      instance = await ForecasterReward.new(
        owner_address,
        start_block,
        end_block,
        forecaster_contract_address,
        pre_ico_contract_address
      )
    })

    it('Funding', async function(){
      investment = web3.toWei(1, 'ether');
      await waitUntilBlock(0, start_block + 2);
      assert.deepEqual((await instance.getState.call()).toNumber(), state['Funding']);
      await instance.buy({value:investment, from:investor_1});
      await instance.buy({value:investment, from:investor_1});
      await instance.buy({value:investment, from:investor_2});
      assert.deepEqual((await instance.investorCount.call()).toNumber(), 2);
      assert.deepEqual((await instance.totalInvestments.call()).toNumber(), 3);
      assert.deepEqual((await instance.weiRaised.call()).toNumber(), investment * 3);

      let forecaster_contract_address_before = web3.eth.getBalance(forecaster_contract_address)
      let pre_ico_contract_address_before = web3.eth.getBalance(pre_ico_contract_address)

      await waitUntilBlock(0, end_block + 2);

      await instance.finalize({from:owner_address});

      let forecaster_contract_address_after = web3.eth.getBalance(forecaster_contract_address);
      let pre_ico_contract_address_after = web3.eth.getBalance(pre_ico_contract_address);
      let forecaster_contract_address_diff = forecaster_contract_address_after - forecaster_contract_address_before;
      let pre_ico_contract_address_diff = pre_ico_contract_address_after - pre_ico_contract_address_before;

      assert.deepEqual(forecaster_contract_address_diff.toString(), web3.toWei(0.15, 'ether').toString());
      assert.deepEqual(pre_ico_contract_address_diff.toString(), web3.toWei(2.85, 'ether').toString());
    })
  })
});
