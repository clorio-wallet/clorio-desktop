/* eslint-disable react/display-name */
import {useEffect, useState} from 'react';
import {useContext} from 'react';
import './style.css';
import {
  deriveAccountFromMnemonic,
  getAccountByAddress,
  getAllAccounts,
  getPassphraseFlag,
  pushAccount,
  removeAccountByAddress,
  storeSession,
  toMINA,
} from '/@/tools';
import {IWalletIdData} from '/@/types';
import {IBalanceContext} from '/@/contexts/balance/BalanceTypes';
import {BalanceContext} from '/@/contexts/balance/BalanceContext';
import {useNavigate} from 'react-router-dom';
import Avatar from '/@/tools/avatar/avatar';
import {Check, Trash, Plus, Key} from 'react-feather';
import {toast} from 'react-toastify';
import {useWallet} from '/@/contexts/WalletContext';
import {useLazyQuery} from '@apollo/client';
import {GET_ID} from '/@/graphql/query';
import useSecureStorage from '/@/hooks/useSecureStorage';
import {sendResponse} from '/@/tools/mina-zkapp-bridge';
import Button from '../../Button';

interface StoredAccount {
  address: string;
  accountId: number;
}

const MnemonicAccountSelection = ({
  currentAddress,
  onAccountChange,
  toggleLoader,
}: {
  currentAddress: string;
  onAccountChange: (wallet: {publicKey: string; accountId: number}) => void;
  toggleLoader: (state?: boolean) => void;
}) => {
  const [accountId, setAccountId] = useState(1);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [hasMnemonic, setHasMnemonic] = useState(false);
  const [storedAccounts, setStoredAccounts] = useState<StoredAccount[]>([]);
  const navigate = useNavigate();
  const {updateWallet} = useWallet();
  const {decryptData, hasEncryptedData} = useSecureStorage();

  const [fetchUserId] = useLazyQuery<IWalletIdData>(GET_ID, {
    variables: {publicKey: ''},
  });
  const {getBalance, setShouldBalanceUpdate, removeBalance} =
    useContext<Partial<IBalanceContext>>(BalanceContext);

  useEffect(() => {
    const accounts = getAllAccounts();
    setStoredAccounts(accounts);
    const maximumId = getMaximumAccountId(accounts);
    setAccountId(maximumId + 1);
  }, [currentAddress]);

  useEffect(() => {
    setHasMnemonic(getPassphraseFlag());
  }, []);

  const getMaximumAccountId = (accounts: StoredAccount[]) => {
    let id = 0;
    accounts.forEach(({accountId}) => {
      if (accountId && accountId > id) {
        id = accountId;
      }
    });
    return id;
  };

  const addNewAccount = () => {
    setShowAddAccount(true);
    // Calculate next available account ID
    const maximumId = getMaximumAccountId(storedAccounts);
    setAccountId(maximumId + 1);
  };

  const cancelAddAccount = () => {
    setShowAddAccount(false);
    setPassphrase('');
  };

  const onDelete = (address: string) => {
    removeAccountByAddress(address);
    const newAccounts = storedAccounts.filter(account => account.address !== address);
    removeBalance && removeBalance(address);
    setStoredAccounts(newAccounts);
    toast.success('Account removed');
  };

  const accountExists = (address: string) => {
    let result = false;
    storedAccounts.forEach(acc => {
      if (acc.address === address) {
        result = true;
      }
    });
    return result;
  };

  const deriveAccount = async () => {
    if (accountId !== 0 && !accountId) {
      toast.warn('Select an account number');
      throw new Error('Account number not selected');
    }
    try {
      let mnemonic: string | undefined;
      if (hasEncryptedData) {
        mnemonic = decryptData(passphrase);
      }
      const keypair = await deriveAccountFromMnemonic(mnemonic || passphrase, accountId);
      if (!accountExists(keypair?.pubKey as string)) {
        if (keypair) {
          const {data} = await fetchUserId({variables: {publicKey: keypair.pubKey}});
          const userId = data?.idByPublicKey?.id ? +data.idByPublicKey.id : -1;
          await pushAccount({address: keypair.pubKey, accountId});
          await storeSession({
            address: keypair.pubKey,
            id: userId,
            ledger: false,
            ledgerAccount: 0,
            mnemonic: true,
            accountNumber: accountId,
          });
          await updateWallet({
            address: keypair.pubKey,
            id: userId,
            ledger: false,
            ledgerAccount: 0,
            mnemonic: true,
            accountNumber: accountId,
            isAuthenticated: true,
          });
          if (setShouldBalanceUpdate) {
            setShouldBalanceUpdate(true);
            onAccountChange({publicKey: keypair.pubKey, accountId});
            setShowAddAccount(false);
            setPassphrase('');
          }
        }
      } else {
        toast.error('Account already stored');
      }
    } catch (error) {
      toast.error('Check the passphrase');
    }
  };

  const handleAccountClick = (address: string) => {
    if (address === currentAddress) return;
    const wallet = getAccountByAddress(address);
    if (wallet) {
      onAccountChange({accountId: wallet.accountId, publicKey: address});
      setShouldBalanceUpdate && setShouldBalanceUpdate(true);
      sendResponse('account-change', address);
      navigate('/');
      toggleLoader(true);
    }
  };

  return (
    <div className="mnemonic-account-container">
      <div className="mnemonic-account-list">
        {/* Existing Accounts */}
        {storedAccounts.map(({address, accountId}) => {
          const balance = getBalance && getBalance(address);
          const isCurrent = currentAddress === address;
          const balanceValue = balance?.unconfirmedTotal ? +balance.unconfirmedTotal : 0;

          return (
            <div
              key={address}
              className={`mnemonic-account-card ${isCurrent ? 'mnemonic-account-card--current' : ''}`}
              onClick={() => handleAccountClick(address)}
            >
              <div className="mnemonic-account-info">
                <div className="mnemonic-account-avatar">
                  <Avatar
                    address={address}
                    size={44}
                  />
                </div>
                <div className="mnemonic-account-details">
                  <p className="mnemonic-account-address">
                    {address.slice(0, 8)}...{address.slice(-8)}
                  </p>
                  <div className="mnemonic-account-meta">
                    <p className="mnemonic-account-label">
                      <Key size={12} />
                      Account #{accountId}
                    </p>
                    <p className="mnemonic-account-balance">
                      {toMINA(balanceValue)} MINA
                    </p>
                    {isCurrent && <span className="mnemonic-account-badge">Active</span>}
                  </div>
                </div>
              </div>
              {!isCurrent && (
                <div className="mnemonic-account-actions">
                  <button
                    className="mnemonic-account-delete"
                    onClick={e => {
                      e.stopPropagation();
                      onDelete(address);
                    }}
                    aria-label="Delete account"
                  >
                    <Trash />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Account */}
        {showAddAccount ? (
          <div className="mnemonic-account-form">
            <div className="mnemonic-account-form-header">
              <div className="mnemonic-account-add-icon">
                <Plus size={24} />
              </div>
              <h3 className="mnemonic-account-form-title">Add Account #{accountId}</h3>
            </div>

            <div className="mnemonic-account-form-group">
              <label className="mnemonic-account-form-label">
                {hasEncryptedData ? 'Password' : 'Passphrase'}
              </label>
              <input
                type="password"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
                placeholder={
                  hasEncryptedData ? 'Enter your password...' : 'Enter your passphrase...'
                }
                className="mnemonic-account-form-input"
                autoFocus
              />
            </div>

            <div className="mnemonic-account-form-actions">
              <button
                className="mnemonic-account-form-cancel"
                onClick={cancelAddAccount}
              >
                Cancel
              </button>
              <Button
                className="mnemonic-account-form-submit"
                onClick={deriveAccount}
                disabled={!passphrase}
                text="Add Account"
                icon={<Check size={18} />}
                style='primary'
              />
            </div>
          </div>
        ) : (
          <div
            className="mnemonic-account-add"
            onClick={addNewAccount}
          >
            <div className="onboarding-settings-icon">
              <Plus size={24} />
            </div>
            <div className="mnemonic-account-add-info">
              <p className="mnemonic-account-add-title">Add new account</p>
              <p className="mnemonic-account-add-subtitle">
                This account will share the same recovery phrase
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MnemonicAccountSelection;
