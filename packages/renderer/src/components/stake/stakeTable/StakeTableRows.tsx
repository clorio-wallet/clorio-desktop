import {Copy, ExternalLink} from 'react-feather';
import Button from '../../UI/Button';
import {copyToClipboard, trimMiddle} from '/@/tools';
import Avatar from '/@/tools/avatar/avatar';

export const columns = (toggleModal, currentDelegate) => [
  {
    name: '#',
    width: '80px',
    cell: ({priority}) => <span className="table-value-text text-start">{priority}</span>,
  },
  {
    name: 'Validator',
    minWidth: '350px',
    // maxWidth: '650px',
    cell: ({name, image, publicKey}) => (
      <span className="table-value-text text-start flex justify-center items-center">
        <span style={{borderRadius: '25%', marginRight: '10px'}}>
          {image ? (
            <img
              style={{borderRadius: '25%', objectFit: 'cover'}}
              width={40}
              height={40}
              src={image}
            />
          ) : (
            <Avatar
              address={publicKey}
              size="40"
            />
          )}
        </span>
        <div className="flex flex-col">
          {name}
          <div className="small-table-value-text opacity-5">
            {trimMiddle(publicKey, 30)}
            <Button
              className="inline-element"
              icon={<Copy size={20} />}
              onClick={() => copyToClipboard(publicKey)}
            />
          </div>
        </div>
      </span>
    ),
  },
  {
    name: 'Fee',
    minWidth: '80px',
    maxWidth: '150px',
    cell: ({fee}) => (
      <>
        <span className="table-value-text text-start">{fee}</span>
        <span className="opacity-5 medium-table-value-text">%</span>
      </>
    ),
  },
  {
    name: 'Staked',
    minWidth: '150px',
    maxWidth: '350px',
    cell: ({stakedSum}) => (
      <div className="flex gap-2">
        <span className="table-value-text text-start">
          {(+stakedSum)
            .toFixed(0)
            .toString()
            .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}{' '}
        </span>
        <span
          className="opacity-5 medium-table-value-text pl-2"
          style={{lineHeight: '24px'}}
        >
          Mina
        </span>
      </div>
    ),
  },
  {
    name: 'Info',
    hide: 'lg',
    minWidth: '150px',
    maxWidth: '250px',
    cell: ({website}) =>
      website ? (
        <a
          className="purple-hover table-value-text text-start"
          href={`${website}?ref=clorio`}
          target="_blank"
          rel="noreferrer"
        >
          Website
          <ExternalLink
            size={20}
            className="purple-hover "
            style={{marginBottom: '4px', marginLeft: '5px'}}
          />
        </a>
      ) : (
        <span className="table-value-text opacity-5">No info</span>
      ),
  },
  {
    name: '',
    minWidth: '150px',
    maxWidth: '200px',
    cell: row => delegateButton(row, toggleModal, currentDelegate),
    // <span className="table-value-text text-start">Stake now</span>,
  },
];

const delegateButton = (row, toggleModal, currentDelegate) => {
  const isDelegating = row.publicKey === currentDelegate;
  const buttonHandler = !isDelegating ? () => toggleModal(row) : () => null;
  const buttonColor =
    // loading
    // ? 'whiteButton__fullMono no-padding button-small-padding':
    isDelegating ? 'greenButton margin-auto' : '';
  const text = isDelegating ? 'Delegating' : 'Delegate';
  return (
    <Button
      className={`${buttonColor}`}
      text={text}
      style={!buttonColor ? 'primary' : undefined}
      // loading={loading}
      disableAnimation={isDelegating}
      onClick={buttonHandler}
    />
  );
};

export const customStyles = {
  rows: {
    highlightOnHoverStyle: {
      background: 'rgba(255, 255, 255, 0.1)',
    },
    style: {
      background: 'none',
      minHeight: '72px', // override the row height
    },
  },
  headCells: {
    style: {
      background: 'none',
      paddingLeft: '8px', // override the cell padding for head cells
      paddingRight: '8px',
    },
  },
  cells: {
    style: {
      background: 'none',
      paddingLeft: '8px', // override the cell padding for data cells
      paddingRight: '8px',
    },
  },
  table: {
    style: {
      backgroundColor: 'none',
    },
  },
  headRow: {
    style: {
      backgroundColor: 'none',
    },
  },
  pagination: {
    style: {
      backgroundColor: 'none',
      color: 'white',
    },
  },
};
