import {useState} from 'react';
import Button from '../Button';
import {ModalContainer} from '../modals';
import {Form} from 'react-bootstrap';
import {privacyModeState} from '/@/store';
import {useRecoilState} from 'recoil';
import {IOPTIONS, OPTIONS} from '/@/store/privacy';

export const PrivacyOptions = () => {
  const [showModal, setShowModal] = useState(false);
  const [privacyMode, setPrivacyMode] = useRecoilState(privacyModeState);

  const closeModal = () => {
    setShowModal(false);
  };

  const toggleOption = (option: IOPTIONS) => {
    if (privacyMode.fields.includes(option)) {
      setPrivacyMode({
        ...privacyMode,
        fields: privacyMode.fields.filter(field => field !== option),
      });
    } else {
      setPrivacyMode({
        ...privacyMode,
        fields: [...privacyMode.fields, option],
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        text="Show"
        className="link-button custom-delegate-button purple-text align-end  no-padding"
      />

      <ModalContainer
        show={showModal}
        closeOnBackgroundClick
        close={closeModal}
      >
        <div>
          <div className="settings-modal-container">
            <h1 className="w-100 text-center">Privacy options</h1>
            <hr />
          </div>
          <Form>
            <div className="w-100 flex flex-col">
              {OPTIONS.map(option => (
                <>
                  <div
                    key={option}
                    onClick={() => toggleOption(IOPTIONS[option as keyof typeof IOPTIONS])}
                    className="flex flex-row w-100 justify-between"
                  >
                    {option}
                    <Form.Check
                      type={'switch'}
                      id={`privacy-toggle-${option}`}
                      checked={privacyMode.fields.includes(
                        IOPTIONS[option as keyof typeof IOPTIONS],
                      )}
                      onClick={() => toggleOption(IOPTIONS[option as keyof typeof IOPTIONS])}
                    />
                  </div>
                  <hr />
                </>
              ))}
            </div>
          </Form>
        </div>
      </ModalContainer>
    </>
  );
};
