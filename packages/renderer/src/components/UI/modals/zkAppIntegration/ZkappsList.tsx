import {useState} from 'react';
import zkappsMock from './zkappsMock';
import {useRecoilState} from 'recoil';
import {zkappStoreDataState} from '/@/store/zkappStoreData';
import {ModalContainer} from '../ModalContainer';
import Button from '../../Button';
import MDEditor from '@uiw/react-md-editor';

export default function ZkappsList() {
  const [zkappsList, setZkappsList] = useState(zkappsMock);
  const openLink = (url: string) => {
    (window.ipcBridge as any).invoke('open-win', JSON.stringify({url}));
  };
  const [{showZkappDetails, zkappDetails}, updateZkappStoreData] =
    useRecoilState(zkappStoreDataState);
  const onTilePress = item => {
    updateZkappStoreData(state => ({
      ...state,
      showZkappDetails: true,
      zkappDetails: item,
    }));
  };
  const onZkappClose = () => {
    updateZkappStoreData(state => ({
      ...state,
      showZkappDetails: false,
      zkappDetails: null,
    }));
  };
  return (
    <div>
      <div className="justify-start zkapps-list-container">
        {zkappsList.map((item: {url: string; name: string; icon: string; subtitle: string}) => (
          <div
            key={item.url}
            className="glass-card py-4 px-4 cursor-pointer zkapp-list-item flex-1 w-100 flex flex-row gap-4 items-center justify-start"
            onClick={() => onTilePress(item)}
          >
            <img
              src={`${item.icon}`}
              alt="favicon"
              className="zkapp-image"
            />
            <div>
              <h4>{item.name}</h4>
              <p className="mb-1 zkapp-name">{item.subtitle.slice(0, 100)}...</p>
            </div>
          </div>
        ))}
      </div>
      <ModalContainer
        show={showZkappDetails}
        close={onZkappClose}
      >
        {zkappDetails?.name && (
          <>
            <div className="flex flex-row justify-start items-center gap-4 flex-start">
              <img
                src={`${zkappDetails.icon}`}
                alt="favicon"
                className="zkapp-favicon zkapp-modal-image"
              />
              <div className="zkapp-modal-name">
                <h4>{zkappDetails?.name}</h4>
                <p className="p-0 m-0 font-18">{zkappDetails?.subtitle}</p>
              </div>
            </div>
            <div>
              <div className="flex flex-row mt-4 justify-evenly">
                <div className="flex flex-col items-center">
                  <p className="zkapp-label">Category</p>
                  <p>{zkappDetails?.category?.name}</p>
                </div>
                <div className="vertical-border-right"></div>
                <div className="flex flex-col items-center">
                  <p className="zkapp-label">Developer</p>
                  <p>{zkappDetails?.ownerUsername}</p>
                </div>
                <div className="vertical-border-right"></div>
                <div className="flex flex-col items-center">
                  <p className="zkapp-label">Version</p>
                  <p>{zkappDetails?.currentVersion}</p>
                </div>
              </div>
              <Button
                className="w-100 mb-4 mt-4"
                text="Open"
                style="primary"
                onClick={() => openLink(zkappDetails?.url)}
              />
              <div className="zkapp-description">
                <MDEditor.Markdown
                  className="text-white md:min-w-[350px] md:max-w-[350px] lg:max-w-[450px] zkapp-md"
                  source={zkappDetails?.body || "There isn't a description yet"}
                />
              </div>
            </div>
          </>
        )}
      </ModalContainer>
    </div>
  );
}
