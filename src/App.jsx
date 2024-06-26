import { useState } from 'react'
import { ethers } from 'ethers'
import ABI from './ABI.json'
import Notification from './Notification';
import Trump from './assets/Trump.png'
import Biden from './assets/Biden.png'

function App() {

  const voteOrDieAddress = '0x6a8b47839afeCa8A0709139157dC5Bc810D5c765'
  //const freedomUnitsAddress = '0x7351D6a45092Ca83092eF4c675182Bb0F294266c'

  const [connected, setConnected] = useState(false)
  const [name, setName] = useState('')
  const [value, setValue] = useState(0)
  const [winner, setWinner] = useState(0)
  const [admin, setAdmin] = useState(false)
  const [totalTrumpBets, setTotalTrumpBets] = useState(0)
  const [totalBidenBets, setTotalBidenBets] = useState(0)
  const [userBetAmount, setUserBetAmount] = useState(0)
  const [userBetChoice, setUserBetChoice] = useState(null)
  const [marketEnded, setMarketEnded] = useState(false)
  const [winnings, setWinnings] = useState(0)
  const [rewards, setRewards] = useState(0)
  const [hovered, setHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metamask, setMetamask] = useState(false);
  const [notification, setNotification] = useState({ message: '', show: false });

  const handleChange = (event) => {
    setValue(event.target.value)
  }

  const showNotification = (message) => {
    setNotification({ message, show: true });
  };

  const connect = async () => {
    setLoading(true)
    let provider;
    try {
      if (window.ethereum == null) {
        setMetamask(true);
        showNotification('MetaMask not installed!');
        console.log("MetaMask not installed; using read-only defaults");
        provider = ethers.getDefaultProvider();
      } else {
        provider = new ethers.BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const desiredChainId = '0x14A34';
        if (network.chainId !== parseInt(desiredChainId)) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: desiredChainId }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: desiredChainId,
                  chainName: 'Base Sepolia',
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://sepolia.base.org'],
                  blockExplorerUrls: ['https://sepolia-explorer.base.org'],
                }],
              });
            } else {
              throw switchError;
            }
          }
        }
        provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress()
        let userName = null;
        const ensProvider = new ethers.InfuraProvider('mainnet');
        const ens = await ensProvider.lookupAddress(address);
        if (ens) {
          userName = ens;
        } else {
          userName = address.substr(0, 6) + "...";
        }
        const readOnlyContract = new ethers.Contract(voteOrDieAddress, ABI, provider)
        const owner = await readOnlyContract.owner()
        const [trumpBets, bidenBets] = await readOnlyContract.getTotalBets()
        setTotalTrumpBets(ethers.formatEther(trumpBets))
        setTotalBidenBets(ethers.formatEther(bidenBets))
        const [userBetAmount, userBetChoice] = await readOnlyContract.getUserBet(address)
        setUserBetAmount(ethers.formatEther(userBetAmount))
        setUserBetChoice(userBetChoice)
        try {
          const contract = new ethers.Contract(voteOrDieAddress, ABI, signer)
          const rewards = await contract.projectedTokenReward()
          const rewardsString = ethers.formatEther(rewards);
          const formattedRewards = rewardsString.substring(0, rewardsString.indexOf('.') + 4); // Get the substring up to 3 decimal places
          setRewards(formattedRewards);
        } catch (error) {
          setRewards(0)
        }
        const endCheck = await readOnlyContract.marketClosed()
        const message = "sign in"
        const sig = await signer.signMessage(message);
        const verify = ethers.verifyMessage(message, sig)
        if (address === verify) {
          setConnected(true)
          if (address === owner) {
            setAdmin(true)
          }
          if (endCheck === true) {
            let calcWinnings;
            if (winner === 0) {
              calcWinnings = userBetAmount * (trumpBets + bidenBets) / trumpBets;
            } else {
              calcWinnings = userBetAmount * (trumpBets + bidenBets) / bidenBets;
            }
            setWinnings(ethers.formatEther(calcWinnings));
            setMarketEnded(true)
          }
        } else {
          showNotification('Connection failed!');
        }
        setName(userName);
        setConnected(true);
        setMetamask(false);
        showNotification('Connected!');
      }
    } catch (error) {
      console.log(error)
    }
    setLoading(false);
  };


  const Bet = async (choice) => {
    try {
      setLoading(true)
      const _provider = new ethers.BrowserProvider(window.ethereum)
      const _signer = await _provider.getSigner();
      const _contract = new ethers.Contract(voteOrDieAddress, ABI, _signer)
      const betValue = ethers.parseEther(value.toString())
      const tx = await _contract.placeBet(choice, { value: betValue })
      await tx.wait()
      const address = await _signer.getAddress()
      const readOnlyContract = new ethers.Contract(voteOrDieAddress, ABI, _provider)
      const [userBetAmount, userBetChoice] = await readOnlyContract.getUserBet(address)
      setUserBetAmount(ethers.formatEther(userBetAmount))
      setUserBetChoice(userBetChoice)
      const [trumpBets, bidenBets] = await readOnlyContract.getTotalBets()
      setTotalTrumpBets(ethers.formatEther(trumpBets))
      setTotalBidenBets(ethers.formatEther(bidenBets))
      showNotification('Bet placed successfully!');
    } catch (error) {
      showNotification('Error placing bet!')
      console.log(error)
    }
    setLoading(false)
  }

  const cancelBet = async () => {
    try {
      setLoading(true)
      const _provider = new ethers.BrowserProvider(window.ethereum)
      const _signer = await _provider.getSigner();
      const _contract = new ethers.Contract(voteOrDieAddress, ABI, _signer)
      const tx = await _contract.cancelBet()
      await tx.wait()
      const address = await _signer.getAddress()
      const readOnlyContract = new ethers.Contract(voteOrDieAddress, ABI, _provider)
      const [userBetAmount, userBetChoice] = await readOnlyContract.getUserBet(address)
      setUserBetAmount(ethers.formatEther(userBetAmount))
      setUserBetChoice(userBetChoice)
      const [trumpBets, bidenBets] = await readOnlyContract.getTotalBets()
      setTotalTrumpBets(ethers.formatEther(trumpBets))
      setTotalBidenBets(ethers.formatEther(bidenBets))
      showNotification('Bet cancelled successfully!');
    } catch (error) {
      showNotification('Error cancelling bet!')
      console.log(error)
    }
    setLoading(false)
  }

  const endMarket = async () => {
    try {
      setLoading(true)
      const _provider = new ethers.BrowserProvider(window.ethereum)
      const _signer = await _provider.getSigner();
      const _contract = new ethers.Contract(voteOrDieAddress, ABI, _signer)
      const tx = await _contract.closeMarket(winner)
      await tx.wait()
      setMarketEnded(true)
      showNotification('Voting ended successfully!');
    } catch (error) {
      showNotification('Error ending market!')
      console.log(error)
    }
    setLoading(false)
  }

  const claim = async () => {
    try {
      setLoading(true)
      const _provider = new ethers.BrowserProvider(window.ethereum)
      const _signer = await _provider.getSigner();
      const _contract = new ethers.Contract(voteOrDieAddress, ABI, _signer)
      const tx = await _contract.claimWinnings()
      await tx.wait()
      showNotification('Winnings claimed successfully!');
    } catch (error) {
      showNotification('Error claiming winnings!')
      console.log(error)
    }
    setLoading(false)
  }

  const handleWinner = (event) => {
    const value = event.target.value;
    if (value === '0' || value === '1') {
      setWinner(Number(value));
    } else {
      console.log('Invalid value for winner:', value);
    }
  }

  const installMetamask = () => {
    window.open('https://metamask.io/download.html', '_blank');
  };

  return (
    <div className='app'>
      <div className='main'>
        <h1>Vote or Die!</h1>
        {loading && (
          <div className='loading-cont'>
            <div className="loader"></div>
          </div>
        )}
        <Notification
          message={notification.message}
          show={notification.show}
          setShow={(show) => setNotification({ ...notification, show })} />
        {!connected && <button onClick={connect}>Connect</button>}
        {metamask && <button onClick={installMetamask}>Install MetaMask</button>}
        {!marketEnded && (
          <>
            {connected && (
              <>
                <div className='buttons'>
                  <img className='candidate' src={Trump} alt='Trump' />
                  <img className='candidate' src={Biden} alt='Biden' />
                  <button className='trump' onClick={() => Bet(0)}>TRUMP</button>
                  <button className='biden' onClick={() => Bet(1)}>BIDEN</button>
                  <button className='cancel' onClick={cancelBet}>Cancel Bet</button>
                </div>
                <div className='input-container'>
                  <input
                    onChange={handleChange}
                    placeholder='place your bet'
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    className={hovered ? 'shimmer' : ''}
                  />
                </div>

                <div className='totals'>
                  <p className='mobile'><strong>TRUMP: </strong> {totalTrumpBets} ETH</p>
                  <div className='id'>
                    <strong>{name}</strong>
                  </div>
                  <p className='mobile'><strong>BIDEN: </strong> {totalBidenBets} ETH</p>
                  <p className='rewards'>Freedom Units: {rewards} FU</p>
                </div>
                {parseFloat(userBetAmount) > 0 ? (
                  <p>Your Bet: {userBetAmount} ETH on {userBetChoice === 0 ? 'Trump' : 'Biden'}</p>
                ) : (
                  <p>No bet placed</p>
                )}
                {admin && (
                  <>
                    <div className='end-buttons'>
                      <button onClick={() => endMarket(winner)}>End Market</button>
                      <select onChange={handleWinner}>
                        <option value='0'>Trump</option>
                        <option value='1'>Biden</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
        {marketEnded && (
          <>
            <p>You won: {winnings} ETH</p>
            <button onClick={claim}>Claim Winnings</button>
          </>
        )}
      </div>
    </div >
  )
}

export default App
