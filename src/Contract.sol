// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PredictionMarket {
    enum Candidate { Trump, Biden }

    struct Bet {
        uint amount;
        Candidate choice;
    }

    mapping(address => Bet) public bets;
    address[] public bettors;
    uint public totalTrumpBets;
    uint public totalBidenBets;
    Candidate public outcome;
    bool public marketClosed;
    address public owner;
    bool private locked;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    modifier marketOpen() {
        require(!marketClosed, "The market is closed");
        _;
    }

    modifier noReentrancy() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        owner = msg.sender;
    }

    function placeBet(Candidate _choice) external payable marketOpen {
        require(msg.value > 0, "Bet amount must be greater than zero");
        require(bets[msg.sender].amount == 0, "You have already placed a bet");

        bets[msg.sender] = Bet({
            amount: msg.value,
            choice: _choice
        });

        bettors.push(msg.sender);

        if (_choice == Candidate.Trump) {
            totalTrumpBets += msg.value;
        } else {
            totalBidenBets += msg.value;
        }
    }

    function closeMarket(Candidate _outcome) external onlyOwner marketOpen {
        marketClosed = true;
        outcome = _outcome;
    }

    function claimWinnings() external noReentrancy {
        require(marketClosed, "The market is still open");
        require(bets[msg.sender].amount > 0, "You did not place a bet");

        Bet memory userBet = bets[msg.sender];
        require(userBet.choice == outcome, "You did not bet on the correct outcome");

        uint reward;
        if (outcome == Candidate.Trump) {
            reward = (userBet.amount * (totalTrumpBets + totalBidenBets)) / totalTrumpBets;
        } else {
            reward = (userBet.amount * (totalTrumpBets + totalBidenBets)) / totalBidenBets;
        }
        bets[msg.sender].amount = 0;
        payable(msg.sender).transfer(reward);
    }

    function getTotalBets() external view returns (uint trumpBets, uint bidenBets) {
        return (totalTrumpBets, totalBidenBets);
    }

    function getUserBet(address user) external view returns (uint amount, Candidate choice) {
        Bet memory userBet = bets[user];
        return (userBet.amount, userBet.choice);
    }
}
