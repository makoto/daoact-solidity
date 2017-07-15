pragma solidity ^0.4.11;

import './Haltable.sol';
import './SafeMath.sol';


contract ForecasterReward is Haltable {

  using SafeMath for uint;

  /* the starting block of the crowdsale */
  uint public startsAt;

  /* the ending block of the crowdsale */
  uint public endsAt;

  /* How many wei of funding we have received so far */
  uint public weiRaised = 0;

  /* How many distinct addresses have invested */
  uint public investorCount = 0;
  
  /* How many total investments have been made */
  uint public totalInvestments = 0;
  
  /* Address of forecasters contract*/
  address public forecasters;
  
  /* Address of pre-ico contract*/
  address public preICOContract;

  struct Record{
    uint timestamp;               // human readable time
    uint blockNumber;             // miners cannot manipulated block number so it can be used for varification
    uint256 weiInvested;          // amount invested by the investor
    address investor;             // address of investor
  }

  /* Record of investments, can be traversed on base of totalInvestments */
  Record[] public ledger; 
  
  /** How much ETH each address has invested to this crowdsale */
  mapping (address => uint256) public investedAmountOf;

  
  /** State machine
   *
   * - Prefunding: We have not passed start time yet
   * - Funding: Active crowdsale
   * - Closed: Funding is closed.
   */
  enum State{PreFunding, Funding, Closed}

  // A new investment was made
  event Invested(address investor, uint weiAmount);

  // Funds transfer to other address
  event Transfer(address receiver, uint weiAmount);

  // Crowdsale end time has been changed
  event EndsAtChanged(uint endsAt);

  function ForecasterReward(address _owner,uint _start, uint _end, address _forecasters, address _preICOContract) {

    if (_owner == 0){
      throw;
    }

    owner = _owner;

    if(_start == 0) {
      throw;
    }
    
    startsAt = _start;
    
    if(_end == 0) {
      throw;
    }
    
    endsAt = _end;

    // Don't mess the blocks
    if(startsAt >= endsAt) {
      throw;
    }
    
    if (_forecasters == 0){
      throw;
    }
    
    if (_preICOContract == 0){
      throw;
    }
    
    forecasters = _forecasters;
    
    preICOContract = _preICOContract;
    
  }

  /**
   * Don't expect to just send in money
   */
  function() payable {
    throw;
  }

  /**
   * Make an investment.
   *
   * Crowdsale must be running for one to invest.
   * We must have not pressed the emergency brake.
   *
   * @param receiver The Ethereum address who have invested
   *
   */
  function investInternal(address receiver) stopInEmergency inState(State.Funding) private {

    uint weiAmount = msg.value;
    
    if (weiAmount == 0){
      throw;
    }
    
    if(investedAmountOf[receiver] == 0) {
      // A new investor
      investorCount++;
    }

    // count all investments
    totalInvestments++;

    // Update investor
    investedAmountOf[receiver] = investedAmountOf[receiver].add(weiAmount);
    
    // Up total accumulated fudns
    weiRaised = weiRaised.add(weiAmount);

    // write investment to ledger
    ledger.push(
      Record({
        timestamp:  block.timestamp,
        blockNumber: block.number,
        weiInvested : weiAmount,
        investor : receiver
      })
    );

    // Tell us invest was success
    Invested(receiver, weiAmount);
  }


  /**
   * Allow anonymous contributions to this crowdsale.
   */
  function invest(address addr) public payable {
    if (addr == 0){
      throw;
    }
    investInternal(addr);
  }

  /**
   * The basic entry point to participate the crowdsale process.
   *
   * Pay for funding, you will get invested tokens back in the sender address.
   */
  function buy() public payable {
    invest(msg.sender);
  }

  /**
   * Finalize a succcesful crowdsale.
   *
   * The owner can triggre a call the contract that provides post-crowdsale actions, like releasing the tokens.
   */
  function finalize() public inState(State.Closed) onlyOwner stopInEmergency {
    if (this.balance == 0){
      throw;    
    }
    
    // calculate 5% of forecasters  
    uint forecasterReward = this.balance.div(20);
    
    if (!forecasters.send(forecasterReward)){
      throw;
    }
    
    Transfer(forecasters,forecasterReward);
        
    uint remaining = this.balance;
    
    if(!preICOContract.send(this.balance)){
      throw;
    }
    
    Transfer(forecasters,remaining);
  }
  
  /**
   * Allow crowdsale owner to set addresses of beneficiaries of crowed sale
   * 
   * @param _forecaster The address of forecaster contract that receive 5% of funds
   * @param _preICO The address of preICO contract that receive 95% of funds
   */
   function setFinalize(address _forecaster, address _preICO) inState(State.PreFunding) public onlyOwner{
     if(_forecaster == 0) throw;
     if (_preICO == 0) throw;
     forecasters = _forecaster;
     preICOContract = _preICO;
   }

  /**
   * Allow crowdsale owner to close early or extend the crowdsale.
   *
   * This is useful e.g. for a manual soft cap implementation:
   * - after X amount is reached determine manual closing
   *
   * This may put the crowdsale to an invalid state,
   * but we trust owners know what they are doing.
   *
   */
  function setEndsAt(uint _endsAt) onlyOwner {

    if(block.number > _endsAt) {
      throw; // Don't change past
    }

    endsAt = _endsAt;
    EndsAtChanged(_endsAt);
  }

  /**
   * @return total of amount of wie collected by the contract 
   */
  function fundingRaised() public constant returns (uint){
    return weiRaised;
  }
  
  function availableFunding() public constant returns (uint){
      return this.balance;
  }


  /**
   * Crowdfund state machine management.
   *
   * We make it a function and do not assign the result to a variable, so there is no chance of the variable being stale.
   */
  function getState() public constant returns (State) {
    if (block.number < startsAt) return State.PreFunding;
    else if (block.number <= endsAt) return State.Funding;
    else if (block.number > endsAt) return State.Closed;
  }

  /** Interface marker. */
  function isCrowdsale() public constant returns (bool) {
    return true;
  }

  //
  // Modifiers
  //
  /** Modified allowing execution only if the crowdsale is currently running.  */
  modifier inState(State state) {
    if(getState() != state) throw;
    _;
  }

}