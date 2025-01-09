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
        text="Open"
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
            <ul>
              {OPTIONS.map(option => (
                <li key={option}>
                  {option}
                  <Form.Check
                    type={'switch'}
                    id={`privacy-toggle-${option}`}
                    defaultChecked={privacyMode.fields.includes(
                      IOPTIONS[option as keyof typeof IOPTIONS],
                    )}
                    onClick={() => toggleOption(IOPTIONS[option as keyof typeof IOPTIONS])}
                  />
                </li>
              ))}
            </ul>
          </Form>
        </div>
      </ModalContainer>
    </>
  );
};
