import {Dropdown} from 'react-bootstrap';
import GenerateTransaction from './GenerateTransaction';
import {ITransactionData} from '/@/types';
import {useState} from 'react';

enum Options {
  NULL,
  GENERATE_TRANSACTION,
}

export default function MoreOptionsMenu({transactionData}: {transactionData: ITransactionData}) {
  const [selectedOption, setSelectedOption] = useState(Options.NULL);

  const closeAll = () => {
    setSelectedOption(Options.NULL);
  };

  return (
    <>
      <Dropdown data-bs-theme="dark">
        <Dropdown.Toggle
          variant=""
          className='btn btn-outline-light mt-1 more-options-button'
        >
          More options
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item onClick={() => setSelectedOption(Options.GENERATE_TRANSACTION)}>
            Offline transaction
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>

      <GenerateTransaction
        show={selectedOption === Options.GENERATE_TRANSACTION}
        onClose={closeAll}
        transactionData={{
          nonce: transactionData.nonce.toString(),
          receiverAddress: transactionData.receiverAddress,
          fee: transactionData.fee.toString(),
          amount: transactionData.amount.toString(),
        }}
      />
    </>
  );
}
