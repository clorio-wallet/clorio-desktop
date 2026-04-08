import {Link, useNavigate} from 'react-router-dom';
import {Cpu, LogIn, TrendingUp, Edit3, Check, Code} from 'react-feather';
import Logo from '../logo/Logo';
import {clearAllAccounts, clearSession} from '../../../tools';
import {isRouteActiveClass} from './SidebarHelper';
import {useContext, useState} from 'react';
import type {ILedgerContext} from '../../../contexts/ledger/LedgerTypes';
import {LedgerContext} from '../../../contexts/ledger/LedgerContext';
import type {INetworkData} from '/@/types';
import useSecureStorage from '/@/hooks/useSecureStorage';
import {Menu, Sidebar, MenuItem} from 'react-pro-sidebar';
import './SidebarToggle';
import {createPortal} from 'react-dom';
import {SidebarToggle} from './SidebarToggle';
import AppSettings from './AppSettings';
import {useWallet} from '/@/contexts/WalletContext';
import {Badge} from 'react-bootstrap';
import ReactTooltip from 'react-tooltip';
import {toast} from 'react-toastify';

interface IProps {
  mnemonic?: boolean;
  network?: INetworkData;
  clearSessionData: () => void;
  toggleLoader: (state?: boolean) => void;
  isAuthenticated?: boolean;
}

export const CustomSidebar = ({
  network,
  mnemonic,
  clearSessionData,
  toggleLoader,
  isAuthenticated,
}: IProps) => {
  const [toggled, setToggled] = useState(false);
  const {updateWallet} = useWallet();
  const {isLedgerEnabled} = useContext<Partial<ILedgerContext>>(LedgerContext);
  const navigate = useNavigate();
  const {clearData} = useSecureStorage();
  const statusDot = network?.nodeInfo ? (
    <span className="green-dot" />
  ) : (
    <span className="red-dot" />
  );

  const logout = async () => {
    await clearSession();
    await clearData();
    await clearAllAccounts();
    navigate('/');
    clearSessionData();
  };

  const lockSession = async () => {
    await clearSession();
    await updateWallet({});
    clearSessionData();
    navigate('/');
  };

  const isElectron = navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
  const draggableBar =
    typeof document !== 'undefined' ? document.getElementById('draggable-bar') : null;

  return (
    <div>
      {isAuthenticated &&
        draggableBar &&
        createPortal(<SidebarToggle setToggled={setToggled} />, draggableBar)}
      <Sidebar
        toggled={toggled}
        customBreakPoint="1000px"
        onBackdropClick={setToggled}
      >
        <Menu>
          <MenuItem className="logo-sidebar-item">
            <Logo />
          </MenuItem>
          <hr />
          <MenuItem
            component={<Link to="/overview" />}
            className={`sidebar-item sidebar-item-container ${isRouteActiveClass('overview')}`}
          >
            <span>
              <Cpu /> Overview
            </span>
          </MenuItem>
          <MenuItem
            component={<Link to="/send-tx" />}
            className={`sidebar-item sidebar-item-container ${isRouteActiveClass('send-tx')}`}
          >
            <span>
              <LogIn /> Send TX
            </span>
          </MenuItem>
          <MenuItem
            component={<Link to="/stake" />}
            className={`sidebar-item sidebar-item-container ${isRouteActiveClass('stake')}`}
          >
            <span>
              <TrendingUp /> Staking Hub
            </span>
          </MenuItem>

          {!isLedgerEnabled && (
            <MenuItem
              component={<Link to="/sign-message" />}
              className={`sidebar-item sidebar-item-container ${isRouteActiveClass('sign-message')}`}
            >
              <span>
                <Edit3 /> Sign message
              </span>
            </MenuItem>
          )}
          <MenuItem
            component={<Link to="/verify-message" />}
            className={`sidebar-item sidebar-item-container ${isRouteActiveClass('verify-message')}`}
          >
            <span>
              <Check /> Verify message
            </span>
          </MenuItem>

          {isElectron ? (
            <MenuItem
              component={<Link to="/zkapps" />}
              className={`sidebar-item sidebar-item-container ${isRouteActiveClass('zkapps')}`}
            >
              <span>
                <Code /> Zkapps
              </span>
              <Badge
                bg="secondary"
                className="beta-tag"
              >
                Beta
              </Badge>
            </MenuItem>
          ) : (
            <MenuItem
              className={`sidebar-item-container ${!isElectron ? 'disabled-sidebar-item' : ''}`}
              onClick={() => toast.error('Zkapp feature is available only in Clorio Desktop')}
            >
              <>
                <span>
                  <Code /> zkApps
                </span>
                <Badge
                  bg="secondary"
                  className="beta-tag"
                >
                  Beta
                </Badge>
              </>
            </MenuItem>
          )}
        </Menu>
        <ReactTooltip />
        <div className="sidebar-footer-block">
          <div>
            <AppSettings
              toggleLoader={toggleLoader}
              lockSession={lockSession}
              logout={logout}
              network={network}
              statusDot={statusDot}
            />
          </div>
        </div>
      </Sidebar>
    </div>
  );
};
